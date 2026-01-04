"use client"

import { useState, useEffect, useCallback } from "react"
import { translations, Language, TranslationKeys } from "../translations"

export function useTranslations() {
  const [lang, setLang] = useState<Language>("en")

  useEffect(() => {
    const savedLang = localStorage.getItem("app-language") as Language
    if (savedLang && (savedLang === "en" || savedLang === "ja")) {
      setLang(savedLang)
    }

    const handleLanguageChange = () => {
      const newLang = localStorage.getItem("app-language") as Language
      if (newLang && (newLang === "en" || newLang === "ja")) {
        setLang(newLang)
      }
    }

    window.addEventListener("languageChanged", handleLanguageChange)
    return () => window.removeEventListener("languageChanged", handleLanguageChange)
  }, [])

  const t = useCallback((key: TranslationKeys) => {
    return translations[lang][key] || translations.en[key]
  }, [lang])

  const changeLanguage = (newLang: Language) => {
    if (newLang === lang) return;
    
    setLang(newLang)
    localStorage.setItem("app-language", newLang)
    
    // Set Google Translate cookie - this is the most important part
    const cookieValue = `/en/${newLang}`
    document.cookie = `googtrans=${cookieValue}; path=/`
    document.cookie = `googtrans=${cookieValue}; path=/; domain=${window.location.hostname}`
    
    window.dispatchEvent(new Event("languageChanged"))
    
    // Use a small delay then reload - this is the ONLY way to ensure 
    // the entire website translates perfectly as requested.
    setTimeout(() => {
      window.location.reload()
    }, 150)
  }

  return { t, lang, changeLanguage }
}
