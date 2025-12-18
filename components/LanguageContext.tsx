"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'ta' | 'en';
type Theme = 'dark' | 'light';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  t: (key: string) => string;
}

const translations = {
  ta: {
    contents: 'பொருளடக்கம்',
    introduction: 'அறிமுகம்',
    collapse: 'மூடு',
    expand: 'விரி',
    switchToEnglish: 'English',
    switchToTamil: 'தமிழ்',
    loading: 'ஏற்றுகிறது...',
    contentNotFound: 'உள்ளடக்கம் கிடைக்கவில்லை',
    error: 'பிழை',
    closeSidebar: 'பக்கப்பட்டியை மூடு',
    openSidebar: 'பக்கப்பட்டியைத் திற',
    collapseAll: 'அனைத்தையும் மூடு',
    expandAll: 'அனைத்தையும் விரி',
  },
  en: {
    contents: 'Contents',
    introduction: 'Introduction',
    collapse: 'Collapse',
    expand: 'Expand',
    switchToEnglish: 'English',
    switchToTamil: 'தமிழ்',
    loading: 'Loading...',
    contentNotFound: 'Content not found',
    error: 'Error',
    closeSidebar: 'Close sidebar',
    openSidebar: 'Open sidebar',
    collapseAll: 'Collapse all',
    expandAll: 'Expand all',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children, initialLanguage }: { children: React.ReactNode; initialLanguage?: 'ta' | 'en' }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage || 'ta');
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // ALWAYS prioritize cookie over localStorage
    const cookies = document.cookie.split(';');
    const langCookie = cookies.find(c => c.trim().startsWith('language='));
    
    if (langCookie) {
      const cookieLang = langCookie.split('=')[1].trim() as Language;
      console.log('Found language cookie:', cookieLang);
      if (cookieLang === 'ta' || cookieLang === 'en') {
        setLanguageState(cookieLang);
        localStorage.setItem('language', cookieLang);
      }
    } else {
      // Only if no cookie, check localStorage
      const saved = localStorage.getItem('language') as Language;
      console.log('No cookie, checking localStorage:', saved);
      if (saved && (saved === 'ta' || saved === 'en')) {
        setLanguageState(saved);
        document.cookie = `language=${saved}; path=/; max-age=31536000`;
      } else {
        // Default to Tamil
        console.log('No saved language, defaulting to Tamil');
        setLanguageState('ta');
        document.cookie = `language=ta; path=/; max-age=31536000`;
      }
    }
    
    // Load theme from localStorage and apply immediately
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && (savedTheme === 'dark' || savedTheme === 'light')) {
      console.log('Loading saved theme:', savedTheme);
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    } else {
      console.log('No saved theme, defaulting to dark');
      applyTheme('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    console.log('Applying theme:', newTheme);
    const root = document.documentElement;
    
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      console.log('Dark class added, classes:', root.className);
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      console.log('Light class added, classes:', root.className);
    }
  };

  const setLanguage = (lang: Language) => {
    console.log('Setting language to:', lang);
    setLanguageState(lang);
    if (mounted) {
      localStorage.setItem('language', lang);
      document.cookie = `language=${lang}; path=/; max-age=31536000; SameSite=Lax`;
      console.log('Language cookie set:', document.cookie);
    }
  };

  const setTheme = (newTheme: Theme) => {
    console.log('setTheme called with:', newTheme);
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations['ta']] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, theme, setTheme, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}