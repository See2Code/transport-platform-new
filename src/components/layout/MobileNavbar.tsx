import React, { FC } from 'react';
import {
  Box, 
  Typography,
  List,
  ListItemIcon,
  Divider,
  IconButton,
  Drawer,
  ListItemButton,
  Button,
  styled
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useThemeMode } from '../../contexts/ThemeContext';

// Ikony
import CloseIcon from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import NotificationsIcon from '@mui/icons-material/Notifications';

// Importujeme komponenty pre vlajky
const SKFlagIcon = () => (
  <span role="img" aria-label="Slovenská vlajka" style={{ fontSize: '1.5rem' }}>
    🇸🇰
  </span>
);

const ENFlagIcon = () => (
  <span role="img" aria-label="Anglická vlajka" style={{ fontSize: '1.5rem' }}>
    🇬🇧
  </span>
);

// Štýly komponentov
const MobileDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': {
    width: '70%',
    maxWidth: '300px',
    background: theme.palette.mode === 'dark' 
      ? 'linear-gradient(135deg, #0F0C29 0%, #302B63 100%)' 
      : 'linear-gradient(135deg, #f5f7fa 0%, #e4e5e6 100%)',
    boxShadow: '0 0 25px rgba(0, 0, 0, 0.15)',
    padding: '20px',
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
  }
}));

const StyledCloseButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.mode === 'dark' ? '#fff' : '#333',
}));

interface MobileNavbarProps {
  open: boolean;
  onClose: () => void;
  onLogout: () => void;
}

const MobileNavbar: FC<MobileNavbarProps> = ({ open, onClose, onLogout }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { toggleTheme } = useThemeMode();

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('i18nextLng', language);
  };

  const currentLanguage = i18n.language;
  const isEN = currentLanguage === 'en';

  // Pridávam notifikácie a chat do menu
  const handleNotificationsClick = () => {
    // Tu by sa implementovala logika pre zobrazenie notifikácií
    console.log('Otvorenie notifikácií');
    // Zatvorenie menu po akcii
    onClose();
  };

  const menuItems = [
    { icon: <DashboardIcon />, label: t('navigation.dashboard'), path: '/dashboard' },
    { icon: <BusinessIcon />, label: t('navigation.cases'), path: '/business-cases' },
    { icon: <ReceiptIcon />, label: t('navigation.orders'), path: '/orders' },
    { icon: <VisibilityIcon />, label: t('tracking.vehicleTracking'), path: '/tracked-shipments' },
    { icon: <LocationOnIcon />, label: t('tracking.liveLocation'), path: '/vehicle-map' },
    { icon: <PeopleIcon />, label: t('navigation.team'), path: '/team' },
    { icon: <SettingsIcon />, label: t('navigation.settings'), path: '/settings' },
  ];

  return (
    <MobileDrawer
      anchor="left"
      open={open}
      onClose={onClose}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <StyledCloseButton onClick={onClose}>
          <CloseIcon />
        </StyledCloseButton>
      </Box>
      
      {/* Top bar icons */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-around', 
        mb: 3, 
        borderRadius: '8px',
        py: 2,
        background: 'rgba(0, 0, 0, 0.05)',
      }}>
        <IconButton onClick={handleNotificationsClick} sx={{ color: '#333' }}>
          <NotificationsIcon />
        </IconButton>
        <IconButton 
          onClick={() => { changeLanguage('sk'); }}
          sx={{ 
            opacity: !isEN ? 1 : 0.6,
            color: '#333',
          }}
        >
          <SKFlagIcon />
        </IconButton>
        <IconButton 
          onClick={() => { changeLanguage('en'); }}
          sx={{ 
            opacity: isEN ? 1 : 0.6,
            color: '#333',
          }}
        >
          <ENFlagIcon />
        </IconButton>
        <IconButton 
          onClick={toggleTheme}
          sx={{ color: '#333' }}
        >
          {isEN ? <LightModeIcon /> : <DarkModeIcon />}
        </IconButton>
      </Box>
      
      <Divider sx={{ my: 2, bgcolor: 'rgba(0,0,0,0.1)' }} />
      
      <List>
        {menuItems.map((item, index) => (
          <ListItemButton 
            key={index} 
            onClick={() => {
              navigate(item.path); 
              onClose();
            }}
            sx={{ 
              py: 1.5,
              borderRadius: '8px',
              mb: 1,
              '&:hover': {
                background: 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: '40px',
              color: 'rgba(0, 0, 0, 0.7)',
            }}>
              {item.icon}
            </ListItemIcon>
            <Typography 
              sx={{ 
                color: '#333',
                fontWeight: 500,
              }}
            >
              {item.label}
            </Typography>
          </ListItemButton>
        ))}
      </List>

      <Divider sx={{ my: 2, bgcolor: 'rgba(0,0,0,0.1)' }} />
      
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          color="error"
          fullWidth
          startIcon={<LogoutIcon />}
          onClick={onLogout}
          sx={{ 
            py: 1.5,
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 500,
          }}
        >
          {t('auth.logout')}
        </Button>
      </Box>
    </MobileDrawer>
  );
};

export default MobileNavbar; 