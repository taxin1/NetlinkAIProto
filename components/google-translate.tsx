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
      setTimeout(() => setIsVisible(false), 2000) // Auto-hide after 2s
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
          },
          "google_translate_element"
        );
      }
    };

    // 3. Load script
    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  return (
    <>
      {/* Smooth Transition Overlay during initial Japanese load */}
      {isVisible && (
        <div className="fixed inset-0 z-[10000] bg-background/80 backdrop-blur-md flex items-center justify-center transition-opacity duration-500">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-primary font-medium animate-pulse text-lg">
              日本語に翻訳中...
            </p>
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
        .VIpgJd-y6GSC-bN9Sve {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          height: 0 !important;
          width: 0 !important;
          pointer-events: none !important;
        }
        
        body {
          top: 0 !important;
          position: static !important;
        }

        /* Prevent Google's highlighting and tooltips */
        .goog-text-highlight {
          background-color: transparent !important;
          box-shadow: none !important;
        }
        
        #google_translate_element {
          display: none !important;
        }
      `}</style>
    </>
  );
}
