import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Autocomplete,
  IconButton,
  InputAdornment,
  CircularProgress,
  Divider,
  CardContent,
} from '@mui/material';

// Icons
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AddIcon from '@mui/icons-material/Add';
import PhoneIcon from '@mui/icons-material/Phone';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonIcon from '@mui/icons-material/Person';
import EuroIcon from '@mui/icons-material/Euro';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SummaryIcon from '@mui/icons-material/Summarize';

import { Carrier } from '../../../types/carriers';
import { OrderFormData } from '../../../types/orders';
import BareTooltip from './BareTooltip';
import { StyledCard } from './StyledComponents';

interface CarrierStepProps {
  formData: Partial<OrderFormData>;
  carriers: Carrier[];
  isCarrierLoading: boolean;
  teamMembers: {[id: string]: {name: string, email: string}};
  isEditingDispatcher: boolean;
  isEditingCarrierPaymentTerms: boolean;
  _originalDispatcher: {id: string, name: string} | null;
  editedDispatcher: {id: string, name: string} | null;
  calculateProfit: () => number;
  handleCarrierChange: (carrier: Carrier | null) => void;
  handleInputChange: (field: keyof OrderFormData) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  setNewCarrierDialog: (open: boolean) => void;
  handleStartEditDispatcher: () => void;
  handleSaveDispatcher: () => void;
  handleCancelEditDispatcher: () => void;
  handleDispatcherChange: (dispatcher: {id: string, name: string} | null) => void;
  handleStartEditCarrierPaymentTerms: () => void;
  handleCarrierPaymentTermsChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCancelEditCarrierPaymentTerms: () => void;
  setIsEditingCarrierPaymentTerms: (editing: boolean) => void;
}

