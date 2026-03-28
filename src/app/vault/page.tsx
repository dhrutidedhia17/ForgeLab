"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Hammer,
  ArrowRight,
  Calendar,
  Package,
  Archive,
} from "lucide-react";
import type { VaultEntry } from "@/types/vault";
import { CATEGORIES } from "@/types/pipeline";

export default function VaultPage() {
  const [builds, setBuilds] = useState<VaultEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("All");

  useEffect(() => {
    fetch("/api/vault")
      .then((res) => res.json())
      .then((data) => {
        setBuilds(data.builds || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredBuilds =
    filter === "All"
      ? builds
      : builds.filter(
          (b) => b.category.toLowerCase() === filter.toLowerCase()
        );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-clay-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-radial from-purple-500/5 via-transparent to-transparent" />

      <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-sm font-medium mb-5"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          >
            <Archive className="h-4 w-4 text-purple-400" />
            <span className="text-purple-300">Knowledge Vault</span>
          </motion.div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            <span className="text-white">Your </span>
            <span className="gradient-text-purple">Build Vault</span>
          </h1>
          <p className="text-gray-400 text-lg">
            All your past builds, linked and searchable.
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          <motion.button
            onClick={() => setFilter("All")}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
              filter === "All"
                ? "bg-clay-400/20 text-clay-300 border border-clay-400/30"
                : "glass text-gray-500 hover:text-gray-300 hover:bg-white/5"
            }`}
          >
            All
          </motion.button>
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat}
              onClick={() => setFilter(cat)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === cat
                  ? "bg-clay-400/20 text-clay-300 border border-clay-400/30"
                  : "glass text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        {/* Empty State */}
        {filteredBuilds.length === 0 && (
          <motion.div
            className="text-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-clay-400/10 to-purple-500/10 flex items-center justify-center mx-auto mb-5">
              <Package className="h-10 w-10 text-gray-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-300 mb-2">
              No builds yet
            </h2>
            <p className="text-gray-500 mb-8">
              Start your first build and it will appear here.
            </p>
            <Link href="/build">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="px-8 py-4 bg-brand-gradient rounded-2xl text-white text-lg font-semibold transition-all hover:shadow-[0_0_40px_rgba(249,115,22,0.3)] inline-flex items-center gap-2"
              >
                <Hammer className="h-5 w-5" />
                Start your first build
                <ArrowRight className="h-5 w-5" />
              </motion.button>
            </Link>
          </motion.div>
        )}

        {/* Build Grid */}
        {filteredBuilds.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBuilds.map((build, i) => (
              <motion.div
                key={build.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <Link href={`/vault/${build.id}`}>
                  <div className="glass rounded-2xl overflow-hidden hover:bg-white/[0.04] transition-all cursor-pointer h-full group">
                    {/* Image preview */}
                    {build.outputs.image && (
                      <div className="h-44 overflow-hidden bg-warm-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={build.outputs.image}
                          alt={build.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <h3 className="text-base font-semibold text-gray-200 line-clamp-2 group-hover:text-white transition-colors">
                          {build.title}
                        </h3>
                        <Badge
                          className={`flex-shrink-0 ${
                            build.status === "complete"
                              ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                              : build.status === "partial"
                              ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                              : "bg-red-500/15 text-red-400 border-red-500/20"
                          }`}
                        >
                          {build.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                        {build.prompt}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(build.createdAt).toLocaleDateString()}
                        </span>
                        <Badge className="text-xs bg-white/5 text-gray-400 border-white/10">
                          {build.category}
                        </Badge>
                      </div>
                      {build.materials.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {build.materials.slice(0, 3).map((m, j) => (
                            <Badge
                              key={j}
                              className="text-xs bg-white/5 text-gray-500 border-white/5"
                            >
                              {m}
                            </Badge>
                          ))}
                          {build.materials.length > 3 && (
                            <Badge className="text-xs bg-white/5 text-gray-500 border-white/5">
                              +{build.materials.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
