import { GoogleGenAI, Type } from "@google/genai";

export const aiService = {
  enhanceMediaMetadata: async (title: string, type: string) => {
    try {
      const apiKey = process.env.API_KEY;
      if (!apiKey) {
        console.warn("Synthesis Engine: No API_KEY environment variable detected.");
        return null;
      }

      // Initialize right before call to ensure fresh configuration
      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Identify verified production metadata for the ${type} titled "${title}". Return a rigorous JSON object matching the schema. Verified real-world data is prioritized.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Full verified production title" },
              description: { type: Type.STRING, description: "Professional synopsis" },
              genre: { type: Type.STRING, description: "Comma-separated genres" },
              rating: { type: Type.NUMBER, description: "Official TMDB/IMDB rating" },
              year: { type: Type.NUMBER, description: "Year of theatrical release" },
              posterUrl: { type: Type.STRING, description: "Direct high-res poster link" },
              backdropUrl: { type: Type.STRING, description: "Direct high-res landscape backdrop link" }
            },
            required: ["title", "description", "genre", "rating", "year"]
          }
        }
      });
      
      const text = response.text;
      if (!text) return null;
      
      return JSON.parse(text.trim());
    } catch (error) {
      console.error("Content Synthesis failed:", error);
      return null;
    }
  }
};