import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Dialog,
  DialogContent,
  Divider,
  Grid,
  TextField,
  Button,
  useTheme
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useTranslation } from 'react-i18next';
import { countries } from '../../../constants/countries';
import { Carrier } from '../../../types/carriers';

interface CarrierFormData {
  companyName: string;
  street: string;
  city: string;
  zip: string;
  country: string;
  contactName: string;
  contactSurname: string;
  contactEmail: string;
  contactPhone: string;
  ico: string;
  dic: string;
  icDph: string;
  vehicleTypes: string;
  notes: string;
  paymentTermDays: string;
}

interface CarrierFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (carrierData: any) => Promise<void>;
  editCarrier?: Carrier | null;
  formData: CarrierFormData;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  isDarkMode: boolean;
  loading?: boolean;
}

const CarrierFormDialog: React.FC<CarrierFormDialogProps> = ({
  open,
  onClose,
  onSubmit,
  editCarrier,
  formData,
  onFormChange,
  isDarkMode,
  loading = false
}) => {
  const { t } = useTranslation();
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
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
            <LocalShippingIcon sx={{ color: '#ff9f43' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {editCarrier ? 'Upraviť dopravcu' : t('orders.addCarrier')}
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

        <form onSubmit={handleSubmit}>
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
                <Typography variant="subtitle1" sx={{ mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                  {t('orders.carrierInfo')}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('orders.companyName')}
                  name="companyName"
                  value={formData.companyName}
                  onChange={onFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('orders.street')}
                  name="street"
                  value={formData.street}
                  onChange={onFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('orders.city')}
                  name="city"
                  value={formData.city}
                  onChange={onFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('orders.zipCode')}
                  name="zip"
                  value={formData.zip}
                  onChange={onFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  label={t('orders.country')}
                  name="country"
                  value={formData.country}
                  onChange={onFormChange}
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
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                  {t('orders.taxInfo')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="IČO"
                  name="ico"
                  value={formData.ico}
                  onChange={onFormChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="DIČ"
                  name="dic"
                  value={formData.dic}
                  onChange={onFormChange}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  fullWidth
                  label="IČ DPH"
                  name="icDph"
                  value={formData.icDph}
                  onChange={onFormChange}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                  {t('orders.contactInfo')}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('orders.contactName')}
                  name="contactName"
                  value={formData.contactName}
                  onChange={onFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('orders.contactSurname')}
                  name="contactSurname"
                  value={formData.contactSurname}
                  onChange={onFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('orders.email')}
                  name="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={onFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('orders.phone')}
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={onFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                  {t('orders.transportInfo')}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('orders.vehicleTypes')}
                  name="vehicleTypes"
                  value={formData.vehicleTypes}
                  onChange={onFormChange}
                  placeholder={t('orders.vehicleTypesPlaceholder')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={t('orders.paymentTermDays')}
                  name="paymentTermDays"
                  type="number"
                  value={formData.paymentTermDays}
                  onChange={onFormChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('orders.notes')}
                  name="notes"
                  value={formData.notes}
                  onChange={onFormChange}
                  multiline
                  rows={3}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 2, 
            pt: 2,
            borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            flexShrink: 0
          }}>
            <Button
              onClick={onClose}
              variant="outlined"
              sx={{
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                color: isDarkMode ? '#ffffff' : '#000000',
                '&:hover': {
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                }
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{
                backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.8)' : '#ff9f43',
                color: '#ffffff',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.9)' : '#f7b067',
                },
                '&:disabled': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                }
              }}
            >
              {loading ? t('common.saving') : (editCarrier ? t('common.update') : t('common.save'))}
            </Button>
          </Box>
        </form>
      </Box>
    </Dialog>
  );
};

export default CarrierFormDialog; 