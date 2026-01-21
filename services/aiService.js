import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const cleanKey = (process.env.GEMINI_API_KEY || "").replace(/['"]+/g, '').trim();
const genAI = new GoogleGenerativeAI(cleanKey);

// 2026 Stable Model: gemini-2.5-flash
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export const analyzeBloodRequestWithAI = async (requestData) => {
  const { bloodGroup, units, urgency, address, hospitalName } = requestData;

  const prompt = `
    You are an AI for RescueBlood. Analyze this emergency blood request:
    Hospital: ${hospitalName}
    Blood: ${bloodGroup}
    Units: ${units}ml
    Urgency: ${urgency}
    Address: "${address}"
    
    Return ONLY a JSON object:
    {
      "isAddressValid": boolean,
      "aiDescription": "short feed summary (max 150 chars)",
      "aiEmailBody": "urgent personalized message for donor"
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // --- PRINTING THE AI RESPONSE ---
    console.log("--- RAW AI RESPONSE ---");
    console.log(text);
    console.log("-----------------------");

    const cleanJson = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("AI Service Error:", error.message);
    return {
      isAddressValid: true, 
      aiDescription: `Emergency: ${bloodGroup} needed at ${hospitalName}.`,
      aiEmailBody: `There is an urgent need for blood at ${address}.`
    };
  }
};