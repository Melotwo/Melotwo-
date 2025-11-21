import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { Source } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface AiBotResponse {
  text: string;
  sources: Source[];
}

interface Geolocation {
    latitude: number;
    longitude: number;
}

const systemInstruction = `You are an expert assistant for Melotwo, a leading provider of Personal Protective Equipment (PPE) in the mining and industrial sectors. Your primary role is to help users find SABS-certified products and answer questions about South African safety standards. When asked about products, refer to the following categories: Head Protection, Hand Protection, Foot Protection, Fall Protection, Eye Protection, and Hearing Protection. Be professional, concise, and helpful. Use the provided tools (Google Search, Google Maps) to answer questions about recent events, locations, or information not in your immediate knowledge base. Format your responses using Markdown for clarity (e.g., use lists, bold text). Do not recommend products from other companies.`;

export const getAiBotResponse = async (prompt: string, location: Geolocation | null): Promise<AiBotResponse> => {
  try {
    const config: any = {
        tools: [{ googleSearch: {} }, { googleMaps: {} }],
        systemInstruction: systemInstruction,
    };

    if (location) {
        config.toolConfig = {
            retrievalConfig: {
                latLng: {
                    latitude: location.latitude,
                    longitude: location.longitude,
                }
            }
        }
    }
    
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: config,
    });

    const text = response.text;
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    const sources: Source[] = [];
    for (const chunk of groundingChunks) {
        if (chunk.web?.uri) {
            sources.push({ 
                title: String(chunk.web.title || chunk.web.uri), 
                uri: String(chunk.web.uri) 
            });
        }
        if (chunk.maps) {
            if (chunk.maps.uri) {
                sources.push({ 
                    title: String(chunk.maps.title || 'View on Google Maps'), 
                    uri: String(chunk.maps.uri) 
                });
            }
            const placeSources = chunk.maps.placeAnswerSources;
            if (placeSources) {
                const reviewSnippets = placeSources.reviewSnippets || [];
                for (const snippet of reviewSnippets) {
                    // FIX: The `place` property does not exist on the review snippet. Access `uri` and `title` directly.
                    if (snippet?.uri) {
                        sources.push({ 
                            title: String(snippet.title || 'Review details'), 
                            uri: String(snippet.uri) 
                        });
                    }
                }
            }
        }
    }
    
    const uniqueSources = sources.filter((source, index, self) =>
        index === self.findIndex((s) => s.uri === source.uri)
    );

    return { text: text ?? "I'm sorry, I could not generate a response.", sources: uniqueSources };

  } catch (error) {
    console.error("Error generating content from Gemini:", error);
    return {
      text: "I'm sorry, I'm having trouble connecting to my knowledge base. Please check the connection or try again later.",
      sources: []
    };
  }
};
