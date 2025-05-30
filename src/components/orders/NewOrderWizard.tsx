import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  alpha,
  SelectChangeEvent,
  InputAdornment,
  Collapse,
  Snackbar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { sk } from 'date-fns/locale';

// Icons
import PersonIcon from '@mui/icons-material/Person';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SummaryIcon from '@mui/icons-material/Assessment';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import InventoryIcon from '@mui/icons-material/Inventory';
import EuroIcon from '@mui/icons-material/Euro';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BusinessIcon from '@mui/icons-material/Business';
import PhoneIcon from '@mui/icons-material/Phone';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CheckIcon from '@mui/icons-material/Check';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

// Firebase imports
import { collection, addDoc, query, where, getDocs, doc, updateDoc, Timestamp, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeContext';

// Types
import { OrderFormData, LoadingPlace, UnloadingPlace, GoodsItem } from '../../types/orders';
import { Customer } from '../../types/customers';
import { Carrier } from '../../types/carriers';
import { countries } from '../../constants/countries';
import CustomerForm, { CustomerData } from '../management/CustomerForm';

import { createPortal } from 'react-dom';

// BareTooltip komponent - presun z Navbar
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

// Custom styled components
const StyledStepper = styled(Stepper)(({ theme }) => ({
  '& .MuiStepLabel-root .Mui-completed': {
    color: '#ff9f43',
  },
  '& .MuiStepLabel-root .Mui-active': {
    color: '#ff9f43',
  },
  '& .MuiStepLabel-label.Mui-active': {
    color: '#ff9f43',
    fontWeight: 600,
  },
  '& .MuiStepLabel-label.Mui-completed': {
    color: '#ff9f43',
    fontWeight: 500,
  },
  '& .MuiStepConnector-line': {
    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
  },
  '& .MuiStepConnector-root.Mui-completed .MuiStepConnector-line': {
    borderColor: '#ff9f43',
  },
  '& .MuiStepConnector-root.Mui-active .MuiStepConnector-line': {
    borderColor: '#ff9f43',
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? 'rgba(28, 28, 45, 0.95)' 
    : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(0, 0, 0, 0.1)'}`,
  borderRadius: 16,
  transition: 'all 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark'
      ? '0 8px 25px rgba(0, 0, 0, 0.3)'
      : '0 8px 25px rgba(0, 0, 0, 0.15)',
  }
}));

const StyledAutocomplete = styled(Autocomplete)(() => ({
  '& .MuiOutlinedInput-root': {
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#ff9f43',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: '#ff9f43',
  },
}));

const LocationCard = styled(Card)(({ theme }) => ({
  background: theme.palette.mode === 'dark' 
    ? alpha(theme.palette.background.paper, 0.6)
    : alpha('#f8f9fa', 0.8),
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(0, 0, 0, 0.1)'}`,
  borderRadius: 12,
  marginBottom: theme.spacing(2),
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    borderColor: alpha('#ff9f43', 0.5),
  }
}));

// Initial states
const emptyGoodsItem: GoodsItem = {
  id: crypto.randomUUID(),
  name: '',
  quantity: 1,
  unit: 'ks',
  weight: undefined,
  palletExchange: 'Bez výmeny',
  dimensions: '',
  description: '',
};

const emptyLoadingPlace: LoadingPlace = {
  id: crypto.randomUUID(),
  companyName: '',
  street: '',
  city: '',
  zip: '',
  country: 'Slovensko',
  dateTime: null,
  contactPerson: '', // zachováme pre spätnosť
  contactPersonName: '',
  contactPersonPhone: '',
  goods: [{ ...emptyGoodsItem }]
};

const emptyUnloadingPlace: UnloadingPlace = {
  id: crypto.randomUUID(),
  companyName: '',
  street: '',
  city: '',
  zip: '',
  country: 'Slovensko',
  dateTime: null,
  contactPerson: '', // zachováme pre spätnosť
  contactPersonName: '',
  contactPersonPhone: '',
  goods: [{ ...emptyGoodsItem }]
};

interface NewOrderWizardProps {
  open: boolean;
  onClose: () => void;
  isEdit?: boolean;
  orderData?: Partial<OrderFormData>;
  onOrderSaved?: () => void; // Callback pre obnovenie dát po uložení
}

