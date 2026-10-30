import type { LiveConnectConfig, Session } from '@google/genai';
import { supabase } from '../supabase';

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
  private audioEnCola: AudioBufferSourceNode[] = [];
  private siguienteAudio = 0;
  private temporizador: number | null = null;
  private textoUsuario = '';
  private textoCamila = '';

  constructor(private readonly eventos: EventosVozCamila) {}

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
      this.entrada = new AudioContext({ sampleRate: 16000 });
      this.origen = this.entrada.createMediaStreamSource(this.microfono);
      this.procesador = this.entrada.createScriptProcessor(2048, 1, 1);
      this.procesador.onaudioprocess = (evento) => {
        if (this.cerrada || !this.sesion) return;
        const pcm = codificarPCM(evento.inputBuffer.getChannelData(0));
        this.sesion.sendRealtimeInput({ audio: { data: pcm, mimeType: 'audio/pcm;rate=16000' } });
      };
      this.origen.connect(this.procesador);
      this.procesador.connect(this.entrada.destination);
      await this.entrada.resume();
      if (this.cerrada) return;
      this.conectada = true;
      this.temporizador = window.setTimeout(() => this.detener(), Math.min(180, credencial.duracionSegundos) * 1000);
      this.eventos.alConectar();
    } catch (error) {
      if (!this.cerrada) {
        const codigo = error instanceof Error ? error.message : '';
        const tipo = error instanceof Error ? error.name : '';
        const mensaje = codigo === 'MICROFONO_NO_DISPONIBLE' ? 'Este navegador no permite usar el micrófono.' :
          codigo === 'SESION_REQUERIDA' ? 'Inicia sesión para hablar con Camila.' :
          tipo === 'NotAllowedError' ? 'Debes permitir el acceso al micrófono.' :
          /^(La conversación por voz requiere|No se pudo iniciar Camila por voz|No se pudo abrir la conversación por voz|Espera unos segundos)/.test(codigo)
            ? codigo : 'No se pudo iniciar la voz de Camila. Inténtalo nuevamente.';
        this.eventos.alError(mensaje);
        this.detener();
      }
    }
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
    this.cerrada = true;
    if (this.temporizador !== null) window.clearTimeout(this.temporizador);
    this.procesador && (this.procesador.onaudioprocess = null);
    try { this.procesador?.disconnect(); } catch { /* ya cerrado */ }
    try { this.origen?.disconnect(); } catch { /* ya cerrado */ }
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
}
