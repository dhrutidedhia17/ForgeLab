"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  Calendar,
  BarChart3,
  Link2,
  Image as ImageIcon,
  FileText,
  Video,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { VaultEntry } from "@/types/vault";

interface VaultDetail {
  entry: VaultEntry;
  markdown: string;
}

export default function VaultDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<VaultDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/vault?id=${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-clay-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-400 text-lg">Build not found</p>
        <Link href="/vault">
          <button className="glass rounded-xl px-5 py-2.5 text-gray-300 text-sm font-medium flex items-center gap-2 hover:bg-white/5 transition-all">
            <ArrowLeft className="h-4 w-4" />
            Back to Vault
          </button>
        </Link>
      </div>
    );
  }

  const { entry, markdown } = data;

  return (
    <div className="min-h-screen relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-500/5 via-transparent to-transparent" />

      <div className="max-w-4xl mx-auto px-4 py-12 relative z-10">
        {/* Back link */}
        <Link
          href="/vault"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-300 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Vault
        </Link>

        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-white mb-3">
            {entry.title}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <Badge
              className={
                entry.status === "complete"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                  : "bg-amber-500/15 text-amber-400 border-amber-500/20"
              }
            >
              {entry.status}
            </Badge>
            <Badge className="bg-white/5 text-gray-400 border-white/10">{entry.category}</Badge>
            <span className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="h-3 w-3" />
              {new Date(entry.createdAt).toLocaleDateString()}
            </span>
          </div>
        </motion.div>

        {/* Output Files Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Product Image */}
          {entry.outputs.image && (
            <div className="glass rounded-2xl overflow-hidden md:col-span-2">
              <div className="px-5 pt-5 pb-3 flex items-center gap-2">
                <ImageIcon className="h-4 w-4 text-pink-400" />
                <h3 className="text-base font-semibold text-gray-200">Product Image</h3>
              </div>
              <div className="px-5 pb-5">
                <div className="rounded-xl overflow-hidden bg-warm-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={entry.outputs.image}
                    alt={entry.title}
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
                <a href={entry.outputs.image} download>
                  <button className="w-full glass rounded-xl py-3 text-gray-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-all mt-3">
                    <Download className="h-4 w-4" />
                    Download Image
                  </button>
                </a>
              </div>
            </div>
          )}

          {/* Blueprint */}
          {entry.outputs.blueprint && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-5 pt-5 pb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-blue-400" />
                <h3 className="text-base font-semibold text-gray-200">Blueprint</h3>
              </div>
              <div className="px-5 pb-5">
                <div className="rounded-xl overflow-hidden bg-warm-100 h-48 flex items-center justify-center">
                  {entry.outputs.blueprint.endsWith(".svg") ||
                  entry.outputs.blueprint.endsWith(".png") ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.outputs.blueprint}
                      alt="Blueprint"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <span className="text-gray-500">Blueprint (PDF)</span>
                  )}
                </div>
                <a href={entry.outputs.blueprint} download>
                  <button className="w-full glass rounded-xl py-3 text-gray-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-all mt-3">
                    <Download className="h-4 w-4" />
                    Download Blueprint
                  </button>
                </a>
              </div>
            </div>
          )}

          {/* 3D Model */}
          {entry.outputs.model3d && (
            <div className="glass rounded-2xl overflow-hidden">
              <div className="px-5 pt-5 pb-3 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-purple-400" />
                <h3 className="text-base font-semibold text-gray-200">3D Model</h3>
              </div>
              <div className="px-5 pb-5">
                <div className="rounded-xl bg-warm-100 h-48 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2 text-purple-400/50" />
                    <p className="text-sm">3D Model (STEP)</p>
                  </div>
                </div>
                <a href={entry.outputs.model3d} download>
                  <button className="w-full glass rounded-xl py-3 text-gray-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-all mt-3">
                    <Download className="h-4 w-4" />
                    Download STEP File
                  </button>
                </a>
              </div>
            </div>
          )}

          {/* Video clips */}
          {entry.outputs.video && entry.outputs.video.length > 0 && (
            <div className="glass rounded-2xl overflow-hidden md:col-span-2">
              <div className="px-5 pt-5 pb-3 flex items-center gap-2">
                <Video className="h-4 w-4 text-emerald-400" />
                <h3 className="text-base font-semibold text-gray-200">Tutorial Videos</h3>
              </div>
              <div className="px-5 pb-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {entry.outputs.video.map((clip, i) => (
                    <div key={i}>
                      <video
                        controls
                        className="w-full rounded-xl bg-black/50"
                        src={clip}
                      />
                      <p className="text-xs text-gray-500 mt-1.5">
                        Clip {i + 1}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Background Music (part of tutorial video) */}
          {entry.outputs.music && (
            <div className="glass rounded-2xl overflow-hidden md:col-span-2">
              <div className="px-5 pt-5 pb-3 flex items-center gap-2">
                <Video className="h-4 w-4 text-cyan-400" />
                <h3 className="text-base font-semibold text-gray-200">🎵 Background Music</h3>
              </div>
              <div className="px-5 pb-5">
                <p className="text-sm text-gray-500 mb-3">
                  Play this while you build
                </p>
                <audio controls className="w-full" src={entry.outputs.music} />
                <a href={entry.outputs.music} download>
                  <button className="w-full glass rounded-xl py-3 text-gray-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-all mt-3">
                    <Download className="h-4 w-4" />
                    Download Music
                  </button>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Full Guide (Markdown) */}
        <div className="glass rounded-2xl overflow-hidden mb-10">
          <div className="px-6 pt-6 pb-3">
            <h3 className="text-lg font-semibold text-white">Full Build Guide</h3>
          </div>
          <div className="px-6 pb-6">
            <div className="prose prose-sm prose-invert max-w-none prose-headings:text-gray-200 prose-p:text-gray-400 prose-a:text-clay-300 prose-strong:text-gray-300 prose-th:text-gray-400 prose-td:text-gray-400 prose-li:text-gray-400 prose-code:text-clay-200 prose-pre:bg-warm-100 prose-hr:border-white/10">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {markdown}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        {/* Related Builds */}
        {entry.relatedBuilds.length > 0 && (
          <div className="glass rounded-2xl overflow-hidden mb-6">
            <div className="px-6 pt-6 pb-3 flex items-center gap-2">
              <Link2 className="h-4 w-4 text-clay-300" />
              <h3 className="text-lg font-semibold text-white">Related Builds</h3>
            </div>
            <div className="px-6 pb-6 space-y-2">
              {entry.relatedBuilds.map((related) => (
                <Link
                  key={related.id}
                  href={`/vault/${related.id}`}
                  className="flex items-center gap-2 text-clay-300 hover:text-clay-200 transition-colors"
                >
                  <span className="text-gray-600">[[</span>
                  {related.title}
                  <span className="text-gray-600">]]</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-6">
            {entry.tags.map((tag, i) => (
              <Badge key={i} className="text-xs bg-white/5 text-gray-400 border-white/10">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
