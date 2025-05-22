import React, { useState, useEffect, useRef, FC, useCallback } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { useChat } from '../../contexts/ChatContext';
import CircularProgress from '@mui/material/CircularProgress';

import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';

import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme, styled } from '@mui/material/styles';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import Paper from '@mui/material/Paper';

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
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
import { MenuProps } from '@mui/material/Menu';
import { useThemeMode } from '../../contexts/ThemeContext';


import { useChatUI } from '../../AppContent';
import { alpha } from '@mui/material/styles';


import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

// Importujeme náš nový MobileNavbar komponent
import MobileNavbar from './MobileNavbar';

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

// Definícia farebnej palety
const colors = {
  primary: {
    main: '#6366f1', // Moderná indigová farba
    light: '#818cf8',
    dark: '#4f46e5',
  },
  background: {
    main: 'rgba(28, 28, 45, 0.95)',
    light: 'rgba(255, 255, 255, 0.95)',
    dark: '#12121f',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.9)',
    disabled: 'rgba(255, 255, 255, 0.7)',
  }
};

const _ListItemIconStyled = styled(ListItemIcon)({
  minWidth: 48,
  color: 'inherit',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  margin: 0,
  '& .MuiSvgIcon-root': {
    transition: 'transform 0.3s ease',
    fontSize: '24px'
  }
});

const _StyledMenuItem = styled(MenuItem)<{ isDarkMode?: boolean }>(({ isDarkMode }) => ({
  padding: '12px 16px',
  margin: '4px 8px',
  borderRadius: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  color: isDarkMode ? '#ffffff' : '#000000',
  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  border: `1px solid ${isDarkMode ? '#ffffff' : '#000000'}`,
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)',
    transform: 'translateX(4px)',
  },
  '& .MuiListItemIcon-root': {
    minWidth: '40px',
    color: 'inherit',
    '& .MuiSvgIcon-root': {
      fontSize: '1.25rem',
    },
  },
  '& .MuiListItemText-root': {
    '& .MuiTypography-root': {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
}));

const _LogoutButton = styled(IconButton)<{ isDarkMode?: boolean }>(({ isDarkMode }) => ({
  color: isDarkMode ? colors.text.primary : '#000000',
  '&:hover': {
    color: colors.primary.main,
    backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.1)' : 'rgba(0, 0, 0, 0.05)'
  }
}));

const _ContentWrapper = styled('div')({
  padding: '24px',
  position: 'relative',
  zIndex: 1,
  '@media (max-width: 600px)': {
    padding: '16px'
  }
});

const _Overlay = styled('div')({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(4px)',
  zIndex: 1100,
  opacity: 0,
  visibility: 'hidden',
  transition: 'all 0.3s ease-in-out',
  display: 'none',
  '@media (max-width: 600px)': {
    display: 'block',
    '&.visible': {
      opacity: 1,
      visibility: 'visible'
    }
  }
});

const StyledAppBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode?: boolean }>(({ _theme, isDarkMode = false }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.98)',
  color: isDarkMode ? '#ffffff' : '#000000',
  boxShadow: '0 1px 8px 0 rgba(0,0,0,0.1)',
  backdropFilter: 'blur(10px)',
  position: 'fixed',
  top: 0,
  right: 0,
  left: 0,
  width: '100%',
  zIndex: 1200,
  transition: 'all 0.3s ease-in-out',
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0 24px',
  minHeight: '56px',
  '@media (max-width: 600px)': {
    padding: '0 16px',
    minHeight: '48px',
  },
  color: theme.palette.text.primary,
}));

const _BottomActions = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginTop: '4px'
});

const _ActionItem = styled(MenuItem)<{ isDarkMode?: boolean; isLogout?: boolean }>(({ isDarkMode, isLogout }) => ({
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  borderRadius: 0,
  color: isLogout ? '#ef4444' : (isDarkMode ? '#ffffff' : '#000000'),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: isLogout 
      ? 'rgba(239, 68, 68, 0.1)'
      : (isDarkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'),
    transform: 'translateX(4px)',
  },
}));

const _MainContent = styled('main')({
  flexGrow: 1,
  width: '100%',
});

const _StyledListItem = styled(ListItem)<{ button?: boolean; isDarkMode?: boolean }>(({ isDarkMode = true }) => ({
  minWidth: 'auto',
  padding: '12px 16px',
  borderRadius: 0,
  margin: '4px 8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    transform: 'translateX(4px)',
  },
  '& .MuiListItemIcon-root': {
    minWidth: '40px',
    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  },
  '& .MuiListItemText-root': {
    margin: 0,
    '& .MuiTypography-root': {
      fontSize: '1rem',
      fontWeight: 500,
      color: isDarkMode ? '#ffffff' : '#000000',
    },
  },
}));

