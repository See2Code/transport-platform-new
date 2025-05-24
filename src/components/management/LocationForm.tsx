import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Divider,
  IconButton,
  Box,
  MenuItem,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import { styled } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useThemeMode } from '../../contexts/ThemeContext';
import { useTranslation } from 'react-i18next';
import { countries } from '../../constants/countries';

const StyledDialogContent = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  color: isDarkMode ? '#ffffff' : '#000000',
  padding: '0px',
  borderRadius: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  overflow: 'hidden',
  margin: 0,
  display: 'flex',
  flexDirection: 'column',
  '& .MuiDialogTitle-root': {
    color: isDarkMode ? '#ffffff' : '#000000',
    padding: '24px 24px 16px 24px',
    fontSize: '1.25rem',
    fontWeight: 600,
    flexShrink: 0,
  },
  '& .MuiDialogContent-root': {
    padding: '16px 24px',
    color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
    overflowY: 'auto',
    flexGrow: 1,
  },
  '& .MuiDialogActions-root': {
    padding: '16px 24px 24px 24px',
    flexShrink: 0,
  }
}));

export interface LocationData {
  type: 'loading' | 'unloading';
  companyName: string;
  city: string;
  street: string;
  zip: string;
  country: string;
  contactPersonName: string;
  contactPersonPhone: string;
}

interface LocationFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (locationData: LocationData) => void;
  editLocation?: LocationData | null;
}

const LocationForm: React.FC<LocationFormProps> = ({
  open,
  onClose,
  onSubmit,
  editLocation
}) => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeMode();

  const [formData, setFormData] = useState<LocationData>({
    type: 'loading',
    companyName: '',
    city: '',
    street: '',
    zip: '',
    country: 'Slovensko',
    contactPersonName: '',
    contactPersonPhone: ''
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Načítanie dát pre editáciu
  useEffect(() => {
    if (editLocation) {
      setFormData({
        type: editLocation.type || 'loading',
        companyName: editLocation.companyName || '',
        city: editLocation.city || '',
        street: editLocation.street || '',
        zip: editLocation.zip || '',
        country: editLocation.country || 'Slovensko',
        contactPersonName: editLocation.contactPersonName || '',
        contactPersonPhone: editLocation.contactPersonPhone || ''
      });
    } else {
      // Reset formulára pre nové miesto
      setFormData({
        type: 'loading',
        companyName: '',
        city: '',
        street: '',
        zip: '',
        country: 'Slovensko',
        contactPersonName: '',
        contactPersonPhone: ''
      });
    }
    setErrors({});
  }, [editLocation, open]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Vymazanie chyby pre dané pole
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.companyName.trim()) {
      newErrors.companyName = t('validation.required') || 'Toto pole je povinné';
    }

    if (!formData.city.trim()) {
      newErrors.city = t('validation.required') || 'Toto pole je povinné';
    }

    if (!formData.street.trim()) {
      newErrors.street = t('validation.required') || 'Toto pole je povinné';
    }

    if (!formData.contactPersonName.trim()) {
      newErrors.contactPersonName = t('validation.required') || 'Toto pole je povinné';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData);
      handleClose();
    }
  };

  const handleClose = () => {
    setFormData({
      type: 'loading',
      companyName: '',
      city: '',
      street: '',
      zip: '',
      country: 'Slovensko',
      contactPersonName: '',
      contactPersonPhone: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
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
      <StyledDialogContent isDarkMode={isDarkMode}>
        <DialogTitle>
          <Box sx={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnIcon sx={{ color: '#ff9f43' }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                {editLocation ? (t('orders.editLocation') || 'Upraviť miesto') : (t('orders.addLocation') || 'Pridať miesto')}
              </Typography>
            </Box>
            <IconButton 
              onClick={handleClose} 
              edge="end" 
              aria-label="close"
              sx={{
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <Divider sx={{ borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', flexShrink: 0 }} />

        <DialogContent sx={{ 
          p: '24px', 
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
            {/* Typ miesta */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mb: 2, color: '#ff9f43' }}>
                {t('orders.locationType') || 'Typ miesta'}
              </Typography>
            </Grid>
            
            <Grid item xs={12}>
              <FormControl fullWidth required error={!!errors.type}>
                <InputLabel>{t('orders.type') || 'Typ'}</InputLabel>
                <Select
                  value={formData.type}
                  label={t('orders.type') || 'Typ'}
                  onChange={(e) => handleSelectChange('type', e.target.value)}
                >
                  <MenuItem value="loading">
                    {t('orders.loading') || 'Nakládka'}
                  </MenuItem>
                  <MenuItem value="unloading">
                    {t('orders.unloading') || 'Vykládka'}
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Názov firmy */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: '#ff9f43' }}>
                {t('orders.companyInfo') || 'Informácie o firme'}
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label={t('orders.companyName') || 'Názov firmy'}
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                error={!!errors.companyName}
                helperText={errors.companyName}
              />
            </Grid>

            {/* Adresa */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: '#ff9f43' }}>
                {t('orders.address') || 'Adresa'}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label={t('orders.city') || 'Mesto'}
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                error={!!errors.city}
                helperText={errors.city}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label={t('orders.street') || 'Ulica'}
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                error={!!errors.street}
                helperText={errors.street}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('orders.zipCode') || 'PSČ'}
                name="zip"
                value={formData.zip}
                onChange={handleInputChange}
                error={!!errors.zip}
                helperText={errors.zip}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>{t('orders.country') || 'Krajina'}</InputLabel>
                <Select
                  value={formData.country}
                  label={t('orders.country') || 'Krajina'}
                  onChange={(e) => handleSelectChange('country', e.target.value)}
                >
                  {countries.map((country) => (
                    <MenuItem key={country.code} value={country.name}>
                      {country.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Kontaktné údaje */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: '#ff9f43' }}>
                {t('orders.contactInfo') || 'Kontaktné údaje'}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                required
                label={t('orders.contactPerson') || 'Kontaktná osoba'}
                name="contactPersonName"
                value={formData.contactPersonName}
                onChange={handleInputChange}
                error={!!errors.contactPersonName}
                helperText={errors.contactPersonName}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('orders.phone') || 'Telefón'}
                name="contactPersonPhone"
                type="tel"
                value={formData.contactPersonPhone}
                onChange={handleInputChange}
                error={!!errors.contactPersonPhone}
                helperText={errors.contactPersonPhone}
              />
            </Grid>
          </Grid>
        </DialogContent>
        
        <DialogActions sx={{ flexShrink: 0 }}>
          <Button 
            onClick={handleClose} 
            sx={{ 
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              '&:hover': { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }
            }}
          >
            {t('common.cancel') || 'Zrušiť'}
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
            {t('common.save') || 'Uložiť'}
          </Button>
        </DialogActions>
      </StyledDialogContent>
    </Dialog>
  );
};

export default LocationForm; 