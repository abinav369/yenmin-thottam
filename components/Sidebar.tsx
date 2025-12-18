"use client";

import { usePathname } from "next/navigation";
import { useMemo, useState, useEffect, useRef } from "react";
import type { ContentItem } from "@/lib/getContent";
import { useLanguage } from "./LanguageContext";

type SidebarProps = {
  data: {
    category: string;
    displayName?: { ta: string; en: string };
    items: ContentItem[];
  }[];
  initialLanguage?: 'ta' | 'en';
  children?: React.ReactNode;
};

function RenderItems({ 
  items, 
  basePath, 
  pathname,
  openFolders,
  toggleFolder,
  initialLanguage,
  mounted
}: { 
  items: ContentItem[]; 
  basePath: string; 
  pathname: string;
  openFolders: Set<string>;
  toggleFolder: (path: string) => void;
  initialLanguage: 'ta' | 'en';
  mounted: boolean;
}) {
  return (
    <ul className="ml-4 mt-1 space-y-1 relative">
      {/* TREE VERTICAL LINE */}
      <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-700" style={{ marginLeft: '-0.5rem' }}></div>

      {items.map((item) => {
        if (item.type === 'file') {
          const href = `${basePath}/${item.path}`;
          const decodedPathname = decodeURIComponent(pathname);
          const isActive = decodedPathname === href;

          return (
            <li key={item.path} className="relative">
              {/* TREE HORIZONTAL LINE FOR FILES */}
              <div className="absolute left-0 top-1/2 w-2 h-px bg-gray-500" style={{ marginLeft: '-0.5rem' }}></div>

              <a
                href={href}
                className={`block pl-3 ${
                  isActive
                    ? "text-[#00FFFF] font-semibold"
                    : "text-[#9CA3AF] hover:text-[#00CCCC]"
                }`}
              >
                <span suppressHydrationWarning>
                  {item.displayName?.[initialLanguage] || item.name}
                </span>
              </a>
            </li>
          );
        } else {
          const folderFullPath = `${basePath}/${item.path}`;
          const isOpen = openFolders.has(folderFullPath);

          return (
            <li key={item.path} className="mb-2 relative">
              {/* TREE HORIZONTAL LINE FOR FOLDERS */}
              <div className="absolute left-0 top-3 w-2 h-px bg-gray-500" style={{ marginLeft: '-0.5rem' }}></div>

              <details open={isOpen}>
                <summary 
                  className="cursor-pointer font-medium text-gray-300 hover:text-[#00CCCC] pl-3"
                  onClick={(e) => {
                    e.preventDefault(); 
                    toggleFolder(folderFullPath);
                  }}
                >
                  <span suppressHydrationWarning>
                    {item.displayName?.[initialLanguage] || item.name}
                  </span>
                </summary>
                <RenderItems 
                  items={item.children} 
                  basePath={folderFullPath} 
                  pathname={pathname}
                  openFolders={openFolders}
                  toggleFolder={toggleFolder}
                  initialLanguage={initialLanguage}
                  mounted={mounted}
                />
              </details>
            </li>
          );
        }
      })}
    </ul>
  );
}

