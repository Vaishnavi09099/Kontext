"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase";
import Image from "next/image";
import { UploadCloud, X, FileText, Search, Sparkles, Shield, LogOut, Check } from "lucide-react";

type Step = "idle" | "selected" | "processing" | "done";

const PROCESSING_STEPS = [
  "Extracting text from pages",
  "Generating embeddings",
  "Indexing knowledge",
];

interface DocEntry {
  id: string;
  file_name: string;
  file_size: string;
  chunk_count: number;
  created_at: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<Step>("idle");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [error, setError] = useState("");
  const [recentDocs, setRecentDocs] = useState<DocEntry[]>([]);
  const [userEmail, setUserEmail] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const loadUserAndDocs = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserEmail(user.email || "");

    const { data } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setRecentDocs(data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUserAndDocs();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleFileSelect = (selected: File | null) => {
    if (!selected) return;
    if (selected.type !== "application/pdf") {
      setError("Please upload a PDF file only.");
      return;
    }
    setError("");
    setFile(selected);
    setStep("selected");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files[0] || null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setStep("processing");
    setCurrentStepIndex(0);

    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev < PROCESSING_STEPS.length - 1 ? prev + 1 : prev));
    }, 1200);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      clearInterval(stepInterval);

      if (!res.ok) {
        setError(data.error || "Upload failed. Try again.");
        setStep("selected");
        return;
      }

      setStep("done");
      setTimeout(() => {
        router.push(`/chat?doc=${data.documentId}`);
      }, 600);
    } catch (err) {
      clearInterval(stepInterval);
      setError("Something went wrong. Please try again.");
      setStep("selected");
    }
  };

  const features = [
    { icon: Search, title: "Semantic search", desc: "Finds meaning, not just keywords." },
    { icon: Sparkles, title: "Grounded answers", desc: "Every reply cites the source pages." },
    { icon: Shield, title: "Fast & private", desc: "Files are yours. Always." },
  ];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex flex-col items-center px-4 py-10">
      {/* Animated glow patch */}
      <motion.div
        className="absolute top-0 left-1/2 w-[900px] h-[900px] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(96,165,250,0.5) 0%, rgba(168,85,247,0.4) 45%, transparent 70%)",
        }}
        animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.05, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 flex items-center justify-between w-full max-w-5xl mb-14"
      >
        <div className="flex items-center gap-2">
          <Image src="/favicon.ico" alt="logo" width={36} height={36} className="w-9 h-9" />
          <div>
            <p className="font-bold text-gray-900 leading-none">Kontext</p>
            <p className="text-[10px] tracking-widest text-gray-500 mt-1">CHAT WITH PDFS</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="text-gray-500">{userEmail}</span>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 hover:text-gray-900 transition"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </motion.div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="relative z-10 text-center mb-10 max-w-2xl"
      >
        
        <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
          Turn any PDF into a{" "}
          <span className="bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">
            conversation
          </span>
          .
        </h1>
        <p className="text-gray-500 text-md">
          Upload a PDF and ask anything about it. Kontext reads, understands
          and cites the exact passages behind every answer.
        </p>
      </motion.div>

      {/* Upload card */}
      <motion.div
        initial={{ opacity: 0, y: 25, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="relative z-10 w-full max-w-xl bg-white rounded-3xl shadow-xl p-8 border border-dashed border-gray-200"
      >
        <AnimatePresence mode="wait">
          {step === "idle" || step === "selected" ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer flex flex-col items-center py-10"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4"
                >
                  <UploadCloud className="w-8 h-8 text-white" strokeWidth={2} />
                </motion.div>

                {file ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full flex items-center gap-3 bg-gray-50 rounded-xl p-3"
                  >
                    <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs">
                      PDF
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[280px]">
                        {file.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(file.size / 1024).toFixed(1)} KB · PDF document
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        setStep("idle");
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <p className="font-semibold text-gray-800 mb-1">Drag & drop your PDF here</p>
                    <p className="text-sm text-gray-400">
                      or <span className="text-blue-500 underline">click to browse</span> · up to 25 MB
                    </p>
                  </>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                />
              </div>

              {error && <p className="text-red-500 text-sm text-center mb-3">{error}</p>}

              {file && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleUpload}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold py-3 rounded-full hover:opacity-90 transition"
                >
                  Upload & Process →
                </motion.button>
              )}

              <p className="text-center text-xs text-gray-400 mt-4 tracking-wide">
                PDF ONLY &nbsp;•&nbsp; ENCRYPTED IN TRANSIT
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 mb-6">
                <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs">
                  PDF
                </div>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate max-w-[280px]">
                    {file?.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {file && (file.size / 1024).toFixed(1)} KB · PDF document
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {PROCESSING_STEPS.map((label, i) => (
                  <motion.p
                    key={label}
                    animate={{
                      opacity: i <= currentStepIndex ? 1 : 0.4,
                    }}
                    className={`text-center text-sm flex items-center justify-center gap-2 ${
                      i < currentStepIndex
                        ? "line-through text-gray-300"
                        : i === currentStepIndex
                        ? "text-gray-800 font-medium"
                        : "text-gray-300"
                    }`}
                  >
                    {i < currentStepIndex && <Check className="w-3.5 h-3.5 text-cyan-500" />}
                    {label}
                  </motion.p>
                ))}
                <p className="text-center text-sm font-medium text-gray-800">
                  {step === "done" ? "Done!" : "Almost done..."}
                </p>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-cyan-500 to-purple-600 h-1.5 rounded-full"
                    animate={{
                      width: `${((currentStepIndex + 1) / PROCESSING_STEPS.length) * 100}%`,
                    }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Recent documents */}
      {recentDocs.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="relative z-10 w-full max-w-xl mt-8"
        >
          <p className="text-xs font-semibold text-gray-400 tracking-widest mb-3">
            YOUR DOCUMENTS
          </p>
          <div className="space-y-2">
            {recentDocs.map((doc, i) => (
              <motion.button
                key={doc.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.35 + i * 0.05 }}
                whileHover={{ scale: 1.01 }}
                onClick={() => router.push(`/chat?doc=${doc.id}`)}
                className="w-full flex items-center gap-3 bg-white/70 hover:bg-white rounded-xl p-3 transition text-left"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500 flex items-center justify-center text-white text-xs">
                  PDF
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 truncate">{doc.file_name}</p>
                  <p className="text-xs text-gray-400">{doc.file_size} · {doc.chunk_count} chunks</p>
                </div>
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}

      {/* Feature cards */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl w-full mt-10"
      >
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
           
            transition={{ duration: 0.4, delay: 0.45 + i * 0.08 }}
            className="bg-white/70 rounded-2xl shadow-lg p-5 border border-gray-100"
          >
            <f.icon className="w-5 h-5 text-blue-500 mb-2" strokeWidth={2} />
            <p className="font-semibold text-gray-800 mb-1">{f.title}</p>
            <p className="text-sm text-gray-500">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}