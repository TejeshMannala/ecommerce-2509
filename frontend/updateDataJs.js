import fs from 'fs';

const dataPath = './src/data/data.js';
let content = fs.readFileSync(dataPath, 'utf-8');

content = content.replace(/"name":\s*"([^"]+)",\s*"category":\s*"([^"]+)",\s*"image":\s*"([^"]+)"/g, (match, name, category, oldImage) => {
  const safeText = encodeURIComponent(name);
  const newImage = `https://loremflickr.com/640/480/${safeText}`;
  return `"name": "${name}",
    "category": "${category}",
    "image": "${newImage}"`;
});

fs.writeFileSync(dataPath, content, 'utf-8');
console.log('Updated data.js with dynamic loremflickr images based on name!');
