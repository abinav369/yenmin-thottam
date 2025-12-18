"use client";

import { useLanguage } from "./LanguageContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type ContentWrapperProps = {
  result: 
    | { content: React.ReactElement; isMDX: true }
    | { contentHtml: string; isMDX: false };
  language: 'ta' | 'en';
};

export function ContentWrapper({ result, language: serverLanguage }: ContentWrapperProps) {
  const { language: clientLanguage } = useLanguage();
  const router = useRouter();

  // When client language changes, refresh the page to get new content
  useEffect(() => {
    console.log('ContentWrapper - Server language:', serverLanguage, 'Client language:', clientLanguage);
    
    if (clientLanguage !== serverLanguage) {
      console.log('Language mismatch detected, refreshing...');
      // Don't set cookie here - it's already set by LanguageContext
      router.refresh();
    }
  }, [clientLanguage, serverLanguage, router]);

  return (
    <article className="prose prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-blue-400 prose-strong:text-gray-100 prose-code:text-gray-300 max-w-none">
      {result.isMDX ? (
        result.content
      ) : (
        <div dangerouslySetInnerHTML={{ __html: result.contentHtml || '' }} />
      )}
    </article>
  );
}