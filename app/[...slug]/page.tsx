import { getFileContent } from "@/lib/getContent";
import { ContentWrapper } from "@/components/ContentWrapper";
import { cookies } from "next/headers";

type PageProps = {
  params: Promise<{
    slug: string[];
  }>;
};

export default async function ContentPage({ params }: PageProps) {
  const { slug } = await params;
  
  // Get language from cookie
  const cookieStore = await cookies();
  const language = (cookieStore.get('language')?.value as 'ta' | 'en') || 'ta';

  try {
    // Very important: Decode Tamil slugs
    const decodedSlug = slug.map(s => decodeURIComponent(s));

    const result = await getFileContent(decodedSlug, language);

    return <ContentWrapper result={result} language={language} />;
  } catch (error) {
    return (
      <article className="prose prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-blue-400 prose-strong:text-gray-100 prose-code:text-gray-300 max-w-none">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-400">
            {language === 'ta' ? 'பிழை' : 'Error'}: {error instanceof Error ? error.message : 'Failed to load content'}
          </div>
        </div>
      </article>
    );
  }
}