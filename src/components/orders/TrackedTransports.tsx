import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  styled,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Tooltip,
  Divider,
  useTheme,
  Snackbar,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { sk } from 'date-fns/locale';
import { collection, query, where, getDocs, addDoc, doc as firestoreDoc, updateDoc, Timestamp, orderBy, deleteDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import NotificationsIcon from '@mui/icons-material/Notifications';
import RouteIcon from '@mui/icons-material/Route';
import SearchField from '../common/SearchField';
import TransportMap from '../common/TransportMap';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import { useThemeMode } from '../../contexts/ThemeContext';
import { v4 as uuidv4 } from 'uuid';

// Pomocná funkcia na konverziu dátumu
const convertToDate = (dateTime: Date | Timestamp | string | null | undefined): Date | null => {
  if (!dateTime) return null;
  if (dateTime instanceof Date) return dateTime;
  if (dateTime instanceof Timestamp) return dateTime.toDate();
  try {
    // Skúsime parsovať string, ak by to bol ISO string alebo podobný
    const parsedDate = new Date(dateTime);
    // Skontrolujeme, či je dátum platný
    if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
    }
  } catch (e) {
    console.error("Error parsing date string:", e);
  }
  return null; // Vráti null ak konverzia zlyhá
};

interface Transport {
  id: string;
  orderNumber: string;
  loadingAddress: string;
  loadingDateTime: Date | Timestamp;
  loadingReminder: number;
  unloadingAddress: string;
  unloadingDateTime: Date | Timestamp;
  unloadingReminder: number;
  status: string;
  createdAt: Date | Timestamp;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  isDelayed: boolean;
  distance?: string;
  companyID: string;
  duration?: string;
}

interface TransportFormData {
  orderNumber: string;
  loadingAddress: string;
  loadingDateTime?: Date | Timestamp | null;
  loadingReminder: number;
  unloadingAddress: string;
  unloadingDateTime?: Date | Timestamp | null;
  unloadingReminder: number;
}

// Importujeme farebnú paletu z Navbar
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

const PageTitle = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
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
  },
  '@media (max-width: 600px)': {
    width: '100%',
    padding: '12px',
    fontSize: '0.9rem'
  }
});

const TransportCard = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ _theme, isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.75)' : '#ffffff',
  borderRadius: '16px',
  padding: '16px',
  color: isDarkMode ? '#ffffff' : '#000000',
  boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
  marginBottom: '16px',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(255, 159, 67, 0.3)',
    border: '1px solid rgba(255, 159, 67, 0.3)',
    '& .MuiCardContent-root': {
      background: 'linear-gradient(180deg, rgba(255, 159, 67, 0.1) 0%, rgba(255, 159, 67, 0) 100%)',
    }
  }
}));

const CreatorInfo = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.9rem',
  color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
  '& .MuiSvgIcon-root': {
    fontSize: '1.1rem',
    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  }
}));

const InfoChip = styled(Box)<{ variant?: 'status' | 'distance' }>(({ variant, _theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 12px',
  borderRadius: '12px',
  fontSize: '0.9rem',
  fontWeight: 500,
  backgroundColor: variant === 'status' 
    ? 'rgba(255, 159, 67, 0.15)' 
    : 'rgba(255, 159, 67, 0.1)',
  color: '#ff9f43',
  '& .MuiSvgIcon-root': {
    fontSize: '1rem'
  }
}));

const SearchWrapper = styled(Box)({
  marginBottom: '24px',
  width: '100%',
  '@media (max-width: 600px)': {
    marginBottom: '16px'
  }
});

const MapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
    margin: 0,
    maxWidth: '100%',
    width: '100%',
    height: '100%',
    borderRadius: 0,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    '& .MuiDialogTitle-root': {
      color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
      padding: '16px 24px',
      fontSize: '1.5rem',
      fontWeight: 600,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      zIndex: 10
    },
    '& .MuiDialogContent-root': {
      padding: 0,
      height: 'calc(100% - 64px)',
      overflow: 'hidden'
    }
  },
  '& .MuiBackdrop-root': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(0, 0, 0, 0.7)' 
      : 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
  }
}));

const MobileTransportHeader = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
  color: isDarkMode ? '#ffffff' : '#000000'
}));

const MobileTransportTitle = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  justifyContent: 'center',
  alignItems: 'center',
});

const MobileTransportNumber = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: isDarkMode ? colors.accent.main : '#000000'
}));

const MobileTransportInfo = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  color: isDarkMode ? '#ffffff' : '#000000'
}));

const MobileTransportLocation = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
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

const MobileTransportTime = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  fontSize: '0.85rem',
  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  '& .time-label': {
    fontWeight: 600,
    color: isDarkMode ? '#ffffff' : '#000000',
    marginBottom: '4px'
  },
  '& .time-row': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: '24px',
    '& .MuiSvgIcon-root': {
      fontSize: '1rem',
    }
  },
  '& .reminder-info': {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginLeft: '24px',
    color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    fontSize: '0.8rem',
    '& .MuiSvgIcon-root': {
      fontSize: '0.9rem',
      color: colors.accent.light
    }
  }
}));

