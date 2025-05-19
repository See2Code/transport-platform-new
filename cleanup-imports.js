const fs = require('fs');
const path = require('path');

// Načítame obsah súboru
const filePath = path.join(__dirname, 'src', 'components', 'layout', 'Navbar.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// Zoznam importov, ktoré sú nepoužívané podľa ESLint upozornení
const unusedImports = [
  'CssBaseline',
  'Avatar',
  'Chip',
  'CircularProgress',
  'Alert',
  'HomeIcon',
  'GroupIcon',
  'AccountIcon',
  'LocalShippingIcon',
  'ContactsIcon',
  'ChevronLeftIcon',
  'ChevronRightIcon',
  'EuroIcon',
  'AccessTimeIcon',
  'PersonIcon',
  'PersonAddIcon',
  'Link',
  'signOut',
  'auth',
  'useNotifications',
  'NotificationData',
  'format',
  'Timestamp',
  'Tooltip',
  'TooltipProps'
];

// Vytvoríme regulárny výraz na nájdenie importovaných premenných
const imports = content.match(/import [^;]+;/g) || [];

// Vytvoríme novú verziu súboru
let newContent = content;

// Prejdeme všetky importované premenné a odfiltrujeme nepoužívané
unusedImports.forEach(unusedImport => {
  // Vytvoríme regulárny výraz na nájdenie importu
  const regex = new RegExp(`\\b${unusedImport}\\b,?\\s*`);
  
  // Nahradíme v importe
  imports.forEach(importStatement => {
    const newImport = importStatement.replace(regex, '');
    
    // Ak sa import zmenil, nahradíme ho v celom obsahu
    if (newImport !== importStatement) {
      // Skontrolujeme, či import nie je prázdny
      if (!newImport.match(/import\s+{?\s*}?\s*from/)) {
        newContent = newContent.replace(importStatement, newImport);
      } else {
        // Ak je import prázdny, odstránime celý riadok
        newContent = newContent.replace(importStatement, '');
      }
    }
  });
});

// Odstránime prázdne importy (import {} from ...)
newContent = newContent.replace(/import\s+{\s*}\s+from\s+['"][^'"]+['"];?\n?/g, '');

// Odstránime duplicitné prázdne riadky
newContent = newContent.replace(/\n\s*\n\s*\n/g, '\n\n');

// Uložíme novú verziu súboru
const backupPath = filePath + '.backup';
fs.writeFileSync(backupPath, content, 'utf8');
fs.writeFileSync(filePath, newContent, 'utf8');

console.log(`Súbor bol vyčistený. Záloha: ${backupPath}`); 