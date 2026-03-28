"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Download,
  AlertCircle,
  Loader2,
  Check,
  Sparkles,
} from "lucide-react";
import type {
  StepResult,
  ResearchResult,
  VendorResult,
  Model3DResult,
  BlueprintResult,
  ImageResult,
  VideoResult,
} from "@/types/pipeline";
import { PIPELINE_STEPS } from "@/types/pipeline";
import NanoTip from "./NanoTip";
import dynamic from "next/dynamic";

const ModelViewer = dynamic(() => import("./ModelViewer"), { ssr: false });
const Model3DViewer = dynamic(() => import("./Model3DViewer"), { ssr: false });

interface StepCardProps {
  stepResult: StepResult;
}

export default function StepCard({ stepResult }: StepCardProps) {
  const [isOpen, setIsOpen] = useState(stepResult.status === "complete");
  const stepInfo = PIPELINE_STEPS.find((s) => s.name === stepResult.step)!;

  const statusBadge = () => {
    switch (stepResult.status) {
      case "complete":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15">
            <Check className="h-3 w-3 mr-1" /> Complete
          </Badge>
        );
      case "running":
        return (
          <Badge className="bg-clay-400/12 text-clay-300 border-clay-400/15 hover:bg-clay-400/12">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Running
          </Badge>
        );
      case "error":
        return (
          <Badge className="bg-red-500/15 text-red-400 border-red-500/20 hover:bg-red-500/15">
            <AlertCircle className="h-3 w-3 mr-1" /> Error
          </Badge>
        );
      default:
        return (
          <Badge className="bg-white/5 text-gray-500 border-white/10">Pending</Badge>
        );
    }
  };

  const renderContent = () => {
    if (stepResult.status === "error") {
      return (
        <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <AlertCircle className="h-4 w-4 inline mr-2" />
          {stepResult.error || "An error occurred during this step."}
        </div>
      );
    }
    if (stepResult.status !== "complete" || !stepResult.result) return null;

    switch (stepResult.step) {
      case "research":
        return <ResearchContent result={stepResult.result as ResearchResult} />;
      case "vendors":
        return <VendorContent result={stepResult.result as VendorResult} />;
      case "model3d":
        return <Model3DContent result={stepResult.result as Model3DResult} />;
      case "blueprint":
        return <BlueprintContent result={stepResult.result as BlueprintResult} />;
      case "image":
        return <ImageContent result={stepResult.result as ImageResult} />;
      case "video":
        return <VideoContent result={stepResult.result as VideoResult} />;
    }
  };

  return (
    <motion.div
      className="glass rounded-2xl overflow-hidden hover:bg-white/[0.04] transition-all"
      whileHover={{ y: -1 }}
    >
      <div
        className="cursor-pointer px-5 py-4"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="text-base font-semibold text-gray-200 flex items-center gap-2">
            {stepInfo.label}
            {stepResult.isMock && (
              <Badge className="text-xs bg-amber-500/15 text-amber-400 border-amber-500/20">
                <Sparkles className="h-3 w-3 mr-1" />
                MOCK
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {statusBadge()}
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-500" />
            )}
          </div>
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 pt-0">
              {renderContent()}
              {stepResult.status === "complete" && stepResult.result && (
                <NanoTip
                  context={`Step: ${stepInfo.label}. ${stepInfo.description}`}
                  visible={stepResult.status === "complete"}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function ResearchContent({ result }: { result: ResearchResult }) {
  return (
    <div className="space-y-5 text-sm">
      <div>
        <h4 className="font-semibold text-white mb-1">{result.title}</h4>
        <p className="text-gray-400 leading-relaxed">{result.overview}</p>
      </div>
      <div className="flex gap-3">
        <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/20">{result.difficulty}</Badge>
        <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/20">{result.estimatedTime}</Badge>
      </div>
      <div>
        <h5 className="font-medium text-gray-300 mb-2">Materials</h5>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/10">
              <th className="pb-2 text-gray-500 font-medium">Item</th>
              <th className="pb-2 text-gray-500 font-medium">Qty</th>
              <th className="pb-2 text-gray-500 font-medium">Spec</th>
            </tr>
          </thead>
          <tbody>
            {result.materials.map((m, i) => (
              <tr key={i} className="border-b border-white/5">
                <td className="py-2 text-gray-300">{m.name}</td>
                <td className="py-2 text-gray-400">{m.quantity}</td>
                <td className="py-2 text-gray-400">{m.specification}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div>
        <h5 className="font-medium text-gray-300 mb-2">Tools Required</h5>
        <div className="flex flex-wrap gap-2">
          {result.tools.map((tool, i) => (
            <Badge key={i} className="bg-white/5 text-gray-400 border-white/10">{tool}</Badge>
          ))}
        </div>
      </div>
      <div>
        <h5 className="font-medium text-gray-300 mb-3">Build Steps</h5>
        <ol className="space-y-3">
          {result.steps.map((step) => (
            <li key={step.stepNumber} className="flex gap-3">
              <span className="flex-shrink-0 h-7 w-7 rounded-lg bg-clay-400/12 text-clay-300 text-xs flex items-center justify-center font-semibold">
                {step.stepNumber}
              </span>
              <div>
                <p className="font-medium text-gray-200">{step.title}</p>
                <p className="text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      {result.safetyNotes.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
          <h5 className="font-medium text-amber-400 mb-2">Safety Notes</h5>
          <ul className="list-disc list-inside text-amber-300/80 space-y-1">
            {result.safetyNotes.map((note, i) => (
              <li key={i}>{note}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function VendorContent({ result }: { result: VendorResult }) {
  return (
    <div className="space-y-5 text-sm">
      {result.vendors.map((entry, i) => (
        <div key={i}>
          <h5 className="font-medium text-gray-300 mb-2">{entry.material}</h5>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-2 text-gray-500 font-medium">Supplier</th>
                <th className="pb-2 text-gray-500 font-medium">Price Range</th>
                <th className="pb-2 text-gray-500 font-medium">Link</th>
              </tr>
            </thead>
            <tbody>
              {entry.suppliers.map((s, j) => (
                <tr key={j} className="border-b border-white/5">
                  <td className="py-2 text-gray-300">{s.name}</td>
                  <td className="py-2 text-gray-400">{s.priceRange}</td>
                  <td className="py-2">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-clay-300 hover:text-clay-200 transition-colors"
                    >
                      Visit →
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

function Model3DContent({ result }: { result: Model3DResult }) {
  const [activeView, setActiveView] = useState(0);
  const [showViewer, setShowViewer] = useState(true);
  const views = result.views || [];
  const isGlb = result.format === "glb" || result.fileName?.endsWith(".glb");

  // Interactive procedural 3D scene (Gemini-generated shapes)
  if (result.sceneData && result.sceneData.shapes.length > 0) {
    return (
      <div className="space-y-4">
        {views.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowViewer(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showViewer
                  ? "bg-clay-400/15 text-clay-300 border border-clay-400/30"
                  : "glass text-gray-500 hover:text-gray-300"
              }`}
            >
              🎮 Interactive 3D
            </button>
            <button
              onClick={() => setShowViewer(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !showViewer
                  ? "bg-clay-400/15 text-clay-300 border border-clay-400/30"
                  : "glass text-gray-500 hover:text-gray-300"
              }`}
            >
              📸 Photo Views
            </button>
          </div>
        )}

        {showViewer ? (
          <div className="relative">
            <Model3DViewer sceneData={result.sceneData} />
            <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-1.5 text-[10px] text-gray-400">
              Drag to rotate · Scroll to zoom
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200 border border-white/10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={views[activeView].filePath}
                    alt={views[activeView].angle}
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-white font-medium">
                {views[activeView].angle}
              </div>
            </div>
            {views.length > 1 && (
              <div className="flex gap-2 justify-center">
                {views.map((view, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveView(i)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all w-20 h-20 ${
                      activeView === i
                        ? "border-clay-400 shadow-[0_0_12px_rgba(184,148,110,0.2)]"
                        : "border-white/10 hover:border-white/30 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={view.filePath} alt={view.angle} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white text-center py-0.5 font-medium">
                      {view.angle.replace(" View", "")}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Interactive 3D viewer for GLB models
  if (isGlb) {
    return (
      <div className="space-y-4">
        {/* Toggle between 3D viewer and image views */}
        {views.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={() => setShowViewer(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showViewer
                  ? "bg-clay-400/15 text-clay-300 border border-clay-400/30"
                  : "glass text-gray-500 hover:text-gray-300"
              }`}
            >
              🎮 Interactive 3D
            </button>
            <button
              onClick={() => setShowViewer(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !showViewer
                  ? "bg-clay-400/15 text-clay-300 border border-clay-400/30"
                  : "glass text-gray-500 hover:text-gray-300"
              }`}
            >
              📸 Photo Views
            </button>
          </div>
        )}

        {showViewer ? (
          /* Interactive 3D Model Viewer */
          <ModelViewer
            src={result.filePath}
            alt={result.fileName}
            poster={views.length > 0 ? views[0].filePath : undefined}
          />
        ) : (
          /* Image views fallback */
          <div className="space-y-4">
            <div className="relative rounded-xl overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200 border border-white/10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeView}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={views[activeView].filePath}
                    alt={views[activeView].angle}
                    className="w-full h-auto max-h-[400px] object-contain"
                  />
                </motion.div>
              </AnimatePresence>
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-white font-medium">
                {views[activeView].angle}
              </div>
            </div>
            {views.length > 1 && (
              <div className="flex gap-2 justify-center">
                {views.map((view, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveView(i)}
                    className={`relative rounded-lg overflow-hidden border-2 transition-all w-20 h-20 ${
                      activeView === i
                        ? "border-clay-400 shadow-[0_0_12px_rgba(184,148,110,0.2)]"
                        : "border-white/10 hover:border-white/30 opacity-60 hover:opacity-100"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={view.filePath} alt={view.angle} className="w-full h-full object-cover" />
                    <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white text-center py-0.5 font-medium">
                      {view.angle.replace(" View", "")}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Download GLB */}
        <a href={result.filePath} download={result.fileName}>
          <button className="w-full glass rounded-xl py-3 text-gray-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
            <Download className="h-4 w-4" />
            Download 3D Model ({result.fileName})
          </button>
        </a>
      </div>
    );
  }

  // Multi-angle image views (Gemini fallback)
  if (views.length > 0) {
    return (
      <div className="space-y-4">
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-b from-gray-100 to-gray-200 border border-white/10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={views[activeView].filePath}
                alt={views[activeView].angle}
                className="w-full h-auto max-h-[400px] object-contain"
              />
            </motion.div>
          </AnimatePresence>
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-white font-medium">
            {views[activeView].angle}
          </div>
        </div>

        {views.length > 1 && (
          <div className="flex gap-2 justify-center">
            {views.map((view, i) => (
              <button
                key={i}
                onClick={() => setActiveView(i)}
                className={`relative rounded-lg overflow-hidden border-2 transition-all w-20 h-20 ${
                  activeView === i
                    ? "border-clay-400 shadow-[0_0_12px_rgba(184,148,110,0.2)]"
                    : "border-white/10 hover:border-white/30 opacity-60 hover:opacity-100"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={view.filePath} alt={view.angle} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white text-center py-0.5 font-medium">
                  {view.angle.replace(" View", "")}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-2">
          {views.map((view, i) => (
            <a key={i} href={view.filePath} download={view.fileName}>
              <button className="w-full glass rounded-xl py-2.5 text-gray-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
                <Download className="h-4 w-4" />
                Download {view.angle}
              </button>
            </a>
          ))}
        </div>
      </div>
    );
  }

  // Fallback for STEP files or mock
  return (
    <div className="space-y-4">
      <div className="bg-warm-100 rounded-xl h-64 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-300">3D Model</p>
          <p className="text-sm text-gray-500">Format: {result.format}</p>
        </div>
      </div>
      {result.filePath && (
        <a href={result.filePath} download={result.fileName}>
          <button className="w-full glass rounded-xl py-3 text-gray-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
            <Download className="h-4 w-4" />
            Download {result.fileName}
          </button>
        </a>
      )}
    </div>
  );
}

function BlueprintContent({ result }: { result: BlueprintResult }) {
  return (
    <div className="space-y-4">
      {result.svgContent ? (
        <div className="rounded-xl border border-white/10 bg-white">
          <div
            className="w-full overflow-x-auto overflow-y-auto max-h-[700px] p-4"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            <div
              className="min-w-[800px] w-full"
              style={{ aspectRatio: "1400 / 1000" }}
              dangerouslySetInnerHTML={{
                __html: result.svgContent.replace(
                  /<svg([^>]*)>/,
                  '<svg$1 style="width:100%;height:100%;display:block;">'
                ),
              }}
            />
          </div>
        </div>
      ) : result.format === "svg" || result.format === "png" ? (
        <div className="rounded-xl overflow-auto bg-white/5 border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={result.filePath}
            alt="Blueprint"
            className="w-full h-auto min-w-[800px]"
          />
        </div>
      ) : (
        <div className="bg-warm-100 rounded-xl h-64 flex items-center justify-center text-gray-500">
          Blueprint ({result.format})
        </div>
      )}
      <a href={result.filePath} download={result.fileName}>
        <button className="w-full glass rounded-xl py-3 text-gray-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
          <Download className="h-4 w-4" />
          Download {result.fileName}
        </button>
      </a>
    </div>
  );
}

function ImageContent({ result }: { result: ImageResult }) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl overflow-hidden bg-white/5 border border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={result.filePath}
          alt="Product render"
          className="w-full h-auto"
        />
      </div>
      <a href={result.filePath} download={result.fileName}>
        <button className="w-full glass rounded-xl py-3 text-gray-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-all">
          <Download className="h-4 w-4" />
          Download {result.fileName}
        </button>
      </a>
    </div>
  );
}

function VideoContent({ result }: { result: VideoResult }) {
  return (
    <div className="space-y-5">
      {/* Video Clips */}
      <div className="space-y-4">
        <h5 className="text-sm font-medium text-gray-300">Video Clips</h5>
        {result.clips.map((clip, i) => (
          <div key={i}>
            <p className="text-sm font-medium text-gray-400 mb-2">
              {clip.description}
            </p>
            <video
              controls
              className="w-full rounded-xl bg-black/50"
              src={clip.filePath}
            />
          </div>
        ))}
      </div>

      {/* Background Music (integrated into video step) */}
      {result.music && (
        <div className="border-t border-white/10 pt-4">
          <h5 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            🎵 Background Music
          </h5>
          <p className="text-xs text-gray-500 mb-2">
            Play this while you build ({result.music.duration})
          </p>
          <audio controls className="w-full" src={result.music.filePath} />
          <a href={result.music.filePath} download={result.music.fileName}>
            <button className="w-full glass rounded-xl py-2.5 text-gray-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-white/5 transition-all mt-2">
              <Download className="h-4 w-4" />
              Download {result.music.fileName}
            </button>
          </a>
        </div>
      )}
    </div>
  );
}
