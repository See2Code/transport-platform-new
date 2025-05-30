import React, { useState, useEffect, FC } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useChat } from '../../contexts/ChatContext';
import CircularProgress from '@mui/material/CircularProgress';

import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';

import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import { styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import Container from '@mui/material/Container';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

import DialogContentText from '@mui/material/DialogContentText';

import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BusinessIcon from '@mui/icons-material/Business';
import ChatIcon from '@mui/icons-material/Chat';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeContext';
import { useChatUI } from '../../AppContent';
import { useTranslation } from 'react-i18next';
import BareTooltip from '../common/BareTooltip';

// Importujeme komponenty pre vlajky - SVG vlajky z flagcdn.com
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
    alt="English flag" 
    style={{ borderRadius: '2px', objectFit: 'cover' }}
  />
);

// Logo paths - nepoužívané, môžeme ich odstrániť

// Navbar komponenty v štýle Home.tsx
const NavbarContainer = styled(AppBar)(({ theme }) => ({
  background: 'transparent',
  boxShadow: 'none',
  padding: '15px 0',
  transition: 'all 0.3s ease',
  position: 'fixed',
  height: '80px',
  display: 'flex',
  justifyContent: 'center',
  zIndex: 1000,
  '&.scrolled': {
    background: theme.palette.mode === 'dark' 
      ? 'rgba(16, 14, 60, 0.9)' 
      : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    padding: '10px 0',
    height: '70px',
  }
}));

const NavIconButton = styled(IconButton)(({ theme }) => ({
  marginLeft: theme.spacing(1),
  color: theme.palette.mode === 'dark' ? '#fff' : '#333',
  fontSize: '0.95rem',
  fontWeight: 500,
  transition: 'all 0.3s ease',
  '&:hover': {
    background: 'rgba(255, 159, 67, 0.1)',
    transform: 'translateY(-2px)',
  },
  '&.active': {
    color: '#ff9f43',
    fontWeight: 600,
  }
}));

