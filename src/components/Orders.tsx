import React, { useState, ChangeEvent, FormEvent, useEffect, useCallback } from 'react';
import { OrderFormData as BaseOrderFormData, Customer as OrderCustomer, LoadingPlace, UnloadingPlace, SavedPlace } from '../types/orders';
import { countries } from '../constants/countries';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  useTheme,
  useMediaQuery,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Autocomplete,
  IconButton,
  InputAdornment,
  Collapse,
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  GlobalStyles,
  DialogActions,
  Tooltip,
  Tabs,
  Tab,
  Chip,
  DialogContentText,
  FormControlLabel,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useThemeMode } from '../contexts/ThemeContext';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { sk } from 'date-fns/locale';
import { Theme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, deleteDoc, doc, updateDoc, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import NewOrderForm from './NewOrderForm';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import CustomerForm, { CustomerData } from './CustomerForm';

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
  '& .MuiTableCell-root, & .MuiTypography-root, & .MuiInputBase-root, & .MuiInputLabel-root, & .MuiTab-root, & .MuiSelect-select, & .MuiMenuItem-root, & .MuiFormLabel-root, & input, & .MuiAutocomplete-input': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  },
  '& .MuiOutlinedInput-root': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    '& input': {
      color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    }
  },
  '& .MuiAutocomplete-option': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  },
  '@media (max-width: 600px)': {
    padding: theme.spacing(2),
    margin: 0,
    borderRadius: 0,
    border: 'none',
    boxShadow: 'none',
    width: '100vw',
    position: 'relative',
    left: '50%',
    transform: 'translateX(-50%)',
    '&:hover': {
      transform: 'translateX(-50%)',
    }
  }
}));

const StyledFieldset = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: 8,
  background: theme.palette.mode === 'dark'
    ? 'rgba(35, 35, 66, 0.35)'
    : 'rgba(245, 245, 245, 0.95)',
  border: `1px solid ${theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.1)'}`,
  '& .MuiTypography-root': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  },
  '@media (max-width: 600px)': {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    width: '100%',
    borderRadius: 0,
    border: 'none',
    borderBottom: `1px solid ${theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.1)'}`,
  }
}));

const StyledLegend = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(0, 1),
  color: theme.palette.mode === 'dark' ? '#ff9f43' : '#000000',
  fontWeight: 600,
  fontSize: '1.1rem',
  marginBottom: theme.spacing(2),
}));

const PageWrapper = styled('div')({
  padding: '24px',
  '@media (max-width: 600px)': {
    padding: 0,
    paddingBottom: '80px',
    overflowX: 'hidden',
    width: '100%',
    maxWidth: '100vw'
  }
});

const PageHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(4),
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(1.5)
  }
}));

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

const PageDescription = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#000000',
  marginTop: theme.spacing(3)
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  width: '80px',
  height: '4px',
  margin: '8px 0 24px',
  background: theme.palette.warning.main,
  borderRadius: '2px',
}));

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(4),
  marginLeft: theme.spacing(2),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  width: '100%',
  '& .MuiOutlinedInput-root': {
    '@media (max-width: 600px)': {
      fontSize: '0.9rem',
    },
    '& input': {
      color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    }
  },
  '& .MuiInputLabel-root': {
    '@media (max-width: 600px)': {
      fontSize: '0.9rem',
    },
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.23)',
  },
  '& .MuiInputBase-input': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  }
}));

const autocompleteStyles = {
  '& .MuiAutocomplete-popper': {
    backgroundColor: (theme: Theme) => theme.palette.mode === 'dark' ? '#1c1c2d' : '#ffffff',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    border: (theme: Theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    borderRadius: '8px',
    backdropFilter: 'none',
    background: (theme: Theme) => theme.palette.mode === 'dark' ? '#1c1c2d !important' : '#ffffff !important',
    '& .MuiPaper-root': {
      backgroundColor: (theme: Theme) => theme.palette.mode === 'dark' ? '#1c1c2d !important' : '#ffffff !important',
      backgroundImage: 'none !important',
    },
    '& .MuiAutocomplete-option': {
      color: (theme: Theme) => theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    }
  },
  '& .MuiAutocomplete-paper': {
    backgroundColor: (theme: Theme) => theme.palette.mode === 'dark' ? '#1c1c2d !important' : '#ffffff !important',
    boxShadow: 'none',
    backgroundImage: 'none !important',
  },
  '& .MuiAutocomplete-listbox': {
    padding: 1,
    backgroundColor: (theme: Theme) => theme.palette.mode === 'dark' ? '#1c1c2d !important' : '#ffffff !important',
    backgroundImage: 'none !important',
    '& .MuiAutocomplete-option': {
      borderRadius: '6px',
      margin: '2px 0',
      backgroundColor: (theme: Theme) => theme.palette.mode === 'dark' ? '#1c1c2d !important' : '#ffffff !important',
      color: (theme: Theme) => theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
      '&[aria-selected="true"]': {
        backgroundColor: (theme: Theme) => theme.palette.mode === 'dark' ? '#2a2a45 !important' : '#f5f5f5 !important',
      },
      '&.Mui-focused': {
        backgroundColor: (theme: Theme) => theme.palette.mode === 'dark' ? '#2a2a45 !important' : '#f5f5f5 !important',
      },
    },
  },
};

const StyledDateTimeField = styled(TextField)(({ theme }) => ({
  width: '100%',
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(35, 35, 66, 0.35)' : 'rgba(245, 245, 245, 0.95)',
    borderRadius: '8px',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    '&:hover': {
      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    },
    '& input': {
      color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
      '&::-webkit-calendar-picker-indicator': {
        filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
        cursor: 'pointer'
      }
    }
  },
  '& .MuiInputLabel-root': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  },
  '& .MuiSelect-select': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  },
  '@media (max-width: 600px)': {
    '& .MuiOutlinedInput-root': {
      fontSize: '0.9rem',
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.9rem',
    }
  }
}));

const StyledDatePicker = styled(DatePicker)(({ theme }) => ({
  '& .MuiPaper-root': {
    backgroundColor: theme.palette.mode === 'dark' ? '#1c1c2d' : '#ffffff',
    color: theme.palette.mode === 'dark' ? '#fff' : '#000',
  },
  '& .MuiPickersDay-root': {
    color: theme.palette.mode === 'dark' ? '#fff' : '#000',
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(35, 35, 66, 0.35)' : 'rgba(245, 245, 245, 0.95)',
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    '&.Mui-selected': {
      backgroundColor: '#ff9f43',
      color: '#fff',
      '&:hover': {
        backgroundColor: '#ffbe76',
      },
    },
  },
  '& .MuiPickersCalendarHeader-root': {
    color: theme.palette.mode === 'dark' ? '#fff' : '#000',
  },
  '& .MuiPickersDay-today': {
    borderColor: '#ff9f43',
  },
  '& .MuiIconButton-root': {
    color: theme.palette.mode === 'dark' ? '#fff' : '#000',
  },
  '& .MuiPickersYear-yearButton': {
    color: theme.palette.mode === 'dark' ? '#fff' : '#000',
    '&.Mui-selected': {
      backgroundColor: '#ff9f43',
      color: '#fff',
    },
  },
  '& .MuiPickersMonth-monthButton': {
    color: theme.palette.mode === 'dark' ? '#fff' : '#000',
    '&.Mui-selected': {
      backgroundColor: '#ff9f43',
      color: '#fff',
    },
  },
  '& .MuiPickersDay-dayOutsideMonth': {
    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
  },
  '& .MuiInputBase-input': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  },
  '& .MuiInputLabel-root': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  }
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const emptyLoadingPlace: LoadingPlace = {
  street: '',
  city: '',
  zip: '',
  country: 'Slovensko',
  dateTime: '',
  contactPerson: ''
};

const emptyUnloadingPlace: UnloadingPlace = {
  street: '',
  city: '',
  zip: '',
  country: 'Slovensko',
  dateTime: '',
  contactPerson: ''
};

interface OrderFormData extends BaseOrderFormData {
    id?: string;
    createdAt?: Timestamp | Date;
    reminderDateTime?: Date | null;
    companyID?: string;
    createdBy?: string;
}

const convertToDate = (dateTime: any): Date | null => {
    if (!dateTime) return null;
    if (dateTime instanceof Date) return dateTime;
    if (dateTime instanceof Timestamp) return dateTime.toDate();
    if (dateTime.toDate && typeof dateTime.toDate === 'function') return dateTime.toDate();
    try { 
        const date = new Date(dateTime.seconds ? dateTime.seconds * 1000 : dateTime);
        return isNaN(date.getTime()) ? null : date; 
    } catch (e) { return null; }
};

const DialogGlobalStyles = ({ open }: { open: boolean }) => {
  if (!open) return null;
  
  return (
    <GlobalStyles 
      styles={`
        .MuiDialog-root .MuiDialog-paper {
          max-height: 100vh !important;
          overflow: hidden !important;
        }
        .MuiDialog-root .MuiDialogContent-root {
          overflow: auto !important;
          padding: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          max-height: 90vh !important;
        }
        body {
          overflow: ${open ? 'hidden' : 'auto'};
        }
      `}
    />
  );
};

const OrderDetailPanel = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(28, 28, 45, 0.95)' 
    : 'rgba(255, 255, 255, 0.95)',
  // Dočasne zakomentujeme potenciálne problematické štýly
  // backdropFilter: 'blur(10px)',
  // borderRadius: '0 0 12px 12px',
  // boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
  borderTop: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(0, 0, 0, 0.1)'}`,
  // margin: '0 -1px',
  // position: 'relative',
  // zIndex: 5,
  // maxHeight: '600px', // Odstránime obmedzenie výšky
  // overflowY: 'auto',
  // animation: 'slideDown 0.3s ease-out forwards',
  // '@keyframes slideDown': {
  //   from: { maxHeight: '0', opacity: 0 },
  //   to: { maxHeight: '600px', opacity: 1 }
  // },
  '@media (max-width: 600px)': {
    padding: theme.spacing(2)
  }
}));

const DetailSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const DetailSectionTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  fontWeight: 600,
  marginBottom: theme.spacing(1),
  color: '#ff9f43',
  display: 'flex',
  alignItems: 'center',
  '&::after': {
    content: '""',
    flex: 1,
    height: '1px',
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(0, 0, 0, 0.1)',
    marginLeft: theme.spacing(1)
  }
}));

const DetailRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  marginBottom: theme.spacing(1),
  '@media (max-width: 600px)': {
    flexDirection: 'column'
  }
}));

const DetailLabel = styled(Typography)(({ theme }) => ({
  fontWeight: 500,
  minWidth: '200px',
  fontSize: '0.875rem', // Zjednotená veľkosť písma
  color: theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.7)' 
    : 'rgba(0, 0, 0, 0.7)',
  '@media (max-width: 600px)': {
    minWidth: 'auto',
    marginBottom: theme.spacing(0.5)
  }
}));

const DetailValue = styled(Typography)(({ theme }) => ({
  flex: 1,
  fontSize: '0.875rem', // Zjednotená veľkosť písma
  color: theme.palette.mode === 'dark' 
    ? '#ffffff' 
    : '#000000',
  fontWeight: 400
}));

interface Customer {
  id: string;
  companyName: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  contactName: string;
  contactSurname: string;
  contactEmail: string;
  ico?: string;
  dic?: string;
  icDph?: string;
  createdAt: Date;
}

interface Carrier {
  id: string;
  companyName: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  contactName: string;
  contactSurname: string;
  contactEmail: string;
  contactPhone?: string;
  ico?: string;
  dic?: string;
  icDph?: string;
  vehicleTypes?: string[];
  notes?: string;
  createdAt: Date;
}

