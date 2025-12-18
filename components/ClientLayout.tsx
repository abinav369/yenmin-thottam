"use client";

import { LanguageProvider } from "./LanguageContext";
import Sidebar from "./Sidebar";
import type { ContentItem } from "@/lib/getContent";

type ClientLayoutProps = {
  data: {
    category: string;
    items: ContentItem[];
  }[];
  initialLanguage: 'ta' | 'en';
  children: React.ReactNode;
};

export function ClientLayout({ data, initialLanguage, children }: ClientLayoutProps) {
  return (
    <LanguageProvider initialLanguage={initialLanguage}>
      <Sidebar data={data} initialLanguage={initialLanguage} />
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </LanguageProvider>
  );
}