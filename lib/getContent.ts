import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';
import { compileMDX } from 'next-mdx-remote/rsc';

const contentsDir = path.join(process.cwd(), "contents");

export type FileItem = {
    name: string;
    displayName?: { ta: string; en: string }; // For translations
    path: string;
    type: 'file';
    extension: 'md' | 'mdx';
};

export type FolderItem = {
    name: string;
    displayName?: { ta: string; en: string }; // For translations
    path: string;
    type: 'folder';
    children: (FileItem | FolderItem)[];
};

export type ContentItem = FileItem | FolderItem;

type Translations = {
    [key: string]: {
        ta: string;
        en: string;
    };
};

// Safe decode for URL-encoded names
function safeDecode(name: string) {
    try {
        return decodeURIComponent(name);
    } catch {
        return name;
    }
}

// Load translations from _translations.json if it exists
function loadTranslations(dirPath: string): Translations | null {
    const translationsPath = path.join(dirPath, '_translations.json');
    if (fs.existsSync(translationsPath)) {
        try {
            const content = fs.readFileSync(translationsPath, 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            console.error(`Error loading translations from ${translationsPath}:`, error);
            return null;
        }
    }
    return null;
}

function readDirectoryRecursive(dirPath: string): ContentItem[] {
    const items = fs.readdirSync(dirPath);
    const result: ContentItem[] = [];
    const processedFiles = new Set<string>(); // Track base filenames we've already added
    
    // Load translations for this directory
    const translations = loadTranslations(dirPath);

    for (const item of items) {
        // Skip the translations file itself
        if (item === '_translations.json') continue;
        
        const decodedItem = safeDecode(item);
        const fullPath = path.join(dirPath, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            const children = readDirectoryRecursive(fullPath);
            const displayName = translations?.[decodedItem];
            
            result.push({
                name: decodedItem,
                displayName,
                path: decodedItem,
                type: 'folder',
                children
            });
        } else if (item.endsWith('.md') || item.endsWith('.mdx')) {
            // Remove language suffix and extension to get base name
            // e.g., "file.ta.md" -> "file", "file.en.mdx" -> "file", "file.md" -> "file"
            const withoutExt = decodedItem.replace(/\.(md|mdx)$/, '');
            const baseName = withoutExt.replace(/\.(ta|en)$/, '');
            
            // Skip if we've already processed this base file
            if (processedFiles.has(baseName)) continue;
            processedFiles.add(baseName);
            
            const extension = item.endsWith('.mdx') ? 'mdx' : 'md';
            const displayName = translations?.[baseName];
            
            result.push({
                name: baseName,
                displayName,
                path: baseName,
                type: 'file',
                extension
            });
        }
    }

    return result.sort((a, b) => {
        // Files come before folders
        if (a.type !== b.type) {
            return a.type === 'file' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });
}

export function getCategoriesAndfiles() {
    let categories = fs.readdirSync(contentsDir)
        .filter((item) => {
            // Filter out translation files and only keep directories
            if (item === '_translations.json') return false;
            const fullPath = path.join(contentsDir, item);
            return fs.statSync(fullPath).isDirectory();
        });

    categories = categories.sort((a, b) => {
        if (a === "intro") return -1;
        if (b === "intro") return 1;
        if (a === "history") return -1;
        if (b === "history") return 1;
        return a.localeCompare(b);
    });

    return categories.map((category) => {
        const decodedCategory = safeDecode(category);
        const categoryPath = path.join(contentsDir, category);
        
        // Load category-level translations
        const categoryTranslations = loadTranslations(contentsDir);
        const categoryDisplayName = categoryTranslations?.[decodedCategory];

        // Handle special top-level pages (intro and history)
        if (category === "intro" || category === "history") {
            const files = fs.readdirSync(categoryPath)
                .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"))
                .map((f) => {
                    const decoded = safeDecode(f);
                    const extension = decoded.endsWith('.mdx') ? 'mdx' : 'md';
                    return {
                        name: decoded.replace(/\.(md|mdx)$/, ''),
                        path: decoded.replace(/\.(md|mdx)$/, ''),
                        type: 'file' as const,
                        extension
                    };
                });

            return { 
                category: decodedCategory,
                displayName: categoryDisplayName,
                items: files
            };
        }

        const items = readDirectoryRecursive(categoryPath); 

        return { 
            category: decodedCategory,
            displayName: categoryDisplayName,
            items 
        };
    });
}

// Helper to find .md or .mdx with language support
function findFileWithExtension(
    basePath: string,
    language: 'ta' | 'en'
): { path: string; extension: 'md' | 'mdx' } | null {
    // Priority 1: Try language-specific files first
    const langMdxPath = `${basePath}.${language}.mdx`;
    const langMdPath = `${basePath}.${language}.md`;
    
    if (fs.existsSync(langMdxPath)) {
        return { path: langMdxPath, extension: 'mdx' };
    }
    if (fs.existsSync(langMdPath)) {
        return { path: langMdPath, extension: 'md' };
    }
    
    // Priority 2: Fall back to default files (no language suffix)
    const mdxPath = basePath + '.mdx';
    const mdPath = basePath + '.md';
    
    if (fs.existsSync(mdxPath)) {
        return { path: mdxPath, extension: 'mdx' };
    }
    if (fs.existsSync(mdPath)) {
        return { path: mdPath, extension: 'md' };
    }
    
    return null;
}

export async function getFileContent(
    pathSegments: string[],
    language: 'ta' | 'en' = 'ta'
) {
    const decodedSegments = pathSegments.map(safeDecode);
    
    // Special handling for top-level pages (intro and history)
    // When pathSegments is ['history'], look for contents/history/history.md
    if (decodedSegments.length === 1 && (decodedSegments[0] === 'intro' || decodedSegments[0] === 'history')) {
        const category = decodedSegments[0];
        decodedSegments.push(category); // Look for intro/intro.md or history/history.md
    }
    
    const basePath = path.join(contentsDir, ...decodedSegments);
    const fileInfo = findFileWithExtension(basePath, language);
    
    if (!fileInfo) {
        throw new Error(
            `File not found: ${basePath}.${language}.md/mdx or ${basePath}.md/mdx`
        );
    }
    
    const fileContent = fs.readFileSync(fileInfo.path, "utf-8");

    if (fileInfo.extension === 'mdx') {
        const { content } = await compileMDX({
            source: fileContent,
            options: {
                parseFrontmatter: true,
                mdxOptions: {
                    remarkPlugins: [remarkGfm],
                }
            },
        });
        
        return { 
            content, 
            isMDX: true 
        };
    } else {
        const { content } = matter(fileContent);
        const processedContent = await remark()
            .use(remarkGfm)
            .use(remarkHtml)
            .process(content);
        
        return { 
            contentHtml: processedContent.toString(), 
            isMDX: false 
        };
    }
}