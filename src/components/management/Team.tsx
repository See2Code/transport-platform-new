import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  IconButton,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  DialogContentText,
  Grid,
  useMediaQuery,
  useTheme,
  Snackbar,
  Card,
  SelectChangeEvent
  } from '@mui/material';
import { 
  Add as AddIcon, 
  Mail as MailIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Phone as PhoneIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, addDoc, doc, getDoc, deleteDoc, updateDoc, orderBy } from 'firebase/firestore';
import { auth, db, functions } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import 'react-phone-input-2/lib/style.css';

import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeMode } from '../../contexts/ThemeContext';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { sk } from 'date-fns/locale';
import { styled as muiStyled } from '@mui/material/styles';
import Tooltip, { TooltipProps } from '@mui/material/Tooltip';
import { createPortal } from 'react-dom';
import styled from '@emotion/styled';

interface Country {
  code: string;
  name: string;
  prefix: string;
}

const countries: Country[] = [
  { code: 'sk', name: 'Slovensko', prefix: '+421' },
  { code: 'cz', name: 'Česko', prefix: '+420' },
  { code: 'hu', name: 'Maďarsko', prefix: '+36' },
  { code: 'pl', name: 'Poľsko', prefix: '+48' },
  { code: 'at', name: 'Rakúsko', prefix: '+43' },
  { code: 'de', name: 'Nemecko', prefix: '+49' },
  { code: 'fr', name: 'Francúzsko', prefix: '+33' },
  { code: 'it', name: 'Taliansko', prefix: '+39' },
  { code: 'es', name: 'Španielsko', prefix: '+34' },
  { code: 'pt', name: 'Portugalsko', prefix: '+351' },
  { code: 'nl', name: 'Holandsko', prefix: '+31' },
  { code: 'be', name: 'Belgicko', prefix: '+32' },
  { code: 'dk', name: 'Dánsko', prefix: '+45' },
  { code: 'se', name: 'Švédsko', prefix: '+46' },
  { code: 'fi', name: 'Fínsko', prefix: '+358' },
  { code: 'ie', name: 'Írsko', prefix: '+353' },
  { code: 'gr', name: 'Grécko', prefix: '+30' },
  { code: 'ro', name: 'Rumunsko', prefix: '+40' },
  { code: 'bg', name: 'Bulharsko', prefix: '+359' },
  { code: 'hr', name: 'Chorvátsko', prefix: '+385' },
  { code: 'si', name: 'Slovinsko', prefix: '+386' },
  { code: 'ee', name: 'Estónsko', prefix: '+372' },
  { code: 'lv', name: 'Lotyšsko', prefix: '+371' },
  { code: 'lt', name: 'Litva', prefix: '+370' },
  { code: 'cy', name: 'Cyprus', prefix: '+357' },
  { code: 'mt', name: 'Malta', prefix: '+356' },
  { code: 'lu', name: 'Luxembursko', prefix: '+352' },
  { code: 'gb', name: 'Veľká Británia', prefix: '+44' },
  { code: 'ch', name: 'Švajčiarsko', prefix: '+41' },
  { code: 'no', name: 'Nórsko', prefix: '+47' },
  { code: 'ua', name: 'Ukrajina', prefix: '+380' },
  { code: 'rs', name: 'Srbsko', prefix: '+381' },
  { code: 'tr', name: 'Turecko', prefix: '+90' }
];

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: Date;
  userId: string;
  lastLogin: Timestamp | null;
}

interface Invitation {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  userId?: string;
}

type DeleteableItem = TeamMember | Invitation;

const colors = {
  primary: {
    main: '#1a1a2e',
    light: 'rgba(35, 35, 66, 0.95)',
    dark: '#12121f',
  },
  background: {
    main: 'rgba(28, 28, 45, 0.95)',
    light: 'rgba(35, 35, 66, 0.95)',
    dark: '#12121f',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.9)',
    disabled: 'rgba(255, 255, 255, 0.7)',
  },
  secondary: {
    main: '#ff6b6b',
    light: '#ff8787',
    dark: '#fa5252',
  },
  accent: {
    main: '#ff9f43',
    light: '#ffbe76',
    dark: '#f7b067',
  }
};

// Definície styled komponentov s korektným typovaním
const PageWrapper = styled('div')({
  padding: '24px',
  '@media (max-width: 600px)': {
    padding: '16px',
    paddingBottom: '80px',
    overflowX: 'hidden',
    width: '100%',
    maxWidth: '100vw'
  }
});

const PageHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
  '@media (max-width: 600px)': {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px'
  }
});

const PageTitle = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1.75rem',
  fontWeight: 700,
  color: isDarkMode ? '#ffffff' : '#000000',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-8px',
    left: 0,
    width: '60px',
    height: '4px',
    backgroundColor: '#ff9f43',
    borderRadius: '2px',
  }
}));

const _AddButton = styled('button')({
  backgroundColor: colors.accent.main,
  color: '#ffffff',
  padding: '12px 28px',
  fontSize: '0.95rem',
  borderRadius: '12px',
  border: 'none',
  cursor: 'pointer',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: colors.accent.dark,
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 10px rgba(255, 159, 67, 0.25)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.25rem',
  }
});

