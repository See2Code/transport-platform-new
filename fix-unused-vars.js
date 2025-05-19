const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Zoznam premenných, ktoré chceme ignorovať (nebudeme pridávať prefix)
const IGNORE_VARS = [
  'userData',
  'theme',
  'isLoaded',
  'selectedVehicle',
  'unreadCount'
];

// Spustenie ESLint s formátom JSON pre výstup
try {
  const output = execSync('npx eslint src --ext .ts,.tsx -f json', { encoding: 'utf8' });
  const results = JSON.parse(output);
  
  // Spracovanie každého súboru s chybami
  const fileChanges = {};
  
  results.forEach(result => {
    if (result.messages.length > 0) {
      const filepath = result.filePath;
      const unusedVars = result.messages.filter(
        msg => (msg.ruleId === 'unused-imports/no-unused-vars' || msg.ruleId === '@typescript-eslint/no-unused-vars') &&
        !msg.message.includes('must match /^_/u')
      );
      
      if (unusedVars.length > 0) {
        if (!fileChanges[filepath]) {
          fileChanges[filepath] = {
            content: fs.readFileSync(filepath, 'utf8'),
            changes: []
          };
        }
        
        // Zoradenie zmien od konca súboru, aby sme neovplyvnili indexy
        unusedVars.sort((a, b) => {
          if (a.line === b.line) {
            return b.column - a.column;
          }
          return b.line - a.line;
        });
        
        unusedVars.forEach(msg => {
          const varNameMatch = msg.message.match(/'([^']+)'/);
          if (varNameMatch && varNameMatch[1]) {
            const varName = varNameMatch[1];
            
            // Preskočiť, ak už premennú začína s '_' alebo ak ide o 'props' alebo je v ignorovacom zozname
            if (!varName.startsWith('_') && varName !== 'props' && !IGNORE_VARS.includes(varName)) {
              // Osobitne spracuj 'theme' na '_theme' (nie t_heme)
              const newName = varName === 'theme' ? '_theme' : 
                             (varName.includes('theme') ? varName.replace('theme', '_theme') : 
                             (varName.includes('_') ? '_' + varName : '_' + varName));
              
              fileChanges[filepath].changes.push({
                line: msg.line,
                column: msg.column,
                varName: varName,
                newName: newName
              });
            }
          }
        });
      }
    }
  });
  
  // Aplikovanie zmien na súbory
  Object.keys(fileChanges).forEach(filepath => {
    let fileContent = fileChanges[filepath].content;
    const lines = fileContent.split('\n');
    
    // Zoradenie zmien od konca súboru, aby sme neovplyvnili indexy
    fileChanges[filepath].changes.sort((a, b) => {
      if (a.line === b.line) {
        return b.column - a.column;
      }
      return b.line - a.line;
    });
    
    // Aplikovanie zmien
    fileChanges[filepath].changes.forEach(change => {
      const line = lines[change.line - 1];
      const varName = change.varName;

      // Pre React komponenty a iné konštanty (začínajúce veľkým písmenom)
      if (varName.match(/^[A-Z]/) && line.includes('const ' + varName)) {
        lines[change.line - 1] = line.replace(
          'const ' + varName, 
          'const _' + varName
        );
      } 
      // Pre 'theme'
      else if (varName === 'theme') {
        lines[change.line - 1] = line.replace(
          varName, 
          '_theme'
        );
      }
      // Pre parametre funkcií/argumenty (t_heme -> _theme)
      else if (varName.startsWith('t_') && varName.includes('heme')) {
        lines[change.line - 1] = line.replace(
          varName,
          '_theme'
        );
      }
      // Pre premenné 'error', 'err', atď.
      else if (varName.includes('error') || varName.includes('err')) {
        lines[change.line - 1] = line.replace(
          varName,
          '_' + varName
        );
      }
      // Štandardná náhrada
      else {
        lines[change.line - 1] = line.replace(
          varName,
          '_' + varName
        );
      }
    });
    
    // Uloženie zmeneného súboru
    if (fileChanges[filepath].changes.length > 0) {
      fs.writeFileSync(filepath, lines.join('\n'), 'utf8');
      console.log(`Upravený súbor: ${filepath} (${fileChanges[filepath].changes.length} zmien)`);
    }
  });
  
  console.log('Hotovo! Nepoužívané premenné boli prefixované znakom "_".');
} catch (error) {
  console.error('Chyba pri spúšťaní ESLint:', error.message);
} 