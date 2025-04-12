import React, { useState, ChangeEvent, FormEvent, useEffect, useCallback } from 'react';
import { OrderFormData as BaseOrderFormData, Customer, LoadingPlace, UnloadingPlace, GoodsItem } from '../types/orders'; // Adjust path if necessary
import { countries } from '../constants/countries'; // Adjust path if necessary
import {
  Box, Typography, TextField, Button, Paper, Grid, FormControl, InputLabel,
  Select, MenuItem, SelectChangeEvent, useTheme, Checkbox, FormControlLabel,
  Autocomplete, IconButton, Divider, Tooltip, CircularProgress, GlobalStyles
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useThemeMode } from '../contexts/ThemeContext';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker, DatePicker } from '@mui/x-date-pickers';
import { sk } from 'date-fns/locale';
import { Theme } from '@mui/material/styles';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add'; // For Add Goods button
import DeleteIcon from '@mui/icons-material/Delete'; // For Remove Goods/Place button
import { collection, addDoc, query, where, getDocs, Timestamp, doc, updateDoc, orderBy, limit, runTransaction } from 'firebase/firestore';
import { db } from '../firebase'; // Adjust path if necessary
import { useAuth } from '../contexts/AuthContext'; // Adjust path if necessary
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import CloseIcon from '@mui/icons-material/Close';

// --- Interfaces (Ensure they match your types/orders.ts) ---
interface OrderFormData extends BaseOrderFormData {
    id?: string;
    createdAt?: Timestamp | Date;
    datumPrijatia?: Date | null;
    zakaznik?: string;
    zakaznikData?: Customer | null;
    kontaktnaOsoba?: string;
    suma?: string;
    mena?: string;
    vyuctovaniePodlaMnozstva?: boolean;
    cisloNakladuZakaznika?: string;
    internaPoznamka?: string;
    vyzadujeSaTypNavesu?: string;
    poziadavky?: string;
    // Ensure loading/unloading places include goods
    loadingPlaces: LoadingPlace[];
    unloadingPlaces: UnloadingPlace[];
    carrierCompany: string;
    carrierContact: string;
    carrierVehicleReg: string;
    carrierPrice: string;
}

// --- Styled Components ---
// Odstránené nepoužívané styled components ako PageWrapper, StyledPaper, StyledFieldset, StyledLegend, FormSection, SectionHeader, AddButton, NextButton, PlaceCard, GoodsWrapper

// --- Initial Empty States ---
const emptyGoodsItem: GoodsItem = { id: crypto.randomUUID(), name: '', quantity: 1, unit: 'ks', palletExchange: 'Bez výmeny', dimensions: '', description: '', adrClass: '', referenceNumber: '' };
const emptyLoadingPlace: LoadingPlace = { id: crypto.randomUUID(), street: '', city: '', zip: '', country: 'Slovensko', dateTime: null, contactPerson: '', goods: [{ ...emptyGoodsItem }] };
const emptyUnloadingPlace: UnloadingPlace = { id: crypto.randomUUID(), street: '', city: '', zip: '', country: 'Slovensko', dateTime: null, contactPerson: '', goods: [{ ...emptyGoodsItem }] };

// --- Component ---
interface NewOrderFormProps {
    isModal?: boolean;
    onClose?: () => void;
    isEdit?: boolean;
    orderData?: Partial<OrderFormData>;
}

