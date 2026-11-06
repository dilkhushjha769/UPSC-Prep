const fs = require('fs');

const data = JSON.parse(fs.readFileSync('src/data/generatedSyncedCurrentAffairs.json', 'utf8'));
console.log('Total articles in synced snapshot:', data.articles.length);

const mismatched = [];
data.articles.forEach(a => {
  const img = (a.image_metadata && a.image_metadata.imageUrl) || a.imageUrl || '';
  if (img) {
    mismatched.push({
      id: a.id || a.external_id,
      headline: a.headline.slice(0, 60),
      img: img.split('/').pop(),
      status: a.imageVerificationStatus
    });
  }
});

console.log('Articles with image in snapshot:', mismatched.length);
mismatched.slice(0, 30).forEach(m => console.log(m.id, '|', m.headline, '|', m.img, '|', m.status));

