const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '../public/assets/home');

// Check all PNG files to see if they're actually SVG
const files = fs.readdirSync(imagesDir).filter(f => f.endsWith('.png'));

console.log('🔍 Checking image file types...\n');

files.forEach(filename => {
  const filepath = path.join(imagesDir, filename);
  const buffer = fs.readFileSync(filepath);
  
  // Check if it's actually an SVG (starts with < or <?xml)
  const firstBytes = buffer.slice(0, 100).toString('utf-8');
  if (firstBytes.trim().startsWith('<') || firstBytes.trim().startsWith('<?xml')) {
    const newFilename = filename.replace('.png', '.svg');
    const newFilepath = path.join(imagesDir, newFilename);
    
    console.log(`🔄 Renaming ${filename} → ${newFilename} (detected as SVG)`);
    fs.renameSync(filepath, newFilepath);
  } else {
    // Check PNG signature (89 50 4E 47)
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
      console.log(`✅ ${filename} is a valid PNG`);
    } else {
      console.log(`⚠️  ${filename} - Unknown format (first bytes: ${buffer.slice(0, 4).toString('hex')})`);
    }
  }
});

console.log('\n✅ Done!');