const NewOrderForm: React.FC<NewOrderFormProps> = ({ isModal = false, onClose, isEdit = false, orderData = {} }) => {
    const theme = useTheme();
    const { isDarkMode } = useThemeMode();
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
        loadingPlaces: [{ ...emptyLoadingPlace, id: crypto.randomUUID(), goods: [{...emptyGoodsItem, id: crypto.randomUUID()}] }], // Start with one loading place and one goods item
        unloadingPlaces: [{ ...emptyUnloadingPlace, id: crypto.randomUUID(), goods: [{...emptyGoodsItem, id: crypto.randomUUID()}] }], // Start with one unloading place and one goods item
        carrierCompany: '',
        carrierContact: '',
        carrierVehicleReg: '',
        carrierPrice: '',
    });
    const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
    const [customerSearchTerm, setCustomerSearchTerm] = useState('');
    const [isCustomerLoading, setIsCustomerLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Načítať dáta existujúcej objednávky pri editácii
    useEffect(() => {
        if (isEdit && orderData) {
            console.log('Načítavám dáta pre editáciu', orderData);
            
            // Pre lepšiu kompatibilitu medzi rôznymi formátmi
            const zakaznikValue = (orderData as any).zakaznik || orderData.customerCompany || '';
            const kontaktnaOsobaValue = (orderData as any).kontaktnaOsoba || 
                `${orderData.customerContactName || ''} ${orderData.customerContactSurname || ''}`.trim();
            
            setFormData(prevData => ({ 
                ...prevData, 
                ...orderData,
                zakaznik: zakaznikValue,
                kontaktnaOsoba: kontaktnaOsobaValue
            }));
            
            console.log('Nastavené hodnoty po načítaní:', {
                zakaznik: zakaznikValue,
                kontaktnaOsoba: kontaktnaOsobaValue
            });
        }
    }, [isEdit, orderData]);

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
            if (places[placeIndex]?.goods?.[goodsIndex]) {
                places[placeIndex].goods[goodsIndex] = { ...places[placeIndex].goods[goodsIndex], [field]: value };
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
     const removePlace = (type: 'loading' | 'unloading', index: number) => {
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
            if (places[placeIndex]?.goods && places[placeIndex].goods.length > 1) { // Prevent removing the last goods item
                 places[placeIndex].goods = places[placeIndex].goods.filter((_, i) => i !== goodsIndex);
            }
             return type === 'loading' ? { ...prev, loadingPlaces: places } : { ...prev, unloadingPlaces: places };
        });
    };

    // Debounced customer search (similar to BusinessCases)
     useEffect(() => {
        const fetchCustomers = async () => { /* ... same logic as in BusinessCases ... */ };
        const debounceTimer = setTimeout(() => fetchCustomers(), 500);
        return () => clearTimeout(debounceTimer);
    }, [customerSearchTerm, userData?.companyID]);

     const handleCustomerAutocompleteChange = (event: any, newValue: Customer | string | null) => {
         if (typeof newValue === 'string') {
             console.log('Nastavujem zákazníka z textu:', newValue);
             setFormData(prev => ({ ...prev, zakaznik: newValue, zakaznikData: null, kontaktnaOsoba: '' }));
         } else if (newValue) {
              console.log('Nastavujem zákazníka z objektu:', newValue);
              setFormData(prev => ({ 
                 ...prev, 
                 zakaznik: newValue.company, 
                 zakaznikData: newValue, 
                 kontaktnaOsoba: `${newValue.contactName || ''} ${newValue.contactSurname || ''}`.trim(),
                 // Auto-fill address?
                 customerStreet: newValue.street,
                 customerCity: newValue.city,
                 customerZip: newValue.zip,
                 customerCountry: newValue.country,
                 customerEmail: newValue.email,
                 customerPhone: newValue.phone,
                 customerVatId: newValue.vatId,
              }));
         } else {
             console.log('Čistím údaje zákazníka');
             setFormData(prev => ({ ...prev, zakaznik: '', zakaznikData: null, kontaktnaOsoba: '', /* clear address fields too */ }));
         }
     };

    // Pomocná funkcia pre debug - kontrola zakaznika pred odoslaním
    useEffect(() => {
        console.log("Aktuálna hodnota zakaznik:", formData.zakaznik);
    }, [formData.zakaznik]);

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
    const generatePDF = (orderData: OrderFormData & { id: string }) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            
            // Hlavička
            doc.setFontSize(20);
            doc.text('OBJEDNÁVKA PREPRAVY', pageWidth / 2, 20, { align: 'center' });
            doc.setFontSize(12);
            doc.text(`Číslo: ${orderData.id.substring(0, 8)}`, pageWidth / 2, 30, { align: 'center' });
            doc.text(`Dátum: ${new Date().toLocaleDateString('sk-SK')}`, pageWidth / 2, 40, { align: 'center' });
            
            // Údaje zákazníka
            doc.setFontSize(14);
            doc.text('Údaje zákazníka:', 14, 60);
            doc.setFontSize(10);
            doc.text(`Firma: ${orderData.zakaznik || ''}`, 14, 70);
            doc.text(`Kontaktná osoba: ${orderData.kontaktnaOsoba || ''}`, 14, 80);
            doc.text(`Suma: ${orderData.suma || ''} ${orderData.mena || 'EUR'}`, 14, 90);
            
            // Miesta nakládky
            doc.setFontSize(14);
            doc.text('Miesta nakládky:', 14, 110);
            doc.setFontSize(10);
            
            let yPos = 120;
            orderData.loadingPlaces?.forEach((place, index) => {
                doc.text(`${index + 1}. ${place.street}, ${place.city}, ${place.zip}, ${place.country}`, 14, yPos);
                yPos += 10;
                doc.text(`Dátum a čas: ${place.dateTime instanceof Date ? place.dateTime.toLocaleString('sk-SK') : place.dateTime}`, 20, yPos);
                yPos += 10;
                doc.text(`Kontaktná osoba: ${place.contactPerson}`, 20, yPos);
                yPos += 10;
                
                // Tovar na nakládke
                if (place.goods && place.goods.length > 0) {
                    doc.text('Tovar:', 20, yPos);
                    yPos += 10;
                    place.goods.forEach((item, itemIndex) => {
                        doc.text(`- ${item.name}, ${item.quantity} ${item.unit}`, 25, yPos);
                        yPos += 7;
                    });
                }
                
                yPos += 5;
            });
            
            // Miesta vykládky
            doc.setFontSize(14);
            doc.text('Miesta vykládky:', 14, yPos);
            yPos += 10;
            doc.setFontSize(10);
            
            orderData.unloadingPlaces?.forEach((place, index) => {
                // Ak sa blížime k spodku stránky, vytvoríme novú
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                
                doc.text(`${index + 1}. ${place.street}, ${place.city}, ${place.zip}, ${place.country}`, 14, yPos);
                yPos += 10;
                doc.text(`Dátum a čas: ${place.dateTime instanceof Date ? place.dateTime.toLocaleString('sk-SK') : place.dateTime}`, 20, yPos);
                yPos += 10;
                doc.text(`Kontaktná osoba: ${place.contactPerson}`, 20, yPos);
                yPos += 10;
                
                // Tovar na vykládke
                if (place.goods && place.goods.length > 0) {
                    doc.text('Tovar:', 20, yPos);
                    yPos += 10;
                    place.goods.forEach((item, itemIndex) => {
                        doc.text(`- ${item.name}, ${item.quantity} ${item.unit}`, 25, yPos);
                        yPos += 7;
                    });
                }
                
                yPos += 5;
            });
            
            // Dopravca
            if (yPos > 240) {
                doc.addPage();
                yPos = 20;
            }
            
            doc.setFontSize(14);
            doc.text('Údaje dopravcu:', 14, yPos);
            yPos += 10;
            doc.setFontSize(10);
            doc.text(`Firma: ${orderData.carrierCompany || '-'}`, 14, yPos);
            doc.text(`Kontakt: ${orderData.carrierContact || '-'}`, 14, yPos);
            doc.text(`EČV vozidla: ${orderData.carrierVehicleReg || '-'}`, 14, yPos);
            yPos += 10;
            doc.text(`Cena prepravy: ${orderData.carrierPrice || '-'} EUR`, 14, yPos);
            
            // Pätička
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(`Strana ${i} z ${pageCount}`, pageWidth - 20, doc.internal.pageSize.getHeight() - 10);
            }
            
            // Uloženie PDF
            doc.save(`objednavka-${orderData.id.substring(0, 8)}.pdf`);
            
        } catch (error) {
            console.error('Chyba pri generovaní PDF:', error);
            alert('Nastala chyba pri generovaní PDF objednávky');
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
                            freeSolo 
                            options={customerOptions} 
                            getOptionLabel={(o) => typeof o === 'string' ? o : o.company}
                            value={formData.zakaznikData ?? formData.zakaznik} 
                            onChange={handleCustomerAutocompleteChange}
                            onInputChange={(e, val) => {
                                setCustomerSearchTerm(val);
                                // Ak nie je vybraný žiadny objekt zákazníka, nastavíme text ako zákazníka
                                if (!formData.zakaznikData && val) {
                                    setFormData(prev => ({ ...prev, zakaznik: val }));
                                }
                            }} 
                            loading={isCustomerLoading}
                            renderInput={(params) => (
                                <TextField 
                                    {...params} 
                                    label="Zákazník *" 
                                    required 
                                    InputProps={{ 
                                        ...params.InputProps, 
                                        endAdornment: (
                                            <>{isCustomerLoading ? <CircularProgress color="inherit" size={20} /> : null}{params.InputProps.endAdornment}</>
                                        ) 
                                    }} 
                                />
                            )}
                            renderOption={(props, option) => {
                                const typedOption = option as Customer;
                                return <li {...props} key={typedOption.id || ''}>{typedOption.company} ({typedOption.city})</li>;
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                    borderColor: '#ff9f43',
                                },
                                '& .MuiInputLabel-root.Mui-focused': {
                                    color: '#ff9f43',
                                }
                            }}
                         />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <TextField fullWidth label="Kontaktná osoba" name="kontaktnaOsoba" value={formData.kontaktnaOsoba || ''} onChange={handleInputChange} />
                    </Grid>
                    <Grid item xs={12} sm={6}><TextField fullWidth label="IČ DPH" name="customerVatId" value={formData.customerVatId || ''} onChange={handleInputChange} /></Grid>
                    <Grid item xs={12} sm={6}><TextField fullWidth label="Ulica" name="customerStreet" value={formData.customerStreet || ''} onChange={handleInputChange} /></Grid>
                
                    {/* Cena */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                            Cena
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}><TextField fullWidth label="Suma *" name="suma" type="number" value={formData.suma || ''} onChange={handleInputChange} required inputProps={{ min: 0, step: "0.01" }} /></Grid>
                    <Grid item xs={6} sm={3}><FormControl fullWidth required><InputLabel>Mena *</InputLabel><Select name="mena" value={formData.mena || 'EUR'} label="Mena *" onChange={handleSelectChange}><MenuItem value="EUR">EUR</MenuItem><MenuItem value="CZK">CZK</MenuItem>{/* ... */}</Select></FormControl></Grid>
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
                                startIcon={<AddIcon />} 
                                onClick={() => addPlace('loading')} 
                                size="small"
                                sx={{ color: '#ff9f43' }}
                            >
                                Pridať Nakládku
                            </Button>
                        </Box>
                    </Grid>
                    {formData.loadingPlaces?.map((place, index) => (
                        <Grid item xs={12} key={place.id || index}>
                           <Paper sx={{ p: 2, mb: 1, position: 'relative' }}>
                                <Typography 
                                    variant="body1" 
                                    sx={{ mb: 2, fontWeight: 500 }}
                                >
                                    Nakládka #{index + 1}
                                    {formData.loadingPlaces && formData.loadingPlaces.length > 1 && (
                                        <IconButton 
                                            size="small" 
                                            onClick={() => removePlace('loading', index)} 
                                            color="error"
                                            sx={{ position: 'absolute', top: 8, right: 8 }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Typography>
                                <Grid container spacing={2}>
                                    {/* Fields for Loading Place */}
                                    <Grid item xs={12} sm={6}><TextField fullWidth label="Ulica a číslo *" value={place.street} onChange={handlePlaceInputChange('loading', index, 'street')} required /></Grid>
                                    <Grid item xs={6} sm={3}><TextField fullWidth label="Mesto *" value={place.city} onChange={handlePlaceInputChange('loading', index, 'city')} required /></Grid>
                                    <Grid item xs={6} sm={3}><TextField fullWidth label="PSČ *" value={place.zip} onChange={handlePlaceInputChange('loading', index, 'zip')} required /></Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Autocomplete options={countries} getOptionLabel={(o) => o.name} value={countries.find(c=>c.name === place.country) || null} onChange={handlePlaceAutocompleteChange('loading', index, 'country')} 
                                            renderInput={(params) => <TextField {...params} label="Krajina *" required />} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                                            <DateTimePicker 
                                                label="Dátum a čas nakládky *"
                                                value={place.dateTime as Date | null}
                                                onChange={handleDateTimeChange('loading', index)}
                                                slotProps={{ textField: { fullWidth: true, required: true } }}
                                            />
                                        </LocalizationProvider>
                                    </Grid>
                                    <Grid item xs={12}><TextField fullWidth label="Kontaktná osoba *" value={place.contactPerson} onChange={handlePlaceInputChange('loading', index, 'contactPerson')} required /></Grid>
                                </Grid>
                                 {/* Goods Items Section */}
                                <Box sx={{ mt: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>Tovar na naloženie:</Typography>
                                        <Button 
                                            startIcon={<AddIcon />} 
                                            size="small" 
                                            onClick={() => addGoodsItem('loading', index)}
                                            sx={{ color: '#ff9f43' }}
                                        >
                                            Pridať tovar
                                        </Button>
                                    </Box>
                                    
                                    {place.goods?.map((item, goodsIndex) => (
                                        <Paper 
                                            key={item.id || goodsIndex}
                                            sx={{ p: 1.5, mb: 1, position: 'relative' }}
                                            elevation={0}
                                            variant="outlined"
                                        >
                                            <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                                                Tovar #{goodsIndex + 1}
                                                {place.goods && place.goods.length > 1 && (
                                                    <IconButton 
                                                        size="small" 
                                                        onClick={() => removeGoodsItem('loading', index, goodsIndex)} 
                                                        color="error"
                                                        sx={{ position: 'absolute', top: 4, right: 4 }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </Typography>
                                            
                                            <Grid container spacing={1}>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField 
                                                        label="Názov tovaru *" 
                                                        value={item.name} 
                                                        onChange={handleGoodsChange('loading', index, goodsIndex, 'name')} 
                                                        required 
                                                        fullWidth
                                                        size="small"
                                                    />
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <TextField 
                                                        label="Množstvo *" 
                                                        type="number" 
                                                        value={item.quantity} 
                                                        onChange={handleGoodsChange('loading', index, goodsIndex, 'quantity')} 
                                                        required 
                                                        inputProps={{min: 0, step: 1}}
                                                        fullWidth
                                                        size="small"
                                                    />
                                                </Grid>
                                                <Grid item xs={6} sm={3}>
                                                    <FormControl fullWidth size="small">
                                                        <InputLabel>Jednotka *</InputLabel>
                                                        <Select 
                                                            value={item.unit} 
                                                            label="Jednotka *" 
                                                            onChange={handleGoodsChange('loading', index, goodsIndex, 'unit')} 
                                                            required
                                                        >
                                                            <MenuItem value="ks">ks</MenuItem>
                                                            <MenuItem value="pal">pal</MenuItem>
                                                            <MenuItem value="kg">kg</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <FormControl fullWidth size="small">
                                                        <InputLabel>Výmena paliet</InputLabel>
                                                        <Select 
                                                            value={item.palletExchange} 
                                                            label="Výmena paliet" 
                                                            onChange={handleGoodsChange('loading', index, goodsIndex, 'palletExchange')}
                                                        >
                                                            <MenuItem value="Bez výmeny">Bez výmeny</MenuItem>
                                                            <MenuItem value="Výmena">Výmena</MenuItem>
                                                        </Select>
                                                    </FormControl>
                                                </Grid>
                                                <Grid item xs={12} sm={6}>
                                                    <TextField 
                                                        label="Rozmer" 
                                                        value={item.dimensions} 
                                                        onChange={handleGoodsChange('loading', index, goodsIndex, 'dimensions')} 
                                                        fullWidth
                                                        size="small"
                                                    />
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <TextField 
                                                        label="Popis tovaru" 
                                                        value={item.description} 
                                                        onChange={handleGoodsChange('loading', index, goodsIndex, 'description')} 
                                                        fullWidth
                                                        size="small"
                                                    />
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    ))}
                                </Box>
                            </Paper>
                        </Grid>
                    ))}

                     {/* Body Vykládky */}
                     <Grid item xs={12}>
                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 1 }}>
                             <Typography variant="subtitle1" sx={{ color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                                 Body Vykládky
                             </Typography>
                             <Button 
                                 startIcon={<AddIcon />} 
                                 onClick={() => addPlace('unloading')} 
                                 size="small"
                                 sx={{ color: '#ff9f43' }}
                             >
                                 Pridať Vykládku
                             </Button>
                         </Box>
                     </Grid>
                    {formData.unloadingPlaces?.map((place, index) => (
                        <Grid item xs={12} key={place.id || index}>
                            <Paper sx={{ p: 2, mb: 1, position: 'relative' }}>
                                <Typography 
                                    variant="body1" 
                                    sx={{ mb: 2, fontWeight: 500 }}
                                >
                                    Vykládka #{index + 1}
                                    {formData.unloadingPlaces && formData.unloadingPlaces.length > 1 && (
                                        <IconButton 
                                            size="small" 
                                            onClick={() => removePlace('unloading', index)} 
                                            color="error"
                                            sx={{ position: 'absolute', top: 8, right: 8 }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Typography>
                                <Grid container spacing={2}>
                                    {/* Fields for Unloading Place */}
                                    <Grid item xs={12} sm={6}><TextField fullWidth label="Ulica a číslo *" value={place.street} onChange={handlePlaceInputChange('unloading', index, 'street')} required /></Grid>
                                    <Grid item xs={6} sm={3}><TextField fullWidth label="Mesto *" value={place.city} onChange={handlePlaceInputChange('unloading', index, 'city')} required /></Grid>
                                    <Grid item xs={6} sm={3}><TextField fullWidth label="PSČ *" value={place.zip} onChange={handlePlaceInputChange('unloading', index, 'zip')} required /></Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Autocomplete options={countries} getOptionLabel={(o) => o.name} value={countries.find(c=>c.name === place.country) || null} onChange={handlePlaceAutocompleteChange('unloading', index, 'country')} 
                                            renderInput={(params) => <TextField {...params} label="Krajina *" required />} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                         <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                                             <DateTimePicker 
                                                 label="Dátum a čas vykládky *"
                                                 value={place.dateTime as Date | null}
                                                 onChange={handleDateTimeChange('unloading', index)}
                                                 slotProps={{ textField: { fullWidth: true, required: true } }}
                                             />
                                         </LocalizationProvider>
                                     </Grid>
                                    <Grid item xs={12}><TextField fullWidth label="Kontaktná osoba *" value={place.contactPerson} onChange={handlePlaceInputChange('unloading', index, 'contactPerson')} required /></Grid>
                                </Grid>
                                 {/* Goods Items Section */}
                                 <Box sx={{ mt: 2 }}>
                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                         <Typography variant="body2" sx={{ fontWeight: 500 }}>Tovar na vyloženie:</Typography>
                                         <Button 
                                             startIcon={<AddIcon />} 
                                             size="small" 
                                             onClick={() => addGoodsItem('unloading', index)}
                                             sx={{ color: '#ff9f43' }}
                                         >
                                             Pridať tovar
                                         </Button>
                                     </Box>
                                     
                                     {place.goods?.map((item, goodsIndex) => (
                                         <Paper 
                                             key={item.id || goodsIndex}
                                             sx={{ p: 1.5, mb: 1, position: 'relative' }}
                                             elevation={0}
                                             variant="outlined"
                                         >
                                             <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>
                                                 Tovar #{goodsIndex + 1}
                                                 {place.goods && place.goods.length > 1 && (
                                                     <IconButton 
                                                         size="small" 
                                                         onClick={() => removeGoodsItem('unloading', index, goodsIndex)} 
                                                         color="error"
                                                         sx={{ position: 'absolute', top: 4, right: 4 }}
                                                     >
                                                         <DeleteIcon fontSize="small" />
                                                     </IconButton>
                                                 )}
                                             </Typography>
                                             
                                             <Grid container spacing={1}>
                                                 <Grid item xs={12} sm={6}>
                                                     <TextField 
                                                         label="Názov tovaru *" 
                                                         value={item.name} 
                                                         onChange={handleGoodsChange('unloading', index, goodsIndex, 'name')} 
                                                         required 
                                                         fullWidth
                                                         size="small"
                                                     />
                                                 </Grid>
                                                 <Grid item xs={6} sm={3}>
                                                     <TextField 
                                                         label="Množstvo *" 
                                                         type="number" 
                                                         value={item.quantity} 
                                                         onChange={handleGoodsChange('unloading', index, goodsIndex, 'quantity')} 
                                                         required 
                                                         inputProps={{min: 0, step: 1}}
                                                         fullWidth
                                                         size="small"
                                                     />
                                                 </Grid>
                                                 <Grid item xs={6} sm={3}>
                                                     <FormControl fullWidth size="small">
                                                         <InputLabel>Jednotka *</InputLabel>
                                                         <Select 
                                                             value={item.unit} 
                                                             label="Jednotka *" 
                                                             onChange={handleGoodsChange('unloading', index, goodsIndex, 'unit')} 
                                                             required
                                                         >
                                                             <MenuItem value="ks">ks</MenuItem>
                                                             <MenuItem value="pal">pal</MenuItem>
                                                             <MenuItem value="kg">kg</MenuItem>
                                                         </Select>
                                                     </FormControl>
                                                 </Grid>
                                                 <Grid item xs={12}>
                                                     <TextField 
                                                         label="Popis tovaru" 
                                                         value={item.description} 
                                                         onChange={handleGoodsChange('unloading', index, goodsIndex, 'description')} 
                                                         fullWidth
                                                         size="small"
                                                     />
                                                 </Grid>
                                             </Grid>
                                         </Paper>
                                     ))}
                                 </Box>
                             </Paper>
                         </Grid>
                     ))}

                    {/* Dopravca */}
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                            Dopravca (Vykonávateľ)
                        </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}><TextField fullWidth label="Názov firmy dopravcu" name="carrierCompany" value={formData.carrierCompany || ''} onChange={handleInputChange} /></Grid>
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
                backgroundColor: theme.palette.background.paper // Aby tlačidlá mali pozadie
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
        </Box>
    );
};

export default NewOrderForm;