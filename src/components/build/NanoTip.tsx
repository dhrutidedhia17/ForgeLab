"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Cpu } from "lucide-react";
import { useNano } from "@/hooks/useNano";

interface NanoTipProps {
  context: string;
  visible: boolean;
}

export default function NanoTip({ context, visible }: NanoTipProps) {
  const { nanoAvailable, nanoChecked, generateTip } = useNano();
  const [tip, setTip] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (!visible || !nanoAvailable || !nanoChecked || requested || !context) return;

    setRequested(true);
    setLoading(true);

    generateTip(context).then((result) => {
      setTip(result);
      setLoading(false);
    });
  }, [visible, nanoAvailable, nanoChecked, context, requested, generateTip]);

  if (!nanoAvailable || !nanoChecked) return null;
  if (!tip && !loading) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="mt-3"
    >
      <div className="flex items-start gap-2.5 bg-indigo-500/8 border border-indigo-500/15 rounded-xl px-4 py-3">
        <Lightbulb className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {loading ? (
            <p className="text-xs text-indigo-300/70 animate-pulse">
              Generating on-device tip...
            </p>
          ) : (
            <p className="text-xs text-indigo-300/90 leading-relaxed">{tip}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <Cpu className="h-3 w-3 text-indigo-500/50" />
          <span className="text-[9px] text-indigo-500/50 font-medium whitespace-nowrap">
            Gemini Nano
          </span>
        </div>
      </div>
    </motion.div>
  );
}
