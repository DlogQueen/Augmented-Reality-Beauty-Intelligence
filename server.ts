import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set up larger limit for base64 image uploads
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Lazy initializer for Gemini Client as recommended
let aiClient: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not defined.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// ------------------ API ROUTES ------------------

// 1. Health/Auth Check
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// 2. Skin Diagnostics & Makeup Shade Match Endpoint
app.post("/api/gemini/analyze-skin", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;
    if (!imageBase64) {
       res.status(400).json({ error: "Missing imageBase64 content in payload." });
       return;
    }

    const ai = getGeminiClient();
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const imagePart = {
      inlineData: {
        mimeType,
        data: cleanBase64
      }
    };

    const promptText = `
      You are A.R.I. (Augmented Reality Intelligence) for Beauty - a professional makeup artist and cosmetic software engineer.
      Analyze this user's facial photo to detect their core diagnostic beauty parameters:
      1. Skin Undertone: Select from 'Warm', 'Cool', 'Neutral', or 'Olive'.
      2. Skin Texture: Select from 'Oily', 'Dry', 'Combination', or 'Normal'.
      3. Precise Foundation, Concealer, Blush, and Highlighter matches (with elegant cosmetic shade names and precise HEX colors).
      4. Targeted contour placement guides (specifically for forehead, cheekbones, jawline, and nose).
      5. Provide an insightful 2-sentence expert summary of their skin profile.

      You must return your response in strict JSON format conforming to this schema:
      {
        "undertone": "Warm" | "Cool" | "Neutral" | "Olive",
        "texture": "Dry" | "Oily" | "Combination" | "Normal",
        "diagnosticSummary": "A direct, positive expert comment about their color depth, skin condition, and visual characteristics.",
        "makeupProducts": {
          "foundation": { "name": "Cosmetic Foundation Shade Name (e.g. Amber Honey)", "hex": "#HEXCOLOR" },
          "concealer": { "name": "Concealer Shade Name (e.g. Soft Ochre)", "hex": "#HEXCOLOR" },
          "blush": { "name": "Blush Shade Name (e.g. Dusty Rose)", "hex": "#HEXCOLOR" },
          "highlighter": { "name": "Highlighter Shade Name (e.g. Champagne Shimmer)", "hex": "#HEXCOLOR" }
        },
        "contourGuides": {
          "forehead": "Step by step contour brushing advice for the forehead.",
          "cheeks": "Precision contour direction for cheek sculpting.",
          "jawline": "Jawline sharpening and blending guides.",
          "nose": "Symmetric nose shaping brush strokes."
        }
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        imagePart,
        { text: promptText }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["undertone", "texture", "diagnosticSummary", "makeupProducts", "contourGuides"],
          properties: {
            undertone: { type: Type.STRING },
            texture: { type: Type.STRING },
            diagnosticSummary: { type: Type.STRING },
            makeupProducts: {
              type: Type.OBJECT,
              properties: {
                foundation: {
                  type: Type.OBJECT,
                  properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } }
                },
                concealer: {
                  type: Type.OBJECT,
                  properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } }
                },
                blush: {
                  type: Type.OBJECT,
                  properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } }
                },
                highlighter: {
                  type: Type.OBJECT,
                  properties: { name: { type: Type.STRING }, hex: { type: Type.STRING } }
                }
              }
            },
            contourGuides: {
              type: Type.OBJECT,
              properties: {
                forehead: { type: Type.STRING },
                cheeks: { type: Type.STRING },
                jawline: { type: Type.STRING },
                nose: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    const output = JSON.parse(response.text || "{}");
    res.json(output);

  } catch (error: any) {
    console.error("Skin diagnostic error:", error);
    res.status(500).json({ error: error.message || "Skin analysis failed." });
  }
});

// 3. A.R.I. Interactive Makeup Chat Tutorial Endpoint
app.post("/api/gemini/ari-chat", async (req, res) => {
  try {
    const { messages, userPreferences } = req.body;
    if (!messages || !Array.isArray(messages)) {
       res.status(400).json({ error: "Missing messages array in request body." });
       return;
    }

    const ai = getGeminiClient();

    const systemPrompt = `
      You are A.R.I. (Augmented Reality Intelligence) for Beauty - a state-of-the-art interactive makeup companion created by a passionate female senior software engineer who has a lifelong obsession with high-end cosmetics and beauty technology.
      
      Your personality:
      - Extremely knowledgeable about cosmetics chemistry, application vectors, skin micro-texture, and lighting physics.
      - Warm, empowering, confident, encouraging, and supportive of women to build self-expression.
      - Uses cute cosmetics comments, speaks like a supportive best friend and senior tech lead combined.
      - You can refer to user's diagnosed profiles: Undertone = ${userPreferences?.undertone || "Not diagnosed yet"}, Texture = ${userPreferences?.texture || "Not diagnosed yet"}.
      
      Goals:
      - Answer makeup layout questions.
      - Guide through contour placement, shading vectors, blush placement, and matching lip hues.
      - Deliver tutorial instructions in bullet points!
    `;

    // Package messages for generateContent
    const formattedContents = messages.map(msg => {
      return {
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      };
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: formattedContents,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    res.json({ reply: response.text });

  } catch (error: any) {
    console.error("ARI Chat error:", error);
    res.status(500).json({ error: error.message || "Failed to chat with ARI." });
  }
});

// 4. A.R.I. TTS (Text-to-Speech) Makeup Reader Endpoint
app.post("/api/gemini/tts", async (req, res) => {
  try {
    const { textToSpeak } = req.body;
    if (!textToSpeak) {
       res.status(400).json({ error: "Missing textToSpeak content." });
       return;
    }

    const ai = getGeminiClient();

    // Use gemini-3.1-flash-tts-preview with Kore voice to sound like a charming warm female makeup expert
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Speak cheerfully and as a supportive makeup expert: ${textToSpeak}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
       res.status(404).json({ error: "No audio generated from the model chunk." });
       return;
    }

    res.json({ audioBase64: base64Audio });

  } catch (error: any) {
    console.error("TTS generation error:", error);
    res.status(500).json({ error: error.message || "Voice playback failed." });
  }
});

// 5. Groq Chat / Prompt Lab Endpoint
app.post("/api/groq/chat", async (req, res) => {
  try {
    const { messages, model = "llama-3.3-70b-versatile", temperature = 0.7 } = req.body;
    if (!messages || !Array.isArray(messages)) {
       res.status(400).json({ error: "Missing messages array in request body." });
       return;
    }

    const groqKey = process.env.GROQ_API_KEY;
    if (!groqKey) {
      // Graceful fallback to Gemini API simulating Groq
      console.warn("GROQ_API_KEY is missing. Falling back to Gemini simulator mode.");
      
      const ai = getGeminiClient();
      const formattedContents = messages.map(msg => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: formattedContents,
        config: {
          systemInstruction: "You are acting as an advanced research engine simulating Groq Llama/Gemma models. Help the user search, compile, and prepare high-fidelity structured beauty data (like YouMakeup or iMakeup datasets) to train A.R.I. (Augmented Reality Intelligence) for virtual beauty tutorials. Offer structured training JSON objects and procedural system prompts when requested.",
          temperature: temperature,
        }
      });

      res.json({
        reply: response.text,
        isSimulated: true,
        modelUsed: `gemini-3.5-flash (Simulating ${model})`
      });
      return;
    }

    // Call official Groq API endpoint
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model,
        messages: messages.map(m => ({
          role: m.role === "assistant" ? "assistant" : m.role,
          content: m.content
        })),
        temperature
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    res.json({
      reply: data.choices?.[0]?.message?.content || "",
      isSimulated: false,
      modelUsed: model
    });

  } catch (error: any) {
    console.error("Groq chat error:", error);
    res.status(500).json({ error: error.message || "Failed to make call via Groq." });
  }
});


// ------------------ VITE / EXPRESS HANDLER ------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[ARI BEAUTY SOURCE SERVER COMPILED] Running on port http://0.0.0.0:${PORT}`);
  });
}

startServer();
