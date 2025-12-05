const fs = require('fs');
const path = require('path');

const PROXY = 'https://yawr-test.vercel.app';   // ← change only this line if needed

function rewrite(content, file) {
  // 1. HTML / normal attributes
  content = content
    .replace(/href="\/([^"]+)"/g, `href="${PROXY}/$1"`)
    .replace(/src="\/([^"]+)"/g, `src="${PROXY}/$1"`)
    .replace(/srcset="\/([^"]+)"/g, `srcset="${PROXY}/$1"`)
    .replace(/url\(['"]?\//g, `url(${PROXY}/`);

  // 2. JavaScript string literals — this is the important part
  //    Covers:
  //    - import ... from "https://yawr-test.vercel.app/../chunks/chunk-XXX.js"
  //    - import("https://yawr-test.vercel.app/../chunks/chunk-XXX.js")
  //    - "https://yawr-test.vercel.app/assets/chunks/chunk-XXX.js" in arrays, objects, etc.
  //    - new URL("https://yawr-test.vercel.app/assets/xxx", import.meta.url)
  const dir = path.dirname(file);

  content = content.replace(
    /((?:from|import)\s*["'])(?!https?:)(\/?[^\s"']+\.(?:js|css|woff2?|png|jpg|svg|webp|json))(["'])/gi,
    `$1${PROXY}/$2$3`
  );

  content = content.replace(
    /((?:import|require)\s*\(\s*["'])(?!https?:)(\/?[^\s"']+\.(?:js|css))(["']\s*\))/gi,
    `$1${PROXY}/$2$3`
  );

  content = content.replace(
    /(["'])(\/?(?:assets|chunks|_static|_astro|entries)\/[^"']+\.(?:js|css|woff2?|png|jpg|svg|webp))(["'])/gi,
    `$1${PROXY}/$2$3`
  );

  // Vite’s new URL("https://yawr-test.vercel.app/assets/...", import.meta.url) pattern
  content = content.replace(
    /new\s+URL\s*\(\s*["']([^"']+)["']\s*,\s*import\.meta\.url\s*\)/gi,
    (match, p1) => {
      if (p1.startsWith('http')) return match;
      return `new URL("${PROXY}${p1.startsWith('/') ? '' : '/'}${p1}", import.meta.url)`;
    }
  );

  return content;
}

// Walk everything
function processFile(filePath) {
  if (!fs.statSync(filePath).isFile()) return;

  const ext = path.extname(filePath);
  if (!['.html', '.js', '.css', '.json', '.svg'].includes(ext)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  const oldContent = content;
  content = rewrite(content, filePath);

  if (content !== oldContent) {
    fs.writeFileSync(filePath, content);
    console.log('Fixed →', filePath);
  }
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else {
      processFile(fullPath);
    }
  }
}

walk('.');
console.log('All assets now load through', PROXY);