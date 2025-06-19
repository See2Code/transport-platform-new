import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  useMediaQuery,
  useTheme,
  Collapse
} from '@mui/material';
import { useThemeMode } from '../../../contexts/ThemeContext';
import { collection, addDoc, query, where, getDocs, getDoc, Timestamp, orderBy, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';

import NewOrderWizard from '../NewOrderWizard';
import CustomerForm, { CustomerData } from '../../management/CustomerForm';
import LocationForm, { LocationData } from '../../management/LocationForm';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase';
import MobileOrderCard from '../MobileOrderCard'; // Import nového komponentu
import OrderDetail from '../OrderDetail';
import CustomerRatingDialog from '../../dialogs/CustomerRatingDialog';
import CarrierRatingDialog from '../../dialogs/CarrierRatingDialog';
import OrderRatingDialog from '../../dialogs/OrderRatingDialog';
import LanguageSelector from '../LanguageSelector';
import { Customer } from '../../../types/customers';
import { Carrier } from '../../../types/carriers';

import { useTranslation } from 'react-i18next';

// Importy z vyčlenených súborov
import { 
  TabPanel, 
  convertToDate, 
  DialogGlobalStyles, 
  type OrderFormData
} from './OrderComponents';

import {
  StyledPaper,
  PageWrapper,
  PageHeader,
  PageTitle,
  PageDescription
} from './OrderStyledComponents';

import { useOrderHandlers } from './OrderHandlers';
import { useRatingHandlers } from './OrderRatingHandlers';
import { useLanguageMenuHandlers } from './LanguageMenuHandlers';
import DeleteConfirmDialog from './DeleteConfirmDialogs';
import PdfLoadingDialog from './PdfLoadingDialog';
import PdfPreviewDialog from './PdfPreviewDialog';
import DispatchersCards from './DispatchersCards';
import CarrierFormDialog from './CarrierFormDialog';
import OrdersTable from './OrdersTable';
import CustomersTable from './CustomersTable';
import CarriersTable from './CarriersTable';
import LocationsTable from './LocationsTable';
import DispatchersTable from './DispatchersTable';
import OrdersFilters from './OrdersFilters';
import OrdersHeader from './OrdersHeader';
import DispatchersFilters from './DispatchersFilters';




const OrdersList: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeMode();
  const theme = useTheme();
  const { userData } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State pre objednávky, zákazníkov, dopravcov, filtre, atď.
  const [orders, setOrders] = useState<OrderFormData[]>([]);
  const [orderDocuments, setOrderDocuments] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Špecifické loading states pre jednotlivé tabuľky
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isLoadingCarriers, setIsLoadingCarriers] = useState(true);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingDispatchers, setIsLoadingDispatchers] = useState(true);
  // eslint-disable-next-line
  const [_isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [documentFilter, setDocumentFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [dispatcherFilter, setDispatcherFilter] = useState<'all' | 'thisMonth' | 'thisYear' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  // Načítanie sort nastavení z localStorage
  const [sortField, setSortField] = useState<'orderNumber' | 'createdAt' | null>(() => {
    const saved = localStorage.getItem('orders-sort-field');
    return saved ? (saved as 'orderNumber' | 'createdAt') : null;
  });
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => {
    const saved = localStorage.getItem('orders-sort-direction');
    return saved ? (saved as 'asc' | 'desc') : 'desc';
  });

  // Synchronizácia filtrov špeditérov s hlavnými filtrami
  useEffect(() => {
    if (startDate && endDate) {
      setDispatcherFilter('custom');
      setCustomStartDate(startDate);
      setCustomEndDate(endDate);
    }
  }, [startDate, endDate]);
  const [showFilters, setShowFilters] = useState(false);
  const [showNewOrderWizard, setShowNewOrderWizard] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Record<string, any>>({});
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderFormData | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
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
    notes: '',
    paymentTermDays: '60' // Default 60 dní ako string pre TextField
  });
  // eslint-disable-next-line
  const [selectedCarrierForEdit, setSelectedCarrierForEdit] = useState<Carrier | null>(null);
  const [showCarrierDeleteConfirm, setShowCarrierDeleteConfirm] = useState(false);
  const [carrierToDelete, setCarrierToDelete] = useState<string>('');
  const [loadingPdf, setLoadingPdf] = useState(false);
  // eslint-disable-next-line
  const [_showOrderNumberDialog, setShowOrderNumberDialog] = useState(false);
  // eslint-disable-next-line
  const [_orderToDelete, _setOrderToDelete] = useState<string>('');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [_deleteDialogOpen, _setDeleteDialogOpen] = useState(false);

  // State pre Miesta
  const [locations, setLocations] = useState<any[]>([]);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [selectedLocationForEdit, setSelectedLocationForEdit] = useState<LocationData | null>(null);
  const [showLocationDeleteConfirm, setShowLocationDeleteConfirm] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<string>('');

  // State pre Špeditéri (dispatchers)
  const [dispatchers, setDispatchers] = useState<any[]>([]);
  const [dispatcherSearchQuery, setDispatcherSearchQuery] = useState('');

  // State pre hodnotenie
  const [showCustomerRatingDialog, setShowCustomerRatingDialog] = useState(false);
  const [selectedCustomerForRating, setSelectedCustomerForRating] = useState<Customer | null>(null);
  const [showCarrierRatingDialog, setShowCarrierRatingDialog] = useState(false);
  const [selectedCarrierForRating, setSelectedCarrierForRating] = useState<Carrier | null>(null);
  const [showOrderRatingDialog, setShowOrderRatingDialog] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<OrderFormData | null>(null);

  // State pre výber jazyka PDF
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState<null | HTMLElement>(null);
  const [languageMenuAction, setLanguageMenuAction] = useState<'preview' | 'download'>('preview');
  const [orderForLanguageSelection, setOrderForLanguageSelection] = useState<OrderFormData | null>(null);
  
  // PDF loading dialog state
  const [showPdfLoadingDialog, setShowPdfLoadingDialog] = useState(false);
  const [pdfLoadingMessage, setPdfLoadingMessage] = useState('');

  

  // State pre stránkovanie všetkých kariet
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersRowsPerPage, setOrdersRowsPerPage] = useState(25);
  const [customersPage, setCustomersPage] = useState(0);
  const [customersRowsPerPage, setCustomersRowsPerPage] = useState(25);
  const [carriersPage, setCarriersPage] = useState(0);
  const [carriersRowsPerPage, setCarriersRowsPerPage] = useState(25);
  const [locationsPage, setLocationsPage] = useState(0);
  const [locationsRowsPerPage, setLocationsRowsPerPage] = useState(25);


  const [dispatchersPage, setDispatchersPage] = useState(0);
  const [dispatchersRowsPerPage, setDispatchersRowsPerPage] = useState(25);

  // --- FETCH FUNKCIE (presunuté SEM HORE) ---
  
  const fetchTeamMembers = useCallback(async () => {
    if (!userData?.companyID) return;
    setIsLoadingTeamMembers(true);
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
    } catch (err) { 
      console.error('Chyba pri načítaní členov tímu:', err); 
    } finally {
      setIsLoadingTeamMembers(false);
    }
  }, [userData]); // Pridaná celá userData dependency

  const fetchCustomers = useCallback(() => {
    console.log("Attempting to fetch customers..."); // Log začiatku
    if (!userData?.companyID) {
      console.log("Fetch Customers: No companyID found.");
      setCustomers([]);
      setIsLoadingCustomers(false);
      return () => {}; // Return empty cleanup function
    } 
    
    setIsLoadingCustomers(true);
    try {
      const customersRef = collection(db, 'customers');
      const q = query(
        customersRef, 
        where('companyID', '==', userData.companyID),
        orderBy('createdAt', 'desc')
      );
      
      // Používame onSnapshot namiesto getDocs pre real-time aktualizácie
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        // console.log('🔄 Real-time aktualizácia zákazníkov - počet dokumentov:', querySnapshot.docs.length);
        
        const customersData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data, 
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt 
          } as Customer;
        });
        
        console.log(`Fetched ${customersData.length} customers for company ${userData.companyID}.`); // Log výsledku
        setCustomers(customersData);
        setIsLoadingCustomers(false);
      }, (error) => {
        console.error('Fetch Customers Error:', error); // Log chyby
        setIsLoadingCustomers(false);
      });
      
      return unsubscribe; // Return cleanup function
    } catch (error) {
      console.error('Error setting up customers listener:', error);
      setIsLoadingCustomers(false);
      return () => {}; // Return empty cleanup function
    }
  }, [userData?.companyID]); // Optimalizované dependencies
  
  const fetchCarriers = useCallback(() => {
    console.log("Attempting to fetch carriers..."); // Log začiatku
    if (!userData?.companyID) {
      console.log("Fetch Carriers: No companyID found.");
      setCarriers([]);
      setIsLoadingCarriers(false);
      return () => {}; // Return empty cleanup function
    }
    
    setIsLoadingCarriers(true);
    try {
      const carriersRef = collection(db, 'carriers');
      const q = query(
        carriersRef, 
        where('companyID', '==', userData.companyID), 
        orderBy('createdAt', 'desc')
      );
      
      // Používame onSnapshot namiesto getDocs pre real-time aktualizácie
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        // console.log('🔄 Real-time aktualizácia dopravcov - počet dokumentov:', querySnapshot.docs.length);
        // console.log('📋 Typ zmeny dokumentov:', querySnapshot.docChanges().map(change => ({
        //   type: change.type,
        //   id: change.doc.id,
        //   data: change.doc.data()
        // })));
        
        const carriersData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const carrier = { // Vytvoríme premennú pre logovanie
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
          } as Carrier;
          // console.log("🚛 Mapping carrier:", {
          //   id: carrier.id,
          //   companyName: carrier.companyName,
          //   vehicleTypes: carrier.vehicleTypes,
          //   paymentTermDays: carrier.paymentTermDays
          // }); // Logujeme kľúčové údaje
          return carrier;
        });
        
        console.log(`📊 Fetched ${carriersData.length} carriers for company ${userData.companyID}.`); 
        setCarriers(carriersData);
        setIsLoadingCarriers(false);
      }, (error) => {
        console.error('Fetch Carriers Error:', error); 
        setIsLoadingCarriers(false);
      });
      
      return unsubscribe; // Return cleanup function
    } catch (error) {
      console.error('Error setting up carriers listener:', error);
      setIsLoadingCarriers(false);
      return () => {}; // Return empty cleanup function
    }
  }, [userData?.companyID]); // Optimalizované dependencies

  const fetchOrders = useCallback(() => {
    if (!userData?.companyID) { 
      setOrders([]); 
      setLoading(false); 
      setIsLoadingOrders(false);
      setError('Nemáte priradenú firmu.'); 
      return () => {}; // Return empty cleanup function
    }
    
    setLoading(true); 
    setIsLoadingOrders(true);
    setError(null);
    
    try {
      let ordersQuery = query(collection(db, 'orders'), where('companyID', '==', userData.companyID));
      
      if (startDate) {
        ordersQuery = query(ordersQuery, where('createdAt', '>=', Timestamp.fromDate(new Date(startDate.setHours(0,0,0,0)))));
      }
      
      if (endDate) {
        const endOfDay = new Date(endDate); 
        endOfDay.setHours(23, 59, 59, 999);
        ordersQuery = query(ordersQuery, where('createdAt', '<=', Timestamp.fromDate(endOfDay)));
      }
      
      ordersQuery = query(ordersQuery, orderBy('createdAt', 'desc'));
      
      // Používama onSnapshot namiesto getDocs pre real-time aktualizácie
      const unsubscribe = onSnapshot(ordersQuery, (querySnapshot) => {
        // console.log('🔄 Real-time aktualizácia objednávok - počet dokumentov:', querySnapshot.docs.length);
        
        const currentTeamMembers = teamMembers;
        const ordersData: OrderFormData[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const createdByName = (data.createdBy && currentTeamMembers[data.createdBy]?.name) || data.createdByName || ''; 
          const loadingPlacesWithDates = (data.loadingPlaces || []).map((p: any) => ({ ...p, dateTime: convertToDate(p.dateTime) }));
          const unloadingPlacesWithDates = (data.unloadingPlaces || []).map((p: any) => ({ ...p, dateTime: convertToDate(p.dateTime) }));
          const createdAtTimestamp = data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(convertToDate(data.createdAt) || new Date());
          
          const order: OrderFormData = {
            id: doc.id, 
            companyID: data.companyID, 
            createdBy: data.createdBy, 
            createdAt: createdAtTimestamp, 
            loadingPlaces: loadingPlacesWithDates, 
            unloadingPlaces: unloadingPlacesWithDates, 
            customerCompany: data.zakaznik || data.customerCompany || '', 
            customerPrice: data.suma || data.customerPrice || '', 
            customerContactName: data.customerContactName || '', 
            customerContactSurname: data.customerContactSurname || '', 
            customerVatId: data.customerVatId || '', 
            customerStreet: data.customerStreet || '', 
            customerCity: data.customerCity || '', 
            customerZip: data.customerZip || '', 
            customerCountry: data.customerCountry || 'Slovensko', 
            customerEmail: data.customerEmail || '', 
            customerPhone: data.customerPhone || '', 
            goodsDescription: data.goodsDescription || '', 
            weightKg: data.weightKg || '', 
            dimensionsL: data.dimensionsL || '', 
            dimensionsW: data.dimensionsW || '', 
            dimensionsH: data.dimensionsH || '', 
            quantity: data.quantity || '', 
            // Pridané nové polia
            poziadavky: data.poziadavky || '',
            internaPoznamka: data.internaPoznamka || '',
            cisloNakladuZakaznika: data.cisloNakladuZakaznika || '',
            carrierCompany: data.carrierCompany || '', 
            carrierContact: data.carrierContact || '', 
            carrierVehicleReg: data.carrierVehicleReg || '', 
            carrierPrice: data.carrierPrice || '', 
            // Kompletné údaje dopravcu
            carrierEmail: data.carrierEmail || '',
            carrierPhone: data.carrierPhone || '',
            carrierIco: data.carrierIco || '',
            carrierDic: data.carrierDic || '',
            carrierIcDph: data.carrierIcDph || '',
            carrierStreet: data.carrierStreet || '',
            carrierCity: data.carrierCity || '',
            carrierZip: data.carrierZip || '',
            carrierCountry: data.carrierCountry || '',
            carrierVehicleTypes: data.carrierVehicleTypes || [],
            carrierNotes: data.carrierNotes || '',
            carrierRating: data.carrierRating || 0,
            reminderDateTime: convertToDate(data.reminderDateTime),
            rating: data.rating || null, // Pridám rating pole
          };
          
          (order as any).zakaznik = data.zakaznik || data.customerCompany || '';
          (order as any).kontaktnaOsoba = data.kontaktnaOsoba || `${data.customerContactName || ''} ${data.customerContactSurname || ''}`.trim();
          (order as any).suma = data.suma || data.customerPrice || '';
          (order as any).createdByName = createdByName;
          (order as any).orderNumberFormatted = data.orderNumberFormatted || '';
          return order;
        });
        
        // Optimalizácia: Porovnaj nové orders s existujúcimi
        setOrders(prevOrders => {
          // Ak je rovnaký počet objednávok a rovnaké ID, nepotrebujeme update
          if (prevOrders.length === ordersData.length) {
            const prevIds = prevOrders.map(o => o.id).sort();
            const newIds = ordersData.map(o => o.id).sort();
            
            // Porovnaj ID objednávok
            const idsAreSame = prevIds.length === newIds.length && 
                              prevIds.every((id, index) => id === newIds[index]);
            
            if (idsAreSame) {
              // Skontroluj či sa zmenili hodnoty (porovnaj key properties)
              const hasChanges = ordersData.some((newOrder, index) => {
                const prevOrder = prevOrders[index];
                return (
                  prevOrder.customerCompany !== newOrder.customerCompany ||
                  prevOrder.customerPrice !== newOrder.customerPrice ||
                  prevOrder.carrierPrice !== newOrder.carrierPrice ||
                  (prevOrder as any).orderNumberFormatted !== (newOrder as any).orderNumberFormatted ||
                  prevOrder.loadingPlaces?.[0]?.city !== newOrder.loadingPlaces?.[0]?.city ||
                  prevOrder.unloadingPlaces?.[0]?.city !== newOrder.unloadingPlaces?.[0]?.city ||
                  JSON.stringify(prevOrder.rating || {}) !== JSON.stringify(newOrder.rating || {}) // Pridám porovnanie rating
                );
              });
              
              if (!hasChanges) {
                // console.log('⚡ Žiadne zmeny v orders - preskakujem update');
                return prevOrders; // Vráť existujúce orders bez zmeny
              }
            }
          }
          
          // console.log('📋 Aktualizujem orders - nájdené zmeny');
          return ordersData;
        });
        
        setLoading(false);
        setIsLoadingOrders(false);
      }, (err) => { 
        console.error('Chyba pri real-time načítaní objednávok:', err); 
        setError('Nastala chyba pri načítaní objednávok');
        setLoading(false);
        setIsLoadingOrders(false);
      });
      
      return unsubscribe; // Return cleanup function
    } catch (err) { 
      console.error('Chyba pri nastavovaní real-time listenera objednávok:', err); 
      setError('Nastala chyba pri načítaní objednávok');
      setLoading(false);
      setIsLoadingOrders(false);
      return () => {}; // Return empty cleanup function
    }
  }, [userData?.companyID, startDate, endDate, teamMembers]); // Optimalizované dependencies

  const fetchLocations = useCallback(async () => {
    if (!userData?.companyID) {
      setLocations([]);
      setIsLoadingLocations(false);
      return () => {}; // Return empty cleanup function
    }
    
    setIsLoadingLocations(true);
    try {
      // Načítame miesta z dedikovanej kolekcie
      const locationsRef = collection(db, 'locations');
      const q = query(
        locationsRef, 
        where('companyID', '==', userData.companyID),
        orderBy('createdAt', 'desc')
      );
      
      // Používame onSnapshot pre real-time aktualizácie
      const unsubscribeLocations = onSnapshot(q, (querySnapshot) => {
        // console.log('🔄 Real-time aktualizácia miest - počet dokumentov:', querySnapshot.docs.length);
        
        const locationsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
          };
        });
        
        console.log(`Načítané ${locationsData.length} miest pre firmu ${userData.companyID}.`);
        setLocations(locationsData);
        setIsLoadingLocations(false);
      }, (error) => {
        console.error('Chyba pri načítaní miest:', error);
        setIsLoadingLocations(false);
      });
      
      return unsubscribeLocations;
    } catch (error) {
      console.error('Chyba pri nastavovaní real-time listenera miest:', error);
      setIsLoadingLocations(false);
      return () => {};
    }
  }, [userData?.companyID]); // Optimalizované dependencies

  // Nová, jednoduchá funkcia na výpočet štatistík špeditérov z existujúcich objednávok
  const calculateDispatcherStats = useCallback(() => {
    if (!orders || orders.length === 0) {
      console.log('🔍 Žiadne objednávky na spracovanie pre špeditérov');
      setDispatchers([]);
      setIsLoadingDispatchers(false);
      return;
    }

    console.log('📊 Počítam štatistiky špeditérov z', orders.length, 'objednávok s filtrom:', dispatcherFilter);
    
    // Aplikujeme filtrovanie podľa dispatcherFilter
    let filteredOrders = orders;
    
    if (dispatcherFilter === 'thisMonth') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      filteredOrders = orders.filter(order => {
        const orderDate = order.createdAt instanceof Timestamp 
          ? order.createdAt.toDate() 
          : new Date(order.createdAt || new Date());
        return orderDate >= startOfMonth && orderDate <= endOfMonth;
      });
      
      console.log('📅 Filtered for thisMonth:', filteredOrders.length, 'objednávok');
    } else if (dispatcherFilter === 'thisYear') {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      
      filteredOrders = orders.filter(order => {
        const orderDate = order.createdAt instanceof Timestamp 
          ? order.createdAt.toDate() 
          : new Date(order.createdAt || new Date());
        return orderDate >= startOfYear && orderDate <= endOfYear;
      });
      
      console.log('📅 Filtered for thisYear:', filteredOrders.length, 'objednávok');
    } else if (dispatcherFilter === 'custom' && customStartDate && customEndDate) {
      const startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
      
      filteredOrders = orders.filter(order => {
        const orderDate = order.createdAt instanceof Timestamp 
          ? order.createdAt.toDate() 
          : new Date(order.createdAt || new Date());
        return orderDate >= startDate && orderDate <= endDate;
      });
      
      console.log('📅 Filtered for custom range:', filteredOrders.length, 'objednávok');
    }

    const dispatcherStats: { [key: string]: any } = {};
    
    filteredOrders.forEach(order => {
      const createdBy = order.createdBy;
      const createdByName = (order as any).createdByName;
      const customerPrice = parseFloat((order as any).suma || order.customerPrice || '0');
      const carrierPrice = parseFloat(order.carrierPrice || '0');
      const profit = customerPrice - carrierPrice;
      
      if (createdBy && !isNaN(profit)) {
        if (!dispatcherStats[createdBy]) {
          dispatcherStats[createdBy] = {
            id: createdBy,
            name: createdByName || teamMembers[createdBy]?.name || 'Neznámy',
            email: teamMembers[createdBy]?.email || '',
            totalOrders: 0,
            totalRevenue: 0,
            totalCosts: 0,
            totalProfit: 0,
            avgProfit: 0,
            avgProfitMargin: 0,
            orders: []
          };
        }
        
        dispatcherStats[createdBy].totalOrders += 1;
        dispatcherStats[createdBy].totalRevenue += customerPrice;
        dispatcherStats[createdBy].totalCosts += carrierPrice;
        dispatcherStats[createdBy].totalProfit += profit;
        dispatcherStats[createdBy].orders.push({
          id: order.id,
          customerPrice,
          carrierPrice,
          profit,
          profitMargin: customerPrice > 0 ? ((profit / customerPrice) * 100) : 0,
          date: order.createdAt
        });
      }
    });
    
    // Vypočítame priemerné hodnoty
    Object.values(dispatcherStats).forEach((dispatcher: any) => {
      dispatcher.avgProfit = dispatcher.totalOrders > 0 
        ? dispatcher.totalProfit / dispatcher.totalOrders 
        : 0;
      dispatcher.avgProfitMargin = dispatcher.totalRevenue > 0 
        ? ((dispatcher.totalProfit / dispatcher.totalRevenue) * 100) 
        : 0;
    });
    
    const resultArray = Object.values(dispatcherStats);
    console.log('👥 Vypočítané štatistiky pre', resultArray.length, 'špeditérov');
    
    setDispatchers(resultArray);
    setIsLoadingDispatchers(false);
  }, [orders, dispatcherFilter, customStartDate, customEndDate, teamMembers]);

  // --- useEffect HOOKY (optimalizované pre zamedzenie duplicitných načítaní) ---

  // Jeden centrálny useEffect pre načítanie team members
  useEffect(() => {
    if (userData?.companyID) {
      fetchTeamMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.companyID]); // Odstránená fetchTeamMembers dependency aby sme zabránili nekonečným loop

  // useEffect pre načítanie dokumentov všetkých objednávok
  useEffect(() => {
    if (!userData?.companyID) return;

    const documentsRef = collection(db, 'orderDocuments');
    const q = query(
      documentsRef,
      where('companyID', '==', userData.companyID)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData: Record<string, any[]> = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const orderId = data.orderId;
        
        if (!docsData[orderId]) {
          docsData[orderId] = [];
        }
        
        docsData[orderId].push({
          id: doc.id,
          ...data
        });
      });
      
      setOrderDocuments(docsData);
    }, (err) => {
      console.error('Chyba pri načítaní dokumentov:', err);
    });

    return () => unsubscribe();
  }, [userData?.companyID]);

  // Hlavný useEffect pre inicializáciu základných real-time listeners (len pre customers, carriers, locations)
  useEffect(() => {
    if (!userData?.companyID) {
      console.log("❌ No companyID available, skipping data fetch");
      return;
    }

    console.log("✅ Running initial data fetch on component mount for company:", userData.companyID);
    
    // Nastavíme real-time listenery len pre statické data (customers, carriers, locations)
    const unsubscribeCustomers = fetchCustomers(); 
    const unsubscribeCarriers = fetchCarriers();
    
    // Osobitne spracujeme async fetchLocations
    let unsubscribeLocations: (() => void) | undefined;
    fetchLocations().then(unsubscribe => {
      unsubscribeLocations = unsubscribe;
    });
    
    // Cleanup funkcie pre real-time listenery
    return () => {
      console.log("🧹 Cleaning up real-time listeners");
      if (typeof unsubscribeCustomers === 'function') {
        unsubscribeCustomers();
      }
      if (typeof unsubscribeCarriers === 'function') {
        unsubscribeCarriers();
      }
      if (typeof unsubscribeLocations === 'function') {
        unsubscribeLocations();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.companyID]); // Odstránené fetch funkcie dependencies aby sme zabránili nekonečným loop

  // Samostatný useEffect pre fetchOrders s dátumovými filtrami
  useEffect(() => {
    if (!userData?.companyID) {
      return;
    }

    console.log("🔄 Running fetchOrders due to filter change (startDate, endDate).");
    // Nastavíme nový listener s aktualizovanými filtrami
    const unsubscribeOrders = fetchOrders(); 
    
    // Cleanup predchádzajúceho listenera
    return () => {
      if (typeof unsubscribeOrders === 'function') {
        unsubscribeOrders();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.companyID, startDate, endDate]); // Odstránená fetchOrders dependency aby sme zabránili nekonečným loop

  // useEffect pre dispatchers - spúšťa sa len pri zmene relevantných filtrov
  useEffect(() => {
    if (userData?.companyID && Object.keys(teamMembers).length > 0) {
      console.log("📊 Running calculateDispatcherStats due to filter change");
      calculateDispatcherStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.companyID, dispatcherFilter, customStartDate, customEndDate, teamMembers, orders]); // Pridané orders dependency


  // useEffect na sledovanie zmien v zozname objednávok a resetovanie selectedRowId
  useEffect(() => {
    // Skontrolujeme či vybraná objednávka ešte existuje v aktuálnom zozname
    if (selectedRowId && orders.length > 0) {
      const orderExists = orders.some(order => order.id === selectedRowId);
      if (!orderExists) {
        console.log('🧹 Resetujem selectedRowId - objednávka už neexistuje:', selectedRowId);
        setSelectedRowId(null);
      }
    }
  }, [orders, selectedRowId]);

  // Definícia handleDeleteOrder pred použitím v hook
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
      // fetchOrders(); // Odstránené - real-time listener automaticky aktualizuje
      
      // Obnovíme štatistiky špeditérov po vymazaní objednávky
      if (userData?.companyID && Object.keys(teamMembers).length > 0) {
        console.log("📊 Obnova štatistík špeditérov po vymazaní objednávky");
        calculateDispatcherStats();
      }
    } catch (err) {
      console.error('Chyba pri mazaní objednávky:', err);
      setError('Nastala chyba pri mazaní objednávky');
    } finally {
      setLoading(false);
    }
  };

  // Použitie vyčlenených handler funkcií
  const orderHandlers = useOrderHandlers(
    orders,
    searchQuery,
    documentFilter,
    orderDocuments,
    teamMembers,
    sortField,
    sortDirection,
    setSortField,
    setSortDirection,
    setTabValue,
    setSelectedOrderId,
    setShowDeleteConfirm,
    setSelectedOrder,
    setIsEditMode,
    setShowNewOrderWizard,
    handleDeleteOrder
  );

  // Extraktované funkcie z hook
  const {
    handleTabChange,
    handleSort,
    filteredOrders: _filteredOrders,
    getFilteredCustomerOrders,
    calculateOrderStats,
    openDeleteConfirmation,
    handleDeleteCancel,
    handleEditOrder,
    handleDuplicateOrder
  } = orderHandlers;

  // Špecifická implementácia handleDeleteConfirmed
  const handleDeleteConfirmed = async () => {
    if (selectedOrderId) {
      await handleDeleteOrder(selectedOrderId);
      setShowDeleteConfirm(false);
      setSelectedOrderId(null);
      
      // Resetujeme aj selectedRowId ak sa zhoduje s vymazanou objednávkou
      if (selectedRowId === selectedOrderId) {
        setSelectedRowId(null);
      }
    }
  };

  const handleOpenNewOrderForm = () => {
    setShowNewOrderWizard(true);
    setSelectedOrder(null);
    setIsEditMode(false);
  };

    const handleCloseNewOrderForm = () => {
    setShowNewOrderWizard(false);
    setSelectedOrder(null);
    setIsEditMode(false);
    
    // Obnovíme štatistiky špeditérov po uložení/úprave objednávky
    if (userData?.companyID && Object.keys(teamMembers).length > 0) {
      console.log("📊 Obnova štatistík špeditérov po uložení objednávky");
      calculateDispatcherStats();
    }
  };



  // Upravená funkcia pre náhľad PDF
  const _handlePreviewPDF = async (order: OrderFormData) => {
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
  const _handleDownloadPDF = async (order: OrderFormData) => {
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
      link.download = fileName || `order_${order.orderNumber || order.id.substring(0, 8)}.pdf`;
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
        companyID: userData.companyID // Pridanie companyID
      };

      // Ak máme selectedCustomerForEdit, ideme aktualizovať existujúceho zákazníka
      if (selectedCustomerForEdit) {
        if (!selectedCustomerForEdit.id) {
          console.error('Chyba: Zákazník nemá ID');
          alert('Chyba: Zákazník nemá ID');
          return;
        }
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
      
      // Real-time listener automaticky aktualizuje zoznam zákazníkov
      console.log("Real-time listener automaticky aktualizuje zákazníkov");
      
      // Resetujeme stav editácie a zatvoríme formulár
      setSelectedCustomerForEdit(null);
      setShowCustomerForm(false);
    } catch (error) {
      console.error('Chyba pri ukladaní/aktualizácii zákazníka:', error);
      alert('Nastala chyba pri ukladaní/aktualizácii zákazníka: ' + (error as Error).message);
    }
  };

  // useEffect pre zákazníkov odstránený - real-time listener sa nastavuje v hlavnom useEffect

  const handleAddCarrier = () => {
    setSelectedCarrierForEdit(null); // Reset editácie
    setShowCarrierForm(true);
  };

  const _handleCarrierSubmit = async (carrierData: any) => {
    if (!userData?.companyID) {
      alert("Chyba: Nemáte priradenú firmu.");
      return;
    }
    try {
      console.log('Začínam ukladanie/aktualizáciu dopravcu:', carrierData);
      
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
        paymentTermDays: carrierData.paymentTermDays || 60, // Default 60 days
        companyID: userData.companyID // Pridanie companyID
      };

      console.log('💾 Objekt na uloženie:', carrierDataToSave);

      // Ak editujeme existujúceho dopravcu
      if (selectedCarrierForEdit?.id) {
        console.log('✏️ Editujem existujúceho dopravcu s ID:', selectedCarrierForEdit.id);
        const carrierRef = doc(db, 'carriers', selectedCarrierForEdit.id);
        await updateDoc(carrierRef, carrierDataToSave);
        console.log('✅ Dopravca bol úspešne aktualizovaný s ID:', selectedCarrierForEdit.id);
        
        // Resetujeme stav editácie
        setSelectedCarrierForEdit(null);
      } else {
        console.log('➕ Vytváram nového dopravcu');
        // Vytvárame nového dopravcu
        const carriersRef = collection(db, 'carriers');
        const carrierDataWithTimestamp = {
          ...carrierDataToSave,
          createdAt: Timestamp.fromDate(new Date())
        };
        
        const docRef = await addDoc(carriersRef, carrierDataWithTimestamp);
        console.log('✅ Dopravca bol úspešne uložený s ID:', docRef.id);
      }
      
      // Real-time listener automaticky aktualizuje zoznam dopravcov
      console.log("🔄 Real-time listener automaticky aktualizuje dopravcov");
      
      // Resetujeme formulárové dáta
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
        notes: '',
        paymentTermDays: '60' // Default 60 dní ako string pre TextField
      });
      
      // Resetujeme aj selectedCarrierForEdit
      setSelectedCarrierForEdit(null);
      
      // Až potom zatvoríme formulár
      setShowCarrierForm(false);
    } catch (error) {
      console.error('❌ Chyba pri ukladaní dopravcu:', error);
      alert('Nastala chyba pri ukladaní dopravcu: ' + (error as Error).message);
    }
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
      // fetchCustomers(); // Odstránené - real-time listener automaticky aktualizuje
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
      notes: carrier.notes || '',
      paymentTermDays: (carrier.paymentTermDays || 60).toString() // Convert number to string
    });
    setShowCarrierForm(true);
  };

  const handleDeleteCarrier = async (id: string) => {
    try {
      const carrierRef = doc(db, 'carriers', id);
      await deleteDoc(carrierRef);
      console.log('Dopravca bol úspešne vymazaný');
      // fetchCarriers(); // Odstránené - real-time listener automaticky aktualizuje
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
  // eslint-disable-next-line
  const _getCustomerVatId = (customer: any) => {
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
    // Skontrolujeme či objednávka ešte existuje v aktuálnom zozname
    const orderExists = orders.some(o => o.id === order.id);
    if (!orderExists) {
      console.warn('⚠️ Pokus o kliknutie na neexistujúcu objednávku');
      setSelectedRowId(null);
      return;
    }
    
    // Ak klikneme na už vybraný riadok, zrušíme výber
    if (selectedRowId === order.id) {
      setSelectedRowId(null);
    } else {
      // Inak označíme nový riadok
      setSelectedRowId(order.id || null);
    }
  };

  const handleShowOrderDetail = async (order: OrderFormData) => {
    if (!order.id) {
      console.error('❌ Objednávka nemá ID');
      return;
    }
    
    try {
      console.log('🔄 Načítavam najnovšie dáta objednávky z Firebase...');
      const orderRef = doc(db, 'orders', order.id);
      const orderSnap = await getDoc(orderRef);
      
      if (orderSnap.exists()) {
        const data = orderSnap.data();
        const freshOrder: OrderFormData = {
          ...data,
          id: orderSnap.id
        } as OrderFormData;
        
        console.log('✅ Najnovšie dáta objednávky načítané');
        setSelectedOrder(freshOrder);
        setDetailDialogOpen(true);
      } else {
        console.error('❌ Objednávka neexistuje v Firebase - bola pravdepodobne vymazaná');
        alert('Objednávka už neexistuje. Bola pravdepodobne vymazaná.');
        
        // Resetujeme výber riadku ak sa zhoduje s neexistujúcou objednávkou
        if (selectedRowId === order.id) {
          setSelectedRowId(null);
        }
        return;
      }
    } catch (error) {
      console.error('❌ Chyba pri načítavaní objednávky:', error);
      alert('Nastala chyba pri načítavaní objednávky: ' + (error as Error).message);
      return;
    }
  };

  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
    setSelectedOrder(null);
    // Resetujeme aj selectedRowId pri zatvorení detailu
    setSelectedRowId(null);
  };

  // Funkcie pre správu miest
  const handleAddLocation = () => {
    setSelectedLocationForEdit(null);
    setShowLocationForm(true);
  };

  const handleLocationSubmit = async (locationData: LocationData) => {
    if (!userData?.companyID) {
      alert("Chyba: Nemáte priradenú firmu.");
      return;
    }
    try {
      console.log('Začínam ukladanie miesta:', locationData);
      
      const locationDataToSave = {
        type: locationData.type,
        companyName: locationData.companyName,
        city: locationData.city,
        street: locationData.street,
        zip: locationData.zip,
        country: locationData.country,
        contactPersonName: locationData.contactPersonName,
        contactPersonPhone: locationData.contactPersonPhone,
        companyID: userData.companyID,
        createdAt: Timestamp.fromDate(new Date()),
        usageCount: 0 // Počiatočný počet použití
      };

      if (selectedLocationForEdit) {
        // Editácia existujúceho miesta
        const locationRef = doc(db, 'locations', (selectedLocationForEdit as any).id);
        await updateDoc(locationRef, {
          ...locationDataToSave,
          updatedAt: Timestamp.fromDate(new Date())
        });
        console.log('Miesto bolo úspešne aktualizované');
      } else {
        // Pridanie nového miesta
        const locationsRef = collection(db, 'locations');
        const docRef = await addDoc(locationsRef, locationDataToSave);
        console.log('Miesto bolo úspešne uložené s ID:', docRef.id);
      }
      
      // Real-time listener automaticky aktualizuje zoznam miest
      console.log("Real-time listener automaticky aktualizuje miesta");
      
      // Resetujeme stav editácie a zatvoríme formulár
      setSelectedLocationForEdit(null);
      setShowLocationForm(false);
    } catch (error) {
      console.error('Chyba pri ukladaní miesta:', error);
      alert('Nastala chyba pri ukladaní miesta: ' + (error as Error).message);
    }
  };

  const handleEditLocation = (location: any) => {
    const locationForEdit: LocationData = {
      type: location.type,
      companyName: location.companyName,
      city: location.city,
      street: location.street,
      zip: location.zip,
      country: location.country,
      contactPersonName: location.contactPersonName,
      contactPersonPhone: location.contactPersonPhone
    };
    setSelectedLocationForEdit({ ...locationForEdit, id: location.id } as any);
    setShowLocationForm(true);
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      const locationRef = doc(db, 'locations', id);
      await deleteDoc(locationRef);
      console.log('Miesto bolo úspešne vymazané');
      // Real-time listener automaticky aktualizuje zoznam
    } catch (error) {
      console.error('Chyba pri vymazávaní miesta:', error);
      alert('Nastala chyba pri vymazávaní miesta: ' + (error as Error).message);
    }
  };

  const openLocationDeleteConfirmation = (id: string) => {
    setLocationToDelete(id);
    setShowLocationDeleteConfirm(true);
  };

  const handleLocationDeleteConfirmed = async () => {
    if (locationToDelete) {
      await handleDeleteLocation(locationToDelete);
      setShowLocationDeleteConfirm(false);
      setLocationToDelete('');
    }
  };

  const handleLocationDeleteCancel = () => {
    setShowLocationDeleteConfirm(false);
    setLocationToDelete('');
  };

  // Použitie vyčlenených rating handler funkcií
  const ratingHandlers = useRatingHandlers(
    setSelectedCustomerForRating,
    setShowCustomerRatingDialog,
    setSelectedCarrierForRating,
    setShowCarrierRatingDialog,
    setSelectedOrderForRating,
    setShowOrderRatingDialog,
    setOrders
  );

  // Extraktované rating funkcie z hook
  const {
    handleOpenCustomerRating,
    handleCloseCustomerRating,
    handleSubmitCustomerRating,
    handleOpenCarrierRating,
    handleCloseCarrierRating,
    handleSubmitCarrierRating,
    handleOpenOrderRating,
    handleCloseOrderRating,
    handleSubmitOrderRating,
    getCustomerAverageRating,
    getCarrierAverageRating,
    getOrderAverageRating
  } = ratingHandlers;

  // useEffect pre dopravcov odstránený - real-time listener sa nastavuje v hlavnom useEffect

  const handleCarrierFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCarrierFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Language menu handlers z LanguageMenuHandlers.tsx
  const {
    handleCloseLanguageMenu,
    handleLanguageSelect: handleLanguageSelectBase,
    handlePreviewPDFWithLanguage,
    handleDownloadPDFWithLanguage,
    handlePreviewPDFForTable,
    handleDownloadPDFForTable
  } = useLanguageMenuHandlers(
    setLanguageMenuAnchor,
    setOrderForLanguageSelection,
    setLanguageMenuAction,
    setShowLanguageMenu,
    setShowPdfLoadingDialog,
    setPdfLoadingMessage,
    setLoadingPdf,
    setPreviewOrder,
    setPdfUrl,
    setShowPdfPreview,
    setLoading
  );

  // Wrapper pre handleLanguageSelect s dodatočnými parametrami
  const handleLanguageSelect = async (language: 'sk' | 'en' | 'de' | 'cs' | 'pl') => {
    await handleLanguageSelectBase(
      language,
      orderForLanguageSelection,
      languageMenuAction,
      handlePreviewPDFWithLanguage,
      handleDownloadPDFWithLanguage
    );
  };

  return (
    <PageWrapper>
      <DialogGlobalStyles open={showNewOrderWizard || showCustomerForm || showCarrierForm || showDeleteConfirm || showCustomerDeleteConfirm || showCarrierDeleteConfirm || showPdfLoadingDialog} />
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
              <Tab label={t('orders.locations') || 'Miesta'} />
              <Tab label={t('orders.dispatchers') || 'Špeditéri'} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <OrdersHeader
              isDarkMode={isDarkMode}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              documentFilter={documentFilter}
              setDocumentFilter={setDocumentFilter}
              showFilters={showFilters}
              setShowFilters={setShowFilters}
              handleOpenNewOrderForm={handleOpenNewOrderForm}
              t={t}
            />

                        <Collapse in={showFilters}>
              <OrdersFilters
                startDate={startDate}
                endDate={endDate}
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                setDispatcherFilter={setDispatcherFilter}
                setCustomStartDate={setCustomStartDate}
                setCustomEndDate={setCustomEndDate}
                setDocumentFilter={setDocumentFilter}
                t={t}
              />
              </Collapse>
          
          {isLoadingOrders ? (
            <Box display="flex" justifyContent="center" mt={4}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Načítavam objednávky...
              </Typography>
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
                  onPreviewPDF={handlePreviewPDFForTable}
                  onDownloadPDF={handleDownloadPDFForTable}
                />
              ))}
                                  {getFilteredCustomerOrders().length === 0 && (
                      <Typography variant="body1" align="center" sx={{ mt: 4 }}>
                        {t('orders.noOrdersFound')}
                      </Typography>
                   )}
            </Box>
                    ) : ( // Ak nie je mobilné zariadenie, zobraz fixnú tabuľku
            <OrdersTable
                        isDarkMode={isDarkMode}
              paginatedOrders={getFilteredCustomerOrders().slice(ordersPage * ordersRowsPerPage, ordersPage * ordersRowsPerPage + ordersRowsPerPage)}
              getFilteredCustomerOrders={getFilteredCustomerOrders}
              ordersPage={ordersPage}
              ordersRowsPerPage={ordersRowsPerPage}
              setOrdersPage={setOrdersPage}
              setOrdersRowsPerPage={setOrdersRowsPerPage}
                        sortField={sortField}
                        sortDirection={sortDirection}
              handleSort={handleSort}
                        teamMembers={teamMembers}
              selectedRowId={selectedRowId}
              handleRowClick={handleRowClick}
              handleShowOrderDetail={handleShowOrderDetail}
              handleEditOrder={handleEditOrder}
              handleDuplicateOrder={handleDuplicateOrder}
              handlePreviewPDFForTable={handlePreviewPDFForTable}
              handleDownloadPDFForTable={handleDownloadPDFForTable}
              openDeleteConfirmation={openDeleteConfirmation}
              handleOpenOrderRating={handleOpenOrderRating}
              calculateOrderStats={calculateOrderStats}
                        t={t}
                        getOrderAverageRating={getOrderAverageRating}
                      />
          )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <CustomersTable
              isDarkMode={isDarkMode}
              customers={customers}
              customerSearchQuery={customerSearchQuery}
              setCustomerSearchQuery={setCustomerSearchQuery}
              isLoadingCustomers={isLoadingCustomers}
              customersPage={customersPage}
              customersRowsPerPage={customersRowsPerPage}
              setCustomersPage={setCustomersPage}
              setCustomersRowsPerPage={setCustomersRowsPerPage}
              handleAddCustomer={handleAddCustomer}
              handleEditCustomer={handleEditCustomer}
              openCustomerDeleteConfirmation={openCustomerDeleteConfirmation}
              handleOpenCustomerRating={handleOpenCustomerRating}
              getCustomerAverageRating={getCustomerAverageRating}
              t={t}
                  />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <CarriersTable
              isDarkMode={isDarkMode}
              carriers={carriers}
              carrierSearchQuery={carrierSearchQuery}
              setCarrierSearchQuery={setCarrierSearchQuery}
              isLoadingCarriers={isLoadingCarriers}
              carriersPage={carriersPage}
              carriersRowsPerPage={carriersRowsPerPage}
              setCarriersPage={setCarriersPage}
              setCarriersRowsPerPage={setCarriersRowsPerPage}
              handleAddCarrier={handleAddCarrier}
              handleEditCarrier={handleEditCarrier}
              openCarrierDeleteConfirmation={openCarrierDeleteConfirmation}
              handleOpenCarrierRating={handleOpenCarrierRating}
              getCarrierAverageRating={getCarrierAverageRating}
              t={t}
                  />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <LocationsTable
              isDarkMode={isDarkMode}
              locations={locations}
              locationSearchQuery={locationSearchQuery}
              setLocationSearchQuery={setLocationSearchQuery}
              isLoadingLocations={isLoadingLocations}
              locationsPage={locationsPage}
              locationsRowsPerPage={locationsRowsPerPage}
              setLocationsPage={setLocationsPage}
              setLocationsRowsPerPage={setLocationsRowsPerPage}
              handleAddLocation={handleAddLocation}
              handleEditLocation={handleEditLocation}
              openLocationDeleteConfirmation={openLocationDeleteConfirmation}
              t={t}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <DispatchersFilters
              dispatcherFilter={dispatcherFilter}
              setDispatcherFilter={setDispatcherFilter}
              customStartDate={customStartDate}
              setCustomStartDate={setCustomStartDate}
              customEndDate={customEndDate}
              setCustomEndDate={setCustomEndDate}
              t={t}
            />
            <DispatchersTable
              isDarkMode={isDarkMode}
              dispatchers={dispatchers}
              dispatcherSearchQuery={dispatcherSearchQuery}
              setDispatcherSearchQuery={setDispatcherSearchQuery}
              isLoadingDispatchers={isLoadingDispatchers}
              dispatchersPage={dispatchersPage}
              dispatchersRowsPerPage={dispatchersRowsPerPage}
              setDispatchersPage={setDispatchersPage}
              setDispatchersRowsPerPage={setDispatchersRowsPerPage}
              t={t}
            />
            <DispatchersCards
              dispatchers={dispatchers}
              dispatcherSearchQuery={dispatcherSearchQuery}
              isDarkMode={isDarkMode}
            />
          </TabPanel>
        </Box>
      </StyledPaper>



      {/* Dialog pre mazanie OBJEDNÁVKY */}
      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirmed}
        title={t('common.confirmDelete')}
        message={t('orders.deleteConfirmation') || 'Naozaj chcete vymazať túto objednávku? Táto akcia je nenávratná.'}
        loading={loading}
        icon="📋"
      />

      <PdfPreviewDialog
        open={showPdfPreview}
        onClose={() => {
            setShowPdfPreview(false);
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
                setPdfUrl(null);
            }
        }}
        loadingPdf={loadingPdf}
        pdfUrl={pdfUrl}
        previewOrder={previewOrder}
        t={t}
      />

    <CustomerForm
      open={showCustomerForm}
      onClose={() => {
        setShowCustomerForm(false);
        setSelectedCustomerForEdit(null);
      }}
      onSubmit={handleCustomerSubmit}
      editCustomer={selectedCustomerForEdit ? {
        companyName: selectedCustomerForEdit.company || (selectedCustomerForEdit as any).companyName || '', // Mapujeme company alebo companyName na companyName pre CustomerForm
        street: selectedCustomerForEdit.street,
        city: selectedCustomerForEdit.city,
        zip: selectedCustomerForEdit.zip,
        country: selectedCustomerForEdit.country,
        contactName: selectedCustomerForEdit.contactName,
        contactSurname: selectedCustomerForEdit.contactSurname,
        contactEmail: selectedCustomerForEdit.email || (selectedCustomerForEdit as any).contactEmail || '', // Mapujeme email alebo contactEmail na contactEmail pre CustomerForm
        contactPhonePrefix: selectedCustomerForEdit.contactPhonePrefix || '+421',
        contactPhone: selectedCustomerForEdit.contactPhone || '',
        ico: selectedCustomerForEdit.ico,
        dic: selectedCustomerForEdit.dic,
        icDph: selectedCustomerForEdit.vatId || (selectedCustomerForEdit as any).icDph || '', // Mapujeme vatId alebo icDph na icDph pre CustomerForm
        paymentTermDays: selectedCustomerForEdit.paymentTermDays || 30
      } : undefined}
    />

    {/* Formulár pre dopravcov */}
    <CarrierFormDialog
      open={showCarrierForm}
      onClose={() => {
        setShowCarrierForm(false);
        setSelectedCarrierForEdit(null);
      }}
      onSubmit={_handleCarrierSubmit}
      editCarrier={selectedCarrierForEdit}
      formData={carrierFormData}
      onFormChange={handleCarrierFormChange}
      isDarkMode={isDarkMode}
      loading={loading}
    />

    {/* Potvrdzovací dialóg pre vymazanie ZÁKAZNÍKA */}
    <DeleteConfirmDialog
        open={showCustomerDeleteConfirm}
        onClose={handleCustomerDeleteCancel}
      onConfirm={handleCustomerDeleteConfirmed}
      title={t('common.confirmDelete')}
      message={t('orders.deleteCustomerConfirmation') || 'Naozaj chcete vymazať tohto zákazníka? Táto akcia je nenávratná.'}
      loading={loading}
      icon="🗑️"
    />

    {/* Potvrdzovací dialóg pre vymazanie DOPRAVCU */}
    <DeleteConfirmDialog
        open={showCarrierDeleteConfirm}
        onClose={handleCarrierDeleteCancel}
      onConfirm={handleCarrierDeleteConfirmed}
      title={t('common.confirmDelete')}
      message={t('orders.deleteCarrierConfirmation') || 'Naozaj chcete vymazať tohto dopravcu? Táto akcia je nenávratná.'}
      loading={loading}
      icon="🚛"
    />

    <OrderDetail 
      open={detailDialogOpen}
      onClose={handleCloseDetail}
      order={selectedOrder}
    />

    {/* New Order Wizard */}
    <NewOrderWizard
      open={showNewOrderWizard}
      onClose={handleCloseNewOrderForm}
      isEdit={isEditMode}
      orderData={selectedOrder || undefined}
      onOrderSaved={() => {
        // Callback po úspešnom uložení objednávky
        if (userData?.companyID && Object.keys(teamMembers).length > 0) {
          console.log("📊 Callback: Obnova štatistík špeditérov po uložení");
          calculateDispatcherStats();
        }
      }}
    />

    <LocationForm
      open={showLocationForm}
      onClose={() => {
        setShowLocationForm(false);
        setSelectedLocationForEdit(null);
      }}
      onSubmit={handleLocationSubmit}
      editLocation={selectedLocationForEdit}
    />

    {/* Potvrdzovací dialóg pre vymazanie MIESTA */}
    <DeleteConfirmDialog
      open={showLocationDeleteConfirm}
      onClose={handleLocationDeleteCancel}
      onConfirm={handleLocationDeleteConfirmed}
      title={t('common.confirmDelete')}
      message={t('orders.deleteLocationConfirmation') || 'Ste si istý, že chcete vymazať toto miesto? Táto akcia je nenávratná.'}
      loading={loading}
      icon="📍"
    />

    {/* Dialógy pre hodnotenie */}
    {selectedCustomerForRating && (
      <CustomerRatingDialog
        open={showCustomerRatingDialog}
        onClose={handleCloseCustomerRating}
        customer={selectedCustomerForRating}
        onSubmit={handleSubmitCustomerRating}
      />
    )}

    {selectedCarrierForRating && (
      <CarrierRatingDialog
        open={showCarrierRatingDialog}
        onClose={handleCloseCarrierRating}
        carrier={selectedCarrierForRating}
        onSubmit={handleSubmitCarrierRating}
      />
    )}

    {selectedOrderForRating && (
      <OrderRatingDialog
        open={showOrderRatingDialog}
        onClose={handleCloseOrderRating}
        order={selectedOrderForRating}
        onSubmit={handleSubmitOrderRating}
      />
    )}

    {/* Language Selector Menu */}
    <LanguageSelector
      open={showLanguageMenu}
      anchorEl={languageMenuAnchor}
      onClose={handleCloseLanguageMenu}
      onLanguageSelect={handleLanguageSelect}
    />

    {/* PDF Loading Dialog */}
    <PdfLoadingDialog
      open={showPdfLoadingDialog}
      message={pdfLoadingMessage}
    />


    </PageWrapper>
  );
};

function OrdersForm() {
  return <OrdersList />;
}

export default OrdersForm; 