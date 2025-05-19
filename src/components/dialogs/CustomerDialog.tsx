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
    Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Business as BusinessIcon } from '@mui/icons-material';
import { Customer } from '../../types/customers';
import { useThemeMode } from '../../contexts/ThemeContext';

interface CustomerDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (customerData: Customer) => void;
}

const CustomerDialog: React.FC<CustomerDialogProps> = ({ open, onClose, onSubmit }) => {
    const { isDarkMode } = useThemeMode();
    const [formData, setFormData] = useState<Partial<Customer>>({
        company: '',
        street: '',
        city: '',
        zip: '',
        country: 'Slovensko',
        contactName: '',
        contactSurname: '',
        email: '',
        phone: '',
        vatId: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(formData as Customer);
        setFormData({
            company: '',
            street: '',
            city: '',
            zip: '',
            country: 'Slovensko',
            contactName: '',
            contactSurname: '',
            email: '',
            phone: '',
            vatId: '',
        });
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
                            Pridať nového zákazníka
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
    
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
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
                                    name="company"
                                    value={formData.company}
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
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Telefón"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: '#ff9f43', fontWeight: 600 }}>
                                    Daňové údaje (nepovinné)
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="IČ DPH"
                                    name="vatId"
                                    value={formData.vatId}
                                    onChange={handleChange}
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
                            type="submit" 
                            variant="contained"
                            sx={{ 
                                backgroundColor: '#ff9f43',
                                color: '#ffffff',
                                '&:hover': { 
                                    backgroundColor: '#f7b067',
                                } 
                            }}
                        >
                            Pridať zákazníka
                        </Button>
                    </DialogActions>
                </form>
            </Box>
        </Dialog>
    );
};

export default CustomerDialog; 