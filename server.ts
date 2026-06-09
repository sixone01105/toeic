import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Set high limits for handling base64 uploaded image data
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Lazy initializer for GoogleGenAI to ensure it doesn't crash on boot if key is missing
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        }
      }
    });
  }
  return aiClient;
}

// API endpoint for server-side Gemini OCR with automatic schema and tags
app.post("/api/ocr", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 data in request body." });
    }

    const ai = getAiClient();
    
    const systemPromptText = `You are an expert multilingual OCR and typography interpreter. 
Analyze the image provided and accurately extract vocabulary words, their parts-of-speech (pos), and traditional Chinese translations (trans).
Then, smart-analyze each word and categorize it into a relevant study category field (category) such as '多益', '商務', '基礎', '生活', '科技', '會話', etc.
All extracted fields must be structured into a standard JSON Array.`;

    const modelsToTry = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-3.5-flash", "gemini-flash-latest"];
    let response = null;
    let lastError: any = null;

    for (const modelName of modelsToTry) {
      let attempts = 3;
      for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
          console.log(`[OCR Server] Attempting analysis with model: ${modelName} (Attempt ${attempt}/${attempts})`);
          response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  mimeType: "image/png",
                  data: imageBase64,
                }
              },
              "Extract all English words, including their part of speech and traditional Chinese meanings. Dynamically assign each word an appropriate category label like '多益470', '會話', '基礎' based on its semantic context."
            ],
            config: {
              systemInstruction: systemPromptText,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                description: "List of vocabulary words automatically parsed from the card image.",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING, description: "Vocabulary word in lowercase" },
                    pos: { type: Type.STRING, description: "Part of speech abbreviated with a trailing dot, e.g. 'n.' or 'v.' or 'adj.' or 'adv.'" },
                    trans: { type: Type.STRING, description: "Translation of the word in Traditional Chinese representable as a string" },
                    category: { type: Type.STRING, description: "Suggested domain or difficulty level category, e.g. '多益' or '基礎' or '科技'" }
                  },
                  required: ["word", "pos", "trans", "category"]
                }
              }
            }
          });
          if (response && response.text) {
            console.log(`[OCR Server] Successfully generated content using ${modelName} on attempt ${attempt}`);
            break; // Break the attempt loop for this model
          }
        } catch (err: any) {
          const errMsg = String(err?.message || "").toLowerCase();
          const errStatus = err?.status || err?.code;
          
          console.warn(`[OCR Server] Model ${modelName} (Attempt ${attempt}/${attempts}) encountered error:`, err?.message || err);
          lastError = err;

          const isOverloaded = errStatus === 503 || errMsg.includes("high demand") || errMsg.includes("unavailable") || errMsg.includes("overloaded");
          if (isOverloaded) {
            console.log(`[OCR Server] Model ${modelName} is experiencing high demand/unavailable. Skipping local retries and attempting immediate fallback...`);
            break; // Break the attempt loop and try the next model immediately
          }

          const isTransient = errStatus === 429 || errMsg.includes("temporary") || errMsg.includes("resource_exhausted") || errMsg.includes("rate limit");
          if (isTransient && attempt < attempts) {
            const delayMs = attempt * 1000;
            console.log(`[OCR Server] Transient rate-limit error detected. Sleeping for ${delayMs}ms before retrying...`);
            await new Promise((resolve) => setTimeout(resolve, delayMs));
          } else {
            // Non-transient error or ran out of attempts, stop retrying this model and move to next model
            break;
          }
        }
      }
      
      if (response && response.text) {
        break; // Successfully got response from this model, stop trying other models
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("All configured Gemini models failed or returned empty content.");
    }

    const jsonText = response.text;
    if (!jsonText) {
      throw new Error("Received an empty or invalid content from the AI model.");
    }

    const parsedResults = JSON.parse(jsonText.trim());
    return res.status(200).json({ results: parsedResults });

  } catch (error: any) {
    console.error("Gemini OCR Server Route Error:", error);
    return res.status(500).json({ error: error?.message || "An internal error occurred during server-side OCR processing." });
  }
});

// Healthy connection check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

async function start() {
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
    console.log(`[VocabMaster Full-Stack] Server listening on http://0.0.0.0:${PORT}`);
  });
}

start();
