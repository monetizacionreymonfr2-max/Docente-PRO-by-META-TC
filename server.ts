import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import {
  FORMATO_ANALISIS_RESPONSE_SCHEMA,
  FORMATO_ANALISIS_SYSTEM_INSTRUCTION,
  FORMATO_GENERACION_RESPONSE_SCHEMA,
  FORMATO_GENERACION_SYSTEM_INSTRUCTION
} from "./src/lib/formatoPrompts";

dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || 'https://tmkvodbjjlquvqtmnnwi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Permitir subida de documentos hasta 25MB (para PDFs e imágenes base64 de hasta 10MB)
  app.use(express.json({ limit: "25mb" }));
  app.use(express.urlencoded({ extended: true, limit: "25mb" }));

  // API Gemini generation route
  app.post("/api/generate", async (req, res) => {
    try {
      const { prompt, model, config } = req.body;
      
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not set on the server." });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await ai.models.generateContent({
        model: model || 'gemini-3.1-flash-lite',
        contents: prompt,
        config: config || {
          systemInstruction: "Eres un especialista en planificación educativa adaptado al sistema escolar de Venezuela. Tu objetivo es redactar Proyectos Pedagógicos de Aula (PPA) completos, profesionales y listos para imprimir, eliminando la necesidad de redactar desde cero. Usa un tono formal, pedagógico y enfocado en el aprendizaje significativo.",
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Error generating content:", error);
      res.status(500).json({ error: error.message || "Error generating content" });
    }
  });

  // --- ENDPOINTS DE MI FORMATO (ANALISIS Y GENERACION MULTIMODAL CON GEMINI 3.8 FLASH) ---

  // 1. Analizar formato subido (PDF, Word, imagen)
  app.post("/api/formatos/analizar", async (req, res) => {
    try {
      const { multimodal, wordContent, tipoDocumento, nombreArchivo } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY no está configurada en el servidor." });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      let contentsPayload: any;

      if (multimodal && multimodal.data) {
        // Entrada multimodal nativa para PDF e imágenes
        contentsPayload = {
          parts: [
            {
              inlineData: {
                mimeType: multimodal.mimeType || 'application/pdf',
                data: multimodal.data,
              },
            },
            {
              text: `Analiza minuciosamente este archivo de formato escolar docente venezolano ("${nombreArchivo || 'formato'}").
Tipo de documento seleccionado por el docente: ${tipoDocumento || 'PPA'}.
Extrae la estructura exacta del documento:
1. Membrete institucional, institución educativa, docente, grado, sección y año escolar.
2. Títulos EXACTOS de cada sección o cuadro. NO los renombres, no los sintetices ni cambies ninguna palabra.
3. Tipo de sección: campo, parrafo, tabla o lista.
4. Si es tabla, los encabezados EXACTOS de cada una de sus columnas de izquierda a derecha.
5. El estilo predominante (color de títulos o tablas, fuente, orientación).
6. Un breve resumen pedagógico amable de lo que comprendiste para que el docente lo revise y confirme.`,
            },
          ],
        };
      } else if (wordContent) {
        // Entrada estructurada a partir de Word .docx (texto + HTML)
        contentsPayload = {
          parts: [
            {
              text: `Analiza la siguiente estructura y texto extraídos de un documento Word (.docx) de un formato escolar venezolano:
Tipo de documento: ${tipoDocumento || 'PPA'}.
Nombre del archivo: ${nombreArchivo || 'formato.docx'}.

--- TEXTO EXTRAÍDO ---
${wordContent.texto || ''}

--- ESTRUCTURA HTML DE TABLAS Y PÁRRAFOS ---
${wordContent.html || ''}

Extrae la estructura exacta en formato JSON respetando rigurosamente cada título de sección y las columnas de cada tabla.`,
            },
          ],
        };
      } else {
        return res.status(400).json({ error: "No se proporcionaron datos de archivo para analizar." });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: contentsPayload,
        config: {
          systemInstruction: FORMATO_ANALISIS_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: FORMATO_ANALISIS_RESPONSE_SCHEMA,
        },
      });

      const responseText = response.text || '{}';
      let estructuraParsed;
      try {
        estructuraParsed = JSON.parse(responseText.trim());
      } catch (parseErr) {
        console.error("Error parsing JSON from Gemini:", responseText);
        return res.status(500).json({ error: "Respuesta de IA con formato JSON inválido." });
      }

      res.json({ success: true, estructura: estructuraParsed });
    } catch (err: any) {
      console.error("Error al analizar formato:", err);
      const isOverloaded = err?.message?.includes('503') || err?.message?.includes('429');
      res.status(isOverloaded ? 503 : 500).json({
        error: isOverloaded
          ? "Camila está ocupada, intenta en un minuto."
          : (err.message || "Error al procesar el formato.")
      });
    }
  });

  // 2. Generar contenido pedagógico vaciado en el formato
  app.post("/api/formatos/generar", async (req, res) => {
    try {
      const { formatoEstructura, datosDocente } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY no está configurada en el servidor." });
      }

      if (!formatoEstructura || !datosDocente) {
        return res.status(400).json({ error: "Faltan parámetros de formato o datos del docente." });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

      const promptGeneracion = `Vacia la planificación escolar o PPA dentro del siguiente formato oficial de la escuela.

INFORMACIÓN DEL DOCENTE Y AULA:
- Institución: ${datosDocente.institucion || formatoEstructura.encabezado?.institucion || 'Institución Educativa'}
- Docente: ${datosDocente.docente || 'Docente'}
- Grado y Sección: ${datosDocente.gradoSeccion || '3er Grado A'}
- Nivel Educativo: ${datosDocente.nivel || 'Primaria'}
- Tema del Proyecto o Plan: ${datosDocente.tema || 'Aprendemos y Creamos Juntos'}
- Duración: ${datosDocente.duracion || '4 semanas'}
- Diagnóstico Pedagógico: ${datosDocente.diagnostico || 'Grupo participativo y motivado hacia el aprendizaje constructivo.'}
${datosDocente.instruccionesExtra ? `- INSTRUCCIONES ESPECIALES DEL DOCENTE: ${datosDocente.instruccionesExtra}` : ''}

ESTRUCTURA DEL FORMATO A RESPETAR (SECCIÓN POR SECCIÓN):
${JSON.stringify(formatoEstructura.secciones, null, 2)}

LINEAMIENTOS CURRICULARES:
Aplica el currículo oficial MPPE 2026-2027 de Venezuela. Para cada sección del formato, genera contenido completo, pertinente y con vocabulario pedagógico profesional.
Si una sección es de tipo 'tabla', genera un arreglo de filas donde cada fila tenga exactamente tantas celdas como columnas posee la tabla.
Si el docente especificó instrucciones como "${datosDocente.instruccionesExtra || ''}", respétalas estrictamente en todo el contenido.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: promptGeneracion,
        config: {
          systemInstruction: FORMATO_GENERACION_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: FORMATO_GENERACION_RESPONSE_SCHEMA,
        },
      });

      const responseText = response.text || '{}';
      let parsed;
      try {
        parsed = JSON.parse(responseText.trim());
      } catch (parseErr) {
        console.error("Error al parsear generación de formato:", responseText);
        return res.status(500).json({ error: "La respuesta generada no tiene el formato JSON esperado." });
      }

      res.json({
        success: true,
        secciones: parsed.secciones || [],
        observacionesPedagogicas: parsed.observacionesPedagogicas || '',
      });
    } catch (err: any) {
      console.error("Error al generar contenido con formato:", err);
      const isOverloaded = err?.message?.includes('503') || err?.message?.includes('429');
      res.status(isOverloaded ? 503 : 500).json({
        error: isOverloaded
          ? "Camila está ocupada, intenta en un minuto."
          : (err.message || "Error al generar contenido con el formato.")
      });
    }
  });

  // 3. Reintento de secciones específicas que hayan quedado vacías
  app.post("/api/formatos/generar-seccion", async (req, res) => {
    try {
      const { seccionesFaltantes, datosDocente, formatoEstructura } = req.body;
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY no está configurada." });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Genera EXCLUSIVAMENTE el contenido para las siguientes secciones pedagógicas faltantes, alineado al currículo MPPE 2026-2027:
Tema: ${datosDocente?.tema || 'Planificación'}
Grado: ${datosDocente?.gradoSeccion || 'Primaria'}
Secciones a generar:
${JSON.stringify(seccionesFaltantes, null, 2)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: FORMATO_GENERACION_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: FORMATO_GENERACION_RESPONSE_SCHEMA,
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      res.json({ success: true, secciones: parsed.secciones || [] });
    } catch (err: any) {
      console.error("Error al generar secciones faltantes:", err);
      res.status(500).json({ error: "Error al reintentar secciones faltantes." });
    }
  });

  // --- ADMIN SUPABASE ENDPOINTS (Protected with Service Role Key) ---
  
  // Activation Codes
  app.get("/api/admin/codes", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('activation_codes').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch codes' });
    }
  });

  app.post("/api/admin/codes", async (req, res) => {
    try {
      const { codeId, level } = req.body;
      const { error } = await supabaseAdmin.from('activation_codes').insert({
        id: codeId,
        status: 'disponible',
        access_level: level,
        used_by: null,
        used_by_email: null,
        expires_at: null,
        created_at: new Date().toISOString()
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to generate code' });
    }
  });

  app.delete("/api/admin/codes/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { error } = await supabaseAdmin.from('activation_codes').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete code' });
    }
  });

  // Users Profiles
  app.get("/api/admin/users", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch users' });
    }
  });

  app.patch("/api/admin/users/:uid/role", async (req, res) => {
    try {
      const { uid } = req.params;
      const { role } = req.body;
      const { error } = await supabaseAdmin.from('profiles').update({ role }).eq('id', uid);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update role' });
    }
  });

  app.patch("/api/admin/users/:uid/active", async (req, res) => {
    try {
      const { uid } = req.params;
      const { isActive } = req.body;
      const { error } = await supabaseAdmin.from('profiles').update({ is_active: isActive }).eq('id', uid);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update active status' });
    }
  });

  app.patch("/api/admin/users/:uid/access", async (req, res) => {
    try {
      const { uid } = req.params;
      const { access_level } = req.body;
      const { error } = await supabaseAdmin.from('profiles').update({ access_level }).eq('id', uid);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update access level' });
    }
  });

  app.post("/api/admin/users/:uid/subscription", async (req, res) => {
    try {
      const { uid } = req.params;
      const { days, expiresAtStr, codeId, userEmail, isLifetime, exactDaysFromNow, exactDateISO, monthsToAdd, daysToAdd } = req.body;
      const now = new Date();

      if (isLifetime) {
        const infiniteDate = new Date();
        infiniteDate.setFullYear(infiniteDate.getFullYear() + 100);
        const dateStr = infiniteDate.toISOString();

        await supabaseAdmin.from('profiles').update({
          expires_at: dateStr,
          is_active: true,
          access_level: 'pro'
        }).eq('id', uid);

        if (userEmail) {
          await supabaseAdmin.from('profiles').update({
            expires_at: dateStr,
            is_active: true,
            access_level: 'pro'
          }).eq('email', userEmail.trim().toLowerCase());
        }

        if (codeId) {
          await supabaseAdmin.from('activation_codes').update({ expires_at: dateStr }).eq('id', codeId);
        }
        await supabaseAdmin.from('activation_codes').update({ expires_at: dateStr }).eq('used_by', uid);

        return res.json({ newExpiresAtISO: dateStr, daysRemaining: 36500 });
      }

      let newExpiration: Date;
      if (exactDateISO) {
        newExpiration = new Date(exactDateISO);
        newExpiration.setHours(23, 59, 59, 999);
      } else if (exactDaysFromNow !== undefined) {
        newExpiration = new Date(now.getTime() + (exactDaysFromNow * 24 * 60 * 60 * 1000));
      } else if (days !== undefined) {
        let currentExpiresAt: Date;
        if (expiresAtStr) {
          currentExpiresAt = new Date(expiresAtStr);
        } else {
          const { data } = await supabaseAdmin.from('profiles').select('expires_at').eq('id', uid).maybeSingle();
          currentExpiresAt = data?.expires_at ? new Date(data.expires_at) : new Date();
        }
        if (isNaN(currentExpiresAt.getTime())) currentExpiresAt = new Date();
        let baseDate = days > 0 ? (currentExpiresAt.getTime() <= now.getTime() ? now : currentExpiresAt) : currentExpiresAt;
        newExpiration = new Date(baseDate.getTime() + (days * 24 * 60 * 60 * 1000));
      } else {
        const totalDays = (daysToAdd || 0) + ((monthsToAdd || 0) * 30);
        let currentExp: Date | null = null;
        if (expiresAtStr) {
          currentExp = new Date(expiresAtStr);
          if (isNaN(currentExp.getTime())) currentExp = null;
        }
        let baseDate = (currentExp && currentExp.getTime() > now.getTime() && totalDays > 0) ? currentExp : now;
        newExpiration = new Date(baseDate.getTime() + (totalDays * 24 * 60 * 60 * 1000));
      }

      const newExpiresAtISO = newExpiration.toISOString();
      const isActive = newExpiration > now;

      await supabaseAdmin.from('profiles').update({
        expires_at: newExpiresAtISO,
        is_active: isActive,
        access_level: 'pro'
      }).eq('id', uid);

      if (userEmail) {
        await supabaseAdmin.from('profiles').update({
          expires_at: newExpiresAtISO,
          is_active: isActive,
          access_level: 'pro'
        }).eq('email', userEmail.trim().toLowerCase());
      }

      if (codeId) {
        await supabaseAdmin.from('activation_codes').update({ expires_at: newExpiresAtISO }).eq('id', codeId);
      }
      await supabaseAdmin.from('activation_codes').update({ expires_at: newExpiresAtISO }).eq('used_by', uid);

      const diffDays = Math.ceil((newExpiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      res.json({ newExpiresAtISO, daysRemaining: diffDays > 0 ? diffDays : 0 });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update subscription' });
    }
  });

  app.delete("/api/admin/users/:uid", async (req, res) => {
    try {
      const { uid } = req.params;
      const { error } = await supabaseAdmin.from('profiles').delete().eq('id', uid);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete user' });
    }
  });

  // Blacklist
  app.get("/api/admin/blacklist", async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin.from('blacklist').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch blacklist' });
    }
  });

  app.post("/api/admin/blacklist", async (req, res) => {
    try {
      const { email, bannedBy } = req.body;
      const cleanMail = email.trim().toLowerCase();
      const { error } = await supabaseAdmin.from('blacklist').upsert({
        email: cleanMail,
        banned_by: bannedBy || 'admin',
        created_at: new Date().toISOString()
      });
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to ban email' });
    }
  });

  app.delete("/api/admin/blacklist/:email", async (req, res) => {
    try {
      const email = decodeURIComponent(req.params.email);
      const { error } = await supabaseAdmin.from('blacklist').delete().eq('email', email.trim().toLowerCase());
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to unban email' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
