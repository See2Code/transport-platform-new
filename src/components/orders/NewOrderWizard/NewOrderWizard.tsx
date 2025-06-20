import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Step,
  StepLabel,
  Button,
  TextField,
  Autocomplete,
  IconButton,
  Divider,
  Dialog,
  DialogContent,
  DialogActions,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';


// Icons
import PersonIcon from '@mui/icons-material/Person';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SummaryIcon from '@mui/icons-material/Assessment';
import BusinessIcon from '@mui/icons-material/Business';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CheckIcon from '@mui/icons-material/Check';

// Firebase imports
import { collection, addDoc, query, where, getDocs, doc, updateDoc, Timestamp, orderBy, getDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useThemeMode } from '../../../contexts/ThemeContext';

// Types
import { OrderFormData, GoodsItem } from '../../../types/orders';
import { Customer } from '../../../types/customers';
import { Carrier } from '../../../types/carriers';
import DialogHandlers from './DialogHandlers';


import BareTooltip from './BareTooltip';
import { StyledStepper } from './StyledComponents';
import { emptyGoodsItem, emptyLoadingPlace, emptyUnloadingPlace, NewOrderWizardProps } from './types';
import CustomerStep from './CustomerStep';
import CargoStep from './CargoStep';
import CarrierStep from './CarrierStep';







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
    // Pridané kompletné polia dopravcu
    carrierEmail: '',
    carrierPhone: '',
    carrierIco: '',
    carrierDic: '',
    carrierIcDph: '',
    carrierStreet: '',
    carrierCity: '',
    carrierZip: '',
    carrierCountry: 'Slovensko',
    carrierVehicleTypes: [],
    carrierNotes: '',
    carrierRating: 0,
    carrierPaymentTermDays: 60,
    // Pridané polia pre číslo objednávky
    orderNumber: '',
    orderNumberFormatted: '',
    orderYear: '',
    orderMonth: '',
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

  // Carrier payment terms editing
  const [isEditingCarrierPaymentTerms, setIsEditingCarrierPaymentTerms] = useState(false);

  // Order number editing
  const [isEditingOrderNumber, setIsEditingOrderNumber] = useState(false);
  const [originalOrderNumber, setOriginalOrderNumber] = useState<string>('');
  const orderNumberInputRef = useRef<HTMLInputElement>(null);

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
      console.log('🔢 Začínam generovanie čísla objednávky...');
      
      // Generate order number
      const orderYear = new Date().getFullYear().toString();
      const orderMonth = (new Date().getMonth() + 1).toString().padStart(2, '0');
      
      console.log('📅 Generujem pre rok/mesiac:', orderYear, orderMonth);
      
      const orderNumberQuery = query(
        collection(db, 'orders'),
        where('companyID', '==', userData.companyID),
        where('orderYear', '==', orderYear),
        where('orderMonth', '==', orderMonth)
      );
      
      const orderSnapshot = await getDocs(orderNumberQuery);
      console.log('📊 Počet existujúcich objednávok:', orderSnapshot.size);
      
      // Debug: Zobrazíme všetky existujúce čísla objednávok
      const existingOrderNumbers = orderSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          orderNumberFormatted: data.orderNumberFormatted,
          orderNumber: data.orderNumber,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt)
        };
      });
      
      console.log('📋 Existujúce čísla objednávok:', existingOrderNumbers);
      
      const orderNumber = (orderSnapshot.size + 1).toString().padStart(3, '0');
      const orderNumberFormatted = `${orderYear}${orderMonth}${orderNumber}`;
      
      console.log('🎯 Nové rezervované číslo objednávky:', orderNumberFormatted);
      console.log('🔍 Kontrola duplicity - hľadám číslo:', orderNumberFormatted);
      
      // Dodatočná kontrola duplicity
      const duplicateCheckQuery = query(
        collection(db, 'orders'),
        where('companyID', '==', userData.companyID),
        where('orderNumberFormatted', '==', orderNumberFormatted)
      );
      
      const duplicateSnapshot = await getDocs(duplicateCheckQuery);
      if (!duplicateSnapshot.empty) {
        console.error('❌ CHYBA: Číslo objednávky už existuje!', orderNumberFormatted);
        console.error('🔍 Existujúce dokumenty s týmto číslom:', duplicateSnapshot.docs.map(doc => ({
          id: doc.id,
          data: doc.data()
        })));
        
        // Pokúsime sa nájsť ďalšie voľné číslo
        let nextNumber = orderSnapshot.size + 2;
        let nextOrderNumberFormatted = '';
        let attempts = 0;
        const maxAttempts = 10;
        
        while (attempts < maxAttempts) {
          nextOrderNumberFormatted = `${orderYear}${orderMonth}${nextNumber.toString().padStart(3, '0')}`;
          const nextDuplicateQuery = query(
            collection(db, 'orders'),
            where('companyID', '==', userData.companyID),
            where('orderNumberFormatted', '==', nextOrderNumberFormatted)
          );
          
          const nextDuplicateSnapshot = await getDocs(nextDuplicateQuery);
          if (nextDuplicateSnapshot.empty) {
            console.log('✅ Nájdené voľné číslo:', nextOrderNumberFormatted);
            setReservedOrderNumber(nextOrderNumberFormatted);
            return;
          }
          
          nextNumber++;
          attempts++;
        }
        
        console.error('❌ Nepodarilo sa nájsť voľné číslo objednávky po 10 pokusoch');
        return;
      }
      
      setReservedOrderNumber(orderNumberFormatted);
    } catch (error) {
      console.error('❌ Chyba pri generovaní čísla objednávky:', error);
    } finally {
      setIsGeneratingOrderNumber(false);
    }
  }, [userData?.companyID, isEdit]);

  // Initialize data
  useEffect(() => {
    if (open && userData?.companyID) {
      fetchCustomers();
      fetchCarriers();
      fetchSavedData();
      fetchTeamMembers();
      
      // Generate order number for new orders
      if (!isEdit) {
        generateOrderNumber();
      }
    }
  }, [open, userData?.companyID, isEdit, fetchCustomers, fetchCarriers, fetchSavedData, fetchTeamMembers, generateOrderNumber]);

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
        unloadingPlaces: migratedUnloadingPlaces,
        // Nastavíme číslo objednávky pre editáciu
        orderNumber: (orderData as any).orderNumber || '',
        orderNumberFormatted: (orderData as any).orderNumberFormatted || '',
        orderYear: (orderData as any).orderYear || '',
        orderMonth: (orderData as any).orderMonth || '',
      }));
      
      // Uložíme pôvodné číslo objednávky
      setOriginalOrderNumber((orderData as any).orderNumberFormatted || '');
      
      console.log('✅ Migration applied:', {
        loadingPlaces: migratedLoadingPlaces,
        unloadingPlaces: migratedUnloadingPlaces,
        orderNumber: (orderData as any).orderNumberFormatted
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

  // Načítanie kompletných údajov dopravcu pri editácii objednávky
  useEffect(() => {
    if (isEdit && orderData && orderData.carrierCompany && carriers.length > 0) {
      // Ak objednávka má dopravcu, ale chýbajú detaily (staré objednávky)
      if (!orderData.carrierEmail || !orderData.carrierPhone || !orderData.carrierCountry) {
        // Nájdeme dopravcu v zozname
        const matchingCarrier = carriers.find(c => c.companyName === orderData.carrierCompany);
        
        if (matchingCarrier) {
          console.log('🔄 Doplňujem chýbajúce údaje dopravcu z databázy:', matchingCarrier);
          
          // Vypočítame priemerné hodnotenie dopravcu
          const getCarrierAverageRating = (carrier: Carrier): number => {
            if (!carrier.rating) return 0;
            const { reliability, communication, serviceQuality, timeManagement } = carrier.rating;
            if (reliability === 0 && communication === 0 && serviceQuality === 0 && timeManagement === 0) return 0;
            return Math.round((reliability + communication + serviceQuality + timeManagement) / 4);
          };

          // Doplníme chýbajúce údaje dopravcu
          setFormData(prev => ({
            ...prev,
            carrierEmail: prev.carrierEmail || matchingCarrier.contactEmail || '',
            carrierPhone: prev.carrierPhone || matchingCarrier.contactPhone || '',
            carrierIco: prev.carrierIco || matchingCarrier.ico || '',
            carrierDic: prev.carrierDic || matchingCarrier.dic || '',
            carrierIcDph: prev.carrierIcDph || matchingCarrier.icDph || '',
            carrierStreet: prev.carrierStreet || matchingCarrier.street || '',
            carrierCity: prev.carrierCity || matchingCarrier.city || '',
            carrierZip: prev.carrierZip || matchingCarrier.zip || '',
            carrierCountry: prev.carrierCountry || matchingCarrier.country || 'Slovensko',
            carrierVehicleTypes: prev.carrierVehicleTypes || matchingCarrier.vehicleTypes || [],
            carrierNotes: prev.carrierNotes || matchingCarrier.notes || '',
            carrierRating: prev.carrierRating || getCarrierAverageRating(matchingCarrier),
            carrierContact: prev.carrierContact || `${matchingCarrier.contactName} ${matchingCarrier.contactSurname}`.trim() || '',
          }));
          
          console.log('✅ Údaje dopravcu doplnené');
        }
      }
    }
  }, [isEdit, orderData, carriers]);

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
      // Pridané kompletné polia dopravcu
      carrierEmail: '',
      carrierPhone: '',
      carrierIco: '',
      carrierDic: '',
      carrierIcDph: '',
      carrierStreet: '',
      carrierCity: '',
      carrierZip: '',
      carrierCountry: 'Slovensko',
      carrierVehicleTypes: [],
      carrierNotes: '',
      carrierRating: 0,
      carrierPaymentTermDays: 60,
      // Pridané polia pre číslo objednávky
      orderNumber: '',
      orderNumberFormatted: '',
      orderYear: '',
      orderMonth: '',
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
    // Vypočítame priemerné hodnotenie dopravcu
    const getCarrierAverageRating = (carrier: Carrier): number => {
      if (!carrier.rating) return 0;
      const { reliability, communication, serviceQuality, timeManagement } = carrier.rating;
      if (reliability === 0 && communication === 0 && serviceQuality === 0 && timeManagement === 0) return 0;
      return Math.round((reliability + communication + serviceQuality + timeManagement) / 4);
    };

    setFormData(prev => ({
      ...prev,
      carrierCompany: carrier?.companyName || '',
      carrierContact: carrier ? `${carrier.contactName} ${carrier.contactSurname}`.trim() : '',
      carrierPaymentTermDays: carrier?.paymentTermDays || 60,
      // Pridáme kompletné údaje dopravcu (rovnako ako pri zákazníkovi)
      carrierEmail: carrier?.contactEmail || '',
      carrierPhone: carrier?.contactPhone || '',
      carrierIco: carrier?.ico || '',
      carrierDic: carrier?.dic || '',
      carrierIcDph: carrier?.icDph || '',
      carrierStreet: carrier?.street || '',
      carrierCity: carrier?.city || '',
      carrierZip: carrier?.zip || '',
      carrierCountry: carrier?.country || 'Slovensko',
      carrierVehicleTypes: carrier?.vehicleTypes || [],
      carrierNotes: carrier?.notes || '',
      carrierRating: carrier ? getCarrierAverageRating(carrier) : 0,
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

      // Použijeme rezervované číslo objednávky pre nové objednávky alebo upravené číslo pre edit
      if (!isEdit && reservedOrderNumber) {
        orderNumberFormatted = reservedOrderNumber;
        // Extrahovanie častí z rezervovaného čísla
        orderYear = reservedOrderNumber.substring(0, 4);
        orderMonth = reservedOrderNumber.substring(4, 6);
        orderNumber = reservedOrderNumber.substring(6, 9);
      } else if (isEdit && formData.orderNumberFormatted) {
        // Pre editáciu používame upravené číslo objednávky
        orderNumberFormatted = formData.orderNumberFormatted;
        orderYear = formData.orderNumberFormatted.substring(0, 4);
        orderMonth = formData.orderNumberFormatted.substring(4, 6);
        orderNumber = formData.orderNumberFormatted.substring(6, 9);
        
        console.log('✏️ Používam upravené číslo objednávky:', {
          orderNumberFormatted,
          orderYear,
          orderMonth,
          orderNumber
        });
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
        // Ukladáme číslo objednávky
        ...(isEdit ? {
          // Pre editáciu aktualizujeme len ak sa číslo zmenilo
          ...(formData.orderNumberFormatted && {
            orderNumber,
            orderNumberFormatted,
            orderYear,
            orderMonth,
          })
        } : {
          // Pre nové objednávky vždy nastavíme číslo
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

      // Pre editáciu neresestujeme formulár, len zatvoríme dialog
      if (!isEdit) {
        handleReset();
      }
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
        return (
          <CustomerStep
            formData={formData}
            customerOptions={customerOptions}
            isCustomerLoading={isCustomerLoading}
            handleCustomerChange={handleCustomerChange}
            handleInputChange={handleInputChange}
            setNewCustomerDialog={setNewCustomerDialog}
          />
        );
      case 1:
        return (
          <CargoStep
            formData={formData}
            savedLocations={savedLocations}
            savedGoods={savedGoods}
            expandedLocationCards={expandedLocationCards}
            addLocation={addLocation}
            removeLocation={removeLocation}
            duplicateLocation={duplicateLocation}
            updateLocation={updateLocation}
            toggleLocationCard={toggleLocationCard}
            addGoods={addGoods}
            removeGoods={removeGoods}
            updateGoods={updateGoods}
          />
        );
      case 2:
        return (
          <CarrierStep
            formData={formData}
            carriers={carriers}
            isCarrierLoading={isCarrierLoading}
            teamMembers={teamMembers}
            isEditingDispatcher={isEditingDispatcher}
            isEditingCarrierPaymentTerms={isEditingCarrierPaymentTerms}
            _originalDispatcher={originalDispatcher}
            editedDispatcher={editedDispatcher}
            calculateProfit={calculateProfit}
            handleCarrierChange={handleCarrierChange}
            handleInputChange={handleInputChange}
            setNewCarrierDialog={setNewCarrierDialog}
            handleStartEditDispatcher={handleStartEditDispatcher}
            handleSaveDispatcher={handleSaveDispatcher}
            handleCancelEditDispatcher={handleCancelEditDispatcher}
            handleDispatcherChange={handleDispatcherChange}
            handleStartEditCarrierPaymentTerms={handleStartEditCarrierPaymentTerms}
            handleCarrierPaymentTermsChange={handleCarrierPaymentTermsChange}
            handleCancelEditCarrierPaymentTerms={handleCancelEditCarrierPaymentTerms}
            setIsEditingCarrierPaymentTerms={setIsEditingCarrierPaymentTerms}
          />
        );
      default:
        return null;
    }
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

  // Carrier payment terms editing functions
  const handleStartEditCarrierPaymentTerms = () => {
    setIsEditingCarrierPaymentTerms(true);
  };

  const handleCancelEditCarrierPaymentTerms = () => {
    setIsEditingCarrierPaymentTerms(false);
  };

  const handleCarrierPaymentTermsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value) || 60;
    setFormData(prev => ({
      ...prev,
      carrierPaymentTermDays: value
    }));
  };

  // Order number editing functions
  const handleStartEditOrderNumber = () => {
    if (userData?.role !== 'admin') return;
    setIsEditingOrderNumber(true);
  };

  const handleCancelEditOrderNumber = () => {
    setIsEditingOrderNumber(false);
    // Obnovíme hodnotu v input fieldi
    if (orderNumberInputRef.current) {
      orderNumberInputRef.current.value = originalOrderNumber;
    }
    setFormData(prev => ({
      ...prev,
      orderNumberFormatted: originalOrderNumber
    }));
  };

  const handleOrderNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = event.target.value;
    console.log('🔢 Typing:', { rawValue, length: rawValue.length });
    
    // Len odstránime nečíselné znaky, bez obmedzenia dĺžky
    const numericValue = rawValue.replace(/[^0-9]/g, '');
    event.target.value = numericValue;
    
    console.log('🧮 Final value:', event.target.value, 'Length:', numericValue.length);
  };

  const handleSaveOrderNumber = async () => {
    if (!userData?.companyID) return;
    
    // Získame hodnotu z input ref-u
    const orderNumberValue = orderNumberInputRef.current?.value || '';
    if (!orderNumberValue) return;
    
    try {
              // Skontrolujeme duplicitu
        const duplicateCheckQuery = query(
          collection(db, 'orders'),
          where('companyID', '==', userData.companyID),
          where('orderNumberFormatted', '==', orderNumberValue)
        );
        
        const duplicateSnapshot = await getDocs(duplicateCheckQuery);
        
        // Vylúčime aktuálnu objednávku z kontroly
        const existingDuplicates = duplicateSnapshot.docs.filter(doc => doc.id !== orderData.id);
        
        if (existingDuplicates.length > 0) {
          alert(`Číslo objednávky ${orderNumberValue} už existuje! Zvoľte iné číslo.`);
          return;
        }
        
        // Uložíme do formData
        setFormData(prev => ({
          ...prev,
          orderNumberFormatted: orderNumberValue
        }));
        
        setIsEditingOrderNumber(false);
        console.log('✅ Číslo objednávky zmenené na:', orderNumberValue);
      
    } catch (error) {
      console.error('❌ Chyba pri kontrole čísla objednávky:', error);
      alert('Nastala chyba pri kontrole čísla objednávky');
    }
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
              {/* Spojený riadok s číslom objednávky a špedítérom */}
              {!isEdit ? (
                // Pre nové objednávky - zobrazenie rezervovaného čísla
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
                  ) : open ? (
                    <Typography variant="caption" sx={{ color: '#f44336', fontStyle: 'italic' }}>
                      Chyba pri generovaní
                    </Typography>
                  ) : null}
                </Box>
              ) : (
                // Pre editáciu objednávky - spojený riadok s číslom a špedítérom
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 2, 
                  mt: 1,
                  p: 1,
                  backgroundColor: isDarkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.1)',
                  borderRadius: 1,
                  border: `1px solid ${isDarkMode ? 'rgba(33, 150, 243, 0.3)' : 'rgba(33, 150, 243, 0.3)'}`
                }}>
                  {/* Číslo objednávky sekcia */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon sx={{ fontSize: '1rem', color: '#2196f3' }} />
                    <Typography variant="caption" sx={{ color: isDarkMode ? '#ffffff' : '#000000' }}>
                      Číslo objednávky: 
                    </Typography>
                    {isEditingOrderNumber ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TextField
                          size="small"
                          defaultValue={formData.orderNumberFormatted || ''}
                          inputRef={orderNumberInputRef}
                          onChange={handleOrderNumberChange}
                          sx={{
                            minWidth: 140,
                            width: 140,
                            '& .MuiInputBase-root': {
                              fontSize: '0.8rem',
                              fontFamily: 'monospace'
                            },
                            '& .MuiInputBase-input': {
                              textAlign: 'center',
                              letterSpacing: '1px',
                              padding: '6px 8px'
                            }
                          }}
                          inputProps={{
                            style: { 
                              fontFamily: 'monospace', 
                              fontSize: '0.8rem'
                            }
                          }}
                          placeholder="Číslo objednávky"
                          autoFocus
                        />
                        <BareTooltip title="Uložiť">
                          <IconButton
                            size="small"
                            onClick={handleSaveOrderNumber}
                            sx={{ color: '#4caf50' }}
                          >
                            <CheckIcon sx={{ fontSize: '0.8rem' }} />
                          </IconButton>
                        </BareTooltip>
                        <BareTooltip title="Zrušiť">
                          <IconButton
                            size="small"
                            onClick={handleCancelEditOrderNumber}
                            sx={{ color: '#f44336' }}
                          >
                            <CloseIcon sx={{ fontSize: '0.8rem' }} />
                          </IconButton>
                        </BareTooltip>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ 
                          fontWeight: 600, 
                          color: '#2196f3',
                          fontFamily: 'monospace',
                          fontSize: '0.85rem'
                        }}>
                          {formData.orderNumberFormatted || 'Nezadané'}
                        </Typography>
                        {userData?.role === 'admin' && (
                          <BareTooltip title="Upraviť číslo objednávky">
                            <IconButton
                              size="small"
                              onClick={handleStartEditOrderNumber}
                              sx={{ 
                                color: '#2196f3',
                                '&:hover': { backgroundColor: 'rgba(33, 150, 243, 0.1)' }
                              }}
                            >
                              <EditIcon sx={{ fontSize: '0.7rem' }} />
                            </IconButton>
                          </BareTooltip>
                        )}
                      </Box>
                    )}
                  </Box>

                  {/* Oddelovač */}
                  <Box sx={{ 
                    width: '1px', 
                    height: '24px', 
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)' 
                  }} />

                  {/* Špedíter sekcia */}
                  {originalDispatcher && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                                sx={{ minWidth: 180, width: 180 }}
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
                              <CheckIcon sx={{ fontSize: '0.8rem' }} />
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
                              <CloseIcon sx={{ fontSize: '0.8rem' }} />
                            </IconButton>
                          </BareTooltip>
                        </Box>
                      ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ 
                            fontWeight: 600, 
                            color: '#ff9f43',
                            fontSize: '0.85rem'
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
                                <EditIcon sx={{ fontSize: '0.7rem' }} />
                              </IconButton>
                            </BareTooltip>
                          )}
                        </Box>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Box>
          <IconButton 
            onClick={onClose} 
            aria-label="close"
            sx={{
              color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              borderRadius: '8px',
              padding: '8px',
              margin: '8px',
              marginRight: '12px',
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                color: isDarkMode ? '#ffffff' : '#000000',
                transform: 'scale(1.05)',
              },
              transition: 'all 0.2s ease-in-out',
            }}
          >
            <CloseIcon sx={{ fontSize: '1.2rem' }} />
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

      <DialogHandlers
        newCustomerDialog={newCustomerDialog}
        setNewCustomerDialog={setNewCustomerDialog}
        userData={userData || undefined}
        setCustomerOptions={setCustomerOptions}
        handleCustomerChange={handleCustomerChange}
        newCarrierDialog={newCarrierDialog}
        setNewCarrierDialog={setNewCarrierDialog}
        setCarriers={setCarriers}
        handleCarrierChange={handleCarrierChange}
        showValidationAlert={showValidationAlert}
        setShowValidationAlert={setShowValidationAlert}
        validationErrors={validationErrors}
      />
    </Dialog>
  );
};

export default NewOrderWizard; 