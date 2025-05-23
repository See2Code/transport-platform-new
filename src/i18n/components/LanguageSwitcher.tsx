import React from 'react';
import { useTranslation } from 'react-i18next';
import { IconButton, Tooltip, Box } from '@mui/material';

// SVG vlajky z flagcdn.com - rovnaké ako v navbar-e
const SKFlagIcon = () => (
  <img 
    loading="lazy" 
    width="20" 
    height="15"
    src="https://flagcdn.com/sk.svg" 
    alt="Slovenská vlajka" 
    style={{ borderRadius: '2px', objectFit: 'cover' }}
  />
);

const ENFlagIcon = () => (
  <img 
    loading="lazy" 
    width="20" 
    height="15"
    src="https://flagcdn.com/gb.svg" 
    alt="Anglická vlajka" 
    style={{ borderRadius: '2px', objectFit: 'cover' }}
  />
);

/**
 * Komponent pre prepínanie medzi slovenským a anglickým jazykom
 */
const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  
  const currentLanguage = i18n.language;
  const isEN = currentLanguage === 'en';
  
  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    // Uložíme vybraný jazyk do localStorage pre zachovanie preferencie
    localStorage.setItem('i18nextLng', language);
  };

  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Tooltip title="Slovenčina">
        <IconButton 
          onClick={() => changeLanguage('sk')}
          sx={{ 
            opacity: !isEN ? 1 : 0.6,
            '&:hover': { opacity: 1 }
          }}
        >
          <SKFlagIcon />
        </IconButton>
      </Tooltip>
      
      <Tooltip title="English">
        <IconButton 
          onClick={() => changeLanguage('en')}
          sx={{ 
            opacity: isEN ? 1 : 0.6,
            '&:hover': { opacity: 1 }
          }}
        >
          <ENFlagIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default LanguageSwitcher; 