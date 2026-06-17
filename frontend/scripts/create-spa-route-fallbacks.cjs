const fs = require('fs');
const path = require('path');

const distDir = path.resolve(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');

const routes = [
  'about',
  'cart',
  'checkout',
  'contact',
  'login',
  'my-orders',
  'orders',
  'privacy',
  'product',
  'products',
  'register',
  'terms',
  'wishlist',
];

if (!fs.existsSync(indexPath)) {
  throw new Error(`Cannot create SPA route fallbacks because ${indexPath} does not exist.`);
}

for (const route of routes) {
  const routeDir = path.join(distDir, route);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.copyFileSync(indexPath, path.join(routeDir, 'index.html'));
}

const redirectsPath = path.join(distDir, '_redirects');
if (!fs.existsSync(redirectsPath)) {
  fs.writeFileSync(redirectsPath, '/* /index.html 200', 'utf-8');
  console.log('Created _redirects file for SPA fallback.');
}

const notFoundPath = path.join(distDir, '404.html');
if (!fs.existsSync(notFoundPath)) {
  fs.copyFileSync(indexPath, notFoundPath);
  console.log('Created 404.html fallback.');
}

console.log(`Created SPA route fallbacks for ${routes.length} routes.`);
