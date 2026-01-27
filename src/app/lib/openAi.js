import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function formatRequestWithAI(text) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "Rewrite the freight request into a clear, professional message for transporters. Do not add extra info.",
      },
      {
        role: "user",
        content: text,
      },
    ],
  });

  return response.choices[0].message.content;
}
