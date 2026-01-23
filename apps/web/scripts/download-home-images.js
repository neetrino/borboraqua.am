const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Image mappings: variable name -> URL
const images = {
  imgBorborAguaLogoColorB2024Colored1: "https://www.figma.com/api/mcp/asset/b106fddf-ddb7-4708-ad7a-7cb2873cb7c9",
  imgDanielSinocaAancLsb0SU0Unsplash1: "https://www.figma.com/api/mcp/asset/4871f446-450c-4331-8d45-fc09cffddcdf",
  imgDanielSinocaAancLsb0SU0Unsplash2: "https://www.figma.com/api/mcp/asset/bc03b396-c7f6-4c82-8e98-d5787b0a9f5f",
  img: "https://www.figma.com/api/mcp/asset/9bb170f3-78f7-41dc-a30d-f7aba37fbea1",
  img1: "https://www.figma.com/api/mcp/asset/3505a6b7-91e7-402f-a08d-2db92f4d6d86",
  img2: "https://www.figma.com/api/mcp/asset/d2d605c5-1270-4604-96ed-7891bee71207",
  img3: "https://www.figma.com/api/mcp/asset/2d6b9be1-5538-4773-b058-136917510437",
  img6Eb12990A37F43358E368Af827A9C8A5Png1: "https://www.figma.com/api/mcp/asset/997a7a91-9b2c-4abb-b622-b9cea1e370cc",
  imgLogo1: "https://www.figma.com/api/mcp/asset/f944f29e-d08d-48db-92a2-188ad56f05bd",
  imgSas20Logo1: "https://www.figma.com/api/mcp/asset/c1185ab0-5e7b-4b0b-9deb-a9198c674de5",
  img5: "https://www.figma.com/api/mcp/asset/b2aad9d2-8b80-4e27-a38f-82458f66f9fd",
  img6: "https://www.figma.com/api/mcp/asset/512a12fb-f4a9-4cf0-9336-14e07b49ce82",
  img17: "https://www.figma.com/api/mcp/asset/15c9e520-a101-4e13-804c-6fe7185257de",
  imgFrame3292: "https://www.figma.com/api/mcp/asset/f7896520-8d84-451d-b191-3918fc96568c",
  imgEllipse41: "https://www.figma.com/api/mcp/asset/43ab67eb-2375-4a42-aa17-a9e5a1949fb1",
  imgShape: "https://www.figma.com/api/mcp/asset/8b35da42-18d0-4050-bbe7-5222c75f464b",
  imgEllipse44: "https://www.figma.com/api/mcp/asset/d8dfe400-7d4b-4c94-bd51-617fe492e640",
  imgShape1: "https://www.figma.com/api/mcp/asset/ac78c9b1-acff-459c-be01-77e84c3c1b7e",
  imgShape2: "https://www.figma.com/api/mcp/asset/90f42685-0444-4f5f-8e9d-37eac5a9e2f2",
  imgEllipse42: "https://www.figma.com/api/mcp/asset/5e6292ef-d0f8-47e3-828f-4727614e7e4d",
  imgShape3: "https://www.figma.com/api/mcp/asset/379c6514-3b13-4734-a155-88259968a700",
  imgEllipse43: "https://www.figma.com/api/mcp/asset/0259f224-0c94-469b-af5c-b1f43dcfe496",
  imgGroup2105: "https://www.figma.com/api/mcp/asset/41b6e81d-4948-41fd-8e45-f0771ba49400",
  imgIcon: "https://www.figma.com/api/mcp/asset/1f3f805e-d342-492d-b62f-0ee10262d176",
  img4: "https://www.figma.com/api/mcp/asset/3790c683-0678-49d5-9066-e1597763c958",
  imgIcon1: "https://www.figma.com/api/mcp/asset/308e9fce-055c-4fe7-b4ec-d6e5ac91d1ef",
  imgVector4: "https://www.figma.com/api/mcp/asset/da0e029f-e6ab-4c9a-ad7c-202c72ab4c82",
  imgVector5: "https://www.figma.com/api/mcp/asset/4bd887f5-a117-4a36-8165-ec4d5e48d691",
  imgVector6: "https://www.figma.com/api/mcp/asset/b3518300-1756-4faa-a6f1-ce08fa895783",
  imgVector7: "https://www.figma.com/api/mcp/asset/28faa81b-c5cd-4902-b1a9-c4ad891ee203",
  imgVector: "https://www.figma.com/api/mcp/asset/bf9313e8-ec3b-4ca9-a524-37d8485d4e9d",
  imgIcon2: "https://www.figma.com/api/mcp/asset/2cd7e92d-245f-4279-92e8-d685f93b2aa4",
  imgSvg: "https://www.figma.com/api/mcp/asset/4d0d1287-b954-451a-a592-5eba28116160",
  imgSvg1: "https://www.figma.com/api/mcp/asset/fe4a6a3b-4ef9-43e8-8693-c1e538283c41",
  imgGroup: "https://www.figma.com/api/mcp/asset/86098cb5-762b-47ef-8350-9c44d61ae29f",
  imgLink: "https://www.figma.com/api/mcp/asset/c0e72a8f-d8d8-4b2d-ac1f-645001a4b42d",
  imgGroup2122: "https://www.figma.com/api/mcp/asset/6d343979-117f-4f25-9dba-148f9b14abd4",
  imgGroup2121: "https://www.figma.com/api/mcp/asset/2e931b4d-2931-4235-8c2b-a2d5f1806711",
  imgGroup2124: "https://www.figma.com/api/mcp/asset/84ea6876-17b8-4b9b-9851-59f2422494d4",
  imgGroup2123: "https://www.figma.com/api/mcp/asset/072e9c63-2457-4c22-94fc-276add2dff2b",
  img7: "https://www.figma.com/api/mcp/asset/5e5a01ec-d5cb-498f-8a9d-82c50311da10",
  img8: "https://www.figma.com/api/mcp/asset/f32df2b9-d44d-4b51-b3d8-85425e86c34b",
  img9: "https://www.figma.com/api/mcp/asset/b9cead35-a280-40ac-a001-1dad7373d7b4",
  img10: "https://www.figma.com/api/mcp/asset/7baa3994-4292-4f4e-90e4-fe1cc5af96aa",
  img11: "https://www.figma.com/api/mcp/asset/633f76bb-f52a-4959-b35b-401335056328",
  img12: "https://www.figma.com/api/mcp/asset/27e6bac6-d566-4b22-b028-292442439ef7",
  img13: "https://www.figma.com/api/mcp/asset/45f9a2ad-6701-4905-a022-65619c9caa48",
  img13Decorative: "https://www.figma.com/api/mcp/asset/cc815d32-3501-4133-9848-3d322d6a7db8",
  img14: "https://www.figma.com/api/mcp/asset/74737aa6-9360-47e1-979e-42223e542b5e",
  img15: "https://www.figma.com/api/mcp/asset/babaf6e8-f74e-4a66-ab54-0fb95309f75b",
  img16: "https://www.figma.com/api/mcp/asset/1ef0b957-39c5-4b9d-9afd-b90d72ff4570",
  img18: "https://www.figma.com/api/mcp/asset/65825bce-8684-4e63-8d01-3dca9111914a",
  imgImage5: "https://www.figma.com/api/mcp/asset/7de49827-29c4-470d-a625-3f8a0d6a1a61",
  imgImage11: "https://www.figma.com/api/mcp/asset/ea475088-694e-4438-9b36-cd352182705b"
};