const _StyledDivider = styled(Divider)<{ isDarkMode?: boolean }>(({ isDarkMode }) => ({
  margin: '8px 16px',
  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
  height: '1px',
}));

const _StyledDialog = styled(Dialog, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: isDarkMode ? 'rgba(35, 35, 66, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: 0,
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    boxShadow: isDarkMode 
      ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
      : '0 8px 32px rgba(0, 0, 0, 0.1)',
  },
  '& .MuiDialogTitle-root': {
    color: isDarkMode ? '#ffffff' : '#000000',
  },
  '& .MuiDialogContent-root': {
    color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
  },
}));

const _StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean; variant: 'text' | 'contained' }>(({ isDarkMode, variant }) => ({
  borderRadius: 0,
  textTransform: 'none',
  padding: '8px 16px',
  fontWeight: 500,
  ...(variant === 'contained' ? {
    backgroundColor: isDarkMode ? '#ff6b6b' : '#d64545',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: isDarkMode ? '#ff8787' : '#e05858',
    },
  } : {
    color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
    '&:hover': {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    },
  }),
}));

// --- Konštanty pre cesty k logám v public adresári ---
const logoLightPath = "/AESA black.svg"; // Alebo /logo.png ak existuje
const logoDarkPath = "/AESA white.svg";  // Alebo /logo-dark.png ak existuje
const _logoMiniLightPath = "/favicon.png"; // Nahraďte správnou cestou k mini logu
const _logoMiniDarkPath = "/AESA white favicon.png"; // Nahraďte správnou cestou k mini tmavému logu

// Nové komponenty pre notifikácie
const _NotificationPopover = styled(Popover)(({ _theme }) => ({
  '& .MuiPopover-paper': {
    width: '360px',
    maxHeight: '500px',
    overflow: 'hidden',
    marginTop: '10px',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  },
}));

const _NotificationHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  padding: '12px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
}));

const _NotificationContainer = styled(Box)({
  maxHeight: '360px',
  overflowY: 'auto',
  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    background: 'transparent',
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'rgba(0, 0, 0, 0.1)',
    borderRadius: '3px',
  },
});

