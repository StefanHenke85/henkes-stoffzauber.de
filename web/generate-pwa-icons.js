import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const inputFile = path.join(__dirname, 'public', 'logo.jpg');
const outputDir = path.join(__dirname, 'public', 'pwa-icons');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Generating PWA icons from logo.jpg...');

Promise.all(
  sizes.map((size) => {
    const outputFile = path.join(outputDir, `icon-${size}x${size}.png`);

    return sharp(inputFile)
      .resize(size, size, {
        fit: 'cover',
        position: 'center',
      })
      .png()
      .toFile(outputFile)
      .then(() => {
        console.log(`✓ Generated ${size}x${size} icon`);
      })
      .catch((err) => {
        console.error(`✗ Failed to generate ${size}x${size} icon:`, err.message);
      });
  })
)
  .then(() => {
    console.log('\n✓ All PWA icons generated successfully!');
  })
  .catch((err) => {
    console.error('\n✗ Error generating icons:', err);
    process.exit(1);
  });
