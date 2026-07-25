"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import Image from "next/image";
import { Plus, Sparkles, ChevronUp, ChevronDown, BookOpen, Send, FileText } from "lucide-react";

interface Source {
  text: string;
  score?: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
}

interface DocEntry {
  id: string;
  file_name: string;
  file_size: string;
  chunk_count: number;
}

const SUGGESTIONS = [
  "Summarise this document in 5 bullet points",
  "What are the key findings?",
  "List every date mentioned",
  "Explain section 3 like I'm five",
];

function ChatPageInner() {
  const [currentDoc, setCurrentDoc] = useState<DocEntry | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [openSourceIndex, setOpenSourceIndex] = useState<number | null>(null);
  const [recentDocs, setRecentDocs] = useState<DocEntry[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const docId = searchParams.get("doc");
  const bottomRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const loadDocument = async () => {
    const { data: doc } = await supabase
      .from("documents")
      .select("*")
      .eq("id", docId)
      .single();

    if (!doc) {
      router.push("/");
      return;
    }
    setCurrentDoc(doc);

    const { data: msgs } = await supabase
      .from("messages")
      .select("*")
      .eq("document_id", docId)
      .order("created_at", { ascending: true });

    if (msgs) {
      setMessages(
        msgs.map((m) => ({
          role: m.role,
          content: m.content,
          sources: m.sources || [],
        }))
      );
    }
  };

  const loadAllDocs = async () => {
    const { data } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setRecentDocs(data);
  };

  useEffect(() => {
    if (!docId) {
      router.push("/");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDocument();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAllDocs();
  }, [docId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendQuestion = async (question: string) => {
    if (!question.trim() || loading || !currentDoc) return;

    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          documentId: currentDoc.id,
          fileName: currentDoc.file_name,
        }),
      });
      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer || "Something went wrong.", sources: data.sources || [] },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Failed to get an answer. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (!currentDoc) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <motion.div
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.2, repeat: Infinity }}
          className="text-gray-400 text-sm"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-white">
      {/* Sidebar */}
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        className="w-72 bg-gray-50/70 border-r border-gray-100 p-5 flex flex-col"
      >
        <div className="flex items-center gap-2 mb-6">
          <Image src="/favicon.ico" alt="logo" width={36} height={36} className="w-9 h-9" />
          <div>
            <p className="font-bold text-gray-900 leading-none">Kontext</p>
            <p className="text-[10px] tracking-widest text-gray-500 mt-1">CHAT WITH PDFS</p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/")}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold py-2.5 rounded-full mb-6 hover:opacity-90 transition"
        >
          <Plus className="w-4 h-4" />
          Upload new file
        </motion.button>

        <p className="text-xs font-semibold text-gray-400 tracking-widest mb-2">CURRENT DOCUMENT</p>
        <div className="bg-white rounded-xl p-3 border border-gray-100 mb-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-blue-500 flex items-center justify-center text-white">
              <FileText className="w-10 h-3.5" />
            </div>
            <p className="text-sm font-medium text-gray-800 truncate">{currentDoc.file_name}</p>
          </div>
          <p className="text-xs text-gray-400 mb-1">{currentDoc.file_size}</p>
          <p className="text-xs text-cyan-600 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" /> Indexed and ready
          </p>
        </div>

        {recentDocs.length > 1 && (
          <>
            <p className="text-xs font-semibold text-gray-400 tracking-widest mb-2">RECENT DOCUMENTS</p>
            <div className="space-y-1.5 overflow-y-auto flex-1">
              {recentDocs
                .filter((d) => d.id !== currentDoc.id)
                .map((doc, i) => (
                  <motion.button
                    key={doc.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => router.push(`/chat?doc=${doc.id}`)}
                    className="w-full flex items-center gap-2 text-left text-sm text-gray-600 hover:bg-white rounded-lg px-3 py-2 truncate transition"
                  >
                    <FileText className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
                    {doc.file_name}
                  </motion.button>
                ))}
            </div>
          </>
        )}

        <div className="mt-auto bg-white/80 rounded-xl p-3 text-xs text-gray-500 border border-gray-100">
          <p className="font-semibold text-gray-700 mb-1">Tip</p>
          Ask follow-up questions. Kontext remembers context in this session.
        </div>
      </motion.aside>

      {/* Main chat */}
      <main className="flex-1 flex flex-col relative bg-[#F2FBFF]">
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900">{currentDoc.file_name}</p>
            <p className="text-xs text-gray-400">
              {messages.filter((m) => m.role === "user").length} question
              {messages.filter((m) => m.role === "user").length !== 1 ? "s" : ""} asked
            </p>
          </div>
          <span className="text-xs bg-gray-50 px-3 py-1 rounded-full text-gray-500 flex items-center gap-1.5 border border-gray-100">
            </span>
        </div>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
              >
                  <Image src="/favicon.ico" alt="logo" width={46} height={46} className="w-20 h-20 " />
              </motion.div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Ask me anything about your document</h2>
              <p className="text-gray-500 text-sm mb-6 max-w-md">
                I have read {currentDoc.file_name}. Try one of these to get started.
              </p>
              <div className="flex flex-wrap gap-3 justify-center max-w-lg">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button
                    key={s}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.08 }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => sendQuestion(s)}
                    className="bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition shadow-sm"
                  >
                    {s} ↗
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-6 max-w-3xl mx-auto">
              <AnimatePresence initial={false}>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "user" ? (
                      <div className="bg-gradient-to-r from-cyan-500 to-purple-600 text-white px-4 py-2.5 rounded-2xl rounded-br-sm max-w-md">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="flex gap-3 max-w-xl">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                             <Image src="/favicon.ico" alt="logo" width={47} height={36} className="w-9 h-9" />   </div>
                        <div>
                          <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 text-gray-800 border border-gray-100">
                            {msg.content}
                          </div>
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-2">
                              <button
                                onClick={() => setOpenSourceIndex(openSourceIndex === i ? null : i)}
                                className="text-xs text-blue-600 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-gray-100"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                {msg.sources.length} sources
                                {openSourceIndex === i ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <AnimatePresence>
                                {openSourceIndex === i && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.25 }}
                                    className="mt-2 space-y-2 overflow-hidden"
                                  >
                                    {msg.sources.map((src, j) => (
                                      <div key={j} className="bg-white rounded-lg p-2.5 text-xs text-gray-500 border border-gray-100">
                                        {src.text}
                                      </div>
                                    ))}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3 max-w-xl"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-white" strokeWidth={2} />
                  </div>
                  <div className="bg-gray-50 rounded-2xl rounded-tl-sm px-4 py-3 text-gray-400 text-sm border border-gray-100 flex items-center gap-1.5">
                    <motion.span
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    >
                      Thinking...
                    </motion.span>
                  </div>
                </motion.div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-8 py-5 border-t border-gray-100">
          <div className="max-w-3xl mx-auto flex items-center gap-3 bg-gray-50 rounded-full border border-gray-200 px-4 py-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendQuestion(input)}
              placeholder="Ask anything about this document..."
              className="flex-1 outline-none text-sm text-gray-800 bg-transparent"
            />
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => sendQuestion(input)}
              disabled={loading}
              className="w-9 h-9 rounded-full bg-gradient-to-r from-cyan-500 to-purple-600 flex items-center justify-center text-white disabled:opacity-50"
            >
              <Send className="w-4 h-4" strokeWidth={2} />
            </motion.button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">
            Kontext can make mistakes. Verify important information with the cited pages.
          </p>
        </div>
      </main>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center">Loading...</div>}>
      <ChatPageInner />
    </Suspense>
  );
}