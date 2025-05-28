import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';

interface LanguageSelectorProps {
  open: boolean;
  anchorEl: null | HTMLElement;
  onClose: () => void;
  onLanguageSelect: (language: 'sk' | 'en' | 'de' | 'cs') => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  open,
  anchorEl,
  onClose,
  onLanguageSelect
}) => {
  const languages = [
    { code: 'sk', name: 'Slovenčina', flag: '🇸🇰' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'cs', name: 'Čeština', flag: '🇨🇿' }
  ] as const;

  return (
    <Menu
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      PaperProps={{
        sx: {
          minWidth: '200px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
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
          color: 'text.secondary',
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)'
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
            '&:hover': {
              backgroundColor: 'rgba(255, 159, 67, 0.1)'
            }
          }}
        >
          <ListItemIcon sx={{ minWidth: '36px' }}>
            <Typography variant="h6">{language.flag}</Typography>
          </ListItemIcon>
          <ListItemText
            primary={language.name}
            primaryTypographyProps={{
              fontSize: '0.9rem',
              fontWeight: 500
            }}
          />
        </MenuItem>
      ))}
    </Menu>
  );
};

export default LanguageSelector; 