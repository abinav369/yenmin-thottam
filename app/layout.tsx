import "./globals.css"
import { getCategoriesAndfiles } from "@/lib/getContent";
import { ClientLayout } from "@/components/ClientLayout";
import { cookies } from "next/headers";

export const metadata = {
    title: "எண்மின் தோட்டம்",
};

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
  const data = getCategoriesAndfiles();
  const cookieStore = await cookies();
  const initialLanguage = (cookieStore.get('language')?.value as 'ta' | 'en') || 'ta';

  return (
    <html lang="ta" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                if (theme === 'dark' || (!theme && true)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="flex min-h-screen">
        <ClientLayout data={data} initialLanguage={initialLanguage}>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}