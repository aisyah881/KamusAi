
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });

export async function translateAndAnnotate(word: string): Promise<AIResponse> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Terjemahkan kata atau frasa Bahasa Inggris "${word}" ke Bahasa Indonesia. 
      Berikan juga keterangan singkat berupa contoh kalimat sederhana atau sinonimnya dalam Bahasa Indonesia.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            translation: {
              type: Type.STRING,
              description: "Terjemahan kata ke Bahasa Indonesia."
            },
            note: {
              type: Type.STRING,
              description: "Keterangan singkat atau contoh penggunaan dalam Bahasa Indonesia."
            }
          },
          required: ["translation", "note"]
        }
      }
    });

    const result = JSON.parse(response.text);
    return {
      translation: result.translation || "Tidak ditemukan",
      note: result.note || "Tidak ada keterangan."
    };
  } catch (error) {
    console.error("AI Error:", error);
    return {
      translation: "Error",
      note: "Gagal memuat terjemahan. Periksa koneksi internet Anda."
    };
  }
}
