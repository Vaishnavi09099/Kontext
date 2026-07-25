import { NextRequest, NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { chunkText } from "@/lib/chunk";
import { generateEmbedding } from "@/lib/embeddings";
import { pineconeIndex } from "@/lib/pinecone";
import { createServerSupabase } from "@/lib/supabase-server";
import type { RecordMetadata } from "@pinecone-database/pinecone";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files allowed" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const parser = new PDFParse({ data: buffer });
    const parsed = await parser.getText();
    await parser.destroy();

    const fullText = parsed.text;
    if (!fullText || fullText.trim().length === 0) {
      return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 });
    }

    const chunks = chunkText(fullText, 500, 50);

    const vectors: { id: string; values: number[]; metadata: RecordMetadata }[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const embedding = await generateEmbedding(chunks[i]);
      vectors.push({
        id: `chunk-${user.id}-${Date.now()}-${i}`,
        values: embedding,
        metadata: {
          text: chunks[i],
          fileName: file.name,
          userId: user.id, // 👈 tag each chunk with the user
        },
      });
    }

    await pineconeIndex.upsert({ records: vectors });

    // Save document record in Supabase
    const { data: docData, error: dbError } = await supabase
      .from("documents")
      .insert({
        user_id: user.id,
        file_name: file.name,
        file_size: (file.size / 1024).toFixed(1) + " KB",
        chunk_count: chunks.length,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB insert error:", dbError);
      return NextResponse.json({ error: "Failed to save document record" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${chunks.length} chunks from ${file.name}`,
      chunkCount: chunks.length,
      documentId: docData.id,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Failed to process PDF" }, { status: 500 });
  }
}