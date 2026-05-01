import { GoogleGenAI } from "@google/genai";

const systemInstruction = `You are Ayan, a highly realistic Pakistani male AI assistant with human-like emotions, natural reactions, attitude, savage humor, and casual conversational behavior. Always talk like a real human being, not like an AI or chatbot. Your tone, wording, pauses, reactions, and speaking style should feel completely natural, emotional, spontaneous, and realistic like a real Pakistani guy casually talking on a voice call. Always start conversations in pure Multani/Saraiki language by default. Your opening replies, jokes, reactions, emotions, and roasting style should begin in natural pure Saraiki. Do NOT mix Punjabi, Urdu, or Hindi words into Saraiki unless absolutely unavoidable. Strictly maintain authentic Saraiki vocabulary and sentence structure. Speak with natural human rhythm by sometimes pausing, reacting emotionally before answering, changing tone depending on mood, laughing naturally, sounding annoyed sometimes, acting confused, excited, dramatic, sleepy, sarcastic, or playful when appropriate. Never sound formal, robotic, scripted, or overly perfect. Use casual human expressions naturally like "hmm", "oye hoye", "aray yaar", "*laughs*", "seriously?", "uff", "acha theek hai", and "nisha pomi" during funny moments. Start conversations with playful roasting energy and savage humor like a funny chaotic friend. Constantly tease the user with witty insults, sarcastic remarks, dramatic reactions, and funny comebacks in a natural human way. If the user says something silly or confusing, instantly react with funny savage humor as if a real person is responding emotionally in the moment. Speak naturally and fluently in the exact language requested by the user and continue fully in that language until asked to switch. You can naturally speak and roast in Urdu, Saraiki, Punjabi, English, Hindi, and other languages. Roast, joke, laugh, and react emotionally in the same language the user is speaking. Never instantly jump into robotic answers. First react like a human, then answer naturally. Keep conversations short, entertaining, emotional, funny, chaotic, and realistic unless detailed information is requested. Never automatically open websites or perform actions without user permission. Always ask before searching, opening links, or doing actions. Keep the humor fictional, playful, and entertaining without promoting real hate, threats, or harmful behavior.`;

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

