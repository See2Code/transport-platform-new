import React, { useState, useEffect } from 'react';
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
  Tooltip,
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
  Card,
  CircularProgress,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
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
import InfoIcon from '@mui/icons-material/Info';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, Timestamp, getDoc, orderBy, updateDoc, increment, limit, startAfter, QueryDocumentSnapshot, DocumentReference, DocumentData } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import { useNavigate } from 'react-router-dom';
import SearchField from './common/SearchField';
import { format } from 'date-fns';
import { useThemeMode } from '../contexts/ThemeContext';

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

// Definícia stavov obchodného prípadu
const caseStatuses = {
  CALLED: { label: 'Dovolaný', color: 'success' as const },
  NOT_CALLED: { label: 'Nedovolaný', color: 'error' as const },
  EMAIL_SENT: { label: 'Poslaný email', color: 'info' as const },
  IN_PROGRESS: { label: 'V štádiu riešenia', color: 'warning' as const },
  CALL_LATER: { label: 'Volať neskôr', color: 'secondary' as const },
  MEETING: { label: 'Stretnutie', color: 'primary' as const },
  CALL: { label: 'Telefonát', color: 'info' as const },
  INTERESTED: { label: 'Záujem', color: 'success' as const },
  NOT_INTERESTED: { label: 'Nezáujem', color: 'error' as const }
};

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
  status: keyof typeof caseStatuses;
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
}

