import React, { useState, useEffect, useRef } from 'react';
import {
  CssBaseline,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  styled,
  Box,
  Toolbar,
  AppBar,
  useMediaQuery,
  useTheme,
  MenuList,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Drawer,
  Badge,
  Popover,
  Paper,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
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
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import ChatIcon from '@mui/icons-material/Chat';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { MenuProps } from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useThemeMode } from '../contexts/ThemeContext';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useNotifications } from '../contexts/NotificationsContext';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { useChatUI } from '../AppContent';

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
})<{ isDarkMode?: boolean }>(({ isDarkMode = true }) => ({
  position: 'relative',
  padding: '4px',
  '& .MuiListItemButton-root': {
    borderRadius: 0,
    padding: '12px 16px',
    minWidth: '56px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    color: isDarkMode ? colors.text.primary : '#000000',
    '&:hover': {
      backgroundColor: isDarkMode 
        ? 'rgba(99, 102, 241, 0.1)' 
        : 'rgba(99, 102, 241, 0.05)',
      transform: 'translateY(-2px)',
      boxShadow: isDarkMode 
        ? '0 4px 20px rgba(99, 102, 241, 0.2)' 
        : '0 4px 20px rgba(99, 102, 241, 0.1)',
    },
  },
  '& .MuiListItemIcon-root': {
    minWidth: 40,
    color: 'inherit',
  },
  '& .MuiListItemText-root': {
    opacity: 0,
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%) translateY(8px)',
    backgroundColor: isDarkMode ? 'rgba(35, 35, 66, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    padding: '8px 12px',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    transition: 'all 0.3s ease',
    visibility: 'hidden',
    color: isDarkMode ? colors.text.primary : '#000000',
    boxShadow: isDarkMode 
      ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
      : '0 4px 20px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    backdropFilter: 'blur(10px)',
    '&:before': {
      content: '""',
      position: 'absolute',
      top: '-4px',
      left: '50%',
      transform: 'translateX(-50%) rotate(45deg)',
      width: '8px',
      height: '8px',
      backgroundColor: 'inherit',
      borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      borderLeft: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    }
  },
  '&:hover .MuiListItemText-root': {
    opacity: 1,
    transform: 'translateX(-50%) translateY(4px)',
    visibility: 'visible',
  },
  '&:hover .MuiListItemButton-root': {
    backgroundColor: isDarkMode 
      ? 'rgba(99, 102, 241, 0.1)' 
      : 'rgba(99, 102, 241, 0.05)',
  },
  '&:hover .MuiSvgIcon-root': {
    transform: 'scale(1.1)',
    color: colors.primary.main,
  },
  '& .MuiSvgIcon-root': {
    color: isDarkMode ? colors.text.primary : '#000000',
    transition: 'all 0.3s ease',
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
  borderRadius: 0,
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
  backgroundColor: 'transparent',
  backdropFilter: 'blur(20px)',
  boxShadow: 'none',
  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  transition: 'all 0.3s ease',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1300,
  borderRadius: 0,
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

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg'));
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, userData } = useAuth();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const { unreadCount, markAsRead, markAllAsRead, getLatestNotifications } = useNotifications();
  const { chatOpen, toggleChat, unreadConversationsCount, hasNewMessages } = useChatUI();
  
  // Stav pre notifikačný popover
  const [notificationsEl, setNotificationsEl] = useState<null | HTMLElement>(null);
  const [notificationsList, setNotificationsList] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  
  // Funkcia pre načítanie notifikácií
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      console.log("Začína načítavanie notifikácií...");
      
      try {
        // Pokúsime sa načítať notifikácie cez context
        const notifications = await getLatestNotifications(10);
        console.log("Načítané notifikácie cez kontext:", notifications);
        setNotificationsList(notifications);
      } catch (error: any) {
        console.warn("Chyba pri načítavaní notifikácií cez kontext:", error);
        
        // Ak sa vyskytne chyba s indexom, extrahujeme URL na vytváranie indexu
        if (error && error.message && error.message.includes('index')) {
          const urlMatch = error.message.match(/https:\/\/console\.firebase\.google\.com[^\s)]+/);
          if (urlMatch) {
            console.warn("Pre správne fungovanie vytvorte index: " + urlMatch[0]);
          }
        }
        
        // Nastavíme aspoň prázdne notifikácie
        setNotificationsList([]);
      }
    } catch (error) {
      console.error("Chyba pri načítavaní notifikácií:", error);
      setNotificationsList([]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Otvorenie notifikačného popoveru
  const handleNotificationClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsEl(event.currentTarget);
    fetchNotifications();
  };

  // Zatvorenie notifikačného popoveru
  const handleNotificationClose = () => {
    setNotificationsEl(null);
  };

  // Označenie notifikácie ako prečítanej
  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
      setNotificationsList(prev => prev.map(notification => 
        notification.id === id ? { ...notification, sent: true } : notification
      ));
    } catch (error) {
      console.error("Chyba pri označovaní notifikácie ako prečítanej:", error);
    }
  };

  // Označenie všetkých notifikácií ako prečítané
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      setNotificationsList(prev => prev.map(notification => ({ ...notification, sent: true })));
    } catch (error) {
      console.error("Chyba pri označovaní všetkých notifikácií ako prečítané:", error);
    }
  };

  // Formátovanie dátumu
  const formatDateTime = (date: Timestamp | Date | undefined | null): string => {
    if (!date) return 'Neznámy čas';
    
    if (date instanceof Timestamp) {
      return format(date.toDate(), 'dd.MM.yyyy HH:mm');
    }
    
    return format(new Date(date), 'dd.MM.yyyy HH:mm');
  };

  const handleMobileMenuClick = () => {
    setMobileMenuOpen(true);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleMobileMenuClose();
  };

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
    handleMobileMenuClose();
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

  // Funkcia pre otvorenie/zatvorenie chatu
  const handleChatToggle = () => {
    toggleChat();
  };

  const menuItems: MenuItem[] = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Sledované prepravy', icon: <LocalShippingIcon />, path: '/tracked-transports' },
    { text: 'Mapa vozidiel', icon: <LocationOnIcon />, path: '/vehicle-map' },
    { text: 'Objednávky', icon: <ReceiptIcon />, path: '/orders' },
    { text: 'Obchodné prípady', icon: <BusinessIcon />, path: '/business-cases', access: ['manager', 'admin', 'super-admin'] },
    { text: 'Faktúry', icon: <EuroIcon />, path: '/invoices' },
    { text: 'Kontakty', icon: <ContactsIcon />, path: '/contacts' },
    { text: 'Tím', icon: <GroupIcon />, path: '/team' },
    { text: 'Nastavenia', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Notifikácie', icon: <NotificationsIcon />, path: '/notifications', access: ['user', 'manager', 'admin', 'super-admin'] },
  ];

  return (
    <PageWrapper isDarkMode={isDarkMode}>
      <StyledAppBar position="static">
        <StyledToolbar>
          {isMobile ? (
            <>
              <Box 
                onClick={() => navigate('/dashboard')} 
                sx={{ 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  flexGrow: 1, 
                }}
              >
                <LogoImage 
                  src={isDarkMode ? logoMiniDarkPath : logoMiniLightPath} 
                  alt="AESA Logo Mini" 
                  sx={{ 
                      height: '28px',
                      width: 'auto'
                  }}
                 />
                 <Typography 
                  variant="h6" 
                  noWrap 
                  component="div"
                  sx={{ 
                    color: isDarkMode ? '#ffffff' : '#000000',
                    fontWeight: 600,
                    letterSpacing: '-0.5px',
                    fontSize: {xs: '1rem', sm: '1.1rem', md: '1.2rem'},
                    ml: 1
                  }}
                >
                  Transport
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'flex',
                gap: {xs: 1, sm: 1.5},
                alignItems: 'center',
                mr: {xs: 1, sm: 1.5}
              }}>
                <IconButton
                  onClick={handleChatToggle}
                  sx={{ 
                    padding: {xs: '8px', sm: '10px'}, 
                    color: chatOpen ? colors.primary.main : (isDarkMode ? colors.text.secondary : theme.palette.text.secondary),
                    backgroundColor: chatOpen ? (isDarkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)') : 'transparent',
                    '&:hover': {
                      color: isDarkMode ? colors.text.primary : theme.palette.text.primary,
                      backgroundColor: isDarkMode 
                        ? 'rgba(99, 102, 241, 0.1)' 
                        : 'rgba(99, 102, 241, 0.05)',
                    }
                  }}
                >
                  <Badge 
                    badgeContent={unreadConversationsCount} 
                    color="error" 
                    overlap="circular" 
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.6rem',
                        height: '16px',
                        minWidth: '16px',
                        top: 4,
                        right: 4
                      }
                    }}
                  >
                    <ChatIcon sx={{ fontSize: {xs: '1.5rem', sm: '1.6rem', md: '1.8rem'} }} />
                  </Badge>
                </IconButton>
                <IconButton
                  onClick={handleNotificationClick}
                  sx={{ 
                    padding: {xs: '4px', sm: '6px', md: '8px'}, 
                    color: isDarkMode ? colors.text.secondary : theme.palette.text.secondary,
                    '&:hover': {
                      color: isDarkMode ? colors.text.primary : theme.palette.text.primary,
                      backgroundColor: isDarkMode 
                        ? 'rgba(99, 102, 241, 0.1)' 
                        : 'rgba(99, 102, 241, 0.05)',
                    }
                  }}
                >
                  <Badge badgeContent={unreadCount} color="error" overlap="circular" 
                    sx={{
                      '& .MuiBadge-badge': {
                        fontSize: '0.6rem',
                        height: '16px',
                        minWidth: '16px'
                      }
                    }}
                  >
                    <NotificationsIcon sx={{ fontSize: {xs: '1.1rem', sm: '1.2rem', md: '1.4rem'} }} />
                  </Badge>
                </IconButton>
              </Box>
              <MenuButton
                edge="end"
                sx={{
                  color: isDarkMode ? '#ffffff' : '#000000',
                  padding: {xs: '4px', sm: '6px', md: '8px'},
                  '&:hover': {
                    backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)',
                  }
                }}
                aria-label="menu"
                onClick={handleMobileMenuClick}
              >
                <MenuIcon sx={{ fontSize: {xs: '1.1rem', sm: '1.2rem', md: '1.4rem'} }} />
              </MenuButton>
            </>
          ) : (
            <>
              <BrandContainer>
                <Box 
                  onClick={() => navigate('/dashboard')} 
                  sx={{ 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: {lg: 1, xl: 2},
                    transition: 'opacity 0.2s ease-in-out',
                    '&:hover': {
                      opacity: 0.8
                    }
                  }}
                >
                  <LogoImage src={isDarkMode ? logoDarkPath : logoLightPath} alt="AESA Logo" sx={{ height: {lg: '28px', xl: '32px'} }} />
                  <Typography 
                    variant="h6" 
                    noWrap 
                    component="div"
                    sx={{ 
                      color: isDarkMode ? '#ffffff' : '#000000',
                      fontWeight: 600,
                      letterSpacing: '-0.5px',
                      fontSize: {lg: '1.1rem', xl: '1.25rem'}
                    }}
                  >
                    Transport Platform
                  </Typography>
                </Box>
              </BrandContainer>
              <Box sx={{ 
                display: 'flex', 
                gap: {lg: 0.5, xl: 1},
                alignItems: 'center',
                height: '40px',
                marginLeft: 'auto',
                flexShrink: 0
              }}>
                {menuItems.map((item) => (
                  <NavListItem key={item.text} disablePadding isDarkMode={isDarkMode}>
                    <ListItemButton
                      component={Link}
                      to={item.path ?? '#'}
                      selected={location.pathname === item.path}
                      onClick={item.onClick}
                      sx={{
                        borderRadius: '6px',
                        padding: {lg: '6px 8px', xl: '8px 12px'},
                        margin: '0 1px',
                        minWidth: 'auto',
                        color: isDarkMode ? colors.text.secondary : theme.palette.text.secondary,
                        '&:hover': {
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                          color: isDarkMode ? colors.text.primary : theme.palette.text.primary,
                        },
                        '&.Mui-selected': {
                          backgroundColor: isDarkMode 
                            ? 'rgba(99, 102, 241, 0.15)' 
                            : 'rgba(99, 102, 241, 0.1)',
                          color: colors.primary.main,
                          '& .MuiSvgIcon-root': {
                            color: colors.primary.main,
                          }
                        }
                      }}
                    >
                      <ListItemIconStyled sx={{ minWidth: {lg: '16px', xl: '20px'}, mr: {lg: 0.5, xl: 1.5} }}>
                        {React.cloneElement(item.icon as React.ReactElement, { 
                          sx: { fontSize: {lg: '1.1rem', xl: '1.3rem'} } 
                        })}
                      </ListItemIconStyled>
                    </ListItemButton>
                  </NavListItem>
                ))}
                <Box sx={{ 
                  display: 'flex',
                  gap: {xs: 1, sm: 1.5},
                  alignItems: 'center',
                  marginLeft: 1,
                  ml: {lg: 1, xl: 2}
                }}>
                   <IconButton
                     onClick={handleChatToggle}
                     sx={{ 
                       padding: {xs: '8px', sm: '10px'}, 
                       color: chatOpen ? colors.primary.main : (isDarkMode ? colors.text.secondary : theme.palette.text.secondary),
                       backgroundColor: chatOpen ? (isDarkMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)') : 'transparent',
                       '&:hover': {
                         color: isDarkMode ? colors.text.primary : theme.palette.text.primary,
                         backgroundColor: isDarkMode 
                           ? 'rgba(99, 102, 241, 0.1)' 
                           : 'rgba(99, 102, 241, 0.05)',
                       }
                     }}
                   >
                     <Badge 
                       badgeContent={unreadConversationsCount} 
                       color="error" 
                       overlap="circular" 
                       sx={{
                         '& .MuiBadge-badge': {
                           fontSize: '0.6rem',
                           height: '16px',
                           minWidth: '16px',
                           top: 4,
                           right: 4
                         }
                       }}
                     >
                       <ChatIcon sx={{ fontSize: {xs: '1.5rem', sm: '1.6rem', md: '1.8rem'} }} />
                     </Badge>
                   </IconButton>
                   <IconButton
                     onClick={handleNotificationClick}
                     sx={{ 
                         padding: {xs: '4px', sm: '6px', md: '8px'}, 
                         color: isDarkMode ? colors.text.secondary : theme.palette.text.secondary,
                        '&:hover': {
                            color: isDarkMode ? colors.text.primary : theme.palette.text.primary,
                            backgroundColor: isDarkMode 
                            ? 'rgba(99, 102, 241, 0.1)' 
                            : 'rgba(99, 102, 241, 0.05)',
                         }
                     }}
                   >
                     <Badge badgeContent={unreadCount} color="error" overlap="circular" 
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.6rem',
                            height: '16px',
                            minWidth: '16px'
                          }
                        }}
                     >
                       <NotificationsIcon sx={{ fontSize: {xs: '1.1rem', sm: '1.2rem', md: '1.4rem'} }} />
                     </Badge>
                   </IconButton>
                   
                   <IconButton
                    onClick={toggleTheme}
                    sx={{ 
                         padding: {xs: '4px', sm: '6px', md: '8px'}, 
                         color: isDarkMode ? colors.text.secondary : theme.palette.text.secondary,
                        '&:hover': {
                            color: isDarkMode ? colors.text.primary : theme.palette.text.primary,
                            backgroundColor: isDarkMode 
                            ? 'rgba(99, 102, 241, 0.1)' 
                            : 'rgba(99, 102, 241, 0.05)',
                         }
                    }}
                  >
                    {isDarkMode ? 
                      <Brightness7Icon sx={{ fontSize: {xs: '1.1rem', sm: '1.2rem', md: '1.4rem'} }} /> :
                      <Brightness4Icon sx={{ fontSize: {xs: '1.1rem', sm: '1.2rem', md: '1.4rem'} }} />
                    }
                  </IconButton>
                   <IconButton
                    onClick={handleLogoutClick}
                    sx={{ 
                        padding: {xs: '4px', sm: '6px', md: '8px'}, 
                        color: isDarkMode ? '#f87171' : '#ef4444',
                        '&:hover': {
                            backgroundColor: isDarkMode ? 'rgba(248, 113, 113, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                            color: isDarkMode ? '#ef4444' : '#dc2626'
                        },
                    }}
                  >
                    <LogoutIcon sx={{ fontSize: {xs: '1.1rem', sm: '1.2rem', md: '1.4rem'} }} />
                  </IconButton>
                </Box>
              </Box>
            </>
          )}
        </StyledToolbar>
      </StyledAppBar>

      {/* Notifikačný popover */}
      <NotificationPopover
        open={Boolean(notificationsEl)}
        anchorEl={notificationsEl}
        onClose={handleNotificationClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Paper sx={{ 
          bgcolor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff', 
          borderRadius: '10px',
          backdropFilter: 'blur(10px)',
        }}>
          <NotificationHeader isDarkMode={isDarkMode}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <NotificationsIcon color="primary" />
              <Typography variant="subtitle1" color="textPrimary" fontWeight="600">
                Notifikácie
              </Typography>
              {unreadCount > 0 && (
                <Chip 
                  size="small" 
                  label={`${unreadCount} nových`} 
                  color="primary" 
                  sx={{ height: '20px', fontSize: '0.7rem' }} 
                />
              )}
            </Box>
            {unreadCount > 0 && (
              <Button
                variant="text"
                size="small"
                startIcon={<MarkEmailReadIcon sx={{ fontSize: '1rem' }} />}
                onClick={handleMarkAllAsRead}
                sx={{ 
                  textTransform: 'none', 
                  fontSize: '0.8rem',
                  color: colors.primary.main
                }}
              >
                Označiť všetky
              </Button>
            )}
          </NotificationHeader>
          
          <NotificationContainer>
            {loadingNotifications ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress size={32} />
              </Box>
            ) : notificationsList.length === 0 ? (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="textSecondary" variant="body2">
                  Žiadne notifikácie
                </Typography>
                <Typography color="textSecondary" variant="caption" sx={{ display: 'block', mt: 1 }}>
                  {unreadCount > 0 
                    ? `V systéme je ${unreadCount} neprečítaných notifikácií, ktoré sa nepodarilo zobraziť.` 
                    : 'Nemáte žiadne notifikácie na zobrazenie.'}
                </Typography>
                {/* Debug info */}
                <Box sx={{ mt: 2, p: 1, bgcolor: 'rgba(0,0,0,0.05)', borderRadius: 1 }}>
                  <Typography color="textSecondary" variant="caption" sx={{ display: 'block', fontFamily: 'monospace' }}>
                    Debug info: {JSON.stringify({ 
                      unreadCount, 
                      listLength: notificationsList.length, 
                      loading: loadingNotifications,
                      userData: userData?.companyID ? 'OK' : 'Missing'
                    })}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <>
                {notificationsList.map((notification) => (
                  <NotificationItem key={notification.id} isDarkMode={isDarkMode} isRead={Boolean(notification.sent)}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: notification.sent ? 'normal' : 'bold' }}>
                        {notification.type === 'business' 
                          ? 'Obchodný prípad' 
                          : notification.type === 'loading' 
                            ? 'Nakládka' 
                            : notification.type === 'unloading'
                              ? 'Vykládka'
                              : 'Notifikácia'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccessTimeIcon sx={{ fontSize: '0.9rem', mr: 0.5, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(notification.reminderTime || notification.reminderDateTime)}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      {notification.type === 'business' 
                        ? `Firma: ${notification.companyName || 'Neznáma'}` 
                        : `Objednávka: ${notification.orderNumber || 'Neznáma'}`}
                    </Typography>
                    
                    {notification.address && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', mb: 1 }}>
                        Adresa: {notification.address}
                      </Typography>
                    )}
                    
                    {notification.reminderNote && (
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', mb: 1 }}>
                        {notification.reminderNote}
                        </Typography>
                    )}
                    
                    {!notification.sent && (
                      <Button
                        variant="text"
                        size="small"
                        startIcon={<MarkEmailReadIcon sx={{ fontSize: '0.9rem' }} />}
                        onClick={() => handleMarkAsRead(notification.id)}
                        sx={{ textTransform: 'none', fontSize: '0.8rem', mt: 1, p: 0 }}
                      >
                        Označiť ako prečítané
                      </Button>
                    )}
                  </NotificationItem>
                ))}
              </>
            )}
          </NotificationContainer>
          
          <NotificationFooter isDarkMode={isDarkMode}>
            <Button
              variant="text"
              onClick={() => {
                navigate('/notifications');
                handleNotificationClose();
              }}
              sx={{ textTransform: 'none' }}
            >
              Zobraziť všetky notifikácie
            </Button>
          </NotificationFooter>
        </Paper>
      </NotificationPopover>

      <MobileDrawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        isDarkMode={isDarkMode}
      >
        <Box sx={{ 
          display: { xs: 'flex', sm: 'none' },
          justifyContent: 'flex-end',
          padding: '8px 8px 0 8px',
        }}>
          <IconButton
            onClick={handleMobileMenuClose}
            sx={{
              color: isDarkMode ? '#ffffff' : '#000000',
              padding: '8px',
              '&:hover': {
                backgroundColor: isDarkMode 
                  ? 'rgba(99, 102, 241, 0.1)' 
                  : 'rgba(99, 102, 241, 0.05)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ overflowY: 'auto', flexGrow: 1 }}>
            {menuItems.map((item) => (
              <MenuItem
                key={item.text}
                onClick={() => item.path && handleNavigation(item.path)}
                sx={{
                  padding: 0,
                  margin: '4px 0',
                  width: '100%'
                }}
              >
                <MenuItemWrapper 
                    isDarkMode={isDarkMode}
                    selected={location.pathname === item.path}
                    sx={{
                        '&.Mui-selected': {
                          backgroundColor: isDarkMode 
                            ? 'rgba(99, 102, 241, 0.15)' 
                            : 'rgba(99, 102, 241, 0.1)',
                           '& .MuiListItemIcon-root': {
                                color: colors.primary.main,
                           },
                           '& .menu-item-text': {
                               color: colors.primary.main,
                               fontWeight: 'bold',
                           }
                        },
                        '&:hover': {
                           backgroundColor: isDarkMode 
                            ? 'rgba(99, 102, 241, 0.1)' 
                            : 'rgba(99, 102, 241, 0.05)',
                           transform: 'translateX(4px)',
                        }
                    }}
                >
                  <MenuItemIcon sx={{ color: location.pathname === item.path ? colors.primary.main : 'inherit' }}>
                    {item.icon}
                  </MenuItemIcon>
                  <MenuItemContent>
                    <Typography 
                      component="div"
                      className="menu-item-text"
                      sx={{ 
                        fontSize: '0.95rem',
                        fontWeight: location.pathname === item.path ? 'bold' : 500,
                        color: location.pathname === item.path ? colors.primary.main : (isDarkMode ? colors.text.primary : '#000000'),
                        lineHeight: 1.2
                      }}
                    >
                      {item.text}
                    </Typography>
                    {item.description && (
                      <Typography 
                        component="div"
                        sx={{ 
                          fontSize: '0.75rem',
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                          lineHeight: 1.2
                        }}
                      >
                        {item.description}
                      </Typography>
                    )}
                  </MenuItemContent>
                </MenuItemWrapper>
              </MenuItem>
            ))}
        </Box>
        <Divider sx={{ 
          margin: '16px 0', 
          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' 
        }} />
        <BottomActions>
          <ActionItem
            onClick={toggleTheme}
            isDarkMode={isDarkMode}
          >
            <ListItemIcon sx={{ 
              minWidth: 'auto',
              color: 'inherit',
              '& .MuiSvgIcon-root': {
                fontSize: '20px',
              },
            }}>
              {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </ListItemIcon>
            <ListItemText 
              primary={isDarkMode ? "Svetlý režim" : "Tmavý režim"}
              sx={{
                '& .MuiTypography-root': {
                  fontSize: '0.95rem',
                  fontWeight: 500,
                },
              }}
            />
          </ActionItem>
          <ActionItem
            onClick={handleLogoutClick}
            isDarkMode={isDarkMode}
            isLogout
          >
            <ListItemIcon sx={{ 
              minWidth: 'auto',
              color: 'inherit',
              '& .MuiSvgIcon-root': {
                fontSize: '20px',
              },
            }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Odhlásiť sa"
              sx={{
                '& .MuiTypography-root': {
                  fontSize: '0.95rem',
                  fontWeight: 500,
                },
              }}
            />
          </ActionItem>
        </BottomActions>
      </MobileDrawer>

      <StyledDialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        isDarkMode={isDarkMode}
      >
        <DialogTitle>Odhlásenie</DialogTitle>
        <DialogContent>
          <Typography>
            Ste si istí, že sa chcete odhlásiť?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <StyledButton
            onClick={handleLogoutCancel}
            variant="text"
            isDarkMode={isDarkMode}
            sx={{ mr: 1 }}
          >
            Zrušiť
          </StyledButton>
          <StyledButton
            onClick={handleLogoutConfirm}
            variant="contained"
            isDarkMode={isDarkMode}
            sx={{ 
                 backgroundColor: '#ef4444',
                 color: '#ffffff',
                '&:hover': {
                    backgroundColor: '#dc2626',
                }
             }}
          >
            Odhlásiť sa
          </StyledButton>
        </DialogActions>
      </StyledDialog>
    </PageWrapper>
  );
};

export default Navbar;
