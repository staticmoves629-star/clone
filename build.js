const fs = require('fs');
const path = require('path');

console.log('Running build...');

// Create public directory to satisfy Vercel if configured with outputDirectory: "public"
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Static files to copy to public/
const filesToCopy = [
  'index.html',
  'styles.css',
  'app.js',
  'sw.js',
  'manifest.json',
  'favicon.ico',
  'favicon.png',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'arjun_avatar.jpg',
  'original_screenshot.jpg'
];

filesToCopy.forEach(file => {
  const src = path.join(__dirname, file);
  const dest = path.join(publicDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
});

// Copy icons directory if it exists
const iconsDir = path.join(__dirname, 'icons');
const destIconsDir = path.join(publicDir, 'icons');
if (fs.existsSync(iconsDir)) {
  fs.cpSync(iconsDir, destIconsDir, { recursive: true });
}

console.log('Build completed successfully: assets synced to public/ and root.');