const MobileTransportActions = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '12px'
});

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

// Hook pre zobrazovanie pripomienok

// Jednoduchý hook pre notifikácie
function useNotifications() {
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [hasPermission, setHasPermission] = useState(false);
  
  // Kontrola povolení pre notifikácie
  useEffect(() => {
    if (!("Notification" in window)) {
      console.log("Tento prehliadač nepodporuje notifikácie");
      return;
    }
    
    if (Notification.permission === "granted") {
      setHasPermission(true);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then(permission => {
        setHasPermission(permission === "granted");
      });
    }
  }, []);
  
  // Zobrazenie notifikácie v prehliadači
  const showNotification = useCallback((title: string, body: string) => {
    // Zobrazí in-app notifikáciu
    setNotificationMessage(`${title}: ${body}`);
    setNotificationVisible(true);
    
    // Ak máme povolenie, zobrazí aj prehliadačovú notifikáciu
    if (hasPermission) {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/logo192.png'
        });
        
        notification.onclick = () => {
          window.focus();
        };
      } catch (error) {
        console.error("Chyba pri zobrazení notifikácie:", error);
      }
    }
  }, [hasPermission]);
  
  // Skrytie notifikácie
  const hideNotification = useCallback(() => {
    setNotificationVisible(false);
  }, []);
  
  return {
    showNotification,
    hideNotification,
    notificationVisible,
    notificationMessage
  };
}

