import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// API Base URL
const API_URL = process.env.VITE_API_URL || 'https://henkes-stoffzauber.de/api';

console.log('🔨 Prerendering SEO-critical pages with product data...\n');

async function fetchProducts() {
  try {
    const response = await fetch(`${API_URL}/products`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const json = await response.json();
    return json.data || json; // Handle both {data: [...]} and [...] responses
  } catch (error) {
    console.warn('⚠️  Could not fetch products:', error.message);
    return [];
  }
}

async function fetchFabrics() {
  try {
    const response = await fetch(`${API_URL}/fabrics`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const json = await response.json();
    return json.data || json; // Handle both {data: [...]} and [...] responses
  } catch (error) {
    console.warn('⚠️  Could not fetch fabrics:', error.message);
    return [];
  }
}

function injectProductsIntoHTML(html, products, fabrics) {
  // Inject products as JSON in script tag for SEO
  const productsJson = JSON.stringify(products);
  const fabricsJson = JSON.stringify(fabrics);

  const seoData = `
    <script id="seo-preload-data" type="application/json">
      ${JSON.stringify({ products, fabrics })}
    </script>
    <!-- Prerendered with ${products.length} products and ${fabrics.length} fabrics -->
  `;

  // Inject before closing body tag
  return html.replace('</body>', `${seoData}</body>`);
}

async function main() {
  const distPath = path.join(__dirname, 'dist');
  const indexPath = path.join(distPath, 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.error('❌ dist/index.html not found. Run build first!');
    process.exit(1);
  }

  // Fetch data
  console.log('📡 Fetching products from API...');
  const products = await fetchProducts();
  console.log(`✓ Fetched ${products.length} products`);

  console.log('📡 Fetching fabrics from API...');
  const fabrics = await fetchFabrics();
  console.log(`✓ Fetched ${fabrics.length} fabrics\n`);

  // Read HTML
  let html = fs.readFileSync(indexPath, 'utf-8');

  // Inject data
  html = injectProductsIntoHTML(html, products, fabrics);

  // Write back
  fs.writeFileSync(indexPath, html, 'utf-8');

  console.log('✅ Prerendering complete!');
  console.log(`   - ${products.length} products injected into HTML`);
  console.log(`   - ${fabrics.length} fabrics injected into HTML`);
  console.log('   - Google can now see all product data! 🎉\n');
}

main().catch(error => {
  console.error('❌ Prerender failed:', error);
  process.exit(1);
});
