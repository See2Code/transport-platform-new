import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Autocomplete,
  CircularProgress,
  IconButton,
  InputAdornment,
  CardContent
} from '@mui/material';

// Icons
import PersonIcon from '@mui/icons-material/Person';
import BusinessIcon from '@mui/icons-material/Business';
import PhoneIcon from '@mui/icons-material/Phone';
import EuroIcon from '@mui/icons-material/Euro';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

import { Customer } from '../../../types/customers';
import { OrderFormData } from '../../../types/orders';
import { StyledCard } from './StyledComponents';
import BareTooltip from './BareTooltip';

interface CustomerStepProps {
  formData: Partial<OrderFormData>;
  customerOptions: Customer[];
  isCustomerLoading: boolean;
  handleCustomerChange: (customer: Customer | null) => void;
  handleInputChange: (field: keyof OrderFormData) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  setNewCustomerDialog: (open: boolean) => void;
}

const CustomerStep: React.FC<CustomerStepProps> = ({
  formData,
  customerOptions,
  isCustomerLoading,
  handleCustomerChange,
  handleInputChange,
  setNewCustomerDialog
}) => {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#ff9f43', fontWeight: 600, mb: 3 }}>
        <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        {t('orders.customerInformation') || 'Informácie o zákazníkovi'}
      </Typography>

      <Grid container spacing={3}>
        {/* Customer Selection */}
        <Grid item xs={12}>
          <StyledCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <BusinessIcon sx={{ color: '#ff9f43', mr: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  {t('orders.selectCustomer') || 'Výber zákazníka'}
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={8}>
                  <Autocomplete
                    options={customerOptions}
                    getOptionLabel={(option: Customer) => {
                      console.log('🏷️ getOptionLabel called for option:', option);
                      return option.company || '';
                    }}
                    value={formData.zakaznikData}
                    onChange={(_, newValue: Customer | null) => {
                      console.log('🔄 Customer selection changed:', newValue);
                      handleCustomerChange(newValue);
                    }}
                    loading={isCustomerLoading}
                    renderInput={(params) => {
                      console.log('📝 Autocomplete renderInput, customerOptions length:', customerOptions.length);
                      console.log('📝 Current customerOptions:', customerOptions);
                      return (
                        <TextField
                          {...params}
                          id="customer-autocomplete"
                          name="customer"
                          label={t('orders.customer') + ' *'}
                          required
                          fullWidth
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {isCustomerLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                <BareTooltip title={t('orders.addNewCustomer') || 'Pridať nového zákazníka'}>
                                  <IconButton
                                    size="small"
                                    onClick={() => setNewCustomerDialog(true)}
                                    sx={{ mr: 1, color: '#ff9f43' }}
                                  >
                                    <AddIcon />
                                  </IconButton>
                                </BareTooltip>
                                {params.InputProps.endAdornment}
                              </>
                            ),
                          }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                borderColor: '#ff9f43',
                              },
                            },
                            '& .MuiInputLabel-root.Mui-focused': {
                              color: '#ff9f43',
                            },
                          }}
                        />
                      );
                    }}
                    renderOption={(props, option: Customer) => (
                         <Box component="li" {...props}>
                           <Box>
                             <Typography variant="body1" fontWeight={500}>
                               {option.company}
                             </Typography>
                             <Typography variant="body2" color="text.secondary">
                               {option.contactName} {option.contactSurname} • {option.city}
                             </Typography>
                           </Box>
                         </Box>
                       )}
                     />
                   </Grid>
                   
                   <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    id="contact-person"
                    name="contactPerson"
                    label={t('orders.contactPerson') || 'Kontaktná osoba'}
                    value={formData.kontaktnaOsoba || ''}
                    onChange={handleInputChange('kontaktnaOsoba')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    id="customer-payment-terms"
                    name="customerPaymentTerms"
                    label="Splatnosť zákazníka (dni)"
                    type="number"
                    value={formData.customerPaymentTermDays || 30}
                    InputProps={{
                      readOnly: true,
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccessTimeIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Automaticky načítané zo zákazníka"
                    sx={{
                      '& input[type=number]': {
                        MozAppearance: 'textfield',
                      },
                      '& input[type=number]::-webkit-outer-spin-button': {
                        WebkitAppearance: 'none',
                        margin: 0,
                      },
                      '& input[type=number]::-webkit-inner-spin-button': {
                        WebkitAppearance: 'none',
                        margin: 0,
                      },
                    }}
                  />
                </Grid>
                
                {/* Identifikačné číslo zákazníka */}
                {formData.zakaznikData && formData.customerId && (
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      id="customer-id"
                      name="customerId"
                      label="Identifikačné číslo zákazníka"
                      value={formData.customerId || ''}
                      InputProps={{
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <BusinessIcon sx={{ color: 'text.secondary' }} />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Automaticky pridelené systémom"
                      sx={{
                        '& .MuiInputBase-input': {
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          fontSize: '1.1rem',
                          color: '#ff9f43'
                        }
                      }}
                    />
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Order Details */}
        <Grid item xs={12}>
          <StyledCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <EuroIcon sx={{ color: '#ff9f43', mr: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  {t('orders.orderDetails') || 'Detaily objednávky'}
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    id="customer-price"
                    name="customerPrice"
                    label={t('orders.customerPrice') + ' *'}
                    type="text"
                    value={formData.suma || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Povolíme len čísla, bodku a čiarku pre ceny
                      const cleanValue = value.replace(/[^0-9.,]/g, '').replace(',', '.');
                      handleInputChange('suma')({ ...e, target: { ...e.target, value: cleanValue } });
                    }}
                    onKeyPress={(e) => {
                      // Povolíme len číslice, bodku a čiarku pre ceny
                      const allowedKeys = /[0-9.,]/;
                      const specialKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                      
                      if (!allowedKeys.test(e.key) && !specialKeys.includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    required
                    InputProps={{
                      endAdornment: <InputAdornment position="end">€</InputAdornment>,
                    }}
                    placeholder="napr. 150,50 alebo 1200.00"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    id="currency-select"
                    name="currency"
                    select
                    label={t('orders.currency') || 'Mena'}
                    value={formData.mena || 'EUR'}
                    onChange={handleInputChange('mena')}
                    SelectProps={{ native: true }}
                  >
                    <option value="EUR">EUR</option>
                    <option value="CZK">CZK</option>
                    <option value="USD">USD</option>
                  </TextField>
                </Grid>
                
                {/* Identifikačné číslo zákazníka */}
                {formData.zakaznikData && formData.customerId && (
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      id="customer-id"
                      name="customerId"
                      label="Identifikačné číslo zákazníka"
                      value={formData.customerId || ""}
                      InputProps={{
                        readOnly: true
                      }}
                      helperText="Automaticky pridelené systémom"
                    />
                  </Grid>
                )}

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    id="internal-note"
                    name="internalNote"
                    label={t('orders.internalNote') || 'Interná poznámka'}
                    value={formData.internaPoznamka || ''}
                    onChange={handleInputChange('internaPoznamka')}
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerStep; 