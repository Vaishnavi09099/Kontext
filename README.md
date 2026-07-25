# 📚✨ Kontext

### *Turn any PDF into a conversation.*

Upload a PDF, ask it anything, and get answers — grounded, cited, and actually correct. Kontext reads your document so you don't have to skim 40 pages for one paragraph. 🌊

---

## 🌟 What it does

1. 📤 **Upload** a PDF
2. 🧩 Kontext **extracts + chunks** the text
3. 🧠 Each chunk gets turned into an **embedding**
4. 🗂️ Embeddings are stored in a **vector database**
5. 💬 Ask a question → Kontext **retrieves** the most relevant chunks
6. ✍️ An LLM reads those chunks and **writes you a grounded answer**, citing exactly where it came from

No hallucinated nonsense — every answer traces back to your actual document. 🔍

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| 🎨 Frontend | Next.js 16 (App Router) · TypeScript · Tailwind CSS |
| ✨ Animations | Framer Motion |
| 🧷 Icons | Lucide React |
| 🔐 Auth | Supabase Auth (Google OAuth) |
| 🗄️ Database | Supabase (PostgreSQL + Row Level Security) |
| 📄 PDF Parsing | pdf-parse v2 |
| 🧠 Embeddings | HuggingFace — `sentence-transformers/all-MiniLM-L6-v2` |
| 💬 LLM | Groq — `llama-3.1-8b-instant` |
| 🔎 Vector DB | Pinecone (serverless, cosine similarity) |
| ☁️ Deployment | Vercel |

---

## ✨ Features

- 🔒 **Google sign-in** — your documents, your account, always
- 📁 **Multi-document support** — upload as many PDFs as you like, switch between them anytime
- 💾 **Persistent chat history** — every conversation is saved, pick up right where you left off
- 📖 **Cited sources** — every answer shows exactly which chunks of the PDF it came from
- 🎬 **Smooth, playful UI** — because functional doesn't have to mean boring

---

## 🚀 Getting Started

```bash
# Clone it
git clone <your-repo-url>
cd kontext

# Install dependencies
npm install

# Add your environment variables (see below) to .env.local

# Run it!
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you're in. 🎉

---

## 🔑 Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
PINECONE_API_KEY=
PINECONE_INDEX_NAME=
HUGGINGFACE_API_KEY=
GROQ_API_KEY=
```

---

## 🗺️ Flow at a glance

```
📄 PDF  →  🧩 Chunk  →  🧠 Embed  →  🗂️ Store (Pinecone)
                                          ↓
❓ Question  →  🧠 Embed  →  🔎 Retrieve top matches
                                          ↓
                          ✍️ LLM generates grounded answer
                                          ↓
                             💬 Answer + 📖 Sources
```

---

## 💭 Why "Kontext"?

Because that's exactly what it gives your questions — the *context* they need to be answered properly. 🌸

---

<p align="center">Made with 💙 and a lot of debugging.</p>
