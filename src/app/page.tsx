"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen,
  Box,
  Video,
  ArrowRight,
  Sparkles,
  ShoppingCart,
  Image as ImageIcon,
  Ruler,
  Zap,
  Eye,
  MessageCircle,
  Cpu,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Research & Guide",
    description:
      "AI-powered research generates comprehensive step-by-step build guides with materials, tools, and safety notes.",
    gradient: "from-clay-400/12 to-sand-400/12",
    iconColor: "text-clay-300",
    borderColor: "border-clay-400/8",
  },
  {
    icon: Box,
    title: "3D Models & Blueprints",
    description:
      "Get interactive 3D GLB models and SVG engineering blueprints automatically generated from your specs.",
    gradient: "from-sage-400/12 to-sage-300/12",
    iconColor: "text-sage-300",
    borderColor: "border-sage-400/8",
  },
  {
    icon: Video,
    title: "Video & Music",
    description:
      "Veo 3 narrated tutorial videos and Lyria 3 ambient background music — everything you need to start building.",
    gradient: "from-emerald-400/10 to-teal-400/10",
    iconColor: "text-emerald-400",
    borderColor: "border-emerald-400/8",
  },
  {
    icon: MessageCircle,
    title: "Live AI Assistant",
    description:
      "Chat in real-time with Gemini Live — ask questions about your build, get tips, and troubleshoot as you go.",
    gradient: "from-sand-400/12 to-clay-300/12",
    iconColor: "text-sand-300",
    borderColor: "border-sand-400/8",
  },
  {
    icon: ImageIcon,
    title: "Product Renders",
    description:
      "Photorealistic product images powered by Gemini 3.1 Flash — stunning 4K catalog-quality renders.",
    gradient: "from-amber-400/10 to-sand-300/10",
    iconColor: "text-amber-300/80",
    borderColor: "border-amber-400/8",
  },
  {
    icon: Cpu,
    title: "On-Device AI Tips",
    description:
      "Instant build tips powered by Gemini Nano — runs locally on your device for zero-latency suggestions.",
    gradient: "from-sage-300/12 to-emerald-400/10",
    iconColor: "text-sage-300",
    borderColor: "border-sage-300/8",
  },
];

const pipelineSteps = [
  { icon: BookOpen, label: "Build Guide", color: "text-clay-300", bg: "bg-clay-400/8" },
  { icon: ShoppingCart, label: "Vendor Sourcing", color: "text-sand-300", bg: "bg-sand-400/8" },
  { icon: Box, label: "3D Model", color: "text-sage-300", bg: "bg-sage-400/8" },
  { icon: Ruler, label: "Blueprint", color: "text-clay-200", bg: "bg-clay-300/8" },
  { icon: ImageIcon, label: "Product Image", color: "text-sand-200", bg: "bg-sand-300/8" },
  { icon: Video, label: "Video & Music", color: "text-emerald-400", bg: "bg-emerald-400/8" },
];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

export default function Home() {
  return (
    <div className="flex flex-col relative">
      {/* Background mesh gradient */}
      <div className="fixed inset-0 bg-mesh-1 pointer-events-none" />
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-clay-400/[0.02] blur-[120px] animate-aurora" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sage-300/[0.02] blur-[120px] animate-aurora" style={{ animationDelay: '-5s' }} />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-sand-400/[0.015] blur-[100px] animate-aurora" style={{ animationDelay: '-10s' }} />
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-16 px-6">
        <motion.div
          className="max-w-4xl mx-auto text-center relative z-10"
          {...fadeUp}
        >
          <motion.div
            className="inline-flex items-center gap-2.5 glass-card rounded-full px-5 py-2 text-sm font-medium mb-10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Sparkles className="h-4 w-4 text-clay-300" />
            <span className="text-clay-300/90 font-medium">AI-Powered Build Platform</span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.08] font-display">
            <span className="text-white/90">Build anything.</span>
            <br />
            <span className="gradient-text text-glow">From scratch. With AI.</span>
          </h1>

          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-14 leading-relaxed font-light">
            Upload a photo, type a prompt, or drop a PDF manual. ForgeLab runs a
            6-step AI pipeline and returns a complete build package —
            guides, 3D models, blueprints, and more.
          </p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/build">
              <button className="group relative px-8 py-4 bg-brand-gradient rounded-2xl text-white text-lg font-semibold transition-all hover:scale-[1.03] hover:shadow-warm-lg active:scale-[0.98] shadow-warm-md">
                <span className="flex items-center gap-2.5">
                  <Sparkles className="h-5 w-5" />
                  Start Forging
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </Link>
            <Link href="/vault">
              <button className="px-8 py-4 glass-card rounded-2xl text-gray-400 text-lg font-medium transition-all hover:bg-white/[0.03] hover:text-white/80 hover:border-white/8">
                <span className="flex items-center gap-2.5">
                  <Eye className="h-5 w-5" />
                  View Vault
                </span>
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Pipeline Steps */}
      <section className="py-20 px-6 relative">
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div
            className="text-center mb-14"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 text-clay-300/70 text-xs font-semibold tracking-[0.2em] uppercase mb-4">
              <Zap className="h-3.5 w-3.5" />
              Pipeline
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white/90 font-display">
              6 Steps. One Click.
            </h2>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-3">
            {pipelineSteps.map((step, i) => (
              <motion.div
                key={i}
                className="glass-card flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-medium hover:bg-white/[0.03] transition-all cursor-default group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ scale: 1.04, y: -2 }}
              >
                <div className={`h-8 w-8 rounded-lg ${step.bg} flex items-center justify-center`}>
                  <step.icon className={`h-4 w-4 ${step.color} group-hover:scale-110 transition-transform`} />
                </div>
                <span className="text-gray-400 group-hover:text-white/80 transition-colors">{step.label}</span>
                {i < pipelineSteps.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-gray-700 ml-1" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                className={`group glass-card rounded-3xl p-7 hover:bg-white/[0.03] transition-all duration-300 ${feature.borderColor}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -4 }}
              >
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-warm-sm transition-all`}>
                  <feature.icon className={`h-5 w-5 ${feature.iconColor}`} />
                </div>
                <h3 className="font-semibold text-white/90 text-[17px] mb-2.5 font-display">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed font-light">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-clay-400/[0.03] via-transparent to-transparent" />
        <motion.div
          className="max-w-2xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white/90 mb-5 font-display">
            Ready to <span className="gradient-text">forge</span>?
          </h2>
          <p className="text-gray-500 mb-12 text-lg font-light leading-relaxed">
            From blouses to bookshelves — upload a photo or describe it, and
            ForgeLab generates everything you need.
          </p>
          <Link href="/build">
            <button className="group relative px-10 py-5 bg-brand-gradient rounded-2xl text-white text-lg font-semibold transition-all hover:scale-[1.03] hover:shadow-warm-xl active:scale-[0.98] shadow-warm-lg">
              <span className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5" />
                Start Building
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </Link>
        </motion.div>
      </section>
    </div>
  );
}
