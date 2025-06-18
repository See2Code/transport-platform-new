import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  useTheme
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { styled } from '@mui/material/styles';

const CookieBannerContainer = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  padding: theme.spacing(2, 3),
  background: theme.palette.mode === 'dark' 
    ? 'rgba(28, 28, 45, 0.98)' 
    : 'rgba(255, 255, 255, 0.98)',
  backdropFilter: 'blur(10px)',
  borderTop: `2px solid #ff9f43`,
  zIndex: 9999,
  borderRadius: 0,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 -4px 20px rgba(0, 0, 0, 0.3)'
    : '0 -4px 20px rgba(0, 0, 0, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: theme.spacing(2),
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(2),
    flexDirection: 'column',
    alignItems: 'stretch',
    textAlign: 'center',
  },
}));

const ContentSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  flex: 1,
  [theme.breakpoints.down('md')]: {
    flexDirection: 'column',
    gap: theme.spacing(1),
  },
}));

const ButtonSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  [theme.breakpoints.down('md')]: {
    justifyContent: 'center',
    width: '100%',
  },
}));

const AcceptButton = styled(Button)(({ theme }) => ({
  backgroundColor: '#ff9f43',
  color: '#ffffff',
  fontWeight: 600,
  padding: theme.spacing(1, 3),
  borderRadius: 8,
  textTransform: 'none',
  fontSize: '0.9rem',
  '&:hover': {
    backgroundColor: '#e8892b',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1, 2),
    fontSize: '0.85rem',
  },
}));

const DetailsButton = styled(Button)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#ff9f43' : '#e8892b',
  fontWeight: 500,
  padding: theme.spacing(1, 2),
  borderRadius: 8,
  textTransform: 'none',
  fontSize: '0.9rem',
  textDecoration: 'underline',
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 159, 67, 0.1)' 
      : 'rgba(232, 137, 43, 0.1)',
    textDecoration: 'underline',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.5, 1),
    fontSize: '0.85rem',
  },
}));

const COOKIE_CONSENT_KEY = 'cookieConsent';

const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const isEN = i18n.language === 'en';

  useEffect(() => {
    // Kontrola či už používateľ dal súhlas
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      // Malé oneskorenie pre lepší UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted');
    setIsVisible(false);
  };

  const handleViewDetails = () => {
    navigate('/cookie-policy');
  };

  const handleClose = () => {
    setIsVisible(false);
    // Nastavíme "dismissed" namiesto "accepted"
    localStorage.setItem(COOKIE_CONSENT_KEY, 'dismissed');
  };

  if (!isVisible) {
    return null;
  }

  const content = {
    sk: {
      message: 'Táto webová stránka používa súbory cookies na zlepšenie vašej používateľskej skúsenosti a poskytovanie personalizovaných služieb.',
      acceptButton: 'Akceptovať všetko',
      detailsButton: 'Nastavenia cookies',
      closeAriaLabel: 'Zavrieť cookie banner'
    },
    en: {
      message: 'This website uses cookies to improve your user experience and provide personalized services.',
      acceptButton: 'Accept All',
      detailsButton: 'Cookie Settings',
      closeAriaLabel: 'Close cookie banner'
    }
  };

  const currentContent = isEN ? content.en : content.sk;

  return (
    <CookieBannerContainer elevation={8}>
      <ContentSection>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              color: isDarkMode ? '#e0e0e0' : '#333333',
              fontSize: { xs: '0.85rem', sm: '0.9rem' },
              lineHeight: 1.4,
              fontWeight: 500,
            }}
          >
            🍪 {currentContent.message}
          </Typography>
        </Box>
      </ContentSection>

      <ButtonSection>
        <DetailsButton
          variant="text"
          onClick={handleViewDetails}
          size="small"
        >
          {currentContent.detailsButton}
        </DetailsButton>
        
        <AcceptButton
          variant="contained"
          onClick={handleAccept}
          size="small"
        >
          {currentContent.acceptButton}
        </AcceptButton>

        <IconButton
          onClick={handleClose}
          size="small"
          aria-label={currentContent.closeAriaLabel}
          sx={{
            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
            '&:hover': {
              backgroundColor: isDarkMode 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.1)',
            },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </ButtonSection>
    </CookieBannerContainer>
  );
};

export default CookieBanner; 