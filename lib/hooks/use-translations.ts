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
    const domain = window.location.hostname === 'localhost' ? '' : `; domain=.${window.location.hostname.split('.').slice(-2).join('.')}`
    
    // Set for both exact domain and root domain for maximum coverage
    document.cookie = `googtrans=${cookieValue}; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT${domain}`
    document.cookie = `googtrans=${cookieValue}; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT`
    
    // If switching to English, we should also try to clear the cookie as backup
    if (newLang === 'en') {
      document.cookie = "googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT"
      document.cookie = `googtrans=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT${domain}`
    }
    
    window.dispatchEvent(new Event("languageChanged"))
    
    // Use a small delay then reload - this is the ONLY way to ensure 
    // the entire website translates perfectly as requested.
    setTimeout(() => {
      window.location.reload()
    }, 150)
  }

  return { t, lang, changeLanguage }
}
