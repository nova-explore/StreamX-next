
import { GoogleGenAI, Type } from "@google/genai";

export const aiService = {
  enhanceMediaMetadata: async (title: string, type: string) => {
    try {
      // Fix: Always initialize with named parameter object.
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Fix: Use 'gemini-3-pro-preview' for complex text tasks requiring detailed reasoning and structure.
      // Removed googleSearch because "The output response.text may not be in JSON format; do not attempt to parse it as JSON" when using it.
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Identify the official TMDB (The Movie Database) metadata for the ${type} titled "${title}". 
        Provide the following verified real-world fields:
        1. Official full title
        2. Professional overview/synopsis
        3. Genres (comma separated)
        4. Official TMDB user rating (out of 10)
        5. Release year
        6. A direct high-quality URL for the poster image
        7. A direct high-quality URL for the backdrop image`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Official TMDB title" },
              description: { type: Type.STRING, description: "Plot overview" },
              genre: { type: Type.STRING, description: "Genres" },
              rating: { type: Type.NUMBER, description: "TMDB rating" },
              year: { type: Type.NUMBER, description: "Release year" },
              posterUrl: { type: Type.STRING, description: "Direct URL to poster image" },
              backdropUrl: { type: Type.STRING, description: "Direct URL to backdrop image" }
            },
            required: ["title", "description", "genre", "rating", "year"]
          }
        }
      });
      
      // Fix: response.text is a property, not a method.
      const text = response.text;
      if (!text) return null;
      
      // Clean potential markdown blocks if present and parse.
      const jsonStr = text.replace(/```json|```/g, "").trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("TMDB Enhancement failed:", error);
      return null;
    }
  }
};