const _TeamCard = styled(Card)({
  backgroundColor: colors.background.main,
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
  padding: '24px',
  color: '#ffffff',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  overflow: 'visible',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.25)',
    border: '1px solid rgba(255, 159, 67, 0.3)',
  }
});

const _TeamInfo = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '24px',
  marginBottom: '24px',
});

const _InfoSection = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
});

const _InfoLabel = styled(Typography)({
  fontSize: '0.85rem',
  color: 'rgba(255, 255, 255, 0.5)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const _InfoValue = styled(Typography)({
  fontSize: '1rem',
  color: '#ffffff',
});

const _CardHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '16px',
});

const _MemberName = styled(Typography)({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: colors.accent.main,
  lineHeight: 1.3,
});

const _RoleChip = styled('span')({
  backgroundColor: `${colors.accent.main}33`,
  color: colors.accent.main,
  padding: '4px 12px',
  borderRadius: '12px',
  fontSize: '0.8rem',
  fontWeight: 500,
  display: 'inline-flex',
  alignItems: 'center',
});

const _AnimatedTableRow = styled(motion.tr)({
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const _fadeOut = {
  initial: { opacity: 1, height: 'auto' },
  exit: { 
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  }
};

const MobileTeamCard = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.75)' : '#ffffff',
  borderRadius: '16px',
  padding: '16px',
  color: isDarkMode ? '#ffffff' : '#000000',
  boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
  marginBottom: '16px',
  width: '100%'
}));

const MobileTeamHeader = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
  color: isDarkMode ? '#ffffff' : '#000000'
}));

const MobileTeamName = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: isDarkMode ? colors.accent.main : '#000000'
}));

const MobileTeamInfo = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  color: isDarkMode ? '#ffffff' : '#000000',
  '& > *': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }
}));

const _MobileTeamMember = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.9rem',
  color: isDarkMode ? '#ffffff' : '#000000',
  '& .MuiSvgIcon-root': {
    fontSize: '1.1rem',
    color: colors.accent.main
  }
}));

const MobileTeamRole = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.85rem',
  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  '& .MuiSvgIcon-root': {
    fontSize: '1rem',
    color: colors.accent.main
  }
}));

const MobileTeamActions = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '12px',
});

const _MobileInfoItem = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const _MobileInfoLabel = styled(Typography)({
  fontSize: '0.8rem',
  color: 'rgba(255, 255, 255, 0.5)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const _MobileInfoValue = styled(Typography)({
  fontSize: '0.95rem',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

const _MobileActions = styled(Box)({
  display: 'flex',
  gap: '8px',
  marginTop: '16px',
  justifyContent: 'flex-end',
});

const _ActionButton = styled(IconButton)({
  padding: '8px',
  '&:hover': {
    backgroundColor: 'rgba(255, 159, 67, 0.1)'
  }
});

const _StatusChip = styled(Chip)(({ status }: { status: string }) => ({
  backgroundColor: status === 'active' ? 'rgba(46, 213, 115, 0.15)' : 
                  status === 'pending' ? 'rgba(255, 159, 67, 0.15)' : 
                  'rgba(255, 107, 107, 0.15)',
  color: status === 'active' ? '#ff9f43' : 
        status === 'pending' ? '#ff9f43' : 
        '#ff6b6b',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: 500,
  height: '24px'
}));

const _StyledTableWrapper = styled(Paper)({
  backgroundColor: 'rgba(28, 28, 45, 0.95)',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  marginBottom: '24px',
  '& .MuiTable-root': {
    backgroundColor: 'transparent',
  },
  '& .MuiTableCell-root': {
    color: colors.text.primary,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  '& .MuiTableHead-root .MuiTableCell-root': {
    backgroundColor: 'rgba(28, 28, 45, 0.95)',
    fontWeight: 600,
  },
  '& .MuiTableBody-root .MuiTableRow-root:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  }
});

const _StyledTableCell = styled(TableCell)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  color: isDarkMode ? '#ffffff' : '#000000',
  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  '&.MuiTableCell-head': {
    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    fontWeight: 600,
  }
}));

const StyledTableRow = styled(TableRow)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  '&:hover': {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  },
  '& .MuiTableCell-root': {
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  }
}));

