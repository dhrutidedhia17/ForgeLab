"use client";

import PromptInput from "@/components/build/PromptInput";
import PipelineStepper from "@/components/build/PipelineStepper";
import ResultsPanel from "@/components/build/ResultsPanel";
import LiveAssistant from "@/components/build/LiveAssistant";
import { usePipeline } from "@/hooks/usePipeline";
import type { ResearchResult } from "@/types/pipeline";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Clock, Sparkles, Archive } from "lucide-react";

export default function BuildPage() {
  const { state, stepStatuses, estimatedTimeLeft, isRunning, isComplete, run } =
    usePipeline();

  const handleSubmit = (
    prompt: string,
    category: string,
    pdfBase64?: string,
    imageBase64?: string,
    imageMimeType?: string
  ) => {
    run(prompt, category, pdfBase64, imageBase64, imageMimeType);
  };

  const hasStarted = state.status !== "idle";

  return (
    <div className="min-h-screen relative">
      {/* Background mesh */}
      <div className="fixed inset-0 bg-mesh-1 pointer-events-none" />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-clay-400/[0.015] blur-[100px] animate-aurora" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[35%] h-[35%] rounded-full bg-sage-300/[0.015] blur-[100px] animate-aurora" style={{ animationDelay: '-7s' }} />
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 relative z-10">
        {/* Header */}
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <motion.div
            className="inline-flex items-center gap-2.5 glass-card rounded-full px-5 py-2 text-sm font-medium mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 }}
          >
            <Sparkles className="h-4 w-4 text-clay-300" />
            <span className="text-clay-300/90">Build Station</span>
          </motion.div>
          <h1 className="text-3xl md:text-5xl font-bold mb-3 leading-tight font-display">
            <span className="text-white/90">What do you want to </span>
            <span className="gradient-text text-glow">build</span>
            <span className="text-white/90">?</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto font-light">
            Describe your project, upload a photo, or drop a manual — ForgeLab handles the rest.
          </p>
        </motion.div>

        {/* Input */}
        <PromptInput onSubmit={handleSubmit} isRunning={isRunning} />

        {/* Pipeline Progress */}
        {hasStarted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PipelineStepper stepStatuses={stepStatuses} />

            {/* Time estimate */}
            {isRunning && estimatedTimeLeft && (
              <div className="text-center mb-4">
                <span className="inline-flex items-center gap-2 text-sm text-gray-500 glass-card px-5 py-2.5 rounded-full">
                  <Clock className="h-4 w-4 text-clay-300/60" />
                  {estimatedTimeLeft}
                </span>
              </div>
            )}
          </motion.div>
        )}

        {/* Results */}
        <ResultsPanel results={state.steps} visible={hasStarted} />

        {/* Vault link after completion */}
        {isComplete && state.buildId && (
          <motion.div
            className="text-center mt-10 mb-12"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 glass-card rounded-2xl px-6 py-4 border border-sage-500/12">
              <span className="flex items-center gap-2 text-sage-400 font-medium">
                <Archive className="h-4 w-4" />
                Build saved to your Knowledge Vault!
              </span>
              <Link
                href={`/vault/${state.buildId}`}
                className="inline-flex items-center gap-2 text-clay-300 hover:text-clay-200 font-medium transition-colors"
              >
                View in Vault <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        )}
      </div>
      {/* Live Assistant */}
      <LiveAssistant
        buildContext={{
          prompt: state.prompt,
          research: state.steps.research?.result
            ? (state.steps.research.result as ResearchResult)
            : null,
          category: state.category,
        }}
      />
    </div>
  );
}
