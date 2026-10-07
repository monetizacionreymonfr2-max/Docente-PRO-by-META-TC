import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabaseAdmin = createClient(
  process.env.VITE_SUPABASE_URL || 'https://tmkvodbjjlquvqtmnnwi.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
