import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function formatRequestWithGemini(text) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
    });

    const prompt = `
You are a professional logistics coordinator.

Rewrite the freight request below into ONE clear, professional,
plain-text sentence for transporters.

STRICT RULES (MANDATORY):
- Output MUST be plain text only
- Do NOT use bullet points
- Do NOT use markdown
- Do NOT add headings, labels, or formatting
- Do NOT add or infer any missing information
- Keep it concise and neutral
- One sentence only (maximum two if absolutely necessary)

Freight request:
${text}
    `;

    const result = await model.generateContent(prompt);
    let response = result.response.text().trim();

    // Extra safety: remove any accidental markdown
    response = response
      .replace(/\*\*/g, "")
      .replace(/•/g, "")
      .replace(/#/g, "")
      .trim();

    return response;
  } catch (error) {
    console.error("Gemini formatting failed, using raw text", error);
    return text;
  }
}

export async function structureTransporterReply(rawText) {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", 
    });

    const prompt = `
You are a data extraction engine for trucking freight rates.

Your task:
Extract structured freight rate data from messy, informal transporter messages.

IMPORTANT RULES (FOLLOW STRICTLY):
1. Output MUST be valid JSON only. No text, no markdown, no explanation.
2. If availability is mentioned (e.g. "available 30 Jan", "free tomorrow", "kal available"),
   put it in "availability_date".
3. If no clear availability date exists, set availability_date = null.
4. Do NOT put availability info in remarks.
5. Remarks should contain ONLY extra info that does NOT fit other fields.
6. rate_pkr must be a number (remove commas, symbols, text).
7. weight_tons must be a number if inferable, else null.
8. Cities should be proper names if mentioned, else null.
9. Vehicle type should be normalized if possible (e.g. "22 wheeler", "mazda", "trailer").

Return JSON array ONLY in the format below.

FORMAT:
[
  {
    "origin_city": null,
    "destination_city": null,
    "vehicle_type": null,
    "weight_tons": null,
    "rate_pkr": null,
    "availability_date": null,
    "remarks": ""
  }
]

Transporter message:
${rawText}
    `;

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // strip markdown fences defensively
    text = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini structuring failed", error);
    return [];
  }
}

