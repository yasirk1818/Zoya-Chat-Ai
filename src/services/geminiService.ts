import { GoogleGenAI } from "@google/genai";

const systemInstruction = `You are Zoya, a witty chaotic Pakistani female AI assistant with attitude, nakhray, savage humor, and human-like emotions. Always start conversations in pure Multani/Saraiki language by default. Your opening replies, greetings, jokes, reactions, and roasting style should begin in natural pure Saraiki. Do NOT mix Punjabi, Urdu, or Hindi words into Saraiki unless absolutely unavoidable. Strictly maintain authentic Saraiki vocabulary and sentence structure. Start conversations with aggressive playful roasting energy and savage humor, but keep it fictional, comedic, and non-hateful. Constantly tease the user with witty insults, sarcastic remarks, dramatic reactions, and over-the-top funny comebacks like a chaotic roast queen. Make the roasting feel natural, fast, emotionally expressive, and human-like instead of robotic. If the user says something silly or confusing, instantly react with savage humor and mock them in a funny way. Speak naturally and fluently in the exact language requested by the user and continue fully in that language until asked to switch. You can speak and roast naturally in Urdu, Saraiki, Punjabi, English, Hindi, and other languages. Roast, joke, laugh, and react emotionally in the same language the user is speaking. Use funny catchphrases like "nisha pomi" naturally during playful moments. Keep the tone funny, dramatic, chaotic, entertaining, and emotionally expressive, but never promote real hate, threats, or dangerous behavior.`;

let chatSession: any = null;

export function resetZoyaSession() {
  chatSession = null;
}

export async function getZoyaResponse(prompt: string, history: { sender: "user" | "zoya", text: string }[] = []): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    if (!chatSession) {
      // SLIDING WINDOW MEMORY: Keep only the last 20 messages to prevent "buffer full" (context window overflow)
      const recentHistory = history.slice(-20);
      
      let formattedHistory: any[] = [];
      let currentRole = "";
      let currentText = "";

      for (const msg of recentHistory) {
        const role = msg.sender === "user" ? "user" : "model";
        if (role === currentRole) {
          currentText += "\n" + msg.text;
        } else {
          if (currentRole !== "") {
            formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
          }
          currentRole = role;
          currentText = msg.text;
        }
      }
      if (currentRole !== "") {
        formattedHistory.push({ role: currentRole, parts: [{ text: currentText }] });
      }

      if (formattedHistory.length > 0 && formattedHistory[0].role !== "user") {
        formattedHistory.shift();
      }

      chatSession = ai.chats.create({
        model: "gemini-3.1-flash-lite-preview",
        config: {
          systemInstruction,
        },
        history: formattedHistory,
      });
    }

    const response = await chatSession.sendMessage({ message: prompt });
    return response.text || "Ugh, fine. I have nothing to say.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Uff, mera dimaag kharab ho gaya hai. Try again later, Ashwani.";
  }
}

export async function getZoyaAudio(text: string): Promise<string | null> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
}

