import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Paper,
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
  Chip,
  Tooltip,
  InputAdornment,
  Card,
  TableCell,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  CardContent,
  CardActions,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { sk } from 'date-fns/locale';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, Timestamp, orderBy, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import NotificationsIcon from '@mui/icons-material/Notifications';
import RouteIcon from '@mui/icons-material/Route';
import SearchField from './common/SearchField';
import TransportMap from './common/TransportMap';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import { useThemeMode } from '../contexts/ThemeContext';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(2, 0),
  width: '100%',
  background: theme.palette.mode === 'dark' 
    ? 'rgba(28, 28, 45, 0.35)' 
    : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(0, 0, 0, 0.1)'}`,
  borderRadius: 12,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 4px 20px rgba(0, 0, 0, 0.2)'
    : '0 4px 20px rgba(0, 0, 0, 0.1)',
}));

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
}

interface TransportFormData {
  orderNumber: string;
  loadingAddress: string;
  loadingDateTime: Date | Timestamp;
  loadingReminder: number;
  unloadingAddress: string;
  unloadingDateTime: Date | Timestamp;
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

const StyledCard = styled(Card)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  backdropFilter: 'blur(10px)',
  borderRadius: '20px',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
  transition: 'all 0.3s ease',
  marginBottom: '10px',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 24px rgba(255, 159, 67, 0.3)',
    border: '1px solid rgba(255, 159, 67, 0.3)',
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
  '@media (max-width: 600px)': {
    marginBottom: '8px'
  }
}));

const TransportCard = styled(Box)<{ isDarkMode: boolean }>(({ theme, isDarkMode }) => ({
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

const TransportInfo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

const InfoContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  height: '100%',
  justifyContent: 'space-between',
  '@media (max-width: 600px)': {
    gap: '16px'
  }
});

const CreatorInfo = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
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

const MapContainer = styled(Box)({
  width: '50%',
  height: '600px',
  borderRadius: '12px',
  overflow: 'hidden',
  marginTop: '24px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
});

const MapThumbnail = styled(Box)({
  width: '100%',
  height: '100%',
  '& > div': {
    width: '100% !important',
    height: '100% !important',
  }
});

const InfoSection = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '12px',
  backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
  borderRadius: '12px',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
}));

const InfoLabel = styled(Typography)({
  fontSize: '0.85rem',
  color: 'rgba(255, 255, 255, 0.5)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const InfoValue = styled(Typography)({
  fontSize: '1rem',
  color: '#ffffff',
});

const LocationInfo = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
  '& .location-section': {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '20px',
    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
    borderRadius: '12px',
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
  },
  '& .location-header': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 600,
    fontSize: '1.1rem',
    color: isDarkMode ? '#ffffff' : '#000000',
    '& .MuiSvgIcon-root': {
      fontSize: '1.2rem',
      color: colors.accent.main
    }
  },
  '& .location-address': {
    marginLeft: '32px',
    fontSize: '1rem',
    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  }
}));

const TimeInfo = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
  color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
  '& .section': {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '20px',
    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
    borderRadius: '12px',
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
  },
  '& .section-title': {
    fontWeight: 600,
    color: isDarkMode ? '#ffffff' : '#000000',
    fontSize: '1.1rem',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    '& .MuiSvgIcon-root': {
      fontSize: '1.2rem',
      color: colors.accent.main
    }
  },
  '& .time-row': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: '24px',
    fontSize: '1rem',
    '& .MuiSvgIcon-root': {
      fontSize: '1.1rem',
      color: colors.accent.main
    }
  },
  '& .reminder-info': {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginLeft: '24px',
    color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    fontSize: '0.9rem',
    '& .MuiSvgIcon-root': {
      fontSize: '0.9rem',
      color: colors.accent.light
    }
  }
}));

const CardHeader = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  color: isDarkMode ? '#ffffff' : '#000000',
}));

const OrderNumber = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: isDarkMode ? '#ffffff' : '#000000',
}));

const InfoChip = styled(Box)<{ variant?: 'status' | 'distance' }>(({ variant, theme }) => ({
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

const MobileTransportCard = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.75)' : '#ffffff',
  borderRadius: '16px',
  padding: '16px',
  color: isDarkMode ? '#ffffff' : '#000000',
  boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
  marginBottom: '16px',
  width: '100%'
}));

const MobileTransportHeader = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
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

const MobileTransportNumber = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: isDarkMode ? colors.accent.main : '#000000'
}));

