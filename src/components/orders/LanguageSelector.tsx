import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  GlobalStyles
} from '@mui/material';
import { useThemeMode } from '../../contexts/ThemeContext';

interface LanguageSelectorProps {
  open: boolean;
  anchorEl: null | HTMLElement;
  onClose: () => void;
  onLanguageSelect: (language: 'sk' | 'en' | 'de' | 'cs' | 'pl') => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  open,
  anchorEl,
  onClose,
  onLanguageSelect
}) => {
  const { isDarkMode } = useThemeMode();
  
  const languages = [
    { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'cs', name: 'Čeština', flag: '🇨🇿' },
    { code: 'pl', name: 'Polski', flag: '🇵🇱' }
  ] as const;

  return (
    <>
      {/* Globálne štýly pre Language Selector v dark mode */}
      {open && isDarkMode && (
        <GlobalStyles
          styles={{
            '.language-selector-menu .MuiMenuItem-root': {
              color: '#ffffff !important',
            },
            '.language-selector-menu .MuiMenuItem-root .MuiListItemText-primary': {
              color: '#ffffff !important',
            },
            '.language-selector-menu .MuiMenuItem-root .MuiTypography-root': {
              color: '#ffffff !important',
            },
            '.language-selector-menu .MuiListItemText-root .MuiTypography-root': {
              color: '#ffffff !important',
            }
          }}
        />
      )}
      
      <Menu
        open={open}
        anchorEl={anchorEl}
        onClose={onClose}
        className="language-selector-menu"
        PaperProps={{
          sx: {
            minWidth: '200px',
            borderRadius: '12px',
            boxShadow: isDarkMode 
              ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
              : '0 8px 32px rgba(0, 0, 0, 0.15)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            backgroundColor: isDarkMode 
              ? 'rgba(28, 28, 45, 0.95)' 
              : '#ffffff',
            backdropFilter: 'blur(10px)',
            // Silnejšie CSS pravidlá pre text v dark mode
            '& .MuiMenuItem-root': {
              color: isDarkMode ? '#ffffff !important' : '#000000 !important',
              '& .MuiListItemText-primary': {
                color: isDarkMode ? '#ffffff !important' : '#000000 !important',
              },
              '& .MuiTypography-root': {
                color: isDarkMode ? '#ffffff !important' : '#000000 !important',
              }
            }
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            px: 2,
            py: 1,
            fontWeight: 600,
            color: isDarkMode ? 'rgba(255, 255, 255, 0.7) !important' : 'rgba(0, 0, 0, 0.6) !important',
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
          }}
        >
          Vyberte jazyk PDF
        </Typography>
        {languages.map((language) => (
          <MenuItem
            key={language.code}
            onClick={() => onLanguageSelect(language.code)}
            sx={{
              py: 1.5,
              color: isDarkMode ? '#ffffff !important' : '#000000 !important',
              '&:hover': {
                backgroundColor: 'rgba(255, 159, 67, 0.1)'
              },
              '& .MuiListItemText-root': {
                '& .MuiTypography-root': {
                  color: isDarkMode ? '#ffffff !important' : '#000000 !important',
                }
              }
            }}
          >
            <ListItemIcon sx={{ minWidth: '36px' }}>
              <Typography variant="h6">{language.flag}</Typography>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography
                  style={{
                    color: isDarkMode ? '#ffffff' : '#000000',
                    fontSize: '0.9rem',
                    fontWeight: 500
                  }}
                  sx={{
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: isDarkMode ? '#ffffff !important' : '#000000 !important'
                  }}
                >
                  {language.name}
                </Typography>
              }
            />
          </MenuItem>
        ))}
      </Menu>
    </>
  );
};

export default LanguageSelector; 