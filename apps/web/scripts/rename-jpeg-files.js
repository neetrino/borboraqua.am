const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '../public/assets/home');

const filesToRename = [
  'imgDanielSinocaAancLsb0SU0Unsplash1.png',
  'imgDanielSinocaAancLsb0SU0Unsplash2.png'
];

console.log('🔄 Renaming JPEG files...\n');

filesToRename.forEach(filename => {
  const oldPath = path.join(imagesDir, filename);
  const newPath = path.join(imagesDir, filename.replace('.png', '.jpg'));
  
  if (fs.existsSync(oldPath)) {
    // Verify it's actually a JPEG
    const buffer = fs.readFileSync(oldPath);
    const isJPEG = buffer[0] === 0xFF && buffer[1] === 0xD8;
    
    if (isJPEG) {
      fs.renameSync(oldPath, newPath);
      console.log(`✅ Renamed: ${filename} → ${filename.replace('.png', '.jpg')}`);
    } else {
      console.log(`⚠️  ${filename} is not a JPEG, skipping...`);
    }
  } else {
    console.log(`⚠️  File not found: ${filename}`);
  }
});

console.log('\n✅ Done!');



