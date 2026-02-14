const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');
const plantuml = require('node-plantuml');
const plantumlEncoder = require('plantuml-encoder');

const ARTICLES_DIR = path.join(__dirname, 'articles');
const PUBLIC_DIR = path.join(__dirname, 'public');
const ARTICLES_PUBLIC_DIR = path.join(PUBLIC_DIR, 'articles');

if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
if (!fs.existsSync(ARTICLES_PUBLIC_DIR)) fs.mkdirSync(ARTICLES_PUBLIC_DIR, { recursive: true });

// Configure marked with PlantUML support
const renderer = new marked.Renderer();
const originalCode = renderer.code;

renderer.code = function(code, language) {
    if (language === 'plantuml' || language === 'puml') {
        // Generate PlantUML diagram
        try {
            const encoded = plantumlEncoder.encode(code);
            const diagramUrl = `http://www.plantuml.com/plantuml/svg/${encoded}`;
            return `<div class="plantuml-diagram">
                <img src="${diagramUrl}" alt="PlantUML Diagram" style="max-width: 100%; height: auto; border: 1px solid var(--border); border-radius: 8px; margin: 1rem 0;" />
            </div>`;
        } catch (error) {
            console.warn('Failed to encode PlantUML diagram:', error);
            return originalCode.call(this, code, language);
        }
    }
    return originalCode.call(this, code, language);
};

marked.setOptions({
    renderer: renderer,
    highlight: function(code, lang) {
        return code; // You can add syntax highlighting here if needed
    }
});

// MVC Components
function getSharedStyles() {
    return `
        :root {
            --bg: #ffffff;
            --text: #1f2937;
            --text-light: #6b7280;
            --card-bg: #ffffff;
            --border: #e5e7eb;
            --primary: #06b6d4;
            --primary-light: #0891b2;
            --shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.1);
        }

        [data-theme="dark"] {
            --bg: #111827;
            --text: #f9fafb;
            --text-light: #d1d5db;
            --card-bg: #1f2937;
            --border: #374151;
            --primary: #0ea5e9;
            --primary-light: #0284c7;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.6;
            overflow-x: hidden;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 2rem;
        }

        .header {
            padding: 2.8rem 0 1.4rem 0;
            text-align: center;
            border-bottom: 1px solid var(--border);
        }

        .hero-title {
            font-size: clamp(2.1rem, 5.6vw, 4.2rem);
            font-weight: 800;
            background: linear-gradient(135deg, var(--primary), var(--primary-light));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1.2;
            margin-bottom: 0.7rem;
        }

        .hero-title a {
            color: inherit;
            text-decoration: none;
        }

        .theme-toggle {
            position: fixed;
            top: 1.5rem;
            right: 2rem;
            background: var(--primary);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 9999px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.95rem;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(6, 182, 212, 0.3);
            transition: all 0.2s ease;
        }

        .theme-toggle:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 16px rgba(6, 182, 212, 0.4);
        }
    `;
}

function getNavigationComponent(navigation, currentFolder = '') {
    if (!navigation || (!navigation.prev && !navigation.next)) return '';
    
    return `
        <nav class="article-navigation">
            ${navigation.prev ? `
            <a href="${getRelativeArticlePath(navigation.prev.slug, currentFolder)}" class="nav-link prev">
                <div class="nav-label">← Previous</div>
                <div class="nav-title">${navigation.prev.title}</div>
            </a>
            ` : '<div></div>'}
            ${navigation.next ? `
            <a href="${getRelativeArticlePath(navigation.next.slug, currentFolder)}" class="nav-link next">
                <div class="nav-label">Next →</div>
                <div class="nav-title">${navigation.next.title}</div>
            </a>
            ` : '<div></div>'}
        </nav>
    `;
}

function getRelativeArticlePath(targetSlug, currentFolder) {
    const targetParts = targetSlug.split('/');
    const currentParts = currentFolder ? currentFolder.split('/') : [];
    
    // If both are in the same folder, just use the filename
    if (targetParts.length > 1 && currentParts.length > 0 && targetParts[0] === currentParts[0]) {
        return `${targetParts[targetParts.length - 1]}.html`;
    }
    
    // If target is in a subfolder and current is in root
    if (targetParts.length > 1 && currentParts.length === 0) {
        return `${targetSlug}.html`;
    }
    
    // If current is in subfolder and target is in root
    if (targetParts.length === 1 && currentParts.length > 0) {
        return `../${targetSlug}.html`;
    }
    
    // Default case
    return `${targetSlug}.html`;
}

