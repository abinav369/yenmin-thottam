import { getFileContent } from "@/lib/getContent";
import { ContentWrapper } from "@/components/ContentWrapper";
import { cookies } from "next/headers";

export default async function Home() {
  // Get language from cookie (set by client)
  const cookieStore = await cookies();
  const language = (cookieStore.get('language')?.value as 'ta' | 'en') || 'ta';

  try {
    const result = await getFileContent(["intro", "intro"], language);

    return (
      <main className="p-10">
        <ContentWrapper result={result} language={language} />
      </main>
    );
  } catch (error) {
    return (
      <main className="p-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400">
            {language === 'ta' ? 'பிழை' : 'Error'}: {error instanceof Error ? error.message : 'Failed to load content'}
          </div>
        </div>
      </main>
    );
  }
}