const _NotificationItem = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode' && prop !== 'isRead'
})<{ isDarkMode: boolean; isRead: boolean }>(({ isDarkMode, isRead }) => ({
  padding: '12px 16px',
  borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}`,
  backgroundColor: isRead ? 'transparent' : (isDarkMode ? 'rgba(99, 102, 241, 0.08)' : 'rgba(99, 102, 241, 0.04)'),
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
  },
}));

const _NotificationFooter = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  padding: '12px 16px',
  display: 'flex',
  justifyContent: 'center',
  borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
}));

const _StyledMenu = styled((props: MenuProps) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    {...props}
  />
))(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color: theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    '& .MuiMenu-list': {
      padding: '4px 0',
    },
    '& .MuiMenuItem-root': {
      '& .MuiSvgIcon-root': {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5),
      },
      '&:active': {
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.action.selectedOpacity),
      },
    },
  },
}));

const _SolidDialogPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#232342' : '#fff',
  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  borderRadius: 16,
  minWidth: 320,
  color: theme.palette.mode === 'dark' ? '#fff' : '#232342',
  opacity: 1,
  backdropFilter: 'none',
  backgroundImage: 'none',
}));

// Pridáme klučové animácie do globálnych štýlov
const _globalStyles = {
  '@keyframes fadeInTooltip': {
    '0%': { 
      opacity: 0, 
      transform: 'translateX(-50%) translateY(10px)' 
    },
    '100%': { 
      opacity: 1, 
      transform: 'translateX(-50%) translateY(0)' 
    },
  },
};

// Úplne nový vlastný tooltip bez závislosti na MUI Tooltip
interface BareTooltipProps {
  title: React.ReactNode;
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  enterDelay?: number;
  leaveDelay?: number;
}

const BareTooltip: FC<BareTooltipProps> = ({ 
  title, 
  children, 
  placement = 'bottom',
  enterDelay = 300,
  leaveDelay = 200
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const childRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const enterTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isHoveringRef = useRef(false);
  
  const { isDarkMode } = useThemeMode();

  // Prida globálne štýly
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes fadeInTooltip {
        from { opacity: 0; transform: translateX(-50%) translateY(10px); }
        to { opacity: 1; transform: translateX(-50%) translateY(0); }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Sledovanie dokumentu na strate fokusu/prekliknutí na inú aplikáciu
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Skryť tooltip, keď je okno neaktívne
        setIsVisible(false);
        if (enterTimeoutRef.current) {
          clearTimeout(enterTimeoutRef.current);
          enterTimeoutRef.current = null;
        }
        if (leaveTimeoutRef.current) {
          clearTimeout(leaveTimeoutRef.current);
          leaveTimeoutRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const updateTooltipPosition = useCallback(() => {
    if (!childRef.current || !isHoveringRef.current) return;
    
    const rect = childRef.current.getBoundingClientRect();
    let top = 0;
    let left = 0;
    
    switch (placement) {
      case 'top':
        top = rect.top - (tooltipRef.current?.offsetHeight || 0) - 10;
        left = rect.left + rect.width / 2;
        break;
      case 'bottom':
        top = rect.bottom + 10;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - (tooltipRef.current?.offsetWidth || 0) - 10;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + 10;
        break;
    }
    
    setPosition({ top, left });
  }, [placement]);

  const handleMouseEnter = useCallback(() => {
    isHoveringRef.current = true;
    
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    
    // Ak je tooltip už zobrazený, netreba čakať
    if (isVisible) {
      updateTooltipPosition();
      return;
    }
    
    if (enterTimeoutRef.current) return;
    
    enterTimeoutRef.current = setTimeout(() => {
      updateTooltipPosition();
      setIsVisible(true);
      enterTimeoutRef.current = null;
    }, enterDelay);
  }, [enterDelay, isVisible, updateTooltipPosition]);

  const handleMouseLeave = useCallback(() => {
    isHoveringRef.current = false;
    
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
      enterTimeoutRef.current = null;
    }
    
    if (leaveTimeoutRef.current) return;
    
    leaveTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
      leaveTimeoutRef.current = null;
    }, leaveDelay);
  }, [leaveDelay]);

  // Čistenie timeoutov pri unmount
  useEffect(() => {
    return () => {
      if (enterTimeoutRef.current) clearTimeout(enterTimeoutRef.current);
      if (leaveTimeoutRef.current) clearTimeout(leaveTimeoutRef.current);
    };
  }, []);

  // Pridávame event handlery pre hover a focus
  const child = React.cloneElement(children, {
    ref: childRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleMouseEnter,
    onBlur: handleMouseLeave,
  });

  return (
    <>
      {child}
      {isVisible && createPortal(
        <div
          ref={tooltipRef}
          style={{
            position: 'fixed',
            top: position.top,
            left: position.left,
            transform: 'translateX(-50%)',
            zIndex: 9999,
            padding: '10px 16px',
            backgroundColor: isDarkMode 
              ? 'rgba(15, 23, 42, 0.85)'
              : 'rgba(255, 255, 255, 0.92)',
            color: isDarkMode ? '#ffffff' : '#0f172a',
            borderRadius: '12px',
            fontSize: '0.85rem',
            fontWeight: 500,
            letterSpacing: '0.2px',
            boxShadow: isDarkMode
              ? '0 16px 24px -6px rgba(0, 0, 0, 0.3), 0 4px 10px -3px rgba(0, 0, 0, 0.25)'
              : '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(12px)',
            pointerEvents: 'none', // Aby tooltip nereagoval na mouse eventy
            animationName: 'fadeInTooltip',
            animationDuration: '0.2s',
            animationFillMode: 'forwards',
            willChange: 'transform, opacity', // Optimalizácia pre GPU
          }}
        >
          {title}
        </div>,
        document.body
      )}
    </>
  );
};

const Navbar: FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { toggleChat } = useChatUI();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { t, i18n } = useTranslation();
  const { userData } = useAuth();
  const { unreadConversationsCount } = useChat();
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

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
    // Načítame notifikácie pri otvorení
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
    // Zatvoríme popover
    setNotificationsAnchorEl(null);
    
    // Podľa typu notifikácie vykonáme príslušnú akciu
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

  return (
    <>
      <StyledAppBar position="fixed" isDarkMode={isDarkMode}>
        <StyledToolbar>
          {isMobile ? (
            <>
              <IconButton
                edge="start"
                color="inherit"
                aria-label="menu"
                onClick={() => setDrawerOpen(true)}
              >
                <MenuIcon />
              </IconButton>
              
              <Box sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center' 
              }}>
                <img 
                  src={isDarkMode ? logoDarkPath : logoLightPath} 
                  alt="AESA Logo" 
                  style={{ 
                    height: '28px',
                    opacity: 0.9,
                  }} 
                />
              </Box>
            </>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <img 
                src={isDarkMode ? logoDarkPath : logoLightPath} 
                alt="Logo" 
                style={{ height: '40px', marginRight: '16px' }} 
              />
              <Typography variant="h6" sx={{ display: { xs: 'none', sm: 'block' } }}>
                Transport Platform
              </Typography>
            </Box>
          )}

          {!isMobile && (
            <Box sx={{ display: 'flex', flexGrow: 1, ml: 4 }}>
              <BareTooltip
                title={t('navigation.dashboard')}
                placement="bottom"
                enterDelay={300}
                leaveDelay={200}
              >
                <Button
                  color="inherit"
                  startIcon={<DashboardIcon />}
                  onClick={() => navigate('/dashboard')}
                  sx={{
                    mr: 2,
                    transition: 'transform 0.2s ease, background-color 0.2s ease',
                    '&:hover, &.Mui-focusVisible': {
                      backgroundColor: (theme: any) => alpha(theme.palette.action.hover, 0.8),
                      transform: 'translateY(-2px)'
                    },
                  }}
                  aria-label={t('navigation.dashboard')}
                />
              </BareTooltip>
              <BareTooltip
                title={t('navigation.cases')}
                placement="bottom"
                enterDelay={300}
                leaveDelay={200}
              >
                <Button
                  color="inherit"
                  startIcon={<BusinessIcon />}
                  onClick={() => navigate('/business-cases')}
                  sx={{
                    mr: 2,
                    transition: 'transform 0.2s ease, background-color 0.2s ease',
                    '&:hover, &.Mui-focusVisible': {
                      backgroundColor: (theme: any) => alpha(theme.palette.action.hover, 0.8),
                      transform: 'translateY(-2px)'
                    },
                  }}
                  aria-label={t('navigation.cases')}
                />
              </BareTooltip>
              <BareTooltip
                title={t('navigation.orders')}
                placement="bottom"
                enterDelay={300}
                leaveDelay={200}
              >
                <Button
                  color="inherit"
                  startIcon={<ReceiptIcon />}
                  onClick={() => navigate('/orders')}
                  sx={{
                    mr: 2,
                    transition: 'transform 0.2s ease, background-color 0.2s ease',
                    '&:hover, &.Mui-focusVisible': {
                      backgroundColor: (theme: any) => alpha(theme.palette.action.hover, 0.8),
                      transform: 'translateY(-2px)'
                    },
                  }}
                  aria-label={t('navigation.orders')}
                />
              </BareTooltip>
              <BareTooltip
                title={t('tracking.vehicleTracking')}
                placement="bottom"
                enterDelay={300}
                leaveDelay={200}
              >
                <Button
                  color="inherit"
                  startIcon={<VisibilityIcon />}
                  onClick={() => navigate('/tracked-shipments')}
                  sx={{
                    mr: 2,
                    transition: 'transform 0.2s ease, background-color 0.2s ease',
                    '&:hover, &.Mui-focusVisible': {
                      backgroundColor: (theme: any) => alpha(theme.palette.action.hover, 0.8),
                      transform: 'translateY(-2px)'
                    },
                  }}
                  aria-label={t('tracking.vehicleTracking')}
                />
              </BareTooltip>
              <BareTooltip
                title={t('tracking.liveLocation')}
                placement="bottom"
                enterDelay={300}
                leaveDelay={200}
              >
                <Button
                  color="inherit"
                  startIcon={<LocationOnIcon />}
                  onClick={() => navigate('/vehicle-map')}
                  sx={{
                    mr: 2,
                    transition: 'transform 0.2s ease, background-color 0.2s ease',
                    '&:hover, &.Mui-focusVisible': {
                      backgroundColor: (theme: any) => alpha(theme.palette.action.hover, 0.8),
                      transform: 'translateY(-2px)'
                    },
                  }}
                  aria-label={t('tracking.liveLocation')}
                />
              </BareTooltip>
              <BareTooltip
                title={t('navigation.team')}
                placement="bottom"
                enterDelay={300}
                leaveDelay={200}
              >
                <Button
                  color="inherit"
                  startIcon={<PeopleIcon />}
                  onClick={() => navigate('/team')}
                  sx={{
                    mr: 2,
                    transition: 'transform 0.2s ease, background-color 0.2s ease',
                    '&:hover, &.Mui-focusVisible': {
                      backgroundColor: (theme: any) => alpha(theme.palette.action.hover, 0.8),
                      transform: 'translateY(-2px)'
                    },
                  }}
                  aria-label={t('navigation.team')}
                />
              </BareTooltip>
              <BareTooltip
                title={t('navigation.settings')}
                placement="bottom"
                enterDelay={300}
                leaveDelay={200}
              >
                <Button
                  color="inherit"
                  startIcon={<SettingsIcon />}
                  onClick={() => navigate('/settings')}
                  sx={{
                    mr: 2,
                    transition: 'transform 0.2s ease, background-color 0.2s ease',
                    '&:hover, &.Mui-focusVisible': {
                      backgroundColor: (theme: any) => alpha(theme.palette.action.hover, 0.8),
                      transform: 'translateY(-2px)'
                    },
                  }}
                  aria-label={t('navigation.settings')}
                />
              </BareTooltip>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              color="inherit"
              onClick={handleNotificationsClick}
              sx={{
                position: 'relative',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                },
              }}
            >
              <Badge
                badgeContent={unreadConversationsCount || undefined}
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    backgroundColor: '#ff4444',
                    color: '#ffffff',
                  },
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
            
            <BareTooltip title={t('common.chat')} placement="bottom">
              <IconButton 
                color="inherit" 
                onClick={toggleChat}
                sx={{ ml: 1 }}
              >
                <ChatIcon />
              </IconButton>
            </BareTooltip>
            
            {/* Prepínač jazykov */}
            {!isMobile && (
              <Box sx={{ display: 'flex', ml: 1 }}>
                <BareTooltip title="Slovenčina" placement="bottom">
                  <IconButton 
                    onClick={() => changeLanguage('sk')}
                    color="inherit"
                    sx={{ 
                      opacity: !isEN ? 1 : 0.6,
                      '&:hover': { opacity: 1 }
                    }}
                  >
                    <SKFlagIcon />
                  </IconButton>
                </BareTooltip>
                <BareTooltip title="English" placement="bottom">
                  <IconButton 
                    onClick={() => changeLanguage('en')}
                    color="inherit"
                    sx={{ 
                      opacity: isEN ? 1 : 0.6,
                      '&:hover': { opacity: 1 }
                    }}
                  >
                    <ENFlagIcon />
                  </IconButton>
                </BareTooltip>
              </Box>
            )}
            
            {!isMobile && (
              <>
                <BareTooltip title={t('settings.toggleTheme')} placement="bottom">
                  <IconButton color="inherit" onClick={toggleTheme} sx={{ ml: 1 }}>
                    {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
                  </IconButton>
                </BareTooltip>
                <BareTooltip title={t('auth.logout')} placement="bottom">
                  <IconButton
                    color="inherit"
                    onClick={handleLogoutClick}
                    sx={{ ml: 1 }}
                  >
                    <LogoutIcon />
                  </IconButton>
                </BareTooltip>
              </>
            )}
          </Box>
        </StyledToolbar>
      </StyledAppBar>

      {/* Mobilné menu s použitím nového komponentu */}
      <MobileNavbar 
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLogout={handleLogoutClick}
      />

      {/* Dialóg pre odhlásenie */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        aria-labelledby="logout-dialog-title"
        aria-describedby="logout-dialog-description"
        PaperProps={{
          sx: {
            background: 'none',
            boxShadow: 'none',
            margin: { xs: '8px', sm: '16px' },
            borderRadius: '24px'
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)'
          }
        }}
      >
        <Box sx={{
            backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000',
            padding: '0px',
            borderRadius: '24px',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
         }}>
          <DialogTitle id="logout-dialog-title" 
            sx={{ 
              padding: '24px 24px 16px 24px',
              fontSize: '1.25rem',
              fontWeight: 600
            }}
          >
            {t('auth.logout')}
          </DialogTitle>
          <DialogContent sx={{ 
              padding: '16px 24px',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
              overflowY: 'auto', 
            }}
          >
            <DialogContentText id="logout-dialog-description"
              sx={{ 
                color: 'inherit',
                fontSize: '1rem',
              }}
            >
              {t('auth.logout')}?
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ 
              padding: '16px 24px 24px 24px',
              gap: 2
            }}
          >
            <Button 
              onClick={handleLogoutCancel}
              sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                '&:hover': { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleLogoutConfirm} 
              autoFocus
              variant="contained"
              sx={{
                backgroundColor: '#ff9f43',
                color: '#fff',
                fontWeight: 500,
                borderRadius: '12px',
                padding: '8px 20px',
                '&:hover': {
                  backgroundColor: '#f9872f',
                }
              }}
            >
              {t('auth.logout')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

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