function getThemeScript() {
    return `
        let isDark = localStorage.getItem('theme') === 'dark';
        function setTheme(dark) {
            document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
            localStorage.setItem('theme', dark ? 'dark' : 'light');
            document.getElementById('themeToggle').textContent = dark ? 'Light' : 'Dark';
        }
        document.getElementById('themeToggle').addEventListener('click', () => setTheme(!isDark));
        const saved = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setTheme(saved === 'dark' || (!saved && prefersDark));
    `;
}

function getArticleTemplate(title, date, content, slug, navigation = null, relativePath = '') {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - Learning Never Ends</title>
    <style>
        ${getSharedStyles()}
        
        .article-content {
            max-width: 800px;
            margin: 0 auto;
            padding: 0 1rem;
        }

        .article-post {
            background: var(--card-bg);
            border-radius: 16px;
            padding: 2rem 1.5rem;
            border: 1px solid var(--border);
            box-shadow: var(--shadow);
            margin: 1rem 0;
            font-size: 1.1rem;
            line-height: 1.7;
        }

        .article-post h1:first-child { 
            font-weight: 800; 
            font-size: clamp(1.5rem, 5vw, 2.5rem);
            background: linear-gradient(135deg, var(--primary), var(--primary-light));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 0 0 0.5rem 0; 
            line-height: 1.2;
        }

        .article-post h1:first-child + p em {
            color: var(--text-light);
            font-size: 0.9rem;
            font-weight: 500;
            display: block;
            margin-bottom: 2rem;
        }

        .article-post h1, .article-post h2 { 
            font-weight: 700; 
            margin: 2rem 0 1rem 0; 
            color: var(--text);
            font-size: clamp(1.2rem, 4vw, 1.8rem);
        }

        .article-post h1:first-child, .article-post h2:first-child { 
            margin-top: 0; 
        }

        .article-post p { 
            margin-bottom: 1.2rem;
            font-size: clamp(0.95rem, 2.5vw, 1.1rem);
        }

        .article-post pre {
            background: #f8fafc;
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1rem;
            overflow-x: auto;
            margin: 1.5rem 0;
            font-size: 0.85rem;
        }

        [data-theme="dark"] .article-post pre { 
            background: #1f2937; 
        }

        .article-post ul, .article-post ol {
            margin: 1rem 0 1rem 1.5rem;
        }

        .article-post li {
            margin-bottom: 0.5rem;
            font-size: clamp(0.95rem, 2.5vw, 1.1rem);
        }

        .plantuml-diagram {
            text-align: center;
            margin: 1.5rem 0;
        }

        .plantuml-diagram img {
            max-width: 100%;
            height: auto;
            border: 1px solid var(--border);
            border-radius: 8px;
            background: white;
            padding: 0.5rem;
        }

        [data-theme="dark"] .plantuml-diagram img {
            background: #f8fafc;
        }

        .article-navigation {
            display: flex;
            justify-content: space-between;
            gap: 0.75rem;
            margin: 1.5rem auto;
            padding: 0 1rem;
            max-width: 800px;
        }

        .nav-link {
            display: flex;
            flex-direction: column;
            color: var(--primary);
            text-decoration: none;
            padding: 0.75rem;
            border-radius: 8px;
            border: 1px solid var(--border);
            background: var(--card-bg);
            flex: 1;
            max-width: 48%;
            transition: all 0.2s ease;
            box-shadow: var(--shadow);
        }

        .nav-link:hover {
            background: var(--primary);
            color: white;
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(6, 182, 212, 0.25);
        }

        .nav-label {
            font-size: 0.75rem;
            font-weight: 600;
            opacity: 0.7;
            margin-bottom: 0.25rem;
        }

        .nav-title {
            font-size: 0.85rem;
            font-weight: 700;
            line-height: 1.3;
        }

        .nav-link.prev {
            text-align: left;
        }

        .nav-link.next {
            text-align: right;
        }

        /* Mobile Optimizations */
        @media (max-width: 768px) {
            .article-content { 
                padding: 0 0.5rem; 
            }
            
            .article-post { 
                margin: 0.5rem; 
                padding: 1.5rem 1rem; 
                border-radius: 12px;
            }
            
            .article-navigation {
                flex-direction: column;
                gap: 0.5rem;
                padding: 0 0.5rem;
                margin: 1rem auto;
            }
            
            .nav-link {
                max-width: 100%;
                padding: 1rem;
                text-align: center !important;
            }
            
            .nav-title {
                font-size: 0.9rem;
            }
            
            .header {
                padding: 1.5rem 0 1rem 0;
            }
            
            .hero-title {
                font-size: clamp(1.8rem, 8vw, 2.5rem);
                margin-bottom: 0.5rem;
            }
            
            .theme-toggle {
                top: 1rem;
                right: 1rem;
                padding: 0.5rem 1rem;
                font-size: 0.85rem;
            }
            
            .article-post pre {
                font-size: 0.8rem;
                padding: 0.75rem;
                border-radius: 6px;
            }
        }

        /* Small Mobile Devices */
        @media (max-width: 480px) {
            .container {
                padding: 0 1rem;
            }
            
            .article-content {
                padding: 0 0.25rem;
            }
            
            .article-post {
                margin: 0.25rem;
                padding: 1rem 0.75rem;
            }
            
            .nav-link {
                padding: 0.75rem 0.5rem;
            }
            
            .theme-toggle {
                padding: 0.4rem 0.8rem;
                font-size: 0.8rem;
            }
        }
    </style>
</head>
<body>
    <button id="themeToggle" class="theme-toggle">Dark</button>
    
    <header class="header">
        <div class="container">
            <h1 class="hero-title">
                <a href="${relativePath}../index.html">Learning Never Ends</a>
            </h1>
        </div>
    </header>

    ${getNavigationComponent(navigation, slug.includes('/') ? slug.split('/')[0] : '')}

    <main class="article-content">
        <article class="article-post">
            ${content}
        </article>
    </main>

    ${getNavigationComponent(navigation, slug.includes('/') ? slug.split('/')[0] : '')}

    <script>
        ${getThemeScript()}
    </script>
</body>
</html>`;
}

function getMarkdownFiles() {
    if (!fs.existsSync(ARTICLES_DIR)) {
        fs.mkdirSync(ARTICLES_DIR, { recursive: true });
        return [];
    }
    
    const files = [];
    
    function scanDirectory(dir, relativePath = '') {
        const items = fs.readdirSync(dir);
        
        for (const item of items) {
            const fullPath = path.join(dir, item);
            const itemRelativePath = relativePath ? path.join(relativePath, item) : item;
            
            if (fs.statSync(fullPath).isDirectory()) {
                // Recursively scan subdirectories
                scanDirectory(fullPath, itemRelativePath);
            } else if (item.endsWith('.md')) {
                files.push(itemRelativePath);
            }
        }
    }
    
    scanDirectory(ARTICLES_DIR);
    return files;
}

function parseArticle(filename) {
    const filepath = path.join(ARTICLES_DIR, filename);
    const content = fs.readFileSync(filepath, 'utf-8');
    const { data, content: markdown } = matter(content);
    
    // Extract folder and base filename
    const parsedPath = path.parse(filename);
    const folder = parsedPath.dir;
    const baseName = parsedPath.name;
    const slug = folder ? `${folder}/${baseName}` : baseName;
    
    return {
        filename,
        slug,
        folder,
        baseName,
        title: data.title || baseName.replace(/^\d+-/, '').replace(/-/g, ' '),
        date: data.date || new Date().toISOString().split('T')[0],
        excerpt: data.excerpt || markdown.substring(0, 150).replace(/[#*_]/g, '') + '...',
        content: markdown,
        tags: data.tags || [],
        // Add numerical order for sorting
        order: extractOrder(baseName)
    };
}

function extractOrder(filename) {
    const match = filename.match(/^(\d+)-/);
    return match ? parseInt(match[1], 10) : 999999; // Put non-numbered articles at the end
}

async function buildArticles() {
    const files = getMarkdownFiles();
    let articles = [];
    
    console.log('Building articles...');
    
    // First pass: parse all articles
    for (const file of files) {
        const article = parseArticle(file);
        articles.push({ 
            title: article.title, 
            slug: article.slug,
            folder: article.folder,
            baseName: article.baseName,
            date: article.date, 
            excerpt: article.excerpt,
            content: article.content,
            order: article.order
        });
    }
    
    // Sort articles: first by folder (docker-beginner first), then by order number, then by date
    articles.sort((a, b) => {
        // Group docker-beginner articles first
        if (a.folder === 'docker-beginner' && b.folder !== 'docker-beginner') return -1;
        if (a.folder !== 'docker-beginner' && b.folder === 'docker-beginner') return 1;
        
        // Within the same folder, sort by order number
        if (a.folder === b.folder) {
            if (a.order !== b.order) {
                return a.order - b.order;
            }
            // If same order, sort by date (newest first)
            return new Date(b.date) - new Date(a.date);
        }
        
        // Different folders (non-docker), sort by date
        return new Date(b.date) - new Date(a.date);
    });
    
    // Second pass: generate HTML with navigation
    for (let i = 0; i < articles.length; i++) {
        const article = articles[i];
        
        // Create the output directory if it doesn't exist
        const outputDir = article.folder ? 
            path.join(ARTICLES_PUBLIC_DIR, article.folder) : 
            ARTICLES_PUBLIC_DIR;
        
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        // Add title and date to the beginning of the content
        const contentWithHeader = `# ${article.title}\n\n*${new Date(article.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}*\n\n${article.content.replace(/^#\s+.*$/m, '').trim()}`;
        const htmlContent = marked(contentWithHeader);
        
        // Determine navigation
        let navigation = null;
        if (article.folder === 'docker-beginner') {
            // For docker articles, navigate within the same folder sequence, but allow global navigation at boundaries
            const dockerArticles = articles.filter(a => a.folder === 'docker-beginner');
            const dockerIndex = dockerArticles.findIndex(a => a.slug === article.slug);
            
            let prev = null;
            let next = null;
            
            // Previous navigation
            if (dockerIndex > 0) {
                // Previous Docker article
                prev = dockerArticles[dockerIndex - 1];
            } else {
                // First Docker article - no previous (could link to global previous if desired)
                prev = null;
            }
            
            // Next navigation
            if (dockerIndex < dockerArticles.length - 1) {
                // Next Docker article
                next = dockerArticles[dockerIndex + 1];
            } else {
                // Last Docker article - link to next global article
                const globalIndex = articles.findIndex(a => a.slug === article.slug);
                next = globalIndex < articles.length - 1 ? articles[globalIndex + 1] : null;
            }
            
            navigation = { prev, next };
        } else {
            // For other articles, navigate globally in sequence order
            navigation = {
                prev: i > 0 ? articles[i - 1] : null, // Previous in sequence
                next: i < articles.length - 1 ? articles[i + 1] : null // Next in sequence
            };
        }
        
        // Calculate relative path to index.html
        const relativePath = article.folder ? '../' : '';
        const html = getArticleTemplate(article.title, article.date, htmlContent, article.slug, navigation, relativePath);
        
        const outputFile = path.join(outputDir, `${article.baseName}.html`);
        fs.writeFileSync(outputFile, html);
        console.log(`  ${article.title} (${article.date}) -> ${article.slug}`);
    }
    
    // Return articles without content for index page
    return articles.map(({ title, slug, date, excerpt, folder }) => ({ title, slug, date, excerpt, folder }));
}

function updateIndex(articles) {
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    const articlesJson = JSON.stringify(articles, null, 2);
    const updatedContent = indexContent.replace(/const articles = \[[\s\S]*?\];/, `const articles = ${articlesJson};`);
    fs.writeFileSync(indexPath, updatedContent);
}

function setupIndexPage() {
    const templatePath = path.join(__dirname, 'index.html');
    if (fs.existsSync(templatePath)) {
        fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), fs.readFileSync(templatePath, 'utf-8'));
    }
}

async function build() {
    console.log('Kent C. Dodds-style blog build...\n');
    try {
        setupIndexPage();
        const articles = await buildArticles();
        updateIndex(articles);
        console.log('\nBuild complete!');
        console.log(`${articles.length} articles (sorted newest first)`);
        console.log('Open public/index.html');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();
