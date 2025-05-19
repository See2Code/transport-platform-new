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
      // Vyhľadanie všetkých varovaní o nesprávne prefixovaných argumentoch
      const argWarnings = result.messages.filter(
        msg => msg.message && msg.message.includes("Allowed unused args must match /^_/u")
      );
      
      if (argWarnings.length > 0) {
        if (!fileChanges[filepath]) {
          fileChanges[filepath] = {
            content: fs.readFileSync(filepath, 'utf8'),
            changes: []
          };
        }
        
        // Zoradenie zmien od konca súboru, aby sme neovplyvnili indexy
        argWarnings.sort((a, b) => {
          if (a.line === b.line) {
            return b.column - a.column;
          }
          return b.line - a.line;
        });
        
        argWarnings.forEach(msg => {
          const varNameMatch = msg.message.match(/'([^']+)'/);
          if (varNameMatch && varNameMatch[1]) {
            const varName = varNameMatch[1];
            
            // Preskočiť, ak je premenná v ignorovacom zozname
            if (IGNORE_VARS.includes(varName.replace(/t_|i_|d_|e_/, ''))) {
              return;
            }
            
            // Ak je to theme s predponou t_
            if (varName === 't_heme' || varName.startsWith('t_') && varName.includes('heme')) {
              fileChanges[filepath].changes.push({
                line: msg.line,
                column: msg.column,
                varName: varName,
                newName: '_theme'
              });
            }
            // Pre premenné s predponou 'i_'
            else if (varName.startsWith('i_')) {
              fileChanges[filepath].changes.push({
                line: msg.line,
                column: msg.column,
                varName: varName,
                newName: '_' + varName.substring(2) // Odstránenie 'i_' a pridanie '_'
              });
            }
            // Pre premenné s predponou 'd_'
            else if (varName.startsWith('d_')) {
              fileChanges[filepath].changes.push({
                line: msg.line,
                column: msg.column,
                varName: varName,
                newName: '_' + varName.substring(2) // Odstránenie 'd_' a pridanie '_'
              });
            }
            // Pre premenné s predponou 'e_'
            else if (varName.startsWith('e_')) {
              fileChanges[filepath].changes.push({
                line: msg.line,
                column: msg.column,
                varName: varName,
                newName: '_' + varName.substring(2) // Odstránenie 'e_' a pridanie '_'
              });
            }
            // Pre premenné s podčiarnikmi uprostred (c_ompanyID, n_otification)
            else if (varName.includes('_') && !varName.startsWith('_')) {
              const parts = varName.split('_');
              fileChanges[filepath].changes.push({
                line: msg.line,
                column: msg.column,
                varName: varName,
                newName: '_' + parts.join('')
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
    
    // Zoradenie zmien od konca súboru, aby sme neovplyvnili indexy
    fileChanges[filepath].changes.sort((a, b) => {
      if (a.line === b.line) {
        return b.column - a.column;
      }
      return b.line - a.line;
    });
    
    // Aplikovanie zmien
    fileChanges[filepath].changes.forEach(change => {
      const lines = fileContent.split('\n');
      const line = lines[change.line - 1];
      
      // Nahradenie premennej v riadku
      lines[change.line - 1] = line.replace(
        change.varName, 
        change.newName
      );
      
      fileContent = lines.join('\n');
    });
    
    // Uloženie zmeneného súboru
    if (fileChanges[filepath].changes.length > 0) {
      fs.writeFileSync(filepath, fileContent, 'utf8');
      console.log(`Upravený súbor: ${filepath} (${fileChanges[filepath].changes.length} zmien)`);
    }
  });
  
  console.log('Hotovo! Argumenty funkcií boli správne prefixované znakom "_".');
} catch (error) {
  console.error('Chyba pri spúšťaní ESLint:', error.message);
} 