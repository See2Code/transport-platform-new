import React from 'react';
import { Alert, Box, Typography, Snackbar } from '@mui/material';
import CustomerForm, { CustomerData } from '../../management/CustomerForm';
import CarrierDialog from '../../dialogs/CarrierDialog';
import { Customer } from '../../../types/customers';
import { Carrier } from '../../../types/carriers';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase';

interface DialogHandlersProps {
  // Customer Dialog
  newCustomerDialog: boolean;
  setNewCustomerDialog: (open: boolean) => void;
  userData?: { companyID?: string };
  setCustomerOptions: React.Dispatch<React.SetStateAction<Customer[]>>;
  handleCustomerChange: (customer: Customer | null) => void;
  
  // Carrier Dialog
  newCarrierDialog: boolean;
  setNewCarrierDialog: (open: boolean) => void;
  setCarriers: React.Dispatch<React.SetStateAction<Carrier[]>>;
  handleCarrierChange: (carrier: Carrier | null) => void;
  
  // Validation Errors
  showValidationAlert: boolean;
  setShowValidationAlert: (show: boolean) => void;
  validationErrors: string[];
}

const DialogHandlers: React.FC<DialogHandlersProps> = ({
  newCustomerDialog,
  setNewCustomerDialog,
  userData,
  setCustomerOptions,
  handleCustomerChange,
  newCarrierDialog,
  setNewCarrierDialog,
  setCarriers,
  handleCarrierChange,
  showValidationAlert,
  setShowValidationAlert,
  validationErrors,
}) => {
  const handleCustomerSubmit = async (customerData: CustomerData) => {
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
  };

  const handleCarrierSubmit = async (carrierData: Carrier) => {
    try {
      if (!userData?.companyID) {
        alert("Chyba: Nemáte priradenú firmu.");
        return;
      }
      
      // Uložíme nového dopravcu do databázy
      const carrierRef = collection(db, 'carriers');
      const newCarrier = {
        companyName: carrierData.companyName,
        street: carrierData.street,
        city: carrierData.city,
        zip: carrierData.zip,
        country: carrierData.country,
        contactName: carrierData.contactName,
        contactSurname: carrierData.contactSurname,
        contactEmail: carrierData.contactEmail,
        contactPhone: carrierData.contactPhone,
        ico: carrierData.ico || '',
        dic: carrierData.dic || '',
        icDph: carrierData.icDph || '',
        vehicleTypes: carrierData.vehicleTypes || [],
        notes: carrierData.notes || '',
        paymentTermDays: carrierData.paymentTermDays || 60,
        companyID: userData.companyID,
        createdAt: Timestamp.fromDate(new Date())
      };
      
      const docRef = await addDoc(carrierRef, newCarrier);
      
      // Vytvoríme Carrier objekt pre select
      const newCarrierOption: Carrier = {
        id: docRef.id,
        companyName: carrierData.companyName,
        street: carrierData.street,
        city: carrierData.city,
        zip: carrierData.zip,
        country: carrierData.country,
        contactName: carrierData.contactName,
        contactSurname: carrierData.contactSurname,
        contactEmail: carrierData.contactEmail,
        contactPhone: carrierData.contactPhone,
        ico: carrierData.ico || '',
        dic: carrierData.dic || '',
        icDph: carrierData.icDph || '',
        vehicleTypes: carrierData.vehicleTypes || [],
        notes: carrierData.notes || '',
        paymentTermDays: carrierData.paymentTermDays || 60,
        companyID: userData.companyID
      };
      
      // Pridáme ho do zoznamu a vyberieme
      setCarriers(prev => [...prev, newCarrierOption]);
      handleCarrierChange(newCarrierOption);
      setNewCarrierDialog(false);
      
    } catch (error) {
      console.error('Chyba pri ukladaní dopravcu:', error);
      alert('Nastala chyba pri ukladaní dopravcu: ' + (error as Error).message);
    }
  };

  return (
    <>
      {/* Customer Form Dialog */}
      <CustomerForm
        open={newCustomerDialog}
        onClose={() => setNewCustomerDialog(false)}
        onSubmit={handleCustomerSubmit}
      />

      {/* Carrier Dialog */}
      <CarrierDialog
        open={newCarrierDialog}
        onClose={() => setNewCarrierDialog(false)}
        onSubmit={handleCarrierSubmit}
      />

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
    </>
  );
};

export default DialogHandlers; 