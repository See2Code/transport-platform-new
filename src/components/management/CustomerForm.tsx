import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Dialog,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Typography,
  useTheme,
  Box,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Business as BusinessIcon } from '@mui/icons-material';
import { countries } from '../../constants/countries';
import { useThemeMode } from '../../contexts/ThemeContext';

export interface CustomerData {
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
  paymentTermDays?: number; // Splatnosť v dňoch
}

interface CustomerFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (customerData: CustomerData) => void;
  editCustomer?: CustomerData;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ open, onClose, onSubmit, editCustomer }) => {
  const _theme = useTheme();
  const { isDarkMode } = useThemeMode();
  const [formData, setFormData] = useState<CustomerData>({
    companyName: '',
    street: '',
    city: '',
    zip: '',
    country: 'Slovensko',
    contactName: '',
    contactSurname: '',
    contactEmail: '',
    ico: '',
    dic: '',
    icDph: '',
    paymentTermDays: 30,
  });

  useEffect(() => {
    if (editCustomer) {
      setFormData({
        ...editCustomer,
        icDph: editCustomer.icDph || (editCustomer as any).vatId || (editCustomer as any)['IČ_DPH'] || (editCustomer as any).ic_dph || '',
      });
    } else {
      setFormData({
        companyName: '',
        street: '',
        city: '',
        zip: '',
        country: 'Slovensko',
        contactName: '',
        contactSurname: '',
        contactEmail: '',
        ico: '',
        dic: '',
        icDph: '',
        paymentTermDays: 30,
      });
    }
  }, [editCustomer, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
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
      <Box
        sx={{
          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          color: isDarkMode ? '#ffffff' : '#000000',
        }}
      >
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
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {editCustomer ? 'Upraviť zákazníka' : 'Pridať zákazníka'}
            </Typography>
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

        <DialogContent sx={{ 
          p: 0, 
          mb: 3, 
          overflow: 'auto',
          flex: 1,
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
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2, color: '#ff9f43', fontWeight: 600 }}>
                Informácie o spoločnosti
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Názov spoločnosti"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ulica"
                name="street"
                value={formData.street}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mesto"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="PSČ"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Krajina"
                name="country"
                value={formData.country}
                onChange={handleChange}
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
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: '#ff9f43', fontWeight: 600 }}>
                Daňové údaje (nepovinné)
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="IČO"
                name="ico"
                value={formData.ico}
                onChange={handleChange}
                helperText="Identifikačné číslo organizácie"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="DIČ"
                name="dic"
                value={formData.dic}
                onChange={handleChange}
                helperText="Daňové identifikačné číslo"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="IČ DPH"
                name="icDph"
                value={formData.icDph}
                onChange={handleChange}
                helperText="Identifikačné číslo pre DPH"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Splatnosť (dni)"
                name="paymentTermDays"
                type="number"
                value={formData.paymentTermDays || 30}
                onChange={handleChange}
                helperText="Počet dní na splatenie faktúry"
                inputProps={{ min: 1, max: 365 }}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: '#ff9f43', fontWeight: 600 }}>
                Kontaktná osoba
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Meno"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Priezvisko"
                name="contactSurname"
                value={formData.contactSurname}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={handleChange}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 0, flexShrink: 0 }}>
          <Button 
            onClick={onClose} 
            sx={{ 
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              '&:hover': { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }
            }}
          >
            Zrušiť
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            sx={{ 
              backgroundColor: '#ff9f43',
              color: '#ffffff',
              '&:hover': { 
                backgroundColor: '#f7b067',
              } 
            }}
          >
            {editCustomer ? 'Aktualizovať' : 'Uložiť'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default CustomerForm; 