const TrackedTransports: React.FC = () => {
  const theme = useTheme();
  const { userData } = useAuth();
  const { isDarkMode } = useThemeMode();
  const [transports, setTransports] = useState<Transport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [transportToDelete, setTransportToDelete] = useState<Transport | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mapTransport, setMapTransport] = useState<Transport & { duration?: string } | null>(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [showAddTransportDialog, setShowAddTransportDialog] = useState(false);
  const [editingTransport, setEditingTransport] = useState<Transport | null>(null);
  const [transportFormData, setTransportFormData] = useState<Partial<TransportFormData>>({
    orderNumber: '',
    loadingAddress: '',
    loadingDateTime: null,
    loadingReminder: 15,
    unloadingAddress: '',
    unloadingDateTime: null,
    unloadingReminder: 15,
  });
  const [selectedTransportForMap, setSelectedTransportForMap] = useState<Transport | null>(null);
  
  // Používame jednoduchý hook pre notifikácie
  const { 
    showNotification, 
    hideNotification, 
    notificationVisible, 
    notificationMessage 
  } = useNotifications();
  
  // Pravidelná kontrola pripomienok
  useEffect(() => {
    if (!userData?.companyID) return;
    
    console.log("Nastavujem pravidelné kontrolovanie pripomienok...");
    
    // Kontrola pripomienok každú minútu
    const checkInterval = setInterval(() => {
      checkForDueReminders();
    }, 30000); // každých 30 sekúnd
    
    // Prvá kontrola pri načítaní
    checkForDueReminders();
    
    function checkForDueReminders() {
      if (!userData?.companyID) return;
      
      const now = new Date();
      const startTime = new Date(now.getTime() - 5 * 60000);  // 5 minút do minulosti
      const endTime = new Date(now.getTime() + 5 * 60000);    // 5 minút do budúcnosti
      
      console.log(`Kontrolujem pripomienky (${now.toLocaleTimeString()})...`);
      
      // Dotaz na pripomienky v časovom okne
      const remindersRef = collection(db, 'reminders');
      
      getDocs(query(
        remindersRef,
        where('companyID', '==', userData.companyID)
      )).then(snapshot => {
        if (snapshot.empty) {
          console.log("Žiadne pripomienky nenájdené");
          return;
        }
        
        console.log(`Nájdených celkom pripomienok: ${snapshot.size}`);
        
        // Filtrujeme pripomienky v pamäti
        snapshot.forEach(doc => {
          const reminder = doc.data();
          if (!reminder.reminderTime) return;
          
          const reminderTime = reminder.reminderTime instanceof Timestamp
            ? reminder.reminderTime.toDate()
            : new Date(reminder.reminderTime);
          
          // Ak je pripomienka v našom časovom okne a ešte nebola odoslaná
          if (reminderTime >= startTime && 
              reminderTime <= endTime && 
              reminderTime <= now &&
              reminder.sent !== true) {
            
            console.log(`Zobrazujem pripomienku: ${reminder.orderNumber} - ${reminder.type}`);
            
            // Zobrazíme notifikáciu
            const type = reminder.type === 'loading' ? 'nakládky' : 'vykládky';
            showNotification(
              `Pripomienka ${type}`,
              `Objednávka: ${reminder.orderNumber} - Adresa: ${reminder.address}`
            );
            
            // Označíme pripomienku ako zobrazenú
            updateDoc(firestoreDoc(db, 'reminders', doc.id), {
              sent: true
            }).catch(err => {
              console.error("Chyba pri označovaní pripomienky:", err);
            });
          }
        });
      }).catch(err => {
        console.error("Chyba pri načítavaní pripomienok:", err);
      });
    }
    
    // Vyčistenie pri odmontovaní
    return () => {
      clearInterval(checkInterval);
    };
  }, [userData?.companyID, showNotification]);

  const handleConfirmDelete = async () => {
    if (!transportToDelete) return;

    try {
      // Vymazanie prepravy
      await deleteDoc(firestoreDoc(db, 'transports', transportToDelete.id));

      // Vymazanie súvisiacich pripomienok
      const remindersQuery = query(
        collection(db, 'reminders'),
        where('transportId', '==', transportToDelete.id)
      );
      const remindersSnapshot = await getDocs(remindersQuery);
      
      const deletePromises = remindersSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Aktualizácia UI
      setTransports((prevTransports: Transport[]) => 
        prevTransports.filter((t: Transport) => t.id !== transportToDelete.id)
      );

      setDeleteConfirmOpen(false);
      setTransportToDelete(null);
    } catch (err: any) {
      setError('Nastala chyba pri vymazávaní prepravy: ' + err.message);
    }
  };

  const handleShowMap = (transport: Transport) => {
    console.log("handleShowMap called for transport:", transport.id);
    setMapTransport(transport);
    setMapDialogOpen(true);
    console.log("Map dialog should be open now.");
  };

  const handleOpenAddTransportDialog = () => {
    setEditingTransport(null);
    setTransportFormData({
      orderNumber: '',
      loadingAddress: '',
      loadingDateTime: null,
      loadingReminder: 15,
      unloadingAddress: '',
      unloadingDateTime: null,
      unloadingReminder: 15,
    });
    setShowAddTransportDialog(true);
  };

  const handleCloseAddTransportDialog = () => {
    setShowAddTransportDialog(false);
  };

  const handleFormChange = (field: keyof TransportFormData, value: any) => {
    setTransportFormData(prev => ({ ...prev, [field]: value }));
    // Vymažeme validačnú chybu pri zmene
    if (validationError) setValidationError(null);
  };

  const handleAddOrUpdateTransport = async () => {
    setIsSaving(true);
    setValidationError(null);
    
    // Validácia formulára
    if (!transportFormData.orderNumber || !transportFormData.loadingAddress || !transportFormData.unloadingAddress || 
        !transportFormData.loadingDateTime || !transportFormData.unloadingDateTime) {
      setValidationError("Vyplňte všetky povinné polia");
      setIsSaving(false);
      return;
    }
    
    try {
      if (!userData) {
        throw new Error("Používateľ nie je prihlásený");
      }
      
      const transportId = editingTransport?.id || uuidv4();
      
      // Príprava dát pre uloženie
      const dataToSave: any = {
        orderNumber: transportFormData.orderNumber,
        loadingAddress: transportFormData.loadingAddress,
        loadingDateTime: convertToDate(transportFormData.loadingDateTime),
        loadingReminder: transportFormData.loadingReminder,
        unloadingAddress: transportFormData.unloadingAddress,
        unloadingDateTime: convertToDate(transportFormData.unloadingDateTime),
        unloadingReminder: transportFormData.unloadingReminder,
        status: editingTransport?.status || 'V príprave',
        companyID: userData.companyID,
        userId: userData.uid, // Pridané userId pre notifikácie
        userEmail: userData.email, // Pridané userEmail pre notifikácie
        companyName: userData.companyName || '', // Pridané companyName pre notifikácie
      };
      
      if (!editingTransport) {
        // Nová preprava - pridávame ďalšie údaje
        dataToSave.createdAt = serverTimestamp();
        dataToSave.createdBy = {
          firstName: userData.firstName || '',
          lastName: userData.lastName || ''
        };
      }
      
      const transportRef = firestoreDoc(db, 'transports', transportId);
      
      console.log("Ukladám prepravu:", dataToSave);
      
      // Uloženie do Firestore
      if (editingTransport) {
        await updateDoc(transportRef, dataToSave);
        setSnackbar({ open: true, message: 'Preprava bola úspešne aktualizovaná', severity: 'success' });
      } else {
        await setDoc(transportRef, dataToSave);
        setSnackbar({ open: true, message: 'Preprava bola úspešne vytvorená', severity: 'success' });
      }
      
      // Vytvorenie pripomienok
      const remindersCollection = collection(db, 'reminders');
      
      // Pripomienka pre nakládku
      const loadingReminderTime = new Date(convertToDate(dataToSave.loadingDateTime)!.getTime() - dataToSave.loadingReminder * 60000);
      const formattedLoadingTime = format(convertToDate(dataToSave.loadingDateTime)!, 'dd.MM.yyyy HH:mm');
      const loadingReminderData = {
        type: 'loading',
        reminderTime: Timestamp.fromDate(new Date(loadingReminderTime)),
        reminderDateTime: Timestamp.fromDate(new Date(loadingReminderTime)),
        orderNumber: dataToSave.orderNumber,
        address: dataToSave.loadingAddress,
        sent: false,
        shown: false,
        createdAt: serverTimestamp(),
        userEmail: userData?.email,
        userId: userData?.uid,
        transportId: transportId,
        reminderNote: `Pripomienka nakládky pre objednávku ${dataToSave.orderNumber} dňa ${formattedLoadingTime} na adrese ${dataToSave.loadingAddress}`,
        companyID: userData?.companyID,
        companyName: userData?.companyName || '',
        transportDetails: {
          loadingAddress: dataToSave.loadingAddress,
          loadingDateTime: Timestamp.fromDate(convertToDate(dataToSave.loadingDateTime)!),
          unloadingAddress: dataToSave.unloadingAddress,
          unloadingDateTime: Timestamp.fromDate(convertToDate(dataToSave.unloadingDateTime)!)
        }
      };
      
      // Pripomienka pre vykládku
      const unloadingReminderTime = new Date(convertToDate(dataToSave.unloadingDateTime)!.getTime() - dataToSave.unloadingReminder * 60000);
      const formattedUnloadingTime = format(convertToDate(dataToSave.unloadingDateTime)!, 'dd.MM.yyyy HH:mm');
      const unloadingReminderData = {
        type: 'unloading',
        reminderTime: Timestamp.fromDate(new Date(unloadingReminderTime)),
        reminderDateTime: Timestamp.fromDate(new Date(unloadingReminderTime)),
        orderNumber: dataToSave.orderNumber,
        address: dataToSave.unloadingAddress,
        sent: false,
        shown: false,
        createdAt: serverTimestamp(),
        userEmail: userData?.email,
        userId: userData?.uid,
        transportId: transportId,
        reminderNote: `Pripomienka vykládky pre objednávku ${dataToSave.orderNumber} dňa ${formattedUnloadingTime} na adrese ${dataToSave.unloadingAddress}`,
        companyID: userData?.companyID,
        companyName: userData?.companyName || '',
        transportDetails: {
          loadingAddress: dataToSave.loadingAddress,
          loadingDateTime: Timestamp.fromDate(convertToDate(dataToSave.loadingDateTime)!),
          unloadingAddress: dataToSave.unloadingAddress,
          unloadingDateTime: Timestamp.fromDate(convertToDate(dataToSave.unloadingDateTime)!)
        }
      };
      
      // Uloženie pripomienok
      const loadingReminderRef = await addDoc(remindersCollection, loadingReminderData);
      const unloadingReminderRef = await addDoc(remindersCollection, unloadingReminderData);
      
      console.log("Vytvorené pripomienky:", { 
        loading: { id: loadingReminderRef.id, ...loadingReminderData },
        unloading: { id: unloadingReminderRef.id, ...unloadingReminderData }
      });
      
      handleCloseAddTransportDialog();
      fetchTransports(); 

    } catch (error: any) {
      console.error("Chyba pri ukladaní prepravy:", error);
      setValidationError("Nastala chyba pri ukladaní: " + error.message);
      setSnackbar({ open: true, message: 'Chyba pri ukladaní prepravy', severity: 'error' });
    } finally {
      setIsSaving(false); 
    }
  };

  const handleOpenEditTransportDialog = (transport: Transport) => {
    console.log("Editing transport:", transport);
    setEditingTransport(transport); 
    setTransportFormData({ 
      orderNumber: transport.orderNumber,
      loadingAddress: transport.loadingAddress,
      loadingDateTime: transport.loadingDateTime, 
      loadingReminder: transport.loadingReminder,
      unloadingAddress: transport.unloadingAddress,
      unloadingDateTime: transport.unloadingDateTime, 
      unloadingReminder: transport.unloadingReminder,
    });
    setShowAddTransportDialog(true); 
  };

  // Renderovacia funkcia pre kartu/riadok prepravy
  const renderTransportItem = (transport: Transport) => (
    <TransportCard 
      key={transport.id} 
      isDarkMode={isDarkMode}
      sx={{ 
      }}
    >
      <Grid container spacing={2} sx={{ flexGrow: 1 }}>
        <Grid item xs={12} md={7}>
          <MobileTransportHeader isDarkMode={isDarkMode}>
            <MobileTransportTitle>
              <MobileTransportNumber isDarkMode={isDarkMode}>
                {transport.orderNumber ? `Objednávka: ${transport.orderNumber}` : 'Bez čísla objednávky'}
              </MobileTransportNumber>
              <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                {transport.distance && (
                  <InfoChip variant="distance" sx={{ p: '4px 8px' }}>
                    <RouteIcon sx={{ fontSize: '1rem' }}/>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {transport.distance}
                    </Typography>
                  </InfoChip>
                )}
                {transport.duration && (
                  <InfoChip variant="distance" sx={{ p: '4px 8px' }}>
                    <AccessTimeIcon sx={{ fontSize: '1rem' }}/>
                    <Typography variant="caption" sx={{ fontWeight: 500 }}>
                      {transport.duration}
                    </Typography>
                  </InfoChip>
                )}
              </Box>
            </MobileTransportTitle>
            <InfoChip variant="status">
              {transport.status}
            </InfoChip>
          </MobileTransportHeader>
          
          <MobileTransportInfo isDarkMode={isDarkMode} sx={{ mt: 1 }}>
            <Box>
              <MobileTransportLocation isDarkMode={isDarkMode}>
                <LocationOnIcon />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Nakládka:</Typography>
                  {transport.loadingAddress}
                </Box>
              </MobileTransportLocation>
              <MobileTransportTime isDarkMode={isDarkMode} sx={{ mt: 1 }}>
                 <div className="time-row">
                   <AccessTimeIcon />
                   {format(convertToDate(transport.loadingDateTime)!, 'dd.MM.yyyy HH:mm', { locale: sk })}
                 </div>
                 <div className="reminder-info">
                   <NotificationsIcon />
                   {transport.loadingReminder} minút pred nakládkou
                   (o {format(new Date(convertToDate(transport.loadingDateTime)!.getTime() - transport.loadingReminder * 60000), 'HH:mm')})
                 </div>
              </MobileTransportTime>
            </Box>
            <Divider sx={{ my: 1.5 }} />
            <Box>
              <MobileTransportLocation isDarkMode={isDarkMode}>
                <LocationOnIcon />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Vykládka:</Typography>
                  {transport.unloadingAddress}
                </Box>
              </MobileTransportLocation>
              <MobileTransportTime isDarkMode={isDarkMode} sx={{ mt: 1 }}>
                 <div className="time-row">
                   <AccessTimeIcon />
                   {format(convertToDate(transport.unloadingDateTime)!, 'dd.MM.yyyy HH:mm', { locale: sk })}
                 </div>
                 <div className="reminder-info">
                   <NotificationsIcon />
                   {transport.unloadingReminder} minút pred vykládkou
                   (o {format(new Date(convertToDate(transport.unloadingDateTime)!.getTime() - transport.unloadingReminder * 60000), 'HH:mm')})
                 </div>
              </MobileTransportTime>
            </Box>
            <CreatorInfo isDarkMode={isDarkMode} sx={{ mt: 1.5, pt: 1.5, borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` }}>
               <PersonIcon /> Vytvoril: {transport.createdBy?.firstName} {transport.createdBy?.lastName}
               <Box component="span" sx={{ mx: 1 }}>•</Box>
               <AccessTimeIcon /> {format(convertToDate(transport.createdAt)!, 'dd.MM.yyyy HH:mm')}
            </CreatorInfo>
          </MobileTransportInfo>
        </Grid>

        <Grid item xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' }, minHeight: '250px' }}>
           <Box 
             sx={{ 
                height: '100%', 
                width: '100%', 
                borderRadius: '12px', 
                overflow: 'hidden', 
                cursor: 'pointer',
                position: 'relative',
                '&:hover': {
                    boxShadow: `0 4px 15px ${colors.accent.main}33`,
                }
             }}
             onClick={() => handleShowMap(transport)}
           >
              <TransportMap
                  key={`${transport.id}-map`} 
                  origin={transport.loadingAddress}
                  destination={transport.unloadingAddress}
                  isThumbnail={false}
                  onDirectionsChange={(directions, distance, _uration) => {
                      if (distance && !transport.distance) {
                          const updates = { distance: distance };
                          updateDoc(firestoreDoc(db, 'transports', transport.id), updates);
                          setTransports(prev => prev.map(t => t.id === transport.id ? { ...t, ...updates } : t));
                      }
                  }}
              />
           </Box>
        </Grid>
      </Grid>

      <MobileTransportActions onClick={() => console.log('Clicked on Actions wrapper!')}>
         <Tooltip title="Upraviť">
           <IconButton onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); handleOpenEditTransportDialog(transport); }} sx={{ color: colors.accent.main }}>
             <EditIcon />
           </IconButton>
         </Tooltip>
         <Tooltip title="Vymazať">
           <IconButton onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); setTransportToDelete(transport); setDeleteConfirmOpen(true); }} sx={{ color: colors.secondary.main }}>
             <DeleteIcon />
           </IconButton>
         </Tooltip>
         <Tooltip title="Zobraziť na mape (fullscreen)">
            <IconButton 
              onClick={(_: React.MouseEvent<HTMLButtonElement>) => { 
                console.log('Map IconButton onClick triggered!'); 
                handleShowMap(transport); 
              }} 
              sx={{ color: isDarkMode ? '#90caf9' : '#1976d2' }}
            >
                <LocationOnIcon />
            </IconButton>
         </Tooltip>
      </MobileTransportActions>
    </TransportCard>
  );

  // PRIDANÁ FUNKCIA fetchTransports S useCallback
  const fetchTransports = useCallback(async () => {
    if (!userData?.companyID) {
        console.log("Chýba companyID pre načítanie prepráv.");
        setTransports([]); // Vyprázdniť ak chýba ID
        setLoading(false);
        return;
    }
    setLoading(true);
    setError(null);
    try {
      const transportsQuery = query(
        collection(db, 'transports'),
        where('companyID', '==', userData.companyID),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(transportsQuery);
      const transportsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transport[];
      
      // Aktualizácia stavu pre každú prepravu (asynchrónne)
      const updatedTransports = await Promise.all(transportsData.map(async (transport) => {
         // Tu môžeme v budúcnosti pridať logiku na kontrolu statusu/meškania
         // napr. fetch aktuálnej polohy, porovnanie s časmi, atď.
         // Pre teraz len vrátime pôvodné dáta
         return transport;
      }));

      setTransports(updatedTransports);
    } catch (err: any) {
      setError('Chyba pri načítaní prepráv: ' + (err.message || err));
      console.error('Chyba pri načítaní prepráv:', err);
    } finally {
      setLoading(false);
    }
  }, [userData?.companyID]); // Závislosť na companyID

  // --- useEffect hooky ---
  
  // useEffect(() => {
  //   fetchTeamMembers();
  // }, [fetchTeamMembers]); // Ak teamMembers nie sú pre tento komponent potrebné, môžeme odstrániť

  // Hlavný useEffect pre načítanie dát pri montáži a zmene usera
  useEffect(() => {
    if (userData?.companyID) {
      console.log("Running initial/user change data fetch.");
      fetchTransports(); 
      // fetchCustomers(); // Ak sú potrebné pre formulár prepravy, inak odstrániť
      // fetchCarriers();  // Ak sú potrebné pre formulár prepravy, inak odstrániť
    } else {
      setTransports([]);
      // setCustomers([]);
      // setCarriers([]);
      setLoading(false); 
    }
  }, [userData?.companyID, fetchTransports]); // Pridaná fetchTransports závislosť

  // useEffect, ktorý nastaví mapu na prvú prepravu po načítaní
  useEffect(() => {
    if (!selectedTransportForMap && transports.length > 0) {
      setSelectedTransportForMap(transports[0]);
    }
    // Ak sa zoznam prepráv vyprázdni, resetneme aj mapu
    if (transports.length === 0) {
      setSelectedTransportForMap(null);
    }
  }, [transports, selectedTransportForMap]);

  const filteredTransports = transports.filter(transport => {
      const searchTermLower = searchTerm.toLowerCase();
      return (
        transport.orderNumber?.toLowerCase().includes(searchTermLower) ||
        transport.loadingAddress?.toLowerCase().includes(searchTermLower) ||
        transport.unloadingAddress?.toLowerCase().includes(searchTermLower) ||
        `${transport.createdBy?.firstName} ${transport.createdBy?.lastName}`.toLowerCase().includes(searchTermLower)
      );
  });

  if (loading && transports.length === 0) { // Zobrazíme loading len ak ešte nemáme žiadne dáta
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress sx={{ color: '#ff9f43' }} />
        </Box>
      </Container>
    );
  }

  return (
    <>
      <PageWrapper>
        <PageHeader>
          <PageTitle isDarkMode={isDarkMode}>Sledované prepravy</PageTitle>
          <AddButton
            startIcon={<AddIcon />}
            onClick={handleOpenAddTransportDialog}
          >
            Pridať prepravu
          </AddButton>
        </PageHeader>

        <SearchWrapper>
          <SearchField
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            label="Vyhľadať prepravu"
            placeholder="Zadajte číslo objednávky, adresu alebo meno"
          />
        </SearchWrapper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading && transports.length === 0 ? (
           <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
               <CircularProgress sx={{ color: '#ff9f43' }} />
           </Box>
        ) : ( 
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
             {filteredTransports.length === 0 && !loading && (
                  <Typography sx={{ textAlign: 'center', mt: 4, color: theme.palette.text.secondary }}>
                      Žiadne sledované prepravy nenájdené.
                  </Typography>
             )}
             {filteredTransports.map((transport) => renderTransportItem(transport))} 
          </Box>
        )}
      </PageWrapper>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
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
              Naozaj chcete vymazať túto prepravu? Táto akcia je nenávratná.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteConfirmOpen(false)}
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
              onClick={handleConfirmDelete}
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

      <MapDialog
        open={mapDialogOpen}
        onClose={() => setMapDialogOpen(false)}
        fullScreen
        TransitionProps={{
          onEntered: () => {
            // Trigger resize event pre správne načítanie mapy po zobrazení dialógu
            window.dispatchEvent(new Event('resize'));
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <Typography variant="h6">
              {mapTransport ? (
                <>
                  Detaily prepravy: {mapTransport.orderNumber || 'Bez čísla objednávky'}
                </>
              ) : 'Mapa prepravy'}
            </Typography>
            <IconButton onClick={() => setMapDialogOpen(false)} size="large" edge="end">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {mapTransport && (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Informačný panel */}
              <Box sx={{ 
                padding: '16px', 
                backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.8)' : 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(8px)',
                borderRadius: '0 0 12px 12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                mb: 2,
                zIndex: 5,
                position: 'relative',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderTop: 'none'
              }}>
                <Grid container spacing={2}>
                  {/* Súhrnné informácie o trase */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <RouteIcon sx={{ color: colors.accent.main, mr: 1 }} />
                      <Typography variant="h6" sx={{ fontWeight: 600, color: isDarkMode ? '#ffffff' : '#000000' }}>
                        Súhrn trasy:
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, ml: 4 }}>
                      <InfoChip variant="distance">
                        <RouteIcon />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Vzdialenosť: {mapTransport.distance || 'Načítava sa...'}
                        </Typography>
                      </InfoChip>
                      
                      {mapTransport.duration && (
                        <InfoChip variant="distance">
                          <AccessTimeIcon />
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            Odhadovaný čas jazdy: {mapTransport.duration}
                          </Typography>
                        </InfoChip>
                      )}
                    </Box>
                  </Grid>

                  {/* Vytvoril */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                      fontSize: '0.9rem',
                      justifyContent: 'flex-end'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <PersonIcon sx={{ fontSize: '1rem' }} />
                        Vytvoril: {mapTransport.createdBy?.firstName} {mapTransport.createdBy?.lastName}
                      </Box>
                      <Box component="span" sx={{ mx: 1 }}>•</Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <AccessTimeIcon sx={{ fontSize: '1rem' }} />
                        {format(mapTransport.createdAt instanceof Timestamp ? mapTransport.createdAt.toDate() : mapTransport.createdAt, 'dd.MM.yyyy HH:mm')}
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                {/* Detailný prehľad nakládky a vykládky */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', md: 'row' }, 
                  gap: 3, 
                  mt: 3,
                  justifyContent: 'space-between'
                }}>
                  {/* Nakládka */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      mb: 1,
                      color: isDarkMode ? '#ffffff' : '#000000',
                      '& .MuiSvgIcon-root': { color: colors.accent.main }
                    }}>
                      <LocationOnIcon />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Nakládka</Typography>
                    </Box>
                    
                    <Box sx={{ 
                      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
                      borderRadius: '8px',
                      p: 1.5,
                      border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                    }}>
                      <Typography sx={{ 
                        fontWeight: 500, 
                        mb: 0.5,
                        color: isDarkMode ? '#ffffff' : '#000000'
                      }}>
                        {mapTransport.loadingAddress}
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                        '& .MuiSvgIcon-root': { color: colors.accent.main, fontSize: '1rem' }
                      }}>
                        <AccessTimeIcon />
                        <Typography variant="body2">
                          {format(mapTransport.loadingDateTime instanceof Timestamp ? mapTransport.loadingDateTime.toDate() : mapTransport.loadingDateTime, 'dd.MM.yyyy HH:mm')}
                        </Typography>
                      </Box>

                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                        mt: 0.5,
                        fontSize: '0.85rem',
                        '& .MuiSvgIcon-root': { color: colors.accent.light, fontSize: '0.9rem' }
                      }}>
                        <NotificationsIcon />
                        <Typography variant="caption">
                          Pripomienka {mapTransport.loadingReminder} minút pred nakládkou
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Vykládka */}
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      mb: 1,
                      color: isDarkMode ? '#ffffff' : '#000000',
                      '& .MuiSvgIcon-root': { color: colors.accent.main }
                    }}>
                      <LocationOnIcon />
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Vykládka</Typography>
                    </Box>
                    
                    <Box sx={{ 
                      backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
                      borderRadius: '8px',
                      p: 1.5,
                      border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
                    }}>
                      <Typography sx={{ 
                        fontWeight: 500, 
                        mb: 0.5,
                        color: isDarkMode ? '#ffffff' : '#000000'
                      }}>
                        {mapTransport.unloadingAddress}
                      </Typography>
                      
                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                        '& .MuiSvgIcon-root': { color: colors.accent.main, fontSize: '1rem' }
                      }}>
                        <AccessTimeIcon />
                        <Typography variant="body2">
                          {format(mapTransport.unloadingDateTime instanceof Timestamp ? mapTransport.unloadingDateTime.toDate() : mapTransport.unloadingDateTime, 'dd.MM.yyyy HH:mm')}
                        </Typography>
                      </Box>

                      <Box sx={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                        mt: 0.5,
                        fontSize: '0.85rem',
                        '& .MuiSvgIcon-root': { color: colors.accent.light, fontSize: '0.9rem' }
                      }}>
                        <NotificationsIcon />
                        <Typography variant="caption">
                          Pripomienka {mapTransport.unloadingReminder} minút pred vykládkou
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Mapa na zvyšnú výšku */}
              <Box sx={{ flex: 1, position: 'relative' }}>
                <TransportMap
                  origin={mapTransport.loadingAddress}
                  destination={mapTransport.unloadingAddress}
                  isThumbnail={false}
                  onDirectionsChange={(directions, distance, duration) => {
                    if ((distance || duration) && mapTransport) {
                      let updates: { distance?: string; duration?: string } = {};
                      let stateUpdate = { ...mapTransport };
                      
                      // Aktualizovať vzdialenosť ak nie je nastavená alebo sa zmenila
                      if (distance && (!mapTransport.distance || mapTransport.distance !== distance)) {
                        updates.distance = distance;
                        stateUpdate.distance = distance;
                      }
                      
                      // Aktualizovať dobu trvania ak sa zmenila
                      if (duration && (!mapTransport.duration || mapTransport.duration !== duration)) {
                        updates.duration = duration;
                        stateUpdate.duration = duration;
                      }
                      
                      // Ak sú nejaké zmeny, aktualizovať Firestore
                      if (Object.keys(updates).length > 0) {
                        updateDoc(firestoreDoc(db, 'transports', mapTransport.id), updates);
                        
                        // Aktualizovať lokálny stav
                        setTransports(prevTransports => 
                          prevTransports.map(t => t.id === mapTransport.id ? { ...t, ...updates } : t)
                        );
                        
                        // Aktualizovať stav mapTransport
                        setMapTransport(stateUpdate);
                      }
                    }
                  }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
      </MapDialog>

      <Dialog 
        open={showAddTransportDialog} 
        onClose={handleCloseAddTransportDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            background: 'none', 
            boxShadow: 'none',
            margin: { xs: '8px', sm: '16px' },
            borderRadius: '24px'
          }
        }}
        BackdropProps={{
          sx: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.6)' }
        }}
      >
        <StyledDialogContent isDarkMode={isDarkMode}>
          <DialogTitle sx={{ mb: 2 }}>{editingTransport ? "Upraviť prepravu" : "Pridať novú prepravu"}</DialogTitle>
          <DialogContent>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField 
                  label="Číslo objednávky" 
                  value={transportFormData.orderNumber || ''} 
                  onChange={(e) => handleFormChange('orderNumber', e.target.value)} 
                  fullWidth 
                  required
                />
              </Grid>

              {/* Nakládka */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: colors.accent.main }}>Nakládka</Typography>
                <TextField 
                  label="Adresa nakládky" 
                  value={transportFormData.loadingAddress || ''} 
                  onChange={(e) => handleFormChange('loadingAddress', e.target.value)} 
                  fullWidth 
                  required 
                  sx={{ mb: 2 }}
                />
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                  <DateTimePicker 
                    label="Dátum a čas nakládky" 
                    value={transportFormData.loadingDateTime ? convertToDate(transportFormData.loadingDateTime) : null}
                    onChange={(newValue) => handleFormChange('loadingDateTime', newValue)} 
                    slotProps={{ textField: { fullWidth: true, required: true, sx:{ mb: 2 } } }}
                  />
                </LocalizationProvider>
                <TextField 
                  label="Pripomienka pred nakládkou (min)" 
                  type="number" 
                  value={transportFormData.loadingReminder === undefined ? '' : transportFormData.loadingReminder}
                  onChange={(e) => handleFormChange('loadingReminder', e.target.value === '' ? undefined : parseInt(e.target.value, 10))} 
                  fullWidth 
                  required
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>

              {/* Vykládka */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" sx={{ mb: 1, color: colors.accent.main }}>Vykládka</Typography>
                <TextField 
                  label="Adresa vykládky" 
                  value={transportFormData.unloadingAddress || ''} 
                  onChange={(e) => handleFormChange('unloadingAddress', e.target.value)} 
                  fullWidth 
                  required 
                  sx={{ mb: 2 }}
                />
                 <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                  <DateTimePicker 
                    label="Dátum a čas vykládky" 
                    value={transportFormData.unloadingDateTime ? convertToDate(transportFormData.unloadingDateTime) : null}
                    onChange={(newValue) => handleFormChange('unloadingDateTime', newValue)} 
                    slotProps={{ textField: { fullWidth: true, required: true, sx:{ mb: 2 } } }}
                  />
                </LocalizationProvider>
                <TextField 
                  label="Pripomienka pred vykládkou (min)" 
                  type="number" 
                  value={transportFormData.unloadingReminder === undefined ? '' : transportFormData.unloadingReminder}
                  onChange={(e) => handleFormChange('unloadingReminder', e.target.value === '' ? undefined : parseInt(e.target.value, 10))} 
                  fullWidth 
                  required
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              {/* Validačná chyba */} 
              {validationError && (
                 <Grid item xs={12}>
                    <Alert severity="error" sx={{ mt: 1 }}>{validationError}</Alert>
                 </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseAddTransportDialog} disabled={isSaving} sx={{ /* ... štýl ... */ }}>Zrušiť</Button>
            <Button 
              onClick={() => {
                console.log("!!!! SAVE/ADD BUTTON CLICKED !!!!"); 
                handleAddOrUpdateTransport(); 
              }}
              variant="contained" 
              sx={{ /* ... štýl ... */ }}
              disabled={isSaving} 
            >
              {isSaving ? <CircularProgress size={24} color="inherit" /> : (editingTransport ? "Uložiť zmeny" : "Pridať prepravu")}
            </Button>
          </DialogActions>
        </StyledDialogContent>
      </Dialog>

      {/* Snackbar pre notifikácie pripomienok */}
      <Snackbar
        open={notificationVisible}
        autoHideDuration={10000}
        onClose={hideNotification}
        message={notificationMessage}
        action={
          <IconButton size="small" color="inherit" onClick={hideNotification}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: colors.accent.main
          }
        }}
      />

      {/* Snackbar pre operácie */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        sx={{
          '& .MuiSnackbarContent-root': {
            backgroundColor: snackbar.severity === 'success' ? '#4caf50' : '#f44336'
          }
        }}
      />
    </>
  );
}

export default TrackedTransports; 