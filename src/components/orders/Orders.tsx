import React, { useState, ChangeEvent, useEffect, useCallback } from 'react';
import { OrderFormData as BaseOrderFormData, LoadingPlace, UnloadingPlace, } from '../../types/orders';
import { countries } from '../../constants/countries';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  useTheme,
  useMediaQuery,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
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
  DialogContentText,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useThemeMode } from '../../contexts/ThemeContext';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { sk } from 'date-fns/locale';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

import NewOrderForm from './NewOrderForm';
import CloseIcon from '@mui/icons-material/Close';
import CustomerForm, { CustomerData } from '../management/CustomerForm';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import MobileOrderCard from './MobileOrderCard'; // Import nového komponentu
import OrderDetail from './OrderDetail';
import { Business as BusinessIcon } from '@mui/icons-material';
import Divider from '@mui/material/Divider';

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

const PageDescription = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#000000',
  marginTop: theme.spacing(3)
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

// eslint-disable-next-line
const _emptyLoadingPlace: LoadingPlace = {
  id: '',
  street: '',
  city: '',
  zip: '',
  country: 'Slovensko',
  dateTime: null,
  contactPerson: '',
  goods: []
};

// eslint-disable-next-line
const _emptyUnloadingPlace: UnloadingPlace = {
  id: '',
  street: '',
  city: '',
  zip: '',
  country: 'Slovensko',
  dateTime: null,
  contactPerson: '',
  goods: []
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
    } catch { return null; }
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

const StyledDialogContent = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  color: isDarkMode ? '#ffffff' : '#000000',
  padding: '0px',
  borderRadius: '24px', // Zmenené na 24px
  // border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`, // Odstránený border
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  overflow: 'hidden',
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  '& .MuiDialogTitle-root': {
    color: isDarkMode ? '#ffffff' : '#000000',
    padding: '24px 24px 16px 24px',
    // borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`, // Odstránený border
    fontSize: '1.25rem',
    fontWeight: 600,
    flexShrink: 0,
  },
  '& .MuiDialogContent-root': {
    padding: '16px 24px',
    color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
    overflowY: 'auto',
    flexGrow: 1,
  },
  '& .MuiDialogActions-root': {
      padding: '16px 24px 24px 24px',
      // borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`, // Odstránený border
      flexShrink: 0,
  }
}));

const StyledTableRow = styled(TableRow, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode?: boolean }>(({ isDarkMode = false }) => ({
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  }
}));