const OrdersList: React.FC = () => {
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();
  const { userData } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State pre objednávky
  const [orders, setOrders] = useState<OrderFormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showNewOrderDialog, setShowNewOrderDialog] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Record<string, any>>({});
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderFormData | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string>('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderFormData | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [showOrderNumberDialog, setShowOrderNumberDialog] = useState(false);
  const [orderToUpdateId, setOrderToUpdateId] = useState<string | null>(null);
  const [newOrderNumber, setNewOrderNumber] = useState('');
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [companySettings, setCompanySettings] = useState<any>(null);
  
  // State pre zákazníkov
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<Customer | null>(null);
  const [showCustomerDeleteConfirm, setShowCustomerDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string>('');
  
  // State pre dopravcov
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [carrierSearchQuery, setCarrierSearchQuery] = useState('');
  const [showCarrierForm, setShowCarrierForm] = useState(false);
  const [carrierFormData, setCarrierFormData] = useState({
    companyName: '',
    street: '',
    city: '',
    zip: '',
    country: 'Slovensko',
    contactName: '',
    contactSurname: '',
    contactEmail: '',
    contactPhone: '',
    ico: '',
    dic: '',
    icDph: '',
    vehicleTypes: '',
    notes: ''
  });
  const [selectedCarrierForEdit, setSelectedCarrierForEdit] = useState<Carrier | null>(null);
  const [showCarrierDeleteConfirm, setShowCarrierDeleteConfirm] = useState(false);
  const [carrierToDelete, setCarrierToDelete] = useState<string>('');
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Funkcia na filtrovanie objednávok zákazníkov
  const getFilteredCustomerOrders = () => {
    return filteredOrders.filter(order => {
      // Filter pre zákazníkov - zobrazujeme len objednávky, ktoré majú zákazníka (customerCompany) alebo (zakaznik)
      return (order.customerCompany || (order as any).zakaznik);
    });
  };

  // Funkcia na filtrovanie objednávok dopravcov (zatiaľ prázdna)
  const getFilteredCarrierOrders = () => {
    return filteredOrders.filter(order => {
      // Filter pre dopravcov - v budúcnosti budeme filtrovať podľa toho, či má order.carrierCompany
      return order.carrierCompany && order.carrierPrice;
    });
  };
  
  const fetchTeamMembers = useCallback(async () => {
    if (!userData?.companyID) return;
    
    try {
      console.log('Aktuálny userData:', userData);
      
      const usersQuery = query(
        collection(db, 'users'),
        where('companyID', '==', userData.companyID)
      );
      
      const usersSnapshot = await getDocs(usersQuery);
      const usersData: {[id: string]: {name: string, email: string}} = {};
      
      usersSnapshot.docs.forEach(doc => {
        const userDoc = doc.data();
        console.log(`Používateľ ${doc.id}:`, userDoc);
        
        // Prioritizujeme firstName a lastName polia
        let userName = '';
        
        // 1. Najprv skúsime firstName + lastName
        if (userDoc.firstName || userDoc.lastName) {
          userName = `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim();
        }
        
        // 2. Ak to nefunguje, skúsime displayName
        if (!userName && userDoc.displayName) {
          userName = userDoc.displayName;
        }
        
        // 3. Ak nie je firstName+lastName ani displayName, skúsime extrahovať meno z emailu
        if (!userName && userDoc.email) {
          // Extrahujeme časti emailu
          const emailParts = userDoc.email.split('@');
          if (emailParts.length > 0) {
            // Rozdelíme časť pred @ podľa bodiek alebo podčiarnikov
            const nameParts = emailParts[0].split(/[._-]/);
            // Upravíme prvé písmeno každej časti na veľké
            userName = nameParts.map((part: string) => 
              part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            ).join(' ');
          }
        }
        
        // Ak stále nemáme meno, použijeme ID alebo email ako zálohu
        if (!userName) {
          userName = userDoc.email ? userDoc.email.split('@')[0] : 'Používateľ';
        }
        
        usersData[doc.id] = {
          name: userName,
          email: userDoc.email || ''
        };
        
        console.log(`Spracovaný používateľ ${doc.id}: ${userName} (${userDoc.email || 'bez emailu'})`);
      });
      
      console.log('Spracovaní členovia tímu:', usersData);
      
      // Pridať aktuálneho používateľa, ak náhodou chýba v zozname
      if (userData.uid && !usersData[userData.uid]) {
        // Extrahovanie mena pre aktuálneho používateľa
        let currentUserName = '';
        
        // 1. Najprv skúsime firstName + lastName z userData
        if ((userData as any).firstName || (userData as any).lastName) {
          currentUserName = `${(userData as any).firstName || ''} ${(userData as any).lastName || ''}`.trim();
        }
        
        // 2. Ak to nefunguje, skúsime displayName
        if (!currentUserName && (userData as any).displayName) {
          currentUserName = (userData as any).displayName;
        }
        
        // 3. Ak nie je ani displayName, extrahujeme z emailu
        if (!currentUserName && userData.email) {
          const emailParts = userData.email.split('@');
          if (emailParts.length > 0) {
            const nameParts = emailParts[0].split(/[._-]/);
            currentUserName = nameParts.map(part => 
              part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
            ).join(' ');
          }
        }
        
        // Ak stále nemáme meno, použijeme email alebo záložnú hodnotu
        if (!currentUserName) {
          currentUserName = userData.email ? userData.email.split('@')[0] : 'Aktuálny používateľ';
        }
        
        usersData[userData.uid] = {
          name: currentUserName,
          email: userData.email || ''
        };
        
        console.log('Pridaný aktuálny používateľ:', usersData[userData.uid]);
      }
      
      setTeamMembers(usersData);
    } catch (err) {
      console.error('Chyba pri načítaní členov tímu:', err);
    }
  }, [userData]);
  
  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);
  
  const fetchOrders = useCallback(async () => {
    if (!userData?.companyID) {
      console.log('Chýba companyID');
      setError('Nemáte priradenú firmu.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let ordersQuery = query(
        collection(db, 'orders'),
        where('companyID', '==', userData.companyID)
      );

      if (startDate) {
          ordersQuery = query(ordersQuery, where('createdAt', '>=', Timestamp.fromDate(new Date(startDate.setHours(0,0,0,0)))));
      }
      if (endDate) {
           const endOfDay = new Date(endDate);
           endOfDay.setHours(23, 59, 59, 999);
           ordersQuery = query(ordersQuery, where('createdAt', '<=', Timestamp.fromDate(endOfDay)));
      }
      
      ordersQuery = query(ordersQuery, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(ordersQuery);
      const ordersData: OrderFormData[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Originálne dáta z Firebase:', data);
        console.log('Originálna hodnota zákazníka:', data.zakaznik);
        console.log('Originálna hodnota customerCompany:', data.customerCompany);
        
        const loadingPlacesWithDates = (data.loadingPlaces || []).map((p: any) => ({ ...p, dateTime: convertToDate(p.dateTime) }));
        const unloadingPlacesWithDates = (data.unloadingPlaces || []).map((p: any) => ({ ...p, dateTime: convertToDate(p.dateTime) }));
        
        const createdAtTimestamp = data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(convertToDate(data.createdAt) || new Date());

        const order: OrderFormData = {
          id: doc.id,
          customerCompany: data.zakaznik || data.customerCompany || '',
          customerVatId: data.customerVatId || '',
          customerStreet: data.customerStreet || '',
          customerCity: data.customerCity || '',
          customerZip: data.customerZip || '',
          customerCountry: data.customerCountry || 'Slovensko',
          customerContactName: data.customerContactName || '',
          customerContactSurname: data.customerContactSurname || '',
          customerEmail: data.customerEmail || '',
          customerPhone: data.customerPhone || '',
          customerPrice: data.suma || data.customerPrice || '',
          loadingPlaces: loadingPlacesWithDates,
          unloadingPlaces: unloadingPlacesWithDates,
          goodsDescription: data.goodsDescription || '',
          weightKg: data.weightKg || '',
          dimensionsL: data.dimensionsL || '',
          dimensionsW: data.dimensionsW || '',
          dimensionsH: data.dimensionsH || '',
          quantity: data.quantity || '',
          carrierCompany: data.carrierCompany || '',
          carrierContact: data.carrierContact || '',
          carrierVehicleReg: data.carrierVehicleReg || '',
          carrierPrice: data.carrierPrice || '',
          createdAt: createdAtTimestamp,
          reminderDateTime: convertToDate(data.reminderDateTime),
          companyID: data.companyID,
          createdBy: data.createdBy
        };
        
        (order as any).zakaznik = data.zakaznik || data.customerCompany || '';
        (order as any).kontaktnaOsoba = data.kontaktnaOsoba || 
          `${data.customerContactName || ''} ${data.customerContactSurname || ''}`.trim();
        (order as any).suma = data.suma || data.customerPrice || '';
        (order as any).createdByName = data.createdByName || '';
        (order as any).orderNumberFormatted = data.orderNumberFormatted || '';
        
        console.log('Spracované dáta pre zobrazenie:', {
          id: order.id,
          zakaznik: (order as any).zakaznik, 
          kontaktnaOsoba: (order as any).kontaktnaOsoba,
          customerCompany: order.customerCompany,
          customerContactName: order.customerContactName,
          customerContactSurname: order.customerContactSurname,
          suma: (order as any).suma,
          customerPrice: order.customerPrice,
          carrierPrice: order.carrierPrice
        });
        
        return order;
      });
      console.log('--- DEBUGOVANIE ŠPEDITÉRA ---');
      ordersData.forEach(order => {
        console.log(`Objednávka ${order.id}:`);
        console.log(`  createdBy: ${order.createdBy}`);
        console.log(`  createdByName: ${(order as any).createdByName}`);
        console.log(`  Team member data:`, order.createdBy ? teamMembers[order.createdBy] : 'N/A');
      });
      console.log('--- KONIEC DEBUGOVANIA ---');
      setOrders(ordersData);
    } catch (err) {
      console.error('Chyba pri načítaní objednávok:', err);
      setError('Nastala chyba pri načítaní objednávok');
    } finally {
      setLoading(false);
    }
  }, [userData, startDate, endDate, teamMembers]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter(order => {
    if (!order) return false;
    
    const searchTermLower = searchQuery.toLowerCase();
    const kontaktnaOsoba = (order as any).kontaktnaOsoba || 
          `${order.customerContactName || ''} ${order.customerContactSurname || ''}`.trim();
    const spediterName = (order as any).createdByName || 
          (order.createdBy && teamMembers[order.createdBy] ? teamMembers[order.createdBy].name : '');
    const orderNumber = (order as any).orderNumberFormatted || '';
    
    const matchesSearch = 
      order.customerCompany?.toLowerCase().includes(searchTermLower) ||
      kontaktnaOsoba.toLowerCase().includes(searchTermLower) ||
      spediterName.toLowerCase().includes(searchTermLower) ||
      orderNumber.toLowerCase().includes(searchTermLower) ||
      order.customerVatId?.toLowerCase().includes(searchTermLower) ||
      order.loadingPlaces?.[0]?.city?.toLowerCase().includes(searchTermLower) ||
      order.unloadingPlaces?.[0]?.city?.toLowerCase().includes(searchTermLower) ||
      order.id?.toLowerCase().includes(searchTermLower);
      
    return matchesSearch;
  });

  const openDeleteConfirmation = (id: string) => {
    setSelectedOrderId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirmed = async () => {
    if (selectedOrderId) {
      await handleDeleteOrder(selectedOrderId);
      setShowDeleteConfirm(false);
      setSelectedOrderId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setSelectedOrderId(null);
  };

  const handleEditOrder = (order: OrderFormData) => {
    const modifiedOrder = {
      ...order,
      zakaznik: order.customerCompany || '',
      kontaktnaOsoba: `${order.customerContactName || ''} ${order.customerContactSurname || ''}`.trim(),
      suma: order.customerPrice || '',
      mena: 'EUR',
    };
    
    setSelectedOrder(modifiedOrder);
    setIsEditMode(true);
    setShowNewOrderDialog(true);
  };

  const handleDeleteOrder = async (id: string) => {
    if (!userData?.companyID) {
      console.log('Chýba companyID');
      setError('Nemáte priradenú firmu.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, 'orders', id));
      fetchOrders();
    } catch (err) {
      console.error('Chyba pri mazaní objednávky:', err);
      setError('Nastala chyba pri mazaní objednávky');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewOrderForm = () => {
    setSelectedOrder(null);
    setIsEditMode(false);
    setShowNewOrderDialog(true);
  };

  const handleCloseNewOrderForm = () => {
    setShowNewOrderDialog(false);
    setSelectedOrder(null);
    setIsEditMode(false);
    fetchOrders();
  };

  const openOrderNumberEditDialog = (orderId: string) => {
    setOrderToUpdateId(orderId);
    setShowOrderNumberDialog(true);
  };

  const closeOrderNumberEditDialog = () => {
    setOrderToUpdateId(null);
    setNewOrderNumber('');
    setShowOrderNumberDialog(false);
  };

  const updateOrderNumber = async () => {
    if (!orderToUpdateId || !newOrderNumber || !userData?.companyID) return;

    try {
      setLoading(true);

      const parts = newOrderNumber.split('/');
      if (parts.length !== 3) {
        setError('Neplatný formát čísla. Použite formát 0001/04/2025');
        return;
      }
      
      const orderNumber = parts[0];
      const orderMonth = parts[1];
      const orderYear = parts[2];
      
      await updateDoc(doc(db, 'orders', orderToUpdateId), {
        orderNumberFormatted: newOrderNumber,
        orderNumber,
        orderMonth,
        orderYear
      });
      
      closeOrderNumberEditDialog();
      fetchOrders();
      
    } catch (err) {
      console.error('Chyba pri aktualizácii čísla objednávky:', err);
      setError('Nastala chyba pri aktualizácii čísla objednávky');
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (order: OrderFormData) => {
    console.log('--- handleRowClick called ---');
    console.log('Current selectedOrderId:', selectedOrderId, 'Clicked order.id:', order.id);
    if (selectedOrderId === order.id) {
      console.log('Closing detail for order:', order.id);
      setSelectedOrderId(null);
      setSelectedOrderDetail(null); // Zatvorí detail ak sa klikne znova
    } else {
      console.log('Opening detail for order:', order);
      setSelectedOrderId(order.id || null);
      setSelectedOrderDetail(order); // Nastaví detail pre zobrazenie
    }
  };

  // Nová funkcia pre získanie nastavení spoločnosti
  const getCompanySettings = async () => {
    if (!userData?.companyID) return null;
    
    try {
      const settingsQuery = query(
        collection(db, 'companySettings'),
        where('companyID', '==', userData.companyID),
        limit(1)
      );
      
      const settingsSnapshot = await getDocs(settingsQuery);
      if (!settingsSnapshot.empty) {
        return settingsSnapshot.docs[0].data();
      }
      return null;
    } catch (err) {
      console.error('Chyba pri načítaní nastavení spoločnosti:', err);
      return null;
    }
  };

  // Upravená funkcia pre náhľad PDF
  const handlePreviewPDF = async (order: OrderFormData) => {
    try {
      setLoading(true);
      
      // Najprv získame nastavenia spoločnosti
      const settings = await getCompanySettings();
      console.log("Načítané nastavenia spoločnosti pre PDF:", settings);
      
      // Potom vygenerujeme PDF s nastaveniami
      const doc = generatePDFWithSettings({...order, id: order.id || 'temp'}, settings);
      
      if (doc) {
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        setPdfUrl(pdfUrl);
        setShowPdfPreview(true);
      }
    } catch (error) {
      console.error('Chyba pri generovaní náhľadu PDF:', error);
      alert('Nastala chyba pri generovaní náhľadu PDF');
    } finally {
      setLoading(false);
    }
  };

  // Upravená funkcia pre stiahnutie PDF
  const handleDownloadPDF = async (order: OrderFormData) => {
    try {
      setLoading(true);
      
      // Najprv získame nastavenia spoločnosti
      const settings = await getCompanySettings();
      console.log("Načítané nastavenia spoločnosti pre PDF:", settings);
      
      // Potom vygenerujeme PDF s nastaveniami
      const doc = generatePDFWithSettings({...order, id: order.id || 'temp'}, settings);
      
      if (doc) {
        const orderNumber = (order as any).orderNumberFormatted || order.id?.substring(0, 8) || 'objednavka';
        doc.save(`objednavka-${orderNumber}.pdf`);
      }
    } catch (error) {
      console.error('Chyba pri sťahovaní PDF:', error);
      alert('Nastala chyba pri sťahovaní PDF');
    } finally {
      setLoading(false);
    }
  };

  // Nová funkcia pre generovanie PDF s nastaveniami
  const generatePDFWithSettings = (orderData: OrderFormData & { id: string }, settings: any) => {
    try {
      // Vytvoríme inštanciu jsPDF s podporou UTF-8
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        putOnlyUsedFonts: true,
        compress: true
      });

      // Importujeme font s podporou diakritiky
      doc.setFont("helvetica");
      doc.setLanguage("sk");
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - 2 * margin;
      
      // Pomocná funkcia pre bezpečný text s diakritikou
      const safeText = (text: any): string => {
        if (text === undefined || text === null) return '';
        return String(text);
      };
      
      // Formát dátumu pre hlavičku
      const createdAtDate = orderData.createdAt 
        ? format(convertToDate(orderData.createdAt)!, 'dd.MM.yyyy') 
        : format(new Date(), 'dd.MM.yyyy');
      
      // Číslo objednávky
      const orderNumber = (orderData as any).orderNumberFormatted || orderData.id.substring(0, 8);
      
      // --- HLAVIČKA DOKUMENTU ---
      // Logo alebo názov spoločnosti
      if (settings?.logoURL) {
        try {
          // Pridáme logo ak existuje
          const imgProps = doc.getImageProperties(settings.logoURL);
          const imgHeight = 16;
          const imgWidth = imgHeight * imgProps.width / imgProps.height;
          doc.addImage(settings.logoURL, 'PNG', margin, margin, imgWidth, imgHeight);
        } catch (error) {
          console.error('Chyba pri načítaní loga:', error);
          // Fallback na text ak logo zlyhalo
          doc.setFontSize(20);
          doc.setFont('helvetica', 'bold');
          doc.text(settings.companyName || 'AESA GROUP', margin, margin + 8);
        }
      } else {
        // Vypíšeme názov spoločnosti
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        const companyName = settings?.companyName || 'AESA GROUP';
        doc.text(companyName, margin, margin + 8);
      }
      
      // Dátum v hlavičke
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`${settings?.city || 'Trnava'}, ${createdAtDate}`, pageWidth - margin - 40, margin + 8);
      
      // Oranžová čiara pod hlavičkou
      doc.setDrawColor(240, 140, 0); // Oranžová farba (FF9F43)
      doc.setLineWidth(0.5);
      doc.line(margin, margin + 14, pageWidth - margin, margin + 14);
      
      // --- PRÍJEMCA A ODOSIELATEĽ ---
      const tableTop = margin + 20;
      const colWidth = contentWidth / 2 - 3;
      
      // Bunka Príjemca
      doc.setFillColor(248, 248, 248);
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(margin, tableTop, colWidth, 45, 3, 3, 'F');
      doc.setLineWidth(0.2);
      doc.roundedRect(margin, tableTop, colWidth, 45, 3, 3, 'S');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      
      // Nadpis sekcie
      doc.text('Príjemca', margin + 5, tableTop + 7);
      doc.setFont('helvetica', 'normal');
      
      // Údaje príjemcu
      const customerCompany = safeText((orderData as any).zakaznik || orderData.customerCompany).toUpperCase();
      const customerStreet = safeText(orderData.customerStreet);
      const customerCity = safeText(orderData.customerCity);
      const customerZip = safeText(orderData.customerZip);
      const customerCountry = safeText(orderData.customerCountry);
      const customerVatID = safeText(orderData.customerVatId);
      
      // Kontroly pre prázdne hodnoty
      const customerAddress = [
        customerStreet,
        customerZip && customerCity ? `${customerZip} ${customerCity}` : (customerZip || customerCity),
        customerCountry
      ].filter(Boolean).join(', ');
      
      doc.setFontSize(10);
      doc.text(customerCompany, margin + 5, tableTop + 15);
      doc.text(customerAddress, margin + 5, tableTop + 22);
      doc.text(`IČO: ${customerVatID ? customerVatID.split('/')[0] || 'N/A' : 'N/A'}`, margin + 5, tableTop + 29);
      doc.text(`DIČ/IČ DPH: ${customerVatID || 'N/A'}`, margin + 5, tableTop + 36);
      
      // Bunka Predajca
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(margin + colWidth + 6, tableTop, colWidth, 45, 3, 3, 'F');
      doc.roundedRect(margin + colWidth + 6, tableTop, colWidth, 45, 3, 3, 'S');
      doc.setFont('helvetica', 'bold');
      doc.text('Predajca', margin + colWidth + 11, tableTop + 7);
      doc.setFont('helvetica', 'normal');
      
      // Údaje predajcu
      const companyName = settings?.companyName || 'AESA GROUP';
      const companyStreet = settings?.street || 'Pekárska 11';
      const companyCity = settings?.city || 'Trnava'; 
      const companyZip = settings?.zip || 'SK91701';
      const companyVatID = settings?.vatID || 'SK2121966220';
      const companyID = settings?.businessID || '55361731';
      
      doc.text(companyName, margin + colWidth + 11, tableTop + 15);
      doc.text(`${companyStreet}, ${companyZip} ${companyCity}`, margin + colWidth + 11, tableTop + 22);
      doc.text(`IČO: ${companyID}`, margin + colWidth + 11, tableTop + 29);
      doc.text(`DIČ/IČ DPH: ${companyVatID}`, margin + colWidth + 11, tableTop + 36);
      
      // Pre špecifických zákazníkov - SL GROUP
      let documentTitleY = tableTop + 60; // Premenujem premennú
      
      if (customerCompany && customerCompany.toUpperCase().includes('SL GROUP')) {
        const contactTop = tableTop + 50;
        doc.setFillColor(248, 248, 248);
        doc.roundedRect(margin, contactTop, colWidth, 30, 3, 3, 'F');
        doc.roundedRect(margin, contactTop, colWidth, 30, 3, 3, 'S');
        doc.roundedRect(margin + colWidth + 6, contactTop, colWidth, 30, 3, 3, 'F');
        doc.roundedRect(margin + colWidth + 6, contactTop, colWidth, 30, 3, 3, 'S');
        
        doc.setFont('helvetica', 'bold');
        doc.text('SL GROUP (+48 504 649 412)', margin + 5, contactTop + 7);
        doc.setFont('helvetica', 'normal');
        const contactEmail = "prakapovich@sltr.pl";
        doc.text(`Telefón: +48 504 649 412`, margin + 5, contactTop + 14);
        doc.text(`Mobil: +48 504 649 412`, margin + 5, contactTop + 21);
        doc.text(`E-mail: ${contactEmail}`, margin + 5, contactTop + 28);
        
        // Kontaktné informácie AESA
        doc.setFont('helvetica', 'bold');
        doc.text(`Erik Géci`, margin + colWidth + 11, contactTop + 7);
        doc.setFont('helvetica', 'normal');
        doc.text(`Telefón: +421947964818`, margin + colWidth + 11, contactTop + 14);
        doc.text(`Mobil: +421947964818`, margin + colWidth + 11, contactTop + 21);
        doc.text(`E-mail: geci@aesa.sk`, margin + colWidth + 11, contactTop + 28);
        
        documentTitleY = contactTop + 40;
      }
      
      // Nadpis objednávky
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`Dopravná objednávka č. ${orderNumber}`, pageWidth / 2, documentTitleY, { align: 'center' });
      
      // Oranžová čiara pod nadpisom
      doc.setDrawColor(240, 140, 0);
      doc.setLineWidth(0.3);
      const textWidth = doc.getTextWidth(`Dopravná objednávka č. ${orderNumber}`);
      doc.line(pageWidth/2 - textWidth/2, documentTitleY + 1, pageWidth/2 + textWidth/2, documentTitleY + 1);
      
      doc.setFont('helvetica', 'normal');
      
      // Pridať informáciu o špediterovi - upravená logika aby zobrazovala meno
      const spediteurName = (() => {
        // 1. Najprv skúsime createdByName ak existuje a nie je to email
        const createdByName = (orderData as any).createdByName;
        if (createdByName && !createdByName.includes('@')) {
          return createdByName;
        }
        
        // 2. Ak máme teamMembers, vrátime jeho meno
        if (orderData.createdBy && teamMembers[orderData.createdBy]) {
          return teamMembers[orderData.createdBy].name;
        }
        
        // 3. Ak je createdByName email, extrahujeme z neho meno
        if (createdByName && createdByName.includes('@')) {
          const emailName = createdByName.split('@')[0];
          // Pokus o kapitalizáciu prvého písmena
          return emailName.charAt(0).toUpperCase() + emailName.slice(1);
        }
        
        return 'Neznámy špediter';
      })();
      
      doc.setFontSize(10);
      doc.text(`Špediter: ${spediteurName}`, pageWidth / 2, documentTitleY + 8, { align: 'center' });
      
      // Údaje týkajúce sa trasy
      const routeTop = documentTitleY + 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`Údaje týkajúce sa trasy (nakládky, vykládky):`, margin, routeTop);
      doc.setFont('helvetica', 'normal');
      
      // Nakládky
      let currentY = routeTop + 10;
      if (orderData.loadingPlaces && orderData.loadingPlaces.length > 0) {
        orderData.loadingPlaces.forEach((place, index) => {
          // Kontrola, či sa blížime ku koncu stránky a potrebujeme ďalšiu
          if (currentY + 80 > pageHeight) {
            doc.addPage();
            currentY = margin + 10;
          }
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(`Nakládka ${index + 1}`, margin, currentY);
          const dateTimeStr = place.dateTime ? format(convertToDate(place.dateTime)!, 'dd.MM.yyyy (HH:mm)') : '';
          if (dateTimeStr) {
            doc.text(`${dateTimeStr}`, margin + 120, currentY);
          }
          doc.setFont('helvetica', 'normal');
          currentY += 8;
          
          // Vytvorenie boxu nakládky
          const boxHeight = 60;
          doc.setFillColor(248, 248, 248);
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.2);
          doc.roundedRect(margin, currentY, contentWidth, boxHeight, 3, 3, 'F');
          doc.roundedRect(margin, currentY, contentWidth, boxHeight, 3, 3, 'S');
          
          // Údaje o mieste
          const placeCity = safeText(place.city);
          const placeCountry = safeText(place.country);
          const placeStreet = safeText(place.street);
          const placeZip = safeText(place.zip);
          
          const placeAddress = [
            placeStreet,
            placeZip && placeCity ? `${placeZip} ${placeCity}` : (placeZip || placeCity),
            placeCountry
          ].filter(Boolean).join(', ');
          
          doc.setFontSize(10);
          doc.text(placeAddress, margin + 5, currentY + 10);
          
          // Kontaktná osoba
          if (place.contactPerson) {
            doc.text(`Kontaktná osoba: ${place.contactPerson}`, margin + 5, currentY + 20);
          }
          
          // Referenčné číslo (ak existuje)
          const refNumber = (place as any).referenceNumber || '0260.550.- 153-5GU';
          doc.text(`Referenčné číslo: ${refNumber}`, margin + 5, currentY + (place.contactPerson ? 30 : 20));
          
          // Náklad
          const hasGoods = place.goods && place.goods.length > 0;
          doc.text(`Náklad: Pallets (${hasGoods ? 'Výmena - Colli: Nie' : 'Bez výmeny'})`, margin + 5, currentY + (place.contactPerson ? 40 : 30));
          
          // Počet a množstvo
          if (hasGoods && place.goods) {
            const goodsQuantity = place.goods.reduce((sum, item) => sum + (parseInt(String(item.quantity)) || 0), 0);
            doc.text(`Počet: ${goodsQuantity} x Colli`, margin + 5, currentY + (place.contactPerson ? 50 : 40));
            
            // Rozmery a váha - bezpečný prístup k váhe
            const goodsWeight = place.goods.reduce((sum, item) => {
              // Bezpečná kontrola váhy s defaultom 50kg
              const itemWeight = (item as any).weight ? parseFloat(String((item as any).weight)) : 50;
              return sum + ((parseInt(String(item.quantity)) || 0) * itemWeight);
            }, 0);
            
            doc.text(`Rozmery: 120x100x100cm, Hmotnosť: ${goodsWeight.toFixed(2)} kg`, margin + 5, currentY + (place.contactPerson ? 60 : 50));
          }
          
          currentY += boxHeight + 10;
        });
      }
      
      // Vykládky
      if (orderData.unloadingPlaces && orderData.unloadingPlaces.length > 0) {
        orderData.unloadingPlaces.forEach((place, index) => {
          // Kontrola, či sa blížime ku koncu stránky a potrebujeme ďalšiu
          if (currentY + 80 > pageHeight) {
            doc.addPage();
            currentY = margin + 10;
          }
          
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text(`Vykládka ${index + 1}`, margin, currentY);
          const dateTimeStr = place.dateTime ? format(convertToDate(place.dateTime)!, 'dd.MM.yyyy (HH:mm)') : '';
          if (dateTimeStr) {
            doc.text(`${dateTimeStr}`, margin + 120, currentY);
          }
          doc.setFont('helvetica', 'normal');
          currentY += 8;
          
          // Vytvorenie boxu vykládky
          const boxHeight = 60;
          doc.setFillColor(248, 248, 248);
          doc.setDrawColor(220, 220, 220);
          doc.setLineWidth(0.2);
          doc.roundedRect(margin, currentY, contentWidth, boxHeight, 3, 3, 'F');
          doc.roundedRect(margin, currentY, contentWidth, boxHeight, 3, 3, 'S');
          
          // Údaje o mieste
          const placeCity = safeText(place.city);
          const placeCountry = safeText(place.country);
          const placeStreet = safeText(place.street);
          const placeZip = safeText(place.zip);
          
          const placeAddress = [
            placeStreet,
            placeZip && placeCity ? `${placeZip} ${placeCity}` : (placeZip || placeCity),
            placeCountry
          ].filter(Boolean).join(', ');
          
          doc.setFontSize(10);
          doc.text(placeAddress, margin + 5, currentY + 10);
          
          // Kontaktná osoba
          if (place.contactPerson) {
            doc.text(`Kontaktná osoba: ${place.contactPerson}`, margin + 5, currentY + 20);
          }
          
          // Referenčné číslo (ak existuje)
          const refNumber = (place as any).referenceNumber || '0260.550.- 153-5GU';
          doc.text(`Referenčné číslo: ${refNumber}`, margin + 5, currentY + (place.contactPerson ? 30 : 20));
          
          // Náklad
          const hasGoods = place.goods && place.goods.length > 0;
          doc.text(`Náklad: Pallets (${hasGoods ? 'Výmena - Colli: Nie' : 'Bez výmeny'})`, margin + 5, currentY + (place.contactPerson ? 40 : 30));
          
          // Počet a množstvo
          if (hasGoods && place.goods) {
            const goodsQuantity = place.goods.reduce((sum, item) => sum + (parseInt(String(item.quantity)) || 0), 0);
            doc.text(`Počet: ${goodsQuantity} x Colli`, margin + 5, currentY + (place.contactPerson ? 50 : 40));
          }
          
          currentY += boxHeight + 10;
        });
      }
      
      // Informácie o doprave
      currentY += 5;
      if (currentY + 60 > pageHeight) {
        doc.addPage();
        currentY = margin + 10;
      }
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Dopravné prostriedky:', margin, currentY);
      currentY += 8;
      
      // Box s dopravnými prostriedkami
      doc.setFillColor(248, 248, 248);
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.roundedRect(margin, currentY, contentWidth, 35, 3, 3, 'F');
      doc.roundedRect(margin, currentY, contentWidth, 35, 3, 3, 'S');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      // Ťahač
      doc.setFont('helvetica', 'bold');
      doc.text('Ťahač:', margin + 5, currentY + 10);
      doc.setFont('helvetica', 'normal');
      const carrierVehicleReg = safeText(orderData.carrierVehicleReg || 'SB87MPA');
      doc.text(carrierVehicleReg, margin + 40, currentY + 10);
      
      // Náves (ak existuje)
      doc.setFont('helvetica', 'bold');
      doc.text('Náves:', margin + 5, currentY + 20);
      doc.setFont('helvetica', 'normal');
      const carrierTrailerReg = safeText((orderData as any).carrierTrailerReg || 'SB87TRL');
      doc.text(carrierTrailerReg, margin + 40, currentY + 20);
      
      // Dopravca údaje (ak existujú)
      doc.setFont('helvetica', 'bold');
      doc.text('Dopravca:', margin + 120, currentY + 10);
      doc.setFont('helvetica', 'normal');
      const carrierName = safeText((orderData as any).carrierName || orderData.carrierCompany || 'N/A');
      doc.text(carrierName, margin + 160, currentY + 10);
      
      doc.setFont('helvetica', 'bold');
      doc.text('IČO:', margin + 120, currentY + 20);
      doc.setFont('helvetica', 'normal');
      const carrierVatID = safeText((orderData as any).carrierVatId || 'N/A');
      doc.text(carrierVatID, margin + 160, currentY + 20);
      
      // Tabuľka s platbou
      currentY += 45;
      if (currentY + 40 > pageHeight) {
        doc.addPage();
        currentY = margin + 10;
      }
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Platobné podmienky:', margin, currentY);
      currentY += 8;
      
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      
      // Hlavička tabuľky s platbou
      doc.setFillColor(240, 240, 240);
      doc.roundedRect(margin, currentY, contentWidth, 8, 2, 2, 'F');
      doc.roundedRect(margin, currentY, contentWidth, 8, 2, 2, 'S');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Dátum splatnosti', margin + 5, currentY + 6);
      doc.text('Preprava (bez DPH)', margin + 120, currentY + 6);
      
      // Obsah tabuľky s platbou
      currentY += 8;
      doc.setFillColor(248, 248, 248);
      doc.roundedRect(margin, currentY, contentWidth, 12, 0, 0, 'F');
      doc.roundedRect(margin, currentY, contentWidth, 12, 0, 0, 'S');
      
      doc.setFont('helvetica', 'normal');
      doc.text('45 dní od prijatia faktúry a dokumentov', margin + 5, currentY + 8);
      
      const carrierPrice = safeText(orderData.carrierPrice || "880.00");
      doc.setFont('helvetica', 'bold');
      doc.text(carrierPrice + " EUR", margin + 120, currentY + 8);
      
      // Vertikálna čiara v tabuľke
      doc.line(margin + 110, currentY - 8, margin + 110, currentY + 12);
      
      // Poznámka k platbe
      currentY += 20;
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text("* Cena prepravy zahŕňa všetky poplatky spojené s dopravou, vrátane mýta a paliva.", margin, currentY);
      
      // Podmienky a zodpovednosť
      currentY += 10;
      if (currentY + 50 > pageHeight) {
        doc.addPage();
        currentY = margin + 10;
      }
      
      // Box s podmienkami
      doc.setFillColor(248, 248, 248);
      doc.setDrawColor(220, 220, 220);
      doc.setLineWidth(0.2);
      doc.roundedRect(margin, currentY, contentWidth, 45, 3, 3, 'F');
      doc.roundedRect(margin, currentY, contentWidth, 45, 3, 3, 'S');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('Podmienky dopravy:', margin + 5, currentY + 8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      doc.text("1. Dopravca je povinný dodržiavať všetky podmienky uvedené v objednávke vrátane času nakládky a vykládky.", margin + 5, currentY + 15);
      doc.text("2. Dopravca je povinný mať platné poistenie zodpovednosti dopravcu po celú dobu prepravy.", margin + 5, currentY + 22);
      doc.text("3. V prípade meškania je dopravca povinný bezodkladne informovať objednávateľa prepravy.", margin + 5, currentY + 29);
      doc.text("4. Podpisom dodacích listov dopravca potvrdzuje prevzatie tovaru v nepoškodenom stave.", margin + 5, currentY + 36);
      
      // Čísla strán a pätička
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Strana ${i} z ${pageCount}`, pageWidth - 25, pageHeight - 10);
        
        // Pätička s kontaktnými údajmi
        doc.text(`${companyName} | ${companyStreet}, ${companyZip} ${companyCity} | IČO: ${companyID} | DIČ: ${companyVatID}`, pageWidth/2, pageHeight - 10, { align: 'center' });
      }
      
      return doc;
    } catch (error) {
      console.error('Chyba pri generovaní PDF:', error);
      alert('Nastala chyba pri generovaní PDF objednávky');
      return null;
    }
  };

  // Pôvodnú funkciu generatePDF ponechať pre spätnú kompatibilitu
  const generatePDF = (orderData: OrderFormData & { id: string }) => {
    return generatePDFWithSettings(orderData, null);
  };

  const handleAddCustomer = () => {
    setShowCustomerForm(true);
  };

  const fetchCustomers = useCallback(async () => {
    try {
      const customersRef = collection(db, 'customers');
      const q = query(customersRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const customersData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
        } as Customer;
      });
      console.log('Zákazníci načítaní:', customersData.length);
      setCustomers(customersData);
    } catch (error) {
      console.error('Chyba pri načítaní zákazníkov:', error);
    }
  }, []);

  const handleCustomerSubmit = async (customerData: CustomerData) => {
    if (!userData?.companyID) {
      alert("Chyba: Nemáte priradenú firmu.");
      return;
    }
    try {
      console.log('Začínam ukladanie/aktualizáciu zákazníka:', customerData);
      
      const customerDataToSave = {
        companyName: customerData.companyName,
        street: customerData.street,
        city: customerData.city,
        zip: customerData.zip,
        country: customerData.country,
        contactName: customerData.contactName,
        contactSurname: customerData.contactSurname,
        contactEmail: customerData.contactEmail,
        ico: customerData.ico || '',
        dic: customerData.dic || '',
        icDph: customerData.icDph || '',
        companyID: userData.companyID // Pridanie companyID
      };

      // Ak máme selectedCustomerForEdit, ideme aktualizovať existujúceho zákazníka
      if (selectedCustomerForEdit) {
        const customerRef = doc(db, 'customers', selectedCustomerForEdit.id);
        
        await updateDoc(customerRef, {
          ...customerDataToSave, // companyID sa prenesie
          updatedAt: Timestamp.fromDate(new Date())
        });
        
        console.log('Zákazník bol úspešne aktualizovaný s ID:', selectedCustomerForEdit.id);
      } else {
        // Ide o nového zákazníka
        const customersRef = collection(db, 'customers');
        const newCustomer = {
          ...customerDataToSave, // companyID sa prenesie
          createdAt: Timestamp.fromDate(new Date())
        };
        
        const docRef = await addDoc(customersRef, newCustomer);
        console.log('Zákazník bol úspešne uložený s ID:', docRef.id);
      }
      
      // Načítame aktualizovaných zákazníkov
      await fetchCustomers();
      
      // Resetujeme stav editácie a zatvoríme formulár
      setSelectedCustomerForEdit(null);
      setShowCustomerForm(false);
    } catch (error) {
      console.error('Chyba pri ukladaní/aktualizácii zákazníka:', error);
      alert('Nastala chyba pri ukladaní/aktualizácii zákazníka: ' + (error as Error).message);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = customers.filter(customer => {
    const searchLower = customerSearchQuery.toLowerCase();
    return (
      customer.companyName.toLowerCase().includes(searchLower) ||
      customer.contactName.toLowerCase().includes(searchLower) ||
      customer.contactSurname.toLowerCase().includes(searchLower) ||
      customer.contactEmail.toLowerCase().includes(searchLower) ||
      (customer.ico && customer.ico.toLowerCase().includes(searchLower)) ||
      (customer.dic && customer.dic.toLowerCase().includes(searchLower)) ||
      (customer.icDph && customer.icDph.toLowerCase().includes(searchLower))
    );
  });

  // Odstránený useCallback
  const fetchCarriers = async () => {
    if (!userData?.companyID) {
      console.log("Chýba companyID pre načítanie dopravcov.");
      setCarriers([]); 
      return;
    }
    try {
      const carriersRef = collection(db, 'carriers');
      const q = query(
        carriersRef, 
        where('companyID', '==', userData.companyID), 
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const carriersData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
        } as Carrier;
      });
      console.log(`Dopravcovia načítaní pre ${userData.companyID}:`, carriersData.length);
      setCarriers(carriersData);
    } catch (error) {
      console.error('Chyba pri načítaní dopravcov:', error);
    }
  }; // Ukončenie funkcie

  const handleAddCarrier = () => {
    setShowCarrierForm(true);
  };

  const handleCarrierSubmit = async (carrierData: any) => {
    if (!userData?.companyID) {
      alert("Chyba: Nemáte priradenú firmu.");
      return;
    }
    try {
      console.log('Začínam ukladanie dopravcu:', carrierData);
      
      const carriersRef = collection(db, 'carriers');
      // Správny objekt pre ukladanie - premenované pre jasnoť
      const carrierDataToSave = {
        companyName: carrierData.companyName,
        street: carrierData.street,
        city: carrierData.city,
        zip: carrierData.zip,
        country: carrierData.country,
        contactName: carrierData.contactName,
        contactSurname: carrierData.contactSurname,
        contactEmail: carrierData.contactEmail,
        contactPhone: carrierData.contactPhone || '',
        ico: carrierData.ico || '',
        dic: carrierData.dic || '',
        icDph: carrierData.icDph || '',
        vehicleTypes: carrierData.vehicleTypes || [],
        notes: carrierData.notes || '',
        createdAt: Timestamp.fromDate(new Date()),
        companyID: userData.companyID // Pridanie companyID
      };
      
      const docRef = await addDoc(carriersRef, carrierDataToSave);
      console.log('Dopravca bol úspešne uložený s ID:', docRef.id);
      
      // Načítame aktualizovaných dopravcov
      await fetchCarriers();
      
      // Až potom zatvoríme formulár
      setShowCarrierForm(false);
    } catch (error) {
      console.error('Chyba pri ukladaní dopravcu:', error);
      alert('Nastala chyba pri ukladaní dopravcu: ' + (error as Error).message);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchCarriers(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [userData]); // fetchCarriers už nie je v závislostiach, ale userData áno, aby sa znovu načítali pri zmene usera

  const filteredCarriers = carriers.filter(carrier => {
    const searchLower = carrierSearchQuery.toLowerCase();
    return (
      carrier.companyName.toLowerCase().includes(searchLower) ||
      carrier.contactName.toLowerCase().includes(searchLower) ||
      carrier.contactSurname.toLowerCase().includes(searchLower) ||
      carrier.contactEmail.toLowerCase().includes(searchLower) ||
      (carrier.contactPhone && carrier.contactPhone.toLowerCase().includes(searchLower)) ||
      (carrier.ico && carrier.ico.toLowerCase().includes(searchLower)) ||
      (carrier.dic && carrier.dic.toLowerCase().includes(searchLower)) ||
      (carrier.icDph && carrier.icDph.toLowerCase().includes(searchLower))
    );
  });

  const handleCarrierFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCarrierFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCarrierFormSubmit = () => {
    // Transformujeme vehicleTypes z textu na pole
    const vehicleTypesArray = carrierFormData.vehicleTypes
      ? carrierFormData.vehicleTypes.split(',').map(type => type.trim())
      : [];

    const submitData = {
      ...carrierFormData,
      vehicleTypes: vehicleTypesArray
    };

    handleCarrierSubmit(submitData);
    
    // Resetujeme formulárové polia po odoslaní
    setCarrierFormData({
      companyName: '',
      street: '',
      city: '',
      zip: '',
      country: 'Slovensko',
      contactName: '',
      contactSurname: '',
      contactEmail: '',
      contactPhone: '',
      ico: '',
      dic: '',
      icDph: '',
      vehicleTypes: '',
      notes: ''
    });
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomerForEdit(customer);
    setShowCustomerForm(true);
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      const customerRef = doc(db, 'customers', id);
      await deleteDoc(customerRef);
      console.log('Zákazník bol úspešne vymazaný');
      fetchCustomers();
    } catch (error) {
      console.error('Chyba pri vymazávaní zákazníka:', error);
      alert('Nastala chyba pri vymazávaní zákazníka: ' + (error as Error).message);
    }
  };

  const openCustomerDeleteConfirmation = (id: string) => {
    setCustomerToDelete(id);
    setShowCustomerDeleteConfirm(true);
  };

  const handleCustomerDeleteConfirmed = async () => {
    if (customerToDelete) {
      await handleDeleteCustomer(customerToDelete);
      setShowCustomerDeleteConfirm(false);
      setCustomerToDelete('');
    }
  };

  const handleCustomerDeleteCancel = () => {
    setShowCustomerDeleteConfirm(false);
    setCustomerToDelete('');
  };

  // Funkcie pre správu dopravcov
  const handleEditCarrier = (carrier: Carrier) => {
    setSelectedCarrierForEdit(carrier);
    // Nastavím formulárové dáta pre editáciu
    setCarrierFormData({
      companyName: carrier.companyName,
      street: carrier.street,
      city: carrier.city,
      zip: carrier.zip,
      country: carrier.country,
      contactName: carrier.contactName,
      contactSurname: carrier.contactSurname,
      contactEmail: carrier.contactEmail,
      contactPhone: carrier.contactPhone || '',
      ico: carrier.ico || '',
      dic: carrier.dic || '',
      icDph: carrier.icDph || '',
      vehicleTypes: carrier.vehicleTypes?.join(', ') || '',
      notes: carrier.notes || ''
    });
    setShowCarrierForm(true);
  };

  const handleDeleteCarrier = async (id: string) => {
    try {
      const carrierRef = doc(db, 'carriers', id);
      await deleteDoc(carrierRef);
      console.log('Dopravca bol úspešne vymazaný');
      fetchCarriers();
    } catch (error) {
      console.error('Chyba pri vymazávaní dopravcu:', error);
      alert('Nastala chyba pri vymazávaní dopravcu: ' + (error as Error).message);
    }
  };

  const openCarrierDeleteConfirmation = (id: string) => {
    setCarrierToDelete(id);
    setShowCarrierDeleteConfirm(true);
  };

  const handleCarrierDeleteConfirmed = async () => {
    if (carrierToDelete) {
      await handleDeleteCarrier(carrierToDelete);
      setShowCarrierDeleteConfirm(false);
      setCarrierToDelete('');
    }
  };

  const handleCarrierDeleteCancel = () => {
    setShowCarrierDeleteConfirm(false);
    setCarrierToDelete('');
  };

  return (
    <PageWrapper>
      <DialogGlobalStyles open={showNewOrderDialog} />
      <PageHeader>
        <PageTitle isDarkMode={isDarkMode}>Objednávky</PageTitle>
        <PageDescription>
          V tejto sekcii môžete spravovať všetky objednávky vašej spoločnosti. Môžete vytvárať nové objednávky, upravovať existujúce alebo ich odstrániť.
        </PageDescription>
      </PageHeader>

      <StyledPaper>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="objednávky tabs"
              textColor="inherit"
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: '#ff9f43',
                },
                '& .MuiTab-root': {
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&.Mui-selected': {
                    color: '#ff9f43',
                  },
                },
              }}
            >
              <Tab label="Všetky objednávky" />
              <Tab label="Zákazníci" />
              <Tab label="Dopravcovia" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={handleOpenNewOrderForm}
                  sx={{
                    backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.8)' : '#ff9f43',
                    color: '#ffffff',
                    fontWeight: 500,
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.9)' : '#f7b067',
                    }
                  }}
                >
                  Nová objednávka
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                <TextField
                  label="Vyhľadať objednávku (Číslo, Firma, Kontakt, Špediter...)"
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  sx={{ flexGrow: 1, minWidth: '250px', maxWidth: '500px' }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <IconButton onClick={() => setShowFilters(!showFilters)}>
                  <FilterListIcon />
                </IconButton>
              </Box>
            </Box>

            <Collapse in={showFilters}>
              <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                  <DatePicker
                    label="Od dátumu"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                  <DatePicker
                    label="Do dátumu"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    slotProps={{ textField: { size: 'small' } }}
                  />
                </LocalizationProvider>
                <Button 
                  onClick={() => { setStartDate(null); setEndDate(null); }} 
                  size="small"
                  sx={{ 
                    color: '#ff9f43',
                    '&:hover': { backgroundColor: 'rgba(255, 159, 67, 0.04)' }
                  }}
                >
                  Vymazať filter
                </Button>
              </Box>
            </Collapse>
          
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                <CircularProgress sx={{ color: '#ff9f43' }} />
              </Box>
            )}
          
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  borderRadius: '10px',
                  my: 2,
                  '& .MuiAlert-icon': {
                    color: '#ff9f43'
                  }
                }}
              >
                {error}
              </Alert>
            )}
          
            {!loading && !error && (
              <TableContainer 
                sx={{
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
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }
                  }
                }}
              >
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Číslo obj.</TableCell>
                      <TableCell>Zákazník</TableCell>
                      <TableCell>Kontaktná osoba</TableCell>
                      <TableCell>Nakládka</TableCell>
                      <TableCell>Čas nakládky</TableCell>
                      <TableCell>Vykládka</TableCell>
                      <TableCell>Čas vykládky</TableCell>
                      <TableCell>Tovar</TableCell>
                      <TableCell sx={{ color: '#ff9f43', fontWeight: 'bold' }}>Cena zák.</TableCell>
                      <TableCell sx={{ color: '#1976d2', fontWeight: 'bold' }}>Cena dopr.</TableCell>
                      <TableCell sx={{ color: '#2ecc71', fontWeight: 'bold' }}>Zisk</TableCell>
                      <TableCell>Špediter</TableCell>
                      <TableCell>Dátum vytvorenia</TableCell>
                      <TableCell>Akcie</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getFilteredCustomerOrders().map((order) => (
                      <React.Fragment key={order.id}>
                        <TableRow 
                          hover 
                          onClick={() => handleRowClick(order)} 
                          sx={{ 
                            cursor: 'pointer', 
                            backgroundColor: selectedOrderId === order.id ? (theme.palette.mode === 'dark' ? 'rgba(255, 159, 67, 0.1)' : 'rgba(255, 159, 67, 0.05)') : undefined,
                            '& .MuiTableCell-root': {
                              borderBottom: selectedOrderId === order.id ? 'none' : undefined // Odstráni čiaru pod bunkami, keď je detail otvorený
                            }
                          }}
                        >
                           {/* ... Všetky TableCell pre riadok ... */}
                            <TableCell>{(order as any).orderNumberFormatted || order.id?.substring(0, 8) || 'N/A'}</TableCell>
                            <TableCell>{(order as any).zakaznik || order.customerCompany || '-'}</TableCell>
                            <TableCell>{(order as any).kontaktnaOsoba || '-'}</TableCell>
                            <TableCell>{order.loadingPlaces?.[0]?.city || '-'}</TableCell>
                            <TableCell>{order.loadingPlaces?.[0]?.dateTime ? format(convertToDate(order.loadingPlaces[0].dateTime)!, 'dd.MM HH:mm') : '-'}</TableCell>
                            <TableCell>{order.unloadingPlaces?.[0]?.city || '-'}</TableCell>
                            <TableCell>{order.unloadingPlaces?.[0]?.dateTime ? format(convertToDate(order.unloadingPlaces[0].dateTime)!, 'dd.MM HH:mm') : '-'}</TableCell>
                            <TableCell>{order.loadingPlaces?.[0]?.goods?.[0]?.name || '-'}</TableCell>
                            <TableCell sx={{ color: '#ff9f43', fontWeight: 'bold' }}>{`${(order as any).suma || order.customerPrice || '0'} €`}</TableCell>
                            <TableCell sx={{ color: '#1976d2', fontWeight: 'bold' }}>{`${order.carrierPrice || '0'} €`}</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>{(() => { const c = parseFloat((order as any).suma || order.customerPrice || '0'); const p = parseFloat(order.carrierPrice || '0'); return !isNaN(c) && !isNaN(p) ? `${(c - p).toFixed(2)} €` : '-'; })()}</TableCell>
                            <TableCell>
                              {
                                // Logika na zobrazenie mena namiesto emailu v tabuľke
                                (order.createdBy && teamMembers[order.createdBy]?.name) ||
                                ((order as any).createdByName && !(order as any).createdByName.includes('@') ? (order as any).createdByName : null) ||
                                ((order as any).createdByName && (order as any).createdByName.includes('@') ? (order as any).createdByName.split('@')[0] : null) || // Fallback na časť emailu pred @
                                'Neznámy'
                              }
                            </TableCell>
                            <TableCell>{order.createdAt ? format(convertToDate(order.createdAt)!, 'dd.MM.yyyy') : 'N/A'}</TableCell>
                            <TableCell> {/* Akcie */} 
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="Upraviť"><IconButton onClick={(e) => { e.stopPropagation(); handleEditOrder(order); }} sx={{ color: '#ff9f43' }}><EditIcon fontSize="small"/></IconButton></Tooltip>
                                <Tooltip title="Náhľad PDF"><IconButton onClick={(e) => { e.stopPropagation(); handlePreviewPDF(order); }} sx={{ color: '#1e88e5' }}><VisibilityIcon fontSize="small"/></IconButton></Tooltip>
                                <Tooltip title="Stiahnuť PDF"><IconButton onClick={(e) => { e.stopPropagation(); handleDownloadPDF(order); }} sx={{ color: '#4caf50' }}><FileDownloadIcon fontSize="small"/></IconButton></Tooltip>
                                <Tooltip title="Vymazať"><IconButton onClick={(e) => { e.stopPropagation(); openDeleteConfirmation(order.id || ''); }} sx={{ color: '#ff6b6b' }}><DeleteIcon fontSize="small"/></IconButton></Tooltip>
                              </Box>
                            </TableCell>
                        </TableRow>
                        
                        {/* Podmienené zobrazenie detailu */}
                        <TableRow sx={{ backgroundColor: selectedOrderId === order.id ? (theme.palette.mode === 'dark' ? 'rgba(28, 28, 45, 0.8)' : 'rgba(250, 250, 250, 0.9)') : 'transparent' }}>
                          <TableCell 
                            style={{ padding: 0, borderBottom: 'none' }} 
                            colSpan={14} // Správny počet stĺpcov
                          >
                            <Collapse 
                              in={selectedOrderId === order.id} 
                              timeout="auto" 
                              unmountOnExit
                            >
                              {selectedOrderId === order.id && selectedOrderDetail && (
                                <OrderDetailPanel>
                                  {/* Vrátenie pôvodného obsahu */}
                                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                                      Detail objednávky {(selectedOrderDetail as any).orderNumberFormatted || selectedOrderDetail.id?.substring(0, 8)}
                                  </Typography>
                                  <Grid container spacing={3}>
                                      {/* Sekcia Základné informácie */}
                                      <Grid item xs={12} md={6} lg={4}>
                                          <DetailSection>
                                              <DetailSectionTitle>Základné informácie</DetailSectionTitle>
                                              <DetailRow>
                                                  <DetailLabel>Dátum vytvorenia:</DetailLabel>
                                                  <DetailValue>{selectedOrderDetail.createdAt ? format(convertToDate(selectedOrderDetail.createdAt)!, 'dd.MM.yyyy HH:mm') : 'N/A'}</DetailValue>
                                              </DetailRow>
                                              <DetailRow>
                                                  <DetailLabel>Vytvoril:</DetailLabel>
                                                  <DetailValue sx={{ display: 'flex', flexDirection: 'column' }}>
                                                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                          <PersonIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }} /> 
                                                          {
                                                            // Priorita: 1. Meno z teamMembers, 2. createdByName (ak nie je email), 3. Fallback
                                                            (selectedOrderDetail.createdBy && teamMembers[selectedOrderDetail.createdBy]?.name) ||
                                                            ((selectedOrderDetail as any).createdByName && !(selectedOrderDetail as any).createdByName.includes('@') ? (selectedOrderDetail as any).createdByName : null) ||
                                                            'Neznámy'
                                                          }
                                                      </Box>
                                                      {selectedOrderDetail.createdBy && teamMembers[selectedOrderDetail.createdBy]?.email && (
                                                        <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                          <EmailIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }}/>
                                                          {teamMembers[selectedOrderDetail.createdBy]?.email}
                                                        </Box>
                                                      )}
                                                      {/* Zobraziť createdByName ako fallback email, ak meno nie je dostupné */}
                                                      {!(selectedOrderDetail.createdBy && teamMembers[selectedOrderDetail.createdBy]?.name) && (selectedOrderDetail as any).createdByName && (selectedOrderDetail as any).createdByName.includes('@') && (
                                                          <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                                                              <EmailIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.7 }}/>
                                                              {(selectedOrderDetail as any).createdByName}
                                                          </Box>
                                                      )}
                                                  </DetailValue>
                                              </DetailRow>
                                              {/* Pridať ďalšie základné info ak treba */}
                                          </DetailSection>
                                      </Grid>

                                      {/* Sekcia Zákazník */}
                                      <Grid item xs={12} md={6} lg={4}>
                                          <DetailSection>
                                              <DetailSectionTitle>Zákazník</DetailSectionTitle>
                                              <DetailRow>
                                                  <DetailLabel>Názov spoločnosti:</DetailLabel>
                                                  <DetailValue>{(selectedOrderDetail as any).zakaznik || selectedOrderDetail.customerCompany}</DetailValue>
                                              </DetailRow>
                                              <DetailRow>
                                                  <DetailLabel>Kontaktná osoba:</DetailLabel>
                                                  <DetailValue>{(selectedOrderDetail as any).kontaktnaOsoba || `${selectedOrderDetail.customerContactName} ${selectedOrderDetail.customerContactSurname}`}</DetailValue>
                                              </DetailRow>
                                              {selectedOrderDetail.customerStreet && <DetailRow><DetailLabel>Adresa:</DetailLabel><DetailValue>{`${selectedOrderDetail.customerStreet}, ${selectedOrderDetail.customerZip} ${selectedOrderDetail.customerCity}, ${selectedOrderDetail.customerCountry}`}</DetailValue></DetailRow>}
                                              {selectedOrderDetail.customerVatId && <DetailRow><DetailLabel>IČ DPH:</DetailLabel><DetailValue>{selectedOrderDetail.customerVatId}</DetailValue></DetailRow>}
                                          </DetailSection>
                                      </Grid>
                                      
                                      {/* Sekcia Dopravca (ak existuje) */}
                                      {selectedOrderDetail.carrierCompany && (
                                          <Grid item xs={12} md={6} lg={4}>
                                              <DetailSection>
                                                  <DetailSectionTitle>Dopravca</DetailSectionTitle>
                                                  <DetailRow>
                                                      <DetailLabel>Názov:</DetailLabel>
                                                      <DetailValue>{selectedOrderDetail.carrierCompany}</DetailValue>
                                                  </DetailRow>
                                                  <DetailRow>
                                                      <DetailLabel>Kontakt:</DetailLabel>
                                                      <DetailValue>{selectedOrderDetail.carrierContact}</DetailValue>
                                                  </DetailRow>
                                                  <DetailRow>
                                                      <DetailLabel>EČV:</DetailLabel>
                                                      <DetailValue>{selectedOrderDetail.carrierVehicleReg}</DetailValue>
                                                  </DetailRow>
                                              </DetailSection>
                                          </Grid>
                                      )}
                                      
                                      {/* Sekcia Miesta nakládky */}
                                      <Grid item xs={12} md={6}>
                                          <DetailSection>
                                              <DetailSectionTitle>Miesta nakládky</DetailSectionTitle>
                                              {selectedOrderDetail.loadingPlaces?.map((place, idx) => (
                                                  <Box key={`load-detail-${idx}`} sx={{ mb: 2, borderBottom: idx !== selectedOrderDetail.loadingPlaces.length - 1 ? '1px dashed rgba(128,128,128,0.3)' : 'none', pb: idx !== selectedOrderDetail.loadingPlaces.length - 1 ? 2 : 0 }}>
                                                      <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>Nakládka #{idx+1}</Typography>
                                                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                        <span style={{ fontWeight: 500, color: theme.palette.text.secondary, minWidth: '100px', display: 'inline-block', fontSize: '0.875rem' }}>Adresa:</span> 
                                                        {`${place.street}, ${place.city}, ${place.zip}, ${place.country}`}
                                                      </Typography>
                                                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                        <span style={{ fontWeight: 500, color: theme.palette.text.secondary, minWidth: '100px', display: 'inline-block', fontSize: '0.875rem' }}>Dátum a čas:</span> 
                                                        {place.dateTime ? format(place.dateTime as Date, 'dd.MM.yyyy HH:mm', { locale: sk }) : 'N/A'}
                                                      </Typography>
                                                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                        <span style={{ fontWeight: 500, color: theme.palette.text.secondary, minWidth: '100px', display: 'inline-block', fontSize: '0.875rem' }}>Kontakt:</span> 
                                                        {place.contactPerson}
                                                      </Typography>
                                                      
                                                      {place.goods && place.goods.length > 0 && (
                                                          <Box sx={{ mt: 1 }}>
                                                              <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.secondary, fontSize: '0.875rem' }}>Tovar:</Typography>
                                                              {place.goods.map((item, gIdx) => (
                                                                  <Typography key={`load-good-detail-${idx}-${gIdx}`} variant="body2" /* sx={{ ml: 1 }} */> 
                                                                      {item.name} ({item.quantity} {item.unit})
                                                                      {item.palletExchange && item.palletExchange !== 'Bez výmeny' && ` (${item.palletExchange})`}
                                                                      {item.dimensions && ` [${item.dimensions}]`}
                                                                      {item.description && ` - ${item.description}`} 
                                                                  </Typography>
                                                              ))}
                                                          </Box>
                                                      )}
                                                  </Box>
                                              ))}
                                          </DetailSection>
                                      </Grid>
                                      
                                      {/* Sekcia Miesta vykládky */}
                                      <Grid item xs={12} md={6}>
                                          <DetailSection>
                                              <DetailSectionTitle>Miesta vykládky</DetailSectionTitle>
                                              {selectedOrderDetail.unloadingPlaces?.map((place, idx) => (
                                                  <Box key={`unload-detail-${idx}`} sx={{ mb: 2, borderBottom: idx !== selectedOrderDetail.unloadingPlaces.length - 1 ? '1px dashed rgba(128,128,128,0.3)' : 'none', pb: idx !== selectedOrderDetail.unloadingPlaces.length - 1 ? 2 : 0 }}>
                                                         <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>Vykládka #{idx+1}</Typography>
                                                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                        <span style={{ fontWeight: 500, color: theme.palette.text.secondary, minWidth: '100px', display: 'inline-block', fontSize: '0.875rem' }}>Adresa:</span> 
                                                        {`${place.street}, ${place.city}, ${place.zip}, ${place.country}`}
                                                      </Typography>
                                                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                        <span style={{ fontWeight: 500, color: theme.palette.text.secondary, minWidth: '100px', display: 'inline-block', fontSize: '0.875rem' }}>Dátum a čas:</span> 
                                                        {place.dateTime ? format(place.dateTime as Date, 'dd.MM.yyyy HH:mm', { locale: sk }) : 'N/A'}
                                                      </Typography>
                                                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                                                        <span style={{ fontWeight: 500, color: theme.palette.text.secondary, minWidth: '100px', display: 'inline-block', fontSize: '0.875rem' }}>Kontakt:</span> 
                                                        {place.contactPerson}
                                                      </Typography>
                                                      {place.goods && place.goods.length > 0 && (
                                                          <Box sx={{ mt: 1 }}>
                                                              <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.secondary, fontSize: '0.875rem' }}>Tovar:</Typography>
                                                              {place.goods.map((item, gIdx) => (
                                                                  <Typography key={`unload-good-detail-${idx}-${gIdx}`} variant="body2" /* sx={{ ml: 1 }} */> 
                                                                      {item.name} ({item.quantity} {item.unit})
                                                                      {item.description && ` - ${item.description}`}
                                                                  </Typography>
                                                              ))}
                                                          </Box>
                                                      )}
                                                  </Box>
                                              ))}
                                          </DetailSection>
                                      </Grid>
                                      
                                      {/* Sekcia Ostatné */}
                                      <Grid item xs={12}>
                                          <DetailSection>
                                              <DetailSectionTitle>Ostatné informácie</DetailSectionTitle>
                                              {(selectedOrderDetail as any).cisloNakladuZakaznika && 
                                                  <DetailRow><DetailLabel>Číslo nákladu zák.:</DetailLabel><DetailValue>{(selectedOrderDetail as any).cisloNakladuZakaznika}</DetailValue></DetailRow>
                                              }
                                              {(selectedOrderDetail as any).internaPoznamka && 
                                                  <DetailRow><DetailLabel>Interná poznámka:</DetailLabel><DetailValue>{(selectedOrderDetail as any).internaPoznamka}</DetailValue></DetailRow>
                                              }
                                              {(selectedOrderDetail as any).vyzadujeSaTypNavesu && 
                                                  <DetailRow><DetailLabel>Typ návesu:</DetailLabel><DetailValue>{(selectedOrderDetail as any).vyzadujeSaTypNavesu}</DetailValue></DetailRow>
                                              }
                                              {(selectedOrderDetail as any).poziadavky && 
                                                  <DetailRow><DetailLabel>Požiadavky:</DetailLabel><DetailValue>{(selectedOrderDetail as any).poziadavky}</DetailValue></DetailRow>
                                              }
                                              {/* Pridať ďalšie ostatné info ak treba */}
                                          </DetailSection>
                                      </Grid>
                                  </Grid>
                                </OrderDetailPanel>
                              )}
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={handleAddCustomer}
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.8)' : '#ff9f43',
                      color: '#ffffff',
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.9)' : '#f7b067',
                      }
                    }}
                  >
                    Pridať zákazníka
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  <TextField
                    label="Vyhľadať zákazníka"
                    variant="outlined"
                    size="small"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    sx={{ flexGrow: 1, minWidth: '250px', maxWidth: '500px' }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Box>

              <TableContainer component={Paper} sx={{ 
                backgroundColor: isDarkMode ? 'rgba(22, 28, 36, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Názov spoločnosti</TableCell>
                      <TableCell>Kontaktná osoba</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>IČO</TableCell>
                      <TableCell>DIČ</TableCell>
                      <TableCell>IČ DPH</TableCell>
                      <TableCell>Krajina</TableCell>
                      <TableCell>Dátum vytvorenia</TableCell>
                      <TableCell>Akcie</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>{customer.companyName}</TableCell>
                        <TableCell>{`${customer.contactName} ${customer.contactSurname}`}</TableCell>
                        <TableCell>{customer.contactEmail}</TableCell>
                        <TableCell>{customer.ico || '-'}</TableCell>
                        <TableCell>{customer.dic || '-'}</TableCell>
                        <TableCell>{customer.icDph || '-'}</TableCell>
                        <TableCell>{customer.country}</TableCell>
                        <TableCell>
                          {customer.createdAt.toLocaleDateString('sk-SK', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Upraviť">
                              <IconButton 
                                onClick={() => handleEditCustomer(customer)}
                                sx={{ 
                                  color: '#ff9f43',
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
                                onClick={() => openCustomerDeleteConfirmation(customer.id)}
                                sx={{ 
                                  color: '#ff6b6b',
                                  '&:hover': { 
                                    backgroundColor: 'rgba(255, 107, 107, 0.1)' 
                                  } 
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={handleAddCarrier}
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.8)' : '#ff9f43',
                      color: '#ffffff',
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.9)' : '#f7b067',
                      }
                    }}
                  >
                    Pridať dopravcu
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  <TextField
                    label="Vyhľadať dopravcu"
                    variant="outlined"
                    size="small"
                    value={carrierSearchQuery}
                    onChange={(e) => setCarrierSearchQuery(e.target.value)}
                    sx={{ flexGrow: 1, minWidth: '250px', maxWidth: '500px' }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Box>

              <TableContainer component={Paper} sx={{ 
                backgroundColor: isDarkMode ? 'rgba(22, 28, 36, 0.7)' : 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(10px)',
                border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)',
              }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Názov spoločnosti</TableCell>
                      <TableCell>Kontaktná osoba</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Telefón</TableCell>
                      <TableCell>IČO</TableCell>
                      <TableCell>DIČ</TableCell>
                      <TableCell>IČ DPH</TableCell>
                      <TableCell>Typy vozidiel</TableCell>
                      <TableCell>Krajina</TableCell>
                      <TableCell>Dátum vytvorenia</TableCell>
                      <TableCell>Akcie</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCarriers.map((carrier) => (
                      <TableRow key={carrier.id}>
                        <TableCell>{carrier.companyName}</TableCell>
                        <TableCell>{`${carrier.contactName} ${carrier.contactSurname}`}</TableCell>
                        <TableCell>{carrier.contactEmail}</TableCell>
                        <TableCell>{carrier.contactPhone || '-'}</TableCell>
                        <TableCell>{carrier.ico || '-'}</TableCell>
                        <TableCell>{carrier.dic || '-'}</TableCell>
                        <TableCell>{carrier.icDph || '-'}</TableCell>
                        <TableCell>{carrier.vehicleTypes?.join(', ') || '-'}</TableCell>
                        <TableCell>{carrier.country}</TableCell>
                        <TableCell>
                          {carrier.createdAt.toLocaleDateString('sk-SK', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Upraviť">
                              <IconButton 
                                onClick={() => handleEditCarrier(carrier)}
                                sx={{ 
                                  color: '#ff9f43',
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
                                onClick={() => openCarrierDeleteConfirmation(carrier.id)}
                                sx={{ 
                                  color: '#ff6b6b',
                                  '&:hover': { 
                                    backgroundColor: 'rgba(255, 107, 107, 0.1)' 
                                  } 
                                }}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </TabPanel>
        </Box>
      </StyledPaper>

      <Dialog 
        open={showNewOrderDialog} 
        onClose={handleCloseNewOrderForm}
        maxWidth="lg"
        fullWidth
        sx={{
          '& .MuiBackdrop-root': {
            backdropFilter: 'blur(5px)',
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(0, 0, 0, 0.8)' 
              : 'rgba(255, 255, 255, 0.8)'
          },
          '& .MuiPaper-root': {
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(22, 28, 36, 0.95)' 
              : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            border: theme.palette.mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.08)' 
              : '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: '12px',
            overflow: 'hidden',
            maxHeight: '90vh'
          },
          '& .MuiDialogContent-root': {
            padding: 0,
            overflow: 'auto',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh'
          },
          '& .MuiDialogTitle-root': {
            padding: '20px 24px 12px',
            borderBottom: theme.palette.mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.08)' 
              : '1px solid rgba(0, 0, 0, 0.08)',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }
        }}
      >
        <DialogGlobalStyles open={showNewOrderDialog} />
        <DialogTitle>
          {isEditMode ? 'Upraviť objednávku' : 'Nová objednávka'}
          <IconButton 
            onClick={handleCloseNewOrderForm} 
            edge="end" 
            aria-label="close"
            sx={{
              position: 'absolute',
              right: 16,
              top: 16,
              color: theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <NewOrderForm 
            isModal={true} 
            onClose={handleCloseNewOrderForm} 
            isEdit={isEditMode}
            orderData={selectedOrder || undefined}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={showDeleteConfirm}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Potvrdiť odstránenie objednávky"}</DialogTitle>
        <DialogContent>
          <Typography>
            Naozaj chcete odstrániť túto objednávku?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteCancel}
            sx={{ 
              color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
            }}
          >
            Zrušiť
          </Button>
          <Button 
            onClick={handleDeleteConfirmed} 
            autoFocus
            sx={{ 
              color: '#ff9f43',
              '&:hover': { 
                backgroundColor: 'rgba(255, 159, 67, 0.1)' 
              } 
            }}
          >
            Potvrdiť
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={showPdfPreview}
        onClose={() => {
            setShowPdfPreview(false);
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
                setPdfUrl(null);
            }
        }}
        maxWidth="lg"
        fullWidth
        sx={{
            '& .MuiDialog-paper': {
                height: '90vh',
                maxHeight: '90vh',
                overflow: 'hidden'
            }
        }}
    >
        <DialogTitle sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.1)',
        }}>
            <Typography variant="h6">Náhľad PDF objednávky</Typography>
            <Box>
                {pdfUrl && (
                    <Tooltip title="Stiahnuť PDF">
                        <IconButton 
                            onClick={() => {
                                if (pdfUrl) {
                                    const a = document.createElement('a');
                                    a.href = pdfUrl;
                                    a.download = `objednavka-${selectedOrderDetail?.id?.substring(0, 8) || 'preview'}.pdf`;
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                }
                            }}
                            sx={{ mr: 1 }}
                        >
                            <FileDownloadIcon />
                        </IconButton>
                    </Tooltip>
                )}
                <IconButton onClick={() => {
                    setShowPdfPreview(false);
                    if (pdfUrl) {
                        URL.revokeObjectURL(pdfUrl);
                        setPdfUrl(null);
                    }
                }}>
                    <CloseIcon />
                </IconButton>
            </Box>
        </DialogTitle>
        <DialogContent sx={{ padding: 0, height: 'calc(100% - 64px)' }}>
            {pdfUrl && (
                <iframe 
                    src={pdfUrl} 
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="PDF preview"
                />
            )}
        </DialogContent>
    </Dialog>

    <CustomerForm
      open={showCustomerForm}
      onClose={() => {
        setShowCustomerForm(false);
        setSelectedCustomerForEdit(null);
      }}
      onSubmit={handleCustomerSubmit}
      editCustomer={selectedCustomerForEdit ? {
        companyName: selectedCustomerForEdit.companyName,
        street: selectedCustomerForEdit.street,
        city: selectedCustomerForEdit.city,
        zip: selectedCustomerForEdit.zip,
        country: selectedCustomerForEdit.country,
        contactName: selectedCustomerForEdit.contactName,
        contactSurname: selectedCustomerForEdit.contactSurname,
        contactEmail: selectedCustomerForEdit.contactEmail,
        ico: selectedCustomerForEdit.ico,
        dic: selectedCustomerForEdit.dic,
        icDph: selectedCustomerForEdit.icDph
      } : undefined}
    />

    {/* Formulár pre dopravcov */}
    <Dialog
      open={showCarrierForm}
      onClose={() => setShowCarrierForm(false)}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiBackdrop-root': {
          backdropFilter: 'blur(5px)',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(0, 0, 0, 0.8)' 
            : 'rgba(255, 255, 255, 0.8)'
        },
        '& .MuiPaper-root': {
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(22, 28, 36, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          border: theme.palette.mode === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.08)' 
            : '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '12px',
          overflow: 'hidden',
        }
      }}
    >
      <GlobalStyles 
        styles={{
          '.MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#ff9f43 !important'
          },
          '.MuiInputLabel-root.Mui-focused': {
            color: '#ff9f43 !important'
          },
          '.MuiCheckbox-root.Mui-checked': {
            color: '#ff9f43 !important'
          },
          '.MuiRadio-root.Mui-checked': {
            color: '#ff9f43 !important'
          },
          '.MuiSwitch-root .MuiSwitch-switchBase.Mui-checked': {
            color: '#ff9f43 !important'
          },
          '.MuiSwitch-root .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: '#ff9f43 !important'
          }
        }}
      />
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'rgba(0, 0, 0, 0.1)',
      }}>
        <Typography variant="h6">Pridať dopravcu</Typography>
        <IconButton onClick={() => setShowCarrierForm(false)} edge="end" aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
              Informácie o dopravcovi
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Názov spoločnosti"
              name="companyName"
              value={carrierFormData.companyName}
              onChange={handleCarrierFormChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Ulica"
              name="street"
              value={carrierFormData.street}
              onChange={handleCarrierFormChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Mesto"
              name="city"
              value={carrierFormData.city}
              onChange={handleCarrierFormChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="PSČ"
              name="zip"
              value={carrierFormData.zip}
              onChange={handleCarrierFormChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label="Krajina"
              name="country"
              value={carrierFormData.country}
              onChange={handleCarrierFormChange}
              SelectProps={{
                native: true,
              }}
              required
            >
              {countries.map((country) => (
                <option key={country.code} value={country.name}>
                  {country.name}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
              Daňové údaje (nepovinné)
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="IČO"
              name="ico"
              value={carrierFormData.ico}
              onChange={handleCarrierFormChange}
              helperText="Identifikačné číslo organizácie"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="DIČ"
              name="dic"
              value={carrierFormData.dic}
              onChange={handleCarrierFormChange}
              helperText="Daňové identifikačné číslo"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="IČ DPH"
              name="icDph"
              value={carrierFormData.icDph}
              onChange={handleCarrierFormChange}
              helperText="Identifikačné číslo pre DPH"
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
              Kontaktná osoba
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Meno"
              name="contactName"
              value={carrierFormData.contactName}
              onChange={handleCarrierFormChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Priezvisko"
              name="contactSurname"
              value={carrierFormData.contactSurname}
              onChange={handleCarrierFormChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Email"
              name="contactEmail"
              type="email"
              value={carrierFormData.contactEmail}
              onChange={handleCarrierFormChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Telefón"
              name="contactPhone"
              type="tel"
              value={carrierFormData.contactPhone}
              onChange={handleCarrierFormChange}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
              Dodatočné informácie
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Typy vozidiel (oddelené čiarkou)"
              name="vehicleTypes"
              placeholder="napr. Plachta, Chladnička, Sklápač"
              value={carrierFormData.vehicleTypes}
              onChange={handleCarrierFormChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Poznámky"
              name="notes"
              value={carrierFormData.notes}
              onChange={handleCarrierFormChange}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ 
        p: 3, 
        borderTop: '1px solid', 
        borderColor: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'rgba(0, 0, 0, 0.1)' 
      }}>
        <Button 
          onClick={() => setShowCarrierForm(false)} 
          sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
        >
          Zrušiť
        </Button>
        <Button 
          onClick={handleCarrierFormSubmit} 
          variant="contained" 
          sx={{ 
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 159, 67, 0.8)' : '#ff9f43',
            color: '#ffffff',
            '&:hover': { 
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 159, 67, 0.9)' : '#f7b067',
            } 
          }}
        >
          Uložiť
        </Button>
      </DialogActions>
    </Dialog>

    {/* Potvrdzovací dialóg pre vymazanie zákazníka */}
    <Dialog
      open={showCustomerDeleteConfirm}
      onClose={handleCustomerDeleteCancel}
      aria-labelledby="customer-delete-dialog-title"
      aria-describedby="customer-delete-dialog-description"
    >
      <DialogTitle id="customer-delete-dialog-title">{"Potvrdiť odstránenie zákazníka"}</DialogTitle>
      <DialogContent>
        <Typography>
          Naozaj chcete odstrániť tohto zákazníka?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleCustomerDeleteCancel}
          sx={{ 
            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
          }}
        >
          Zrušiť
        </Button>
        <Button 
          onClick={handleCustomerDeleteConfirmed} 
          autoFocus
          sx={{ 
            color: '#ff9f43',
            '&:hover': { 
              backgroundColor: 'rgba(255, 159, 67, 0.1)' 
            } 
          }}
        >
          Potvrdiť
        </Button>
      </DialogActions>
    </Dialog>

    {/* Potvrdzovací dialóg pre vymazanie dopravcu */}
    <Dialog
      open={showCarrierDeleteConfirm}
      onClose={handleCarrierDeleteCancel}
      aria-labelledby="carrier-delete-dialog-title"
      aria-describedby="carrier-delete-dialog-description"
    >
      <DialogTitle id="carrier-delete-dialog-title">{"Potvrdiť odstránenie dopravcu"}</DialogTitle>
      <DialogContent>
        <Typography>
          Naozaj chcete odstrániť tohto dopravcu?
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={handleCarrierDeleteCancel}
          sx={{ 
            color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
          }}
        >
          Zrušiť
        </Button>
        <Button 
          onClick={handleCarrierDeleteConfirmed} 
          autoFocus
          sx={{ 
            color: '#ff9f43',
            '&:hover': { 
              backgroundColor: 'rgba(255, 159, 67, 0.1)' 
            } 
          }}
        >
          Potvrdiť
        </Button>
      </DialogActions>
    </Dialog>
    </PageWrapper>
  );
};

function OrdersForm() {
  return <OrdersList />;
}

export default OrdersForm; 