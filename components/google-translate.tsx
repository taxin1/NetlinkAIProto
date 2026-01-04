"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "@/lib/hooks/use-translations"

declare global {
  interface Window {
    googleTranslateElementInit: () => void;
    google: any;
  }
}

export function GoogleTranslate() {
  const { lang } = useTranslations()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 1. Initial state check - if we're in Japanese, show the overlay while it loads
    if (lang === "ja") {
      setIsVisible(true)
      // On mobile, sometimes the transition takes longer, so we use a slightly longer timeout
      const timeout = window.innerWidth < 768 ? 3000 : 2000
      setTimeout(() => setIsVisible(false), timeout)
    }

    // 2. Define the init function
    window.googleTranslateElementInit = () => {
      if (window.google && window.google.translate) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,ja",
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: false,
            multilanguagePage: true,
          },
          "google_translate_element"
        );
      }
    };

    // 3. Load or Re-initialize script
    const existingScript = document.getElementById("google-translate-script");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    } else if (window.google && window.google.translate) {
      // If script exists but we need to re-init
      window.googleTranslateElementInit();
    }
  }, [lang]);

  return (
    <>
      {/* Smooth Transition Overlay during initial Japanese load */}
      {isVisible && (
        <div className="fixed inset-0 z-[10000] bg-background/90 backdrop-blur-xl flex items-center justify-center transition-opacity duration-700">
          <div className="flex flex-col items-center gap-6 p-8 rounded-3xl bg-white/5 border border-white/10 shadow-2xl">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 rounded-full animate-ping absolute inset-0"></div>
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="space-y-2 text-center">
              <p className="text-primary font-bold text-xl tracking-tight">
                {lang === "ja" ? "読み込み中..." : "Translating..."}
              </p>
              <p className="text-muted-foreground text-sm animate-pulse">
                {lang === "ja" ? "日本語に翻訳しています" : "Converting to Japanese"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div id="google_translate_element" style={{ display: 'none' }}></div>
      <style jsx global>{`
        /* Deep hide all Google UI elements to prevent layout shifts */
        .goog-te-banner-frame,
        .goog-te-gadget-simple,
        .goog-te-gadget-icon,
        .goog-te-menu-value,
        #goog-gt-tt,
        .goog-te-balloon-frame,
        .goog-te-gadget,
        .goog-te-combo,
        .skiptranslate,
        .VIpgJd-y6GSC-bN9Sve,
        iframe[id=":1.container"],
        iframe[id=":2.container"],
        #google_translate_element,
        .goog-tooltip,
        .goog-tooltip:hover {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          width: 0 !important;
          pointer-events: none !important;
          z-index: -1 !important;
        }
        
        body {
          top: 0 !important;
          position: static !important;
          min-height: 100vh !important;
        }

        /* Prevent Google's highlighting and tooltips */
        .goog-text-highlight {
          background-color: transparent !important;
          box-shadow: none !important;
          border-bottom: none !important;
        }

        /* Mobile specific fixes */
        @media (max-width: 768px) {
          body {
            overflow-x: hidden !important;
          }
        }
      `}</style>
    </>
  );
}
