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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
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
  contactPhonePrefix: string;
  contactPhone: string;
  ico?: string;
  dic?: string;
  icDph?: string;
  paymentTermDays?: number; // Splatnosť v dňoch
  customerId?: string; // Automaticky generované ID zákazníka (napr. Z19233)
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
  
  // Funkcia na generovanie unikátneho ID zákazníka (jedno písmeno + 5 číslic)
  const generateCustomerId = (): string => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const numbers = Math.floor(Math.random() * 90000) + 10000; // 5-miestne číslo od 10000 do 99999
    return `${letter}${numbers}`;
  };
  
  const [formData, setFormData] = useState<CustomerData>({
    companyName: '',
    street: '',
    city: '',
    zip: '',
    country: 'Slovensko',
    contactName: '',
    contactSurname: '',
    contactEmail: '',
    contactPhonePrefix: '+421',
    contactPhone: '',
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
        contactPhonePrefix: editCustomer.contactPhonePrefix || '+421',
        contactPhone: editCustomer.contactPhone || '',
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
        contactPhonePrefix: '+421',
        contactPhone: '',
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

  const handleCountryChange = (event: SelectChangeEvent) => {
    const selectedCountryName = event.target.value as string;
    const selectedCountry = countries.find(c => c.name === selectedCountryName);
    
    setFormData(prev => ({
      ...prev,
      country: selectedCountryName,
      contactPhonePrefix: selectedCountry?.prefix || '+421'
    }));
  };

  const handleSubmit = () => {
    const customerDataToSubmit = {
      ...formData,
      // Ak je to nový zákazník (bez customerId), vygeneruj mu nové ID
      customerId: formData.customerId || generateCustomerId()
    };
    onSubmit(customerDataToSubmit);
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
              <FormControl fullWidth required>
                <InputLabel>Krajina</InputLabel>
                <Select
                  label="Krajina"
                  name="country"
                  value={formData.country}
                  onChange={handleCountryChange}
                >
                  {countries.map((country) => (
                    <MenuItem key={country.code} value={country.name}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <img 
                          loading="lazy" 
                          width="20" 
                          height="15"
                          src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`} 
                          alt={`${country.name} vlajka`} 
                          style={{ borderRadius: '2px', objectFit: 'cover' }}
                        />
                        <span>{country.name}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
            <Grid item xs={12} sm={6}>
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
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl sx={{ minWidth: 120 }}>
                  <InputLabel sx={{ 
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                    '&.Mui-focused': {
                      color: '#ff9f43',
                    },
                  }}>Krajina</InputLabel>
                  <Select
                    label="Krajina"
                    value={formData.contactPhonePrefix}
                    onChange={(e: SelectChangeEvent) => {
                      const selectedPrefix = e.target.value as string;
                      setFormData(prev => ({
                        ...prev,
                        contactPhonePrefix: selectedPrefix
                      }));
                    }}
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      color: isDarkMode ? '#ffffff' : '#000000',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#ff9f43',
                      },
                      '& .MuiSelect-icon': {
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                      }
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                          '& .MuiMenuItem-root': {
                            color: isDarkMode ? '#ffffff' : '#000000',
                            '&:hover': {
                              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                            }
                          }
                        }
                      }
                    }}
                  >
                    {countries.map((country) => (
                      <MenuItem key={country.code} value={country.prefix}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <img 
                            loading="lazy" 
                            width="20" 
                            height="15"
                            src={`https://flagcdn.com/${country.code.toLowerCase()}.svg`} 
                            alt={`${country.name} vlajka`} 
                            style={{ borderRadius: '2px', objectFit: 'cover' }}
                          />
                          <span style={{ minWidth: '60px' }}>{country.prefix}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Telefónne číslo"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleChange}
                  placeholder="9XX XXX XXX"
                  helperText="Zadajte telefónne číslo bez predvoľby"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: isDarkMode ? '#ffffff' : '#000000',
                      '& fieldset': {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ff9f43',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                      '&.Mui-focused': {
                        color: '#ff9f43',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                      fontSize: '0.75rem',
                      marginLeft: 0,
                      marginTop: '4px',
                    }
                  }}
                />
              </Box>
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