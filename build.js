const fs = require('fs');
const path = require('path');

// 1. Read data
const html = fs.readFileSync('index.html', 'utf8');
let postsData;
try {
  postsData = JSON.parse(fs.readFileSync('posts.json', 'utf8'));
} catch (e) {
  console.log('No posts.json found or invalid. Skipping.');
  process.exit(0);
}

const posts = postsData.posts || [];

// 2. Setup build dir
const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// 3. Copy base files
const filesToCopy = ['index.html', 'posts.json'];
const dirsToCopy = ['images', 'admin'];

filesToCopy.forEach(f => {
  if (fs.existsSync(f)) {
    fs.copyFileSync(f, path.join(distDir, f));
  }
});

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (let entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

dirsToCopy.forEach(d => {
  if (fs.existsSync(d)) {
    copyDirSync(d, path.join(distDir, d));
  }
});

// 4. Generate post pages
posts.forEach(post => {
  const postDir = path.join(distDir, 'post', String(post.id));
  if (!fs.existsSync(postDir)) {
    fs.mkdirSync(postDir, { recursive: true });
  }
  
  // Inject Open Graph tags into the <head>
  const title = (post.title || '').replace(/"/g, '&quot;');
  const excerpt = (post.excerpt || '').replace(/"/g, '&quot;');
  
  const ogTags = `
<meta property="og:title" content="${title} — quester" />
<meta property="og:description" content="${excerpt}" />
<meta property="og:image" content="/images/logo.jpg" />
<meta name="twitter:card" content="summary_large_image" />
<script>
  // Redirect /post/:id/ to /?post=:id so the SPA can handle it
  if (window.location.pathname.startsWith('/post/')) {
    window.location.replace('/?post=${post.id}');
  }
</script>
`;

  const injectedHtml = html.replace('</head>', `${ogTags}</head>`);
  fs.writeFileSync(path.join(postDir, 'index.html'), injectedHtml);
  console.log(`Generated HTML for post ${post.id}`);
});

console.log('Build complete.');