const LogoImage = styled('img', {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  width: '80px',
  height: 'auto',
  filter: isDarkMode ? 'brightness(0) invert(1)' : 'brightness(0)',
  cursor: 'pointer',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const Navbar: FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { toggleChat } = useChatUI();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const { userData } = useAuth();
  const { unreadConversationsCount } = useChat();
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Handle scroll events for navbar
  useEffect(() => {
    const handleScroll = () => {
      const scrollThreshold = 150;
      if (window.scrollY > scrollThreshold) {
        if (!scrolled) {
          setScrolled(true);
        }
      } else {
        if (scrolled) {
          setScrolled(false);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  const formatDateTime = (timestamp: any): string => {
    if (!timestamp) return 'Neznámy čas';
    const date = timestamp instanceof Date ? timestamp : timestamp.toDate();
    return date.toLocaleString('sk-SK', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Bratislava'
    });
  };

  const handleNotificationsClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
    loadNotifications();
  };

  const loadNotifications = async () => {
    if (!userData?.companyID) return;
    
    setLoadingNotifications(true);
    try {
      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef,
        where('companyID', '==', userData.companyID),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(q);
      const notificationsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setNotifications(notificationsData);
    } catch (error) {
      console.error('Chyba pri načítaní notifikácií:', error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleNotificationClick = (notification: any) => {
    setNotificationsAnchorEl(null);
    
    if (notification.metadata?.conversationId) {
      navigate(`/chat/${notification.metadata.conversationId}`);
    } else if (notification.metadata?.orderId) {
      navigate(`/orders/${notification.metadata.orderId}`);
    } else if (notification.metadata?.businessCaseId) {
      navigate(`/business-cases/${notification.metadata.businessCaseId}`);
    }
  };

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
    setMobileMenuOpen(false);
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      setLogoutDialogOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const changeLanguage = (language: string) => {
    i18n.changeLanguage(language);
    localStorage.setItem('i18nextLng', language);
  };

  const currentLanguage = i18n.language;
  const isEN = currentLanguage === 'en';

  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  return (
    <>
      {/* Fixed Navigation - presne ako v Home.tsx */}
      <NavbarContainer 
        className={scrolled ? 'scrolled' : ''}
        position="fixed"
      >
        <Container 
          maxWidth="lg" 
          disableGutters
          sx={{ 
            width: '100%',
            ml: { xs: 3, sm: 3, md: 3 },
            mr: { xs: 3, sm: 3, md: 3 },
          }}
        >
          <Toolbar sx={{ justifyContent: 'flex-start', px: 0, minHeight: { xs: 56, sm: 64 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LogoImage 
                src="/AESA black.svg" 
                alt="AESA Logo" 
                isDarkMode={isDarkMode} 
                onClick={handleLogoClick}
                sx={{ width: '80px', mr: 2 }}
              />
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  color: isDarkMode ? '#fff' : '#333',
                  display: { xs: 'none', sm: 'block' }
                }}
              >
                CORE
              </Typography>
            </Box>

            {/* Desktop Menu - len ikony */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, ml: 'auto' }}>
              <BareTooltip title={t('navigation.dashboard')} placement="bottom">
                <NavIconButton onClick={() => navigate('/dashboard')}>
                  <DashboardIcon />
                </NavIconButton>
              </BareTooltip>
              
              <BareTooltip title={t('navigation.cases')} placement="bottom">
                <NavIconButton onClick={() => navigate('/business-cases')}>
                  <BusinessIcon />
                </NavIconButton>
              </BareTooltip>
              
              <BareTooltip title={t('navigation.orders')} placement="bottom">
                <NavIconButton onClick={() => navigate('/orders')}>
                  <ReceiptIcon />
                </NavIconButton>
              </BareTooltip>
              
              <BareTooltip title={t('tracking.vehicleTracking')} placement="bottom">
                <NavIconButton onClick={() => navigate('/tracked-shipments')}>
                  <VisibilityIcon />
                </NavIconButton>
              </BareTooltip>
              
              <BareTooltip title={t('tracking.liveLocation')} placement="bottom">
                <NavIconButton onClick={() => navigate('/vehicle-map')}>
                  <LocationOnIcon />
                </NavIconButton>
              </BareTooltip>
              
              <BareTooltip title={t('navigation.team')} placement="bottom">
                <NavIconButton onClick={() => navigate('/team')}>
                  <PeopleIcon />
                </NavIconButton>
              </BareTooltip>
              
              <BareTooltip title={t('navigation.settings')} placement="bottom">
                <NavIconButton onClick={() => navigate('/settings')}>
                  <SettingsIcon />
                </NavIconButton>
              </BareTooltip>

              <BareTooltip title={t('common.notifications')} placement="bottom">
                <NavIconButton onClick={handleNotificationsClick}>
                  <NotificationsIcon />
                </NavIconButton>
              </BareTooltip>

              <BareTooltip title={t('common.chat')} placement="bottom">
                <NavIconButton onClick={toggleChat}>
                  <Badge 
                    badgeContent={unreadConversationsCount} 
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor: '#ff9f43',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        minWidth: '18px',
                        height: '18px',
                      },
                    }}
                  >
                    <ChatIcon />
                  </Badge>
                </NavIconButton>
              </BareTooltip>

              {/* Prepínače jazykov */}
              <BareTooltip title="Slovenčina" placement="bottom">
                <NavIconButton 
                  onClick={() => changeLanguage('sk')}
                  sx={{ 
                    opacity: !isEN ? 1 : 0.6,
                  }}
                >
                  <SKFlagIcon />
                </NavIconButton>
              </BareTooltip>
              
              <BareTooltip title="English" placement="bottom">
                <NavIconButton 
                  onClick={() => changeLanguage('en')}
                  sx={{ 
                    opacity: isEN ? 1 : 0.6,
                  }}
                >
                  <ENFlagIcon />
                </NavIconButton>
              </BareTooltip>

              <BareTooltip title={t('settings.toggleTheme')} placement="bottom">
                <NavIconButton
                  onClick={toggleTheme}
                  aria-label="prepnúť tému"
                >
                  {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                </NavIconButton>
              </BareTooltip>

              <BareTooltip title={t('auth.logout')} placement="bottom">
                <NavIconButton
                  onClick={handleLogoutClick}
                  sx={{ 
                    ml: 2, 
                    color: isDarkMode ? '#ff9f43' : '#ff9f43',
                    fontWeight: 600
                  }}
                >
                  <LogoutIcon />
                </NavIconButton>
              </BareTooltip>
            </Box>

            {/* Mobile Menu Toggle */}
            <IconButton 
              edge="end" 
              color="inherit" 
              aria-label="menu"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ 
                display: { xs: 'flex', md: 'none' },
                color: isDarkMode ? '#fff' : '#333',
                '&:hover': {
                  background: 'rgba(255, 159, 67, 0.1)',
                }
              }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </NavbarContainer>

      {/* Mobile Drawer Menu - presne ako v Home.tsx */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: '70%',
            maxWidth: '300px',
            background: isDarkMode 
              ? 'linear-gradient(135deg, #0F0C29 0%, #302B63 100%)' 
              : 'linear-gradient(135deg, #f5f7fa 0%, #e4e5e6 100%)',
            boxShadow: '0 0 25px rgba(0, 0, 0, 0.15)',
            padding: '20px',
          }
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <IconButton 
            onClick={() => setMobileMenuOpen(false)}
            sx={{ color: isDarkMode ? '#fff' : '#333' }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        <List>
          <ListItemButton 
            onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}
            sx={{ 
              py: 1.5,
              borderRadius: '8px',
              mb: 1,
              '&:hover': {
                background: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <ListItemIcon sx={{ color: isDarkMode ? '#fff' : '#333', minWidth: '40px' }}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography 
                  sx={{ 
                    color: isDarkMode ? '#fff' : '#333',
                    fontWeight: 500,
                  }}
                >
                  {t('navigation.dashboard')}
                </Typography>
              }
            />
          </ListItemButton>

          <ListItemButton 
            onClick={() => { navigate('/business-cases'); setMobileMenuOpen(false); }}
            sx={{ 
              py: 1.5,
              borderRadius: '8px',
              mb: 1,
              '&:hover': {
                background: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <ListItemIcon sx={{ color: isDarkMode ? '#fff' : '#333', minWidth: '40px' }}>
              <BusinessIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography 
                  sx={{ 
                    color: isDarkMode ? '#fff' : '#333',
                    fontWeight: 500,
                  }}
                >
                  {t('navigation.cases')}
                </Typography>
              }
            />
          </ListItemButton>

          <ListItemButton 
            onClick={() => { navigate('/orders'); setMobileMenuOpen(false); }}
            sx={{ 
              py: 1.5,
              borderRadius: '8px',
              mb: 1,
              '&:hover': {
                background: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <ListItemIcon sx={{ color: isDarkMode ? '#fff' : '#333', minWidth: '40px' }}>
              <ReceiptIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography 
                  sx={{ 
                    color: isDarkMode ? '#fff' : '#333',
                    fontWeight: 500,
                  }}
                >
                  {t('navigation.orders')}
                </Typography>
              }
            />
          </ListItemButton>

          <ListItemButton 
            onClick={() => { navigate('/tracked-shipments'); setMobileMenuOpen(false); }}
            sx={{ 
              py: 1.5,
              borderRadius: '8px',
              mb: 1,
              '&:hover': {
                background: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <ListItemIcon sx={{ color: isDarkMode ? '#fff' : '#333', minWidth: '40px' }}>
              <VisibilityIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography 
                  sx={{ 
                    color: isDarkMode ? '#fff' : '#333',
                    fontWeight: 500,
                  }}
                >
                  {t('tracking.vehicleTracking')}
                </Typography>
              }
            />
          </ListItemButton>

          <ListItemButton 
            onClick={() => { navigate('/vehicle-map'); setMobileMenuOpen(false); }}
            sx={{ 
              py: 1.5,
              borderRadius: '8px',
              mb: 1,
              '&:hover': {
                background: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <ListItemIcon sx={{ color: isDarkMode ? '#fff' : '#333', minWidth: '40px' }}>
              <LocationOnIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography 
                  sx={{ 
                    color: isDarkMode ? '#fff' : '#333',
                    fontWeight: 500,
                  }}
                >
                  {t('tracking.liveLocation')}
                </Typography>
              }
            />
          </ListItemButton>

          <ListItemButton 
            onClick={() => { navigate('/team'); setMobileMenuOpen(false); }}
            sx={{ 
              py: 1.5,
              borderRadius: '8px',
              mb: 1,
              '&:hover': {
                background: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <ListItemIcon sx={{ color: isDarkMode ? '#fff' : '#333', minWidth: '40px' }}>
              <PeopleIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography 
                  sx={{ 
                    color: isDarkMode ? '#fff' : '#333',
                    fontWeight: 500,
                  }}
                >
                  {t('navigation.team')}
                </Typography>
              }
            />
          </ListItemButton>

          <ListItemButton 
            onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }}
            sx={{ 
              py: 1.5,
              borderRadius: '8px',
              mb: 1,
              '&:hover': {
                background: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <ListItemIcon sx={{ color: isDarkMode ? '#fff' : '#333', minWidth: '40px' }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography 
                  sx={{ 
                    color: isDarkMode ? '#fff' : '#333',
                    fontWeight: 500,
                  }}
                >
                  {t('navigation.settings')}
                </Typography>
              }
            />
          </ListItemButton>

          <Divider sx={{ my: 2, bgcolor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
          
          <ListItemButton 
            onClick={toggleChat}
            sx={{ 
              py: 1.5,
              borderRadius: '8px',
              mb: 1,
              '&:hover': {
                background: isDarkMode 
                  ? 'rgba(255, 255, 255, 0.05)' 
                  : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <ListItemIcon sx={{ color: isDarkMode ? '#fff' : '#333', minWidth: '40px' }}>
              <Badge 
                badgeContent={unreadConversationsCount} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#ff9f43',
                    color: '#ffffff',
                  },
                }}
              >
                <ChatIcon />
              </Badge>
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography 
                  sx={{ 
                    color: isDarkMode ? '#fff' : '#333',
                    fontWeight: 500,
                  }}
                >
                  {t('common.chat')}
                </Typography>
              }
            />
          </ListItemButton>

          <ListItemButton 
            onClick={() => {
              toggleTheme();
              setMobileMenuOpen(false);
            }}
            sx={{ 
              py: 1.5,
              borderRadius: '8px',
              mb: 1,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              '&:hover': {
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              }
            }}
          >
            <ListItemIcon sx={{ color: isDarkMode ? '#fff' : '#333', minWidth: '40px' }}>
              {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography 
                  sx={{ 
                    color: isDarkMode ? '#fff' : '#333',
                    fontWeight: 500,
                  }}
                >
                  {t('settings.toggleTheme')}
                </Typography>
              }
            />
          </ListItemButton>

          <ListItemButton 
            onClick={handleLogoutClick}
            sx={{ 
              py: 1.5,
              borderRadius: '8px',
              mb: 1,
              background: 'rgba(255, 159, 67, 0.1)',
              '&:hover': {
                background: 'rgba(255, 159, 67, 0.2)',
              }
            }}
          >
            <ListItemIcon sx={{ color: '#ff9f43', minWidth: '40px' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText
              primary={
                <Typography 
                  sx={{ 
                    color: '#ff9f43',
                    fontWeight: 600,
                  }}
                >
                  {t('auth.logout')}
                </Typography>
              }
            />
          </ListItemButton>
        </List>
      </Drawer>

      {/* Logout Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        PaperProps={{
          sx: {
            backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          },
        }}
      >
        <DialogTitle sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
          {t('auth.confirmLogout')}
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}>
            {t('auth.logoutConfirmation')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleLogoutConfirm} color="error" variant="contained">
            {t('auth.logout')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notifications Popover */}
      <Popover
        open={Boolean(notificationsAnchorEl)}
        anchorEl={notificationsAnchorEl}
        onClose={() => setNotificationsAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 500,
            mt: 1,
            backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(10px)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` }}>
          <Typography variant="h6" sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
            Notifikácie
          </Typography>
        </Box>
        
        <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
          {loadingNotifications ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
                Žiadne notifikácie
              </Typography>
            </Box>
          ) : (
            notifications.map((notification) => (
              <Box
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  p: 2,
                  cursor: 'pointer',
                  borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  backgroundColor: notification.read ? 'transparent' : (isDarkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'),
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                  },
                }}
              >
                <Typography variant="subtitle2" sx={{ color: isDarkMode ? '#ffffff' : '#000000', mb: 0.5 }}>
                  {notification.title}
                </Typography>
                <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}>
                  {notification.message}
                </Typography>
                <Typography variant="caption" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)', display: 'block', mt: 1 }}>
                  {formatDateTime(notification.createdAt)}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </Popover>
    </>
  );
};

export default Navbar;