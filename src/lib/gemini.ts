import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env";
import { logger } from "../config/logger";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

export interface PrescriptionCheckResult {
  isValid: boolean;
  extractedMedicines: string[];
  matchedItems: string[];
  unmatchedItems: string[];
  confidence: number;
  message: string;
}


/**
 * Analyzes a prescription image URL and checks if ordered medicines are present
 * @param prescriptionImageUrl - URL of the prescription image (from uploadthing)
 * @param orderedMedicineNames - List of medicine names in the order
 */

export async function checkPrescription(
  prescriptionImageUrl: string,
  orderedMedicineNames: string[]
): Promise<PrescriptionCheckResult> {
  try {
    const prompt = `
You are a medical prescription analyzer. Analyze this prescription image and extract all medicine names mentioned.

Then compare them with the following ordered medicines:
${orderedMedicineNames.map((m, i) => `${i + 1}. ${m}`).join("\n")}

Respond ONLY with a valid JSON object in this exact format:
{
  "extractedMedicines": ["medicine1", "medicine2"],
  "matchedItems": ["matched medicine names from order"],
  "unmatchedItems": ["unmatched medicine names from order"],
  "confidence": 0.85,
  "isValid": true,
  "message": "brief explanation"
}

Rules:
- isValid = true if at least 70% of ordered items are found in prescription
- confidence = ratio of matched items (0 to 1)
- Be flexible with medicine name matching (brand vs generic names)
- If image is not a prescription, set isValid to false
`;

    // Fetch image as base64 for Gemini
    const imageResponse = await fetch(prescriptionImageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const mimeType = imageResponse.headers.get("content-type") || "image/jpeg";

    const result = await model.generateContent([
      { inlineData: { data: base64Image, mimeType } },
      prompt,
    ]);

    const text = result.response.text().trim();

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid Gemini response format");

    const parsed = JSON.parse(jsonMatch[0]) as PrescriptionCheckResult;
    logger.info(`Prescription check completed. Valid: ${parsed.isValid}`);
    return parsed;
  } catch (error) {
    logger.error("Gemini prescription check failed:", error);
    // Fail open - return invalid but don't block the order, let admin review
    return {
      isValid: false,
      extractedMedicines: [],
      matchedItems: [],
      unmatchedItems: orderedMedicineNames,
      confidence: 0,
      message: "AI analysis failed. Prescription will be manually reviewed.",
    };
  }
}