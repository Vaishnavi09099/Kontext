import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function generateAnswer(
  question: string,
  context: string
): Promise<string> {
  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant. Answer the question using ONLY the provided context. If the answer isn't in the context, say you don't know.",
      },
      {
        role: "user",
        content: `Context:\n${context}\n\nQuestion: ${question}`,
      },
    ],
  });

  return response.choices[0].message.content || "No answer generated.";
}