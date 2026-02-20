const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '../tunnel-output.log');

console.log('🚇 Միացնում եմ Cloudflare Tunnel...\n');

// Ստեղծել log file
const writeStream = fs.createWriteStream(logFile, { flags: 'w' });

const tunnel = spawn('npx', ['--yes', 'cloudflared', 'tunnel', '--url', 'http://localhost:3000'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

let urlFound = false;

tunnel.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  writeStream.write(output);
  
  // Գտնում ենք URL-ը output-ում
  const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (urlMatch && !urlFound) {
    urlFound = true;
    const url = urlMatch[0];
    console.log('\n' + '='.repeat(80));
    console.log('✅ TUNNEL URL:');
    console.log(url);
    console.log('='.repeat(80) + '\n');
    
    // Գրել URL-ը ֆայլում
    fs.writeFileSync(path.join(__dirname, '../tunnel-url.txt'), url);
  }
});

tunnel.stderr.on('data', (data) => {
  const output = data.toString();
  process.stderr.write(output);
  writeStream.write(output);
  
  // Երբեմն URL-ը stderr-ում է
  const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
  if (urlMatch && !urlFound) {
    urlFound = true;
    const url = urlMatch[0];
    console.log('\n' + '='.repeat(80));
    console.log('✅ TUNNEL URL:');
    console.log(url);
    console.log('='.repeat(80) + '\n');
    
    fs.writeFileSync(path.join(__dirname, '../tunnel-url.txt'), url);
  }
});

tunnel.on('close', (code) => {
  writeStream.end();
  if (code !== 0) {
    console.error(`\n❌ Tunnel-ը փակվեց կոդով: ${code}`);
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Փակում եմ tunnel-ը...');
  writeStream.end();
  tunnel.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  writeStream.end();
  tunnel.kill();
  process.exit(0);
});



