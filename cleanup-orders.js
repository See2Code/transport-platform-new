const fs = require('fs');
const path = require('path');

// Názov súboru pre vyčistenie
const targetFileName = 'Orders.tsx';
const targetDirectory = path.join('src', 'components', 'orders');
const filePath = path.join(__dirname, targetDirectory, targetFileName);

// Kontrola, či súbor existuje
if (!fs.existsSync(filePath)) {
  console.error(`Súbor ${filePath} neexistuje!`);
  process.exit(1);
}

// Načítame obsah súboru
const content = fs.readFileSync(filePath, 'utf8');

// Zoznam importov, ktoré sú nepoužívané na základe našej manuálnej analýzy
const unusedImports = [
  'CustomerType',
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
  // Pridajte sem ďalšie nepoužívané importy, ak ich nájdete
];

// Vytvoríme zálohu pôvodného súboru
const backupPath = `${filePath}.backup`;
fs.writeFileSync(backupPath, content);
console.log(`Pôvodný súbor zálohovaný do ${backupPath}`);

// Funkcia na vyčistenie importov
const cleanImports = (code, importsToRemove) => {
  let newCode = code;
  
  console.log('Importy na odstránenie:', importsToRemove.join(', '));
  
  // Prejdeme všetky importované premenné a odfiltrujeme nepoužívané
  importsToRemove.forEach(unusedImport => {
    // Upravíme import v { ... } bloku
    const braceImportRegex = new RegExp(`(import\\s+{[^}]*),?\\s*${unusedImport}\\s*,?([^}]*}\\s+from\\s+['"].*?['"];)`, 'g');
    newCode = newCode.replace(braceImportRegex, (match, before, after) => {
      console.log(`Našiel som import: ${match}`);
      
      // Vyčistíme prebytočné čiarky a medzery
      let afterClean = after.replace(/^\s*,\s*/, '');
      let beforeClean = before.replace(/\s*,\s*$/, '');
      
      // Ak máme prázdne zátvorky { }, odstránime celý import
      if (beforeClean.trim().endsWith('{') && afterClean.trim().startsWith('}')) {
        console.log(`Odstraňujem celý import: ${match}`);
        return '';
      }
      
      const modifiedImport = `${beforeClean}${afterClean}`;
      console.log(`Upravený import: ${modifiedImport}`);
      return modifiedImport;
    });
  });
  
  return newCode;
};

// Aplikujeme čistenie
const updatedContent = cleanImports(content, unusedImports);

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