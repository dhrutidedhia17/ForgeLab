"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  ShoppingCart,
  Box,
  Ruler,
  Image,
  Video,
  Check,
  Loader2,
  AlertCircle,
  Circle,
} from "lucide-react";
import { PIPELINE_STEPS, type StepName, type StepStatus } from "@/types/pipeline";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  ShoppingCart,
  Box,
  Ruler,
  Image,
  Video,
};

interface PipelineStepperProps {
  stepStatuses: Record<StepName, StepStatus>;
}

export default function PipelineStepper({ stepStatuses }: PipelineStepperProps) {
  const getStatusIcon = (status: StepStatus) => {
    switch (status) {
      case "complete":
        return <Check className="h-4 w-4" />;
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Circle className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: StepStatus) => {
    switch (status) {
      case "complete":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)]";
      case "running":
        return "bg-clay-400/15 text-clay-300 border-clay-400/30 shadow-[0_0_15px_rgba(184,148,110,0.12)] animate-pulse-glow";
      case "error":
        return "bg-red-500/20 text-red-400 border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.15)]";
      default:
        return "bg-warm-100 text-gray-600 border-white/5";
    }
  };

  const getLineColor = (status: StepStatus) => {
    switch (status) {
      case "complete":
        return "bg-emerald-500/50";
      case "running":
        return "bg-clay-400/40";
      default:
        return "bg-white/5";
    }
  };

  const getLabelColor = (status: StepStatus) => {
    switch (status) {
      case "complete":
        return "text-emerald-400";
      case "running":
        return "text-clay-300";
      case "error":
        return "text-red-400";
      default:
        return "text-gray-600";
    }
  };

  void iconMap; // Available for future use

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      {/* Desktop: Horizontal */}
      <div className="hidden md:flex items-center justify-between">
        {PIPELINE_STEPS.map((step, i) => {
          const status = stepStatuses[step.name];
          return (
            <div key={step.name} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <motion.div
                  className={`h-11 w-11 rounded-xl border-2 flex items-center justify-center transition-all ${getStatusColor(status)}`}
                  animate={
                    status === "running" ? { scale: [1, 1.1, 1] } : {}
                  }
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  {getStatusIcon(status)}
                </motion.div>
                <span className={`mt-2.5 text-xs font-medium text-center max-w-[80px] transition-colors ${getLabelColor(status)}`}>
                  {step.label}
                </span>
              </div>
              {i < PIPELINE_STEPS.length - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mt-[-20px] rounded-full transition-all ${getLineColor(status)}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile: Vertical */}
      <div className="md:hidden space-y-3">
        {PIPELINE_STEPS.map((step) => {
          const status = stepStatuses[step.name];
          return (
            <motion.div
              key={step.name}
              className="flex items-center gap-3 glass rounded-xl px-4 py-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div
                className={`h-9 w-9 rounded-lg border-2 flex items-center justify-center flex-shrink-0 ${getStatusColor(status)}`}
              >
                {getStatusIcon(status)}
              </div>
              <span className={`text-sm font-medium ${getLabelColor(status)}`}>
                {step.label}
              </span>
              {status === "running" && (
                <span className="text-xs text-gray-500 ml-auto">
                  {step.description}
                </span>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
