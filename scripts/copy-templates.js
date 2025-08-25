import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, '..', 'src', 'modules', 'notifications', 'templates');
const targetDir = path.join(__dirname, '..', 'dist', 'modules', 'notifications', 'templates');

// Create target directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Copy all .hbs files
const files = fs.readdirSync(sourceDir);
for (const file of files) {
  if (file.endsWith('.hbs')) {
    fs.copyFileSync(
      path.join(sourceDir, file),
      path.join(targetDir, file)
    );
    console.log(`Copied template: ${file}`);
  }
}

console.log('All templates copied successfully!'); 