const NewOrderWizard: React.FC<NewOrderWizardProps> = ({ 
  open, 
  onClose, 
  isEdit = false, 
  orderData = {}, 
  onOrderSaved
}) => {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const { isDarkMode } = useThemeMode();

  // Stepper state
  const [activeStep, setActiveStep] = useState(0);
  
  // Form data state
  const [formData, setFormData] = useState<Partial<OrderFormData>>({
    datumPrijatia: new Date(),
    zakaznik: '',
    zakaznikData: null,
    kontaktnaOsoba: '',
    suma: '',
    mena: 'EUR',
    cisloNakladuZakaznika: '',
    internaPoznamka: '',
    vyzadujeSaTypNavesu: '',
    poziadavky: '',
    loadingPlaces: [{ ...emptyLoadingPlace }],
    unloadingPlaces: [{ ...emptyUnloadingPlace }],
    carrierCompany: '',
    carrierContact: '',
    carrierVehicleReg: '',
    carrierPrice: '',
  });

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const [isCarrierLoading, setIsCarrierLoading] = useState(false);

  // Options data
  const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [savedLocations, setSavedLocations] = useState<string[]>([]);
  const [savedGoods, setSavedGoods] = useState<string[]>([]);

  // UI states
  const [newCustomerDialog, setNewCustomerDialog] = useState(false);
  const [newCarrierDialog, setNewCarrierDialog] = useState(false);
  const [expandedLocationCards, setExpandedLocationCards] = useState<{ [key: string]: boolean }>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showValidationAlert, setShowValidationAlert] = useState(false);

  // Team members and dispatcher states
  const [teamMembers, setTeamMembers] = useState<{[id: string]: {name: string, email: string}}>({});
  const [isEditingDispatcher, setIsEditingDispatcher] = useState(false);
  const [originalDispatcher, setOriginalDispatcher] = useState<{id: string, name: string} | null>(null);
  const [editedDispatcher, setEditedDispatcher] = useState<{id: string, name: string} | null>(null);

  // Reserved order number for new orders
  const [reservedOrderNumber, setReservedOrderNumber] = useState<string | null>(null);
  const [isGeneratingOrderNumber, setIsGeneratingOrderNumber] = useState(false);

  // Steps configuration
  const steps = [
    {
      label: t('orders.customerDetails') || 'Údaje zákazníka',
      icon: <PersonIcon />,
      description: t('orders.customerStepDescription') || 'Výber zákazníka a základné údaje objednávky'
    },
    {
      label: t('orders.cargoAndRoute') || 'Tovar a trasa',
      icon: <LocalShippingIcon />,
      description: t('orders.cargoStepDescription') || 'Miesta nakládky, vykládky a definícia tovaru'
    },
    {
      label: t('orders.carrierAndSummary') || 'Dopravca a súhrn',
      icon: <SummaryIcon />,
      description: t('orders.carrierStepDescription') || 'Výber dopravcu a finálny prehľad objednávky'
    }
  ];

  // Fetch functions
  const fetchCustomers = useCallback(async () => {
    if (!userData?.companyID) return;
    setIsCustomerLoading(true);
    try {
      console.log('🔎 Searching customers for companyID:', userData.companyID);
      
      // Používame len where bez orderBy aby sme predišli problémom s prázdnymi poľami
      const q = query(
        collection(db, 'customers'),
        where('companyID', '==', userData.companyID)
      );
      const snapshot = await getDocs(q);
      console.log('🔍 Načítané dokumenty zákazníkov:', snapshot.docs.length);
      
      const customersData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('📄 Raw customer data:', data);
        
        const customer = {
          id: doc.id,
          ...data,
          // Zabezpečíme, že všetky potrebné polia existujú
          company: data.company || data.companyName || '',
          email: data.email || data.contactEmail || '',
          phone: data.phone || data.contactPhone || '',
          vatId: data.vatId || data.icDph || '',
          contactName: data.contactName || '',
          contactSurname: data.contactSurname || '',
          street: data.street || '',
          city: data.city || '',
          zip: data.zip || '',
          country: data.country || 'Slovensko',
          paymentTermDays: data.paymentTermDays || 30,
          customerId: data.customerId || '' // Načítame customerId z databázy
        };
        
        console.log('✅ Mapped customer:', customer);
        return customer;
      }) as Customer[];
      
      // Sortujeme klientsky aby sme predišli problémom s prázdnymi poľami
      customersData.sort((a, b) => {
        const nameA = a.company || '';
        const nameB = b.company || '';
        return nameA.localeCompare(nameB, 'sk', { sensitivity: 'base' });
      });
      
      console.log('🎯 Final customerOptions:', customersData);
      setCustomerOptions(customersData);
    } catch (error) {
      console.error('❌ Chyba pri načítaní zákazníkov:', error);
    } finally {
      setIsCustomerLoading(false);
    }
  }, [userData?.companyID]);

  const fetchCarriers = useCallback(async () => {
    if (!userData?.companyID) return;
    setIsCarrierLoading(true);
    try {
      const q = query(
        collection(db, 'carriers'),
        where('companyID', '==', userData.companyID),
        orderBy('companyName')
      );
      const snapshot = await getDocs(q);
      const carriersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Carrier[];
      setCarriers(carriersData);
    } catch (error) {
      console.error('Chyba pri načítaní dopravcov:', error);
    } finally {
      setIsCarrierLoading(false);
    }
  }, [userData?.companyID]);

  const fetchSavedData = useCallback(async () => {
    if (!userData?.companyID) return;
    try {
      // Fetch previously used locations
      const ordersQuery = query(
        collection(db, 'orders'),
        where('companyID', '==', userData.companyID)
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      
      const locations = new Set<string>();
      const goods = new Set<string>();
      
      ordersSnapshot.docs.forEach(doc => {
        const order = doc.data();
        
        // Extract locations
        [...(order.loadingPlaces || []), ...(order.unloadingPlaces || [])].forEach(place => {
          if (place.city) {
            locations.add(`${place.city}${place.street ? ` - ${place.street}` : ''}`);
          }
        });
        
        // Extract goods names
        [...(order.loadingPlaces || []), ...(order.unloadingPlaces || [])].forEach(place => {
          place.goods?.forEach((item: any) => {
            if (item.name) goods.add(item.name);
          });
        });
      });
      
      setSavedLocations(Array.from(locations));
      setSavedGoods(Array.from(goods));
    } catch (error) {
      console.error('Chyba pri načítaní uložených dát:', error);
    }
  }, [userData?.companyID]);

  const fetchTeamMembers = useCallback(async () => {
    if (!userData?.companyID) return;
    try {
      const usersQuery = query(collection(db, 'users'), where('companyID', '==', userData.companyID));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData: {[id: string]: {name: string, email: string}} = {};
      
      usersSnapshot.docs.forEach(doc => {
        const userDoc = doc.data();
        let userName = '';
        if (userDoc.firstName || userDoc.lastName) {
          userName = `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim();
        }
        if (!userName && userDoc.displayName) userName = userDoc.displayName;
        if (!userName && userDoc.email) {
          const emailParts = userDoc.email.split('@');
          if (emailParts.length > 0) {
            const nameParts = emailParts[0].split(/[._-]/);
            userName = nameParts.map((part: string) => 
              part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
          }
        }
        if (!userName) userName = userDoc.email ? userDoc.email.split('@')[0] : 'Používateľ';
        
        usersData[doc.id] = { 
          name: userName, 
          email: userDoc.email || '' 
        };
      });
      
      // Pridaj aktuálneho používateľa ak nie je v zozname
      if (userData.uid && !usersData[userData.uid]) {
        let currentUserName = '';
        if ((userData as any).firstName || (userData as any).lastName) {
          currentUserName = `${(userData as any).firstName || ''} ${(userData as any).lastName || ''}`.trim();
        }
        if (!currentUserName && (userData as any).displayName) currentUserName = (userData as any).displayName;
        if (!currentUserName && userData.email) {
          const emailParts = userData.email.split('@');
          if (emailParts.length > 0) {
            const nameParts = emailParts[0].split(/[._-]/);
            currentUserName = nameParts.map(part => 
              part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
          }
        }
        if (!currentUserName) currentUserName = userData.email ? userData.email.split('@')[0] : 'Aktuálny používateľ';
        
        usersData[userData.uid] = { 
          name: currentUserName, 
          email: userData.email || '' 
        };
      }
      
      setTeamMembers(usersData);
    } catch (error) {
      console.error('Chyba pri načítaní členov tímu:', error);
    }
  }, [userData]);

  // Generate and reserve order number for new orders
  const generateOrderNumber = useCallback(async () => {
    if (!userData?.companyID || isEdit) return;
    
    setIsGeneratingOrderNumber(true);
    try {
      // Generate order number
      const orderYear = new Date().getFullYear().toString();
      const orderMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
      
      const orderNumberQuery = query(
        collection(db, 'orders'),
        where('companyID', '==', userData.companyID),
        where('orderYear', '==', orderYear),
        where('orderMonth', '==', orderMonth)
      );
      
      const orderSnapshot = await getDocs(orderNumberQuery);
      const orderNumber = (orderSnapshot.size + 1).toString().padStart(3, '0');
      const orderNumberFormatted = `${orderYear}${orderMonth}${orderNumber}`;
      
      console.log('🎯 Rezervované číslo objednávky:', orderNumberFormatted);
      setReservedOrderNumber(orderNumberFormatted);
    } catch (error) {
      console.error('❌ Chyba pri generovaní čísla objednávky:', error);
    } finally {
      setIsGeneratingOrderNumber(false);
    }
  }, [userData?.companyID, isEdit]);

  // Initialize data
  useEffect(() => {
    console.log('🚀 NewOrderWizard useEffect triggered:', { 
      open, 
      companyID: userData?.companyID,
      userDataExists: !!userData 
    });
    
    if (open && userData?.companyID) {
      console.log('✅ Conditions met, calling fetch functions...');
      fetchCustomers();
      fetchCarriers();
      fetchSavedData();
      fetchTeamMembers();
      
      // Generate order number for new orders
      if (!isEdit) {
        generateOrderNumber();
      }
    } else {
      console.log('❌ Conditions NOT met:', {
        open,
        hasCompanyID: !!userData?.companyID,
        userData: userData
      });
    }
  }, [open, userData?.companyID, userData, fetchCustomers, fetchCarriers, fetchSavedData, fetchTeamMembers, generateOrderNumber, isEdit]);

  // Load edit data
  useEffect(() => {
    if (isEdit && orderData && open && customerOptions.length > 0) {
      console.log('🔄 Loading edit data:', orderData);
      console.log('📋 Available customers:', customerOptions);
      
      // Nájdeme zákazníka v zozname na základe customerCompany
      const customerCompanyName = (orderData as any).zakaznik || orderData.customerCompany || '';
      const matchingCustomer = customerOptions.find(customer => 
        customer.company === customerCompanyName
      );
      
      console.log('🎯 Looking for customer:', customerCompanyName);
      console.log('✅ Found matching customer:', matchingCustomer);
      
      // Migrácia starých kontaktných údajov v miestach nakládky a vykládky
      const migrateContactData = (places: any[]) => {
        return places?.map(place => ({
          ...place,
          contactPersonName: place.contactPersonName || place.contactPerson || '',
          contactPersonPhone: place.contactPersonPhone || ''
        })) || [];
      };

      const migratedLoadingPlaces = migrateContactData(orderData.loadingPlaces || []);
      const migratedUnloadingPlaces = migrateContactData(orderData.unloadingPlaces || []);
      
      setFormData(prev => ({
        ...prev,
        ...orderData,
        zakaznik: customerCompanyName,
        zakaznikData: matchingCustomer || null, // Nastavíme zákazníka objektu pre Autocomplete
        kontaktnaOsoba: (orderData as any).kontaktnaOsoba || 
          `${orderData.customerContactName || ''} ${orderData.customerContactSurname || ''}`.trim(),
        loadingPlaces: migratedLoadingPlaces,
        unloadingPlaces: migratedUnloadingPlaces
      }));
      
      console.log('✅ Migration applied:', {
        loadingPlaces: migratedLoadingPlaces,
        unloadingPlaces: migratedUnloadingPlaces
      });
    }
  }, [isEdit, orderData, open, customerOptions]); // Pridávame customerOptions do závislostí

  // Set original dispatcher when editing
  useEffect(() => {
    if (isEdit && orderData && Object.keys(teamMembers).length > 0) {
      const createdBy = orderData.createdBy || (orderData as any).createdBy;
      const createdByName = (orderData as any).createdByName || 
                           (createdBy && teamMembers[createdBy]?.name) || 
                           'Neznámy';
      
      if (createdBy) {
        const originalDisp = {
          id: createdBy,
          name: createdByName
        };
        setOriginalDispatcher(originalDisp);
        setEditedDispatcher(originalDisp);
      }
    }
  }, [isEdit, orderData, teamMembers]);

  // Handle functions
  const handleNext = () => {
    const validation = validateStep(activeStep);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setShowValidationAlert(true);
      // Automaticky skryť alert po 5 sekundách
      setTimeout(() => setShowValidationAlert(false), 5000);
      return;
    }

    // Vyčistíme chyby ak je všetko v poriadku
    setValidationErrors([]);
    setShowValidationAlert(false);
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleReset = () => {
    setActiveStep(0);
    setFormData({
      datumPrijatia: new Date(),
      zakaznik: '',
      zakaznikData: null,
      kontaktnaOsoba: '',
      suma: '',
      mena: 'EUR',
      cisloNakladuZakaznika: '',
      internaPoznamka: '',
      vyzadujeSaTypNavesu: '',
      poziadavky: '',
      loadingPlaces: [{ ...emptyLoadingPlace }],
      unloadingPlaces: [{ ...emptyUnloadingPlace }],
      carrierCompany: '',
      carrierContact: '',
      carrierVehicleReg: '',
      carrierPrice: '',
    });
    // Reset dispatcher editing states
    setIsEditingDispatcher(false);
    setOriginalDispatcher(null);
    setEditedDispatcher(null);
    // Reset reserved order number
    setReservedOrderNumber(null);
  };

  const handleInputChange = (field: keyof OrderFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCustomerChange = (customer: Customer | null) => {
    setFormData(prev => {
      // Nebudeme už automaticky aktualizovať názov firmy vo všetkých miestach nakládky a vykládky
      return {
        ...prev,
        zakaznikData: customer,
        zakaznik: customer?.company || '',
        kontaktnaOsoba: customer ? `${customer.contactName} ${customer.contactSurname}`.trim() : '',
        customerVatId: customer?.vatId || '',
        customerStreet: customer?.street || '',
        customerCity: customer?.city || '',
        customerZip: customer?.zip || '',
        customerCountry: customer?.country || 'Slovensko',
        customerContactName: customer?.contactName || '',
        customerContactSurname: customer?.contactSurname || '',
        customerEmail: customer?.email || '',
        customerPhone: customer?.phone || (customer?.contactPhonePrefix && customer?.contactPhone 
          ? `${customer.contactPhonePrefix}${customer.contactPhone}` 
          : '') || '',
        customerCompany: customer?.company || '',
        customerPaymentTermDays: customer?.paymentTermDays || 30,
        customerId: (customer as any)?.customerId || '', // Pridáme customerId
      };
    });
  };

  const handleCarrierChange = (carrier: Carrier | null) => {
    setFormData(prev => ({
      ...prev,
      carrierCompany: carrier?.companyName || '',
      carrierContact: carrier ? `${carrier.contactName} ${carrier.contactSurname}`.trim() : '',
    }));
  };

  const addLocation = (type: 'loading' | 'unloading') => {
    const newLocation = type === 'loading' ? { ...emptyLoadingPlace } : { ...emptyUnloadingPlace };
    newLocation.id = crypto.randomUUID();
    // Nebudeme už automaticky vyplňovať názov firmy z vybraného zákazníka
    
    setFormData(prev => ({
      ...prev,
      [`${type}Places`]: [...(prev[`${type}Places` as keyof typeof prev] as any[]), newLocation]
    }));
  };

  const removeLocation = (type: 'loading' | 'unloading', index: number) => {
    setFormData(prev => {
      const places = [...(prev[`${type}Places` as keyof typeof prev] as any[])];
      places.splice(index, 1);
      return {
        ...prev,
        [`${type}Places`]: places
      };
    });
  };

  const duplicateLocation = (type: 'loading' | 'unloading', index: number) => {
    setFormData(prev => {
      const places = [...(prev[`${type}Places` as keyof typeof prev] as any[])];
      const locationToDuplicate = { ...places[index] };
      locationToDuplicate.id = crypto.randomUUID();
      locationToDuplicate.goods = locationToDuplicate.goods.map((item: GoodsItem) => ({
        ...item,
        id: crypto.randomUUID()
      }));
      places.splice(index + 1, 0, locationToDuplicate);
      return {
        ...prev,
        [`${type}Places`]: places
      };
    });
  };

  const updateLocation = (type: 'loading' | 'unloading', index: number, field: string, value: any) => {
    setFormData(prev => {
      const places = [...(prev[`${type}Places` as keyof typeof prev] as any[])];
      places[index] = { ...places[index], [field]: value };
      return {
        ...prev,
        [`${type}Places`]: places
      };
    });
  };

  const addGoods = (type: 'loading' | 'unloading', locationIndex: number) => {
    const newGoods = { ...emptyGoodsItem };
    newGoods.id = crypto.randomUUID();
    
    setFormData(prev => {
      const places = [...(prev[`${type}Places` as keyof typeof prev] as any[])];
      places[locationIndex].goods = [...places[locationIndex].goods, newGoods];
      
      // Automatické kopírovanie tovaru z nakládky do vykládky
      // Len ak má užívateľ jednu nakládku a jednu vykládku
      const updatedFormData = {
        ...prev,
        [`${type}Places`]: places
      };
      
      if (type === 'loading' && 
          prev.loadingPlaces?.length === 1 && 
          prev.unloadingPlaces?.length === 1 &&
          prev.unloadingPlaces[0].goods?.length === 0) {
        // Skopírujeme všetky tovary z nakládky do vykládky
        const loadingGoods = places[locationIndex].goods;
        const unloadingPlaces = [...prev.unloadingPlaces];
        unloadingPlaces[0].goods = loadingGoods.map((goods: GoodsItem) => ({
          ...goods,
          id: crypto.randomUUID() // Nové ID pre kopiu
        }));
        updatedFormData.unloadingPlaces = unloadingPlaces;
      }
      
      return updatedFormData;
    });
  };

  const removeGoods = (type: 'loading' | 'unloading', locationIndex: number, goodsIndex: number) => {
    setFormData(prev => {
      const places = [...(prev[`${type}Places` as keyof typeof prev] as any[])];
      places[locationIndex].goods.splice(goodsIndex, 1);
      
      const updatedFormData = {
        ...prev,
        [`${type}Places`]: places
      };
      
      // Automatické kopírovanie zmien tovaru z nakládky do vykládky
      // Len ak má užívateľ jednu nakládku a jednu vykládku
      if (type === 'loading' && 
          prev.loadingPlaces?.length === 1 && 
          prev.unloadingPlaces?.length === 1) {
        // Skopírujeme všetky tovary z nakládky do vykládky
        const loadingGoods = places[locationIndex].goods;
        const unloadingPlaces = [...prev.unloadingPlaces];
        unloadingPlaces[0].goods = loadingGoods.map((goods: GoodsItem) => ({
          ...goods,
          id: crypto.randomUUID() // Nové ID pre kopiu
        }));
        updatedFormData.unloadingPlaces = unloadingPlaces;
      }
      
      return updatedFormData;
    });
  };

  const updateGoods = (
    type: 'loading' | 'unloading', 
    locationIndex: number, 
    goodsIndex: number, 
    field: string, 
    value: any
  ) => {
    setFormData(prev => {
      const places = [...(prev[`${type}Places` as keyof typeof prev] as any[])];
      places[locationIndex].goods[goodsIndex] = {
        ...places[locationIndex].goods[goodsIndex],
        [field]: value
      };
      
      const updatedFormData = {
        ...prev,
        [`${type}Places`]: places
      };
      
      // Automatické kopírovanie zmien tovaru z nakládky do vykládky
      // Len ak má užívateľ jednu nakládku a jednu vykládku
      if (type === 'loading' && 
          prev.loadingPlaces?.length === 1 && 
          prev.unloadingPlaces?.length === 1 &&
          prev.unloadingPlaces[0].goods?.length > 0) {
        // Skopírujeme všetky tovary z nakládky do vykládky
        const loadingGoods = places[locationIndex].goods;
        const unloadingPlaces = [...prev.unloadingPlaces];
        unloadingPlaces[0].goods = loadingGoods.map((goods: GoodsItem) => ({
          ...goods,
          id: crypto.randomUUID() // Nové ID pre kopiu
        }));
        updatedFormData.unloadingPlaces = unloadingPlaces;
      }
      
      return updatedFormData;
    });
  };

  const toggleLocationCard = (type: 'loading' | 'unloading', index: number) => {
    const key = `${type}-${index}`;
    setExpandedLocationCards(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const calculateProfit = () => {
    const customerPrice = parseFloat(formData.suma || '0');
    const carrierPrice = parseFloat(formData.carrierPrice || '0');
    return customerPrice - carrierPrice;
  };

  const validateStep = (step: number): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    switch (step) {
      case 0:
        if (!formData.zakaznikData) {
          errors.push('Vyberte zákazníka');
        }
        if (!formData.suma || parseFloat(formData.suma) <= 0) {
          errors.push('Zadajte platnú cenu pre zákazníka');
        }
        break;
      
      case 1:
        if (!formData.loadingPlaces?.length) {
          errors.push('Pridajte aspoň jedno miesto nakládky');
        } else {
          formData.loadingPlaces.forEach((place, index) => {
            if (!place.city) errors.push(`Nakládka #${index + 1}: Zadajte mesto`);
            if (!place.street) errors.push(`Nakládka #${index + 1}: Zadajte ulicu`);
            // Kontaktná osoba je teraz nepovinná
            if (!place.dateTime) errors.push(`Nakládka #${index + 1}: Zadajte dátum a čas`);
            if (!place.goods?.length || !place.goods.some(g => g.name)) {
              errors.push(`Nakládka #${index + 1}: Zadajte aspoň jeden tovar`);
            }
          });
        }

        if (!formData.unloadingPlaces?.length) {
          errors.push('Pridajte aspoň jedno miesto vykládky');
        } else {
          formData.unloadingPlaces.forEach((place, index) => {
            if (!place.city) errors.push(`Vykládka #${index + 1}: Zadajte mesto`);
            if (!place.street) errors.push(`Vykládka #${index + 1}: Zadajte ulicu`);
            // Kontaktná osoba je teraz nepovinná
            if (!place.dateTime) errors.push(`Vykládka #${index + 1}: Zadajte dátum a čas`);
            if (!place.goods?.length || !place.goods.some(g => g.name)) {
              errors.push(`Vykládka #${index + 1}: Zadajte aspoň jeden tovar`);
            }
          });
        }
        break;
      
      case 2:
        if (!formData.carrierCompany) {
          errors.push('Vyberte dopravcu');
        }
        break;
      
      default:
        break;
    }

    return { isValid: errors.length === 0, errors };
  };

  const handleSubmit = async () => {
    if (!userData?.companyID) return;
    
    // Validácia posledného kroku pred odoslaním
    const validation = validateStep(2);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setShowValidationAlert(true);
      setTimeout(() => setShowValidationAlert(false), 5000);
      return;
    }
    
    setIsSubmitting(true);
    try {
      let orderNumber = '';
      let orderNumberFormatted = '';
      let orderYear = '';
      let orderMonth = '';

      // Použijeme rezervované číslo objednávky pre nové objednávky
      if (!isEdit && reservedOrderNumber) {
        orderNumberFormatted = reservedOrderNumber;
        // Extrahovanie častí z rezervovaného čísla
        orderYear = reservedOrderNumber.substring(0, 4);
        orderMonth = reservedOrderNumber.substring(4, 6);
        orderNumber = reservedOrderNumber.substring(6, 9);
      }

      // Debug logy pre špeditera
      console.log('🔍 Ukladanie objednávky - špediter info:', {
        isEdit,
        originalDispatcher,
        editedDispatcher,
        orderDataCreatedBy: orderData.createdBy,
        orderDataCreatedByName: (orderData as any).createdByName
      });

      // Určenie správneho špeditera
      let finalCreatedBy = userData.uid;
      let finalCreatedByName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();

      if (isEdit) {
        if (editedDispatcher) {
          // Použijeme editovaného špeditera
          finalCreatedBy = editedDispatcher.id;
          finalCreatedByName = editedDispatcher.name;
          console.log('✅ Používam editovaného špeditera:', editedDispatcher);
        } else if (originalDispatcher) {
          // Žiadna zmena, použijeme pôvodného špeditera
          finalCreatedBy = originalDispatcher.id;
          finalCreatedByName = originalDispatcher.name;
          console.log('✅ Používam pôvodného špeditera:', originalDispatcher);
        } else {
          // Fallback na pôvodné dáta z objednávky
          finalCreatedBy = orderData.createdBy || userData.uid;
          finalCreatedByName = (orderData as any).createdByName || finalCreatedByName;
          console.log('✅ Používam fallback špeditera z orderData');
        }
      }

      console.log('💾 Finálny špediter pre uloženie:', {
        finalCreatedBy,
        finalCreatedByName
      });

      // Pomocná funkcia na odstránenie undefined hodnôt
      const removeUndefinedValues = (obj: any): any => {
        if (obj === null || obj === undefined) {
          return null;
        }
        
        if (Array.isArray(obj)) {
          return obj.map(item => removeUndefinedValues(item));
        }
        
        if (typeof obj === 'object') {
          const cleaned: any = {};
          Object.keys(obj).forEach(key => {
            const value = obj[key];
            if (value !== undefined) {
              cleaned[key] = removeUndefinedValues(value);
            }
          });
          return cleaned;
        }
        
        return obj;
      };

      // Konvertujeme dateTime polia na Timestamp objekty pre Firebase
      const processedLoadingPlaces = formData.loadingPlaces?.map(place => ({
        ...place,
        dateTime: place.dateTime ? Timestamp.fromDate(place.dateTime as Date) : null
      })) || [];
      
      const processedUnloadingPlaces = formData.unloadingPlaces?.map(place => ({
        ...place,
        dateTime: place.dateTime ? Timestamp.fromDate(place.dateTime as Date) : null
      })) || [];

      console.log('🔍 Debug - formData.loadingPlaces:', formData.loadingPlaces);
      console.log('🔍 Debug - processedLoadingPlaces:', processedLoadingPlaces);
      console.log('🔍 Debug - formData.unloadingPlaces:', formData.unloadingPlaces);
      console.log('🔍 Debug - processedUnloadingPlaces:', processedUnloadingPlaces);

      const rawDataToSave = {
        ...formData,
        companyID: userData.companyID,
        createdBy: finalCreatedBy,
        createdByName: finalCreatedByName,
        createdAt: isEdit ? orderData.createdAt : Timestamp.now(),
        updatedAt: Timestamp.now(),
        updatedBy: isEdit ? userData.uid : undefined,
        // Generujeme číslo objednávky len pre nové objednávky
        ...(isEdit ? {} : {
          orderNumber,
          orderNumberFormatted,
          orderYear,
          orderMonth,
        }),
        customerCompany: formData.zakaznik,
        customerPrice: formData.suma,
        loadingPlaces: processedLoadingPlaces,
        unloadingPlaces: processedUnloadingPlaces,
      };

      // Odstránime undefined hodnoty
      const dataToSave = removeUndefinedValues(rawDataToSave);

      console.log('💾 Kompletné dáta na uloženie:', dataToSave);
      console.log('🔍 Debug - dataToSave.loadingPlaces:', dataToSave.loadingPlaces);
      console.log('🔍 Debug - dataToSave.unloadingPlaces:', dataToSave.unloadingPlaces);

      if (isEdit && orderData.id) {
        console.log('✏️ Aktualizujem existujúcu objednávku:', orderData.id);
        await updateDoc(doc(db, 'orders', orderData.id), dataToSave);
        console.log('✅ Objednávka úspešne aktualizovaná');
      } else {
        console.log('🆕 Vytváram novú objednávku');
        const docRef = await addDoc(collection(db, 'orders'), dataToSave);
        console.log('✅ Nová objednávka úspešne vytvorená s ID:', docRef.id);
        
        // Debug: Načítame objednávku späť z Firebase aby sme videli čo sa uložilo
        const savedDoc = await getDoc(docRef);
        if (savedDoc.exists()) {
          const savedData = savedDoc.data();
          console.log('🔎 Uložené dáta z Firebase:', savedData);
          console.log('🔎 Uložené loadingPlaces:', savedData.loadingPlaces);
          console.log('🔎 Uložené unloadingPlaces:', savedData.unloadingPlaces);
        }
      }

      // Uloženie miest do dedikovanej kolekcie 'locations' (len pre nové objednávky alebo ak sa miesta zmenili)
      if (!isEdit || JSON.stringify(formData.loadingPlaces) !== JSON.stringify(orderData.loadingPlaces) || 
          JSON.stringify(formData.unloadingPlaces) !== JSON.stringify(orderData.unloadingPlaces)) {
        console.log('📍 Ukladám miesta do kolekcie locations...');
        
        const locationsToSave = [
          ...processedLoadingPlaces.map(place => ({
            type: 'loading' as const,
            companyName: place.companyName || '',
            city: place.city || '',
            street: place.street || '',
            zip: place.zip || '',
            country: place.country || 'Slovensko',
            contactPersonName: place.contactPersonName || '',
            contactPersonPhone: place.contactPersonPhone || '',
            companyID: userData.companyID,
            createdAt: Timestamp.now(),
            usageCount: 0
          })),
          ...processedUnloadingPlaces.map(place => ({
            type: 'unloading' as const,
            companyName: place.companyName || '',
            city: place.city || '',
            street: place.street || '',
            zip: place.zip || '',
            country: place.country || 'Slovensko',
            contactPersonName: place.contactPersonName || '',
            contactPersonPhone: place.contactPersonPhone || '',
            companyID: userData.companyID,
            createdAt: Timestamp.now(),
            usageCount: 0
          }))
        ];

        // Kontrola duplicít - pridáme len miesta ktoré ešte neexistujú
        for (const locationToSave of locationsToSave) {
          try {
            // Hľadáme existujúce miesto s rovnakými údajmi
            const existingLocationQuery = query(
              collection(db, 'locations'),
              where('companyID', '==', userData.companyID),
              where('type', '==', locationToSave.type),
              where('companyName', '==', locationToSave.companyName),
              where('city', '==', locationToSave.city),
              where('street', '==', locationToSave.street)
            );
            
            const existingSnapshot = await getDocs(existingLocationQuery);
            
            if (existingSnapshot.empty) {
              // Miesto neexistuje, pridáme ho
              const locationRef = await addDoc(collection(db, 'locations'), locationToSave);
              console.log(`✅ Pridané nové miesto ${locationToSave.type}: ${locationToSave.companyName} - ${locationToSave.city} s ID: ${locationRef.id}`);
            } else {
              // Miesto už existuje, zvýšime usageCount
              const existingLocation = existingSnapshot.docs[0];
              const currentUsageCount = existingLocation.data().usageCount || 0;
              await updateDoc(existingLocation.ref, {
                usageCount: currentUsageCount + 1,
                updatedAt: Timestamp.now()
              });
              console.log(`📈 Zvýšený usageCount pre existujúce miesto ${locationToSave.type}: ${locationToSave.companyName} - ${locationToSave.city}`);
            }
          } catch (error) {
            console.error(`❌ Chyba pri ukladaní miesta ${locationToSave.type}:`, error);
            // Pokračujeme s ďalšími miestami aj pri chybe
          }
        }
        
        console.log('📍 Dokončené ukladanie miest do kolekcie locations');
      }

      handleReset();
      onClose();
      onOrderSaved?.();
    } catch (error) {
      console.error('❌ Chyba pri ukladaní objednávky:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step content
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderCustomerStep();
      case 1:
        return renderCargoStep();
      case 2:
        return renderCarrierStep();
      default:
        return null;
    }
  };

  const renderCustomerStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#ff9f43', fontWeight: 600, mb: 3 }}>
        <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        {t('orders.customerInformation') || 'Informácie o zákazníkovi'}
      </Typography>

      <Grid container spacing={3}>
        {/* Customer Selection */}
        <Grid item xs={12}>
          <StyledCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <BusinessIcon sx={{ color: '#ff9f43', mr: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  {t('orders.selectCustomer') || 'Výber zákazníka'}
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Autocomplete
                    options={customerOptions}
                    getOptionLabel={(option: Customer) => {
                      console.log('🏷️ getOptionLabel called for option:', option);
                      return option.company || '';
                    }}
                    value={formData.zakaznikData}
                    onChange={(_, newValue: Customer | null) => {
                      console.log('🔄 Customer selection changed:', newValue);
                      handleCustomerChange(newValue);
                    }}
                    loading={isCustomerLoading}
                    renderInput={(params) => {
                      console.log('📝 Autocomplete renderInput, customerOptions length:', customerOptions.length);
                      console.log('📝 Current customerOptions:', customerOptions);
                      return (
                        <TextField
                          {...params}
                          id="customer-autocomplete"
                          name="customer"
                          label={t('orders.customer') + ' *'}
                          required
                          fullWidth
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {isCustomerLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                <BareTooltip title={t('orders.addNewCustomer') || 'Pridať nového zákazníka'}>
                                  <IconButton
                                    size="small"
                                    onClick={() => setNewCustomerDialog(true)}
                                    sx={{ mr: 1, color: '#ff9f43' }}
                                  >
                                    <AddIcon />
                                  </IconButton>
                                </BareTooltip>
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#ff9f43',
                              },
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: '#ff9f43',
                            },
                          }}
                        />
                      );
                    }}
                    renderOption={(props, option: Customer) => (
                         <Box component="li" {...props}>
                           <Box>
                             <Typography variant="body1" fontWeight={500}>
                               {option.company}
                             </Typography>
                             <Typography variant="body2" color="text.secondary">
                               {option.contactName} {option.contactSurname} • {option.city}
                             </Typography>
                           </Box>
                         </Box>
                       )}
                     />
                   </Grid>
                   
                   <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    id="contact-person"
                    name="contactPerson"
                    label={t('orders.contactPerson') || 'Kontaktná osoba'}
                    value={formData.kontaktnaOsoba || ''}
                    onChange={handleInputChange('kontaktnaOsoba')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    id="customer-payment-terms"
                    name="customerPaymentTerms"
                    label="Splatnosť zákazníka (dni)"
                    type="number"
                    value={formData.customerPaymentTermDays || 30}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccessTimeIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Automaticky načítané zo zákazníka"
                  />
                </Grid>
                
                {/* Identifikačné číslo zákazníka */}
                {formData.zakaznikData && formData.customerId && (
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      id="customer-id"
                      name="customerId"
                      label="Identifikačné číslo zákazníka"
                      value={formData.customerId || ''}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Automaticky pridelené systémom"
                      sx={{
                        '& .MuiInputBase-input': {
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          fontSize: '1.1rem',
                          color: '#ff9f43'
                        }
                      }}
                    />
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Order Details */}
        <Grid item xs={12}>
          <StyledCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <EuroIcon sx={{ color: '#ff9f43', mr: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  {t('orders.orderDetails') || 'Detaily objednávky'}
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    id="customer-price"
                    name="customerPrice"
                    label={t('orders.customerPrice') + ' *'}
                    type="number"
                    value={formData.suma || ''}
                    onChange={handleInputChange('suma')}
                    required
                    InputProps={{
                      endAdornment: <InputAdornment position="end">€</InputAdornment>,
                    }}
                    inputProps={{ min: 0, step: "0.01" }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <FormControl fullWidth>
                    <InputLabel id="currency-label">{t('orders.currency') || 'Mena'}</InputLabel>
                    <Select
                      id="currency-select"
                      name="currency"
                      labelId="currency-label"
                      value={formData.mena || 'EUR'}
                      label={t('orders.currency') || 'Mena'}
                      onChange={handleInputChange('mena')}
                    >
                      <MenuItem value="EUR">EUR</MenuItem>
                      <MenuItem value="CZK">CZK</MenuItem>
                      <MenuItem value="USD">USD</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                

                {/* Identifikačné číslo zákazníka */}
                {formData.zakaznikData && formData.customerId && (
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      id="customer-id"
                      name="customerId"
                      label="Identifikačné číslo zákazníka"
                      value={formData.customerId || ""}
                      InputProps={{
                        readOnly: true
                      }}
                      helperText="Automaticky pridelené systémom"
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="internal-note"
                    name="internalNote"
                    label={t('orders.internalNote') || 'Interná poznámka'}
                    value={formData.internaPoznamka || ''}
                    onChange={handleInputChange('internaPoznamka')}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
    </Box>
  );

  const renderCargoStep = () => (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#ff9f43', fontWeight: 600, mb: 3 }}>
        <LocalShippingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        {t('orders.cargoAndRoute') || 'Tovar a trasa'}
      </Typography>

      {/* Loading Places */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ color: '#2ecc71', fontWeight: 600 }}>
            <LocationOnIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {t('orders.loadingPlaces') || 'Miesta nakládky'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => addLocation('loading')}
            sx={{ 
              borderColor: '#2ecc71', 
              color: '#2ecc71',
              '&:hover': { borderColor: '#27ae60', backgroundColor: alpha('#2ecc71', 0.1) }
            }}
          >
            {t('orders.addLoading') || 'Pridať nakládku'}
          </Button>
        </Box>

        {formData.loadingPlaces?.map((place, index) => 
          renderLocationCard('loading', place, index)
        )}
      </Box>

      {/* Unloading Places */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ color: '#e74c3c', fontWeight: 600 }}>
            <LocationOnIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {t('orders.unloadingPlaces') || 'Miesta vykládky'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => addLocation('unloading')}
            sx={{ 
              borderColor: '#e74c3c', 
              color: '#e74c3c',
              '&:hover': { borderColor: '#c0392b', backgroundColor: alpha('#e74c3c', 0.1) }
            }}
          >
            {t('orders.addUnloading') || 'Pridať vykládku'}
          </Button>
        </Box>

        {formData.unloadingPlaces?.map((place, index) => 
          renderLocationCard('unloading', place, index)
        )}
      </Box>
    </Box>
  );

  const renderLocationCard = (type: 'loading' | 'unloading', place: LoadingPlace | UnloadingPlace, index: number) => {
    const cardKey = `${type}-${index}`;
    const isExpanded = expandedLocationCards[cardKey];
    const color = type === 'loading' ? '#2ecc71' : '#e74c3c';
    const places = formData[`${type}Places` as keyof typeof formData] as any[];

    return (
      <LocationCard key={place.id}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center">
              <Chip
                label={`${type === 'loading' ? 'Nakládka' : 'Vykládka'} #${index + 1}`}
                size="small"
                sx={{ 
                  backgroundColor: alpha(color, 0.1), 
                  color: color,
                  fontWeight: 600
                }}
              />
              <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                {place.city || 'Nezadané mesto'}
              </Typography>
            </Box>
            
            <Box>
              <BareTooltip title="Duplikovať">
                <IconButton
                  size="small"
                  onClick={() => duplicateLocation(type, index)}
                  sx={{ color: 'text.secondary' }}
                >
                  <ContentCopyIcon />
                </IconButton>
              </BareTooltip>
              
              <BareTooltip title="Rozbaliť/Zbaliť">
                <IconButton
                  size="small"
                  onClick={() => toggleLocationCard(type, index)}
                  sx={{ color: 'text.secondary' }}
                >
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </BareTooltip>
              
              {places.length > 1 && (
                <BareTooltip title="Odstrániť">
                  <IconButton
                    size="small"
                    onClick={() => removeLocation(type, index)}
                    sx={{ color: '#e74c3c' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </BareTooltip>
              )}
            </Box>
          </Box>

          <Collapse in={isExpanded} timeout="auto">
            <Grid container spacing={2}>
              {/* Company Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id={`${type}-company-name-${index}`}
                  name={`${type}CompanyName${index}`}
                  label="Názov firmy *"
                  value={place.companyName || ''}
                  onChange={(e) => updateLocation(type, index, 'companyName', e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              {/* Location Details */}
              <Grid item xs={12} sm={6}>
                <StyledAutocomplete
                  freeSolo
                  options={savedLocations}
                  value={place.city}
                  onInputChange={(_, newValue) => updateLocation(type, index, 'city', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      id={`${type}-city-${index}`}
                      name={`${type}City${index}`}
                      label={t('orders.city') + ' *'}
                      required
                      fullWidth
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id={`${type}-street-${index}`}
                  name={`${type}Street${index}`}
                  label={t('orders.street') + ' *'}
                  value={place.street}
                  onChange={(e) => updateLocation(type, index, 'street', e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  id={`${type}-zip-${index}`}
                  name={`${type}Zip${index}`}
                  label={t('orders.zipCode') + ' *'}
                  value={place.zip}
                  onChange={(e) => updateLocation(type, index, 'zip', e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Autocomplete
                  options={countries}
                  getOptionLabel={(option) => option.name}
                  value={countries.find(c => c.name === place.country) || null}
                  onChange={(_, newValue) => updateLocation(type, index, 'country', newValue?.name || 'Slovensko')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      id={`${type}-country-${index}`}
                      name={`${type}Country${index}`}
                      label={t('orders.country') + ' *'}
                      required
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                  <DateTimePicker
                    label={type === 'loading' ? 'Dátum a čas nakládky *' : 'Dátum a čas vykládky *'}
                    value={place.dateTime}
                    onChange={(newValue) => updateLocation(type, index, 'dateTime', newValue)}
                    slotProps={{ textField: { fullWidth: true, required: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id={`${type}-contact-name-${index}`}
                  name={`${type}ContactName${index}`}
                  label="Meno kontaktnej osoby"
                  value={place.contactPersonName}
                  onChange={(e) => updateLocation(type, index, 'contactPersonName', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id={`${type}-contact-phone-${index}`}
                  name={`${type}ContactPhone${index}`}
                  label="Telefón kontaktnej osoby"
                  value={place.contactPersonPhone}
                  onChange={(e) => updateLocation(type, index, 'contactPersonPhone', e.target.value)}
                  placeholder="+421 XXX XXX XXX"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Goods Section */}
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    <InventoryIcon sx={{ mr: 1, verticalAlign: 'middle', fontSize: 20 }} />
                    {type === 'loading' ? 'Tovar na naloženie' : 'Tovar na vyloženie'}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => addGoods(type, index)}
                    sx={{ color: '#ff9f43' }}
                  >
                    Pridať tovar
                  </Button>
                </Box>

                {place.goods?.map((item, goodsIndex) => (
                  <Card key={item.id} sx={{ 
                    mb: 2, 
                    backgroundColor: 'transparent',
                    border: (theme: any) => `1px solid ${theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.1)'}`,
                    borderRadius: 2
                  }}>
                    <CardContent sx={{ pb: 2, '&:last-child': { pb: 2 } }}>
                      <Box display="flex" justifyContent="between" alignItems="center" mb={2}>
                        <Chip
                          label={`Tovar #${goodsIndex + 1}`}
                          size="small"
                          sx={{ backgroundColor: alpha('#ff9f43', 0.1), color: '#ff9f43' }}
                        />
                        {place.goods && place.goods.length > 1 && (
                          <IconButton
                            size="small"
                            onClick={() => removeGoods(type, index, goodsIndex)}
                            sx={{ color: '#e74c3c' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <StyledAutocomplete
                            freeSolo
                            options={savedGoods}
                            value={item.name}
                            onInputChange={(_, newValue) => updateGoods(type, index, goodsIndex, 'name', newValue || '')}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                id={`goods-name-${type}-${index}-${goodsIndex}`}
                                name={`goodsName${type}${index}${goodsIndex}`}
                                label="Názov tovaru *"
                                required
                                fullWidth
                              />
                            )}
                          />
                        </Grid>
                        
                        <Grid item xs={6} sm={3}>
                          <TextField
                            fullWidth
                            id={`goods-quantity-${type}-${index}-${goodsIndex}`}
                            name={`goodsQuantity${type}${index}${goodsIndex}`}
                            label="Množstvo *"
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateGoods(type, index, goodsIndex, 'quantity', parseInt(e.target.value) || 1)}
                            required
                            inputProps={{ min: 1 }}
                          />
                        </Grid>
                        
                        <Grid item xs={6} sm={3}>
                          <FormControl fullWidth>
                            <InputLabel id={`unit-label-${type}-${index}-${goodsIndex}`}>Jednotka *</InputLabel>
                            <Select
                              id={`unit-select-${type}-${index}-${goodsIndex}`}
                              name={`unit${type}${index}${goodsIndex}`}
                              labelId={`unit-label-${type}-${index}-${goodsIndex}`}
                              value={item.unit}
                              label="Jednotka *"
                              onChange={(e) => updateGoods(type, index, goodsIndex, 'unit', e.target.value)}
                              required
                            >
                              <MenuItem value="ks">ks</MenuItem>
                              <MenuItem value="pal">pal</MenuItem>
                              <MenuItem value="kg">kg</MenuItem>
                              <MenuItem value="m³">m³</MenuItem>
                              <MenuItem value="ldm">ldm</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            id={`goods-weight-${type}-${index}-${goodsIndex}`}
                            name={`goodsWeight${type}${index}${goodsIndex}`}
                            label={t('orders.weightTons')}
                            type="number"
                            value={item.weight || ''}
                            onChange={(e) => updateGoods(type, index, goodsIndex, 'weight', parseFloat(e.target.value) || undefined)}
                            inputProps={{ min: 0, step: 0.001 }}
                            InputProps={{
                              endAdornment: <InputAdornment position="end">t</InputAdornment>,
                            }}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            id={`goods-dimensions-${type}-${index}-${goodsIndex}`}
                            name={`goodsDimensions${type}${index}${goodsIndex}`}
                            label={t('orders.dimensions')}
                            value={item.dimensions || ''}
                            onChange={(e) => updateGoods(type, index, goodsIndex, 'dimensions', e.target.value)}
                          />
                        </Grid>
                        
                        <Grid item xs={12} sm={4}>
                          <FormControl fullWidth>
                            <InputLabel id={`pallet-exchange-label-${type}-${index}-${goodsIndex}`}>{t('orders.palletExchange')}</InputLabel>
                            <Select
                              id={`pallet-exchange-select-${type}-${index}-${goodsIndex}`}
                              name={`palletExchange${type}${index}${goodsIndex}`}
                              labelId={`pallet-exchange-label-${type}-${index}-${goodsIndex}`}
                              value={item.palletExchange}
                              label={t('orders.palletExchange')}
                              onChange={(e) => updateGoods(type, index, goodsIndex, 'palletExchange', e.target.value)}
                            >
                              <MenuItem value="Bez výmeny">Bez výmeny</MenuItem>
                              <MenuItem value="Výmena">Výmena 1:1</MenuItem>
                              <MenuItem value="Jednostranná">Jednostranná</MenuItem>
                            </Select>
                          </FormControl>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            id={`goods-description-${type}-${index}-${goodsIndex}`}
                            name={`goodsDescription${type}${index}${goodsIndex}`}
                            label={t('orders.goodsDescription')}
                            value={item.description || ''}
                            onChange={(e) => updateGoods(type, index, goodsIndex, 'description', e.target.value)}
                            multiline
                            rows={2}
                          />
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </LocationCard>
    );
  };

  const renderCarrierStep = () => {
    const profit = calculateProfit();
    const profitColor = profit >= 0 ? '#2ecc71' : '#e74c3c';

    return (
      <Box>
        <Typography variant="h6" gutterBottom sx={{ color: '#ff9f43', fontWeight: 600, mb: 3 }}>
          <LocalShippingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          {t('orders.carrierAndSummary') || 'Dopravca a súhrn'}
        </Typography>

        <Grid container spacing={3}>
          {/* Carrier Selection */}
          <Grid item xs={12}>
            <StyledCard>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <LocalShippingIcon sx={{ color: '#ff9f43', mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight={600}>
                    {t('orders.selectCarrier') || 'Výber dopravcu'}
                  </Typography>
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Autocomplete
                      options={carriers}
                      getOptionLabel={(option: Carrier) => option.companyName || ''}
                      value={carriers.find(c => c.companyName === formData.carrierCompany) || null}
                      onChange={(_, newValue: Carrier | null) => handleCarrierChange(newValue)}
                      loading={isCarrierLoading}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          id="carrier-autocomplete"
                          name="carrier"
                          label={t('orders.carrier')}
                          fullWidth
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {isCarrierLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                <BareTooltip title={t('orders.addNewCarrier') || 'Pridať nového dopravcu'}>
                                  <IconButton
                                    size="small"
                                    onClick={() => setNewCarrierDialog(true)}
                                    sx={{ mr: 1, color: '#ff9f43' }}
                                  >
                                    <AddIcon />
                                  </IconButton>
                                </BareTooltip>
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#ff9f43',
                              },
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: '#ff9f43',
                            },
                          }}
                        />
                      )}
                      renderOption={(props, option: Carrier) => (
                        <Box component="li" {...props}>
                          <Box>
                            <Typography variant="body1" fontWeight={500}>
                              {option.companyName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {option.contactName} {option.contactSurname} • {option.city}
                            </Typography>
                          </Box>
                        </Box>
                      )}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="carrier-contact"
                      name="carrierContact"
                      label={t('orders.carrierContact') || 'Kontakt na dopravcu'}
                      value={formData.carrierContact || ''}
                      onChange={handleInputChange('carrierContact')}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="vehicle-registration"
                      name="vehicleRegistration"
                      label={t('orders.vehicleRegistration') || 'EČV vozidla'}
                      value={formData.carrierVehicleReg || ''}
                      onChange={handleInputChange('carrierVehicleReg')}
                    />
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      id="carrier-price"
                      name="carrierPrice"
                      label={t('orders.carrierPrice') || 'Cena za dopravu'}
                      type="number"
                      value={formData.carrierPrice || ''}
                      onChange={handleInputChange('carrierPrice')}
                      InputProps={{
                        endAdornment: <InputAdornment position="end">€</InputAdornment>,
                      }}
                      inputProps={{ min: 0, step: "0.01" }}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </StyledCard>
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12}>
            <StyledCard>
              <CardContent>
                <Box display="flex" alignItems="center" mb={3}>
                  <SummaryIcon sx={{ color: '#ff9f43', mr: 1 }} />
                  <Typography variant="subtitle1" fontWeight={600}>
                    {t('orders.orderSummary') || 'Súhrn objednávky'}
                  </Typography>
                </Box>
                
                <Grid container spacing={3}>
                  {/* Customer Info */}
                  <Grid item xs={12} md={4}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        ZÁKAZNÍK
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {formData.zakaznik || 'Nezvolený'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formData.kontaktnaOsoba || 'Bez kontaktu'}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  {/* Route Summary */}
                  <Grid item xs={12} md={4}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        TRASA
                      </Typography>
                      <Typography variant="body2">
                        {formData.loadingPlaces?.[0]?.city || 'Nezadané'} 
                        {formData.loadingPlaces && formData.loadingPlaces.length > 1 && ` (+${formData.loadingPlaces.length - 1})`}
                      </Typography>
                      <Typography variant="body2" sx={{ my: 0.5 }}>↓</Typography>
                      <Typography variant="body2">
                        {formData.unloadingPlaces?.[0]?.city || 'Nezadané'}
                        {formData.unloadingPlaces && formData.unloadingPlaces.length > 1 && ` (+${formData.unloadingPlaces.length - 1})`}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  {/* Financial Summary */}
                  <Grid item xs={12} md={4}>
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        FINANČNÝ SÚHRN
                      </Typography>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Príjem:</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {formData.suma || '0'} €
                        </Typography>
                      </Box>
                      <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography variant="body2">Náklady:</Typography>
                        <Typography variant="body2" fontWeight={500}>
                          {formData.carrierPrice || '0'} €
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" fontWeight={600}>Zisk:</Typography>
                        <Typography 
                          variant="body2" 
                          fontWeight={600}
                          sx={{ color: profitColor }}
                        >
                          {profit.toFixed(2)} €
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>

                {/* Validation Summary */}
                <Box mt={3}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    STAV OBJEDNÁVKY
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    <Chip
                      label="Zákazník"
                      color={formData.zakaznikData ? "success" : "error"}
                      size="small"
                    />
                    <Chip
                      label="Cena"
                      color={formData.suma ? "success" : "error"}
                      size="small"
                    />
                    <Chip
                      label="Nakládka"
                      color={formData.loadingPlaces?.every(p => p.city && p.street) ? "success" : "error"}
                      size="small"
                    />
                    <Chip
                      label="Vykládka"
                      color={formData.unloadingPlaces?.every(p => p.city && p.street) ? "success" : "error"}
                      size="small"
                    />
                    <Chip
                      label="Dopravca"
                      color={formData.carrierCompany ? "success" : "warning"}
                      size="small"
                    />
                  </Box>
                </Box>
              </CardContent>
            </StyledCard>
          </Grid>
        </Grid>
      </Box>
    );
  };

  // Dispatcher editing functions
  const handleStartEditDispatcher = () => {
    // Len admin môže editovať
    if (userData?.role !== 'admin') return;
    setIsEditingDispatcher(true);
  };

  const handleCancelEditDispatcher = () => {
    setIsEditingDispatcher(false);
    setEditedDispatcher(originalDispatcher);
  };

  const handleSaveDispatcher = () => {
    setIsEditingDispatcher(false);
    // Aktualizujeme aj formData ak potrebujeme
    if (editedDispatcher) {
      setFormData(prev => ({
        ...prev,
        createdBy: editedDispatcher.id,
        createdByName: editedDispatcher.name
      }));
    }
  };

  const handleDispatcherChange = (newDispatcher: {id: string, name: string} | null) => {
    setEditedDispatcher(newDispatcher);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth={false}
      PaperProps={{
        sx: {
          background: 'none',
          boxShadow: 'none',
          margin: 0,
          maxHeight: '95vh',
          height: '95vh',
          width: '95vw',
          maxWidth: '1400px',
          overflow: 'hidden'
        }
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }
      }}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '& .MuiDialog-container': {
          alignItems: 'center',
          justifyContent: 'center'
        },
        '& .MuiDialog-paper': {
          margin: 0
        }
      }}
    >
      <Box
        sx={{
          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
          borderRadius: '12px',
          padding: '16px',
          maxWidth: '1400px',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          color: isDarkMode ? '#ffffff' : '#000000',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <Box sx={{ 
          p: 0, 
          mb: 3, 
          fontWeight: 700, 
          color: isDarkMode ? '#ffffff' : '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BusinessIcon sx={{ color: '#ff9f43' }} />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {isEdit ? 'Upraviť objednávku' : 'Nová objednávka'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {steps[activeStep].description}
              </Typography>
              {/* Zobrazenie rezervovaného čísla objednávky pre nové objednávky */}
              {!isEdit && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mt: 1,
                  p: 1,
                  backgroundColor: isDarkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                  borderRadius: 1,
                  border: `1px solid ${isDarkMode ? 'rgba(76, 175, 80, 0.3)' : 'rgba(76, 175, 80, 0.3)'}`
                }}>
                  <BusinessIcon sx={{ fontSize: '1rem', color: '#4caf50' }} />
                  <Typography variant="caption" sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
                    Číslo objednávky: 
                  </Typography>
                  {isGeneratingOrderNumber ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress size={12} sx={{ color: '#4caf50' }} />
                      <Typography variant="caption" sx={{ color: '#4caf50', fontStyle: 'italic' }}>
                        Generujem...
                      </Typography>
                    </Box>
                  ) : reservedOrderNumber ? (
                    <Typography variant="caption" sx={{ 
                      fontWeight: 600, 
                      color: '#4caf50',
                      fontFamily: 'monospace',
                      fontSize: '0.9rem'
                    }}>
                      {reservedOrderNumber}
                    </Typography>
                  ) : (
                    <Typography variant="caption" sx={{ color: '#f44336', fontStyle: 'italic' }}>
                      Chyba pri generovaní
                    </Typography>
                  )}
                </Box>
              )}
              {/* Zobrazenie pôvodného špeditéra pre edit mode */}
              {isEdit && originalDispatcher && (
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1, 
                  mt: 1,
                  p: 1,
                  backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.1)' : 'rgba(255, 159, 67, 0.1)',
                  borderRadius: 1,
                  border: `1px solid ${isDarkMode ? 'rgba(255, 159, 67, 0.3)' : 'rgba(255, 159, 67, 0.3)'}`
                }}>
                  <AccountCircleIcon sx={{ fontSize: '1rem', color: '#ff9f43' }} />
                  <Typography variant="caption" sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
                    Vytvoril: 
                  </Typography>
                  {isEditingDispatcher ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Autocomplete
                        size="small"
                        value={editedDispatcher}
                        onChange={(event, newValue) => handleDispatcherChange(newValue)}
                        options={Object.entries(teamMembers).map(([id, member]) => ({
                          id,
                          name: member.name
                        }))}
                        getOptionLabel={(option) => option.name}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        renderInput={(params) => (
                          <TextField 
                            {...params} 
                            variant="outlined" 
                            size="small"
                            sx={{ minWidth: 250 }}
                          />
                        )}
                        sx={{
                          '& .MuiAutocomplete-input': {
                            fontSize: '0.75rem',
                            padding: '2px 4px !important'
                          }
                        }}
                      />
                      <BareTooltip title="Uložiť">
                        <IconButton 
                          size="small" 
                          onClick={handleSaveDispatcher}
                          sx={{ 
                            color: '#4caf50',
                            '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                          }}
                        >
                          <CheckIcon sx={{ fontSize: '0.875rem' }} />
                        </IconButton>
                      </BareTooltip>
                      <BareTooltip title="Zrušiť">
                        <IconButton 
                          size="small" 
                          onClick={handleCancelEditDispatcher}
                          sx={{ 
                            color: '#f44336',
                            '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' }
                          }}
                        >
                          <CloseIcon sx={{ fontSize: '0.875rem' }} />
                        </IconButton>
                      </BareTooltip>
                    </Box>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="caption" sx={{ 
                        fontWeight: 600, 
                        color: '#ff9f43'
                      }}>
                        {editedDispatcher?.name || originalDispatcher.name}
                      </Typography>
                      {userData?.role === 'admin' && (
                        <BareTooltip title="Upraviť špeditéra">
                          <IconButton 
                            size="small" 
                            onClick={handleStartEditDispatcher}
                            sx={{ 
                              color: '#ff9f43',
                              '&:hover': { backgroundColor: 'rgba(255, 159, 67, 0.1)' }
                            }}
                          >
                            <EditIcon sx={{ fontSize: '0.75rem' }} />
                          </IconButton>
                        </BareTooltip>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
          <IconButton 
            onClick={onClose} 
            edge="end" 
            aria-label="close"
            sx={{
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Divider sx={{ mb: 3, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', flexShrink: 0 }} />

        {/* Stepper */}
        <StyledStepper activeStep={activeStep} sx={{ mb: 4, flexShrink: 0 }}>
          {steps.map((step, index) => (
            <Step key={step.label}>
              <StepLabel
                icon={step.icon}
                error={activeStep > index && !validateStep(index).isValid}
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </StyledStepper>

        {/* Content */}
        <DialogContent sx={{ 
          p: 0, 
          mb: 3, 
          overflow: 'auto',
          flex: 1,
          minHeight: 400,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            borderRadius: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
            }
          }
        }}>
          {renderStepContent(activeStep)}
        </DialogContent>
        
        {/* Actions */}
        <DialogActions sx={{ p: 0, flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button 
            onClick={onClose} 
            sx={{ 
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              '&:hover': { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }
            }}
          >
            Zrušiť
          </Button>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            {activeStep !== 0 && (
              <Button 
                onClick={handleBack}
                sx={{ 
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                  '&:hover': { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }
                }}
              >
                Späť
              </Button>
            )}
            
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={isSubmitting || !validateStep(activeStep).isValid}
                sx={{
                  backgroundColor: '#ff9f43',
                  color: '#ffffff',
                  '&:hover': { backgroundColor: '#f7b067' }
                }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  isEdit ? 'Uložiť zmeny' : 'Vytvoriť objednávku'
                )}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={!validateStep(activeStep).isValid}
                sx={{
                  backgroundColor: '#ff9f43',
                  color: '#ffffff',
                  '&:hover': { backgroundColor: '#f7b067' }
                }}
              >
                Ďalej
              </Button>
            )}
          </Box>
        </DialogActions>
      </Box>

      {/* Customer Form Dialog */}
      <CustomerForm
        open={newCustomerDialog}
        onClose={() => setNewCustomerDialog(false)}
        onSubmit={async (customerData: CustomerData) => {
          try {
            if (!userData?.companyID) {
              alert("Chyba: Nemáte priradenú firmu.");
              return;
            }
            
            // Uložíme nového zákazníka do databázy
            const customerRef = collection(db, 'customers');
            const newCustomer = {
              company: customerData.companyName, // Mapujeme companyName na company
              street: customerData.street,
              city: customerData.city,
              zip: customerData.zip,
              country: customerData.country,
              contactName: customerData.contactName,
              contactSurname: customerData.contactSurname,
              email: customerData.contactEmail, // Mapujeme contactEmail na email
              phone: customerData.contactPhonePrefix && customerData.contactPhone 
                ? `${customerData.contactPhonePrefix}${customerData.contactPhone}` 
                : '', // Kombinujeme predvoľbu a číslo
              contactPhonePrefix: customerData.contactPhonePrefix || '+421',
              contactPhone: customerData.contactPhone || '',
              ico: customerData.ico || '',
              dic: customerData.dic || '',
              vatId: customerData.icDph || '', // Mapujeme icDph na vatId
              paymentTermDays: customerData.paymentTermDays || 30,
              customerId: customerData.customerId || '', // Pridáme customerId
              companyID: userData.companyID,
              createdAt: Timestamp.fromDate(new Date())
            };
            
            const docRef = await addDoc(customerRef, newCustomer);
            
            // Vytvoríme Customer objekt pre select
            const newCustomerOption: Customer = {
              id: docRef.id,
              company: customerData.companyName,
              street: customerData.street,
              city: customerData.city,
              zip: customerData.zip,
              country: customerData.country,
              contactName: customerData.contactName,
              contactSurname: customerData.contactSurname,
              email: customerData.contactEmail,
              phone: customerData.contactPhonePrefix && customerData.contactPhone 
                ? `${customerData.contactPhonePrefix}${customerData.contactPhone}` 
                : '',
              contactPhonePrefix: customerData.contactPhonePrefix || '+421',
              contactPhone: customerData.contactPhone || '',
              vatId: customerData.icDph || '',
              paymentTermDays: customerData.paymentTermDays || 30,
              customerId: customerData.customerId || '', // Pridáme customerId
              companyID: userData.companyID
            };
            
            // Pridáme ho do zoznamu a vyberieme
            setCustomerOptions(prev => [...prev, newCustomerOption]);
            handleCustomerChange(newCustomerOption);
            setNewCustomerDialog(false);
            
          } catch (error) {
            console.error('Chyba pri ukladaní zákazníka:', error);
            alert('Nastala chyba pri ukladaní zákazníka: ' + (error as Error).message);
          }
        }}
      />

      {/* Carrier Dialog - placeholder for now */}
      <Dialog open={newCarrierDialog} onClose={() => setNewCarrierDialog(false)}>
        <DialogTitle>Pridať nového dopravcu</DialogTitle>
        <DialogContent>
          <Alert severity="info">
            Funkcia pridania nového dopravcu bude implementovaná v ďalšej verzii.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewCarrierDialog(false)}>Zavrieť</Button>
        </DialogActions>
      </Dialog>

      {/* Validation Errors Snackbar */}
      <Snackbar
        open={showValidationAlert}
        autoHideDuration={5000}
        onClose={() => setShowValidationAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowValidationAlert(false)} 
          severity="error" 
          sx={{ 
            width: '100%',
            '& .MuiAlert-message': {
              width: '100%'
            }
          }}
        >
          <Typography variant="body2" fontWeight={600} gutterBottom>
            Prosím, opravte nasledovné chyby:
          </Typography>
          <Box component="ul" sx={{ pl: 2, m: 0 }}>
            {validationErrors.map((error, index) => (
              <Typography key={index} component="li" variant="body2">
                {error}
              </Typography>
            ))}
          </Box>
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default NewOrderWizard; 