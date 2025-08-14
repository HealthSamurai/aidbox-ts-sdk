#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const indexDtsPath = path.join(__dirname, '../dist/types/index.d.ts');

if (fs.existsSync(indexDtsPath)) {
  let content = fs.readFileSync(indexDtsPath, 'utf8');
  
  // Remove CSS import from TypeScript declarations
  content = content.replace(/^import\s+["']\.\/index\.css["'];?\s*\n/m, '');
  
  fs.writeFileSync(indexDtsPath, content);
  console.log('✅ Cleaned up TypeScript declarations');
} else {
  console.log('⚠️  index.d.ts not found');
}