const MobileTransportStatus = styled(Chip)({
  height: '24px',
  fontSize: '0.75rem'
});

const MobileTransportInfo = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  color: isDarkMode ? '#ffffff' : '#000000'
}));

const MobileTransportLocation = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
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

const MobileTransportTime = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
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
      color: colors.accent.main
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

const ActionButton = styled(Button)(({ theme }) => ({
  '&:hover': {
    backgroundColor: 'rgba(255, 159, 67, 0.1)',
  },
}));

// Pridáme helper metódu pre získanie vzdialenosti
const fetchDistanceFromGoogle = async (origin: string, destination: string): Promise<string | null> => {
  try {
    if (window.google && window.google.maps) {
      const directionsService = new window.google.maps.DirectionsService();
      
      const result = await directionsService.route({
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING
      });
      
      if (result.routes[0]?.legs[0]?.distance?.text) {
        return result.routes[0].legs[0].distance.text;
      }
    }
    return null;
  } catch (error) {
    console.error('Error fetching distance:', error);
    return null;
  }
};

const TrackedTransports: React.FC = () => {
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

  // Funkcia pre logovanie
  const logToStorage = (message: string, data?: any) => {
    console.log(message, data);
  };

  const handleOpenDialog = (transport?: Transport) => {
    if (transport) {
      setTransportToDelete(transport);
      setDeleteConfirmOpen(true);
    } else {
      setTransportToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!transportToDelete) return;

    try {
      // Vymazanie prepravy
      await deleteDoc(doc(db, 'transports', transportToDelete.id));

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
    setMapTransport(transport);
    setMapDialogOpen(true);
  };

  const handleAddTransport = async (newTransportData: TransportFormData) => {
    try {
      if (!userData) return;
      const newTransport: Transport = {
        id: '', // Placeholder, Firestore will generate the ID
        status: 'new', // Default status
        isDelayed: false, // Default value
        ...newTransportData,
        companyID: userData.companyID,
        createdAt: Timestamp.now(),
        createdBy: {
          firstName: userData.firstName,
          lastName: userData.lastName,
        },
      };
      const docRef = await addDoc(collection(db, 'transports'), newTransport);
      newTransport.id = docRef.id; // Assign the generated ID
      setTransports((prevTransports) => [...prevTransports, newTransport]);
    } catch (err: any) {
      setError('Chyba pri pridávaní prepravy: ' + (err.message || err));
    }
  };

  const renderMobileTransport = (transport: Transport) => (
    <MobileTransportCard isDarkMode={isDarkMode}>
      <MobileTransportHeader isDarkMode={isDarkMode}>
        <MobileTransportTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {transport.orderNumber ? `Objednávka: ${transport.orderNumber}` : 'Bez čísla objednávky'}
          </Typography>
          {transport.distance && (
            <InfoChip variant="distance">
              <RouteIcon />
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {transport.distance}
              </Typography>
            </InfoChip>
          )}
        </MobileTransportTitle>
        <InfoChip variant="status">
          {transport.status}
        </InfoChip>
      </MobileTransportHeader>
      
      <MobileTransportInfo isDarkMode={isDarkMode}>
        <Box>
          <MobileTransportLocation isDarkMode={isDarkMode}>
            <LocationOnIcon />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#ffffff' : '#000000' }}>
                Nakládka:
              </Typography>
              {transport.loadingAddress}
            </Box>
          </MobileTransportLocation>
          
          <MobileTransportTime isDarkMode={isDarkMode}>
            <div className="time-label">Nakládka:</div>
            <div className="time-row">
              <AccessTimeIcon />
              {transport.loadingDateTime instanceof Date 
                ? format(transport.loadingDateTime, 'dd.MM.yyyy HH:mm', { locale: sk })
                : format(transport.loadingDateTime.toDate(), 'dd.MM.yyyy HH:mm', { locale: sk })}
            </div>
            <div className="reminder-info">
              <NotificationsIcon />
              {transport.loadingReminder} minút pred nakládkou
              <br />
              (pripomienka o {
                transport.loadingDateTime instanceof Date 
                  ? format(new Date(transport.loadingDateTime.getTime() - transport.loadingReminder * 60000), 'HH:mm', { locale: sk })
                  : format(new Date(transport.loadingDateTime.toDate().getTime() - transport.loadingReminder * 60000), 'HH:mm', { locale: sk })
              })
            </div>
          </MobileTransportTime>
        </Box>

        <Box sx={{ mt: 2 }}>
          <MobileTransportLocation isDarkMode={isDarkMode}>
            <LocationOnIcon />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#ffffff' : '#000000' }}>
                Vykládka:
              </Typography>
              {transport.unloadingAddress}
            </Box>
          </MobileTransportLocation>
          
          <MobileTransportTime isDarkMode={isDarkMode}>
            <div className="time-label">Vykládka:</div>
            <div className="time-row">
              <AccessTimeIcon />
              {transport.unloadingDateTime instanceof Date 
                ? format(transport.unloadingDateTime, 'dd.MM.yyyy HH:mm', { locale: sk })
                : format(transport.unloadingDateTime.toDate(), 'dd.MM.yyyy HH:mm', { locale: sk })}
            </div>
            <div className="reminder-info">
              <NotificationsIcon />
              {transport.unloadingReminder} minút pred vykládkou
              <br />
              (pripomienka o {
                transport.unloadingDateTime instanceof Date 
                  ? format(new Date(transport.unloadingDateTime.getTime() - transport.unloadingReminder * 60000), 'HH:mm', { locale: sk })
                  : format(new Date(transport.unloadingDateTime.toDate().getTime() - transport.unloadingReminder * 60000), 'HH:mm', { locale: sk })
              })
            </div>
          </MobileTransportTime>
        </Box>
      </MobileTransportInfo>

      <MobileTransportActions>
        <IconButton 
          size="small"
          onClick={() => handleOpenDialog(transport)}
          sx={{ color: colors.accent.main }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton 
          size="small"
          onClick={() => handleOpenDialog(transport)}
          sx={{ color: colors.secondary.main }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </MobileTransportActions>
    </MobileTransportCard>
  );

  const renderMobileView = () => (
    <Box>
      {transports.map((transport) => (
        <TransportCard key={transport.id} isDarkMode={isDarkMode}>
          <CardHeader isDarkMode={isDarkMode}>
            <OrderNumber isDarkMode={isDarkMode}>
              {transport.orderNumber ? `Objednávka: ${transport.orderNumber}` : 'Bez čísla objednávky'}
            </OrderNumber>
            <TransportInfo>
              {transport.distance && (
                <InfoChip variant="distance">
                  <RouteIcon />
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {transport.distance}
                  </Typography>
                </InfoChip>
              )}
              <InfoChip variant="status">
                {transport.status}
              </InfoChip>
            </TransportInfo>
          </CardHeader>

          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 3 }}>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ 
                padding: '20px',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: '-16px',
                  left: '5%',
                  width: '90%',
                  height: '1px',
                  backgroundColor: colors.accent.main,
                  borderRadius: '1px'
                }
              }}>
                <Typography variant="h6" sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  mb: 2,
                  color: isDarkMode ? '#ffffff' : '#000000',
                  '& .MuiSvgIcon-root': { color: colors.accent.main }
                }}>
                  <LocationOnIcon />
                  Nakládka
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, ml: 2 }}>
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                    '& .MuiSvgIcon-root': { color: colors.accent.main }
                  }}>
                    <LocationOnIcon />
                    {transport.loadingAddress}
                  </Box>

                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                    '& .MuiSvgIcon-root': { color: colors.accent.main }
                  }}>
                    <AccessTimeIcon />
                    {format(transport.loadingDateTime instanceof Timestamp ? transport.loadingDateTime.toDate() : transport.loadingDateTime, 'dd.MM.yyyy HH:mm')}
                  </Box>

                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    fontSize: '0.9rem',
                    '& .MuiSvgIcon-root': { color: colors.accent.light }
                  }}>
                    <NotificationsIcon />
                    Pripomienka {transport.loadingReminder} minút pred nakládkou
                    ({format(new Date((transport.loadingDateTime instanceof Timestamp ? transport.loadingDateTime.toDate() : transport.loadingDateTime).getTime() - transport.loadingReminder * 60000), 'dd.MM.yyyy HH:mm')})
                  </Box>
                </Box>
              </Box>

              <Box sx={{ 
                padding: '20px',
                marginTop: '16px'
              }}>
                <Typography variant="h6" sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  mb: 2,
                  color: isDarkMode ? '#ffffff' : '#000000',
                  '& .MuiSvgIcon-root': { color: colors.accent.main }
                }}>
                  <LocationOnIcon />
                  Vykládka
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, ml: 2 }}>
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                    '& .MuiSvgIcon-root': { color: colors.accent.main }
                  }}>
                    <LocationOnIcon />
                    {transport.unloadingAddress}
                  </Box>

                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                    '& .MuiSvgIcon-root': { color: colors.accent.main }
                  }}>
                    <AccessTimeIcon />
                    {format(transport.unloadingDateTime instanceof Timestamp ? transport.unloadingDateTime.toDate() : transport.unloadingDateTime, 'dd.MM.yyyy HH:mm')}
                  </Box>

                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    fontSize: '0.9rem',
                    '& .MuiSvgIcon-root': { color: colors.accent.light }
                  }}>
                    <NotificationsIcon />
                    Pripomienka {transport.unloadingReminder} minút pred vykládkou
                    ({format(new Date((transport.unloadingDateTime instanceof Timestamp ? transport.unloadingDateTime.toDate() : transport.unloadingDateTime).getTime() - transport.unloadingReminder * 60000), 'dd.MM.yyyy HH:mm')})
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box sx={{ 
              width: '50%',
              height: '100%',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: 'pointer',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                border: `1px solid ${colors.accent.main}`,
                transform: 'scale(1.02)',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)'
              }
            }} onClick={() => handleShowMap(transport)}>
              <TransportMap
                origin={transport.loadingAddress}
                destination={transport.unloadingAddress}
                isThumbnail={true}
                onDirectionsChange={(directions, distance, duration) => {
                  if ((distance || duration) && !transport.distance) {
                    // Vytvoríme objekt s aktualizáciami
                    const updates: { distance?: string; duration?: string } = {};
                    if (distance) updates.distance = distance;
                    if (duration) updates.duration = duration;
                    
                    // Aktualizovať dokument len ak máme nejaké zmeny
                    if (Object.keys(updates).length > 0) {
                      updateDoc(doc(db, 'transports', transport.id), updates);
                      
                      // Aktualizovať lokálny stav
                      setTransports(prevTransports => 
                        prevTransports.map(t => t.id === transport.id ? { ...t, ...updates } : t)
                      );
                    }
                  }
                }}
              />
            </Box>
          </Box>

          <CardActions sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2,
            pt: 2,
            borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` 
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
              fontSize: '0.9rem'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <PersonIcon sx={{ fontSize: '1rem' }} />
                Vytvoril: {transport.createdBy?.firstName} {transport.createdBy?.lastName}
              </Box>
              <Box component="span" sx={{ mx: 1 }}>•</Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AccessTimeIcon sx={{ fontSize: '1rem' }} />
                Uverejnené: {format(transport.createdAt instanceof Timestamp ? transport.createdAt.toDate() : transport.createdAt, 'dd.MM.yyyy HH:mm')}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton 
                size="small"
                onClick={() => handleOpenDialog(transport)}
                sx={{ color: colors.accent.main }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small"
                onClick={() => handleOpenDialog(transport)}
                sx={{ color: colors.secondary.main }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
              <IconButton 
                size="small"
                onClick={() => handleShowMap(transport)}
                sx={{ color: colors.accent.main }}
              >
                <LocationOnIcon fontSize="small" />
              </IconButton>
            </Box>
          </CardActions>
        </TransportCard>
      ))}
    </Box>
  );

  useEffect(() => {
    const fetchTransports = async () => {
      try {
        if (!userData) return;
        const transportsQuery = query(
          collection(db, 'transports'),
          where('companyID', '==', userData.companyID),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(transportsQuery);
        const transportsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transport[];
        setTransports(transportsData);
        setLoading(false);
      } catch (err: any) {
        setError('Chyba pri načítaní prepráv: ' + (err.message || err));
        setLoading(false);
      }
    };

    fetchTransports();
  }, [userData?.companyID]);

  if (loading) {
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
            onClick={() => handleOpenDialog()}
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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress sx={{ color: '#ff9f43' }} />
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 2,
            '@media (max-width: 600px)': {
              gap: 1
            }
          }}>
            {transports.map((transport) => (
              <Box key={transport.id} sx={{ 
                display: { 
                  xs: 'block', // Mobilné zobrazenie
                  sm: 'none'   // Skryté na väčších obrazovkách
                }
              }}>
                {renderMobileTransport(transport)}
              </Box>
            ))}
            <Box sx={{ 
              display: { 
                xs: 'none',    // Skryté na mobilných zariadeniach
                sm: 'block'    // Zobrazené na väčších obrazovkách
              }
            }}>
              {renderMobileView()}
            </Box>
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
                        updateDoc(doc(db, 'transports', mapTransport.id), updates);
                        
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
    </>
  );
}

export default TrackedTransports; 