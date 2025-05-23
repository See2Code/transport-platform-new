import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Snackbar,
  Paper,
  Fade
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useNotifications } from '../../hooks/useNotifications';
import { useThemeMode } from '../../contexts/ThemeContext';

const NotificationPermission: React.FC = () => {
  const { isDarkMode } = useThemeMode();
  const { requestPermission, isSupported, permission } = useNotifications();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Kontrola či už sme sa pýtali na povolenie
    const hasAskedBefore = localStorage.getItem('notificationPermissionAsked');
    
    if (!hasAskedBefore && isSupported && permission === 'default') {
      // Zobrazíme prompt po 3 sekundách od načítania stránky
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  const handleRequestPermission = async () => {
    try {
      const granted = await requestPermission();
      localStorage.setItem('notificationPermissionAsked', 'true');
      
      if (granted) {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Chyba pri žiadosti o povolenie notifikácií:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('notificationPermissionAsked', 'true');
  };

  // Nezobrazujeme nič ak:
  // - notifikácie nie sú podporované
  // - už máme povolenie
  // - používateľ zamietol
  // - nemáme zobraziť prompt
  if (!isSupported || permission === 'granted' || permission === 'denied' || !showPrompt) {
    return null;
  }

  return (
    <Snackbar
      open={showPrompt}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ 
        mt: 8, // Pod navbar
        zIndex: 1400,
        '& .MuiSnackbar-root': {
          position: 'fixed',
          top: '80px !important',
          right: '24px !important',
        }
      }}
    >
      <Fade in={showPrompt}>
        <Paper
          elevation={8}
          sx={{
            p: 2,
            minWidth: '320px',
            maxWidth: '400px',
            backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <NotificationsIcon 
              sx={{ 
                color: '#ff9f43', 
                mr: 1, 
                mt: 0.5,
                fontSize: '24px'
              }} 
            />
            <Box sx={{ flexGrow: 1 }}>
              <Typography 
                variant="subtitle1" 
                fontWeight="bold"
                sx={{ 
                  color: isDarkMode ? '#ffffff' : '#000000',
                  mb: 0.5
                }}
              >
                Povoliť notifikácie?
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                  mb: 2,
                  lineHeight: 1.4
                }}
              >
                Dostávajte okamžité upozornenia na nové správy v chate, aj keď máte zavretú stránku.
              </Typography>
            </Box>
            <IconButton 
              size="small"
              onClick={handleDismiss}
              sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                ml: 1
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            <Button
              size="small"
              onClick={handleDismiss}
              sx={{
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }
              }}
            >
              Neskôr
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleRequestPermission}
              startIcon={<NotificationsIcon />}
              sx={{
                backgroundColor: '#ff9f43',
                color: '#ffffff',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: '#f7b067',
                }
              }}
            >
              Povoliť
            </Button>
          </Box>
        </Paper>
      </Fade>
    </Snackbar>
  );
};

export default NotificationPermission; 