const fs = require('fs');
const path = require('path');

// Súbory, ktoré potrebujeme opraviť
const filesToFix = [
  'src/components/auth/Register.tsx',
  'src/components/auth/RegisterUser.tsx',
  'src/components/chat/ChatDrawer.tsx',
  'src/components/layout/Dashboard.tsx',
  'src/components/layout/Home.tsx',
  'src/components/management/BusinessCases.tsx',
  'src/components/management/Contacts.tsx',
  'src/components/management/Team.tsx'
];

// Funkcia na pridanie čiarky medzi importované komponenty
function fixImportSyntax(content) {
  // Nájsť import bloky
  const importBlockRegex = /import\s+{([^}]+)}\s+from\s+['"]([^'"]+)['"]/g;
  
  return content.replace(importBlockRegex, (match, importItems, importPath) => {
    // Rozdelíme importy podľa čiarok a odstránime medzery
    const items = importItems.split(',').map(item => item.trim());
    
    // Skontrolujeme, či existujú položky bez čiarok medzi nimi
    let hasErrors = false;
    let cleanedItems = [];
    let currentItem = '';
    
    for (let i = 0; i < items.length; i++) {
      if (!items[i]) continue;
      
      // Ak je posledný znak položky nie medzera a ďalšia položka existuje,
      // je tu pravdepodobne chýbajúca čiarka
      if (currentItem) {
        cleanedItems.push(currentItem);
        currentItem = '';
      }
      
      currentItem = items[i];
      
      // Ak nájdeme položku, ktorá obsahuje ďalšie slová bez čiarky
      const words = items[i].trim().split(/\s+/);
      if (words.length > 1 && !items[i].includes(' as ')) {
        hasErrors = true;
        words.forEach(word => {
          if (word) cleanedItems.push(word);
        });
        currentItem = '';
      }
    }
    
    if (currentItem) {
      cleanedItems.push(currentItem);
    }
    
    // Ak sme našli chyby, vytvoríme nový import blok
    if (hasErrors) {
      return `import {\n  ${cleanedItems.join(',\n  ')}\n} from '${importPath}'`;
    }
    
    return match;
  });
}

// Prechádza každý súbor a opraví importy
async function main() {
  for (const file of filesToFix) {
    try {
      const filePath = path.resolve(file);
      
      // Skontroluj, či súbor existuje
      if (!fs.existsSync(filePath)) {
        console.log(`Súbor ${file} neexistuje. Preskakujem...`);
        continue;
      }
      
      // Načítame obsah súboru
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Záloha pôvodného súboru
      fs.writeFileSync(`${filePath}.backup`, content);
      console.log(`Vytvorená záloha súboru ${file}`);
      
      // Oprava syntaxe importov
      const fixedContent = fixImportSyntax(content);
      
      // Ak sa obsah zmenil, uložíme zmeny
      if (content !== fixedContent) {
        fs.writeFileSync(filePath, fixedContent);
        console.log(`Opravené importy v súbore ${file}`);
      } else {
        console.log(`Žiadne problémy s importmi neboli nájdené v súbore ${file}`);
      }
    } catch (error) {
      console.error(`Chyba pri spracovaní súboru ${file}:`, error);
    }
  }
  
  console.log('Hotovo! Skontrolujte opravené súbory pre prípadné ďalšie problémy.');
}

main().catch(error => {
  console.error('Kritická chyba:', error);
  process.exit(1);
}); 