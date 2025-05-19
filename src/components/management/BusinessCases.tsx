import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Chip,
  styled,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  Collapse,
  TablePagination,
  SelectChangeEvent
} from '@mui/material';
import { createPortal } from 'react-dom';
import { useThemeMode } from '../../contexts/ThemeContext';
import { DateTimePicker, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { sk } from 'date-fns/locale';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, Timestamp, getDoc, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import 'react-phone-input-2/lib/material.css';
import SearchField from '../common/SearchField';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next'; // Pridaný import pre preklady

const euCountries = [
  { code: 'SK', name: 'Slovensko', flag: '🇸🇰', prefix: '+421' },
  { code: 'CZ', name: 'Česko', flag: '🇨🇿', prefix: '+420' },
  { code: 'HU', name: 'Maďarsko', flag: '🇭🇺', prefix: '+36' },
  { code: 'PL', name: 'Poľsko', flag: '🇵🇱', prefix: '+48' },
  { code: 'AT', name: 'Rakúsko', flag: '🇦🇹', prefix: '+43' },
  { code: 'DE', name: 'Nemecko', flag: '🇩🇪', prefix: '+49' },
  { code: 'FR', name: 'Francúzsko', flag: '🇫🇷', prefix: '+33' },
  { code: 'IT', name: 'Taliansko', flag: '🇮🇹', prefix: '+39' },
  { code: 'ES', name: 'Španielsko', flag: '🇪🇸', prefix: '+34' },
  { code: 'PT', name: 'Portugalsko', flag: '🇵🇹', prefix: '+351' },
  { code: 'NL', name: 'Holandsko', flag: '🇳🇱', prefix: '+31' },
  { code: 'BE', name: 'Belgicko', flag: '🇧🇪', prefix: '+32' },
  { code: 'DK', name: 'Dánsko', flag: '🇩🇰', prefix: '+45' },
  { code: 'SE', name: 'Švédsko', flag: '🇸🇪', prefix: '+46' },
  { code: 'FI', name: 'Fínsko', flag: '🇫🇮', prefix: '+358' },
  { code: 'IE', name: 'Írsko', flag: '🇮🇪', prefix: '+353' },
  { code: 'GR', name: 'Grécko', flag: '🇬🇷', prefix: '+30' },
  { code: 'RO', name: 'Rumunsko', flag: '🇷🇴', prefix: '+40' },
  { code: 'BG', name: 'Bulharsko', flag: '🇧🇬', prefix: '+359' },
  { code: 'HR', name: 'Chorvátsko', flag: '🇭🇷', prefix: '+385' },
  { code: 'SI', name: 'Slovinsko', flag: '🇸🇮', prefix: '+386' },
  { code: 'EE', name: 'Estónsko', flag: '🇪🇪', prefix: '+372' },
  { code: 'LV', name: 'Lotyšsko', flag: '🇱🇻', prefix: '+371' },
  { code: 'LT', name: 'Litva', flag: '🇱🇹', prefix: '+370' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', prefix: '+357' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', prefix: '+356' },
  { code: 'LU', name: 'Luxembursko', flag: '🇱🇺', prefix: '+352' },
  { code: 'GB', name: 'Veľká Británia', flag: '🇬🇧', prefix: '+44' },
  { code: 'CH', name: 'Švajčiarsko', flag: '🇨🇭', prefix: '+41' },
  { code: 'NO', name: 'Nórsko', flag: '🇳🇴', prefix: '+47' },
  { code: 'UA', name: 'Ukrajina', flag: '🇺🇦', prefix: '+380' },
  { code: 'RS', name: 'Srbsko', flag: '🇷🇸', prefix: '+381' },
  { code: 'TR', name: 'Turecko', flag: '🇹🇷', prefix: '+90' }
];

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

// Typ pre status možnosti
type CaseStatusKey = 'CALLED' | 'NOT_CALLED' | 'EMAIL_SENT' | 'IN_PROGRESS' | 'CALL_LATER' | 'MEETING' | 'CALL' | 'INTERESTED' | 'NOT_INTERESTED';

interface BusinessCase {
  id?: string;
  companyName: string;
  vatNumber: string;
  companyAddress: string;
  contactPerson: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  internalNote: string;
  status: CaseStatusKey;
  reminderDateTime: Date | null;
  reminderNote: string;
  createdAt: Timestamp;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  countryCode?: string;
  phases?: Phase[];
}

interface Phase {
  id: string;
  name: string;
  createdAt: Date;
  translationKey?: string;
}

const MobileBusinessCard = styled(Box)<{ isDarkMode: boolean }>(({ theme, isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.75)' : '#ffffff',
  borderRadius: '16px !important',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'} !important`,
  boxShadow: `${isDarkMode 
    ? '0 4px 12px rgba(0, 0, 0, 0.15)'
    : '0 4px 12px rgba(0, 0, 0, 0.1)'} !important`,
  transition: 'all 0.2s ease-in-out',
  overflow: 'hidden',
  position: 'relative',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  color: isDarkMode ? '#ffffff' : '#000000',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    backgroundColor: '#ff9f43'
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(255, 159, 67, 0.3) !important',
    border: '1px solid rgba(255, 159, 67, 0.3) !important',
  }
}));

const MobileCardHeader = styled(Box)<{ isDarkMode: boolean }>(({ theme, isDarkMode }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  color: isDarkMode ? '#ffffff' : '#000000',
  width: '100%',
}));

const MobileCompanyName = styled(Typography)<{ isDarkMode: boolean }>(({ _theme, isDarkMode }) => ({
  fontWeight: 600,
  color: isDarkMode ? '#ffffff' : '#000000',
  fontSize: '1.1rem',
}));

const MobileCardContent = styled(Box)<{ isDarkMode: boolean }>(({ theme, isDarkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  color: isDarkMode ? '#ffffff' : '#000000',
  width: '100%',
}));

const MobileInfoRow = styled(Box)<{ isDarkMode: boolean }>(({ _theme, isDarkMode }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: isDarkMode ? '#ffffff' : '#000000',
  width: '100%',
  '& .MuiSvgIcon-root': {
    color: isDarkMode ? '#ffffff' : '#000000',
    fontSize: '1.1rem',
  }
}));

