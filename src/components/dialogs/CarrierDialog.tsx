import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    IconButton,
    Box,
    Typography,
    Divider,
    useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { Carrier } from '../../types/carriers';
import { countries } from '../../constants/countries';
import { useTranslation } from 'react-i18next';

interface CarrierDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (carrierData: Carrier) => void;
}



const CarrierDialog: React.FC<CarrierDialogProps> = ({ open, onClose, onSubmit }) => {
    const theme = useTheme();
    const { t } = useTranslation();
    const isDarkMode = theme.palette.mode === 'dark';

    const [formData, setFormData] = useState<Partial<Carrier>>({
        companyName: '',
        street: '',
        city: '',
        zip: '',
        country: 'Slovensko',
        contactName: '',
        contactSurname: '',
        contactEmail: '',
        contactPhone: '',
        ico: '',
        dic: '',
        icDph: '',
        vehicleTypes: [],
        notes: '',
        paymentTermDays: 60,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };



    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData as Carrier);
        setFormData({
            companyName: '',
            street: '',
            city: '',
            zip: '',
            country: 'Slovensko',
            contactName: '',
            contactSurname: '',
            contactEmail: '',
            contactPhone: '',
            ico: '',
            dic: '',
            icDph: '',
            vehicleTypes: [],
            notes: '',
            paymentTermDays: 60,
        });
        onClose();
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
                            {t('orders.addCarrier')}
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
                    <form onSubmit={handleSubmit}>
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
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('orders.street')}
                                    name="street"
                                    value={formData.street}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={t('orders.city')}
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={t('orders.zipCode')}
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
                                    label={t('orders.country')}
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
                                <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                                    {t('orders.taxInfo')}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label={t('orders.ico')}
                                    name="ico"
                                    value={formData.ico}
                                    onChange={handleChange}
                                    helperText={t('orders.businessId')}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label={t('orders.dic')}
                                    name="dic"
                                    value={formData.dic}
                                    onChange={handleChange}
                                    helperText={t('orders.taxId')}
                                />
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <TextField
                                    fullWidth
                                    label={t('orders.icDph')}
                                    name="icDph"
                                    value={formData.icDph}
                                    onChange={handleChange}
                                    helperText={t('orders.vatIdDescription')}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                                    {t('orders.contactPerson')}
                                </Typography>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={t('orders.firstName')}
                                    name="contactName"
                                    value={formData.contactName}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={t('orders.lastName')}
                                    name="contactSurname"
                                    value={formData.contactSurname}
                                    onChange={handleChange}
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
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={t('orders.phone')}
                                    name="contactPhone"
                                    type="tel"
                                    value={formData.contactPhone}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                                    {t('orders.additionalInfo')}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('orders.vehicleTypes')}
                                    name="vehicleTypes"
                                    placeholder={t('orders.vehicleTypesPlaceholder')}
                                    value={Array.isArray(formData.vehicleTypes) ? formData.vehicleTypes.join(', ') : ''}
                                    onChange={(e) => setFormData(prev => ({ ...prev, vehicleTypes: e.target.value.split(', ').filter(Boolean) }))}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={t('orders.paymentTermDays') || 'Splatnosť (dni)'}
                                    name="paymentTermDays"
                                    type="number"
                                    value={formData.paymentTermDays}
                                    onChange={handleChange}
                                    helperText={t('orders.paymentTermDaysHelper') || 'Počet dní na úhradu faktúry (default: 60)'}
                                    inputProps={{ min: 1, max: 365 }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                {/* Prázdny grid item pre zachovanie layoutu */}
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label={t('orders.notes')}
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    multiline
                                    rows={3}
                                />
                            </Grid>
                        </Grid>
                    </form>
                </DialogContent>
                
                <DialogActions sx={{ p: 0, flexShrink: 0 }}>
                    <Button 
                        onClick={onClose} 
                        sx={{ 
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                            '&:hover': { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }
                        }}
                    >
                        {t('common.cancel')}
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
                        {t('common.save')}
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default CarrierDialog; 