
import { GoogleGenAI, Type } from "@google/genai";

export const aiService = {
  enhanceMediaMetadata: async (title: string, type: string) => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Search for the official TMDB (The Movie Database) entry for the ${type} titled "${title}". 
        Retrieve the following verified real-world metadata:
        1. Official full title
        2. Professional overview/synopsis
        3. Genres (comma separated)
        4. Official TMDB user rating (out of 10)
        5. Release year
        6. A valid high-resolution poster image URL (from image.tmdb.org or similar)
        7. A valid high-resolution wide backdrop/landscape image URL.
        
        Ensure the data is accurate for the real title if it exists.`,
        config: {
          tools: [{ googleSearch: {} }],
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
      
      const text = response.text;
      if (!text) return null;
      
      // Handle potential extra formatting from AI
      const jsonStr = text.replace(/```json|```/g, "").trim();
      return JSON.parse(jsonStr);
    } catch (error) {
      console.error("TMDB Fetch failed:", error);
      return null;
    }
  }
};
