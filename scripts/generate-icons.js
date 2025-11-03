// Simple icon generator for PWA
// This creates basic SVG icons with the app's green theme
// In production, replace with professionally designed icons

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate SVG for each size
sizes.forEach(size => {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Background -->
  <rect width="${size}" height="${size}" fill="#10b981" rx="${size * 0.15}"/>
  
  <!-- Icon content - BK letters -->
  <text 
    x="50%" 
    y="50%" 
    font-family="Arial, sans-serif" 
    font-size="${size * 0.4}" 
    font-weight="bold" 
    fill="white" 
    text-anchor="middle" 
    dominant-baseline="central">
    BK
  </text>
  
  <!-- Decorative element - book icon -->
  <g transform="translate(${size * 0.5}, ${size * 0.75})">
    <rect x="${-size * 0.15}" y="${-size * 0.08}" width="${size * 0.3}" height="${size * 0.12}" fill="white" opacity="0.8" rx="${size * 0.01}"/>
    <line x1="${-size * 0.15}" y1="${-size * 0.02}" x2="${size * 0.15}" y2="${-size * 0.02}" stroke="#10b981" stroke-width="${size * 0.01}"/>
  </g>
</svg>`;

  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`Generated ${filename}`);
});

console.log('\nIcon generation complete!');
console.log('Note: For production, replace these with professionally designed icons.');
console.log('You can use tools like https://realfavicongenerator.net/ to generate all formats.');
