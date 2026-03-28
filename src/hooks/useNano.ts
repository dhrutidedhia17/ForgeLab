"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook for Gemini Nano (Chrome Built-in AI) on-device inference.
 * Provides quick build tips without server round-trips.
 * Falls back gracefully if Nano is unavailable.
 */

interface NanoState {
  available: boolean;
  loading: boolean;
  checked: boolean;
}

// Extend Window type for Chrome's Built-in AI
declare global {
  interface Window {
    LanguageModel?: {
      availability: () => Promise<string>;
      create: (options?: {
        initialPrompts?: { role: string; content: string }[];
      }) => Promise<{
        prompt: (text: string) => Promise<string>;
        promptStreaming: (text: string) => ReadableStream<string>;
        destroy: () => void;
      }>;
    };
  }
}

export function useNano() {
  const [state, setState] = useState<NanoState>({
    available: false,
    loading: true,
    checked: false,
  });
  const sessionRef = useRef<{
    prompt: (text: string) => Promise<string>;
    destroy: () => void;
  } | null>(null);

  // Check availability on mount
  useEffect(() => {
    async function checkAvailability() {
      try {
        if (typeof window === "undefined") {
          setState({ available: false, loading: false, checked: true });
          return;
        }

        // Check for the LanguageModel API
        const LM =
          window.LanguageModel ||
          ((window as unknown as Record<string, Record<string, unknown>>).ai?.languageModel as typeof window.LanguageModel);

        if (!LM || typeof LM.availability !== "function") {
          setState({ available: false, loading: false, checked: true });
          return;
        }

        const status = await LM.availability();
        const isAvailable = status === "readily" || status === "available";

        if (isAvailable) {
          // Pre-create a session for quick responses
          try {
            const session = await LM.create({
              initialPrompts: [
                {
                  role: "system",
                  content:
                    "You are a concise DIY build tip generator. Given a build step or material, provide ONE practical tip in 1-2 sentences. Be specific and actionable. Do not use markdown formatting.",
                },
              ],
            });
            sessionRef.current = session as {
              prompt: (text: string) => Promise<string>;
              destroy: () => void;
            };
          } catch {
            // Session creation failed, but Nano is still available
          }
        }

        setState({ available: isAvailable, loading: false, checked: true });
      } catch {
        setState({ available: false, loading: false, checked: true });
      }
    }

    checkAvailability();

    return () => {
      if (sessionRef.current) {
        try {
          sessionRef.current.destroy();
        } catch {
          // Ignore cleanup errors
        }
      }
    };
  }, []);

  const generateTip = useCallback(
    async (context: string): Promise<string | null> => {
      if (!state.available) return null;

      try {
        // Use existing session if available
        if (sessionRef.current) {
          return await sessionRef.current.prompt(
            `Give a quick practical tip for this build step: ${context}`
          );
        }

        // Try creating a new session
        const LM =
          window.LanguageModel ||
          ((window as unknown as Record<string, Record<string, unknown>>).ai?.languageModel as typeof window.LanguageModel);
        if (!LM) return null;

        const session = await LM.create();
        const result = await (
          session as { prompt: (text: string) => Promise<string> }
        ).prompt(`Give a quick practical tip for this build step: ${context}`);
        (session as { destroy: () => void }).destroy();
        return result;
      } catch {
        return null;
      }
    },
    [state.available]
  );

  return {
    nanoAvailable: state.available,
    nanoLoading: state.loading,
    nanoChecked: state.checked,
    generateTip,
  };
}
