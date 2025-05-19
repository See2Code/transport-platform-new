const fs = require('fs');
const path = require('path');

// Konfigurácia
const sourceDir = path.resolve(__dirname, 'src');
const ignorePatterns = [
  'node_modules',
  '.git',
  'public',
  'build',
  'dist',
  'coverage',
  'test',
  'spec',
  '.svg',
  '.json',
  '.css',
  '.d.ts'
];

// Predvolený zoznam bežne nepoužívaných importov
const commonUnusedImports = [
  'FormEvent',
  'SavedPlace',
  'FormControl',
  'InputLabel',
  'Select',
  'MenuItem',
  'SelectChangeEvent',
  'Autocomplete', 
  'Chip',
  'FormControlLabel',
  'DateTimePicker',
  'FormGroup',
  'Switch',
  'Avatar',
  'Tooltip',
  'CircularProgress',
  'Container',
  'Card',
  'Checkbox',
  'Radio',
  'Grid',
  'List',
  'ListItem',
  'ListItemText',
  'ListItemIcon',
  'ListItemAvatar',
  'Drawer',
  'AppBar',
  'Toolbar',
  'Fade',
  'Grow',
  'Badge',
  'CSSObject',
  'updateDoc',
  'useThemeMode',
  'collection',
  'Tabs',
  'Tab',
  'Message',
  'limit',
  'format',
  'NotificationData',
  'TooltipProps',
  'OnClick',
  'Component',
  'ReactNode',
  'MouseEvent',
  'createContext',
  'FC',
  'PropsWithChildren',
  'KeyboardEvent',
  'ChangeEvent',
  'onSnapshot',
  'useEffect',
  'useCallback',
  'useState',
  'Children',
  'ReactElement',
];

// Funkcia na kontrolu, či cestu môžeme ignorovať
function shouldIgnore(filePath) {
  return ignorePatterns.some(pattern => filePath.includes(pattern));
}

// Rekurzívna funkcia na nájdenie všetkých TypeScript a React súborov v adresári
function findTsFiles(dir, fileList = []) {
  if (shouldIgnore(dir)) return fileList;
  
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    
    if (shouldIgnore(filePath)) continue;
    
    const isDirectory = fs.statSync(filePath).isDirectory();
    
    if (isDirectory) {
      findTsFiles(filePath, fileList);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

// Funkcia na detekciu nepoužívaných importov v súbore
function detectUnusedImports(code, importsList) {
  const usedImports = [];
  const unusedDetected = [];

  importsList.forEach(importName => {
    // Vyhľadáme importy vo formáte import { X } from '...'
    const importMatch = new RegExp(`import\\s+{[^}]*\\b${importName}\\b[^}]*}\\s+from\\s+`, 'g').test(code);
    if (!importMatch) return; // Import neexistuje v súbore

    // Hľadáme použitie importu v kóde (mimo importových príkazov)
    // Vylúčime importové sekcie
    const codeWithoutImports = code.replace(/import\s+(?:{[\s\S]*?}|[\w*]+)\s+from\s+(['"]).*?\1;/g, '');
    
    // Kontrola, či sa import používa v kóde
    // Hľadáme buď <ImportName, <ImportName/>, <ImportName>, ImportName. alebo ImportName(
    const usageRegex = new RegExp(`(<${importName}[\\s/>]|<${importName}$|[^a-zA-Z0-9_]${importName}[.(\\s]|^${importName}[.(\\s])`, 'g');
    const isUsed = usageRegex.test(codeWithoutImports);

    if (!isUsed) {
      unusedDetected.push(importName);
    } else {
      usedImports.push(importName);
    }
  });

  return {
    unused: unusedDetected,
    used: usedImports
  };
}

// Funkcia na vyčistenie importov v súbore
function cleanImports(code, importsToRemove) {
  let newCode = code;
  
  // Prejdeme všetky importované premenné a odfiltrujeme nepoužívané
  importsToRemove.forEach(unusedImport => {
    // Upravíme import v { ... } bloku
    const braceImportRegex = new RegExp(`(import\\s+{[^}]*),?\\s*${unusedImport}\\s*,?([^}]*}\\s+from\\s+['"].*?['"];)`, 'g');
    newCode = newCode.replace(braceImportRegex, (match, before, after) => {
      // Vyčistíme prebytočné čiarky a medzery
      let afterClean = after.replace(/^\s*,\s*/, '');
      let beforeClean = before.replace(/\s*,\s*$/, '');
      
      // Ak máme prázdne zátvorky { }, odstránime celý import
      if (beforeClean.trim().endsWith('{') && afterClean.trim().startsWith('}')) {
        return '';
      }
      
      return `${beforeClean}${afterClean}`;
    });
  });
  
  return newCode;
}

// Hlavná funkcia na spracovanie súborov
function main() {
  // Nájdeme všetky vhodné súbory
  console.log('Hľadanie TypeScript súborov...');
  const files = findTsFiles(sourceDir);
  console.log(`Nájdených ${files.length} súborov na analýzu.`);

  // Premenné pre sledovanie štatistík
  let processedCount = 0;
  let modifiedCount = 0;
  let totalRemovedImports = 0;
  const filesWithRemovedImports = [];

  // Spracujeme každý súbor
  for (const filePath of files) {
    try {
      console.log(`\nSpracúvam súbor (${++processedCount}/${files.length}): ${filePath}`);
      
      // Načítame obsah súboru
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Detekcia nepoužívaných importov
      const detectionResult = detectUnusedImports(content, commonUnusedImports);
      
      // Ak sme našli nepoužívané importy
      if (detectionResult.unused.length > 0) {
        console.log(`V súbore ${path.basename(filePath)} boli nájdené nepoužívané importy:`, detectionResult.unused.join(', '));
        
        // Vytvoríme zálohu pôvodného súboru
        const backupPath = `${filePath}.backup`;
        fs.writeFileSync(backupPath, content);
        
        // Vyčistíme importy
        const updatedContent = cleanImports(content, detectionResult.unused);
        
        // Ak sa obsah zmenil, uložíme zmeny
        if (content !== updatedContent) {
          fs.writeFileSync(filePath, updatedContent);
          modifiedCount++;
          totalRemovedImports += detectionResult.unused.length;
          filesWithRemovedImports.push({
            file: filePath,
            removed: detectionResult.unused
          });
          console.log(`✅ Súbor ${path.basename(filePath)} bol aktualizovaný - odstránených ${detectionResult.unused.length} importov.`);
        }
      } else {
        console.log(`Žiadne nepoužívané importy neboli nájdené v ${path.basename(filePath)}.`);
      }
    } catch (error) {
      console.error(`Chyba pri spracovaní súboru ${filePath}:`, error);
    }
  }

  // Súhrnné štatistiky
  console.log('\n==== SÚHRN ====');
  console.log(`Analyzovaných súborov: ${files.length}`);
  console.log(`Modifikovaných súborov: ${modifiedCount}`);
  console.log(`Celkovo odstránených importov: ${totalRemovedImports}`);
  
  if (filesWithRemovedImports.length > 0) {
    console.log('\nSúbory s odstránenými importami:');
    filesWithRemovedImports.forEach(item => {
      console.log(`- ${item.file}: ${item.removed.join(', ')}`);
    });
  }
  
  console.log('\nHotovo!');
}

// Spustíme hlavnú funkciu
try {
  main();
} catch (error) {
  console.error('Kritická chyba:', error);
  process.exit(1);
} 