const outputDir = path.join(__dirname, '../public/assets/home');

// Create directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`✅ Created directory: ${outputDir}`);
}

// Download function
function downloadImage(url, filename) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      if (response.statusCode === 200) {
        // Detect file extension from Content-Type header
        const contentType = response.headers['content-type'] || '';
        let extension = '.png'; // default
        if (contentType.includes('svg')) {
          extension = '.svg';
        } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
          extension = '.jpg';
        } else if (contentType.includes('webp')) {
          extension = '.webp';
        }
        
        // Update filename with correct extension
        const baseFilename = filename.replace(/\.(png|svg|jpg|webp)$/i, '');
        const finalFilename = baseFilename + extension;
        const filepath = path.join(outputDir, finalFilename);
        
        // Skip if file already exists
        if (fs.existsSync(filepath)) {
          console.log(`⏭️  Skipped (already exists): ${finalFilename}`);
          resolve();
          return;
        }
        
        const fileStream = fs.createWriteStream(filepath);
        response.pipe(fileStream);
        
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`✅ Downloaded: ${finalFilename} (${contentType})`);
          resolve();
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirects
        downloadImage(response.headers.location, filename)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      reject(new Error(`Error downloading ${filename}: ${err.message}`));
    });
  });
}

// Download all images
async function downloadAllImages() {
  console.log('🚀 Starting image download...\n');
  console.log(`📁 Output directory: ${outputDir}\n`);
  
  const entries = Object.entries(images);
  let successCount = 0;
  let errorCount = 0;
  
  for (const [varName, url] of entries) {
    // Extract file extension from URL or default to png
    const urlParts = url.split('/');
    const assetId = urlParts[urlParts.length - 1];
    const filename = `${varName}.png`; // Default to png, we'll detect actual type from response
    
    try {
      await downloadImage(url, filename);
      successCount++;
      
      // Add small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`❌ Error: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📁 Total: ${entries.length}`);
}

// Run the download
downloadAllImages().catch(console.error);