const StyledDialogContent = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
  color: isDarkMode ? '#ffffff' : '#000000',
  padding: '24px',
  borderRadius: '24px',
  backdropFilter: 'blur(20px)',
  boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  maxHeight: '90vh',
  overflowY: 'auto',
  margin: 0,
  '@media (max-width: 600px)': {
    padding: '16px',
    margin: 0,
    maxHeight: '95vh',
  },
  '& .MuiDialog-paper': {
    backgroundColor: 'transparent',
    boxShadow: 'none',
    margin: 0,
    borderRadius: '24px',
    border: 'none',
    outline: 'none'
  },
  '& .MuiBox-root': {
    borderRadius: '24px',
  },
  '& .MuiPaper-root': {
    borderRadius: '24px',
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
    backgroundColor: 'transparent'
  },
  '& .MuiDialogTitle-root': {
    color: isDarkMode ? '#ffffff' : '#000000',
    padding: '24px 24px 16px 24px',
    backgroundColor: 'transparent',
    borderRadius: '24px 24px 0 0',
    border: 'none',
    '@media (max-width: 600px)': {
      padding: '16px',
    },
    '& .MuiTypography-root': {
      fontSize: '1.5rem',
      fontWeight: 600,
      '@media (max-width: 600px)': {
        fontSize: '1.25rem',
      }
    }
  },
  '& .MuiDialogContent-root': {
    padding: '16px 24px',
    '@media (max-width: 600px)': {
      padding: '16px',
    },
    '& .MuiFormLabel-root': {
      color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    },
    '& .MuiInputBase-root': {
      backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      color: isDarkMode ? '#ffffff' : '#000000',
      '& fieldset': {
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
      '&:hover fieldset': {
        borderColor: isDarkMode ? 'rgba(255, 159, 67, 0.5)' : 'rgba(255, 159, 67, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: colors.accent.main,
      }
    },
    '& .MuiInputBase-input': {
      color: isDarkMode ? '#ffffff' : '#000000',
    },
    '& .MuiSelect-select': {
      color: isDarkMode ? '#ffffff' : '#000000',
    }
  },
  '& .MuiDialogActions-root': {
    padding: '16px 24px 24px 24px',
    backgroundColor: 'transparent',
    borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    '@media (max-width: 600px)': {
      padding: '16px',
    },
    '& .MuiButton-root': {
      borderRadius: '12px',
      padding: '8px 24px',
      textTransform: 'none',
      fontSize: '1rem',
      '@media (max-width: 600px)': {
        padding: '8px 16px',
        fontSize: '0.9rem',
      }
    }
  }
}));

const LoadingDialog = styled(Dialog)<{ isDarkMode: boolean }>(({ theme: _theme, isDarkMode }) => ({
  '& .MuiDialog-paper': {
    background: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
    padding: '24px',
    minWidth: '300px',
    boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  },
}));

const _LoadingText = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  color: isDarkMode ? '#ffffff' : '#000000',
  textAlign: 'center',
  marginBottom: '20px',
  fontSize: '1.1rem',
}));

const LoadingDots = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  gap: '8px',
  marginTop: '0',
  height: '24px',
  alignItems: 'center'
});

const Dot = styled(Box)<{ isDarkMode?: boolean }>(({ isDarkMode = true }) => ({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: isDarkMode ? '#ffffff' : '#000000',
  animation: 'bounce 1.4s infinite ease-in-out',
  '&:nth-of-type(1)': {
    animationDelay: '-0.32s',
  },
  '&:nth-of-type(2)': {
    animationDelay: '-0.16s',
  },
  '@keyframes bounce': {
    '0%, 80%, 100%': {
      transform: 'scale(0)',
    },
    '40%': {
      transform: 'scale(1)',
    },
  },
}));

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const AnimatedAlert = styled(motion.div)({
  width: '100%',
  marginBottom: '24px'
});

const alertVariants = {
  initial: { 
    opacity: 0,
    y: -20,
    scale: 0.95
  },
  animate: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

// Úplne nový vlastný tooltip bez závislosti na MUI Tooltip
interface BareTooltipProps {
  title: React.ReactNode;
  children: React.ReactElement;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  enterDelay?: number;
  leaveDelay?: number;
}

const BareTooltip: React.FC<BareTooltipProps> = ({ 
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

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    
    enterTimeoutRef.current = setTimeout(() => {
      if (childRef.current) {
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
        setIsVisible(true);
      }
    }, enterDelay);
  };

  const handleMouseLeave = () => {
    if (enterTimeoutRef.current) {
      clearTimeout(enterTimeoutRef.current);
      enterTimeoutRef.current = null;
    }
    
    leaveTimeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, leaveDelay);
  };

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
          }}
          onMouseEnter={handleMouseLeave}
        >
          {title}
        </div>,
        document.body
      )}
    </>
  );
};

const _TransparentTooltip = muiStyled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(() => ({
  '& .MuiTooltip-tooltip': {
    backgroundColor: 'transparent',
    color: 'inherit',
    boxShadow: 'none',
    border: 'none',
    padding: 0,
    margin: 0,
    minWidth: 0,
    minHeight: 0,
    borderRadius: 0,
    fontSize: '1rem',
  },
  '& .MuiTooltip-arrow': {
    color: 'transparent',
  },
}));