const StyledTableCell = styled(TableCell, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode?: boolean }>(({ isDarkMode = false }) => ({
  color: isDarkMode ? '#ffffff' : '#000000',
  borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  padding: '16px',
  fontSize: '0.9rem',
  whiteSpace: 'nowrap'
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
  createdAt?: Date;
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
  const { t } = useTranslation();
  const { isDarkMode } = useThemeMode();
  const theme = useTheme();
  const { userData } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State pre objednávky, zákazníkov, dopravcov, filtre, atď.
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderFormData | null>(null);
  const [tabValue, setTabValue] = useState(0);
  // eslint-disable-next-line
  const [_orderToUpdateId, setOrderToUpdateId] = useState<string | null>(null);
  // eslint-disable-next-line
  const [_newOrderNumber, setNewOrderNumber] = useState('');
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<OrderFormData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<Customer | null>(null);
  const [showCustomerDeleteConfirm, setShowCustomerDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string>('');
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
  // eslint-disable-next-line
  const [_selectedCarrierForEdit, setSelectedCarrierForEdit] = useState<Carrier | null>(null);
  const [showCarrierDeleteConfirm, setShowCarrierDeleteConfirm] = useState(false);
  const [carrierToDelete, setCarrierToDelete] = useState<string>('');
  const [loadingPdf, setLoadingPdf] = useState(false);
  // eslint-disable-next-line
  const [_showOrderNumberDialog, setShowOrderNumberDialog] = useState(false);
  // eslint-disable-next-line
  const [_orderToDelete, _setOrderToDelete] = useState<string>('');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [_deleteDialogOpen, _setDeleteDialogOpen] = useState(false);

  // --- FETCH FUNKCIE (presunuté SEM HORE) ---
  
  const fetchTeamMembers = useCallback(async () => {
    if (!userData?.companyID) return;
    try {
      const usersQuery = query(collection(db, 'users'), where('companyID', '==', userData.companyID));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData: {[id: string]: {name: string, email: string}} = {};
      usersSnapshot.docs.forEach(doc => {
        const userDoc = doc.data();
        let userName = '';
        if (userDoc.firstName || userDoc.lastName) userName = `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim();
        if (!userName && userDoc.displayName) userName = userDoc.displayName;
        if (!userName && userDoc.email) {
          const emailParts = userDoc.email.split('@');
          if (emailParts.length > 0) {
            const nameParts = emailParts[0].split(/[._-]/);
            userName = nameParts.map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
          }
        }
        if (!userName) userName = userDoc.email ? userDoc.email.split('@')[0] : 'Používateľ';
        usersData[doc.id] = { name: userName, email: userDoc.email || '' };
      });
      if (userData.uid && !usersData[userData.uid]) {
        let currentUserName = '';
        if ((userData as any).firstName || (userData as any).lastName) currentUserName = `${(userData as any).firstName || ''} ${(userData as any).lastName || ''}`.trim();
        if (!currentUserName && (userData as any).displayName) currentUserName = (userData as any).displayName;
        if (!currentUserName && userData.email) {
          const emailParts = userData.email.split('@');
          if (emailParts.length > 0) {
            const nameParts = emailParts[0].split(/[._-]/);
            currentUserName = nameParts.map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
          }
        }
        if (!currentUserName) currentUserName = userData.email ? userData.email.split('@')[0] : 'Aktuálny používateľ';
        usersData[userData.uid] = { name: currentUserName, email: userData.email || '' };
      }
      setTeamMembers(usersData);
    } catch (err) { console.error('Chyba pri načítaní členov tímu:', err); }
  }, [userData]);

  const fetchCustomers = useCallback(async () => {
    console.log("Attempting to fetch customers..."); // Log začiatku
    if (!userData?.companyID) {
      console.log("Fetch Customers: No companyID found.");
      setCustomers([]);
      return;
    } 
    try {
      const customersRef = collection(db, 'customers');
      const q = query(
        customersRef, 
        where('companyID', '==', userData.companyID),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const customersData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return { id: doc.id, ...data, createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt } as Customer;
      });
      console.log(`Fetched ${customersData.length} customers for company ${userData.companyID}.`); // Log výsledku
      setCustomers(customersData);
    } catch (error) {
      console.error('Fetch Customers Error:', error); // Log chyby
    }
  }, [userData]);
  
  const fetchCarriers = useCallback(async () => {
    console.log("Attempting to fetch carriers..."); // Log začiatku
    if (!userData?.companyID) {
      console.log("Fetch Carriers: No companyID found.");
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
        const carrier = { // Vytvoríme premennú pre logovanie
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
        } as Carrier;
        console.log("Mapping carrier:", carrier); // Logujeme spracovaný objekt
        return carrier;
      });
      console.log(`Fetched ${carriersData.length} carriers for company ${userData.companyID}.`); 
      setCarriers(carriersData);
    } catch (error) {
      console.error('Fetch Carriers Error:', error); 
    }
  }, [userData]);

  const fetchOrders = useCallback(async () => {
    if (!userData?.companyID) { setOrders([]); setLoading(false); setError('Nemáte priradenú firmu.'); return; }
    setLoading(true); setError(null);
    try {
      let ordersQuery = query(collection(db, 'orders'), where('companyID', '==', userData.companyID));
      if (startDate) ordersQuery = query(ordersQuery, where('createdAt', '>=', Timestamp.fromDate(new Date(startDate.setHours(0,0,0,0)))));
      if (endDate) {
           const endOfDay = new Date(endDate); endOfDay.setHours(23, 59, 59, 999);
           ordersQuery = query(ordersQuery, where('createdAt', '<=', Timestamp.fromDate(endOfDay)));
      }
      ordersQuery = query(ordersQuery, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(ordersQuery);
      const currentTeamMembers = teamMembers;
      const ordersData: OrderFormData[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const createdByName = (data.createdBy && currentTeamMembers[data.createdBy]?.name) || data.createdByName || ''; 
        const loadingPlacesWithDates = (data.loadingPlaces || []).map((p: any) => ({ ...p, dateTime: convertToDate(p.dateTime) }));
        const unloadingPlacesWithDates = (data.unloadingPlaces || []).map((p: any) => ({ ...p, dateTime: convertToDate(p.dateTime) }));
        const createdAtTimestamp = data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(convertToDate(data.createdAt) || new Date());
        const order: OrderFormData = {
          id: doc.id, companyID: data.companyID, createdBy: data.createdBy, createdAt: createdAtTimestamp, loadingPlaces: loadingPlacesWithDates, unloadingPlaces: unloadingPlacesWithDates, customerCompany: data.zakaznik || data.customerCompany || '', customerPrice: data.suma || data.customerPrice || '', customerContactName: data.customerContactName || '', customerContactSurname: data.customerContactSurname || '', customerVatId: data.customerVatId || '', customerStreet: data.customerStreet || '', customerCity: data.customerCity || '', customerZip: data.customerZip || '', customerCountry: data.customerCountry || 'Slovensko', customerEmail: data.customerEmail || '', customerPhone: data.customerPhone || '', goodsDescription: data.goodsDescription || '', weightKg: data.weightKg || '', dimensionsL: data.dimensionsL || '', dimensionsW: data.dimensionsW || '', dimensionsH: data.dimensionsH || '', quantity: data.quantity || '', carrierCompany: data.carrierCompany || '', carrierContact: data.carrierContact || '', carrierVehicleReg: data.carrierVehicleReg || '', carrierPrice: data.carrierPrice || '', reminderDateTime: convertToDate(data.reminderDateTime),
        };
        (order as any).zakaznik = data.zakaznik || data.customerCompany || '';
        (order as any).kontaktnaOsoba = data.kontaktnaOsoba || `${data.customerContactName || ''} ${data.customerContactSurname || ''}`.trim();
        (order as any).suma = data.suma || data.customerPrice || '';
        (order as any).createdByName = createdByName;
        (order as any).orderNumberFormatted = data.orderNumberFormatted || '';
        return order;
      });
      setOrders(ordersData);
    } catch (err) { console.error('Chyba pri načítaní objednávok:', err); setError('Nastala chyba pri načítaní objednávok'); }
    finally { setLoading(false); }
  }, [userData, startDate, endDate, teamMembers]);

  // --- useEffect HOOKY (teraz sú definované PO fetch funkciách) ---

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  useEffect(() => {
    console.log("Running initial data fetch on component mount.");
    fetchCustomers(); 
    fetchCarriers();
    fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (userData) { 
      console.log("Running data fetch due to user change.");
      // Funkcie sa zavolajú automaticky vďaka závislosti na userData v ich useCallback
    }
  }, [userData]);

  useEffect(() => {
    console.log("Running fetchOrders due to filter change (startDate, endDate).");
    // FetchOrders závisí od startDate/endDate, zavolá sa automaticky
    fetchOrders(); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  // --- OSTATNÉ FUNKCIE --- 

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const getFilteredCustomerOrders = () => {
    return filteredOrders.filter(order => {
      // Filter pre zákazníkov - zobrazujeme len objednávky, ktoré majú zákazníka (customerCompany) alebo (zakaznik)
      return (order.customerCompany || (order as any).zakaznik);
    });
  };

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
    setShowNewOrderDialog(true);
    setSelectedOrder(null);
    setIsEditMode(false);
  };

  const handleCloseNewOrderForm = () => {
    setShowNewOrderDialog(false);
    setSelectedOrder(null);
    setIsEditMode(false);
  };

  // Upravená funkcia pre náhľad PDF
  const handlePreviewPDF = async (order: OrderFormData) => {
    try {
      if (!order.id) {
        alert('Objednávka nemá priradené ID. Prosím, uložte objednávku a skúste znovu.');
        return;
      }
      
      setLoadingPdf(true);
      setShowPdfPreview(true);
      setPreviewOrder(order); // Nastaviť aktuálnu objednávku do stavu
      
      // Volanie serverovej funkcie pre generovanie PDF
      const generatePdf = httpsCallable(functions, 'generateOrderPdf');
      const result = await generatePdf({ orderId: order.id });
      
      // @ts-ignore - výsledok obsahuje pdfBase64 a fileName
      const { pdfBase64 } = result.data;
      
      // Konverzia base64 na Blob
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Vytvorenie URL pre blob
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
      setLoadingPdf(false);
    } catch (error) {
      console.error('Chyba pri generovaní náhľadu PDF:', error);
      alert('Nastala chyba pri generovaní PDF objednávky: ' + (error as Error).message);
      setLoadingPdf(false);
      setShowPdfPreview(false);
    }
  };

  // Upravená funkcia pre stiahnutie PDF
  const handleDownloadPDF = async (order: OrderFormData) => {
    try {
      if (!order.id) {
        alert('Objednávka nemá priradené ID. Prosím, uložte objednávku a skúste znovu.');
        return;
      }
      
      setLoading(true);
      
      // Volanie serverovej funkcie pre generovanie PDF
      const generatePdf = httpsCallable(functions, 'generateOrderPdf');
      const result = await generatePdf({ orderId: order.id });
      
      // @ts-ignore - výsledok obsahuje pdfBase64 a fileName
      const { pdfBase64, fileName } = result.data;
      
      // Konverzia base64 na Blob
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Vytvorenie URL a stiahnutie
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `objednavka_${order.id.substring(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setLoading(false);
    } catch (error) {
      console.error('Chyba pri sťahovaní PDF:', error);
      alert('Nastala chyba pri generovaní PDF objednávky: ' + (error as Error).message);
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    setShowCustomerForm(true);
  };

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
      console.log("Calling fetchCustomers after successful add..."); // Pridaný log
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
      (customer.companyName || '').toLowerCase().includes(searchLower) ||
      (customer.contactName || '').toLowerCase().includes(searchLower) ||
      (customer.contactSurname || '').toLowerCase().includes(searchLower) ||
      (customer.contactEmail || '').toLowerCase().includes(searchLower) ||
      (customer.ico || '').toLowerCase().includes(searchLower) ||
      (customer.dic || '').toLowerCase().includes(searchLower) ||
      (customer.icDph || '').toLowerCase().includes(searchLower)
    );
  });

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
      console.log("Calling fetchCarriers after successful add..."); // Pridaný log
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
      (carrier.companyName || '').toLowerCase().includes(searchLower) ||
      (carrier.contactName || '').toLowerCase().includes(searchLower) ||
      (carrier.contactSurname || '').toLowerCase().includes(searchLower) ||
      (carrier.contactEmail || '').toLowerCase().includes(searchLower) ||
      (carrier.contactPhone || '').toLowerCase().includes(searchLower) ||
      (carrier.ico || '').toLowerCase().includes(searchLower) ||
      (carrier.dic || '').toLowerCase().includes(searchLower) ||
      (carrier.icDph || '').toLowerCase().includes(searchLower)
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

  // Pridám pomocnú funkciu nad renderom tabuľky:
  const getCustomerVatId = (customer: any) => {
    return customer.icDph || customer.vatId || customer['IČ_DPH'] || customer['ic_dph'] || '-';
  };

  // eslint-disable-next-line
  const _openOrderNumberEditDialog = (orderId: string) => {
    setOrderToUpdateId(orderId);
    setShowOrderNumberDialog(true);
  };

  // eslint-disable-next-line
  const _closeOrderNumberEditDialog = () => {
    setOrderToUpdateId(null);
    setNewOrderNumber('');
    setShowOrderNumberDialog(false);
  };

  const handleRowClick = (order: OrderFormData) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
  };

  return (
    <PageWrapper>
      <DialogGlobalStyles open={showNewOrderDialog || showCustomerForm || showCarrierForm || showDeleteConfirm || showCustomerDeleteConfirm || showCarrierDeleteConfirm} />
      <PageHeader>
        <PageTitle isDarkMode={isDarkMode}>{t('navigation.orders')}</PageTitle>
              <PageDescription>
          {t('orders.description')}
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
              <Tab label={t('orders.allOrders')} />
              <Tab label={t('orders.customers')} />
              <Tab label={t('orders.carriers')} />
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
{t('orders.newOrder')}
          </Button>
        </Box>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
              <TextField
                  label={t('orders.searchOrder')}
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
                          label={t('common.from')}
                          value={startDate}
                          onChange={(newValue) => setStartDate(newValue)}
                          slotProps={{ textField: { size: 'small' } }}
                      />
                      <DatePicker
                          label={t('common.to')}
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
{t('common.clearFilter')}
                  </Button>
              </Box>
          </Collapse>
          
          {loading ? (
            <Box display="flex" justifyContent="center" mt={4}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          ) : isMobile ? ( // Ak je mobilné zariadenie, zobraz karty
            <Box mt={2}>
              {getFilteredCustomerOrders().map(order => (
                <MobileOrderCard 
                  key={order.id} 
                  order={order} 
                  onEdit={handleEditOrder} 
                  onDelete={handleDeleteOrder}
                  onPreviewPDF={handlePreviewPDF}
                  onDownloadPDF={handleDownloadPDF}
                />
              ))}
                                  {getFilteredCustomerOrders().length === 0 && (
                      <Typography variant="body1" align="center" sx={{ mt: 4 }}>
                        {t('orders.noOrdersFound')}
                      </Typography>
                   )}
            </Box>
          ) : ( // Ak nie je mobilné zariadenie, zobraz tabuľku
            <TableContainer 
              component={Paper} 
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
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.orderNumber')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.customer')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.contactPerson')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.loading')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.loadingTime')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.unloading')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.unloadingTime')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.goods')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode} sx={{ color: '#ff9f43', fontWeight: 'bold' }}>{t('orders.customerPrice')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode} sx={{ color: '#1976d2', fontWeight: 'bold' }}>{t('orders.carrierPrice')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode} sx={{ color: '#2ecc71', fontWeight: 'bold' }}>{t('orders.profit')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.dispatcher')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.creationDate')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.actions')}</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {getFilteredCustomerOrders().map((order) => (
                    <StyledTableRow 
                      isDarkMode={isDarkMode} 
                      key={order.id}
                      onClick={() => handleRowClick(order)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <StyledTableCell isDarkMode={isDarkMode}>{(order as any).orderNumberFormatted || 'N/A'}</StyledTableCell>
                      <StyledTableCell isDarkMode={isDarkMode}>{(order as any).zakaznik || order.customerCompany || '-'}</StyledTableCell>
                      <StyledTableCell isDarkMode={isDarkMode}>{(order as any).kontaktnaOsoba || '-'}</StyledTableCell>
                      <StyledTableCell isDarkMode={isDarkMode}>{order.loadingPlaces?.[0]?.city || '-'}</StyledTableCell>
                      <StyledTableCell isDarkMode={isDarkMode}>{order.loadingPlaces?.[0]?.dateTime ? format(convertToDate(order.loadingPlaces[0].dateTime)!, 'dd.MM HH:mm') : '-'}</StyledTableCell>
                      <StyledTableCell isDarkMode={isDarkMode}>{order.unloadingPlaces?.[0]?.city || '-'}</StyledTableCell>
                      <StyledTableCell isDarkMode={isDarkMode}>{order.unloadingPlaces?.[0]?.dateTime ? format(convertToDate(order.unloadingPlaces[0].dateTime)!, 'dd.MM HH:mm') : '-'}</StyledTableCell>
                      <StyledTableCell isDarkMode={isDarkMode}>{order.loadingPlaces?.[0]?.goods?.[0]?.name || '-'}</StyledTableCell>
                      <StyledTableCell isDarkMode={isDarkMode} sx={{ color: '#ff9f43', fontWeight: 'bold' }}>{`${(order as any).suma || order.customerPrice || '0'} €`}</StyledTableCell>
                      <StyledTableCell isDarkMode={isDarkMode} sx={{ color: '#1976d2', fontWeight: 'bold' }}>{`${order.carrierPrice || '0'} €`}</StyledTableCell>
                      <StyledTableCell isDarkMode={isDarkMode} sx={{ fontWeight: 'bold' }}>{(() => { const c = parseFloat((order as any).suma || order.customerPrice || '0'); const p = parseFloat(order.carrierPrice || '0'); return !isNaN(c) && !isNaN(p) ? `${(c - p).toFixed(2)} €` : '-'; })()}</StyledTableCell>
                      <StyledTableCell isDarkMode={isDarkMode}>
                        {
                          // Logika na zobrazenie mena namiesto emailu v tabuľke
                          (order.createdBy && teamMembers[order.createdBy]?.name) ||
                          ((order as any).createdByName && !(order as any).createdByName.includes('@') ? (order as any).createdByName : null) ||
                          ((order as any).createdByName && (order as any).createdByName.includes('@') ? (order as any).createdByName.split('@')[0] : null) || // Fallback na časť emailu pred @
                          'Neznámy'
                        }
                      </StyledTableCell>
                      <StyledTableCell isDarkMode={isDarkMode}>{order.createdAt ? format(convertToDate(order.createdAt)!, 'dd.MM.yyyy') : 'N/A'}</StyledTableCell>
                      <StyledTableCell isDarkMode={isDarkMode}> {/* Akcie */} 
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title={t('orders.edit')}><IconButton onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); handleEditOrder(order); }} sx={{ color: '#ff9f43' }}><EditIcon fontSize="small"/></IconButton></Tooltip>
                          <Tooltip title={t('orders.previewPDF')}><IconButton onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); handlePreviewPDF(order); }} sx={{ color: '#1e88e5' }}><VisibilityIcon fontSize="small"/></IconButton></Tooltip>
                          <Tooltip title={t('orders.downloadPDF')}><IconButton onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); handleDownloadPDF(order); }} sx={{ color: '#4caf50' }}><FileDownloadIcon fontSize="small"/></IconButton></Tooltip>
                          <Tooltip title={t('orders.delete')}><IconButton onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); openDeleteConfirmation(order.id || ''); }} sx={{ color: '#ff6b6b' }}><DeleteIcon fontSize="small"/></IconButton></Tooltip>
                        </Box>
                      </StyledTableCell>
                    </StyledTableRow>
                  ))}
                                         {getFilteredCustomerOrders().length === 0 && (
                          <TableRow>
                              <TableCell colSpan={14} align="center">
                                  {t('orders.noOrdersFound')}
                              </TableCell>
                          </TableRow>
                       )}
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
{t('orders.addCustomer')}
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  <TextField
                    label={t('orders.searchCustomer')}
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

              <TableContainer 
                component={Paper} 
                sx={{ // Tu začína správny sx objekt
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
                  }} // Tu končí správny sx objekt
              >
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('orders.companyName')}</TableCell>
                      <TableCell>{t('orders.contactPerson')}</TableCell>
                      <TableCell>{t('orders.email')}</TableCell>
                      <TableCell>{t('orders.ico')}</TableCell>
                      <TableCell>{t('orders.icDph')}</TableCell>
                      <TableCell>{t('orders.dic')}</TableCell>
                      <TableCell>{t('orders.country')}</TableCell>
                      <TableCell>{t('orders.creationDate')}</TableCell>
                      <TableCell>{t('orders.actions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCustomers.map((customer) => (
                      <TableRow key={customer.id}>
                        <TableCell>{customer.companyName || (customer as any)['company'] || (customer as any)['name'] || '-'}</TableCell>
                        <TableCell>{`${customer.contactName || ''} ${customer.contactSurname || ''}`.trim() || '-'}</TableCell>
                        <TableCell>{customer.contactEmail || '-'}</TableCell>
                        <TableCell>{customer.ico || '-'}</TableCell>
                        <TableCell>{getCustomerVatId(customer)}</TableCell>
                        <TableCell>{customer.dic || '-'}</TableCell>
                        <TableCell>{customer.country || '-'}</TableCell>
                        <TableCell>{customer.createdAt ? customer.createdAt.toLocaleDateString('sk-SK', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title={t('orders.edit')}>
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
                            <Tooltip title={t('orders.delete')}>
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
{t('orders.addCarrier')}
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  <TextField
                    label={t('orders.searchCarrier')}
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

              <TableContainer 
                component={Paper} 
                sx={{
                    // Štýly skopírované z BusinessCases.tsx
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
                      <TableCell>{t('orders.companyName')}</TableCell>
                      <TableCell>{t('orders.contactPerson')}</TableCell>
                      <TableCell>{t('orders.email')}</TableCell>
                      <TableCell>{t('orders.phone')}</TableCell>
                      <TableCell>{t('orders.ico')}</TableCell>
                      <TableCell>{t('orders.icDph')}</TableCell>
                      <TableCell>{t('orders.dic')}</TableCell>
                      <TableCell>{t('orders.vehicleTypes')}</TableCell>
                      <TableCell>{t('orders.country')}</TableCell>
                      <TableCell>{t('orders.creationDate')}</TableCell>
                      <TableCell>{t('orders.actions')}</TableCell>
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
                        <TableCell>{carrier.icDph || '-'}</TableCell>
                        <TableCell>{carrier.dic || '-'}</TableCell>
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
                            <Tooltip title={t('orders.edit')}>
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
                            <Tooltip title={t('orders.delete')}>
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
        PaperProps={{
          sx: {
            background: 'none',
            boxShadow: 'none',
            margin: {
              xs: '8px',
              sm: '16px'
            },
            maxHeight: '90vh',
            overflow: 'hidden'
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)'
          }
        }}
      >
        <DialogGlobalStyles open={showNewOrderDialog} />
        <StyledDialogContent isDarkMode={isDarkMode}>
          <DialogTitle sx={{ 
            p: 0, 
            mb: 3, 
            fontWeight: 700, 
            color: isDarkMode ? '#ffffff' : '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <BusinessIcon sx={{ color: '#ff9f43' }} />
{isEditMode ? t('orders.edit') + ' ' + t('orders.newOrder').toLowerCase() : t('orders.newOrder')}
            </Box>
            <IconButton 
              onClick={handleCloseNewOrderForm} 
              edge="end" 
              aria-label="close"
              sx={{
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
              }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          
          <Divider sx={{ mb: 3, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
          
          <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
            <NewOrderForm 
              isModal={true} 
              onClose={handleCloseNewOrderForm} 
              isEdit={isEditMode}
              orderData={selectedOrder || undefined}
            />
          </Box>
        </StyledDialogContent>
      </Dialog>

      {/* Dialog pre mazanie OBJEDNÁVKY */}
      <Dialog
        open={showDeleteConfirm}
        onClose={handleDeleteCancel}
        aria-labelledby="confirm-order-delete-title"
        aria-describedby="confirm-order-delete-description"
        // Props pre vzhľad z Contacts.tsx
        PaperProps={{
          sx: {
            background: 'none', // Priehľadné pozadie samotného dialógu
            boxShadow: 'none',
            margin: { xs: '8px', sm: '16px' },
            borderRadius: '24px' // Použité väčšie zaoblenie
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(8px)', // Blur pozadia
            backgroundColor: 'rgba(0, 0, 0, 0.6)' // Tmavé priehľadné pozadie
          }
        }}
      >
        <StyledDialogContent isDarkMode={isDarkMode}>
          <DialogTitle id="confirm-order-delete-title">{t('common.confirmDelete')}</DialogTitle>
        <DialogContent>
            <DialogContentText id="confirm-order-delete-description"> 
            {t('orders.deleteConfirmation')}
            </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleDeleteCancel}
            sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                '&:hover': { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', }
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleDeleteConfirmed} 
              variant="contained" 
              color="error" 
              disabled={loading} 
              autoFocus // Vrátenie autoFocus
              sx={{ color: '#ffffff' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : t('common.confirmDelete')} 
          </Button>
        </DialogActions>
        </StyledDialogContent>
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
            <Typography variant="h6">{t('orders.pdfPreviewTitle')}</Typography>
            <Box>
                {pdfUrl && (
                    <Tooltip title={t('orders.downloadPDF')}>
                        <IconButton 
                            onClick={() => {
                                if (pdfUrl) {
                                    const a = document.createElement('a');
                                    a.href = pdfUrl;
                                    a.download = `objednavka-${previewOrder?.id?.substring(0, 8) || 'preview'}.pdf`;
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
            {loadingPdf ? (
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    width: '100%',
                    p: 3
                }}>
                    <CircularProgress size={60} sx={{ mb: 2 }} />
                    <Typography variant="h6" sx={{ mb: 1 }}>{t('orders.loadingPdf')}</Typography>
                    <Typography variant="body2" color="text.secondary">{t('orders.processingTime')}</Typography>
                </Box>
            ) : pdfUrl ? (
                <iframe 
                    src={pdfUrl} 
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    title="PDF preview"
                />
            ) : (
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    height: '100%',
                    width: '100%'
                }}>
                    <Typography>{t('orders.pdfLoadError')}</Typography>
                </Box>
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
        <Typography variant="h6">{t('orders.addCarrier')}</Typography>
        <IconButton onClick={() => setShowCarrierForm(false)} edge="end" aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
              {t('orders.carrierInfo')}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('orders.companyName')}
              name="companyName"
              value={carrierFormData.companyName}
              onChange={handleCarrierFormChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('orders.street')}
              name="street"
              value={carrierFormData.street}
              onChange={handleCarrierFormChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('orders.city')}
              name="city"
              value={carrierFormData.city}
              onChange={handleCarrierFormChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('orders.zipCode')}
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
              label={t('orders.country')}
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
              {t('orders.taxInfo')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label={t('orders.ico')}
              name="ico"
              value={carrierFormData.ico}
              onChange={handleCarrierFormChange}
              helperText={t('orders.businessId')}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label={t('orders.dic')}
              name="dic"
              value={carrierFormData.dic}
              onChange={handleCarrierFormChange}
              helperText={t('orders.taxId')}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label={t('orders.icDph')}
              name="icDph"
              value={carrierFormData.icDph}
              onChange={handleCarrierFormChange}
              helperText={t('orders.vatIdDescription')}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
              {t('orders.contactPerson')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('orders.firstName')}
              name="contactName"
              value={carrierFormData.contactName}
              onChange={handleCarrierFormChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('orders.lastName')}
              name="contactSurname"
              value={carrierFormData.contactSurname}
              onChange={handleCarrierFormChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('orders.email')}
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
              label={t('orders.phone')}
              name="contactPhone"
              type="tel"
              value={carrierFormData.contactPhone}
              onChange={handleCarrierFormChange}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
              {t('orders.additionalInfo')}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('orders.vehicleTypes')}
              name="vehicleTypes"
              placeholder={t('orders.vehicleTypesPlaceholder')}
              value={carrierFormData.vehicleTypes}
              onChange={handleCarrierFormChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('orders.notes')}
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
{t('common.cancel')}
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
{t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>

    {/* Potvrdzovací dialóg pre vymazanie ZÁKAZNÍKA */}
    <Dialog
        open={showCustomerDeleteConfirm}
        onClose={handleCustomerDeleteCancel}
        aria-labelledby="confirm-customer-delete-title"
        aria-describedby="confirm-customer-delete-description"
        // Props pre vzhľad z Contacts.tsx
        PaperProps={{
          sx: { background: 'none', boxShadow: 'none', margin: { xs: '8px', sm: '16px' }, borderRadius: '24px' }
        }}
        BackdropProps={{
          sx: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.6)' }
        }}
      >
        <StyledDialogContent isDarkMode={isDarkMode}>
          <DialogTitle id="confirm-customer-delete-title">{t('common.confirmDelete')}</DialogTitle>
          <DialogContent>
            <DialogContentText id="confirm-customer-delete-description"> 
              {t('orders.deleteCustomerConfirmation')}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCustomerDeleteCancel} sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)', '&:hover': { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', } }}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleCustomerDeleteConfirmed} 
              variant="contained" 
              color="error" 
              disabled={loading} 
              autoFocus // Vrátenie autoFocus
              sx={{ color: '#ffffff' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : t('common.confirmDelete')} 
            </Button>
          </DialogActions>
        </StyledDialogContent>
      </Dialog>

    {/* Potvrdzovací dialóg pre vymazanie DOPRAVCU */}
    <Dialog
        open={showCarrierDeleteConfirm}
        onClose={handleCarrierDeleteCancel}
        aria-labelledby="confirm-carrier-delete-title"
        aria-describedby="confirm-carrier-delete-description"
        // Props pre vzhľad z Contacts.tsx
        PaperProps={{
          sx: { background: 'none', boxShadow: 'none', margin: { xs: '8px', sm: '16px' }, borderRadius: '24px' }
        }}
        BackdropProps={{
          sx: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.6)' }
        }}
      >
        <StyledDialogContent isDarkMode={isDarkMode}>
          <DialogTitle id="confirm-carrier-delete-title">{t('common.confirmDelete')}</DialogTitle>
          <DialogContent>
            <DialogContentText id="confirm-carrier-delete-description"> 
              {t('orders.deleteCarrierConfirmation')}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCarrierDeleteCancel} sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)', '&:hover': { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', } }}>
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleCarrierDeleteConfirmed} 
              variant="contained" 
              color="error" 
              disabled={loading} 
              autoFocus // Vrátenie autoFocus
              sx={{ color: '#ffffff' }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : t('common.confirmDelete')} 
            </Button>
          </DialogActions>
        </StyledDialogContent>
    </Dialog>

    <OrderDetail 
      open={detailDialogOpen}
      onClose={handleCloseDetail}
      order={selectedOrder}
    />
    </PageWrapper>
  );
};

function OrdersForm() {
  return <OrdersList />;
}

export default OrdersForm; 