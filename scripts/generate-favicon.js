// Generate favicon.ico from PNG
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicon() {
  const sourceIcon = path.join(__dirname, '../public/icons/icon-192x192.png');
  const faviconPath = path.join(__dirname, '../public/favicon.ico');
  
  try {
    // Create a 32x32 PNG (standard favicon size)
    const buffer = await sharp(sourceIcon)
      .resize(32, 32)
      .png()
      .toBuffer();
    
    // For a proper .ico file, you'd need a library like 'to-ico'
    // For now, we'll create a 32x32 PNG and rename it
    // Browsers will accept PNG as favicon
    await sharp(buffer)
      .toFile(faviconPath.replace('.ico', '.png'));
    
    console.log('Generated favicon.png (rename to favicon.ico if needed)');
    console.log('Note: For proper .ico format, use a tool like https://realfavicongenerator.net/');
  } catch (error) {
    console.error('Error generating favicon:', error.message);
  }
}

generateFavicon();
