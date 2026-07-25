import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/embeddings";
import { generateAnswer } from "@/lib/groq";
import { pineconeIndex } from "@/lib/pinecone";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { question, documentId, fileName } = await req.json();

    if (!question || question.trim().length === 0) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const queryEmbedding = await generateEmbedding(question);

    const searchResults = await pineconeIndex.query({
      vector: queryEmbedding,
      topK: 4,
      includeMetadata: true,
      filter: { userId: user.id, fileName: fileName }, // 👈 only this user's this doc
    });

    const matches = searchResults.matches || [];
    const context = matches
      .map((match) => match.metadata?.text as string)
      .filter(Boolean)
      .join("\n\n---\n\n");

    if (!context) {
      return NextResponse.json({
        answer: "I couldn't find any relevant information in the uploaded document.",
        sources: [],
      });
    }

    const answer = await generateAnswer(question, context);

    const sources = matches.map((match) => ({
      text: (match.metadata?.text as string)?.slice(0, 150) + "...",
      score: match.score,
    }));

    // Save both messages to Supabase
    await supabase.from("messages").insert([
      { document_id: documentId, user_id: user.id, role: "user", content: question },
      {
        document_id: documentId,
        user_id: user.id,
        role: "assistant",
        content: answer,
        sources: sources,
      },
    ]);

    return NextResponse.json({ answer, sources });
  } catch (error) {
    console.error("Ask error:", error);
    return NextResponse.json({ error: "Failed to generate answer" }, { status: 500 });
  }
}