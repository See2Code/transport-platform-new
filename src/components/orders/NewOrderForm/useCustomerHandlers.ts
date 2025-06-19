import { useState, useEffect } from 'react';
import { Customer } from '../../../types/customers';
import { collection, addDoc, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase';
import { normalizeVatId } from '../../../utils/helpers';

export const useCustomerHandlers = (userData: any, setFormData: (data: any) => void) => {
    const [customerOptions, setCustomerOptions] = useState<Customer[]>([]);
    const [isCustomerLoading, setIsCustomerLoading] = useState(false);
    const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);

    // Načítanie zákazníkov
    useEffect(() => {
        const fetchCustomers = async () => {
            if (!userData?.companyID) return;
            setIsCustomerLoading(true);
            try {
                const customersRef = collection(db, 'customers');
                const q = query(customersRef, where('companyID', '==', userData.companyID));
                const querySnapshot = await getDocs(q);
                const customersData = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    const vatIdValue = normalizeVatId(data.vatId || data.IČ_DPH || data.ic_dph || '');
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
            } catch (error) {
                console.error('Chyba pri načítaní zákazníkov:', error);
            } finally {
                setIsCustomerLoading(false);
            }
        };
        fetchCustomers();
    }, [userData?.companyID]);

    // Handler pre autocomplete výber zákazníka
    const handleCustomerAutocompleteChange = (event: any, newValue: Customer | null) => {
        if (!newValue) {
            setFormData((prev: any) => ({
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
                customerPhone: '',
                customerPaymentTermDays: 30
            }));
            return;
        }
        setFormData((prev: any) => ({
            ...prev,
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
            customerPhone: newValue.phone || (newValue.contactPhonePrefix && newValue.contactPhone 
              ? `${newValue.contactPhonePrefix}${newValue.contactPhone}` 
              : '') || '',
            customerPaymentTermDays: newValue.paymentTermDays || 30
        }));
    };

    // Handler pre otvorenie dialógu
    const handleAddNewCustomer = () => {
        setIsCustomerDialogOpen(true);
    };

    // Handler pre pridanie nového zákazníka
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

    return {
        customerOptions,
        isCustomerLoading,
        isCustomerDialogOpen,
        setIsCustomerDialogOpen,
        handleCustomerAutocompleteChange,
        handleAddNewCustomer,
        handleCustomerSubmit
    };
}; 