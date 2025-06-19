import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { OrderFormData } from '../../../types/orders';
import { Customer } from '../../../types/customers';
import { normalizeVatId } from '../../../utils/helpers';
import { Box, Grid } from '@mui/material';
import { collection, addDoc, query, where, getDocs, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CustomerDialog from '../../dialogs/CustomerDialog';
import CarrierDialog from '../../dialogs/CarrierDialog';
import { emptyLoadingPlace, emptyUnloadingPlace, NewOrderFormProps } from './orderFormConstants';
import { useOrderPlacesHandlers } from './useOrderPlacesHandlers';
import { useCustomerHandlers } from './useCustomerHandlers';
import { useCarrierHandlers } from './useCarrierHandlers';
import { generateOrderNumber } from './orderFormUtils';
import { useOrderSubmission } from './useOrderSubmission';
import { migrateContactData, splitContactName } from './orderFormHelpers';

// Import komponentov
import BasicInfoSection from './BasicInfoSection';
import CustomerSection from './CustomerSection';
import PriceSection from './PriceSection';
import CargoSection from './CargoSection';
import PlaceSection from './PlaceSection';
import CarrierSection from './CarrierSection';
import FormActions from './FormActions';

const NewOrderForm: React.FC<NewOrderFormProps> = ({ isModal = false, onClose, isEdit = false, orderData = {} }) => {
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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditingCarrierPaymentTerms, setIsEditingCarrierPaymentTerms] = useState(false);

    // Hook pre zákazníka
    const {
        customerOptions,
        isCustomerDialogOpen,
        setIsCustomerDialogOpen,
        handleCustomerAutocompleteChange,
        handleAddNewCustomer,
        handleCustomerSubmit
    } = useCustomerHandlers(userData, setFormData);

    // Hook pre dopravcu
    const {
        carriers,
        isCarrierLoading,
        isCarrierDialogOpen,
        setIsCarrierDialogOpen,
        handleCarrierAutocompleteChange,
        handleCarrierSubmit
    } = useCarrierHandlers(userData, setFormData);

    // Použijeme hook pre prácu s miestami
    const {
        handleDateTimeChange,
        handlePlaceInputChange,
        handlePlaceAutocompleteChange,
        handleGoodsChange,
        addPlace,
        addGoodsItem,
        removeGoodsItem
    } = useOrderPlacesHandlers(formData, setFormData);

    // Hook pre odoslanie objednávky
    const { generatePDF } = useOrderSubmission();

    // Pridávam závislosti pre useEffect, ktorý načítava dáta pre editáciu
    useEffect(() => {
        if (isEdit && orderData) {
            console.log('Načítavám dáta pre editáciu', orderData);
            
            // Pre lepšiu kompatibilitu medzi rôznymi formátmi
            const zakaznikValue = (orderData as any).zakaznik || orderData.customerCompany || '';
            const kontaktnaOsobaValue = (orderData as any).kontaktnaOsoba || 
                `${orderData.customerContactName || ''} ${orderData.customerContactSurname || ''}`.trim();
            
            // Migrácia starých kontaktných údajov v miestach nakládky a vykládky
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
                
                console.log("Loaded customers:", customersData);
            } catch (error) {
                console.error("Error fetching customers:", error);
            }
        };

        fetchCustomers();
    }, [userData?.companyID]);

    // --- Handlers ---
    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type, checked } = e.target as HTMLInputElement;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };
    
    const handleDateChange = (name: keyof OrderFormData) => (date: Date | null) => { 
        setFormData(prev => ({ ...prev, [name]: date })); 
    };
    
    const handleSelectChange = (e: any) => { 
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); 
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
            const { kontaktMeno, kontaktPriezvisko } = splitContactName(formData.kontaktnaOsoba || '');
            
            // Explicitne zabezpečiť, že máme hodnotu pre zákazníka
            const zakaznikHodnota = formData.zakaznik || '';
            
            // Ak nejde o editáciu, vygenerujeme nové číslo objednávky
            let orderNumberData = null;
            if (!isEdit) {
                orderNumberData = await generateOrderNumber(userData?.companyID);
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
                // Pri editácii zachovávame pôvodné údaje o vytvorení
                createdBy: isEdit ? (orderData as any)?.createdBy : userData.uid,
                createdByName: isEdit ? (orderData as any)?.createdByName : createdByNameToSave,
                createdAt: isEdit ? (orderData as any)?.createdAt : Timestamp.now(),
                updatedAt: Timestamp.now(), // Pridáme informáciu o aktualizácii
                updatedBy: isEdit ? userData.uid : undefined, // Pridáme informáciu o tom, kto upravil
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
                // Editácia existujúcej objednávky - zachovávame pôvodné údaje o vytvorení
                const orderRef = doc(db, 'orders', orderData.id);
                await updateDoc(orderRef, {
                    ...finalOrder,
                    // Neprepisujeme createdBy, createdByName ani createdAt - sú už správne v finalOrder
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

    // Carrier payment terms editing functions
    const handleStartEditCarrierPaymentTerms = () => {
        setIsEditingCarrierPaymentTerms(true);
    };

    const handleCancelEditCarrierPaymentTerms = () => {
        setIsEditingCarrierPaymentTerms(false);
    };

    const handleCarrierPaymentTermsChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 60;
        setFormData(prev => ({
            ...prev,
            carrierPaymentTermDays: value
        }));
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
                    <BasicInfoSection 
                        formData={formData}
                        handleDateChange={handleDateChange}
                    />

                    {/* Údaje zákazníka */}
                    <CustomerSection 
                        formData={formData}
                        customerOptions={customerOptions}
                        handleInputChange={handleInputChange}
                        handleCustomerAutocompleteChange={handleCustomerAutocompleteChange}
                        handleAddNewCustomer={handleAddNewCustomer}
                    />
                
                    {/* Cena */}
                    <PriceSection 
                        formData={formData}
                        handleInputChange={handleInputChange}
                        handleSelectChange={handleSelectChange}
                    />
                
                    {/* Náklad */}
                    <CargoSection 
                        formData={formData}
                        handleInputChange={handleInputChange}
                        handleSelectChange={handleSelectChange}
                    />

                    {/* Body Nakládky */}
                    <PlaceSection 
                        type="loading"
                        formData={formData}
                        handlePlaceInputChange={handlePlaceInputChange}
                        handlePlaceAutocompleteChange={handlePlaceAutocompleteChange}
                        handleDateTimeChange={handleDateTimeChange}
                        handleGoodsChange={handleGoodsChange}
                        addPlace={addPlace}
                        addGoodsItem={addGoodsItem}
                        removeGoodsItem={removeGoodsItem}
                    />

                     {/* Body Vykládky */}
                     <PlaceSection 
                        type="unloading"
                        formData={formData}
                        handlePlaceInputChange={handlePlaceInputChange}
                        handlePlaceAutocompleteChange={handlePlaceAutocompleteChange}
                        handleDateTimeChange={handleDateTimeChange}
                        handleGoodsChange={handleGoodsChange}
                        addPlace={addPlace}
                        addGoodsItem={addGoodsItem}
                        removeGoodsItem={removeGoodsItem}
                    />

                    {/* Dopravca */}
                    <CarrierSection 
                        formData={formData}
                        carriers={carriers}
                        isCarrierLoading={isCarrierLoading}
                        isEditingCarrierPaymentTerms={isEditingCarrierPaymentTerms}
                        userData={userData}
                        handleInputChange={handleInputChange}
                        handleCarrierAutocompleteChange={handleCarrierAutocompleteChange}
                        setIsCarrierDialogOpen={setIsCarrierDialogOpen}
                        setIsEditingCarrierPaymentTerms={setIsEditingCarrierPaymentTerms}
                        handleStartEditCarrierPaymentTerms={handleStartEditCarrierPaymentTerms}
                        handleCancelEditCarrierPaymentTerms={handleCancelEditCarrierPaymentTerms}
                        handleCarrierPaymentTermsChange={handleCarrierPaymentTermsChange}
                    />
                </Grid>
            </Box>
            
            {/* Tlačidlá na spodku formulára */}
            <FormActions 
                isModal={isModal}
                isEdit={isEdit}
                isSubmitting={isSubmitting}
                onClose={onClose}
            />

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

export default NewOrderForm; 