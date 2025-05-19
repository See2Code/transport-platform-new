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

// Funkcia na opravu konkrétnych problémov s importami
function fixImport(content) {
  // 1. Register.tsx - chýbajúca čiarka medzi CircularProgress a useTheme
  content = content.replace(
    /CircularProgress(\s+)useTheme/g,
    'CircularProgress,$1useTheme'
  );

  // 2. RegisterUser.tsx - chýbajúca čiarka medzi setDoc a Timestamp
  content = content.replace(
    /setDoc(\s+)Timestamp/g,
    'setDoc,$1Timestamp'
  );

  // 3. ChatDrawer.tsx - chýbajúce čiarky medzi importami
  content = content.replace(
    /IconButton(\s+)styled/g,
    'IconButton,$1styled'
  );
  
  content = content.replace(
    /Badge(\s+)(\n\s*)useTheme/g,
    'Badge,$1$2useTheme'
  );

  // 4. Dashboard.tsx - chýbajúca čiarka a prerušenie riadku medzi CircularProgress a Skeleton
  content = content.replace(
    /CircularProgress(\s+)(\n\s*)Skeleton/g,
    'CircularProgress,$1$2Skeleton'
  );

  // 5. Home.tsx - chýbajúca čiarka medzi Fade a Toolbar
  content = content.replace(
    /Fade(\s+)Toolbar/g,
    'Fade,$1Toolbar'
  );

  // 6. BusinessCases.tsx - chýbajúce čiarky
  content = content.replace(
    /Snackbar(\s+)CircularProgress/g,
    'Snackbar,$1CircularProgress'
  );
  
  content = content.replace(
    /CircularProgress(\s+)Collapse/g,
    'CircularProgress,$1Collapse'
  );

  content = content.replace(
    /Collapse(\s+)TablePagination/g,
    'Collapse,$1TablePagination'
  );

  // 7. Contacts.tsx - chýbajúca čiarka
  content = content.replace(
    /MenuItem(\s+)Alert/g,
    'MenuItem,$1Alert'
  );

  // 8. Team.tsx - chýbajúca čiarka
  content = content.replace(
    /getDoc(\s+)deleteDoc/g,
    'getDoc,$1deleteDoc'
  );
  
  // Oprava chýbajúcej čiarky v orderBy onSnapshot
  content = content.replace(
    /orderBy(\s+)onSnapshot/g,
    'orderBy,$1onSnapshot'
  );
  
  // Oprava pre useChat Conversation, ChatUser
  content = content.replace(
    /useChat(\s+)Conversation/g,
    'useChat,$1Conversation'
  );

  return content;
}

// Prechádza každý súbor a opraví importy
async function main() {
  let fixedFiles = 0;
  
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
      const fixedContent = fixImport(content);
      
      // Ak sa obsah zmenil, uložíme zmeny
      if (content !== fixedContent) {
        fs.writeFileSync(filePath, fixedContent);
        console.log(`✅ Opravené importy v súbore ${file}`);
        fixedFiles++;
      } else {
        console.log(`ℹ️ Žiadne problémy s importmi neboli nájdené v súbore ${file}`);
      }
    } catch (error) {
      console.error(`❌ Chyba pri spracovaní súboru ${file}:`, error);
    }
  }
  
  console.log(`\n===== HOTOVO =====`);
  console.log(`Opravených súborov: ${fixedFiles} / ${filesToFix.length}`);
  console.log(`Skontrolujte opravené súbory pre prípadné ďalšie problémy.\n`);
}

main().catch(error => {
  console.error('Kritická chyba:', error);
  process.exit(1);
}); 