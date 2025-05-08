import React, { useState, useEffect, useRef, FC, useCallback } from 'react';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import AppBar from '@mui/material/AppBar';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme, styled } from '@mui/material/styles';
import MenuList from '@mui/material/MenuList';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import DialogContentText from '@mui/material/DialogContentText';
import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import AccountIcon from '@mui/icons-material/AccountCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ContactsIcon from '@mui/icons-material/Contacts';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EuroIcon from '@mui/icons-material/Euro';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BusinessIcon from '@mui/icons-material/Business';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PeopleIcon from '@mui/icons-material/People';
import MenuIcon from '@mui/icons-material/Menu';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { MenuProps } from '@mui/material/Menu';
import { useThemeMode } from '../contexts/ThemeContext';
import { useNotifications, NotificationData } from '../contexts/NotificationsContext';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { useChatUI } from '../AppContent';
import { alpha } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import { TooltipProps } from '@mui/material/Tooltip';
import { createPortal } from 'react-dom';

const drawerWidth = 240;
const miniDrawerWidth = 64;

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

const Logo = styled(Typography)(({ theme }) => ({
  fontWeight: 800,
  color: colors.primary.main,
  fontSize: '1.5rem',
  marginRight: theme.spacing(2),
  letterSpacing: '-0.5px',
  transition: 'color 0.2s ease-in-out',
  '&:hover': {
    color: colors.primary.light,
  }
}));

const AesaLogoDrawer = styled('img')({
  height: '32px',
  width: 'auto',
  transition: 'all 0.3s ease-in-out',
  filter: 'brightness(1.1)',
  '&:hover': {
    transform: 'scale(1.05)',
  }
});

const AesaLogoMini = styled('img')({
  height: '28px',
  width: 'auto',
  transition: 'all 0.3s ease-in-out',
  filter: 'brightness(1.1)',
  '&:hover': {
    transform: 'scale(1.05)',
  }
});

const DrawerHeader = styled('div')({
  display: 'none'
});

const ToggleButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  right: '24px',
  bottom: '24px',
  backgroundColor: `${colors.primary.main}e6`,
  color: colors.text.primary,
  zIndex: 1300,
  padding: '12px',
  borderRadius: '16px',
  width: '48px',
  height: '48px',
  backdropFilter: 'blur(10px)',
  boxShadow: `0 4px 20px ${colors.primary.main}4d`,
  '&:hover': {
    backgroundColor: colors.primary.main,
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 24px ${colors.primary.main}66`,
  },
  '&:active': {
    transform: 'translateY(0)',
    boxShadow: `0 4px 16px ${colors.primary.main}4d`,
  },
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '& .MuiSvgIcon-root': {
    fontSize: '24px',
    transition: 'transform 0.3s ease',
  },
  '&:hover .MuiSvgIcon-root': {
    transform: 'scale(1.1)',
  },
  '@media (max-width: 600px)': {
    position: 'relative',
    right: 'auto',
    bottom: 'auto',
    margin: '16px auto',
    display: 'flex',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
  }
}));

const ListItemIconStyled = styled(ListItemIcon)({
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

const NavListItem = styled(ListItem, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode?: boolean }>(({ theme, isDarkMode = true }) => ({
  position: 'relative',
  padding: '4px',
  '& .MuiListItemButton-root': {
    borderRadius: '8px',
    padding: '12px 16px',
    minWidth: '56px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'all 0.2s ease-in-out',
    color: isDarkMode ? colors.text.secondary : 'rgba(0, 0, 0, 0.6)',
    '&:hover': {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.04)',
      color: isDarkMode ? colors.text.primary : 'rgba(0, 0, 0, 0.87)',
      transform: 'translateY(-2px)',
      boxShadow: isDarkMode 
        ? '0 4px 12px rgba(0, 0, 0, 0.2)' 
        : '0 4px 12px rgba(0, 0, 0, 0.1)',
      '& .MuiSvgIcon-root': {
        transform: 'scale(1.1)',
        color: colors.primary.main
      }
    },
    '&.Mui-selected': {
      backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
      color: colors.primary.main,
      '&:hover': {
        backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.08)',
      }
    }
  },
  '& .MuiListItemText-root': {
    marginTop: '4px',
    '& .MuiTypography-root': {
      fontSize: '0.75rem',
      fontWeight: 500,
      textAlign: 'center',
      transition: 'all 0.2s ease-in-out'
    }
  }
}));

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path?: string;
  onClick?: () => void;
  hidden?: boolean;
  description?: string;
  access?: string[];
}

const MinimizedMenuItem = styled(MenuItem)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 0',
  minWidth: '60px',
  margin: '0 auto',
  '& .MuiSvgIcon-root': {
    fontSize: '1.5rem',
    marginBottom: '4px',
  },
  '& .MuiTypography-root': {
    fontSize: '0.75rem',
  }
}));

const MinimizedMenuList = styled(MenuList)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '8px 0',
  width: '100%',
  '& > *': {
    width: '100%',
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
  }
});

const LogoImage = styled('img')<{ isDarkMode: boolean }>({
  transition: 'filter 0.3s ease',
});

const BrandContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

const MenuContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flex: 1,
  justifyContent: 'flex-end'
});

const StyledMenuList = styled(List)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: 0,
  gap: '8px',
  margin: 0
});

const StyledMenuItem = styled(MenuItem)<{ isDarkMode?: boolean }>(({ isDarkMode }) => ({
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

const StyledMenuItemIcon = styled(ListItemIcon)<{ isDarkMode?: boolean }>(({ isDarkMode }) => ({
  minWidth: 0,
  marginRight: 1,
  color: isDarkMode ? colors.text.primary : '#000000'
}));

const StyledMenuItemText = styled(ListItemText)<{ isDarkMode?: boolean }>(({ isDarkMode }) => ({
  '& .MuiTypography-root': {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: isDarkMode ? colors.text.primary : '#000000'
  }
}));

const LogoutButton = styled(IconButton)<{ isDarkMode?: boolean }>(({ isDarkMode }) => ({
  color: isDarkMode ? colors.text.primary : '#000000',
  '&:hover': {
    color: colors.primary.main,
    backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.1)' : 'rgba(0, 0, 0, 0.05)'
  }
}));

interface AuthContextType {
  logout: () => Promise<void>;
}

const SideNav = styled('nav')(({ theme }) => ({
  width: '100%',
  backgroundColor: colors.background.main,
  backdropFilter: 'blur(20px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'fixed',
  height: '64px',
  zIndex: 1200,
  boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 16px',
  bottom: 0,
  left: 0,
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  '@media (max-width: 600px)': {
    height: '56px',
    padding: '0 12px'
  }
}));

const MainWrapper = styled('main')({
  width: '100%',
  marginBottom: '64px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '@media (max-width: 600px)': {
    marginBottom: '56px'
  }
});

const ContentWrapper = styled('div')({
  padding: '24px',
  position: 'relative',
  zIndex: 1,
  '@media (max-width: 600px)': {
    padding: '16px'
  }
});

const AppWrapper = styled('div')({
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: colors.background.light,
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
});

const Overlay = styled('div')({
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

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.98)',
  backdropFilter: 'blur(10px)',
  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  width: '100%',
  zIndex: theme.zIndex.appBar
}));

const StyledToolbar = styled(Toolbar)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  padding: '0 24px',
  minHeight: '56px',
  '@media (max-width: 600px)': {
    padding: '0 16px',
    minHeight: '48px',
  }
}));

const MenuButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.text.primary,
}));

const MobileDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode?: boolean }>(({ isDarkMode }) => ({
  '& .MuiDrawer-paper': {
    backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    width: '280px',
    height: '100%',
    padding: '16px',
    boxShadow: 'none',
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
  }
}));

const BottomActions = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginTop: '4px'
});

const ActionItem = styled(MenuItem)<{ isDarkMode?: boolean; isLogout?: boolean }>(({ isDarkMode, isLogout }) => ({
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

const MenuItemWrapper = styled(ListItemButton)<{ isDarkMode?: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '12px 16px',
  gap: '12px',
  borderRadius: 0,
  width: '100%',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    backgroundColor: isDarkMode 
      ? 'rgba(99, 102, 241, 0.1)' 
      : 'rgba(99, 102, 241, 0.05)',
    transform: 'translateX(4px)',
  },
}));

const MenuItemIcon = styled(ListItemIconStyled)({
  minWidth: '24px',
  width: '24px',
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& .MuiSvgIcon-root': {
    fontSize: '20px'
  }
});

const MenuItemContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
});

const PageWrapper = styled('div', {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  position: 'relative',
  backgroundColor: isDarkMode ? colors.background.dark : '#FFFFFF',
}));

const MainContent = styled('main')({
  flexGrow: 1,
  width: '100%',
});

const StyledListItem = styled(ListItem)<{ button?: boolean; isDarkMode?: boolean }>(({ isDarkMode = true }) => ({
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

const StyledDivider = styled(Divider)<{ isDarkMode?: boolean }>(({ isDarkMode }) => ({
  margin: '8px 16px',
  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
  height: '1px',
}));

const StyledDialog = styled(Dialog, {
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

const StyledButton = styled(Button, {
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
const logoMiniLightPath = "/favicon.png"; // Nahraďte správnou cestou k mini logu
const logoMiniDarkPath = "/AESA white favicon.png"; // Nahraďte správnou cestou k mini tmavému logu

// Nové komponenty pre notifikácie
const NotificationPopover = styled(Popover)(({ theme }) => ({
  '& .MuiPopover-paper': {
    width: '360px',
    maxHeight: '500px',
    overflow: 'hidden',
    marginTop: '10px',
    borderRadius: '10px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
  },
}));

const NotificationHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  padding: '12px 16px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
}));

const NotificationContainer = styled(Box)({
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

const NotificationItem = styled(Box, {
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

const NotificationFooter = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  padding: '12px 16px',
  display: 'flex',
  justifyContent: 'center',
  borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
}));

const StyledMenu = styled((props: MenuProps) => (
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

const SolidDialogPaper = styled(Paper)(({ theme }) => ({
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
const globalStyles = {
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
  
  const theme = useTheme();
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
  const location = useLocation();
  const { userData, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { toggleChat } = useChatUI();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleNotificationsClick = () => {
    setAnchorEl(null);
    navigate('/notifications');
  };

  const handleNotificationClick = (notification: any) => {
    setAnchorEl(null);
    // Handle notification click
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

  return (
    <>
      <StyledAppBar position="fixed">
        <StyledToolbar>
          {isMobile ? (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              onClick={() => setDrawerOpen(true)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
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
                title="Dashboard"
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
                      backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.8),
                      transform: 'translateY(-2px)'
                    },
                  }}
                  aria-label="Dashboard"
                />
              </BareTooltip>
              <BareTooltip
                title="Business Cases"
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
                      backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.8),
                      transform: 'translateY(-2px)'
                    },
                  }}
                  aria-label="Business Cases"
                />
              </BareTooltip>
              <BareTooltip
                title="Objednávky"
                placement="bottom"
                enterDelay={300}
                leaveDelay={200}
              >
                <Button
                  color="inherit"
                  startIcon={<LocalShippingIcon />}
                  onClick={() => navigate('/orders')}
                  sx={{
                    mr: 2,
                    transition: 'transform 0.2s ease, background-color 0.2s ease',
                    '&:hover, &.Mui-focusVisible': {
                      backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.8),
                      transform: 'translateY(-2px)'
                    },
                  }}
                  aria-label="Objednávky"
                />
              </BareTooltip>
              <BareTooltip
                title="Sledované prepravy"
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
                      backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.8),
                      transform: 'translateY(-2px)'
                    },
                  }}
                  aria-label="Sledované prepravy"
                />
              </BareTooltip>
              <BareTooltip
                title="Mapa vozidiel"
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
                      backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.8),
                      transform: 'translateY(-2px)'
                    },
                  }}
                  aria-label="Mapa vozidiel"
                />
              </BareTooltip>
              <BareTooltip
                title="Tím"
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
                      backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.8),
                      transform: 'translateY(-2px)'
                    },
                  }}
                  aria-label="Tím"
                />
              </BareTooltip>
              <BareTooltip
                title="Nastavenia"
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
                      backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.8),
                      transform: 'translateY(-2px)'
                    },
                  }}
                  aria-label="Nastavenia"
                />
              </BareTooltip>
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton color="inherit" onClick={handleNotificationsClick}>
              <Badge badgeContent={unreadCount} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <IconButton 
              color="inherit" 
              onClick={toggleChat}
              sx={{ ml: 1 }}
            >
              <ChatIcon />
            </IconButton>
            <IconButton color="inherit" onClick={toggleTheme} sx={{ ml: 1 }}>
              {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            <IconButton
              color="inherit"
              onClick={handleLogoutClick}
              sx={{ ml: 1 }}
            >
              <LogoutIcon />
            </IconButton>
          </Box>
        </StyledToolbar>
      </StyledAppBar>

      {/* Mobilné menu */}
      <MobileDrawer
        anchor="left"
        open={drawerOpen && isMobile}
        onClose={() => setDrawerOpen(false)}
        isDarkMode={isDarkMode}
      >
        <Box sx={{ width: 250, pt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', px: 2, mb: 2 }}>
            <img 
              src={isDarkMode ? logoDarkPath : logoLightPath} 
              alt="Logo" 
              style={{ height: '32px', marginRight: '12px' }} 
            />
            <Typography variant="subtitle1">
              Transport Platform
            </Typography>
          </Box>
          <Divider />
          <List>
            <ListItemButton onClick={() => { navigate('/dashboard'); setDrawerOpen(false); }}>
              <ListItemIcon><DashboardIcon /></ListItemIcon>
              <ListItemText primary="Dashboard" />
            </ListItemButton>
            <ListItemButton onClick={() => { navigate('/business-cases'); setDrawerOpen(false); }}>
              <ListItemIcon><BusinessIcon /></ListItemIcon>
              <ListItemText primary="Business Cases" />
            </ListItemButton>
            <ListItemButton onClick={() => { navigate('/orders'); setDrawerOpen(false); }}>
              <ListItemIcon><LocalShippingIcon /></ListItemIcon>
              <ListItemText primary="Objednávky" />
            </ListItemButton>
            <ListItemButton onClick={() => { navigate('/tracked-shipments'); setDrawerOpen(false); }}>
              <ListItemIcon><VisibilityIcon /></ListItemIcon>
              <ListItemText primary="Sledované prepravy" />
            </ListItemButton>
            <ListItemButton onClick={() => { navigate('/vehicle-map'); setDrawerOpen(false); }}>
              <ListItemIcon><LocationOnIcon /></ListItemIcon>
              <ListItemText primary="Mapa vozidiel" />
            </ListItemButton>
            <ListItemButton onClick={() => { navigate('/team'); setDrawerOpen(false); }}>
              <ListItemIcon><PeopleIcon /></ListItemIcon>
              <ListItemText primary="Tím" />
            </ListItemButton>
            <ListItemButton onClick={() => { navigate('/settings'); setDrawerOpen(false); }}>
              <ListItemIcon><SettingsIcon /></ListItemIcon>
              <ListItemText primary="Nastavenia" />
            </ListItemButton>
          </List>
        </Box>
      </MobileDrawer>

      {/* Dialóg pre odhlásenie */}
      <Dialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        PaperProps={{
          sx: {
            background: 'none',
            boxShadow: 'none',
            margin: { xs: '8px', sm: '16px' },
            borderRadius: '24px',
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
          backgroundColor: theme.palette.mode === 'dark' ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
          color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
          padding: '0px',
          borderRadius: '24px',
          border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          <DialogTitle sx={{ padding: '24px 24px 16px 24px', fontSize: '1.25rem', fontWeight: 600 }}>
            Odhlásenie
          </DialogTitle>
          <DialogContent sx={{ padding: '16px 24px', color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)', overflowY: 'auto' }}>
            <DialogContentText sx={{ color: 'inherit', fontSize: '1rem' }}>
              Naozaj sa chcete odhlásiť?
            </DialogContentText>
          </DialogContent>
          <DialogActions sx={{ padding: '16px 24px 24px 24px' }}>
            <Button onClick={handleLogoutCancel} variant="outlined" color="inherit" sx={{ borderRadius: '12px', padding: '8px 20px' }}>Zrušiť</Button>
            <Button onClick={handleLogoutConfirm} variant="contained" sx={{
              backgroundColor: '#ff9f43',
              color: '#fff',
              fontWeight: 500,
              borderRadius: '12px',
              padding: '8px 20px',
              '&:hover': { backgroundColor: '#f9872f' }
            }}>Odhlásiť</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
};

export default Navbar;
