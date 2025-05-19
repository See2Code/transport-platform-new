const fs = require('fs');
const path = require('path');

// Prijímame názov súboru ako parameter príkazového riadka
// node cleanup-imports-global.js cesta/k/suboru.tsx
const targetFilePath = process.argv[2];

if (!targetFilePath) {
  console.error('Použitie: node cleanup-imports-global.js cesta/k/suboru.tsx [importy_na_odstranenie]');
  console.error('Príklad: node cleanup-imports-global.js src/components/Navbar.tsx Button,Chip,Avatar');
  process.exit(1);
}

// Absolútna cesta k súboru
const filePath = path.resolve(targetFilePath);

// Kontrola, či súbor existuje
if (!fs.existsSync(filePath)) {
  console.error(`Súbor ${filePath} neexistuje!`);
  process.exit(1);
}

// Načítame obsah súboru
const content = fs.readFileSync(filePath, 'utf8');

// Zoznam importov na odstránenie môže byť poskytnutý ako parameter
let unusedImports = [];
if (process.argv[3]) {
  unusedImports = process.argv[3].split(',').map(item => item.trim());
} else {
  // Predvolený zoznam bežne nepoužívaných importov
  unusedImports = [
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
    'Card',
    'Badge',
  ];
}

// Vytvoríme zálohu pôvodného súboru
const backupPath = `${filePath}.backup`;
fs.writeFileSync(backupPath, content);
console.log(`Pôvodný súbor zálohovaný do ${backupPath}`);

// Funkcia na detekciu nepoužívaných importov v súbore
const detectUnusedImports = (code, importsList) => {
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
};

// Detekcia skutočne nepoužívaných importov
const detectionResult = detectUnusedImports(content, unusedImports);
console.log('Detekované nepoužívané importy:', detectionResult.unused.join(', ') || 'žiadne');
if (detectionResult.used.length) {
  console.log('Tieto importy sú používané a nebudú odstránené:', detectionResult.used.join(', '));
}

// Ak nie sú žiadne nepoužívané importy, skončíme
if (detectionResult.unused.length === 0) {
  console.log('Neboli nájdené žiadne nepoužívané importy na odstránenie.');
  process.exit(0);
}

// Funkcia na vyčistenie importov
const cleanImports = (code, importsToRemove) => {
  let newCode = code;
  
  // Prejdeme všetky importované premenné a odfiltrujeme nepoužívané
  importsToRemove.forEach(unusedImport => {
    // Upravíme import v { ... } bloku
    const braceImportRegex = new RegExp(`(import\\s+{[^}]*),?\\s*${unusedImport}\\s*,?([^}]*}\\s+from\\s+['"].*?['"];)`, 'g');
    newCode = newCode.replace(braceImportRegex, (match, before, after) => {
      console.log(`Našiel som import: ${unusedImport}`);
      
      // Vyčistíme prebytočné čiarky a medzery
      let afterClean = after.replace(/^\s*,\s*/, '');
      let beforeClean = before.replace(/\s*,\s*$/, '');
      
      // Ak máme prázdne zátvorky { }, odstránime celý import
      if (beforeClean.trim().endsWith('{') && afterClean.trim().startsWith('}')) {
        console.log(`Odstraňujem celý import pre ${unusedImport}`);
        return '';
      }
      
      return `${beforeClean}${afterClean}`;
    });
  });
  
  return newCode;
};

// Aplikujeme čistenie len pre skutočne nepoužívané importy
const updatedContent = cleanImports(content, detectionResult.unused);

// Skontrolujeme, či sa obsah zmenil
if (content !== updatedContent) {
  // Uložíme upravený obsah
  fs.writeFileSync(filePath, updatedContent);
  console.log(`Súbor ${filePath} bol úspešne aktualizovaný. Odstránené nepoužívané importy.`);
} else {
  console.log(`Žiadne zmeny neboli vykonané v súbore ${filePath}.`);
}

console.log('Hotovo! Skontrolujte súbor, či neobsahuje chyby.');

// Vypíšeme návod ako obnoviť zálohu v prípade potreby
console.log(`\nAk potrebujete obnoviť pôvodnú verziu, použite príkaz:`);
console.log(`cp ${backupPath} ${filePath}`); 