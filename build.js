const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

const ARTICLES_DIR = path.join(__dirname, 'articles');
const PUBLIC_DIR = path.join(__dirname, 'public');
const ARTICLES_PUBLIC_DIR = path.join(PUBLIC_DIR, 'articles');

if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });
if (!fs.existsSync(ARTICLES_PUBLIC_DIR)) fs.mkdirSync(ARTICLES_PUBLIC_DIR, { recursive: true });

function getArticleTemplate(title, date, content, slug) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        :root {
            --bg: #ffffff;
            --text: #1f2937;
            --text-light: #6b7280;
            --card-bg: #ffffff;
            --border: #e5e7eb;
            --primary: #06b6d4;
            --primary-light: #0891b2;
            --shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg);
            color: var(--text);
            line-height: 1.7;
            min-height: 100vh;
        }
        .header { 
            padding: 1rem 0 0rem 0; 
            border-bottom: 1px solid var(--border); 
            text-align: center;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 0 2rem; 
        }
        h1 { 
            font-size: clamp(2rem, 6vw, 3rem); 
            font-weight: 800; 
            background: linear-gradient(135deg, var(--primary), var(--primary-light));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 1rem;
        }
        .article-meta { 
            color: var(--text-light); 
            font-size: 1rem; 
            margin-bottom: 3rem; 
            font-weight: 500;
        }
        .article-content {
            background: var(--card-bg);
            border-radius: 20px;
            padding: 4rem;
            border: 1px solid var(--border);
            box-shadow: var(--shadow);
            margin: 2rem 0 4rem 0;
            font-size: 1.1rem;
            line-height: 1.8;
        }
        .article-content h1, .article-content h2 { 
            font-weight: 700; 
            margin: 3rem 0 1.5rem 0; 
            color: var(--text);
        }
        .article-content h1:first-child, .article-content h2:first-child { margin-top: 0; }
        .article-content p { margin-bottom: 1.5rem; }
        .article-content pre {
            background: #f8fafc;
            border: 1px solid var(--border);
            border-radius: 12px;
            padding: 2rem;
            overflow-x: auto;
            margin: 2rem 0;
            font-size: 0.95em;
        }
        [data-theme="dark"] .article-content pre { background: #1f2937; }
        .back-link {
            display: inline-flex;
            align-items: center;
            gap: 0.75rem;
            color: var(--primary);
            text-decoration: none;
            font-weight: 600;
            font-size: 1.1rem;
            margin-bottom: 2rem;
            padding: 0.75rem 0;
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
        }
        @media (max-width: 768px) {
            .article-content { margin: 1rem; padding: 2rem 1.5rem; }
            h1 { font-size: 2rem; }
        }
    </style>
</head>
<body>
    <button id="themeToggle" class="theme-toggle">Dark</button>
    
    <header class="header">
        <div class="container">
            <h1>${title}</h1>
            <div class="article-meta">${new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>
    </header>

    <main>
        <div class="container">
            <a href="../index.html" class="back-link">← Back to articles</a>
            <article class="article-content">
                ${content}
            </article>
        </div>
    </main>

    <script>
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
    </script>
</body>
</html>`;
}

function getMarkdownFiles() {
    if (!fs.existsSync(ARTICLES_DIR)) {
        fs.mkdirSync(ARTICLES_DIR, { recursive: true });
        return [];
    }
    return fs.readdirSync(ARTICLES_DIR)
        .filter(f => f.endsWith('.md'))
        .sort()
        .reverse();
}

function parseArticle(filename) {
    const filepath = path.join(ARTICLES_DIR, filename);
    const content = fs.readFileSync(filepath, 'utf-8');
    const { data, content: markdown } = matter(content);
    return {
        filename,
        slug: filename.replace('.md', ''),
        title: data.title || filename.replace('.md', ''),
        date: data.date || new Date().toISOString().split('T')[0],
        excerpt: data.excerpt || markdown.substring(0, 150).replace(/[#*_]/g, '') + '...',
        content: markdown,
        tags: data.tags || []
    };
}

async function buildArticles() {
    const files = getMarkdownFiles();
    const articles = [];
    console.log('Building articles...');
    for (const file of files) {
        const article = parseArticle(file);
        const htmlContent = marked(article.content);
        const html = getArticleTemplate(article.title, article.date, htmlContent, article.slug);
        fs.writeFileSync(path.join(ARTICLES_PUBLIC_DIR, `${article.slug}.html`), html);
        articles.push({ title: article.title, slug: article.slug, date: article.date, excerpt: article.excerpt });
        console.log(`  ${article.title}`);
    }
    return articles;
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
        console.log('\\nBuild complete!');
        console.log(`${articles.length} articles`);
        console.log('Open public/index.html');
    } catch (error) {
        console.error('Build failed:', error);
        process.exit(1);
    }
}

build();
