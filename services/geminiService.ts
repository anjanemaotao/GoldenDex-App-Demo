import { GoogleGenAI } from "@google/genai";
import { Candle } from "../types";

// Initialize Gemini with the API key from environment variables as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeMarket = async (data: Candle[], currentPrice: number): Promise<string> => {
  // Use the API key directly from process.env.API_KEY.
  if (!process.env.API_KEY) {
    return "AI Analysis Unavailable: API Key missing.";
  }

  const recentCandles = data.slice(-10); // Analyze last 10 candles
  const trendDescription = recentCandles.map(c => 
    `Time: ${c.time}, Open: ${c.open.toFixed(2)}, Close: ${c.close.toFixed(2)}`
  ).join('\n');

  const prompt = `
    Act as a senior financial analyst for Gold (XAU/USD).
    Current Price: ${currentPrice.toFixed(2)}
    
    Recent 15-min candle data:
    ${trendDescription}
    
    Provide a very concise (max 30 words) technical analysis summary and a sentiment (Bullish/Bearish/Neutral) for a scalping trader. 
    Focus on price action. Do not give financial advice, just technical observation.
  `;

  try {
    // Using gemini-3-flash-preview for basic text tasks (summarization/analysis).
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    // The text property on the response object directly returns the string output.
    return response.text || "Analysis complete.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Market analysis temporarily unavailable.";
  }
};