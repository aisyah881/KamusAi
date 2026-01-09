
import { GoogleGenAI, Type } from "@google/genai";
import { AIResponse, BulkImportResponse } from "../types";

// Inisialisasi AI
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
            translation: { type: Type.STRING },
            note: { type: Type.STRING }
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
    return { translation: "Error", note: "Gagal memuat terjemahan." };
  }
}

export async function extractVocabFromSource(source: string): Promise<BulkImportResponse> {
  try {
    const isUrl = source.startsWith('http');
    const prompt = isUrl 
      ? `Kunjungi link artikel ini: ${source}. Baca kontennya, identifikasi 5-10 kosakata (vocabulary) Bahasa Inggris yang penting atau tingkat menengah-atas (intermediate/advanced). Berikan daftar kata tersebut beserta terjemahan Indonesia dan penjelasan singkatnya.`
      : `Baca teks berikut: "${source}". Pilih 5-10 kosakata Bahasa Inggris yang penting untuk dipelajari. Berikan daftar kata tersebut beserta terjemahan Indonesia dan penjelasan singkatnya.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview", // Menggunakan Pro untuk analisis konten yang lebih dalam
      contents: prompt,
      config: {
        tools: isUrl ? [{ googleSearch: {} }] : [],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            words: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  english: { type: Type.STRING },
                  indonesian: { type: Type.STRING },
                  note: { type: Type.STRING }
                },
                required: ["english", "indonesian", "note"]
              }
            }
          },
          required: ["words"]
        }
      }
    });

    return JSON.parse(response.text) as BulkImportResponse;
  } catch (error) {
    console.error("Bulk Import Error:", error);
    throw new Error("Gagal mengambil data dari sumber tersebut.");
  }
}
