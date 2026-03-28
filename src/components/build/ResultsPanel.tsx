"use client";

import StepCard from "./StepCard";
import { PIPELINE_STEPS, type StepName, type StepResult } from "@/types/pipeline";
import { Sparkles } from "lucide-react";

interface ResultsPanelProps {
  results: Record<StepName, StepResult>;
  visible: boolean;
}

export default function ResultsPanel({ results, visible }: ResultsPanelProps) {
  if (!visible) return null;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 mt-10">
      <h2 className="text-xl font-bold text-white flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-clay-300" />
        Results
      </h2>
      {PIPELINE_STEPS.map((step) => (
        <StepCard key={step.name} stepResult={results[step.name]} />
      ))}
    </div>
  );
}
