import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  CardContent,
  Chip,
  Collapse,
  Autocomplete,
  alpha
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';

// Icons
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BusinessIcon from '@mui/icons-material/Business';
import InventoryIcon from '@mui/icons-material/Inventory';
import PhoneIcon from '@mui/icons-material/Phone';

import { OrderFormData, LoadingPlace, UnloadingPlace } from '../../../types/orders';
import { countries } from '../../../constants/countries';
import { StyledAutocomplete, LocationCard } from './StyledComponents';
import BareTooltip from './BareTooltip';

interface CargoStepProps {
  formData: Partial<OrderFormData>;
  savedLocations: string[];
  savedGoods: string[];
  expandedLocationCards: { [key: string]: boolean };
  addLocation: (type: 'loading' | 'unloading') => void;
  removeLocation: (type: 'loading' | 'unloading', index: number) => void;
  duplicateLocation: (type: 'loading' | 'unloading', index: number) => void;
  updateLocation: (type: 'loading' | 'unloading', index: number, field: string, value: any) => void;
  toggleLocationCard: (type: 'loading' | 'unloading', index: number) => void;
  addGoods: (type: 'loading' | 'unloading', locationIndex: number) => void;
  removeGoods: (type: 'loading' | 'unloading', locationIndex: number, goodsIndex: number) => void;
  updateGoods: (type: 'loading' | 'unloading', locationIndex: number, goodsIndex: number, field: string, value: any) => void;
}

