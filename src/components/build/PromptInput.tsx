"use client";

import { useState, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Hammer, Upload, X, FileText, ImageIcon, Flame, Sparkles } from "lucide-react";
import { CATEGORIES, type Category } from "@/types/pipeline";
import { motion, AnimatePresence } from "framer-motion";

interface PromptInputProps {
  onSubmit: (
    prompt: string,
    category: string,
    pdfBase64?: string,
    imageBase64?: string,
    imageMimeType?: string,
    size?: string
  ) => void;
  isRunning: boolean;
}

export default function PromptInput({ onSubmit, isRunning }: PromptInputProps) {
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState<Category>("Furniture");
  const [mode, setMode] = useState<"text" | "image" | "pdf">("text");
  const [size, setSize] = useState<string>("");

  // PDF state
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBase64, setPdfBase64] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Image state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imagePrompt, setImagePrompt] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;
    setPdfFile(file);
    const buffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    setPdfBase64(base64);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    setImageMimeType(file.type);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    const buffer = await file.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    setImageBase64(base64);
  };

  const clearImage = () => {
    setImageFile(null);
    setImageBase64(null);
    setImageMimeType(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
  };

  const clearPdf = () => {
    setPdfFile(null);
    setPdfBase64(null);
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  const handleSubmit = () => {
    if (mode === "text" && !prompt.trim()) return;
    if (mode === "pdf" && !pdfBase64) return;
    if (mode === "image" && !imageBase64) return;

    // Build size context to append
    let sizeContext = "";
    if (size && size !== "custom") {
      sizeContext = `\n\nSize: ${size}`;
    } else if (size && size.startsWith("custom:")) {
      try {
        const measurements = JSON.parse(size.slice(7));
        const parts = Object.entries(measurements)
          .filter(([, v]) => v)
          .map(([k, v]) => `${k}: ${v}cm`);
        if (parts.length > 0) sizeContext = `\n\nCustom measurements: ${parts.join(", ")}`;
      } catch { /* ignore */ }
    }

    if (mode === "text") {
      onSubmit(prompt + sizeContext, category);
    } else if (mode === "pdf") {
      onSubmit("Analyze this uploaded PDF manual" + sizeContext, category, pdfBase64 || undefined);
    } else if (mode === "image") {
      const desc = imagePrompt.trim()
        ? imagePrompt + sizeContext
        : "Analyze this product image and create a complete build guide to recreate it from scratch" + sizeContext;
      onSubmit(desc, category, undefined, imageBase64 || undefined, imageMimeType || undefined);
    }
  };

  const canSubmit =
    mode === "text"
      ? prompt.trim().length > 0
      : mode === "pdf"
      ? !!pdfBase64
      : !!imageBase64;

  const modes = [
    { key: "text" as const, icon: Hammer, label: "Text Prompt" },
    { key: "image" as const, icon: ImageIcon, label: "Upload Image" },
    { key: "pdf" as const, icon: Upload, label: "Upload PDF" },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Mode Toggle */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {modes.map((m) => (
          <motion.button
            key={m.key}
            onClick={() => setMode(m.key)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-medium transition-all ${
              mode === m.key
                ? "bg-brand-gradient text-white shadow-warm-md"
                : "glass-card text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
            }`}
          >
            <m.icon className="h-4 w-4" />
            {m.label}
          </motion.button>
        ))}
      </div>

      {/* Input Area — Text */}
      <AnimatePresence mode="wait">
        {mode === "text" && (
          <motion.div
            key="text"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Build me a wooden bedside table with a drawer..."
              className="min-h-[120px] text-base resize-none rounded-2xl bg-warm-50/80 border-white/[0.05] text-gray-200 placeholder:text-gray-600 focus:border-clay-400/30 focus:ring-clay-400/10"
              disabled={isRunning}
            />
          </motion.div>
        )}

        {/* Input Area — Image Upload */}
        {mode === "image" && (
          <motion.div
            key="image"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <div className="border-2 border-dashed border-white/[0.05] rounded-2xl p-6 text-center glass-card hover:border-clay-400/15 transition-colors">
              {imageFile && imagePreview ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imagePreview}
                      alt="Uploaded product"
                      className="max-h-64 rounded-lg mx-auto object-contain"
                    />
                    <button
                      onClick={clearImage}
                      className="absolute -top-2 -right-2 p-1 bg-warm-100 rounded-full border border-white/8 hover:bg-red-500/20 transition-colors"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </button>
                  </div>
                  <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
                    <ImageIcon className="h-4 w-4 text-clay-300" />
                    <span>{imageFile.name}</span>
                    <span>({(imageFile.size / 1024).toFixed(1)} KB)</span>
                  </div>
                </div>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-clay-400/12 to-sage-400/12 flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="h-8 w-8 text-clay-300" />
                  </div>
                  <p className="text-gray-300 font-medium mb-1">
                    Upload a photo of what you want to build
                  </p>
                  <p className="text-gray-500 text-sm mb-4">
                    A blouse, furniture, product — anything you want to recreate
                  </p>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isRunning}
                    className="px-6 py-2.5 glass rounded-xl text-gray-300 text-sm font-medium hover:bg-white/[0.03] transition-all"
                  >
                    Choose Image
                  </motion.button>
                </>
              )}
            </div>

            {/* Optional description for the image */}
            {imageFile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <Textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Optional: Add details — e.g. 'I want to sew this blouse in cotton, size medium'..."
                  className="min-h-[80px] text-sm resize-none rounded-2xl bg-warm-50/80 border-white/[0.05] text-gray-200 placeholder:text-gray-600 focus:border-clay-400/30 focus:ring-clay-400/10"
                  disabled={isRunning}
                />
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Input Area — PDF Upload */}
        {mode === "pdf" && (
          <motion.div
            key="pdf"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="border-2 border-dashed border-white/[0.06] rounded-xl p-8 text-center glass hover:border-sage-400/15 transition-colors">
              {pdfFile ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-clay-400/12 to-sand-400/12 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-clay-300" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-200">{pdfFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(pdfFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    onClick={clearPdf}
                    className="ml-4 p-1 rounded-full hover:bg-red-500/20 transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-sage-400/12 to-clay-300/12 flex items-center justify-center mx-auto mb-4">
                    <Upload className="h-8 w-8 text-sage-300" />
                  </div>
                  <p className="text-gray-300 font-medium mb-1">
                    Drop a PDF manual here or click to browse
                  </p>
                  <p className="text-gray-500 text-sm mb-4">
                    We&apos;ll extract specs and generate a full build package
                  </p>
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => pdfInputRef.current?.click()}
                    disabled={isRunning}
                    className="px-6 py-2.5 glass rounded-xl text-gray-300 text-sm font-medium hover:bg-white/[0.03] transition-all"
                  >
                    Choose File
                  </motion.button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Category Selector */}
      <div className="flex flex-wrap gap-2 mt-5">
        {CATEGORIES.map((cat) => (
          <motion.button
            key={cat}
            onClick={() => setCategory(cat)}
            disabled={isRunning}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
              category === cat
                ? "bg-clay-400/10 text-clay-300 border border-clay-400/15"
                : "glass-card text-gray-600 hover:text-gray-300 hover:bg-white/[0.02]"
            }`}
          >
            {cat}
          </motion.button>
        ))}
      </div>

      {/* Size / Measurements */}
      <div className="mt-4">
        {category === "Clothing" ? (
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-400">Size & Measurements</label>
            <div className="flex flex-wrap gap-2">
              {["XS", "S", "M", "L", "XL", "XXL"].map((s) => (
                <motion.button
                  key={s}
                  onClick={() => setSize(s)}
                  disabled={isRunning}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    size === s
                      ? "bg-clay-400/10 text-clay-300 border border-clay-400/15"
                      : "glass-card text-gray-600 hover:text-gray-300 hover:bg-white/[0.02]"
                  }`}
                >
                  {s}
                </motion.button>
              ))}
              <motion.button
                onClick={() => setSize("custom")}
                disabled={isRunning}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  size === "custom"
                    ? "bg-clay-400/12 text-clay-300 border border-clay-400/20"
                    : "glass text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
                }`}
              >
                Custom
              </motion.button>
            </div>
            <AnimatePresence>
              {size === "custom" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-2 sm:grid-cols-3 gap-3"
                >
                  {[
                    { id: "bust", label: "Bust (cm)" },
                    { id: "waist", label: "Waist (cm)" },
                    { id: "hips", label: "Hips (cm)" },
                    { id: "shoulder", label: "Shoulder (cm)" },
                    { id: "armLength", label: "Arm Length (cm)" },
                    { id: "bodyLength", label: "Body Length (cm)" },
                  ].map((field) => (
                    <div key={field.id}>
                      <label className="text-xs text-gray-500 mb-1 block">{field.label}</label>
                      <input
                        type="number"
                        placeholder="—"
                        onChange={(e) => {
                          setSize((prev) => {
                            const measurements = prev.startsWith("custom:") ? JSON.parse(prev.slice(7)) : {};
                            measurements[field.id] = e.target.value;
                            return `custom:${JSON.stringify(measurements)}`;
                          });
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-warm-50 border border-white/8 text-gray-200 text-sm focus:border-clay-400/30 focus:outline-none focus:ring-1 focus:ring-clay-400/15"
                        disabled={isRunning}
                      />
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-400">Dimensions (optional)</label>
            <input
              type="text"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder={
                category === "Furniture" ? "e.g. 120cm wide x 80cm tall x 45cm deep" :
                category === "Electronics" ? "e.g. 100mm x 60mm PCB" :
                "e.g. overall dimensions..."
              }
              className="w-full px-4 py-2.5 rounded-xl bg-warm-50 border border-white/8 text-gray-200 text-sm placeholder:text-gray-600 focus:border-clay-400/30 focus:outline-none focus:ring-1 focus:ring-clay-400/15"
              disabled={isRunning}
            />
          </div>
        )}
      </div>

      {/* Submit Button */}
      <motion.button
        onClick={handleSubmit}
        disabled={isRunning || !canSubmit}
        whileHover={canSubmit && !isRunning ? { scale: 1.02 } : {}}
        whileTap={canSubmit && !isRunning ? { scale: 0.98 } : {}}
        className={`w-full mt-6 py-4 rounded-2xl text-lg font-semibold transition-all flex items-center justify-center gap-2.5 ${
          isRunning || !canSubmit
            ? "bg-warm-200 text-gray-600 cursor-not-allowed"
            : "bg-brand-gradient text-white shadow-warm-md hover:shadow-warm-lg hover:scale-[1.01] active:scale-[0.99]"
        }`}
      >
        {isRunning ? (
          <>
            <span className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Forging...
          </>
        ) : (
          <>
            <Flame className="h-5 w-5" />
            Forge It
            <Sparkles className="h-4 w-4 opacity-70" />
          </>
        )}
      </motion.button>
    </div>
  );
}
