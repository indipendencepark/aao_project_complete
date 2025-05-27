#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const CONFIG = {

  excludeDirs: ['node_modules', '.git', 'build', 'dist', '.next', 'coverage', '.nyc_output'],

  extensions: {
    javascript: ['.js', '.jsx', '.ts', '.tsx', '.mjs'],
    css: ['.css', '.scss', '.sass', '.less'],
    html: ['.html', '.htm'],
    shell: ['.sh', '.bash'],
    yaml: ['.yml', '.yaml'],
    markdown: ['.md', '.mdx']
  },

  createBackup: true,
  backupDir: './backup_before_comment_removal'
};

const commentRemovers = {
  javascript: (content) => {

    content = content.replace(/^(\s*)\/\/.*$/gm, '');

    content = content.replace(/\/\*[\s\S]*?\*\//g, '');

    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return content;
  },

  css: (content) => {

    content = content.replace(/\/\*[\s\S]*?\*\//g, '');

    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    return content;
  },

  html: (content) => {

    content = content.replace(/<!--[\s\S]*?-->/g, '');
    
    return content;
  },

  shell: (content) => {

    const lines = content.split('\n');
    const processedLines = lines.map((line, index) => {

      if (index === 0 && line.startsWith('#!')) {
        return line;
      }

      return line.replace(/#.*$/, '').trimRight();
    });
    
    return processedLines.join('\n').replace(/\n\s*\n\s*\n/g, '\n\n');
  },

  yaml: (content) => {

    const lines = content.split('\n');
    const processedLines = lines.map(line => {

      if (line.includes('"') || line.includes("'")) {
        return line; // Mantieni la riga com'è per evitare di rompere stringhe
      }
      return line.replace(/#.*$/, '').trimRight();
    });
    
    return processedLines.join('\n').replace(/\n\s*\n\s*\n/g, '\n\n');
  },

  markdown: (content) => {

    content = content.replace(/<!--[\s\S]*?-->/g, '');
    
    return content;
  }
};

function getFileType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  
  for (const [type, extensions] of Object.entries(CONFIG.extensions)) {
    if (extensions.includes(ext)) {
      return type;
    }
  }
  
  return null;
}

function createBackup(sourcePath) {
  if (!CONFIG.createBackup) return;
  
  if (!fs.existsSync(CONFIG.backupDir)) {
    fs.mkdirSync(CONFIG.backupDir, { recursive: true });
  }
  
  const relativePath = path.relative(process.cwd(), sourcePath);
  const backupPath = path.join(CONFIG.backupDir, relativePath);
  const backupDir = path.dirname(backupPath);
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  fs.copyFileSync(sourcePath, backupPath);
}

function processFile(filePath) {
  const fileType = getFileType(filePath);
  
  if (!fileType || !commentRemovers[fileType]) {
    return false;
  }
  
  try {
    const originalContent = fs.readFileSync(filePath, 'utf8');
    const processedContent = commentRemovers[fileType](originalContent);

    if (originalContent !== processedContent) {
      createBackup(filePath);
      fs.writeFileSync(filePath, processedContent, 'utf8');
      
      const originalSize = Buffer.byteLength(originalContent, 'utf8');
      const newSize = Buffer.byteLength(processedContent, 'utf8');
      const savedBytes = originalSize - newSize;
      const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1);
      
      console.log(`✓ ${filePath} - Salvati ${savedBytes} bytes (${savedPercent}%)`);
      return { originalSize, newSize, savedBytes };
    }
    
    return { originalSize: 0, newSize: 0, savedBytes: 0 };
  } catch (error) {
    console.error(`✗ Errore processando ${filePath}:`, error.message);
    return false;
  }
}

function processDirectory(dirPath, stats = { files: 0, totalOriginalSize: 0, totalNewSize: 0 }) {
  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {

      if (CONFIG.excludeDirs.includes(item)) {
        console.log(`⏭ Saltando directory: ${fullPath}`);
        continue;
      }
      
      processDirectory(fullPath, stats);
    } else if (stat.isFile()) {
      const result = processFile(fullPath);
      
      if (result && result.savedBytes >= 0) {
        stats.files++;
        stats.totalOriginalSize += result.originalSize;
        stats.totalNewSize += result.newSize;
      }
    }
  }
  
  return stats;
}

function main() {
  console.log('🚀 Avvio rimozione commenti dalla codebase...\n');
  
  const startTime = Date.now();
  const targetDir = process.argv[2] || process.cwd();
  
  if (!fs.existsSync(targetDir)) {
    console.error(`❌ Directory non trovata: ${targetDir}`);
    process.exit(1);
  }
  
  console.log(`📁 Directory target: ${targetDir}`);
  console.log(`💾 Backup: ${CONFIG.createBackup ? 'Attivato' : 'Disattivato'}`);
  console.log(`📋 Escluse: ${CONFIG.excludeDirs.join(', ')}\n`);
  
  const stats = processDirectory(targetDir);
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  const totalSaved = stats.totalOriginalSize - stats.totalNewSize;
  const totalSavedPercent = stats.totalOriginalSize > 0 
    ? ((totalSaved / stats.totalOriginalSize) * 100).toFixed(1)
    : 0;
  
  console.log('\n📊 STATISTICHE FINALI:');
  console.log(`   File processati: ${stats.files}`);
  console.log(`   Dimensione originale: ${(stats.totalOriginalSize / 1024).toFixed(1)} KB`);
  console.log(`   Dimensione finale: ${(stats.totalNewSize / 1024).toFixed(1)} KB`);
  console.log(`   Spazio salvato: ${(totalSaved / 1024).toFixed(1)} KB (${totalSavedPercent}%)`);
  console.log(`   Tempo impiegato: ${duration}s`);
  
  if (CONFIG.createBackup) {
    console.log(`\n💾 Backup salvato in: ${CONFIG.backupDir}`);
  }
  
  console.log('\n✅ Processo completato!');
}

if (require.main === module) {
  main();
}

module.exports = { processFile, processDirectory, commentRemovers };