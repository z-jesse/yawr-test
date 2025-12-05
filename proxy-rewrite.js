const fs = require('fs');
const path = require('path');

const PROXY_DOMAIN = 'https://yawr-test.vercel.app';

function rewriteFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Replace href="https://yawr-test.vercel.app/_static/ → href="https://yawr-test.vercel.app/_static/
  // Replace src="https://yawr-test.vercel.app/assets/ → src="https://yawr-test.vercel.app/assets/
  // Replace url(/fonts/ → url(https://yawr-test.vercel.app/fonts/
  content = content
    .replace(/href="\/([^"]+)"/g, `href="${PROXY_DOMAIN}/$1"`)
    .replace(/src="\/([^"]+)"/g, `src="${PROXY_DOMAIN}/$1"`)
    .replace(/url$$ ['"]?\//g, `url(${PROXY_DOMAIN}/`);

  fs.writeFileSync(filePath, content);
}

function walk(dir) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (/\.(html|css|js)$/.test(fullPath)) {
      rewriteFile(fullPath);
    }
  });
}

walk('.');
console.log('All asset URLs rewritten to', PROXY_DOMAIN);