const MobileBusinessCard = styled(Box)<{ isDarkMode: boolean }>(({ theme, isDarkMode }) => ({
  backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
  borderRadius: theme.spacing(1),
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
  color: isDarkMode ? '#ffffff' : '#000000',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const MobileCardHeader = styled(Box)<{ isDarkMode: boolean }>(({ theme, isDarkMode }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  color: isDarkMode ? '#ffffff' : '#000000',
  width: '100%',
}));

const MobileCompanyName = styled(Typography)<{ isDarkMode: boolean }>(({ theme, isDarkMode }) => ({
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

const MobileInfoRow = styled(Box)<{ isDarkMode: boolean }>(({ theme, isDarkMode }) => ({
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

const StyledCard = styled(Card)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  backdropFilter: 'blur(10px)',
  borderRadius: '20px',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 24px rgba(255, 159, 67, 0.2)',
    border: '1px solid rgba(255, 159, 67, 0.2)',
    '& .MuiCardContent-root': {
      background: 'linear-gradient(180deg, rgba(255, 159, 67, 0.1) 0%, rgba(255, 159, 67, 0) 100%)',
    }
  },
  '& .MuiTypography-root': {
    color: isDarkMode ? '#ffffff' : '#000000',
  },
  '& .MuiTypography-body1': {
    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  },
}));

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

export default function BusinessCases() {
  const [cases, setCases] = useState<BusinessCase[]>([]);
  const [open, setOpen] = useState(false);
  const [editCase, setEditCase] = useState<BusinessCase | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<string | null>(null);
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [formData, setFormData] = useState({
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
    status: 'NOT_CALLED' as keyof typeof caseStatuses,
    reminderDateTime: null as Date | null,
    reminderNote: '',
    createdBy: null as { firstName: string; lastName: string; } | null,
    createdAt: null as Date | null
  });
  const [selectedCountry, setSelectedCountry] = useState(euCountries[0]);
  const { isDarkMode } = useThemeMode();
  const [loading, setLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | null>('all');
  const [expandedCaseId, setExpandedCaseId] = useState<string | null>(null);
  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false);
  const [phases, setPhases] = useState<Phase[]>([]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      if (!userData?.companyID) {
        console.log('Chýbajúce companyID - používateľ nemá priradenú firmu');
        setSnackbar({
          open: true,
          message: 'Nemáte priradenú firmu, kontaktujte administrátora',
          severity: 'error'
        });
        return;
      }

      setLoading(true);
      const casesCollection = collection(db, 'businessCases');
      const casesQuery = query(
        casesCollection, 
        where('companyID', '==', userData.companyID),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(casesQuery);
      console.log('BusinessCases: Počet načítaných dokumentov:', snapshot.size);
      console.log('BusinessCases: CompanyID používateľa:', userData.companyID);
      
      const casesData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('BusinessCases: Spracovávam dokument:', {
          id: doc.id,
          companyID: data.companyID,
          companyName: data.companyName,
          createdAt: data.createdAt
        });
        
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date(data.createdAt)),
          reminderDateTime: data.reminderDateTime ? new Date(data.reminderDateTime.seconds * 1000) : null
        };
      }) as BusinessCase[];
      setCases(casesData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching cases:', error);
      setLoading(false);
      setSnackbar({
        open: true,
        message: 'Nastala chyba pri načítaní prípadov',
        severity: 'error'
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (!currentUser || !userData) {
        setSnackbar({
          open: true,
          message: 'Nie ste prihlásený',
          severity: 'error'
        });
        return;
      }

      const businessCaseData = {
        companyName: formData.companyName,
        vatNumber: formData.vatNumber,
        companyAddress: formData.companyAddress,
        contactPerson: formData.contactPerson,
        internalNote: formData.internalNote,
        status: formData.status,
        reminderDateTime: formData.reminderDateTime ? Timestamp.fromDate(new Date(formData.reminderDateTime)) : null,
        reminderNote: formData.reminderNote,
        createdAt: Timestamp.now(),
        createdBy: {
          firstName: userData.firstName || '',
          lastName: userData.lastName || ''
        },
        countryCode: selectedCountry.code,
        companyID: userData.companyID  // Pridané companyID pre zabezpečenie správneho prístupu
      };

      if (editCase?.id) {
        await updateDoc(doc(db, 'businessCases', editCase.id), businessCaseData);
        setSnackbar({
          open: true,
          message: 'Prípad bol úspešne upravený',
          severity: 'success'
        });

        // Ak je nastavený reminder pri editácii, vytvoríme email notifikáciu
        if (formData.reminderDateTime) {
          console.log('Vytváram pripomienku:', {
            dateTime: formData.reminderDateTime,
            email: currentUser.email,
            companyName: formData.companyName,
            businessCaseId: editCase.id
          });

          const reminderData = {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            businessCaseId: editCase.id,
            reminderDateTime: Timestamp.fromDate(new Date(formData.reminderDateTime)),
            companyName: formData.companyName,
            reminderNote: formData.reminderNote || '',
            contactPerson: formData.contactPerson,
            createdAt: Timestamp.now(),
            createdBy: {
              firstName: userData.firstName || '',
              lastName: userData.lastName || ''
            },
            sent: false
          };

          console.log('Dáta pripomienky:', reminderData);
          
          try {
            const reminderRef = await addDoc(collection(db, 'reminders'), reminderData);
            console.log('Pripomienka vytvorená s ID:', reminderRef.id);
          } catch (error) {
            console.error('Chyba pri vytváraní pripomienky:', error);
            throw error;
          }
        }
      } else {
        const docRef: DocumentReference<DocumentData> = await addDoc(collection(db, 'businessCases'), businessCaseData);
        setSnackbar({
          open: true,
          message: 'Prípad bol úspešne vytvorený',
          severity: 'success'
        });

        // Ak je nastavený reminder pri vytvorení, vytvoríme email notifikáciu
        if (formData.reminderDateTime) {
          console.log('Vytváram pripomienku:', {
            dateTime: formData.reminderDateTime,
            email: currentUser.email,
            companyName: formData.companyName,
            businessCaseId: docRef.id
          });

          const reminderData = {
            userId: currentUser.uid,
            userEmail: currentUser.email,
            businessCaseId: docRef.id,
            reminderDateTime: Timestamp.fromDate(new Date(formData.reminderDateTime)),
            companyName: formData.companyName,
            reminderNote: formData.reminderNote || '',
            contactPerson: formData.contactPerson,
            createdAt: Timestamp.now(),
            createdBy: {
              firstName: userData.firstName || '',
              lastName: userData.lastName || ''
            },
            sent: false
          };

          console.log('Dáta pripomienky:', reminderData);
          
          try {
            const reminderRef = await addDoc(collection(db, 'reminders'), reminderData);
            console.log('Pripomienka vytvorená s ID:', reminderRef.id);
          } catch (error) {
            console.error('Chyba pri vytváraní pripomienky:', error);
            throw error;
          }
        }
      }

      // Vytvorenie alebo aktualizácia kontaktu
      const contactsCollection = collection(db, 'contacts');
      const contactData = {
        firstName: formData.contactPerson.firstName,
        lastName: formData.contactPerson.lastName,
        company: formData.companyName,
        phonePrefix: selectedCountry.prefix,
        phoneNumber: formData.contactPerson.phone.replace(selectedCountry.prefix, ''),
        countryCode: selectedCountry.code.toLowerCase(),
        email: formData.contactPerson.email,
        createdAt: Timestamp.now(),
        createdBy: {
          firstName: userData.firstName,
          lastName: userData.lastName
        }
      };

      await addDoc(contactsCollection, contactData);

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
        createdBy: null,
        createdAt: null
      });
      fetchCases();
    } catch (error) {
      console.error('Error saving business case:', error);
      setSnackbar({
        open: true,
        message: 'Nastala chyba pri ukladaní obchodného prípadu',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id: string) => {
    setCaseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!caseToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'businessCases', caseToDelete));
      setSnackbar({
        open: true,
        message: 'Prípad bol úspešne vymazaný',
        severity: 'success'
      });
      fetchCases();
    } catch (error) {
      console.error('Error deleting case:', error);
      setSnackbar({
        open: true,
        message: 'Nastala chyba pri mazaní prípadu',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setCaseToDelete(null);
    }
  };

  const handleEdit = (businessCase: BusinessCase) => {
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
      createdBy: businessCase.createdBy || null,
      createdAt: businessCase.createdAt?.toDate() || null
    });
    setOpen(true);
  };

  const handleCountryChange = (event: any) => {
    const country = euCountries.find(c => c.code === event.target.value);
    if (country) {
      setSelectedCountry(country);
      // Ak je telefónne číslo prázdne, pridáme predvolbu
      if (!formData.contactPerson.phone) {
        setFormData({
          ...formData,
          contactPerson: { ...formData.contactPerson, phone: country.prefix }
        });
      }
    }
  };

  const handleDateFilterChange = (filter: 'all' | 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | null) => {
    setDateFilter(filter);
  };

  const filteredCases = cases.filter((businessCase: BusinessCase) => {
    const createdAt = businessCase.createdAt instanceof Timestamp ? businessCase.createdAt.toDate() : new Date(businessCase.createdAt);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    if (dateFilter === 'today') {
      return createdAt >= today;
    } else if (dateFilter === 'thisWeek') {
      return createdAt >= thisWeekStart;
    } else if (dateFilter === 'thisMonth') {
      return createdAt >= thisMonthStart;
    } else if (dateFilter === 'thisYear') {
      return createdAt >= thisYearStart;
    }

    return true;
  });

  const handleRowClick = (id: string) => {
    setExpandedCaseId(expandedCaseId === id ? null : id);
  };

  const renderMobileCase = (businessCase: BusinessCase) => (
    <MobileBusinessCard isDarkMode={isDarkMode}>
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
          Vytvoril: {businessCase.createdBy?.firstName} {businessCase.createdBy?.lastName}
        </MobileInfoRow>
        {businessCase.reminderDateTime && (
          <MobileInfoRow isDarkMode={isDarkMode}>
            <AccessTimeIcon />
            Pripomienka: {format(businessCase.reminderDateTime, 'dd.MM.yyyy HH:mm')}
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
              Interná poznámka:
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
              Poznámka k pripomienke:
            </Typography>
            <Typography sx={{ fontSize: '0.9rem' }}>
              {businessCase.reminderNote}
            </Typography>
          </MobileInfoRow>
        )}
      </MobileCardContent>
      <MobileCardActions>
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
      </MobileCardActions>
    </MobileBusinessCard>
  );

  const fetchPhases = async () => {
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
  };

  const handleAddPhase = async (phase: string, businessCaseId: string) => {
    const timestamp = Timestamp.now();
    const newPhase: Phase = { 
      id: crypto.randomUUID(),
      name: phase, 
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
          message: `Fáza obchodu '${phase}' bola pridaná`,
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error adding phase:', error);
      setSnackbar({
        open: true,
        message: 'Nastala chyba pri pridávaní fázy',
        severity: 'error'
      });
    }
    setPhaseDialogOpen(false);
  };

  const handleDeletePhase = async (businessCaseId: string, phaseId: string) => {
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
          message: 'Fáza bola úspešne vymazaná',
          severity: 'success'
        });
      }
    } catch (error) {
      console.error('Error deleting phase:', error);
      setSnackbar({
        open: true,
        message: 'Nastala chyba pri mazaní fázy',
        severity: 'error'
      });
    }
  };

  useEffect(() => {
    fetchPhases();
  }, []);

  const renderPhasesTimeline = (caseId: string): JSX.Element | null => {
    const businessCase = cases.find((c: BusinessCase) => c.id === caseId);
    if (!businessCase?.phases || businessCase.phases.length === 0) return null;

    const phases = businessCase.phases || [];
    return (
      <Box sx={{ 
        marginTop: 3,
        border: '1px dashed rgba(255, 255, 255, 0.2)',
        padding: 2,
        borderRadius: 1
      }}>
        <Typography variant="body2" sx={{ marginBottom: 1, fontWeight: 'bold' }}>
          Aktuálna časová os fáz (zľava doprava):
        </Typography>
        <Box sx={{
          display: 'flex',
          gap: 1,
          overflowX: 'auto',
          padding: '4px 0'
        }}>
          {phases.map((phase: Phase, index: number) => (
            <Box
              key={phase.id}
              sx={{
                backgroundColor: phaseColors[index % phaseColors.length],
                color: '#fff',
                borderRadius: '8px',
                padding: '6px 10px',
                fontSize: '0.75rem',
                position: 'relative',
                whiteSpace: 'nowrap',
                '&::after': index < phases.length - 1 ? {
                  content: '""',
                  position: 'absolute',
                  right: '-8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '8px',
                  height: '8px',
                  borderTop: '4px solid transparent',
                  borderBottom: '4px solid transparent',
                  borderLeft: `4px solid ${phaseColors[index % phaseColors.length]}`,
                  zIndex: 1
                } : {}
              }}
            >
              {phase.name}
            </Box>
          ))}
          <Box
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '0.75rem',
              border: '1px dashed #fff',
              display: 'flex',
              alignItems: 'center',
              gap: 0.5
            }}
          >
            <AddIcon sx={{ fontSize: '0.9rem' }} />
            Nová fáza
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle isDarkMode={isDarkMode}>Obchodné prípady</PageTitle>
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
                createdBy: null,
                createdAt: null
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
            Pridať prípad
          </Button>
        </Box>
      </PageHeader>

      {/* Mobilné tlačidlo */}
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
              createdBy: null,
              createdAt: null
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
            Pridať prípad
          </Box>
        </AddButton>
      </Box>

      <SearchWrapper>
        <SearchField
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          label="Vyhľadať prípad"
        />
      </SearchWrapper>

      <Box sx={{ display: 'flex', gap: 2, marginBottom: 2 }}>
        <Button variant={dateFilter === 'all' ? 'contained' : 'outlined'} onClick={() => handleDateFilterChange('all')}>
          Všetky
        </Button>
        <Button variant={dateFilter === 'today' ? 'contained' : 'outlined'} onClick={() => handleDateFilterChange('today')}>
          Dnes
        </Button>
        <Button variant={dateFilter === 'thisWeek' ? 'contained' : 'outlined'} onClick={() => handleDateFilterChange('thisWeek')}>
          Tento týždeň
        </Button>
        <Button variant={dateFilter === 'thisMonth' ? 'contained' : 'outlined'} onClick={() => handleDateFilterChange('thisMonth')}>
          Tento mesiac
        </Button>
        <Button variant={dateFilter === 'thisYear' ? 'contained' : 'outlined'} onClick={() => handleDateFilterChange('thisYear')}>
          Tento rok
        </Button>
      </Box>

      {/* Mobilné zobrazenie */}
      <Box sx={{ 
        display: { 
          xs: 'block', 
          md: 'none' 
        }
      }}>
        {filteredCases.map((businessCase: BusinessCase) => (
          <Box key={businessCase.id}>
            {renderMobileCase(businessCase)}
          </Box>
        ))}
      </Box>

      {/* Desktop zobrazenie */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          display: { 
            xs: 'none', 
            md: 'block' 
          },
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
              <TableCell>Dátum vytvorenia</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Firma</TableCell>
              <TableCell>Kontaktná osoba</TableCell>
              <TableCell>Telefón</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Vytvoril</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCases.map((businessCase) => (
              <React.Fragment key={businessCase.id}>
                <StyledTableRow isDarkMode={isDarkMode} onClick={() => handleRowClick(businessCase.id!)}>
                  <TableCell>
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
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={caseStatuses[businessCase.status].label}
                      color={caseStatuses[businessCase.status].color}
                      size="small"
                      sx={{
                        fontSize: {
                          xs: '0.7rem',
                          sm: '0.8rem'
                        },
                        height: {
                          xs: '24px',
                          sm: '32px'
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>{businessCase.companyName}</TableCell>
                  <TableCell>{businessCase.contactPerson.firstName} {businessCase.contactPerson.lastName}</TableCell>
                  <TableCell>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      '& img': {
                        width: {
                          xs: '16px',
                          sm: '20px'
                        }
                      }
                    }}>
                      <img
                        loading="lazy"
                        src={`https://flagcdn.com/${businessCase.countryCode?.toLowerCase()}.svg`}
                        alt=""
                      />
                      {businessCase.contactPerson.phone}
                    </Box>
                  </TableCell>
                  <TableCell>{businessCase.contactPerson.email}</TableCell>
                  <TableCell>
                    {businessCase.createdBy?.firstName} {businessCase.createdBy?.lastName}
                  </TableCell>
                </StyledTableRow>
                {expandedCaseId === businessCase.id && (
                  <StyledTableRow isDarkMode={isDarkMode}>
                    <TableCell colSpan={7}>
                      <Box sx={{ padding: 2 }}>
                        <Typography variant="h6" sx={{ marginBottom: 1 }}>Detail obchodného prípadu</Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                          <Box>
                            <Typography variant="body2"><strong>Dátum vytvorenia:</strong> {businessCase.createdAt instanceof Timestamp ? 
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
                              }).replace(',', '')}</Typography>
                            <Typography variant="body2"><strong>Status:</strong> {caseStatuses[businessCase.status].label}</Typography>
                            <Typography variant="body2"><strong>Firma:</strong> {businessCase.companyName}</Typography>
                            <Typography variant="body2"><strong>IČ DPH:</strong> {businessCase.vatNumber}</Typography>
                            {businessCase.internalNote && (
                              <Typography variant="body2" sx={{ marginTop: 1 }}><strong>Interná poznámka:</strong> {businessCase.internalNote}</Typography>
                            )}
                          </Box>
                          <Box>
                            <Typography variant="body2"><strong>Kontaktná osoba:</strong> {businessCase.contactPerson.firstName} {businessCase.contactPerson.lastName}</Typography>
                            <Typography variant="body2"><strong>Telefón:</strong> {businessCase.contactPerson.phone}</Typography>
                            <Typography variant="body2"><strong>Email:</strong> {businessCase.contactPerson.email}</Typography>
                            {businessCase.reminderDateTime && (
                              <Typography variant="body2"><strong>Pripomienka:</strong> {convertToDate(businessCase.reminderDateTime)?.toLocaleString('sk-SK', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }).replace(',', '')}</Typography>
                            )}
                            {businessCase.reminderNote && (
                              <Typography variant="body2" sx={{ marginTop: 1 }}><strong>Poznámka k pripomienke:</strong> {businessCase.reminderNote}</Typography>
                            )}
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                          <Typography variant="body2" sx={{ textAlign: 'left', marginLeft: 0 }}><strong>Vytvoril:</strong> {businessCase.createdBy?.firstName} {businessCase.createdBy?.lastName}</Typography>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Upraviť">
                              <IconButton 
                                onClick={() => handleEdit(businessCase)}
                                sx={{ 
                                  color: colors.accent.main,
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 159, 67, 0.1)'
                                  }
                                }}
                              >
                                <EditIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Vymazať">
                              <IconButton 
                                onClick={() => handleDelete(businessCase.id!)}
                                sx={{ 
                                  color: colors.secondary.main,
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 107, 107, 0.1)'
                                  }
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                        <Box sx={{ marginTop: 2 }}>
                          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            Fázy obchodu
                            <IconButton onClick={() => setPhaseDialogOpen(true)} sx={{ color: colors.accent.main }}>
                              <AddIcon />
                            </IconButton>
                          </Typography>
                          <Box sx={{ 
                            marginTop: 1, 
                            display: 'flex', 
                            gap: 1, 
                            flexWrap: 'nowrap',
                            overflowX: 'auto',
                            padding: '4px 0',
                            '&::-webkit-scrollbar': {
                              height: '6px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                              background: 'rgba(0, 0, 0, 0.2)',
                              borderRadius: '3px',
                            },
                          }}>
                            {businessCase.phases?.map((phase, index) => (
                              <Chip
                                key={phase.id}
                                label={
                                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <Typography sx={{ fontSize: '0.8rem', whiteSpace: 'normal', overflow: 'visible', paddingRight: '5px' }}>
                                      {`${phase.name} - ${
                                        phase.createdAt instanceof Date ? 
                                        phase.createdAt.toLocaleString('sk-SK', {
                                          day: '2-digit',
                                          month: '2-digit',
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        }) : 
                                        'Neznámy dátum'
                                      }`}
                                    </Typography>
                                    <IconButton 
                                      size="small" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        handleDeletePhase(businessCase.id!, phase.id);
                                      }}
                                      sx={{ ml: 1, p: 0.5 }}
                                    >
                                      <DeleteIcon sx={{ color: '#ffffff', fontSize: '0.9rem' }} />
                                    </IconButton>
                                  </Box>
                                }
                                sx={{
                                  backgroundColor: phaseColors[index % phaseColors.length],
                                  color: '#ffffff',
                                  borderRadius: '16px',
                                  '& .MuiChip-label': {
                                    padding: '6px 8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%'
                                  },
                                  height: 'auto',
                                  minHeight: '36px',
                                  fontSize: '0.85rem',
                                  minWidth: '280px',
                                  maxWidth: '280px',
                                  flex: '0 0 auto',
                                  position: 'relative',
                                  '&::after': index < (businessCase.phases?.length || 0) - 1 ? {
                                    content: '""',
                                    position: 'absolute',
                                    right: '-12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    width: '10px',
                                    height: '10px',
                                    borderTop: '5px solid transparent',
                                    borderBottom: '5px solid transparent',
                                    borderLeft: `5px solid ${phaseColors[index % phaseColors.length]}`,
                                    zIndex: 1
                                  } : {}
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      </Box>
                    </TableCell>
                  </StyledTableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
            createdBy: null,
            createdAt: null
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
            {editCase ? 'Upraviť obchodný prípad' : 'Pridať nový obchodný prípad'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Názov firmy"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="IČ DPH"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Adresa spoločnosti"
                    value={formData.companyAddress}
                    onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Meno"
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
                    label="Priezvisko"
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
                      label="Telefónne číslo"
                      value={formData.contactPerson.phone?.replace(selectedCountry.prefix, '') || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        contactPerson: { ...formData.contactPerson, phone: selectedCountry.prefix + e.target.value }
                      })}
                      placeholder="9XX XXX XXX"
                      helperText="Zadajte telefónne číslo"
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
                    label="Email"
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
                    label="Interná poznámka"
                    multiline
                    rows={4}
                    value={formData.internalNote}
                    onChange={(e) => setFormData({ ...formData, internalNote: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as keyof typeof caseStatuses })}
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
                      label="Dátum a čas pripomienky"
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
                    label="Poznámka k pripomienke"
                    multiline
                    rows={2}
                    value={formData.reminderNote}
                    onChange={(e) => setFormData({ ...formData, reminderNote: e.target.value })}
                    placeholder="Zadajte text pripomienky, ktorý vám príde emailom"
                    helperText="Tento text vám príde emailom v čase pripomienky"
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
              Zrušiť
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
              {loading ? <CircularProgress size={24} sx={{ color: '#ffffff' }} /> : 'Uložiť'}
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
            Potvrdiť vymazanie
          </DialogTitle>
          <DialogContent>
            <Typography>
              Naozaj chcete vymazať tento obchodný prípad? Táto akcia je nenávratná.
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
              Zrušiť
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
              Vymazať
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
          <DialogTitle>Pridať fázu obchodu</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Typography variant="body2">Vyberte alebo pridajte vlastný krok. Nová fáza sa pridá na koniec časovej osi (napravo).</Typography>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: 1, 
                marginTop: 2 
              }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1, 
                  alignItems: 'center', 
                  marginBottom: 1 
                }}>
                  <Chip 
                    label="Stretnutie" 
                    onClick={() => handleAddPhase('Stretnutie', expandedCaseId!)} 
                    sx={{ backgroundColor: phaseColors[0], color: '#fff' }} 
                  />
                  <Chip 
                    label="Hovor" 
                    onClick={() => handleAddPhase('Hovor', expandedCaseId!)} 
                    sx={{ backgroundColor: phaseColors[1], color: '#fff' }} 
                  />
                  <Chip 
                    label="Mail" 
                    onClick={() => handleAddPhase('Mail', expandedCaseId!)} 
                    sx={{ backgroundColor: phaseColors[2], color: '#fff' }} 
                  />
                  <Chip 
                    label="Videohovor" 
                    onClick={() => handleAddPhase('Videohovor', expandedCaseId!)} 
                    sx={{ backgroundColor: phaseColors[3], color: '#fff' }} 
                  />
                </Box>
                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}>
                  <TextField
                    placeholder="Pridať vlastný krok"
                    variant="outlined"
                    size="small"
                    fullWidth
                    sx={{ marginTop: 1 }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const inputValue = (e.target as HTMLInputElement).value;
                        handleAddPhase(inputValue, expandedCaseId!);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }}
                  />
                  <IconButton
                    onClick={(e) => {
                      const input = e.currentTarget.previousElementSibling?.querySelector('input');
                      if (input && input.value) {
                        handleAddPhase(input.value, expandedCaseId!);
                        input.value = '';
                      }
                    }}
                    sx={{ 
                      marginTop: 1,
                      backgroundColor: colors.accent.main,
                      color: '#fff',
                      '&:hover': {
                        backgroundColor: colors.accent.light,
                      }
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>
              
              {expandedCaseId && renderPhasesTimeline(expandedCaseId)}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPhaseDialogOpen(false)} sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}>
              Zrušiť
            </Button>
          </DialogActions>
        </StyledDialogContent>
      </Dialog>
    </PageWrapper>
  );
} 