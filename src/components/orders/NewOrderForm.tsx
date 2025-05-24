import React, { useState, ChangeEvent, FormEvent, useEffect, useCallback } from 'react';
import { OrderFormData, LoadingPlace, UnloadingPlace, GoodsItem } from '../../types/orders';
import { Customer } from '../../types/customers';
import { Carrier } from '../../types/carriers';
import { countries } from '../../constants/countries';
import { normalizeVatId } from '../../utils/helpers';
import {
  Box, Typography, TextField, Button, Grid, FormControl, InputLabel,
  Select, MenuItem, useTheme, Checkbox, FormControlLabel,
  Autocomplete, IconButton, Divider, CircularProgress, SelectChangeEvent} from '@mui/material';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker, DatePicker } from '@mui/x-date-pickers';
import { sk } from 'date-fns/locale';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { collection, addDoc, query, where, getDocs, Timestamp, doc, updateDoc, runTransaction, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CustomerDialog from '../dialogs/CustomerDialog';
import CarrierDialog from '../dialogs/CarrierDialog';
import { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import type { FilterOptionsState } from '@mui/material/useAutocomplete';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';

// --- Initial Empty States ---
const emptyGoodsItem: GoodsItem = {
    id: crypto.randomUUID(),
    name: '',
    quantity: 1,
    unit: 'ks',
    palletExchange: 'Bez výmeny',
    dimensions: '',
    description: '',
    adrClass: '',
    referenceNumber: ''
};

const emptyLoadingPlace: LoadingPlace = {
    id: crypto.randomUUID(),
    street: '',
    city: '',
    zip: '',
    country: 'Slovensko',
    dateTime: null,
    contactPerson: '',
    contactPersonName: '',
    contactPersonPhone: '',
    goods: [{ ...emptyGoodsItem }]
};

const emptyUnloadingPlace: UnloadingPlace = {
    id: crypto.randomUUID(),
    street: '',
    city: '',
    zip: '',
    country: 'Slovensko',
    dateTime: null,
    contactPerson: '',
    contactPersonName: '',
    contactPersonPhone: '',
    goods: [{ ...emptyGoodsItem }]
};

interface NewOrderFormProps {
    isModal?: boolean;
    onClose?: () => void;
    isEdit?: boolean;
    orderData?: Partial<OrderFormData>;
}

const NewOrderForm: React.FC<NewOrderFormProps> = ({ isModal = false, onClose, isEdit = false, orderData = {} }) => {
    const theme = useTheme();
    const { userData } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState<Partial<OrderFormData>>({
        datumPrijatia: new Date(),
        zakaznik: '',
        zakaznikData: null,
        kontaktnaOsoba: '',
        suma: '',
        mena: 'EUR',
        vyuctovaniePodlaMnozstva: false,
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
    const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
    const [isCustomerLoading, setIsCustomerLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
    const [isCarrierDialogOpen, setIsCarrierDialogOpen] = useState(false);
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [isCarrierLoading, setIsCarrierLoading] = useState(false);

    // Pridáme funkcie pre načítanie dopravcov
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

    // Pridávam závislosti pre useEffect, ktorý načítava dáta pre editáciu
    useEffect(() => {
        if (isEdit && orderData) {
            console.log('Načítavám dáta pre editáciu', orderData);
            
            // Pre lepšiu kompatibilitu medzi rôznymi formátmi
            const zakaznikValue = (orderData as any).zakaznik || orderData.customerCompany || '';
            const kontaktnaOsobaValue = (orderData as any).kontaktnaOsoba || 
                `${orderData.customerContactName || ''} ${orderData.customerContactSurname || ''}`.trim();
            
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
            
            setFormData(prevData => ({ 
                ...prevData, 
                ...orderData,
                zakaznik: zakaznikValue,
                kontaktnaOsoba: kontaktnaOsobaValue,
                loadingPlaces: migratedLoadingPlaces,
                unloadingPlaces: migratedUnloadingPlaces
            }));
            
            console.log('Nastavené hodnoty po načítaní:', {
                zakaznik: zakaznikValue,
                kontaktnaOsoba: kontaktnaOsobaValue,
                loadingPlaces: migratedLoadingPlaces,
                unloadingPlaces: migratedUnloadingPlaces
            });
        }
    }, [isEdit, orderData]);

    // Pridávam závislosti pre useEffect, ktorý sleduje zmeny zakaznika
    useEffect(() => {
        console.log("Aktuálna hodnota zakaznik:", formData.zakaznik);
    }, [formData.zakaznik]);

    // Pridávam závislosti pre useEffect, ktorý načítava zákazníkov
    useEffect(() => {
        const fetchCustomers = async () => {
            if (!userData?.companyID) {
                console.log("No companyID found, skipping customer fetch");
                return;
            }

            setIsCustomerLoading(true);
            try {
                const customersRef = collection(db, 'customers');
                const q = query(
                    customersRef,
                    where('companyID', '==', userData.companyID)
                );
                
                console.log("Fetching customers for companyID:", userData.companyID);
                
                const querySnapshot = await getDocs(q);
                const customersData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    console.log("Raw customer data:", data);
                    
                    // Normalizácia IČ DPH
                    const vatIdValue = normalizeVatId(data.vatId || data.IČ_DPH || data.ic_dph || '');
                    console.log("Normalized vatId:", vatIdValue);
                    
                    return {
                        id: doc.id,
                        company: data.company || data.companyName || '',
                        street: data.street || '',
                        city: data.city || '',
                        zip: data.zip || '',
                        country: data.country || 'Slovensko',
                        contactName: data.contactName || '',
                        contactSurname: data.contactSurname || '',
                        email: data.email || '',
                        phone: data.phone || '',
                        vatId: vatIdValue,
                        companyID: data.companyID,
                        createdAt: data.createdAt
                    } as Customer;
                });
                
                setCustomerOptions(customersData);
                console.log("Loaded customers:", customersData);
            } catch (error) {
                console.error("Error fetching customers:", error);
            } finally {
                setIsCustomerLoading(false);
            }
        };

        fetchCustomers();
    }, [userData?.companyID]);

    // Pridávam závislosti pre useEffect, ktorý načítava dopravcov
    useEffect(() => {
        fetchCarriers();
    }, [fetchCarriers, userData?.companyID]);

    // --- Handlers ---
    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    const handleDateChange = (name: keyof OrderFormData) => (date: Date | null) => { setFormData(prev => ({ ...prev, [name]: date })); };
    const handleSelectChange = (e: SelectChangeEvent<string>) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); };
    const handleDateTimeChange = (type: 'loading' | 'unloading', index: number) => (date: Date | null) => {
         setFormData(prev => {
            const places = type === 'loading' ? [...(prev.loadingPlaces || [])] : [...(prev.unloadingPlaces || [])];
            if (places[index]) {
                places[index] = { ...places[index], dateTime: date };
            }
            return type === 'loading' ? { ...prev, loadingPlaces: places } : { ...prev, unloadingPlaces: places };
        });
    };
    const handlePlaceInputChange = (type: 'loading' | 'unloading', index: number, field: keyof LoadingPlace | keyof UnloadingPlace) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
         setFormData(prev => {
            const places = type === 'loading' ? [...(prev.loadingPlaces || [])] : [...(prev.unloadingPlaces || [])];
            if (places[index]) {
                places[index] = { ...places[index], [field]: e.target.value };
            }
            return type === 'loading' ? { ...prev, loadingPlaces: places } : { ...prev, unloadingPlaces: places };
        });
    };
     const handlePlaceAutocompleteChange = (type: 'loading' | 'unloading', index: number, field: keyof LoadingPlace | keyof UnloadingPlace) => (event: any, newValue: { name: string, code: string } | null) => {
        setFormData(prev => {
            const places = type === 'loading' ? [...(prev.loadingPlaces || [])] : [...(prev.unloadingPlaces || [])];
            if (places[index]) {
                places[index] = { ...places[index], [field]: newValue?.name || 'Slovensko' }; // Default to Slovensko if null
            }
            return type === 'loading' ? { ...prev, loadingPlaces: places } : { ...prev, unloadingPlaces: places };
        });
    };
     const handleGoodsChange = (type: 'loading' | 'unloading', placeIndex: number, goodsIndex: number, field: keyof GoodsItem) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
        const value = e.target.value;
         setFormData(prev => {
            const places = type === 'loading' ? [...(prev.loadingPlaces || [])] : [...(prev.unloadingPlaces || [])];
            const place = places[placeIndex];
            if (place?.goods?.[goodsIndex]) {
                 place.goods[goodsIndex] = { ...place.goods[goodsIndex], [field]: value };
            }
            return type === 'loading' ? { ...prev, loadingPlaces: places } : { ...prev, unloadingPlaces: places };
        });
    };

    const addPlace = (type: 'loading' | 'unloading') => {
        setFormData(prev => {
            const newPlace = type === 'loading' ? { ...emptyLoadingPlace, id: crypto.randomUUID(), goods: [{...emptyGoodsItem, id: crypto.randomUUID()}] } : { ...emptyUnloadingPlace, id: crypto.randomUUID(), goods: [{...emptyGoodsItem, id: crypto.randomUUID()}] };
            return type === 'loading'
                ? { ...prev, loadingPlaces: [...(prev.loadingPlaces || []), newPlace] }
                : { ...prev, unloadingPlaces: [...(prev.unloadingPlaces || []), newPlace] };
        });
    };
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _removePlace = (type: 'loading' | 'unloading', index: number) => {
        setFormData(prev => {
            const places = type === 'loading' ? [...(prev.loadingPlaces || [])] : [...(prev.unloadingPlaces || [])];
            if (places.length > 1) { // Prevent removing the last place
                 const updatedPlaces = places.filter((_, i) => i !== index);
                 return type === 'loading' ? { ...prev, loadingPlaces: updatedPlaces } : { ...prev, unloadingPlaces: updatedPlaces };
            }
            return prev;
        });
    };
     const addGoodsItem = (type: 'loading' | 'unloading', placeIndex: number) => {
         setFormData(prev => {
            const places = type === 'loading' ? [...(prev.loadingPlaces || [])] : [...(prev.unloadingPlaces || [])];
            if (places[placeIndex]) {
                places[placeIndex] = { ...places[placeIndex], goods: [...(places[placeIndex].goods || []), { ...emptyGoodsItem, id: crypto.randomUUID() }] };
            }
            return type === 'loading' ? { ...prev, loadingPlaces: places } : { ...prev, unloadingPlaces: places };
        });
    };
     const removeGoodsItem = (type: 'loading' | 'unloading', placeIndex: number, goodsIndex: number) => {
        setFormData(prev => {
            const places = type === 'loading' ? [...(prev.loadingPlaces || [])] : [...(prev.unloadingPlaces || [])];
            const place = places[placeIndex];
            if (place?.goods && place.goods.length > 1) {
                 place.goods = place.goods.filter((_, i) => i !== goodsIndex);
            }
             return type === 'loading' ? { ...prev, loadingPlaces: places } : { ...prev, unloadingPlaces: places };
        });
    };

    const handleCustomerAutocompleteChange = (event: any, newValue: Customer | null) => {
        if (!newValue) {
            setFormData(prev => ({
                ...prev,
                zakaznik: '',
                zakaznikData: null,
                kontaktnaOsoba: '',
                customerCompany: '',
                customerVatId: '',
                customerStreet: '',
                customerCity: '',
                customerZip: '',
                customerCountry: '',
                customerContactName: '',
                customerContactSurname: '',
                customerEmail: '',
                customerPhone: ''
            }));
            return;
        }

        console.log("Selected customer data:", newValue); // Pre debugovanie

        const updatedData = {
            ...formData,
            zakaznik: newValue.company,
            zakaznikData: newValue,
            kontaktnaOsoba: `${newValue.contactName || ''} ${newValue.contactSurname || ''}`.trim(),
            customerCompany: newValue.company,
            customerVatId: newValue.vatId || '',
            customerStreet: newValue.street || '',
            customerCity: newValue.city || '',
            customerZip: newValue.zip || '',
            customerCountry: newValue.country || 'Slovensko',
            customerContactName: newValue.contactName || '',
            customerContactSurname: newValue.contactSurname || '',
            customerEmail: newValue.email || '',
            customerPhone: newValue.phone || ''
        };

        console.log("Updated form data:", updatedData); // Pre debugovanie
        setFormData(updatedData);
    };

    // Generovanie čísla objednávky vo formáte 0001/01/2025
    const generateOrderNumber = async () => {
        try {
            const today = new Date();
            const month = String(today.getMonth() + 1).padStart(2, '0'); // 01-12
            const year = today.getFullYear();
            
            console.log(`Generujem číslo objednávky pre mesiac: ${month}, rok: ${year}`);
            
            // Vytvoríme referenciu na dokument počítadla pre aktuálny mesiac a rok
            const counterDocRef = doc(db, 'counters', `orders_${userData?.companyID}_${year}_${month}`);
            
            // Použijeme transakciu na bezpečné atomické zvýšenie počítadla - aj keď
            // dvaja špediteri súčasne vytvárajú objednávky, dostanú rozdielne čísla
            return await runTransaction(db, async (transaction) => {
                // Načítame aktuálny stav počítadla
                const counterDoc = await transaction.get(counterDocRef);
                
                // Určenie ďalšieho čísla
                let nextNumber = 1;
                if (counterDoc.exists()) {
                    // Ak počítadlo už existuje, zvýšime hodnotu
                    nextNumber = (counterDoc.data().currentValue || 0) + 1;
                }
                
                // Aktualizujeme počítadlo atomicky v rámci transakcie
                transaction.set(counterDocRef, {
                    currentValue: nextNumber,
                    companyID: userData?.companyID,
                    month,
                    year,
                    lastUpdated: Timestamp.now()
                });
                
                // Formátujeme číslo s vedúcimi nulami
                const orderNumber = nextNumber.toString().padStart(4, '0');
                const orderNumberFormatted = `${orderNumber}/${month}/${year}`;
                
                console.log(`Vygenerované číslo objednávky: ${orderNumberFormatted}`);
                
                return {
                    formattedNumber: orderNumberFormatted,
                    orderNumber: orderNumber,
                    orderMonth: month,
                    orderYear: year.toString()
                };
            });
        } catch (error) {
            console.error("Chyba pri generovaní čísla objednávky:", error);
            alert("Nastala chyba pri generovaní čísla objednávky. Skúste to znova.");
            return null;
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!userData?.companyID) { alert("Chyba: Chýba ID spoločnosti."); return; }
        setIsSubmitting(true);
        
        console.log("Hodnota poľa zakaznik pred uložením:", formData.zakaznik);
        console.log("Údaje formulára pred odoslaním:", formData);
        console.log("Zákazník:", formData.zakaznik, "Suma:", formData.suma, "Kontaktná osoba:", formData.kontaktnaOsoba);
        
        try {
            // Rozdelíme kontaktnú osobu na meno a priezvisko
            let kontaktMeno = '';
            let kontaktPriezvisko = '';
            if (formData.kontaktnaOsoba) {
                const casti = formData.kontaktnaOsoba.trim().split(' ');
                if (casti.length >= 1) {
                    kontaktMeno = casti[0];
                    kontaktPriezvisko = casti.slice(1).join(' ');
                }
            }
            
            // Explicitne zabezpečiť, že máme hodnotu pre zákazníka
            const zakaznikHodnota = formData.zakaznik || '';
            
            // Ak nejde o editáciu, vygenerujeme nové číslo objednávky
            let orderNumberData = null;
            if (!isEdit) {
                orderNumberData = await generateOrderNumber();
            }
            
            // Najdeme hodnotu pre createdByName, ktorá sa bude ukladať
            let createdByName = '';

            // 1. Najprv skúsime firstName + lastName z userData
            if ((userData as any).firstName || (userData as any).lastName) {
              createdByName = `${(userData as any).firstName || ''} ${(userData as any).lastName || ''}`.trim();
            }

            // 2. Ak to nefunguje, skúsime displayName
            if (!createdByName && (userData as any).displayName) {
              createdByName = (userData as any).displayName;
            }

            // 3. Ak nie je firstName+lastName ani displayName, použijeme email
            if (!createdByName && userData?.email) {
              createdByName = userData.email;
            }

            // Použijeme vygenerované meno alebo email
            const createdByNameToSave = createdByName || userData?.email || 'Neznámy používateľ';
            
            const orderDataToSave = {
                ...formData,
                companyID: userData.companyID,
                createdBy: userData.uid, 
                createdByName: createdByNameToSave,
                createdAt: isEdit ? orderData?.createdAt : Timestamp.now(),
                updatedAt: Timestamp.now(), // Pridáme informáciu o aktualizácii
                datumPrijatia: formData.datumPrijatia ? Timestamp.fromDate(formData.datumPrijatia as Date) : Timestamp.now(),
                loadingPlaces: formData.loadingPlaces?.map(p => ({...p, dateTime: p.dateTime ? Timestamp.fromDate(p.dateTime as Date) : null })),
                unloadingPlaces: formData.unloadingPlaces?.map(p => ({...p, dateTime: p.dateTime ? Timestamp.fromDate(p.dateTime as Date) : null })),
                
                // Zabezpečíme, aby sa údaje uložili do oboch typov polí
                zakaznik: zakaznikHodnota,
                customerCompany: zakaznikHodnota,
                customerPrice: formData.suma || '',
                suma: formData.suma || '',
                customerContactName: kontaktMeno,
                customerContactSurname: kontaktPriezvisko,
                kontaktnaOsoba: formData.kontaktnaOsoba || '',
                
                // Pridáme číslo objednávky, ak ide o novú objednávku
                ...(orderNumberData && {
                    orderNumberFormatted: orderNumberData.formattedNumber,
                    orderNumber: orderNumberData.orderNumber,
                    orderMonth: orderNumberData.orderMonth,
                    orderYear: orderNumberData.orderYear
                })
            };
            
            // Safely copy the object without zakaznikData
            const finalOrder = { ...orderDataToSave };
            delete (finalOrder as any).zakaznikData;
            
            console.log("Finálne dáta odosielané do Firebase:", finalOrder);
            console.log("Zákazník vo finálnych dátach:", finalOrder.zakaznik, finalOrder.customerCompany);
            console.log("Kontaktná osoba rozdelená:", kontaktMeno, kontaktPriezvisko);

            if (isEdit && orderData?.id) {
                // Editácia existujúcej objednávky
                const orderRef = doc(db, 'orders', orderData.id);
                await updateDoc(orderRef, {
                    ...finalOrder,
                    companyID: userData?.companyID || '',
                    createdBy: (orderData as any)?.createdBy || userData?.uid || '',
                    createdByName: (orderData as any)?.createdByName || createdByNameToSave,
                    updatedBy: userData?.uid || '',
                    updatedAt: Timestamp.now(),
                });
                alert('Objednávka úspešne aktualizovaná!');
            } else {
                // Vytvorenie novej objednávky
                const docRef = await addDoc(collection(db, 'orders'), {
                    ...finalOrder,
                    companyID: userData?.companyID || '',
                    createdBy: userData?.uid || '',
                    createdByName: createdByNameToSave,
                    createdAt: Timestamp.now(),
                });
                alert('Objednávka úspešne vytvorená!');

                // Generovanie PDF po uložení objednávky
                generatePDF({...finalOrder, id: docRef.id} as any);
            }
            
            // Ak je v modálnom režime, zavrieme modálny dialóg
            if (isModal && onClose) {
                onClose();
            } else {
                // Inak navigujeme na zoznam objednávok
                navigate('/orders');
            }

        } catch (error) {
            console.error("Chyba pri ukladaní objednávky:", error);
            alert('Nastala chyba pri ukladaní objednávky.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Funkcia na generovanie PDF
    const generatePDF = async (orderData: OrderFormData & { id: string }) => {
        try {
            setIsSubmitting(true);
            
            // Volanie serverovej funkcie pre generovanie PDF
            const generatePdf = httpsCallable(functions, 'generateOrderPdf');
            const result = await generatePdf({ orderId: orderData.id });
            
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
            link.download = fileName || `objednavka_${orderData.id.substring(0, 8)}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            setIsSubmitting(false);
        } catch (error) {
            console.error('Chyba pri generovaní PDF:', error);
            alert('Nastala chyba pri generovaní PDF objednávky: ' + (error as Error).message);
            setIsSubmitting(false);
        }
    };

    // Pridáme handleCarrierAutocompleteChange
    const handleCarrierAutocompleteChange = (event: any, newValue: Carrier | null) => {
        if (!newValue) {
            setFormData(prev => ({
                ...prev,
                carrierCompany: '',
                carrierContact: '',
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            carrierCompany: newValue.companyName,
            carrierContact: `${newValue.contactName || ''} ${newValue.contactSurname || ''} ${newValue.contactPhone || ''}`.trim(),
        }));
    };

    // Pridáme handleAddNewCustomer a handleAddNewCarrier
    const handleAddNewCustomer = () => {
        setIsCustomerDialogOpen(true);
    };

    const handleAddNewCarrier = () => {
        setIsCarrierDialogOpen(true);
    };

    const handleCustomerSubmit = async (customerData: Customer) => {
        if (!userData?.companyID) {
            alert('Chyba: Chýba ID spoločnosti');
            return;
        }

        try {
            const docRef = await addDoc(collection(db, 'customers'), {
                ...customerData,
                companyID: userData.companyID,
                createdAt: Timestamp.now()
            });
            
            const newCustomer = {
                id: docRef.id,
                ...customerData
            };
            
            setCustomerOptions((prev: Customer[]) => [...prev, newCustomer]);
            handleCustomerAutocompleteChange(null, newCustomer);
            setIsCustomerDialogOpen(false);
        } catch (error) {
            console.error('Chyba pri pridávaní zákazníka:', error);
            alert('Nepodarilo sa pridať zákazníka');
        }
    };

    const handleCarrierSubmit = async (carrierData: Carrier) => {
        if (!userData?.companyID) {
            alert('Chyba: Chýba ID spoločnosti');
            return;
        }

        try {
            const docRef = await addDoc(collection(db, 'carriers'), {
                ...carrierData,
                companyID: userData.companyID,
                createdAt: Timestamp.now()
            });
            
            const newCarrier = {
                id: docRef.id,
                ...carrierData
            };
            
            setCarriers((prev: Carrier[]) => [...prev, newCarrier]);
            handleCarrierAutocompleteChange(null, newCarrier);
            setIsCarrierDialogOpen(false);
        } catch (error) {
            console.error('Chyba pri pridávaní dopravcu:', error);
            alert('Nepodarilo sa pridať dopravcu');
        }
    };

    return (
        <Box 
            sx={{ 
                p: isModal ? 0 : 2, // Padding pre ne-modálny režim
                height: '100%', // Formulár zaberie výšku kontajnera
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden' // Aby sa formulár nezväčšoval donekonečna
            }}
        >
            <Box 
                component="form" 
                onSubmit={handleSubmit} 
                sx={{ 
                    flexGrow: 1, // Aby obsah zabral dostupný priestor
                    overflowY: 'auto', // Pridáme scrollbar, ak je obsah príliš dlhý
                    p: 3, // Vnútorný padding obsahu formulára
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                }}
            >
                <Grid container spacing={3} sx={{ flexGrow: 1 }}> {/* Grid zaberie dostupný priestor */}
                    {/* Základné údaje */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                            Základné údaje
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                            <DatePicker label="Dátum prijatia *" value={formData.datumPrijatia} onChange={handleDateChange('datumPrijatia')} slotProps={{ textField: { fullWidth: true, required: true } }} />
                        </LocalizationProvider>
                    </Grid>

                    {/* Údaje zákazníka */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                            Údaje zákazníka
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Autocomplete
                            options={customerOptions}
                            getOptionLabel={(option) => option.company}
                            value={formData.zakaznikData}
                            onChange={handleCustomerAutocompleteChange}
                            loading={isCustomerLoading}
                            filterOptions={(options: Customer[], state: FilterOptionsState<Customer>): Customer[] => {
                                const inputValue = state.inputValue.toLowerCase();
                                return options.filter(option => {
                                    const company = option.company?.toLowerCase() || '';
                                    const contactName = option.contactName?.toLowerCase() || '';
                                    const contactSurname = option.contactSurname?.toLowerCase() || '';
                                    const email = option.email?.toLowerCase() || '';
                                    const vatId = option.vatId?.toLowerCase() || '';
                                    
                                    return company.includes(inputValue) ||
                                        contactName.includes(inputValue) ||
                                        contactSurname.includes(inputValue) ||
                                        email.includes(inputValue) ||
                                        vatId.includes(inputValue);
                                });
                            }}
                            renderInput={(params: AutocompleteRenderInputParams) => (
                                <TextField
                                    {...params}
                                    label="Zákazník *"
                                    required
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {isCustomerLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                <IconButton
                                                    size="small"
                                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                        e.stopPropagation();
                                                        handleAddNewCustomer();
                                                    }}
                                                    sx={{ mr: 1 }}
                                                >
                                                    <AddIcon />
                                                </IconButton>
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Kontaktná osoba" name="kontaktnaOsoba" value={formData.kontaktnaOsoba || ''} onChange={handleInputChange} />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField 
                            fullWidth 
                            label="IČ DPH" 
                            name="customerVatId" 
                            value={formData.customerVatId || ''} 
                            onChange={handleInputChange}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField 
                            fullWidth 
                            label="Ulica" 
                            name="customerStreet" 
                            value={formData.customerStreet || ''} 
                            onChange={handleInputChange} 
                        />
                    </Grid>
                
                    {/* Cena */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                            Cena
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}><TextField fullWidth label="Suma *" name="suma" type="number" value={formData.suma || ''} onChange={handleInputChange} required inputProps={{ min: 0, step: "0.01" }} /></Grid>
                    <Grid item xs={6} sm={3}><FormControl fullWidth required><InputLabel>Mena *</InputLabel><Select name="mena" value={formData.mena || 'EUR'} label="Mena *" onChange={handleSelectChange}><MenuItem value="EUR">EUR</MenuItem><MenuItem value="CZK">CZK</MenuItem></Select></FormControl></Grid>
                    <Grid item xs={6} sm={5}><FormControlLabel control={<Checkbox name="vyuctovaniePodlaMnozstva" checked={formData.vyuctovaniePodlaMnozstva || false} onChange={handleInputChange} />} label="Vyúčtovanie podľa množstva" /></Grid>
                
                    {/* Náklad */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                            Náklad
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Číslo nákladu zákazníka"
                            name="cisloNakladuZakaznika"
                            value={formData.cisloNakladuZakaznika || ''}
                            onChange={handleInputChange}
                            placeholder="Referenčné číslo zákazníka"
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            label="Interná poznámka"
                            name="internaPoznamka"
                            value={formData.internaPoznamka || ''}
                            onChange={handleInputChange}
                            multiline
                            rows={2}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth>
                            <InputLabel id="navesLabel">Vyžaduje sa typ návesu</InputLabel>
                            <Select
                                labelId="navesLabel"
                                name="vyzadujeSaTypNavesu"
                                value={formData.vyzadujeSaTypNavesu || ''}
                                label="Vyžaduje sa typ návesu"
                                onChange={handleSelectChange}
                            >
                                <MenuItem value=""><em>Žiadny</em></MenuItem>
                                <MenuItem value="plachta">Plachta</MenuItem>
                                <MenuItem value="skriňa">Skriňa</MenuItem>
                                <MenuItem value="chladiak">Chladiarenský</MenuItem>
                                <MenuItem value="mraziak">Mraziarenský</MenuItem>
                                <MenuItem value="specialny">Špeciálny</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            label="Požiadavky"
                            name="poziadavky"
                            placeholder="Napr. GPS, Pásy, ADR..."
                            value={formData.poziadavky || ''}
                            onChange={handleInputChange}
                        />
                    </Grid>

                    {/* Body Nakládky */}
                    <Grid item xs={12}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 1 }}>
                            <Typography variant="subtitle1" sx={{ color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                                Body Nakládky
                            </Typography>
                            <Button 
                                variant="outlined"
                                startIcon={<AddIcon />} 
                                onClick={() => addPlace('loading')} 
                                sx={{ 
                                     borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 159, 67, 0.5)' : '#ff9f43',
                                     color: '#ff9f43', 
                                     '&:hover': {
                                         borderColor: '#ff9f43',
                                         backgroundColor: 'rgba(255, 159, 67, 0.08)'
                                     }
                                }}
                            >
                                Pridať Nakládku
                            </Button>
                        </Box>
                    </Grid>
                    {formData.loadingPlaces?.map((place, index) => (
                        <Grid item xs={12} key={place.id || index}>
                           <Box sx={{ p: 2, mb: 1, position: 'relative' }}>
                                <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}> Nakládka #{index + 1} </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}><TextField fullWidth label="Ulica a číslo *" value={place.street} onChange={handlePlaceInputChange('loading', index, 'street')} required /></Grid>
                                    <Grid item xs={6} sm={3}><TextField fullWidth label="Mesto *" value={place.city} onChange={handlePlaceInputChange('loading', index, 'city')} required /></Grid>
                                    <Grid item xs={6} sm={3}><TextField fullWidth label="PSČ *" value={place.zip} onChange={handlePlaceInputChange('loading', index, 'zip')} required /></Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Autocomplete options={countries} getOptionLabel={(o) => o.name} value={countries.find(c=>c.name === place.country) || null} onChange={handlePlaceAutocompleteChange('loading', index, 'country')} renderInput={(params) => <TextField {...params} label="Krajina *" required />} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                                            <DateTimePicker label="Dátum a čas nakládky *" value={place.dateTime as Date | null} onChange={handleDateTimeChange('loading', index)} slotProps={{ textField: { fullWidth: true, required: true }}}/>
                                        </LocalizationProvider>
                                    </Grid>
                                    <Grid item xs={12} sm={6}><TextField fullWidth label="Meno kontaktnej osoby *" value={place.contactPersonName} onChange={handlePlaceInputChange('loading', index, 'contactPersonName')} required /></Grid>
                                    <Grid item xs={12} sm={6}><TextField fullWidth label="Telefón kontaktnej osoby *" value={place.contactPersonPhone} onChange={handlePlaceInputChange('loading', index, 'contactPersonPhone')} required placeholder="+421 XXX XXX XXX" /></Grid>
                                </Grid>
                                 {/* Goods Items Section */}
                                <Box sx={{ mt: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 500, color: theme.palette.text.secondary }}>Tovar na naloženie:</Typography>
                                        <Button 
                                            variant="text"
                                            startIcon={<AddIcon />} 
                                            onClick={() => addGoodsItem('loading', index)}
                                            sx={{ color: '#ff9f43' }}
                                        >
                                            Pridať tovar
                                        </Button>
                                    </Box>
                                    
                                    {place.goods?.map((item, goodsIndex) => (
                                        <Box 
                                            key={item.id || goodsIndex}
                                            sx={{ mb: 2, pt: 1, position: 'relative' }} 
                                        >
                                            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}> 
                                                Tovar #{goodsIndex + 1}
                                                {place.goods && place.goods.length > 1 && (
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => removeGoodsItem('loading', index, goodsIndex)} 
                                                        color="error"
                                                        sx={{ position: 'absolute', top: 0, right: 0 }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </Typography>
                                            
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}><TextField label="Názov tovaru *" value={item.name} onChange={handleGoodsChange('loading', index, goodsIndex, 'name')} required fullWidth/></Grid>
                                                <Grid item xs={6} sm={3}><TextField label="Množstvo *" type="number" value={item.quantity} onChange={handleGoodsChange('loading', index, goodsIndex, 'quantity')} required inputProps={{min: 0, step: 1}} fullWidth/></Grid>
                                                <Grid item xs={6} sm={3}><FormControl fullWidth><InputLabel>Jednotka *</InputLabel><Select value={item.unit} label="Jednotka *" onChange={handleGoodsChange('loading', index, goodsIndex, 'unit')} required><MenuItem value="ks">ks</MenuItem><MenuItem value="pal">pal</MenuItem><MenuItem value="kg">kg</MenuItem></Select></FormControl></Grid>
                                                <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Výmena paliet</InputLabel><Select value={item.palletExchange} label="Výmena paliet" onChange={handleGoodsChange('loading', index, goodsIndex, 'palletExchange')}><MenuItem value="Bez výmeny">Bez výmeny</MenuItem><MenuItem value="Výmena">Výmena</MenuItem></Select></FormControl></Grid>
                                                <Grid item xs={12} sm={6}><TextField label="Rozmer" value={item.dimensions} onChange={handleGoodsChange('loading', index, goodsIndex, 'dimensions')} fullWidth/></Grid>
                                                <Grid item xs={12}><TextField label="Popis tovaru" value={item.description} onChange={handleGoodsChange('loading', index, goodsIndex, 'description')} fullWidth/></Grid>
                                            </Grid>
                                            {place.goods && goodsIndex < place.goods.length - 1 && (
                                                 <Divider sx={{ my: 2 }} />
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Grid>
                    ))}

                     {/* Body Vykládky */}
                     <Grid item xs={12}>
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 1 }}>
                             <Typography variant="subtitle1" sx={{ color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                                 Body Vykládky
                             </Typography>
                             <Button 
                                 variant="outlined"
                                 startIcon={<AddIcon />} 
                                 onClick={() => addPlace('unloading')} 
                                 sx={{ 
                                     borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 159, 67, 0.5)' : '#ff9f43',
                                     color: '#ff9f43', 
                                     '&:hover': {
                                         borderColor: '#ff9f43',
                                         backgroundColor: 'rgba(255, 159, 67, 0.08)'
                                     }
                                 }}
                             >
                                 Pridať Vykládku
                             </Button>
                         </Box>
                     </Grid>
                    {formData.unloadingPlaces?.map((place, index) => (
                        <Grid item xs={12} key={place.id || index}>
                            <Box sx={{ p: 2, mb: 1, position: 'relative' }}>
                                <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}> Vykládka #{index + 1} </Typography>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}><TextField fullWidth label="Ulica a číslo *" value={place.street} onChange={handlePlaceInputChange('unloading', index, 'street')} required /></Grid>
                                    <Grid item xs={6} sm={3}><TextField fullWidth label="Mesto *" value={place.city} onChange={handlePlaceInputChange('unloading', index, 'city')} required /></Grid>
                                    <Grid item xs={6} sm={3}><TextField fullWidth label="PSČ *" value={place.zip} onChange={handlePlaceInputChange('unloading', index, 'zip')} required /></Grid>
                                    <Grid item xs={12} sm={6}><Autocomplete options={countries} getOptionLabel={(o) => o.name} value={countries.find(c=>c.name === place.country) || null} onChange={handlePlaceAutocompleteChange('unloading', index, 'country')} renderInput={(params) => <TextField {...params} label="Krajina *" required />} /></Grid>
                                    <Grid item xs={12} sm={6}><LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}><DateTimePicker label="Dátum a čas vykládky *" value={place.dateTime as Date | null} onChange={handleDateTimeChange('unloading', index)} slotProps={{ textField: { fullWidth: true, required: true } }}/></LocalizationProvider></Grid>
                                    <Grid item xs={12} sm={6}><TextField fullWidth label="Meno kontaktnej osoby *" value={place.contactPersonName} onChange={handlePlaceInputChange('unloading', index, 'contactPersonName')} required /></Grid>
                                    <Grid item xs={12} sm={6}><TextField fullWidth label="Telefón kontaktnej osoby *" value={place.contactPersonPhone} onChange={handlePlaceInputChange('unloading', index, 'contactPersonPhone')} required placeholder="+421 XXX XXX XXX" /></Grid>
                                </Grid>
                                 {/* Goods Items Section */} 
                                 <Box sx={{ mt: 2 }}>
                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                         <Typography variant="subtitle2" sx={{ fontWeight: 500, color: theme.palette.text.secondary }}>Tovar na vyloženie:</Typography>
                                         <Button 
                                             variant="text"
                                             startIcon={<AddIcon />} 
                                             onClick={() => addGoodsItem('unloading', index)}
                                             sx={{ color: '#ff9f43' }}
                                         >
                                             Pridať tovar
                                         </Button>
                                     </Box>
                                     {place.goods?.map((item, goodsIndex) => (
                                         <Box 
                                             key={item.id || goodsIndex}
                                             sx={{ mb: 2, pt: 1, position: 'relative' }}
                                         >
                                             <Typography variant="caption" sx={{ mb: 1, display: 'block' }}> 
                                                 Tovar #{goodsIndex + 1}
                                                 {place.goods && place.goods.length > 1 && (
                                                     <IconButton 
                                                         size="small" 
                                                         onClick={() => removeGoodsItem('unloading', index, goodsIndex)} 
                                                         color="error"
                                                         sx={{ position: 'absolute', top: 0, right: 0 }}
                                                     >
                                                         <DeleteIcon fontSize="small" />
                                                     </IconButton>
                                                 )}
                                             </Typography>
                                             
                                             <Grid container spacing={2}>
                                                 <Grid item xs={12} sm={6}><TextField label="Názov tovaru *" value={item.name} onChange={handleGoodsChange('unloading', index, goodsIndex, 'name')} required fullWidth/></Grid>
                                                 <Grid item xs={6} sm={3}><TextField label="Množstvo *" type="number" value={item.quantity} onChange={handleGoodsChange('unloading', index, goodsIndex, 'quantity')} required inputProps={{min: 0, step: 1}} fullWidth/></Grid>
                                                 <Grid item xs={6} sm={3}><FormControl fullWidth><InputLabel>Jednotka *</InputLabel><Select value={item.unit} label="Jednotka *" onChange={handleGoodsChange('unloading', index, goodsIndex, 'unit')} required><MenuItem value="ks">ks</MenuItem><MenuItem value="pal">pal</MenuItem><MenuItem value="kg">kg</MenuItem></Select></FormControl></Grid>
                                                 <Grid item xs={12}><TextField label="Popis tovaru" value={item.description} onChange={handleGoodsChange('unloading', index, goodsIndex, 'description')} fullWidth/></Grid>
                                             </Grid>
                                             {place.goods && goodsIndex < place.goods.length - 1 && (
                                                 <Divider sx={{ my: 2 }} />
                                             )}
                                         </Box>
                                     ))}
                                 </Box>
                             </Box>
                         </Grid>
                     ))}

                    {/* Dopravca */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                            Dopravca (Vykonávateľ)
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Autocomplete
                            options={carriers}
                            getOptionLabel={(option) => option.companyName}
                            value={carriers.find(c => c.companyName === formData.carrierCompany) || null}
                            onChange={handleCarrierAutocompleteChange}
                            loading={isCarrierLoading}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Názov firmy dopravcu"
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {isCarrierLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                                <IconButton
                                                    size="small"
                                                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                        e.stopPropagation();
                                                        handleAddNewCarrier();
                                                    }}
                                                    sx={{ mr: 1 }}
                                                >
                                                    <AddIcon />
                                                </IconButton>
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}><TextField fullWidth label="Kontakt na dopravcu" name="carrierContact" value={formData.carrierContact || ''} onChange={handleInputChange} /></Grid>
                    <Grid item xs={12} sm={6}><TextField fullWidth label="EČV Vozidla" name="carrierVehicleReg" value={formData.carrierVehicleReg || ''} onChange={handleInputChange} /></Grid>
                    <Grid item xs={12} sm={6}><TextField fullWidth label="Cena za prepravu (€)" name="carrierPrice" type="number" value={formData.carrierPrice || ''} onChange={handleInputChange} inputProps={{ min: 0, step: "0.01" }}/></Grid>
                </Grid>
            </Box>
            
            {/* Tlačidlá na spodku formulára */}
            <Box sx={{ 
                p: 3, 
                borderTop: '1px solid', 
                borderColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.1)', 
                display: 'flex',
                justifyContent: 'flex-end',
            }}>
                <Button 
                  onClick={onClose} 
                  sx={{ 
                    mr: 1,
                    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)'
                  }}
                >
                  Zrušiť
                </Button>
                <Button 
                  type="submit" 
                  variant="contained" 
                  disabled={isSubmitting}
                  sx={{ 
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 159, 67, 0.8)' : '#ff9f43', 
                    color: '#ffffff',
                    '&:hover': { 
                      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 159, 67, 0.9)' : '#f7b067', 
                    } 
                  }}
                >
                  {isSubmitting ? 
                    <CircularProgress size={24} sx={{ color: '#ffffff' }} /> : 
                    isEdit ? 'Uložiť zmeny' : 'Vytvoriť objednávku'
                  }
                </Button>
            </Box>

            {/* Pridáme dialógy */}
            <CustomerDialog
                open={isCustomerDialogOpen}
                onClose={() => setIsCustomerDialogOpen(false)}
                onSubmit={handleCustomerSubmit}
            />
            
            <CarrierDialog
                open={isCarrierDialogOpen}
                onClose={() => setIsCarrierDialogOpen(false)}
                onSubmit={handleCarrierSubmit}
            />
        </Box>
    );
};

// Pridáme nové rozhrania - s podčiarkovníkom pre ESLint ignorovanie
// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _CustomerDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (customerData: Customer) => void;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _CarrierDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (carrierData: Carrier) => void;
}

export default NewOrderForm;