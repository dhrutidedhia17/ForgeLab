"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Maximize2 } from "lucide-react";

interface ModelViewerProps {
  src: string;
  alt?: string;
  poster?: string;
}

export default function ModelViewer({ src, alt = "3D Model", poster }: ModelViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    // Dynamically import model-viewer to avoid SSR issues
    import("@google/model-viewer").catch((err) => {
      console.error("Failed to load model-viewer:", err);
      setError(true);
    });
  }, []);

  // Attach event listeners via refs (web component events don't work as React props)
  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;

    const onLoad = () => setLoaded(true);
    const onError = () => setError(true);

    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);

    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  if (error) {
    return (
      <div className="rounded-xl bg-warm-100 border border-white/10 h-64 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Failed to load 3D viewer</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative rounded-xl overflow-hidden border border-white/10 bg-gradient-to-b from-gray-900 to-gray-950">
      {/* Loading overlay */}
      {!loaded && (
        <motion.div
          initial={{ opacity: 1 }}
          className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-warm-100"
        >
          <div className="h-10 w-10 border-2 border-clay-400/30 border-t-clay-400 rounded-full animate-spin mb-3" />
          <p className="text-gray-400 text-sm">Loading 3D model...</p>
        </motion.div>
      )}

      {/* Controls overlay */}
      {loaded && (
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-black/60 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/80 transition-all"
            title="Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Instructions overlay */}
      {loaded && (
        <div className="absolute bottom-3 left-3 z-10 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5 text-[11px] text-white/60 flex items-center gap-2">
          <RotateCcw className="h-3 w-3" />
          Drag to rotate · Scroll to zoom · Shift+drag to pan
        </div>
      )}

      {/* model-viewer web component */}
      <model-viewer
        ref={viewerRef}
        src={src}
        alt={alt}
        auto-rotate
        camera-controls
        shadow-intensity="1"
        shadow-softness="0.5"
        exposure="1"
        environment-image="neutral"
        poster={poster}
        style={{
          width: "100%",
          height: isFullscreen ? "100vh" : "450px",
          backgroundColor: "transparent",
          "--poster-color": "transparent",
        } as React.CSSProperties}
      />
    </div>
  );
}
