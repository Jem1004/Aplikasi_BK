// Convert SVG icons to PNG format
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

async function convertIcons() {
  for (const size of sizes) {
    const svgFile = path.join(iconsDir, `icon-${size}x${size}.svg`);
    const pngFile = path.join(iconsDir, `icon-${size}x${size}.png`);
    
    try {
      await sharp(svgFile)
        .resize(size, size)
        .png()
        .toFile(pngFile);
      
      console.log(`Converted icon-${size}x${size}.png`);
    } catch (error) {
      console.error(`Error converting ${size}x${size}:`, error.message);
    }
  }
  
  console.log('\nIcon conversion complete!');
}

convertIcons();