export default function Sidebar({ data, initialLanguage = 'ta', children }: SidebarProps) {
  const pathname = usePathname();
  const { language, setLanguage, theme, setTheme, t } = useLanguage();
  const [open, setOpen] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeCategory = useMemo(() => {
    const parts = pathname.split('/').filter(p => p.length > 0);
    const category = parts.length > 0 ? decodeURIComponent(parts[0]) : '';
    console.log('Active category:', category, 'from pathname:', pathname);
    return category;
  }, [pathname]);

  const [openFolders, setOpenFolders] = useState<Set<string>>(() => {
    // Initialize with current path's folders
    const parts = pathname.split('/').filter(p => p.length > 0);
    const folders = new Set<string>();
    let current = "";
    for (let i = 0; i < parts.length - 1; i++) {
      current += `/${decodeURIComponent(parts[i])}`;
      folders.add(current);
    }
    return folders;
  });
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => {
    const parts = pathname.split('/').filter(p => p.length > 0);
    const category = parts.length > 0 ? decodeURIComponent(parts[0]) : '';
    return category ? new Set([category]) : new Set();
  });

  // Only update folders when navigating to a new path, not on every render
  const prevPathnameRef = useRef(pathname);
  
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      
      const parts = decodeURIComponent(pathname)
        .split('/')
        .filter(Boolean);

      setOpenFolders((prev) => {
        const newSet = new Set(prev);
        let current = "";
        
        for (let i = 0; i < parts.length - 1; i++) {
          current += `/${parts[i]}`;
          if (!prev.has(current)) {
            newSet.add(current);
          }
        }
        
        return newSet.size !== prev.size ? newSet : prev;
      });
    }
  }, [pathname]);

  
  const allFolderPaths = useMemo(() => {
    const paths = new Set<string>();
    const gatherPaths = (items: ContentItem[], basePath: string) => {
      items.forEach((item) => {
        if (item.type === 'folder') {
          const folderPath = `${basePath}/${item.path}`;
          paths.add(folderPath);
          gatherPaths(item.children, folderPath);
        }
      });
    };
    data.forEach((cat) => {
      if (cat.category !== "intro") {
        gatherPaths(cat.items, `/${cat.category}`);
      }
    });
    return paths;
  }, [data]);

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const toggleCategory = (category: string) => {
    setOpenCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  const collapseAll = () => {
    setOpenFolders(new Set());
    setOpenCategories(new Set());
  };

  const expandAll = () => {
    setOpenFolders(new Set(allFolderPaths)); 
    const allCats = new Set<string>();
    data.forEach(cat => {
      if (cat.category !== "intro") {
        allCats.add(cat.category);
      }
    });
    setOpenCategories(allCats);
  };

  const allExpanded = openFolders.size === allFolderPaths.size && 
                      openCategories.size === data.filter(c => c.category !== "intro").length;

  return (
    <div className="flex min-h-screen relative transition-colors" style={{ background: 'var(--bg-main)', color: 'var(--text-main)' }}>
      {/* SIDEBAR */}
      <aside
        className={`transition-all duration-300 ease-in-out fixed top-0 left-0 h-full border-r border-gray-800 overflow-y-auto
          ${open ? "w-80 p-4 bg-[#121212]" : "w-0 p-0 overflow-hidden"}
        `}
      >
        {/* Close button */}        
        {open && (
          <button
            onClick={() => setOpen(false)}
            className="cursor-pointer absolute top-1/2 right-0 -translate-y-1/2 z-50 p-2 bg-gray-800 text-white rounded-l-md hover:bg-gray-700 transition-colors"
            title={mounted ? t('closeSidebar') : 'Close sidebar'}
            aria-label={mounted ? t('closeSidebar') : 'Close sidebar'}
          >
            ⟨
          </button>
        )}

        {open && (
          <>
            <div className="mb-6 space-y-4">
              {/* Author Name */}
              <h1 className="text-2xl font-bold text-center" style={{ color: '#C4A484' }}>
                {language === 'ta' ? 'அபிநவ் ந ர' : 'Abinav N R'}
              </h1>
              
              {/* Language and Theme Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setLanguage(language === 'ta' ? 'en' : 'ta')}
                  className="cursor-pointer text-sm px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <span>🌐</span>
                  <span>{language === 'ta' ? 'English' : 'தமிழ்'}</span>
                </button>
                
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="cursor-pointer text-sm px-3 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors font-medium flex items-center justify-center gap-2"
                >
                  <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
                </button>
              </div>

              <div className="my-4 h-px w-full bg-linear-to-r from-transparent via-gray-500 to-transparent" />

              {/* Contents Label */}
              <div className="flex items-end justify-between">
                <h2 className="text-2xl font-semibold" style={{ color: "#00FFFF" }}>
                  {language === 'ta' ? 'பொருளடக்கம்' : 'Contents'}
                </h2>

                {/* Expand/Collapse Button */}
                <button
                  onClick={allExpanded ? collapseAll : expandAll}
                  className="cursor-pointer text-sm px-2 py-2 text-gray-300 hover:text-white underline-offset-7 hover:underline transition-colors"
                >
                  <span>
                    {allExpanded 
                      ? (language === 'ta' ? '▼ மூடு' : '▼ Collapse')
                      : (language === 'ta' ? '▶ விரி' : '▶ Expand')
                    }
                  </span>
                </button>
              </div>
            </div>
            <ul>
              {data.map((cat) => {
                const isIntro = cat.category === "intro";
                const isHistory = cat.category === "history";
                const categoryDisplayName = cat.displayName?.[initialLanguage] || cat.category;

                if (isIntro) {
                  const isActive = pathname === "/";
                  
                  return (
                    <li key="intro" className="mb-4">
                      <a
                        href="/"
                        className={`block text-lg ${
                          isActive 
                            ? "text-[#C4A484] font-semibold" 
                            : "text-gray-300 hover:text-[#C4A488]"
                        }`}
                      >
                        <span>
                          {initialLanguage === 'ta' ? 'அறிமுகம்' : 'Introduction'}
                        </span>
                      </a>
                    </li>
                  );
                }

                if (isHistory) {
                  const isActive = pathname === "/history";
                  
                  return (
                    <li key="history" className="mb-4">
                      <a
                        href="/history"
                        className={`block text-lg ${
                          isActive 
                            ? "text-[#C4A484] font-semibold" 
                            : "text-gray-300 hover:text-[#C4A488]"
                        }`}
                      >
                        <span suppressHydrationWarning>
                          {initialLanguage === 'ta' ? 'வரலாறு' : 'History'}
                        </span>
                      </a>
                    </li>
                  );
                }

                const isCategoryOpen = openCategories.has(cat.category);
                
                return (
                  <li key={cat.category} className="mb-2">
                    <details open={isCategoryOpen}>
                      <summary 
                        className="cursor-pointer font-semibold text-gray-300 hover:text-[#00CCCC]"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleCategory(cat.category);
                        }}
                      >
                        <span>
                          {categoryDisplayName}
                        </span>
                      </summary>
                      <RenderItems 
                        items={cat.items} 
                        basePath={`/${cat.category}`}
                        pathname={pathname}
                        openFolders={openFolders}
                        toggleFolder={toggleFolder}
                        initialLanguage={initialLanguage}
                        mounted={mounted}
                      />
                    </details>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </aside>

      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="cursor-pointer fixed top-1/2 left-0 -translate-y-1/2 z-50 p-2 bg-gray-800 text-white rounded-r-md hover:bg-gray-700 transition-all duration-300"
          title={mounted ? t('openSidebar') : 'Open sidebar'}
          aria-label={mounted ? t('openSidebar') : 'Open sidebar'}
          suppressHydrationWarning
        >
          ⟩
        </button>
      )}

      <main
        className={`transition-all duration-300 ease-in-out w-full p-6 ${
          open ? "ml-80" : "ml-0"
        }`}
      >
        {children}
      </main>
    </div>
  );
}