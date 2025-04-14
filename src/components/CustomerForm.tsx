import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Typography,
  useTheme,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { countries } from '../constants/countries';

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
}

interface CustomerFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (customerData: CustomerData) => void;
  editCustomer?: CustomerData;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ open, onClose, onSubmit, editCustomer }) => {
  const theme = useTheme();
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
  });

  useEffect(() => {
    if (editCustomer) {
      setFormData(editCustomer);
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
      sx={{
        '& .MuiBackdrop-root': {
          backdropFilter: 'blur(5px)',
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(0, 0, 0, 0.8)' 
            : 'rgba(255, 255, 255, 0.8)'
        },
        '& .MuiPaper-root': {
          backgroundColor: theme.palette.mode === 'dark' 
            ? 'rgba(22, 28, 36, 0.95)' 
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          border: theme.palette.mode === 'dark' 
            ? '1px solid rgba(255, 255, 255, 0.08)' 
            : '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '12px',
          overflow: 'hidden',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid',
        borderColor: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'rgba(0, 0, 0, 0.1)',
      }}>
        <Typography variant="h6">{editCustomer ? 'Upraviť zákazníka' : 'Pridať zákazníka'}</Typography>
        <IconButton onClick={onClose} edge="end" aria-label="close">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
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
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
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
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
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
      <DialogActions sx={{ 
        p: 3, 
        borderTop: '1px solid', 
        borderColor: theme.palette.mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.1)' 
          : 'rgba(0, 0, 0, 0.1)' 
      }}>
        <Button 
          onClick={onClose} 
          sx={{ color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}
        >
          Zrušiť
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          sx={{ 
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 159, 67, 0.8)' : '#ff9f43',
            color: '#ffffff',
            '&:hover': { 
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 159, 67, 0.9)' : '#f7b067',
            } 
          }}
        >
          {editCustomer ? 'Aktualizovať' : 'Uložiť'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CustomerForm; 