"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase";
import Image from "next/image";
import { Sparkles, FileText, Lock, Search, Shield } from "lucide-react";

import Lottie from "lottie-react";
import animationData from "@/public/animations/scanner.json";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };


  return (
    <div className="min-h-screen bg-white relative overflow-hidden flex items-center justify-center px-6 py-10">
      {/* Animated glow patch - centered */}
      <motion.div
        className="absolute top-1/2 left-1/2 w-[900px] h-[900px] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(96,165,250,0.5) 0%, rgba(168,85,247,0.4) 45%, transparent 70%)",
        }}
        animate={{ opacity: [0.4, 0.6, 0.4], scale: [1, 1.05, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 w-full max-w-6xl grid md:grid-cols-2 gap-12 items-center">

        <div className='flex flex-col'>
              <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-lg"
        >
          <div className="flex items-center gap-2 mb-10">
            <Image src="/favicon.ico" alt="logo" width={36} height={36} className="w-9 h-9" />
            <div>
              <p className="font-bold text-gray-900 leading-none">Kontext</p>
              <p className="text-[10px] tracking-widest text-gray-500 mt-1">CHAT WITH PDFS</p>
            </div>
          </div>

          <h1 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Welcome back to{" "}
            <span className="bg-gradient-to-r from-cyan-500 to-purple-600 bg-clip-text text-transparent">
              Kontext
            </span>
            .
          </h1>

          <p className="text-gray-500 text-md mb-10 tracking-wide">
            Sign in to pick up where you left off — your documents, chats and
            citations are ready when you are.
          </p>

       
        </motion.div>
           <div className="space-y-3">
             <Lottie
      animationData={animationData}
      loop={true}
      className="w-[400px] h-[300px]"
    />
          </div>

        </div>
        {/* Left side */}
      

        {/* Right side - card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="bg-white rounded-3xl shadow-xl p-10 w-full max-w-md mx-auto"
        >
          <div className="flex flex-col items-center text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3, type: "spring" }}
              className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mb-4"
            >
              <FileText className="w-7 h-7 text-white" strokeWidth={2} />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Sign in to Kontext</h2>
            <p className="text-gray-500 text-sm">Continue with Google to access your documents</p>
          </div>

          <motion.button
            onClick={handleGoogleLogin}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-full py-3.5 font-medium text-gray-700 hover:bg-gray-50 hover:shadow-md transition disabled:opacity-60"
          >
            {loading ? (
              <span className="text-sm">Redirecting...</span>
            ) : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </motion.button>

          <p className="text-center text-xs text-gray-400 mt-6 flex items-center justify-center gap-1.5">
            <Lock className="w-3 h-3" />
            By continuing you agree to our{" "}
            <span className="underline cursor-pointer">Terms</span> &{" "}
            <span className="underline cursor-pointer">Privacy Policy</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
}