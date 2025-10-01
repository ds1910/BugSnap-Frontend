#!/usr/bin/env node

/**
 * Sitemap Generator for bugSnap
 * 
 * This script generates a sitemap.xml file for better SEO.
 * It includes static routes and can be extended to include dynamic routes.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const DOMAIN = 'https://bugsnap.vercel.app';
const OUTPUT_PATH = path.join(__dirname, '../public/sitemap.xml');

// Static routes that should be indexed
const STATIC_ROUTES = [
  {
    url: '',
    changefreq: 'daily',
    priority: '1.0',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/login',
    changefreq: 'monthly',
    priority: '0.7',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/signup',
    changefreq: 'monthly',
    priority: '0.7',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/forgot-password',
    changefreq: 'monthly',
    priority: '0.5',
    lastmod: new Date().toISOString().split('T')[0]
  },
  {
    url: '/reset-password',
    changefreq: 'monthly',
    priority: '0.5',
    lastmod: new Date().toISOString().split('T')[0]
  }
];

/**
 * Generates XML sitemap
 */
function generateSitemap() {
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
`;

  // Add static routes
  STATIC_ROUTES.forEach(route => {
    xml += `  <url>
    <loc>${DOMAIN}${route.url}</loc>
    <lastmod>${route.lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>
`;
  });

  xml += `</urlset>`;

  return xml;
}

/**
 * Writes sitemap to file
 */
function writeSitemap() {
  try {
    const sitemapXml = generateSitemap();
    
    // Ensure public directory exists
    const publicDir = path.dirname(OUTPUT_PATH);
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    // Write sitemap
    fs.writeFileSync(OUTPUT_PATH, sitemapXml, 'utf8');
    
    console.log(`✅ Sitemap generated successfully at ${OUTPUT_PATH}`);
    console.log(`📊 Total URLs: ${STATIC_ROUTES.length}`);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run the generator
if (require.main === module) {
  writeSitemap();
}

module.exports = { generateSitemap, writeSitemap };