function Team() {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<DeleteableItem | null>(null);
  const [openInvite, setOpenInvite] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companyID, setCompanyID] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(true);
  const [editingInvite, setEditingInvite] = useState<Invitation | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+421');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('sk');
  const [role, setRole] = useState('user');
  const { userData: _userData } = useAuth();
  const [_deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const _theme = useTheme();
  const { isDarkMode } = useThemeMode();
  const [isResending, setIsResending] = useState(false);
  const [_resendingInvitationId, setResendingInvitationId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [_isInitializingLastLogin, setIsInitializingLastLogin] = useState(false);
  const isMobile = useMediaQuery('(max-width:600px)');

  const fetchData = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      setLoading(true);
      try {
        // Get company
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data();

          if (userData) {
            const currentCompanyID = userData.companyID || userData.companyId || "";
            setCompanyID(currentCompanyID);
            setIsAdmin(userData.role === 'admin');

            // Načítanie členov tímu
            const companyQuery = query(
              collection(db, 'users'),
              where('companyID', '==', currentCompanyID),
              where('role', 'in', ['admin', 'user', 'manager', 'driver', 'viewer']),
              orderBy('createdAt', 'desc')
            );

            const companySnap = await getDocs(companyQuery);
            const members: TeamMember[] = [];
            companySnap.forEach((doc) => {
              const memberData = doc.data();
              const processLastLogin = (lastLoginValue: any) => {
                if (!lastLoginValue) return null;
                if (lastLoginValue instanceof Timestamp) return lastLoginValue;
                if (typeof lastLoginValue === 'object' && 'seconds' in lastLoginValue) return new Timestamp(lastLoginValue.seconds, lastLoginValue.nanoseconds || 0);
                if (typeof lastLoginValue === 'string') return Timestamp.fromDate(new Date(lastLoginValue));
                if (lastLoginValue instanceof Date) return Timestamp.fromDate(lastLoginValue);
                return null;
              };
              const processedLastLogin = processLastLogin(memberData.lastLogin);
              const member = {
                id: doc.id,
                firstName: memberData.firstName || '',
                lastName: memberData.lastName || '',
                email: memberData.email || '',
                phone: memberData.phone || '',
                role: memberData.role || '',
                status: memberData.status || 'active',
                createdAt: memberData.createdAt instanceof Timestamp ? memberData.createdAt.toDate() : (memberData.createdAt ? new Date(memberData.createdAt) : new Date()),
                userId: memberData.userId || doc.id,
                lastLogin: processedLastLogin
              };
              members.push(member);
            });
            setTeamMembers(members);

            // Načítanie pozvánok
            const invitationsQuery = query(
              collection(db, 'invitations'),
              where('companyID', '==', currentCompanyID),
              where('status', '==', 'pending')
            );
            const invitationsSnap = await getDocs(invitationsQuery);
            const pendingInvitations: Invitation[] = [];
            invitationsSnap.forEach((doc) => {
              const invitationData = doc.data();
              const invitation: Invitation = {
                id: doc.id,
                firstName: invitationData.firstName || '',
                lastName: invitationData.lastName || '',
                email: invitationData.email || '',
                phone: invitationData.phone || '',
                role: invitationData.role || '',
                status: 'pending',
                createdAt: invitationData.createdAt instanceof Timestamp ? invitationData.createdAt.toDate() : (invitationData.createdAt ? new Date(invitationData.createdAt) : new Date()),
                userId: invitationData.userId
              };
              pendingInvitations.push(invitation);
            });
            setInvitations(pendingInvitations);
          }
        }
      } catch (error) {
        console.error('Error fetching team data:', error);
        setError('Nepodarilo sa načítať údaje o tíme.');
      } finally {
        setLoading(false);
      }
    } else {
      navigate('/login');
    }
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {
      fetchData();
    });
    return () => unsubscribe();
  }, [fetchData]);

  useEffect(() => {
    setIsEmailValid(validateEmail(email));
  }, [email]);

  const handleInvite = async () => {
    if (!isEmailValid) {
      setError('Prosím zadajte platný email');
      return;
    }
    if (!email || !role || !companyID || !firstName || !lastName || !phoneNumber) {
      setError('Prosím vyplňte všetky polia');
      return;
    }

    try {
      setIsCreating(true);
      setError('');
      setSuccess('');

      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Užívateľ nie je prihlásený');
      }

      const invitationRef = await addDoc(collection(db, 'invitations'), {
        email,
        firstName,
        lastName,
        phone: `${phonePrefix}${phoneNumber}`,
        role,
        companyID,
        createdAt: new Date(),
        status: 'pending'
      });

      const sendInvitationEmail = httpsCallable(functions, 'sendInvitationEmail');
      await sendInvitationEmail({
        email,
        firstName,
        lastName,
        phone: `${phonePrefix}${phoneNumber}`,
        role,
        companyId: companyID,
        invitationId: invitationRef.id
      });

      setSuccess('Pozvánka bola úspešne odoslaná.');
      fetchData();

      setTimeout(() => {
        setOpenInvite(false);
        setEmail('');
        setFirstName('');
        setLastName('');
        setPhoneNumber('');
        setRole('user');
        setIsCreating(false);
      }, 1000);

      setTimeout(() => {
        setSuccess('');
      }, 5000);

    } catch (err: any) {
      console.error('Chyba pri odosielaní pozvánky:', err);
      setError(err.message || 'Nastala chyba pri odosielaní pozvánky.');
      setIsCreating(false);
    }
  };

  const handleEdit = (member: TeamMember | Invitation) => {
    setEditingInvite(member as Invitation);
    setFirstName(member.firstName);
    setLastName(member.lastName);
    setEmail(member.email);
    // Extrahujeme predvoľbu a číslo
    const prefix = countries.find(c => member.phone.startsWith(c.prefix))?.prefix || '+421';
    setPhonePrefix(prefix);
    setCountryCode(countries.find(c => c.prefix === prefix)?.code || 'sk');
    setPhoneNumber(member.phone.replace(prefix, ''));
    setRole(member.role);
    setEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingInvite || !firstName || !lastName || !email || !phoneNumber || !role) {
      setError('Prosím vyplňte všetky polia');
      setTimeout(() => {
        setError('');
      }, 5000);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const fullPhoneNumber = `${phonePrefix}${phoneNumber}`;

      if (!editingInvite.userId) {
        await updateDoc(doc(db, 'invitations', editingInvite.id), {
          firstName,
          lastName,
          email,
          phone: fullPhoneNumber,
          role,
          updatedAt: new Date()
        });
      } else {
        await updateDoc(doc(db, 'users', editingInvite.userId), {
          firstName,
          lastName,
          email,
          phone: fullPhoneNumber,
          role,
          updatedAt: new Date()
        });
      }

      setSuccess('Záznam bol úspešne aktualizovaný.');
      fetchData();

      setEditOpen(false);
      setEditingInvite(null);
      setEmail('');
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setRole('user');

      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err: any) {
      console.error('Chyba pri aktualizácii záznamu:', err);
      setError(err.message || 'Nastala chyba pri aktualizácii záznamu.');
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (member: DeleteableItem) => {
    setDeleteItem(member);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteItem) return;

    try {
      setLoading(true);
      if ('userId' in deleteItem && deleteItem.userId) {
        console.log('Mazanie člena tímu s ID:', deleteItem.userId);
        setDeletingMemberId(deleteItem.id);
        await deleteDoc(doc(db, 'users', deleteItem.userId));
      } else {
        console.log('Mazanie pozvánky s ID:', deleteItem.id);
        const invitationRef = doc(db, 'invitations', deleteItem.id);
        await deleteDoc(invitationRef);
      }
      setSuccess('Záznam bol úspešne vymazaný.');
      fetchData();

      setDeleteOpen(false);
      setDeleteItem(null);

      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err: any) {
      console.error('Chyba pri mazaní záznamu:', err);
      setError(err.message || 'Nastala chyba pri mazaní záznamu.');
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setLoading(false);
      setDeletingMemberId(null);
    }
  };

  const handleCountryChange = (e: SelectChangeEvent) => {
    const value = e.target.value;
    const country = countries.find(c => c.code === value);
    if (country) {
      setCountryCode(value);
      setPhonePrefix(country.prefix);
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleResendInvitation = async (invitationId: string) => {
      try {
        setIsResending(true);
        setResendingInvitationId(invitationId);

        const invitationDoc = await getDoc(doc(db, 'invitations', invitationId));
        if (!invitationDoc.exists()) {
          throw new Error('Pozvánka nebola nájdená');
        }

        const invitationData = invitationDoc.data();
        const sendInvitationEmail = httpsCallable(functions, 'sendInvitationEmail');
        await sendInvitationEmail({
          email: invitationData.email,
          firstName: invitationData.firstName,
          lastName: invitationData.lastName,
          phone: invitationData.phone,
          role: invitationData.role,
          companyId: companyID,
          invitationId: invitationId
        });

        await updateDoc(doc(db, 'invitations', invitationId), {
          lastSentAt: new Date() // Používame priamo Date objekt
        });

        // fetch data to update the UI immediately
        fetchData();

        setNotification({
          open: true,
          message: 'Pozvánka bola úspešne preposlaná',
          severity: 'success'
        });
      } catch (error) {
        console.error('Chyba pri preposielaní pozvánky:', error);
        setNotification({
          open: true,
          message: 'Nepodarilo sa preposlať pozvánku',
          severity: 'error'
        });
      } finally {
        setTimeout(() => {
          setIsResending(false);
          setResendingInvitationId(null);
        }, 1000);
      }
    };

  const _handleInitializeLastLogin = async () => {
    try {
      setIsInitializingLastLogin(true);
      const initializeLastLoginFn = httpsCallable(functions, 'initializeLastLogin');
      const result = await initializeLastLoginFn();
      const data = result.data as { success: boolean, message: string };
      
      if (data.success) {
        setNotification({
          open: true,
          message: data.message,
          severity: 'success'
        });
        // After successful initialization, refetch data to show updated last login times
        fetchData(); 
      }
    } catch (error: any) {
      console.error('Chyba pri inicializácii lastLogin:', error);
      setNotification({
        open: true,
        message: 'Nastala chyba pri inicializácii posledného prihlásenia',
        severity: 'error'
      });
    } finally {
      setIsInitializingLastLogin(false);
    }
  };

  const renderMobileTeamMember = (member: TeamMember | Invitation) => (
    <MobileTeamCard isDarkMode={isDarkMode} key={member.id}>
      <MobileTeamHeader isDarkMode={isDarkMode}>
        <Box>
          <MobileTeamName isDarkMode={isDarkMode}>
            {member.firstName} {member.lastName}
          </MobileTeamName>
          <MobileTeamRole isDarkMode={isDarkMode}>
            {member.role}
          </MobileTeamRole>
        </Box>
        <Box>
          <Chip
            label={member.status === 'pending' ? 'Čaká sa na prijatie' : 'Aktívny'}
            color={member.status === 'pending' ? 'warning' : 'success'}
            size="small"
            sx={{ fontSize: '0.75rem' }}
          />
        </Box>
      </MobileTeamHeader>
      
      <MobileTeamInfo isDarkMode={isDarkMode}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MailIcon />
          <Typography variant="body2">{member.email}</Typography>
        </Box>
        
        {member.phone && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon />
            <Typography variant="body2">{member.phone}</Typography>
          </Box>
        )}

        {'lastLogin' in member && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon />
            <Typography variant="body2">
              {member.lastLogin ? format(member.lastLogin.toDate(), 'dd.MM.yyyy HH:mm') : 'Nikdy'}
            </Typography>
          </Box>
        )}
      </MobileTeamInfo>
      
      <MobileTeamActions>
        {member.status === 'pending' && 'id' in member && (
          <>
            <IconButton
              size="small"
              onClick={() => handleResendInvitation(member.id)}
              sx={{ 
                color: colors.accent.main,
                '&:hover': {
                  backgroundColor: 'rgba(255, 159, 67, 0.1)'
                }
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleEdit(member)}
              sx={{ 
                color: colors.accent.main,
                '&:hover': {
                  backgroundColor: 'rgba(255, 159, 67, 0.1)'
                }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </>
        )}
        <IconButton
          size="small"
          onClick={() => handleDeleteClick(member)}
          sx={{ 
            color: colors.secondary.main,
            '&:hover': {
              backgroundColor: 'rgba(255, 107, 107, 0.1)'
            }
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </MobileTeamActions>
    </MobileTeamCard>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress sx={{ color: '#ff9f43' }} />
        </Box>
      </Container>
    );
  }

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle isDarkMode={isDarkMode}>Tím</PageTitle>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {isAdmin && (
            <Button
              variant="contained"
              onClick={() => setOpenInvite(true)}
              startIcon={<AddIcon />}
              sx={{
                backgroundColor: colors.accent.main,
                '&:hover': {
                  backgroundColor: colors.accent.dark,
                },
              }}
            >
              Pozvať člena
            </Button>
          )}
        </Box>
      </PageHeader>

      <AnimatePresence mode="sync">
        {error && (
          <AnimatedAlert
            initial="initial"
            animate="animate"
            exit="exit"
            variants={alertVariants}
          >
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </AnimatedAlert>
        )}

        {success && (
          <AnimatedAlert
            initial="initial"
            animate="animate"
            exit="exit"
            variants={alertVariants}
          >
            <Alert severity="success" onClose={() => setSuccess('')}>
              {success}
            </Alert>
          </AnimatedAlert>
        )}
      </AnimatePresence>

      {isMobile ? (
        <Box>
          {teamMembers.map(member => renderMobileTeamMember(member))}
          <Typography 
            variant="h6" 
            sx={{ 
              mt: 4,
              mb: 2,
              fontSize: '1.75rem',
              fontWeight: 700,
              color: isDarkMode ? '#ffffff' : '#000000',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '-8px',
                left: 0,
                width: '60px',
                height: '4px',
                backgroundColor: colors.accent.main,
                borderRadius: '2px',
              },
              '@media (max-width: 600px)': {
                fontSize: '1.5rem'
              }
            }}
          >
            Čakajúce pozvánky
          </Typography>
          {invitations.map(invite => renderMobileTeamMember(invite))}
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{
            backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
            borderRadius: '20px',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
            marginBottom: '24px'
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Meno</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Telefón</TableCell>
                  <TableCell>Rola</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Posledné prihlásenie</TableCell>
                  {isAdmin && <TableCell>Akcie</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence mode="sync">
                  {teamMembers.map((member) => (
                    <StyledTableRow isDarkMode={isDarkMode} key={member.id}>
                      <TableCell>{member.firstName} {member.lastName}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>
                        <Chip
                          label={member.role}
                          color={member.role === 'admin' ? 'primary' : 'default'} 
                          size="small"
                          sx={{
                            backgroundColor: member.role === 'admin' ? colors.accent.main : 'rgba(255, 255, 255, 0.1)',
                            color: '#ffffff',
                            '& .MuiChip-label': {
                              fontSize: {
                                xs: '0.7rem',
                                sm: '0.8rem'
                              }
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.status}
                          color={member.status === 'active' ? 'success' : 'warning'}
                          size="small"
                          sx={{
                            backgroundColor: member.status === 'active' ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 159, 67, 0.15)',
                            color: member.status === 'active' ? '#2ed573' : colors.accent.main,
                            '& .MuiChip-label': {
                              fontSize: {
                                xs: '0.7rem',
                                sm: '0.8rem'
                              }
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <BareTooltip 
                          title={`Presný čas: ${member.lastLogin?.toDate().toLocaleString('sk-SK', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric', 
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}`}
                          placement="top"
                        >
                          <span>
                            {formatDistanceToNow(member.lastLogin?.toDate() || new Date(), { 
                              addSuffix: true,
                              locale: sk 
                            })}
                          </span>
                        </BareTooltip>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              onClick={() => handleEdit(member)}
                              sx={{ 
                                color: colors.accent.main,
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 159, 67, 0.1)'
                                }
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              onClick={() => handleDeleteClick(member)}
                              sx={{ 
                                color: colors.secondary.main,
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 107, 107, 0.1)'
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      )}
                    </StyledTableRow>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography 
            variant="h6" 
            sx={{ 
              mt: 4,
              mb: 2,
              fontSize: '1.75rem',
              fontWeight: 700,
              color: isDarkMode ? '#ffffff' : '#000000',
              position: 'relative',
              '&::after': {
                content: '""',
                position: 'absolute',
                bottom: '-8px',
                left: 0,
                width: '60px',
                height: '4px',
                backgroundColor: colors.accent.main,
                borderRadius: '2px',
              },
              '@media (max-width: 600px)': {
                fontSize: '1.5rem'
              }
            }}
          >
            Čakajúce pozvánky
          </Typography>
          <TableContainer component={Paper} sx={{
            backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
            borderRadius: '20px',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Meno</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Telefón</TableCell>
                  <TableCell>Rola</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Posledné prihlásenie</TableCell>
                  <TableCell>Akcie</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invitations.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.firstName} {invite.lastName}</TableCell>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>{invite.phone}</TableCell>
                    <TableCell>
                      <Chip
                        label={invite.role}
                        color={invite.role === 'admin' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label="Čaká sa na prijatie"
                        color="warning"
                      />
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleResendInvitation(invite.id)}
                        sx={{ 
                          color: colors.accent.main,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 159, 67, 0.1)'
                          }
                        }}
                      >
                        <RefreshIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleEdit(invite)}
                        sx={{ 
                          color: colors.accent.main,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 159, 67, 0.1)'
                          }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDeleteClick(invite)}
                        sx={{ 
                          color: colors.secondary.main,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 107, 107, 0.1)'
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Dialóg pre pozvanie nového člena */}
      <Dialog
        open={openInvite}
        onClose={() => setOpenInvite(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'none',
            boxShadow: 'none',
            margin: {
              xs: '8px',
              sm: '16px'
            }
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)'
          }
        }}
      >
        <StyledDialogContent isDarkMode={isDarkMode}>
          <DialogTitle>Pridať nového člena tímu</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Meno"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Priezvisko"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Krajina</InputLabel>
                  <Select
                    value={countryCode}
                    onChange={handleCountryChange}
                    label="Krajina"
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      color: isDarkMode ? '#ffffff' : '#000000',
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                          '& .MuiMenuItem-root': {
                            color: isDarkMode ? '#ffffff' : '#000000',
                            '&:hover': {
                              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                            }
                          }
                        }
                      }
                    }}
                  >
                    {countries.map((country) => (
                      <MenuItem key={country.code} value={country.code}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <img
                            loading="lazy"
                            width="20"
                            src={`https://flagcdn.com/${country.code}.svg`}
                            alt={country.name}
                          />
                          <span>{country.name}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Telefón"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ mr: 1, color: isDarkMode ? '#ffffff' : '#000000' }}>
                        {phonePrefix}
                      </Box>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Rola</InputLabel>
                  <Select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    label="Rola"
                    required
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      color: isDarkMode ? '#ffffff' : '#000000',
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                          boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
                          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                          '& .MuiMenuItem-root': {
                            color: isDarkMode ? '#ffffff' : '#000000',
                            '&:hover': {
                              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                            },
                            '&.Mui-selected': {
                              backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.15)' : 'rgba(255, 159, 67, 0.1)',
                              '&:hover': {
                                backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.25)' : 'rgba(255, 159, 67, 0.2)'
                              }
                            }
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="manager">Manažér</MenuItem>
                    <MenuItem value="driver">Vodič</MenuItem>
                    <MenuItem value="user">Používateľ</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenInvite(false)} 
              sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'
                }
              }}
            >
              Zrušiť
            </Button>
            <Button 
              onClick={handleInvite}
              variant="contained"
              disabled={isCreating || !isEmailValid}
              sx={{
                backgroundColor: colors.accent.main,
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: colors.accent.light,
                },
                '&:disabled': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                }
              }}
            >
              {isCreating ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} sx={{ 
                    color: isDarkMode ? '#ffffff' : colors.accent.main,
                    opacity: 0.7 
                  }} />
                  <Typography variant="body2">Pozývam...</Typography>
                </Box>
              ) : 'Pozvať'}
            </Button>
          </DialogActions>
        </StyledDialogContent>
      </Dialog>

      {/* Dialóg pre úpravu */}
      <Dialog
        open={editOpen}
        onClose={() => setEditOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'none',
            boxShadow: 'none',
            margin: {
              xs: '8px',
              sm: '16px'
            }
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)'
          }
        }}
      >
        <StyledDialogContent isDarkMode={isDarkMode}>
          <DialogTitle>Upraviť údaje člena tímu</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Meno"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Priezvisko"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Krajina</InputLabel>
                  <Select
                    value={countryCode}
                    onChange={handleCountryChange}
                    label="Krajina"
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      color: isDarkMode ? '#ffffff' : '#000000',
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                          '& .MuiMenuItem-root': {
                            color: isDarkMode ? '#ffffff' : '#000000',
                            '&:hover': {
                              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                            }
                          }
                        }
                      }
                    }}
                  >
                    {countries.map((country) => (
                      <MenuItem key={country.code} value={country.code}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <img
                            loading="lazy"
                            width="20"
                            src={`https://flagcdn.com/${country.code}.svg`}
                            alt={country.name}
                          />
                          <span>{country.name}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Telefón"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ mr: 1, color: isDarkMode ? '#ffffff' : '#000000' }}>
                        {phonePrefix}
                      </Box>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Rola</InputLabel>
                  <Select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    label="Rola"
                    required
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      color: isDarkMode ? '#ffffff' : '#000000',
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                          boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
                          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                          '& .MuiMenuItem-root': {
                            color: isDarkMode ? '#ffffff' : '#000000',
                            '&:hover': {
                              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                            },
                            '&.Mui-selected': {
                              backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.15)' : 'rgba(255, 159, 67, 0.1)',
                              '&:hover': {
                                backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.25)' : 'rgba(255, 159, 67, 0.2)'
                              }
                            }
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="manager">Manažér</MenuItem>
                    <MenuItem value="driver">Vodič</MenuItem>
                    <MenuItem value="user">Používateľ</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setEditOpen(false)} 
              sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'
                }
              }}
            >
              Zrušiť
            </Button>
            <Button 
              onClick={handleUpdate}
              variant="contained"
              sx={{
                backgroundColor: colors.accent.main,
                color: '#ffffff',
                fontWeight: 600,
                padding: '8px 24px',
                minWidth: '150px',
                '&:hover': {
                  backgroundColor: colors.accent.light,
                },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(255, 159, 67, 0.3)',
                  color: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            >
              {loading ? (
                <LoadingDots>
                  <Dot isDarkMode={true} />
                  <Dot isDarkMode={true} />
                  <Dot isDarkMode={true} />
                </LoadingDots>
              ) : 'Uložiť zmeny'}
            </Button>
          </DialogActions>
        </StyledDialogContent>
      </Dialog>

      {/* Dialóg pre potvrdenie vymazania */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        PaperProps={{
          sx: {
            background: 'none',
            boxShadow: 'none',
            margin: {
              xs: '8px',
              sm: '16px'
            }
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)'
          }
        }}
      >
        <StyledDialogContent isDarkMode={isDarkMode}>
          <DialogTitle>Potvrdiť vymazanie</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Ste si istý, že chcete {deleteItem ? 'vymazať člena z tímu' : 'zrušiť pozvánku pre'} {deleteItem?.firstName} {deleteItem?.lastName}? Táto akcia je nezvratná.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteOpen(false)} aria-label="Zrušiť akciu">
              Zrušiť
            </Button>
            <Button 
              onClick={handleDeleteConfirm} 
              color="error" 
              variant="contained" 
              disabled={loading}
              aria-label={deleteItem && 'userId' in deleteItem ? 'Vymazať člena z tímu' : 'Zrušiť pozvánku'}
            >
              {loading ? (
                <LoadingDots>
                  <Dot isDarkMode={true} />
                  <Dot isDarkMode={true} />
                  <Dot isDarkMode={true} />
                </LoadingDots>
              ) : `${deleteItem && 'userId' in deleteItem ? 'Vymazať člena z tímu' : 'Zrušiť pozvánku'}`}
            </Button>
          </DialogActions>
        </StyledDialogContent>
      </Dialog>

      <LoadingDialog
        open={isResending || isCreating}
        onClose={() => {}}
        isDarkMode={isDarkMode}
        PaperProps={{
          sx: {
            background: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '24px',
            minWidth: '300px',
            boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={40} sx={{ 
              color: colors.accent.main
            }} />
            <Typography variant="body1" sx={{ 
              color: isDarkMode ? '#ffffff' : '#000000',
              textAlign: 'center'
            }}>
              {isCreating ? 'Vytváranie pozvánky...' : 'Preposielanie pozvánky...'}
            </Typography>
          </Box>
        </DialogContent>
      </LoadingDialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </PageWrapper>
  );
}

export default Team; 