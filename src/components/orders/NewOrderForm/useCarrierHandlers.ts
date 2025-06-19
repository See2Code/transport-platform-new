import { useState, useCallback, useEffect } from 'react';
import { Carrier } from '../../../types/carriers';
import { collection, addDoc, query, where, getDocs, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase';

export const useCarrierHandlers = (userData: any, setFormData: (data: any) => void) => {
    const [carriers, setCarriers] = useState<Carrier[]>([]);
    const [isCarrierLoading, setIsCarrierLoading] = useState(false);
    const [isCarrierDialogOpen, setIsCarrierDialogOpen] = useState(false);

    // Načítanie dopravcov
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

    useEffect(() => {
        fetchCarriers();
    }, [fetchCarriers, userData?.companyID]);

    // Handler pre autocomplete výber dopravcu
    const handleCarrierAutocompleteChange = (event: any, newValue: Carrier | null) => {
        // Vypočítame priemerné hodnotenie dopravcu
        const getCarrierAverageRating = (carrier: Carrier): number => {
            if (!carrier.rating) return 0;
            const { reliability, communication, serviceQuality, timeManagement } = carrier.rating;
            if (reliability === 0 && communication === 0 && serviceQuality === 0 && timeManagement === 0) return 0;
            return Math.round((reliability + communication + serviceQuality + timeManagement) / 4);
        };
        if (!newValue) {
            setFormData((prev: any) => ({
                ...prev,
                carrierCompany: '',
                carrierContact: '',
                carrierPaymentTermDays: 60,
                carrierEmail: '',
                carrierPhone: '',
                carrierIco: '',
                carrierDic: '',
                carrierIcDph: '',
                carrierStreet: '',
                carrierCity: '',
                carrierZip: '',
                carrierCountry: '',
                carrierVehicleTypes: [],
                carrierNotes: '',
                carrierRating: 0,
            }));
            return;
        }
        setFormData((prev: any) => ({
            ...prev,
            carrierCompany: newValue.companyName,
            carrierContact: `${newValue.contactName || ''} ${newValue.contactSurname || ''} ${newValue.contactPhone || ''}`.trim(),
            carrierPaymentTermDays: newValue.paymentTermDays || 60,
            carrierEmail: newValue.contactEmail || '',
            carrierPhone: newValue.contactPhone || '',
            carrierIco: newValue.ico || '',
            carrierDic: newValue.dic || '',
            carrierIcDph: newValue.icDph || '',
            carrierStreet: newValue.street || '',
            carrierCity: newValue.city || '',
            carrierZip: newValue.zip || '',
            carrierCountry: newValue.country || 'Slovensko',
            carrierVehicleTypes: newValue.vehicleTypes || [],
            carrierNotes: newValue.notes || '',
            carrierRating: getCarrierAverageRating(newValue),
        }));
    };

    // Handler pre otvorenie dialógu
    const handleAddNewCarrier = () => {
        setIsCarrierDialogOpen(true);
    };

    // Handler pre pridanie nového dopravcu
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

    return {
        carriers,
        isCarrierLoading,
        isCarrierDialogOpen,
        setIsCarrierDialogOpen,
        handleCarrierAutocompleteChange,
        handleAddNewCarrier,
        handleCarrierSubmit
    };
}; 