const CarrierStep: React.FC<CarrierStepProps> = ({
  formData,
  carriers,
  isCarrierLoading,
  teamMembers,
  isEditingDispatcher,
  isEditingCarrierPaymentTerms,
  _originalDispatcher,
  editedDispatcher,
  calculateProfit,
  handleCarrierChange,
  handleInputChange,
  setNewCarrierDialog,
  handleStartEditDispatcher,
  handleSaveDispatcher,
  handleCancelEditDispatcher,
  handleDispatcherChange,
  handleStartEditCarrierPaymentTerms,
  handleCarrierPaymentTermsChange,
  handleCancelEditCarrierPaymentTerms,
  setIsEditingCarrierPaymentTerms,
}) => {
  const { t } = useTranslation();
  
  const profit = calculateProfit();
  const profitColor = profit >= 0 ? '#2ecc71' : '#e74c3c';

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#ff9f43', fontWeight: 600, mb: 3 }}>
        <LocalShippingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        {t('orders.carrierAndSummary') || 'Dopravca a súhrn'}
      </Typography>

      <Grid container spacing={3}>
        {/* Carrier Selection */}
        <Grid item xs={12}>
          <StyledCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <LocalShippingIcon sx={{ color: '#ff9f43', mr: 1 }} />
                <Typography variant="subtitle1" fontWeight={600}>
                  {t('orders.selectCarrier') || 'Výber dopravcu'}
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={carriers}
                    getOptionLabel={(option: Carrier) => option.companyName || ''}
                    value={carriers.find(c => c.companyName === formData.carrierCompany) || null}
                    onChange={(_, newValue: Carrier | null) => handleCarrierChange(newValue)}
                    loading={isCarrierLoading}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        id="carrier-autocomplete"
                        name="carrier"
                        label={t('orders.carrier')}
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {isCarrierLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              <BareTooltip title={t('orders.addNewCarrier') || 'Pridať nového dopravcu'}>
                                <IconButton
                                  size="small"
                                  onClick={() => setNewCarrierDialog(true)}
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
                    )}
                    renderOption={(props, option: Carrier) => (
                      <Box component="li" {...props}>
                        <Box>
                          <Typography variant="body1" fontWeight={500}>
                            {option.companyName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {option.contactName} {option.contactSurname} • {option.city}
                          </Typography>
                        </Box>
                      </Box>
                    )}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="carrier-contact"
                    name="carrierContact"
                    label={t('orders.carrierContact') || 'Kontakt na dopravcu'}
                    value={formData.carrierContact || ''}
                    onChange={handleInputChange('carrierContact')}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PhoneIcon sx={{ color: 'text.secondary' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="vehicle-registration"
                    name="vehicleRegistration"
                    label={t('orders.vehicleRegistration') || 'EČV vozidla'}
                    value={formData.carrierVehicleReg || ''}
                    onChange={handleInputChange('carrierVehicleReg')}
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    id="carrier-price"
                    name="carrierPrice"
                    label={t('orders.carrierPrice') || 'Cena za dopravu'}
                    type="text"
                    value={formData.carrierPrice || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Povolíme len čísla, bodku a čiarku pre ceny dopravcu
                      const cleanValue = value.replace(/[^0-9.,]/g, '').replace(',', '.');
                      const event = { target: { value: cleanValue } } as React.ChangeEvent<HTMLInputElement>;
                      handleInputChange('carrierPrice')(event);
                    }}
                    onKeyPress={(e) => {
                      // Povolíme len číslice, bodku a čiarku pre ceny dopravcu
                      const allowedKeys = /[0-9.,]/;
                      const specialKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                      
                      if (!allowedKeys.test(e.key) && !specialKeys.includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">€</InputAdornment>,
                    }}
                    placeholder="napr. 80,50 alebo 120.00"
                  />
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Box sx={{ position: 'relative' }}>
                    {isEditingCarrierPaymentTerms ? (
                      <TextField
                        fullWidth
                        id="carrier-payment-terms-edit"
                        name="carrierPaymentTermDays"
                        label="Splatnosť dopravcu (dni)"
                        type="number"
                        value={formData.carrierPaymentTermDays ?? ''}
                        onChange={handleCarrierPaymentTermsChange}
                        onKeyPress={(e) => {
                          // Povolíme len číslice pre dni splatnosti (bez desatinných miest)
                          const allowedKeys = /[0-9]/;
                          const specialKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                          
                          if (!allowedKeys.test(e.key) && !specialKeys.includes(e.key)) {
                            e.preventDefault();
                          }
                        }}
                        InputProps={{
                          endAdornment: (
                            <InputAdornment position="end">
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <BareTooltip title="Uložiť">
                                  <IconButton
                                    size="small"
                                    onClick={() => setIsEditingCarrierPaymentTerms(false)}
                                    sx={{ color: '#4caf50' }}
                                  >
                                    <CheckIcon fontSize="small" />
                                  </IconButton>
                                </BareTooltip>
                                <BareTooltip title="Zrušiť">
                                  <IconButton
                                    size="small"
                                    onClick={handleCancelEditCarrierPaymentTerms}
                                    sx={{ color: '#f44336' }}
                                  >
                                    <CloseIcon fontSize="small" />
                                  </IconButton>
                                </BareTooltip>
                              </Box>
                            </InputAdornment>
                          ),
                        }}
                        inputProps={{ min: 1, max: 365 }}
                        autoFocus
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
                    ) : (
                      <TextField
                        fullWidth
                        id="carrier-payment-terms"
                        name="carrierPaymentTerms"
                        label="Splatnosť dopravcu"
                        value={`${formData.carrierPaymentTermDays || 60} dní`}
                        InputProps={{
                          readOnly: true,
                          endAdornment: (
                            <InputAdornment position="end">
                              <BareTooltip title="Upraviť splatnosť">
                                <IconButton
                                  size="small"
                                  onClick={handleStartEditCarrierPaymentTerms}
                                  sx={{ color: 'text.secondary' }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </BareTooltip>
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiInputBase-input': {
                            cursor: 'pointer',
                          },
                        }}
                      />
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </StyledCard>
        </Grid>

        {/* Order Summary */}
        <Grid item xs={12}>
          <StyledCard>
            <CardContent>
              <Box display="flex" alignItems="center" mb={3}>
                <SummaryIcon sx={{ color: '#ff9f43', mr: 1 }} />
                <Typography variant="h6" fontWeight={600} sx={{ color: '#ff9f43' }}>
                  Súhrn objednávky
                </Typography>
              </Box>
              
              <Grid container spacing={3}>
                {/* Customer Section */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: 3, 
                    background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.1) 0%, rgba(46, 204, 113, 0.05) 100%)',
                    borderRadius: 2,
                    border: '1px solid rgba(46, 204, 113, 0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}>
                      <PersonIcon sx={{ fontSize: 60, color: '#2ecc71' }} />
                    </Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <PersonIcon sx={{ color: '#2ecc71', mr: 1, fontSize: 20 }} />
                      <Typography variant="subtitle2" color="#2ecc71" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                        Zákazník
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={600} mb={0.5}>
                      {formData.zakaznik || 'Nevybraný zákazník'}
                    </Typography>
                    {formData.kontaktnaOsoba && (
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <PhoneIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        {formData.kontaktnaOsoba}
                      </Typography>
                    )}
                  </Box>
                </Grid>
                
                {/* Carrier Section */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ 
                    p: 3, 
                    background: 'linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(52, 152, 219, 0.05) 100%)',
                    borderRadius: 2,
                    border: '1px solid rgba(52, 152, 219, 0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    <Box sx={{ position: 'absolute', top: -10, right: -10, opacity: 0.1 }}>
                      <LocalShippingIcon sx={{ fontSize: 60, color: '#3498db' }} />
                    </Box>
                    <Box display="flex" alignItems="center" mb={1}>
                      <LocalShippingIcon sx={{ color: '#3498db', mr: 1, fontSize: 20 }} />
                      <Typography variant="subtitle2" color="#3498db" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                        Dopravca
                      </Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={600} mb={0.5}>
                      {formData.carrierCompany || 'Nevybraný dopravca'}
                    </Typography>
                    {formData.carrierContact && (
                      <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <PhoneIcon sx={{ fontSize: 16, mr: 0.5 }} />
                        {formData.carrierContact}
                      </Typography>
                    )}
                  </Box>
                </Grid>
                
                {/* Financial Summary */}
                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ 
                        p: 2.5, 
                        background: 'linear-gradient(135deg, rgba(155, 89, 182, 0.1) 0%, rgba(155, 89, 182, 0.05) 100%)',
                        borderRadius: 2,
                        border: '1px solid rgba(155, 89, 182, 0.2)',
                        textAlign: 'center'
                      }}>
                        <EuroIcon sx={{ color: '#9b59b6', fontSize: 24, mb: 1 }} />
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          Cena zákazníka
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color="#9b59b6">
                          {formData.suma ? `${formData.suma} €` : '0 €'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ 
                        p: 2.5, 
                        background: 'linear-gradient(135deg, rgba(230, 126, 34, 0.1) 0%, rgba(230, 126, 34, 0.05) 100%)',
                        borderRadius: 2,
                        border: '1px solid rgba(230, 126, 34, 0.2)',
                        textAlign: 'center'
                      }}>
                        <LocalShippingIcon sx={{ color: '#e67e22', fontSize: 24, mb: 1 }} />
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          Cena dopravcu
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color="#e67e22">
                          {formData.carrierPrice ? `${formData.carrierPrice} €` : '0 €'}
                        </Typography>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={4}>
                      <Box sx={{ 
                        p: 2.5, 
                        background: profit >= 0 
                          ? 'linear-gradient(135deg, rgba(46, 204, 113, 0.15) 0%, rgba(46, 204, 113, 0.05) 100%)'
                          : 'linear-gradient(135deg, rgba(231, 76, 60, 0.15) 0%, rgba(231, 76, 60, 0.05) 100%)',
                        borderRadius: 2,
                        border: profit >= 0 
                          ? '2px solid rgba(46, 204, 113, 0.3)'
                          : '2px solid rgba(231, 76, 60, 0.3)',
                        textAlign: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                      }}>
                        <TrendingUpIcon sx={{ color: profitColor, fontSize: 24, mb: 1 }} />
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                          {profit >= 0 ? 'Zisk' : 'Strata'}
                        </Typography>
                        <Typography variant="h5" fontWeight={700} color={profitColor}>
                          {profit !== 0 ? `${profit.toFixed(2)} €` : '0.00 €'}
                        </Typography>
                        {profit > 0 && (
                          <Box sx={{ 
                            position: 'absolute', 
                            top: 0, 
                            right: 0, 
                            width: '100%', 
                            height: '100%',
                            background: 'linear-gradient(45deg, transparent 0%, rgba(46, 204, 113, 0.1) 100%)',
                            pointerEvents: 'none'
                          }} />
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>
                
                {/* Route Summary */}
                <Grid item xs={12}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        p: 2.5, 
                        background: 'linear-gradient(135deg, rgba(46, 204, 113, 0.08) 0%, rgba(46, 204, 113, 0.03) 100%)',
                        borderRadius: 2,
                        border: '1px solid rgba(46, 204, 113, 0.15)'
                      }}>
                        <Box display="flex" alignItems="center" mb={1.5}>
                          <LocationOnIcon sx={{ color: '#2ecc71', mr: 1 }} />
                          <Typography variant="subtitle2" color="#2ecc71" fontWeight={600}>
                            Miesta nakládky ({formData.loadingPlaces?.length || 0})
                          </Typography>
                        </Box>
                        <Box sx={{ maxHeight: 100, overflow: 'auto' }}>
                          {formData.loadingPlaces?.map((place, index) => (
                            <Box key={index} sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              mb: 0.5,
                              p: 1,
                              backgroundColor: 'rgba(46, 204, 113, 0.05)',
                              borderRadius: 1,
                              border: '1px solid rgba(46, 204, 113, 0.1)'
                            }}>
                              <Box sx={{ 
                                width: 6, 
                                height: 6, 
                                borderRadius: '50%', 
                                backgroundColor: '#2ecc71', 
                                mr: 1 
                              }} />
                              <Typography variant="body2" color="text.primary">
                                {place.city || 'Nezadané mesto'}
                              </Typography>
                            </Box>
                          )) || (
                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                              Žiadne miesta nakládky
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ 
                        p: 2.5, 
                        background: 'linear-gradient(135deg, rgba(231, 76, 60, 0.08) 0%, rgba(231, 76, 60, 0.03) 100%)',
                        borderRadius: 2,
                        border: '1px solid rgba(231, 76, 60, 0.15)'
                      }}>
                        <Box display="flex" alignItems="center" mb={1.5}>
                          <LocationOnIcon sx={{ color: '#e74c3c', mr: 1 }} />
                          <Typography variant="subtitle2" color="#e74c3c" fontWeight={600}>
                            Miesta vykládky ({formData.unloadingPlaces?.length || 0})
                          </Typography>
                        </Box>
                        <Box sx={{ maxHeight: 100, overflow: 'auto' }}>
                          {formData.unloadingPlaces?.map((place, index) => (
                            <Box key={index} sx={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              mb: 0.5,
                              p: 1,
                              backgroundColor: 'rgba(231, 76, 60, 0.05)',
                              borderRadius: 1,
                              border: '1px solid rgba(231, 76, 60, 0.1)'
                            }}>
                              <Box sx={{ 
                                width: 6, 
                                height: 6, 
                                borderRadius: '50%', 
                                backgroundColor: '#e74c3c', 
                                mr: 1 
                              }} />
                              <Typography variant="body2" color="text.primary">
                                {place.city || 'Nezadané mesto'}
                              </Typography>
                            </Box>
                          )) || (
                            <Typography variant="body2" color="text.secondary" fontStyle="italic">
                              Žiadne miesta vykládky
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Grid>
                  </Grid>
                </Grid>

                {/* Dispatcher Section */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Box display="flex" alignItems="center" mb={2}>
                    <AccountCircleIcon sx={{ color: '#ff9f43', mr: 1 }} />
                    <Typography variant="subtitle1" fontWeight={600}>
                      Dispeč
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Box sx={{ position: 'relative' }}>
                        {isEditingDispatcher ? (
                          <Autocomplete
                            options={Object.entries(teamMembers).map(([id, member]) => ({
                              id,
                              name: member.name
                            }))}
                            getOptionLabel={(option) => option.name}
                            value={editedDispatcher}
                            onChange={(_, newValue) => handleDispatcherChange(newValue)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                id="dispatcher-autocomplete"
                                name="dispatcher"
                                label="Dispeč"
                                fullWidth
                                InputProps={{
                                  ...params.InputProps,
                                  endAdornment: (
                                    <>
                                      <BareTooltip title="Uložiť">
                                        <IconButton
                                          size="small"
                                          onClick={handleSaveDispatcher}
                                          sx={{ color: '#4caf50', mr: 0.5 }}
                                        >
                                          <CheckIcon fontSize="small" />
                                        </IconButton>
                                      </BareTooltip>
                                      <BareTooltip title="Zrušiť">
                                        <IconButton
                                          size="small"
                                          onClick={handleCancelEditDispatcher}
                                          sx={{ color: '#f44336', mr: 1 }}
                                        >
                                          <CloseIcon fontSize="small" />
                                        </IconButton>
                                      </BareTooltip>
                                      {params.InputProps.endAdornment}
                                    </>
                                  ),
                                }}
                                autoFocus
                              />
                            )}
                          />
                        ) : (
                          <TextField
                            fullWidth
                            id="dispatcher-display"
                            name="dispatcherDisplay"
                            label="Dispeč"
                            value={formData.createdByName || 'Nezadaný'}
                            InputProps={{
                              readOnly: true,
                              endAdornment: (
                                <InputAdornment position="end">
                                  <BareTooltip title="Zmeniť dispeča">
                                    <IconButton
                                      size="small"
                                      onClick={handleStartEditDispatcher}
                                      sx={{ color: 'text.secondary' }}
                                    >
                                      <EditIcon fontSize="small" />
                                    </IconButton>
                                  </BareTooltip>
                                </InputAdornment>
                              ),
                            }}
                            sx={{
                              '& .MuiInputBase-input': {
                                cursor: 'pointer',
                              },
                            }}
                          />
                        )}
                      </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        id="created-at"
                        name="createdAt"
                        label="Dátum vytvorenia"
                        value={formData.datumPrijatia ? new Date(formData.datumPrijatia).toLocaleDateString('sk-SK') : new Date().toLocaleDateString('sk-SK')}
                        InputProps={{
                          readOnly: true,
                          startAdornment: (
                            <InputAdornment position="start">
                              <AccessTimeIcon sx={{ color: 'text.secondary' }} />
                            </InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </CardContent>
          </StyledCard>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CarrierStep; 