const CargoStep: React.FC<CargoStepProps> = ({
  formData,
  savedLocations,
  savedGoods,
  expandedLocationCards,
  addLocation,
  removeLocation,
  duplicateLocation,
  updateLocation,
  toggleLocationCard,
  addGoods,
  removeGoods,
  updateGoods
}) => {
  const { t } = useTranslation();

  const renderLocationCard = (type: 'loading' | 'unloading', place: LoadingPlace | UnloadingPlace, index: number) => {
    const cardKey = `${type}-${index}`;
    const isExpanded = expandedLocationCards[cardKey];
    const color = type === 'loading' ? '#2ecc71' : '#e74c3c';
    const places = formData[`${type}Places` as keyof typeof formData] as any[];

    return (
      <LocationCard key={place.id}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box display="flex" alignItems="center">
              <Chip
                label={`${type === 'loading' ? 'Nakládka' : 'Vykládka'} #${index + 1}`}
                size="small"
                sx={{ 
                  backgroundColor: alpha(color, 0.1), 
                  color: color,
                  fontWeight: 600
                }}
              />
              <Typography variant="body2" sx={{ ml: 2, color: 'text.secondary' }}>
                {place.city || 'Nezadané mesto'}
              </Typography>
            </Box>
            
            <Box>
              <BareTooltip title="Duplikovať">
                <IconButton
                  size="small"
                  onClick={() => duplicateLocation(type, index)}
                  sx={{ color: 'text.secondary' }}
                >
                  <ContentCopyIcon />
                </IconButton>
              </BareTooltip>
              
              <BareTooltip title="Rozbaliť/Zbaliť">
                <IconButton
                  size="small"
                  onClick={() => toggleLocationCard(type, index)}
                  sx={{ color: 'text.secondary' }}
                >
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </BareTooltip>
              
              {places.length > 1 && (
                <BareTooltip title="Odstrániť">
                  <IconButton
                    size="small"
                    onClick={() => removeLocation(type, index)}
                    sx={{ color: '#e74c3c' }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </BareTooltip>
              )}
            </Box>
          </Box>

          <Collapse in={isExpanded} timeout="auto">
            <Grid container spacing={2}>
              {/* Company Name */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id={`${type}-company-name-${index}`}
                  name={`${type}CompanyName${index}`}
                  label="Názov firmy *"
                  value={place.companyName || ''}
                  onChange={(e) => updateLocation(type, index, 'companyName', e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BusinessIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              {/* Location Details */}
              <Grid item xs={12} sm={6}>
                <StyledAutocomplete
                  freeSolo
                  options={savedLocations}
                  value={place.city}
                  onInputChange={(_, newValue) => updateLocation(type, index, 'city', newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      id={`${type}-city-${index}`}
                      name={`${type}City${index}`}
                      label={t('orders.city') + ' *'}
                      required
                      fullWidth
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id={`${type}-street-${index}`}
                  name={`${type}Street${index}`}
                  label={t('orders.street') + ' *'}
                  value={place.street}
                  onChange={(e) => updateLocation(type, index, 'street', e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <TextField
                  fullWidth
                  id={`${type}-zip-${index}`}
                  name={`${type}Zip${index}`}
                  label={t('orders.zipCode') + ' *'}
                  value={place.zip}
                  onChange={(e) => updateLocation(type, index, 'zip', e.target.value)}
                  required
                />
              </Grid>
              
              <Grid item xs={6} sm={3}>
                <Autocomplete
                  options={countries}
                  getOptionLabel={(option) => option.name}
                  value={countries.find(c => c.name === place.country) || null}
                  onChange={(_, newValue) => updateLocation(type, index, 'country', newValue?.name || 'Slovensko')}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      id={`${type}-country-${index}`}
                      name={`${type}Country${index}`}
                      label={t('orders.country') + ' *'}
                      required
                      fullWidth
                    />
                  )}
                />
              </Grid>
              
              {/* Date and Time */}
              <Grid item xs={12} sm={6}>
                <DateTimePicker
                  label={type === 'loading' ? 'Dátum a čas nakládky *' : 'Dátum a čas vykládky *'}
                  value={place.dateTime}
                  onChange={(newValue) => updateLocation(type, index, 'dateTime', newValue)}
                  slotProps={{ textField: { fullWidth: true, required: true } }}
                />
              </Grid>
              
              {/* Contact Person Name */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id={`${type}-contact-name-${index}`}
                  name={`${type}ContactName${index}`}
                  label={t('orders.contactPersonName') || 'Meno kontaktnej osoby'}
                  value={place.contactPersonName || ''}
                  onChange={(e) => updateLocation(type, index, 'contactPersonName', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              
              {/* Contact Person Phone */}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id={`${type}-contact-phone-${index}`}
                  name={`${type}ContactPhone${index}`}
                  label={t('orders.contactPersonPhone') || 'Telefón kontaktnej osoby'}
                  value={place.contactPersonPhone || ''}
                  onChange={(e) => updateLocation(type, index, 'contactPersonPhone', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Goods Section */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} mt={2}>
                  <Typography variant="subtitle1" fontWeight={600} sx={{ color: color }}>
                    <InventoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                    {t('orders.goods') || 'Tovar'}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<AddIcon />}
                    onClick={() => addGoods(type, index)}
                    sx={{ 
                      borderColor: color, 
                      color: color,
                      '&:hover': { borderColor: color, backgroundColor: alpha(color, 0.1) }
                    }}
                  >
                    {t('orders.addGoods') || 'Pridať tovar'}
                  </Button>
                </Box>

                {place.goods?.map((goods, goodsIndex) => (
                  <Box key={goods.id || goodsIndex} sx={{ mb: 2, p: 2, border: 1, borderColor: 'divider', borderRadius: 1 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="body2" fontWeight={500}>
                        Tovar #{goodsIndex + 1}
                      </Typography>
                      {place.goods && place.goods.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => removeGoods(type, index, goodsIndex)}
                          sx={{ color: '#e74c3c' }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                    
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <StyledAutocomplete
                          freeSolo
                          options={savedGoods}
                          value={goods.name || ''}
                          onInputChange={(_, newValue) => updateGoods(type, index, goodsIndex, 'name', newValue || '')}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label={t('orders.goodsName') + ' *'}
                              required
                              fullWidth
                            />
                          )}
                        />
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <TextField
                          fullWidth
                          label={t('orders.quantity') + ' *'}
                          type="text"
                          value={goods.quantity || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Povolíme len čísla a čiarku/bodku pre desatinné čísla
                            const cleanValue = value.replace(/[^0-9.,]/g, '').replace(',', '.');
                            const quantity = cleanValue === '' ? '' : parseFloat(cleanValue) || '';
                            updateGoods(type, index, goodsIndex, 'quantity', quantity);
                          }}
                          onKeyPress={(e) => {
                            const allowedKeys = /[0-9.,]/;
                            const specialKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                            
                            if (!allowedKeys.test(e.key) && !specialKeys.includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          required
                          placeholder="napr. 1 alebo 2,5"
                          sx={{
                            '& input[type=number]': {
                              '-moz-appearance': 'textfield',
                            },
                            '& input[type=number]::-webkit-outer-spin-button': {
                              '-webkit-appearance': 'none',
                              margin: 0,
                            },
                            '& input[type=number]::-webkit-inner-spin-button': {
                              '-webkit-appearance': 'none',
                              margin: 0,
                            },
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={6} sm={3}>
                        <TextField
                          fullWidth
                          select
                          label={t('orders.unit') || 'Jednotka'}
                          value={goods.unit || 'ks'}
                          onChange={(e) => updateGoods(type, index, goodsIndex, 'unit', e.target.value)}
                          SelectProps={{ native: true }}
                        >
                          <option value="ks">ks</option>
                          <option value="kg">kg</option>
                          <option value="t">t</option>
                          <option value="m³">m³</option>
                          <option value="m²">m²</option>
                          <option value="m">m</option>
                          <option value="l">l</option>
                          <option value="palety">palety</option>
                        </TextField>
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={t('orders.weight') || 'Hmotnosť (t)'}
                          type="text"
                          value={goods.weightText || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            const cleanValue = value.replace(/[^0-9.,]/g, '').replace(',', '.');
                            updateGoods(type, index, goodsIndex, 'weightText', cleanValue);
                            
                            if (cleanValue === '') {
                              updateGoods(type, index, goodsIndex, 'weight', undefined);
                              return;
                            }
                            
                            const weight = parseFloat(cleanValue);
                            if (!isNaN(weight)) {
                              updateGoods(type, index, goodsIndex, 'weight', weight);
                            }
                          }}
                          onKeyPress={(e) => {
                            const allowedKeys = /[0-9.,]/;
                            const specialKeys = ['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                            
                            if (!allowedKeys.test(e.key) && !specialKeys.includes(e.key)) {
                              e.preventDefault();
                            }
                          }}
                          placeholder="napr. 0,5 alebo 1,2"
                          sx={{
                            '& input[type=number]': {
                              '-moz-appearance': 'textfield',
                            },
                            '& input[type=number]::-webkit-outer-spin-button': {
                              '-webkit-appearance': 'none',
                              margin: 0,
                            },
                            '& input[type=number]::-webkit-inner-spin-button': {
                              '-webkit-appearance': 'none',
                              margin: 0,
                            },
                          }}
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label={t('orders.dimensions') || 'Rozmery'}
                          value={goods.dimensions || ''}
                          onChange={(e) => updateGoods(type, index, goodsIndex, 'dimensions', e.target.value)}
                          placeholder="napr. 120x80x100 cm"
                        />
                      </Grid>
                      
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          select
                          label={t('orders.palletExchange') || 'Výmena paliet'}
                          value={goods.palletExchange || 'Bez výmeny'}
                          onChange={(e) => updateGoods(type, index, goodsIndex, 'palletExchange', e.target.value)}
                          SelectProps={{ native: true }}
                        >
                          <option value="Bez výmeny">Bez výmeny</option>
                          <option value="1:1">1:1</option>
                          <option value="2:1">2:1</option>
                          <option value="Podľa dohody">Podľa dohody</option>
                        </TextField>
                      </Grid>
                      
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label={t('orders.goodsDescription') || 'Popis tovaru'}
                          value={goods.description || ''}
                          onChange={(e) => updateGoods(type, index, goodsIndex, 'description', e.target.value)}
                          placeholder="Dodatočné informácie o tovare..."
                        />
                      </Grid>
                    </Grid>
                  </Box>
                ))}
              </Grid>
            </Grid>
          </Collapse>
        </CardContent>
      </LocationCard>
    );
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom sx={{ color: '#ff9f43', fontWeight: 600, mb: 3 }}>
        <LocalShippingIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        {t('orders.cargoAndRoute') || 'Tovar a trasa'}
      </Typography>

      {/* Loading Places */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ color: '#2ecc71', fontWeight: 600 }}>
            <LocationOnIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {t('orders.loadingPlaces') || 'Miesta nakládky'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => addLocation('loading')}
            sx={{ 
              borderColor: '#2ecc71', 
              color: '#2ecc71',
              '&:hover': { borderColor: '#27ae60', backgroundColor: alpha('#2ecc71', 0.1) }
            }}
          >
            {t('orders.addLoading') || 'Pridať nakládku'}
          </Button>
        </Box>

        {formData.loadingPlaces?.map((place, index) => 
          renderLocationCard('loading', place, index)
        )}
      </Box>

      {/* Unloading Places */}
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" sx={{ color: '#e74c3c', fontWeight: 600 }}>
            <LocationOnIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
            {t('orders.unloadingPlaces') || 'Miesta vykládky'}
          </Typography>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => addLocation('unloading')}
            sx={{ 
              borderColor: '#e74c3c', 
              color: '#e74c3c',
              '&:hover': { borderColor: '#c0392b', backgroundColor: alpha('#e74c3c', 0.1) }
            }}
          >
            {t('orders.addUnloading') || 'Pridať vykládku'}
          </Button>
        </Box>

        {formData.unloadingPlaces?.map((place, index) => 
          renderLocationCard('unloading', place, index)
        )}
      </Box>
    </Box>
  );
};

export default CargoStep; 