
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { TranslationResult } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
};

export const translateText = async (
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<TranslationResult> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate the following text from ${sourceLang === 'auto' ? 'automatically detected language' : sourceLang} to ${targetLang}. 
    Provide the response in JSON format.
    Text: "${text}"`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          translatedText: { type: Type.STRING },
          detectedLanguage: { type: Type.STRING },
          transliteration: { type: Type.STRING, description: 'Phonetic reading if the script is different from source' },
          contextNotes: { type: Type.STRING, description: 'Brief note on nuances if any' }
        },
        required: ["translatedText"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}') as TranslationResult;
  } catch (e) {
    return { translatedText: response.text || 'Translation failed.' };
  }
};

export const translateImage = async (
  base64Image: string,
  targetLang: string
): Promise<TranslationResult> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
        { text: `Extract all text from this image and translate it to ${targetLang}. Return the result in JSON format.` }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          translatedText: { type: Type.STRING },
          detectedLanguage: { type: Type.STRING },
          contextNotes: { type: Type.STRING }
        },
        required: ["translatedText"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}') as TranslationResult;
  } catch (e) {
    return { translatedText: response.text || 'Image translation failed.' };
  }
};

export const generateSpeech = async (text: string, languageName: string): Promise<Uint8Array | null> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Speak this text in a natural ${languageName} accent: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) return null;

  return decodeBase64(base64Audio);
};

// Utils for audio decoding
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function playPCM(data: Uint8Array, sampleRate: number = 24000) {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(ctx.destination);
  source.start();
}
