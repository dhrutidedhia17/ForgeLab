# ForgeLab — AI-Powered Build Platform

Turn any text prompt or uploaded PDF manual into a complete multimedia build package for physical products like furniture, appliances, car parts, and houses.

## What It Does

ForgeLab runs a 7-step AI pipeline and returns:

1. **Research & Guide** — Full step-by-step build guide with materials, tools, and safety notes (Gemini 2.5 Flash)
2. **Materials & Vendors** — Sourced vendor links with pricing for every material (Gemini Web Search)
3. **3D Model** — Editable CAD model in STEP format (Zoo.dev Text-to-CAD)
4. **Blueprint** — 2D fabrication drawing (DraftAid API or generated SVG)
5. **Product Image** — Photorealistic render of the finished product (Gemini Image Generation)
6. **Tutorial Video** — 3 narrated video clips showing the build process (Veo 3)
7. **Background Music** — Ambient soundtrack to build along with (Lyria 3)

All outputs are stored in an **Obsidian-style Knowledge Vault** with bidirectional `[[wikilinks]]`, searchable by category and materials.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend**: Next.js API routes (Node.js) with Server-Sent Events (SSE)
- **3D Viewing**: Three.js + React Three Fiber
- **AI APIs**: Gemini 2.5 Flash, Gemini Image Gen, Zoo.dev, DraftAid, Veo 3, Lyria 3
- **Storage**: Local filesystem + JSON vault with Markdown files

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your API keys:

| Variable | Required | Get it at |
|----------|----------|-----------|
| `GEMINI_API_KEY` | Recommended | [Google AI Studio](https://aistudio.google.com/apikey) |
| `ZOO_API_KEY` | Optional | [Zoo.dev](https://zoo.dev/account/api-tokens) |
| `DRAFTAID_API_KEY` | Optional | [DraftAid](https://draftaid.io) (contact for access) |
| `GOOGLE_CLOUD_PROJECT` | Optional | [Google Cloud Console](https://console.cloud.google.com) |
| `GOOGLE_CLOUD_LOCATION` | Optional | Default: `us-central1` |

**Note:** The app works fully without any API keys — all steps use clearly-labelled mock data for demo purposes.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pipeline Architecture

```
User Input (text prompt or PDF)
    │
    ▼
Step 1: Research & Guide (Gemini) ─── sequential, all others depend on this
    │
    ├── Step 2: Vendor Search (Gemini Web Search)  ─┐
    ├── Step 3: 3D Model (Zoo.dev)                  │
    ├── Step 4: Blueprint (DraftAid / Mock SVG)     ├── parallel
    ├── Step 5: Product Image (Gemini Image)        │
    ├── Step 6: Tutorial Video (Veo 3)              │
    └── Step 7: Background Music (Lyria 3)         ─┘
    │
    ▼
Save to Knowledge Vault (Markdown + JSON index)
```

Results stream to the UI in real-time via Server-Sent Events.

## Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── build/page.tsx            # Build interface
│   ├── vault/page.tsx            # Vault listing
│   ├── vault/[id]/page.tsx       # Vault detail
│   └── api/
│       ├── pipeline/route.ts     # SSE pipeline orchestrator
│       ├── research/route.ts     # Gemini research endpoint
│       ├── vendors/route.ts      # Vendor search endpoint
│       ├── model3d/route.ts      # Zoo.dev 3D model endpoint
│       ├── blueprint/route.ts    # DraftAid blueprint endpoint
│       ├── image/route.ts        # Image generation endpoint
│       ├── video/route.ts        # Veo 3 video endpoint
│       ├── music/route.ts        # Lyria 3 music endpoint
│       └── vault/route.ts        # Vault CRUD API
├── components/
│   ├── build/                    # Pipeline UI components
│   ├── layout/                   # Header, navigation
│   └── ui/                       # shadcn/ui components
├── hooks/
│   └── usePipeline.ts            # SSE consumer hook
├── lib/
│   ├── ai/                       # AI service wrappers
│   ├── pipeline/                 # Orchestrator + SSE helpers
│   ├── vault/                    # Vault storage layer
│   ├── mock/                     # Mock data for demo
│   └── files.ts                  # File output management
├── types/
│   ├── pipeline.ts               # Pipeline types
│   └── vault.ts                  # Vault types
vault/                            # Knowledge vault (Markdown + JSON)
public/outputs/                   # Generated output files per build
```
