const fs = require('fs');

const content = fs.readFileSync('src/data/currentAffairsData.ts', 'utf8');
const eventBlocks = content.split(/id:\s*['"]/);
console.log('Event blocks found:', eventBlocks.length);

const articlesWithImages = [];
for (let i = 1; i < eventBlocks.length; i++) {
  const block = eventBlocks[i];
  const idMatch = block.match(/^([^'"]+)/);
  const headlineMatch = block.match(/headline:\s*['"]([^'"]+)/);
  const titleMatch = block.match(/title:\s*['"]([^'"]+)/);
  const imgMatch = block.match(/imageUrl:\s*['"]([^'"]+)/);
  const headline = headlineMatch ? headlineMatch[1] : (titleMatch ? titleMatch[1] : null);
  if (headline && imgMatch) {
    articlesWithImages.push({
      id: idMatch ? idMatch[1] : 'unknown',
      headline: headline.slice(0, 55),
      img: imgMatch[1].split('/').pop(),
      fullUrl: imgMatch[1]
    });
  }
}

console.log('Total articles with images in currentAffairsData.ts:', articlesWithImages.length);
articlesWithImages.forEach(a => console.log(a.id, '|', a.headline, '|', a.img));

