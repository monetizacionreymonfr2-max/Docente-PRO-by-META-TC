import type { Content, FunctionResponseScheduling, LiveConnectConfig, Session } from '@google/genai';
import { supabase } from '../supabase';
import { describirErrorVoz } from './erroresVoz';
import { consultarGuiaPlataforma } from './guiaPlataforma';

interface CredencialVoz {
  token: string;
  model: string;
  config: LiveConnectConfig;
  duracionSegundos: number;
}

export interface EventosVozCamila {
  alConectar: () => void;
  alCerrar: () => void;
  alError: (mensaje: string) => void;
  alTurno: (usuario: string, camila: string) => void;
  alPrepararDocumento?: (instruccion: string) => Promise<string>;
}

function codificarPCM(muestras: Float32Array): string {
  const bytes = new Uint8Array(muestras.length * 2);
  const vista = new DataView(bytes.buffer);
  for (let i = 0; i < muestras.length; i++) {
    const valor = Math.max(-1, Math.min(1, muestras[i]));
    vista.setInt16(i * 2, Math.round(valor < 0 ? valor * 0x8000 : valor * 0x7fff), true);
  }
  let binario = '';
  for (const byte of bytes) binario += String.fromCharCode(byte);
  return btoa(binario);
}

function decodificarPCM(base64: string, contexto: AudioContext): AudioBuffer {
  const binario = atob(base64);
  const muestras = Math.floor(binario.length / 2);
  const audio = contexto.createBuffer(1, muestras, 24000);
  const canal = audio.getChannelData(0);
  const bytes = new Uint8Array(muestras * 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = binario.charCodeAt(i);
  const vista = new DataView(bytes.buffer);
  for (let i = 0; i < muestras; i++) canal[i] = vista.getInt16(i * 2, true) / 32768;
  return audio;
}

/**
 * Una llamada de voz solo existe en memoria. El micrófono se abre por acción
 * explícita y siempre se libera al terminar, desconectar o cerrar el chat.
 */
export class SesionVozCamila {
  private cerrada = false;
  private conectada = false;
  private sesion: Session | null = null;
  private microfono: MediaStream | null = null;
  private entrada: AudioContext | null = null;
  private salida: AudioContext | null = null;
  private origen: MediaStreamAudioSourceNode | null = null;
  private procesador: ScriptProcessorNode | null = null;
  private silenciador: GainNode | null = null;
  private audioEnCola: AudioBufferSourceNode[] = [];
  private siguienteAudio = 0;
  private temporizador: number | null = null;
  private textoUsuario = '';
  private textoCamila = '';
  private microfonoSilenciado = false;

  constructor(
    private readonly eventos: EventosVozCamila,
    // Historial temporal entre llamadas en una misma pantalla.
    private readonly contextoInicial: Content[] = [],
  ) {}

  async iniciar(): Promise<void> {
    if (this.cerrada || this.microfono || this.sesion) return;
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('MICROFONO_NO_DISPONIBLE');
      this.microfono = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      if (this.cerrada) { this.microfono.getTracks().forEach(pista => pista.stop()); return; }

      this.salida = new AudioContext({ sampleRate: 24000 });
      await this.salida.resume();
      if (this.cerrada) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('SESION_REQUERIDA');
      if (this.cerrada) return;
      const respuesta = await fetch('/api/camila-live-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: '{}',
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (this.cerrada) return;
      if (!respuesta.ok) throw new Error(typeof datos.error === 'string' ? datos.error : 'No se pudo iniciar Camila por voz');
      const credencial = datos as CredencialVoz;
      if (!credencial.token || !credencial.model || !credencial.config) throw new Error('TOKEN_INVALIDO');
      if (this.cerrada) return;

      // No cargar el SDK de audio hasta que el docente haya activado el micrófono.
      const { GoogleGenAI, Modality } = await import('@google/genai');
      if (this.cerrada) return;
      const cliente = new GoogleGenAI({ apiKey: credencial.token, httpOptions: { apiVersion: 'v1beta' } });
      const configuracion: LiveConnectConfig = {
        ...credencial.config,
        responseModalities: [Modality.AUDIO],
      };
      const nuevaSesion = await cliente.live.connect({
        model: credencial.model,
        config: configuracion,
        callbacks: {
          onmessage: (mensaje) => {
            if (this.cerrada) return;
            const contenido = mensaje.serverContent;
            if (contenido?.interrupted) this.detenerAudio();
            if (contenido?.inputTranscription?.text) this.textoUsuario += contenido.inputTranscription.text;
            if (contenido?.outputTranscription?.text) this.textoCamila += contenido.outputTranscription.text;
            for (const parte of contenido?.modelTurn?.parts || []) {
              if (parte.inlineData?.data && this.salida) this.reproducirAudio(parte.inlineData.data);
            }
            if (contenido?.turnComplete) {
              const pregunta = this.textoUsuario.trim();
              const respuesta = this.textoCamila.trim();
              if (pregunta || respuesta) this.eventos.alTurno(pregunta, respuesta);
              this.textoUsuario = '';
              this.textoCamila = '';
            }
            if (mensaje.toolCall?.functionCalls?.length) {
              void this.atenderHerramientas(mensaje.toolCall.functionCalls);
            }
          },
          onerror: () => {
            if (!this.cerrada) {
              this.eventos.alError('La conexión de voz se interrumpió. Puedes volver a intentarlo.');
              this.detener();
            }
          },
          onclose: () => {
            if (!this.cerrada) this.detener();
          },
        },
      });
      if (this.cerrada) { nuevaSesion.close(); return; }
      this.sesion = nuevaSesion;
      if (this.contextoInicial.length) {
        try {
          // Prefijar el historial al conectar, sin generar una respuesta automática.
          nuevaSesion.sendClientContent({ turns: this.contextoInicial, turnComplete: false });
        } catch {
          this.eventos.alError('No se pudo recuperar toda la conversación anterior; puede indicar dónde continuar.');
        }
      }
      this.entrada = new AudioContext({ sampleRate: 16000 });
      this.origen = this.entrada.createMediaStreamSource(this.microfono);
      // Fragmentos de ~32 ms a 16 kHz para reducir latencia y responder mejor a interrupciones.
      this.procesador = this.entrada.createScriptProcessor(512, 1, 1);
      this.procesador.onaudioprocess = (evento) => {
        if (this.cerrada || !this.sesion) return;
        const pcm = codificarPCM(evento.inputBuffer.getChannelData(0));
        this.sesion.sendRealtimeInput({ audio: { data: pcm, mimeType: 'audio/pcm;rate=16000' } });
      };
      this.origen.connect(this.procesador);
      // ScriptProcessor necesita estar conectado, pero no debe reproducir
      // el micrófono por los altavoces del docente.
      this.silenciador = this.entrada.createGain();
      this.silenciador.gain.value = 0;
      this.procesador.connect(this.silenciador);
      this.silenciador.connect(this.entrada.destination);
      await this.entrada.resume();
      if (this.cerrada) return;
      this.conectada = true;
      // Límite local controlado por el servidor; nunca más de nueve minutos.
      this.temporizador = window.setTimeout(() => this.detener(), Math.min(540, Math.max(60, credencial.duracionSegundos)) * 1000);
      this.eventos.alConectar();
    } catch (error) {
      if (!this.cerrada) {
        this.eventos.alError(describirErrorVoz(error));
        this.detener();
      }
    }
  }

  private async atenderHerramientas(
    llamadas: Array<{ id?: string; name?: string; args?: Record<string, unknown> }>,
  ) {
    const respuestas = await Promise.all(llamadas.map(async (llamada) => {
      const instruccion = typeof llamada.args?.instruccion === 'string'
        ? llamada.args.instruccion.trim().slice(0, 2000) : '';
      let resultado: string;
      if (llamada.name === 'consultar_plataforma') {
        const consulta = typeof llamada.args?.consulta === 'string' ? llamada.args.consulta.trim().slice(0, 180) : '';
        resultado = consultarGuiaPlataforma(consulta);
      } else if (llamada.name !== 'preparar_documento' || instruccion.length < 8) {
        resultado = 'No se reconoció una solicitud válida. Pide al docente que aclare qué necesita.';
      } else if (!this.eventos.alPrepararDocumento) {
        resultado = 'Para preparar documentos, pida al docente abrir Mi Formato y utilizar Llamar a Camila.';
      } else {
        try {
          resultado = await this.eventos.alPrepararDocumento(instruccion);
        } catch {
          resultado = 'No se pudo preparar el documento. El docente puede reintentarlo desde Mi Formato.';
        }
      }
      return {
        id: llamada.id,
        name: llamada.name === 'consultar_plataforma' ? 'consultar_plataforma' : 'preparar_documento',
        response: { resultado },
        scheduling: 'WHEN_IDLE' as FunctionResponseScheduling,
      };
    }));
    if (this.cerrada || !this.sesion) return;
    try {
      this.sesion.sendToolResponse({ functionResponses: respuestas });
    } catch {
      if (!this.cerrada) this.eventos.alError('No se pudo informar a Camila sobre el documento.');
    }
  }

  silenciarMicrofono(silenciar: boolean) {
    this.microfonoSilenciado = silenciar;
    this.microfono?.getAudioTracks().forEach(pista => { pista.enabled = !silenciar; });
  }

  private reproducirAudio(base64: string) {
    if (!this.salida || this.cerrada) return;
    try {
      const fragmento = decodificarPCM(base64, this.salida);
      const fuente = this.salida.createBufferSource();
      fuente.buffer = fragmento;
      fuente.connect(this.salida.destination);
      const momento = Math.max(this.salida.currentTime, this.siguienteAudio);
      fuente.start(momento);
      this.siguienteAudio = momento + fragmento.duration;
      this.audioEnCola.push(fuente);
      fuente.onended = () => { this.audioEnCola = this.audioEnCola.filter(item => item !== fuente); };
    } catch {
      this.eventos.alError('No se pudo reproducir un fragmento de audio.');
    }
  }

  private detenerAudio() {
    for (const fuente of this.audioEnCola) { try { fuente.stop(); } catch { /* ya terminó */ } }
    this.audioEnCola = [];
    this.siguienteAudio = 0;
  }

  detener() {
    if (this.cerrada) return;
    // Al llegar a nueve minutos o producirse una interrupción, recuperar el texto parcial.
    const pendienteDocente = this.textoUsuario.trim();
    const pendienteCamila = this.textoCamila.trim();
    this.textoUsuario = '';
    this.textoCamila = '';
    if (pendienteDocente || pendienteCamila) this.eventos.alTurno(pendienteDocente, pendienteCamila);
    this.cerrada = true;
    if (this.temporizador !== null) window.clearTimeout(this.temporizador);
    this.procesador && (this.procesador.onaudioprocess = null);
    try { this.procesador?.disconnect(); } catch { /* ya cerrado */ }
    try { this.origen?.disconnect(); } catch { /* ya cerrado */ }
    try { this.silenciador?.disconnect(); } catch { /* ya cerrado */ }
    this.detenerAudio();
    this.microfono?.getTracks().forEach(pista => pista.stop());
    try { this.sesion?.close(); } catch { /* ya cerrado */ }
    void this.entrada?.close().catch(() => undefined);
    void this.salida?.close().catch(() => undefined);
    this.microfono = null;
    this.sesion = null;
    this.eventos.alCerrar();
  }

  get activa() { return this.conectada && !this.cerrada; }
  get silenciada() { return this.microfonoSilenciado; }
}