const MobileCardActions = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '8px',
  paddingTop: '12px',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
});

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

const AddButton = styled(Button)({
  marginBottom: '24px',
  '&:hover': {
    backgroundColor: 'rgba(255, 159, 67, 0.1)'
  }
});

const SearchWrapper = styled(Box)({
  marginBottom: '24px',
  position: 'relative',
  zIndex: 1,
  maxWidth: '100%',
  width: '100%'
});

const convertToDate = (dateTime: Date | Timestamp | null): Date | null => {
  if (!dateTime) return null;
  if (dateTime instanceof Date) return dateTime;
  if (dateTime instanceof Timestamp) return dateTime.toDate();
  return new Date(dateTime);
};

const StyledTableCell = styled(TableCell)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
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
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  color: isDarkMode ? '#ffffff' : '#000000',
  padding: '24px',
  borderRadius: '20px',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  backdropFilter: 'blur(20px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  maxHeight: '90vh',
  overflowY: 'auto',
  margin: '16px',
  '@media (max-width: 600px)': {
    padding: '16px',
    margin: '8px',
    maxHeight: '95vh',
  },
  '& .MuiDialog-paper': {
    backgroundColor: 'transparent',
    boxShadow: 'none',
    margin: 0,
  },
  '& .MuiDialogTitle-root': {
    color: isDarkMode ? '#ffffff' : '#000000',
    padding: '24px 24px 16px 24px',
    backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
    borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
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
    backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
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

const phaseColors = ['#ff9f43', '#ff6b6b', '#2196f3', '#4caf50'];

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

export default function BusinessCases() {
  const [cases, setCases] = useState<BusinessCase[]>([]);
  const [open, setOpen] = useState(false);
  const [editCase, setEditCase] = useState<BusinessCase | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<string | null>(null);
  const { currentUser, userData } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [formData, setFormData] = useState({
    companyName: '', vatNumber: '', companyAddress: '',
    contactPerson: { firstName: '', lastName: '', phone: '', email: '' },
    internalNote: '', status: 'NOT_CALLED' as CaseStatusKey,
    reminderDateTime: null as Date | null, reminderNote: '',
  });
  const [selectedCountry, setSelectedCountry] = useState(euCountries[0]);
  const { isDarkMode } = useThemeMode();
  const [loading, setLoading] = useState(false);
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false);
  const [, setPhases] = useState<Phase[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const { t } = useTranslation(); // Hook pre preklady

  // Definícia stavov obchodného prípadu - zabalená do useMemo
  const caseStatuses = useMemo(() => ({
    NOT_CALLED: { label: t('business.status.notCalled'), color: 'default' as const },
    CALLED: { label: t('business.status.called'), color: 'primary' as const },
    EMAIL_SENT: { label: t('business.status.emailSent'), color: 'default' as const },
    IN_PROGRESS: { label: t('business.status.inProgress'), color: 'primary' as const },
    CALL_LATER: { label: t('business.status.callLater'), color: 'warning' as const },
    MEETING: { label: t('business.status.meeting'), color: 'info' as const },
    CALL: { label: t('business.status.call'), color: 'info' as const },
    INTERESTED: { label: t('business.status.interested'), color: 'success' as const },
    NOT_INTERESTED: { label: t('business.status.notInterested'), color: 'error' as const }
  }), [t]);

  const fetchCases = useCallback(async () => {
    try {
      if (!userData?.companyID) { console.log('Chýbajúce companyID'); return; }
      setLoading(true);
      const casesCollection = collection(db, 'businessCases');
      let q = query(casesCollection, where('companyID', '==', userData.companyID));
      // Apply date filters
      if (filterStartDate) { q = query(q, where('createdAt', '>=', Timestamp.fromDate(new Date(filterStartDate.setHours(0, 0, 0, 0))))); }
      if (filterEndDate) { q = query(q, where('createdAt', '<=', Timestamp.fromDate(new Date(filterEndDate.setHours(23, 59, 59, 999))))); }
      q = query(q, orderBy('createdAt', 'desc'));
      
      const snapshot = await getDocs(q);
      const casesData: BusinessCase[] = snapshot.docs.map(doc => {
        const data = doc.data();
        
        // Convert phase timestamps correctly
        const phasesWithDates: Phase[] = (data.phases || []).map((phase: any): Phase => {
            let createdAtDate: Date;
            if (phase.createdAt instanceof Timestamp) { createdAtDate = phase.createdAt.toDate(); }
            else if (phase.createdAt) { try { const d = new Date(phase.createdAt.seconds ? phase.createdAt.seconds * 1000 : phase.createdAt); createdAtDate = !isNaN(d.getTime()) ? d : new Date(); } catch { createdAtDate = new Date(); } }
            else { createdAtDate = new Date(); }
            return { id: phase.id || crypto.randomUUID(), name: phase.name || 'Neznáma fáza', createdAt: createdAtDate };
        });

        const createdAtTimestamp = data.createdAt instanceof Timestamp ? data.createdAt : (data.createdAt ? Timestamp.fromDate(new Date(data.createdAt)) : Timestamp.now());

        // Return a full BusinessCase object
        return {
            id: doc.id,
            companyName: data.companyName || '',
            vatNumber: data.vatNumber || '',
            companyAddress: data.companyAddress || '',
            contactPerson: {
                firstName: data.contactPerson?.firstName || '',
                lastName: data.contactPerson?.lastName || '',
                phone: data.contactPerson?.phone || '',
                email: data.contactPerson?.email || ''
            },
            internalNote: data.internalNote || '',
            status: data.status || 'NOT_CALLED',
            reminderDateTime: convertToDate(data.reminderDateTime),
            reminderNote: data.reminderNote || '',
            createdAt: createdAtTimestamp,
            createdBy: {
                firstName: data.createdBy?.firstName || '',
                lastName: data.createdBy?.lastName || ''
            },
            countryCode: data.countryCode,
            companyID: data.companyID,
            phases: phasesWithDates
        } as BusinessCase; // Assert as BusinessCase
      }); 
      
      setCases(casesData);
    } catch (error) { console.error('Error fetching cases:', error); setSnackbar({ open: true, message: 'Chyba pri načítaní prípadov', severity: 'error' }); }
    finally { setLoading(false); }
  }, [userData?.companyID, filterStartDate, filterEndDate]);

  const getFilteredCases = useCallback(() => {
    return cases.filter(c => 
      c.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${c.contactPerson.firstName} ${c.contactPerson.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.internalNote?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [cases, searchTerm]);

  const handleRowClick = useCallback((id: string) => {
    setExpandedCaseId(prevId => (prevId === id ? null : id));
  }, []);

  const handleCountryChange = useCallback((event: SelectChangeEvent<string>) => {
    const country = euCountries.find(c => c.code === event.target.value);
    if (country) {
      setSelectedCountry(country);
      setFormData(prev => {
        let phone = prev.contactPerson.phone;
        const oldPrefix = euCountries.find(c => phone.startsWith(c.prefix))?.prefix;
        if (!phone || (oldPrefix && phone === oldPrefix)) {
          phone = country.prefix;
        }
        return { ...prev, contactPerson: { ...prev.contactPerson, phone } };
      });
    }
  }, []);

  const handleEdit = useCallback((businessCase: BusinessCase) => {
    setEditCase(businessCase);
    setFormData({
      companyName: businessCase.companyName,
      vatNumber: businessCase.vatNumber,
      companyAddress: businessCase.companyAddress,
      contactPerson: businessCase.contactPerson,
      internalNote: businessCase.internalNote,
      status: businessCase.status,
      reminderDateTime: businessCase.reminderDateTime,
      reminderNote: businessCase.reminderNote,
    });
    const country = euCountries.find(c => c.code === businessCase.countryCode) || euCountries[0];
    setSelectedCountry(country);
    setOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setCaseToDelete(id);
    setDeleteDialogOpen(true);
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      if (!currentUser || !userData) {
        setSnackbar({ open: true, message: 'Nie ste prihlásený', severity: 'error' }); return;
      }
      const isEditing = !!editCase?.id;
      const businessCaseData = {
        companyName: formData.companyName,
        vatNumber: formData.vatNumber,
        companyAddress: formData.companyAddress,
        contactPerson: formData.contactPerson,
        internalNote: formData.internalNote,
        status: formData.status,
        reminderDateTime: formData.reminderDateTime ? Timestamp.fromDate(formData.reminderDateTime) : null,
        reminderNote: formData.reminderNote,
        countryCode: selectedCountry.code,
        companyID: userData.companyID,
        ...(isEditing ? {} : { 
          createdAt: Timestamp.now(),
          createdBy: { firstName: userData.firstName || '', lastName: userData.lastName || '' }
        }),
        ...(isEditing ? { lastModifiedAt: Timestamp.now() } : {})
      };

      if (isEditing) {
        await updateDoc(doc(db, 'businessCases', editCase.id!), businessCaseData);
        setSnackbar({ open: true, message: 'Prípad bol úspešne upravený', severity: 'success' });
      } else {
        const docRef = await addDoc(collection(db, 'businessCases'), businessCaseData);
        setSnackbar({ open: true, message: 'Prípad bol úspešne vytvorený', severity: 'success' });
        if (formData.reminderDateTime) {
          const reminderData = {
            userId: currentUser.uid, userEmail: currentUser.email, businessCaseId: docRef.id,
            reminderDateTime: Timestamp.fromDate(formData.reminderDateTime), companyName: formData.companyName,
            reminderNote: formData.reminderNote || '', contactPerson: formData.contactPerson, createdAt: Timestamp.now(),
            createdBy: { firstName: userData.firstName || '', lastName: userData.lastName || '' }, sent: false
          };
          await addDoc(collection(db, 'reminders'), reminderData);
        }
      }
      if (isEditing && formData.reminderDateTime) {
        const reminderData = {
          userId: currentUser.uid, userEmail: currentUser.email, businessCaseId: editCase.id!,
          reminderDateTime: Timestamp.fromDate(formData.reminderDateTime), companyName: formData.companyName,
          reminderNote: formData.reminderNote || '', contactPerson: formData.contactPerson, createdAt: Timestamp.now(),
          createdBy: { firstName: userData.firstName || '', lastName: userData.lastName || '' }, sent: false
        };
        await addDoc(collection(db, 'reminders'), reminderData);
      }
      
      setOpen(false); setEditCase(null);
      setFormData({ 
        companyName: '', vatNumber: '', companyAddress: '',
        contactPerson: { firstName: '', lastName: '', phone: '', email: '' },
        internalNote: '', status: 'NOT_CALLED', reminderDateTime: null, reminderNote: '' 
      });
      fetchCases();
    } catch (error) {
      console.error('Error saving business case:', error);
      setSnackbar({ open: true, message: 'Nastala chyba pri ukladaní', severity: 'error' });
    }
  }, [currentUser, userData, formData, editCase, selectedCountry, fetchCases]);

  const confirmDelete = useCallback(async () => {
    if (!caseToDelete) return;
    try {
      await deleteDoc(doc(db, 'businessCases', caseToDelete));
      setSnackbar({ open: true, message: 'Prípad bol úspešne vymazaný', severity: 'success' });
      fetchCases();
    } catch (error) {
      console.error('Error deleting case:', error);
      setSnackbar({ open: true, message: 'Nastala chyba pri mazaní', severity: 'error' });
    } finally {
      setDeleteDialogOpen(false);
      setCaseToDelete(null);
    }
  }, [caseToDelete, fetchCases]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const renderMobileCase = useCallback((businessCase: BusinessCase) => (
    <MobileBusinessCard key={businessCase.id} isDarkMode={isDarkMode}>
      <MobileCardHeader isDarkMode={isDarkMode}>
        <MobileCompanyName isDarkMode={isDarkMode}>
          {businessCase.companyName}
        </MobileCompanyName>
        <Chip
          label={caseStatuses[businessCase.status].label}
          color={caseStatuses[businessCase.status].color}
          size="small"
          sx={{
            height: '24px',
            fontSize: '0.8rem'
          }}
        />
      </MobileCardHeader>
      <MobileCardContent isDarkMode={isDarkMode}>
        <MobileInfoRow isDarkMode={isDarkMode}>
          <AccessTimeIcon />
          {businessCase.createdAt instanceof Timestamp ? 
            businessCase.createdAt.toDate().toLocaleString('sk-SK', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }).replace(',', '') : 
            new Date(businessCase.createdAt).toLocaleString('sk-SK', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }).replace(',', '')}
        </MobileInfoRow>
        <MobileInfoRow isDarkMode={isDarkMode}>
          <BusinessIcon />
          {businessCase.vatNumber}
        </MobileInfoRow>
        <MobileInfoRow isDarkMode={isDarkMode}>
          <BusinessIcon />
          {businessCase.companyAddress}
        </MobileInfoRow>
        <MobileInfoRow isDarkMode={isDarkMode}>
          <PersonIcon />
          {`${businessCase.contactPerson.firstName} ${businessCase.contactPerson.lastName}`}
        </MobileInfoRow>
        <MobileInfoRow isDarkMode={isDarkMode}>
          <PhoneIcon />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <img
              loading="lazy"
              width="16"
              src={`https://flagcdn.com/${businessCase.countryCode?.toLowerCase()}.svg`}
              alt=""
            />
            {businessCase.contactPerson.phone}
          </Box>
        </MobileInfoRow>
        <MobileInfoRow isDarkMode={isDarkMode}>
          <EmailIcon />
          {businessCase.contactPerson.email}
        </MobileInfoRow>
        <MobileInfoRow isDarkMode={isDarkMode}>
          <PersonIcon />
          {t('business.createdBy')}: {businessCase.createdBy?.firstName} {businessCase.createdBy?.lastName}
        </MobileInfoRow>
        {businessCase.reminderDateTime && (
          <MobileInfoRow isDarkMode={isDarkMode}>
            <AccessTimeIcon />
            {t('business.reminder')}: {format(businessCase.reminderDateTime, 'dd.MM.yyyy HH:mm')}
          </MobileInfoRow>
        )}
        {businessCase.internalNote && (
          <MobileInfoRow isDarkMode={isDarkMode} sx={{ 
            flexDirection: 'column', 
            alignItems: 'flex-start',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '8px',
            borderRadius: '8px'
          }}>
            <Typography sx={{ 
              fontSize: '0.8rem', 
              color: colors.accent.main,
              marginBottom: '4px'
            }}>
              {t('common.internalNote')}:
            </Typography>
            <Typography sx={{ fontSize: '0.9rem' }}>
              {businessCase.internalNote}
            </Typography>
          </MobileInfoRow>
        )}
        {businessCase.reminderNote && (
          <MobileInfoRow isDarkMode={isDarkMode} sx={{ 
            flexDirection: 'column', 
            alignItems: 'flex-start',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '8px',
            borderRadius: '8px'
          }}>
            <Typography sx={{ 
              fontSize: '0.8rem', 
              color: colors.accent.main,
              marginBottom: '4px'
            }}>
              {t('business.reminderNote')}:
            </Typography>
            <Typography sx={{ fontSize: '0.9rem' }}>
              {businessCase.reminderNote}
            </Typography>
          </MobileInfoRow>
        )}
      </MobileCardContent>
      <MobileCardActions>
        <BareTooltip title={t('common.edit')}>
          <IconButton
            size="small"
            onClick={() => handleEdit(businessCase)}
            sx={{ 
              color: colors.accent.main,
              backgroundColor: 'rgba(255, 159, 67, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 159, 67, 0.2)'
              }
            }}
          >
            <EditIcon />
          </IconButton>
        </BareTooltip>
        <BareTooltip title={t('common.delete')}>
          <IconButton
            size="small"
            onClick={() => handleDelete(businessCase.id!)}
            sx={{ 
              color: colors.secondary.main,
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              '&:hover': {
                backgroundColor: 'rgba(255, 107, 107, 0.2)'
              }
            }}
          >
            <DeleteIcon />
          </IconButton>
        </BareTooltip>
      </MobileCardActions>
    </MobileBusinessCard>
  ), [isDarkMode, handleEdit, handleDelete, t, caseStatuses]);

  const fetchPhases = useCallback(async () => {
    try {
      const phasesCollection = collection(db, 'phases');
      const snapshot = await getDocs(phasesCollection);
      const phasesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          createdAt: data.createdAt ? 
            (data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(data.createdAt)) : 
            new Date()
        };
      });
      setPhases(phasesData.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()));
    } catch (error) {
      console.error('Error fetching phases:', error);
    }
  }, []);

  // Funkcia pre získanie prekladového kľúča na základe hodnoty fázy
  const getPhaseKey = useCallback((phaseValue: string) => {
    // Mapa kľúčov na hodnoty
    const phaseKeys: Record<string, string> = {
      [t('business.phaseTypes.meeting')]: 'business.phaseTypes.meeting',
      [t('business.phaseTypes.call')]: 'business.phaseTypes.call',
      [t('business.phaseTypes.email')]: 'business.phaseTypes.email',
      [t('business.phaseTypes.videoCall')]: 'business.phaseTypes.videoCall'
    };
    
    // Ak je to jedna z preddefinovaných hodnôt, vrátime prekladový kľúč
    return phaseKeys[phaseValue] || '';
  }, [t]);

  // Funkcia pre preklady fáz - pokúsi sa preložiť, ak je to možné
  const translatePhase = useCallback((phaseName: string) => {
    // Mapa názvov fáz na prekladové kľúče (pre spätné mapovanie)
    const knownPhases: Record<string, string> = {
      'Stretnutie': 'business.phaseTypes.meeting',
      'Meeting': 'business.phaseTypes.meeting',
      'Hovor': 'business.phaseTypes.call',
      'Call': 'business.phaseTypes.call',
      'Mail': 'business.phaseTypes.email',
      'Email': 'business.phaseTypes.email',
      'Videohovor': 'business.phaseTypes.videoCall',
      'Video Call': 'business.phaseTypes.videoCall'
    };

    // Ak máme pre názov fázy prekladový kľúč, použijeme ho
    const key = knownPhases[phaseName];
    if (key) {
      return t(key);
    }
    
    // Inak vrátime originálny text
    return phaseName;
  }, [t]);

  const handleAddPhase = useCallback(async (phase: string, businessCaseId: string) => {
    const timestamp = Timestamp.now();
    // Získame prekladový kľúč, ak existuje
    const translationKey = getPhaseKey(phase);
    
    const newPhase: Phase = { 
      id: crypto.randomUUID(),
      name: phase,
      // Uložíme aj prekladový kľúč, ak existuje
      translationKey: translationKey || undefined,
      createdAt: timestamp.toDate()
    };
    
    try {
      const caseRef = doc(db, 'businessCases', businessCaseId);
      const caseDoc = await getDoc(caseRef);
      
      if (caseDoc.exists()) {
        const currentPhases = caseDoc.data().phases || [];
        await updateDoc(caseRef, {
          phases: [...currentPhases, newPhase]
        });
        
        setCases(prevCases => 
          prevCases.map(businessCase => 
            businessCase.id === businessCaseId 
              ? { ...businessCase, phases: [...(businessCase.phases || []), newPhase] }
              : businessCase
          )
        );
        
        setSnackbar({
          open: true,
          message: t('business.phaseAdded', { phase: phase }),
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error adding phase:', error);
      setSnackbar({
        open: true,
        message: t('business.phaseAddError'),
        severity: 'error'
      });
    }
    setPhaseDialogOpen(false);
  }, [getPhaseKey, t]);

  const handleDeletePhase = useCallback(async (businessCaseId: string, phaseId: string) => {
    try {
      const caseRef = doc(db, 'businessCases', businessCaseId);
      const caseDoc = await getDoc(caseRef);
      
      if (caseDoc.exists()) {
        const currentPhases = caseDoc.data().phases || [];
        const updatedPhases = currentPhases.filter((phase: Phase) => phase.id !== phaseId);
        
        await updateDoc(caseRef, {
          phases: updatedPhases
        });
        
        setCases(prevCases => 
          prevCases.map(businessCase => 
            businessCase.id === businessCaseId 
              ? { ...businessCase, phases: updatedPhases }
              : businessCase
          )
        );
        
        setSnackbar({
          open: true,
          message: t('business.phaseDeleted'),
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error deleting phase:', error);
      setSnackbar({
        open: true,
        message: t('business.phaseDeleteError'),
        severity: 'error'
      });
    }
  }, [t]);

  useEffect(() => {
    fetchPhases();
  }, [fetchPhases]);

  const filteredCases = getFilteredCases();
  const paginatedCases = filteredCases.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle isDarkMode={isDarkMode}>{t('business.cases')}</PageTitle>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Button
            startIcon={<AddIcon />}
            onClick={() => {
              setEditCase(null);
              setFormData({
                companyName: '',
                vatNumber: '',
                companyAddress: '',
                contactPerson: {
                  firstName: '',
                  lastName: '',
                  phone: '',
                  email: '',
                },
                internalNote: '',
                status: 'NOT_CALLED',
                reminderDateTime: null,
                reminderNote: '',
              });
              setSelectedCountry(euCountries[0]);
              setOpen(true);
            }}
            sx={{
              backgroundColor: colors.accent.main,
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: colors.accent.light,
              }
            }}
          >
            {t('business.addCase')}
          </Button>
        </Box>
      </PageHeader>

      <Box sx={{ 
        display: { xs: 'block', sm: 'none' },
        width: '100%', 
        marginBottom: '24px'
      }}>
        <AddButton
          fullWidth
          onClick={() => {
            setEditCase(null);
            setFormData({
              companyName: '',
              vatNumber: '',
              companyAddress: '',
              contactPerson: {
                firstName: '',
                lastName: '',
                phone: '',
                email: '',
              },
              internalNote: '',
              status: 'NOT_CALLED',
              reminderDateTime: null,
              reminderNote: '',
            });
            setSelectedCountry(euCountries[0]);
            setOpen(true);
          }}
          sx={{
            backgroundColor: colors.accent.main,
            color: '#ffffff',
            padding: '8px 24px',
            borderRadius: '12px',
            fontSize: '0.95rem',
            fontWeight: 600,
            textTransform: 'none',
            transition: 'all 0.2s ease-in-out',
            boxShadow: '0 4px 12px rgba(255, 159, 67, 0.3)',
            '&:hover': {
              backgroundColor: colors.accent.light,
              transform: 'translateY(-2px)',
              boxShadow: '0 6px 16px rgba(255, 159, 67, 0.4)',
            }
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 1,
            width: '100%'
          }}>
            <AddIcon sx={{ fontSize: '1.2rem' }} />
            {t('business.addCase')}
          </Box>
        </AddButton>
      </Box>

      <SearchWrapper>
        <SearchField
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          label={t('business.searchCase')}
        />
      </SearchWrapper>

      <Box sx={{ display: 'flex', gap: 2, marginBottom: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <Typography variant="body1" fontWeight="medium">{t('common.filterByDate')}:</Typography>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
              <DatePicker
                  label={t('common.from')}
                  value={filterStartDate}
                  onChange={(newValue: Date | null) => setFilterStartDate(newValue)}
                  slotProps={{ 
                      textField: { 
                          size: 'small',
                          sx: { 
                              minWidth: 150,
                              backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.8)' : '#ffffff',
                           },
                           InputLabelProps: { sx: { color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'inherit' }},
                           InputProps: { sx: { color: isDarkMode ? '#fff' : 'inherit' }}
                      }
                  }}
              />
              <DatePicker
                  label={t('common.to')}
                  value={filterEndDate}
                  onChange={(newValue: Date | null) => setFilterEndDate(newValue)}
                  slotProps={{ 
                      textField: { 
                          size: 'small', 
                          sx: { 
                              minWidth: 150,
                              backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.8)' : '#ffffff',
                           },
                           InputLabelProps: { sx: { color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'inherit' }},
                           InputProps: { sx: { color: isDarkMode ? '#fff' : 'inherit' }}
                      }
                  }}
              />
          </LocalizationProvider>
           <Button 
              onClick={() => { setFilterStartDate(null); setFilterEndDate(null); }} 
              size="small"
              sx={{ ml: 1, color: isDarkMode ? colors.text.secondary : 'inherit' }}
            >
              {t('common.clearFilter')}
            </Button>
      </Box>

      {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress sx={{ color: colors.accent.main }} />
            </Box>
        )}

      {!loading && (
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              {paginatedCases.map((businessCase: BusinessCase) => renderMobileCase(businessCase))}
          </Box>
      )}

      {!loading && (
          <TableContainer 
              component={Paper} 
              sx={{ 
                  display: { xs: 'none', md: 'block' },
                  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
                  borderRadius: '20px',
                  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                  '& .MuiTableCell-root': {
                    color: isDarkMode ? '#ffffff' : '#000000',
                    borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    padding: '16px',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap'
                  },
                  '& .MuiTableHead-root .MuiTableCell-root': {
                    fontWeight: 600,
                    backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    borderBottom: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  },
                  '& .MuiTableBody-root .MuiTableRow-root': {
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }
                  }
              }}
          >
              <Table>
                  <TableHead>
                      <TableRow>
                          <TableCell>{t('business.creationDate')}</TableCell>
                          <TableCell>{t('common.status')}</TableCell>
                          <TableCell>{t('business.company')}</TableCell>
                          <TableCell>{t('business.contactPerson')}</TableCell>
                          <TableCell>{t('business.phone')}</TableCell>
                          <TableCell>{t('business.email')}</TableCell>
                          <TableCell>{t('business.createdBy')}</TableCell>
                      </TableRow>
                  </TableHead>
                  <TableBody>
                       {paginatedCases.map((businessCase: BusinessCase) => (
                          <React.Fragment key={businessCase.id}>
                              <StyledTableRow isDarkMode={isDarkMode} onClick={() => handleRowClick(businessCase.id!)} sx={{ cursor: 'pointer' }}>
                                  <StyledTableCell isDarkMode={isDarkMode}>{(businessCase.createdAt as Timestamp)?.toDate().toLocaleString('sk-SK') ?? '-'}</StyledTableCell>
                                  <StyledTableCell isDarkMode={isDarkMode}><Chip label={caseStatuses[businessCase.status]?.label ?? businessCase.status} color={caseStatuses[businessCase.status]?.color ?? 'default'} size="small" /></StyledTableCell>
                                  <StyledTableCell isDarkMode={isDarkMode}>{businessCase.companyName}</StyledTableCell>
                                  <StyledTableCell isDarkMode={isDarkMode}>{`${businessCase.contactPerson.firstName} ${businessCase.contactPerson.lastName}`}</StyledTableCell>
                                  <StyledTableCell isDarkMode={isDarkMode}>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                          {businessCase.countryCode && <img loading="lazy" width="20" src={`https://flagcdn.com/${businessCase.countryCode.toLowerCase()}.svg`} alt="" />}
                                          {businessCase.contactPerson.phone}
                                      </Box>
                                  </StyledTableCell>
                                  <StyledTableCell isDarkMode={isDarkMode}>{businessCase.contactPerson.email}</StyledTableCell>
                                  <StyledTableCell isDarkMode={isDarkMode}>{`${businessCase.createdBy?.firstName ?? ''} ${businessCase.createdBy?.lastName ?? ''}`}</StyledTableCell>
                              </StyledTableRow>
                              <TableRow sx={{ '& > *': { borderBottom: 'unset', padding: 0 } }}>
                                  <StyledTableCell isDarkMode={isDarkMode} style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                                      <Collapse in={expandedCaseId === businessCase.id} timeout="auto" unmountOnExit>
                                          <Box sx={{ margin: 1, padding: 2, backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)', borderRadius: '8px' }}>
                                              <Typography variant="h6" gutterBottom component="div" sx={{ fontSize: '1.2rem' }}>
                                                  {t('business.caseDetails')}
                                              </Typography>
                                              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2, mb: 2 }}>
                                                  <Box>
                                                       <Typography variant="body2"><strong>{t('business.creationDate')}:</strong> {(businessCase.createdAt as Timestamp)?.toDate().toLocaleString('sk-SK') ?? '-'}</Typography>
                                                       <Typography variant="body2"><strong>{t('common.status')}:</strong> {caseStatuses[businessCase.status]?.label ?? businessCase.status}</Typography>
                                                       <Typography variant="body2"><strong>{t('business.company')}:</strong> {businessCase.companyName}</Typography>
                                                       <Typography variant="body2"><strong>{t('company.vatNumber')}:</strong> {businessCase.vatNumber || '-'}</Typography>
                                                       {businessCase.internalNote && <Typography variant="body2" sx={{ mt: 1 }}><strong>{t('common.internalNote')}:</strong> {businessCase.internalNote}</Typography>}
                                                  </Box>
                                                  <Box>
                                                       <Typography variant="body2"><strong>{t('business.contactPerson')}:</strong> {`${businessCase.contactPerson.firstName} ${businessCase.contactPerson.lastName}`}</Typography>
                                                       <Typography variant="body2"><strong>{t('business.phone')}:</strong> {businessCase.contactPerson.phone}</Typography>
                                                       <Typography variant="body2"><strong>{t('business.email')}:</strong> {businessCase.contactPerson.email}</Typography>
                                                       {businessCase.reminderDateTime && <Typography variant="body2"><strong>{t('business.reminder')}:</strong> {format(businessCase.reminderDateTime, 'dd.MM.yyyy HH:mm')}</Typography>}
                                                       {businessCase.reminderNote && <Typography variant="body2" sx={{ mt: 1 }}><strong>{t('business.reminderNote')}:</strong> {businessCase.reminderNote}</Typography>}
                                                  </Box>
                                              </Box>
                                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, pt: 1, borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` }}>
                                                  <Typography variant="body2"><strong>{t('business.createdBy')}:</strong> {`${businessCase.createdBy?.firstName ?? ''} ${businessCase.createdBy?.lastName ?? ''}`}</Typography>
                                                  <Box sx={{ display: 'flex', gap: 1 }}>
                                                      <BareTooltip title={t('common.edit')}>
                                                        <IconButton
                                                          onClick={() => handleEdit(businessCase)}
                                                          sx={{ color: colors.accent.main, '&:hover': { backgroundColor: 'rgba(255, 159, 67, 0.1)' } }}
                                                        >
                                                          <EditIcon />
                                                        </IconButton>
                                                      </BareTooltip>
                                                      <BareTooltip title={t('common.delete')}>
                                                        <IconButton
                                                          onClick={() => handleDelete(businessCase.id!)}
                                                          sx={{ color: colors.secondary.main, '&:hover': { backgroundColor: 'rgba(255, 107, 107, 0.1)' } }}
                                                        >
                                                          <DeleteIcon />
                                                        </IconButton>
                                                      </BareTooltip>
                                                  </Box>
                                              </Box>
                                              <Box sx={{ marginTop: 2 }}>
                                                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '1.1rem' }}>
                                                      {t('business.phases')}
                                                      <IconButton 
                                                          onClick={() => { 
                                                              if (businessCase.id) {
                                                                  setExpandedCaseId(businessCase.id); 
                                                                  setPhaseDialogOpen(true); 
                                                              }
                                                          }} 
                                                          sx={{ color: colors.accent.main }} 
                                                          size="small"
                                                      >
                                                          <AddIcon fontSize="small"/>
                                                      </IconButton>
                                                  </Typography>
                                                  <Box sx={{ marginTop: 1, display: 'flex', gap: 1, flexWrap: 'nowrap', overflowX: 'auto', padding: '4px 0', /* scrollbar styles */ }}>
                                                      {businessCase.phases?.sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0)).map((phase: Phase, index: number) => (
                                                          <Chip
                                                              key={phase.id}
                                                              label={
                                                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                                                      <Typography sx={{ fontSize: '0.8rem', whiteSpace: 'normal', overflow: 'visible', paddingRight: '5px' }}>
                                                                          {`${phase.translationKey ? t(phase.translationKey) : translatePhase(phase.name)} - ${phase.createdAt && phase.createdAt instanceof Date && !isNaN(phase.createdAt.getTime()) ? format(phase.createdAt, 'dd.MM.yyyy HH:mm') : t('business.unknownDate')}`}
                                                                      </Typography>
                                                                                                                                              <BareTooltip title={t('common.delete')}>
                                                                        <IconButton 
                                                                          size="small" 
                                                                          onClick={(e: React.MouseEvent) => { 
                                                                              e.stopPropagation(); 
                                                                              e.preventDefault(); 
                                                                              if (businessCase.id) handleDeletePhase(businessCase.id, phase.id); 
                                                                          }} 
                                                                          sx={{ ml: 0.5, p: 0.2 }}
                                                                        >
                                                                          <DeleteIcon sx={{ color: '#ffffff', fontSize: '0.8rem' }} />
                                                                        </IconButton>
                                                                        </BareTooltip>
                                                                  </Box>
                                                              }
                                                              sx={{
                                                                  backgroundColor: phaseColors[index % phaseColors.length],
                                                                  color: '#ffffff',
                                                                  borderRadius: '16px',
                                                                  '& .MuiChip-label': { padding: '6px 8px', display: 'flex', alignItems: 'center', width: '100%' },
                                                                  height: 'auto', minHeight: '32px', fontSize: '0.8rem', minWidth: '180px', maxWidth: '250px', flex: '0 0 auto', position: 'relative',
                                                                  '&::after': index < (businessCase.phases?.length || 0) - 1 ? { content: '""', position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', width: '8px', height: '8px', borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: `4px solid ${phaseColors[index % phaseColors.length]}`, zIndex: 1 } : {}
                                                              }}
                                                          />
                                                      ))}
                                                  </Box>
                                              </Box>
                                          </Box>
                                      </Collapse>
                                  </StyledTableCell>
                              </TableRow>
                          </React.Fragment>
                      ))}
                  </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={filteredCases.length}
                page={page}
                onPageChange={(e: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
                labelRowsPerPage={t('business.rowsPerPage')}
              />
          </TableContainer>
      )}

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditCase(null);
          setFormData({
            companyName: '',
            vatNumber: '',
            companyAddress: '',
            contactPerson: {
              firstName: '',
              lastName: '',
              phone: '',
              email: '',
            },
            internalNote: '',
            status: 'NOT_CALLED',
            reminderDateTime: null,
            reminderNote: '',
          });
        }}
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
          <DialogTitle>
            {editCase ? t('business.editCase') : t('business.addNewCase')}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('company.companyName')}
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('company.vatNumber')}
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('company.companyAddress')}
                    value={formData.companyAddress}
                    onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('common.firstName')}
                    value={formData.contactPerson.firstName}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactPerson: { ...formData.contactPerson, firstName: e.target.value }
                    })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('common.lastName')}
                    value={formData.contactPerson.lastName}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactPerson: { ...formData.contactPerson, lastName: e.target.value }
                    })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <FormControl sx={{ minWidth: 120 }}>
                      <Select
                        value={selectedCountry.code}
                        onChange={handleCountryChange}
                        sx={{
                          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                          color: isDarkMode ? '#ffffff' : '#000000',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#ff9f43',
                          },
                          '& .MuiSelect-icon': {
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                          }
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
                        {euCountries.map((country) => (
                          <MenuItem key={country.code} value={country.code}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span>{country.flag}</span>
                              <span>{country.prefix}</span>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      label={t('business.phoneNumber')}
                      value={formData.contactPerson.phone?.replace(selectedCountry.prefix, '') || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        contactPerson: { ...formData.contactPerson, phone: selectedCountry.prefix + e.target.value }
                      })}
                      placeholder="9XX XXX XXX"
                      helperText={t('business.enterPhoneNumber')}
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: isDarkMode ? '#ffffff' : '#000000',
                          '& fieldset': {
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                          },
                          '&:hover fieldset': {
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#ff9f43',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                          '&.Mui-focused': {
                            color: '#ff9f43',
                          },
                        },
                        '& .MuiFormHelperText-root': {
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                          fontSize: '0.75rem',
                          marginLeft: 0,
                          marginTop: '4px',
                        }
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label={t('auth.email')}
                    type="email"
                    value={formData.contactPerson.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactPerson: { ...formData.contactPerson, email: e.target.value }
                    })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('common.internalNote')}
                    multiline
                    rows={4}
                    value={formData.internalNote}
                    onChange={(e) => setFormData({ ...formData, internalNote: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('common.status')}</InputLabel>
                    <Select
                      value={formData.status}
                      label={t('common.status')}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as CaseStatusKey })}
                    >
                      {Object.entries(caseStatuses).map(([key, value]) => (
                        <MenuItem key={key} value={key}>
                          {value.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                    <DateTimePicker
                      label={t('business.reminderDateTime')}
                      value={formData.reminderDateTime}
                      onChange={(newValue) => setFormData({ ...formData, reminderDateTime: newValue })}
                      sx={{
                        width: '100%',
                        '& .MuiInputBase-root': {
                          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                          color: isDarkMode ? '#ffffff' : '#000000',
                        }
                      }}
                      slotProps={{
                        popper: {
                          sx: {
                            '& .MuiPaper-root': {
                              backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                              backdropFilter: 'blur(8px)',
                              color: isDarkMode ? '#ffffff' : '#000000',
                              '& .MuiPickersDay-root': {
                                color: isDarkMode ? '#ffffff' : '#000000',
                                '&:hover': {
                                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                                },
                                '&.Mui-selected': {
                                  backgroundColor: colors.accent.main,
                                  color: '#ffffff',
                                  '&:hover': {
                                    backgroundColor: colors.accent.light
                                  }
                                }
                              },
                              '& .MuiPickersCalendarHeader-root': {
                                color: isDarkMode ? '#ffffff' : '#000000'
                              },
                              '& .MuiPickersYear-yearButton': {
                                color: isDarkMode ? '#ffffff' : '#000000',
                                '&:hover': {
                                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                                },
                                '&.Mui-selected': {
                                  backgroundColor: colors.accent.main,
                                  color: '#ffffff'
                                }
                              },
                              '& .MuiPickersMonth-monthButton': {
                                color: isDarkMode ? '#ffffff' : '#000000',
                                '&:hover': {
                                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                                },
                                '&.Mui-selected': {
                                  backgroundColor: colors.accent.main,
                                  color: '#ffffff'
                                }
                              },
                              '& .MuiClock-pin, & .MuiClockPointer-root': {
                                backgroundColor: colors.accent.main
                              },
                              '& .MuiClockPointer-thumb': {
                                backgroundColor: colors.accent.main,
                                border: `16px solid ${colors.accent.main}`
                              }
                            }
                          }
                        }
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('business.reminderNote')}
                    multiline
                    rows={2}
                    value={formData.reminderNote}
                    onChange={(e) => setFormData({ ...formData, reminderNote: e.target.value })}
                    placeholder={t('business.enterReminderText')}
                    helperText={t('business.reminderEmailText')}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setOpen(false);
                setEditCase(null);
              }}
              sx={{
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                backgroundColor: colors.accent.main,
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: colors.accent.light,
                },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: '#ffffff' }} /> : t('common.save')}
            </Button>
          </DialogActions>
        </StyledDialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
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
          <DialogTitle>
            {t('common.confirmDelete')}
          </DialogTitle>
          <DialogContent>
            <Typography>
              {t('business.deleteConfirmation')}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              sx={{
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={confirmDelete}
              variant="contained"
              sx={{
                backgroundColor: colors.secondary.main,
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: colors.secondary.light,
                },
              }}
            >
              {t('common.delete')}
            </Button>
          </DialogActions>
        </StyledDialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={phaseDialogOpen}
        onClose={() => setPhaseDialogOpen(false)}
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
          <DialogTitle>{t('business.addPhase')}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2">{t('business.selectOrAddPhase')}</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2, mb: 1 }}>
                <Chip label={t('business.phaseTypes.meeting')} onClick={() => handleAddPhase(t('business.phaseTypes.meeting'), expandedCaseId!)} sx={{ bgcolor: phaseColors[0], color: '#fff' }} />
                <Chip label={t('business.phaseTypes.call')} onClick={() => handleAddPhase(t('business.phaseTypes.call'), expandedCaseId!)} sx={{ bgcolor: phaseColors[1], color: '#fff' }} />
                <Chip label={t('business.phaseTypes.email')} onClick={() => handleAddPhase(t('business.phaseTypes.email'), expandedCaseId!)} sx={{ bgcolor: phaseColors[2], color: '#fff' }} />
                <Chip label={t('business.phaseTypes.videoCall')} onClick={() => handleAddPhase(t('business.phaseTypes.videoCall'), expandedCaseId!)} sx={{ bgcolor: phaseColors[3], color: '#fff' }} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TextField
                  placeholder={t('business.addCustomPhase')}
                  variant="outlined"
                  size="small"
                  fullWidth
                  sx={{ marginTop: 1 }}
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && expandedCaseId) {
                      const inputElement = e.target as HTMLInputElement;
                      if (inputElement.value) handleAddPhase(inputElement.value, expandedCaseId);
                      inputElement.value = ''; 
                    }
                  }}
                />
                <BareTooltip title={t('common.add')}>
                  <IconButton 
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                      const inputElement = e.currentTarget.previousElementSibling?.querySelector('input');
                      if (inputElement && inputElement.value && expandedCaseId) {
                        handleAddPhase(inputElement.value, expandedCaseId);
                        inputElement.value = ''; 
                      }
                    }}
                    sx={{ backgroundColor: colors.accent.main, color: '#fff', '&:hover': { backgroundColor: colors.accent.light } }}
                  >
                    <AddIcon />
                  </IconButton>
                </BareTooltip>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPhaseDialogOpen(false)}>{t('common.cancel')}</Button>
          </DialogActions>
        </StyledDialogContent>
      </Dialog>
    </PageWrapper>
  );
} 