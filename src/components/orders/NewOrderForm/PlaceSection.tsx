import React from 'react';
import { Grid, Typography, TextField, Box, Button, Autocomplete, IconButton, Divider, FormControl, InputLabel, Select, MenuItem, useTheme, SelectChangeEvent } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { sk } from 'date-fns/locale';
import { countries } from '../../../constants/countries';
import { OrderFormData, LoadingPlace, UnloadingPlace, GoodsItem } from '../../../types/orders';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';

interface PlaceSectionProps {
    type: 'loading' | 'unloading';
    formData: Partial<OrderFormData>;
    handlePlaceInputChange: (type: 'loading' | 'unloading', index: number, field: keyof LoadingPlace | keyof UnloadingPlace) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handlePlaceAutocompleteChange: (type: 'loading' | 'unloading', index: number, field: keyof LoadingPlace | keyof UnloadingPlace) => (event: React.SyntheticEvent, value: any) => void;
    handleDateTimeChange: (type: 'loading' | 'unloading', index: number) => (date: Date | null) => void;
    handleGoodsChange: (type: 'loading' | 'unloading', placeIndex: number, goodsIndex: number, field: keyof GoodsItem) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => void;
    addPlace: (type: 'loading' | 'unloading') => void;
    addGoodsItem: (type: 'loading' | 'unloading', placeIndex: number) => void;
    removeGoodsItem: (type: 'loading' | 'unloading', placeIndex: number, goodsIndex: number) => void;
}

const PlaceSection: React.FC<PlaceSectionProps> = ({
    type,
    formData,
    handlePlaceInputChange,
    handlePlaceAutocompleteChange,
    handleDateTimeChange,
    handleGoodsChange,
    addPlace,
    addGoodsItem,
    removeGoodsItem
}) => {
    const theme = useTheme();
    const places = type === 'loading' ? formData.loadingPlaces : formData.unloadingPlaces;
    const title = type === 'loading' ? 'Body Nakládky' : 'Body Vykládky';
    const addButtonText = type === 'loading' ? 'Pridať Nakládku' : 'Pridať Vykládku';
    const placeTitle = type === 'loading' ? 'Nakládka' : 'Vykládka';
    const goodsTitle = type === 'loading' ? 'Tovar na naloženie:' : 'Tovar na vyloženie:';
    const dateTimeLabel = type === 'loading' ? 'Dátum a čas nakládky *' : 'Dátum a čas vykládky *';

    return (
        <>
            <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, mb: 1 }}>
                    <Typography variant="subtitle1" sx={{ color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                        {title}
                    </Typography>
                    <Button 
                        variant="outlined"
                        startIcon={<AddIcon />} 
                        onClick={() => addPlace(type)} 
                        sx={{ 
                             borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 159, 67, 0.5)' : '#ff9f43',
                             color: '#ff9f43', 
                             '&:hover': {
                                 borderColor: '#ff9f43',
                                 backgroundColor: 'rgba(255, 159, 67, 0.08)'
                             }
                        }}
                    >
                        {addButtonText}
                    </Button>
                </Box>
            </Grid>
            {places?.map((place, index) => (
                <Grid item xs={12} key={place.id || index}>
                   <Box sx={{ p: 2, mb: 1, position: 'relative' }}>
                        <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}> {placeTitle} #{index + 1} </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField 
                                    fullWidth 
                                    label="Ulica a číslo *" 
                                    value={place.street} 
                                    onChange={handlePlaceInputChange(type, index, 'street')} 
                                    required 
                                />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <TextField 
                                    fullWidth 
                                    label="Mesto *" 
                                    value={place.city} 
                                    onChange={handlePlaceInputChange(type, index, 'city')} 
                                    required 
                                />
                            </Grid>
                            <Grid item xs={6} sm={3}>
                                <TextField 
                                    fullWidth 
                                    label="PSČ *" 
                                    value={place.zip} 
                                    onChange={handlePlaceInputChange(type, index, 'zip')} 
                                    required 
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <Autocomplete 
                                    options={countries} 
                                    getOptionLabel={(o) => o.name} 
                                    value={countries.find(c=>c.name === place.country) || null} 
                                    onChange={handlePlaceAutocompleteChange(type, index, 'country')} 
                                    renderInput={(params) => <TextField {...params} label="Krajina *" required />} 
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                                    <DateTimePicker 
                                        label={dateTimeLabel} 
                                        value={place.dateTime as Date | null} 
                                        onChange={handleDateTimeChange(type, index)} 
                                        slotProps={{ textField: { fullWidth: true, required: true } }}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField 
                                    fullWidth 
                                    label="Meno kontaktnej osoby *" 
                                    value={place.contactPersonName} 
                                    onChange={handlePlaceInputChange(type, index, 'contactPersonName')} 
                                    required 
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField 
                                    fullWidth 
                                    label="Telefón kontaktnej osoby *" 
                                    value={place.contactPersonPhone} 
                                    onChange={handlePlaceInputChange(type, index, 'contactPersonPhone')} 
                                    required 
                                    placeholder="+421 XXX XXX XXX" 
                                />
                            </Grid>
                        </Grid>
                         {/* Goods Items Section */}
                        <Box sx={{ mt: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 500, color: theme.palette.text.secondary }}>
                                    {goodsTitle}
                                </Typography>
                                <Button 
                                    variant="text"
                                    startIcon={<AddIcon />} 
                                    onClick={() => addGoodsItem(type, index)}
                                    sx={{ color: '#ff9f43' }}
                                >
                                    Pridať tovar
                                </Button>
                            </Box>
                            
                            {place.goods?.map((item, goodsIndex) => (
                                <Box 
                                    key={item.id || goodsIndex}
                                    sx={{ mb: 2, pt: 1, position: 'relative' }} 
                                >
                                    <Typography variant="caption" sx={{ mb: 1, display: 'block' }}> 
                                        Tovar #{goodsIndex + 1}
                                        {place.goods && place.goods.length > 1 && (
                                            <IconButton 
                                                size="small" 
                                                onClick={() => removeGoodsItem(type, index, goodsIndex)} 
                                                color="error"
                                                sx={{ position: 'absolute', top: 0, right: 0 }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </Typography>
                                    
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField 
                                                label="Názov tovaru *" 
                                                value={item.name} 
                                                onChange={handleGoodsChange(type, index, goodsIndex, 'name')} 
                                                required 
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <TextField 
                                                label="Množstvo *" 
                                                type="number" 
                                                value={item.quantity} 
                                                onChange={handleGoodsChange(type, index, goodsIndex, 'quantity')} 
                                                required 
                                                inputProps={{step: 0.01}} 
                                                fullWidth
                                            />
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <FormControl fullWidth>
                                                <InputLabel>Jednotka *</InputLabel>
                                                <Select 
                                                    value={item.unit} 
                                                    label="Jednotka *" 
                                                    onChange={handleGoodsChange(type, index, goodsIndex, 'unit')} 
                                                    required
                                                >
                                                    <MenuItem value="ks">ks</MenuItem>
                                                    <MenuItem value="pal">pal</MenuItem>
                                                    <MenuItem value="kg">kg</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        {type === 'loading' && (
                                            <Grid item xs={12} sm={6}>
                                                <FormControl fullWidth>
                                                    <InputLabel>Výmena paliet</InputLabel>
                                                    <Select 
                                                        value={item.palletExchange} 
                                                        label="Výmena paliet" 
                                                        onChange={handleGoodsChange(type, index, goodsIndex, 'palletExchange')}
                                                    >
                                                        <MenuItem value="Bez výmeny">Bez výmeny</MenuItem>
                                                        <MenuItem value="Výmena">Výmena</MenuItem>
                                                    </Select>
                                                </FormControl>
                                            </Grid>
                                        )}
                                        {type === 'loading' && (
                                            <Grid item xs={12} sm={6}>
                                                <TextField 
                                                    label="Rozmer" 
                                                    value={item.dimensions} 
                                                    onChange={handleGoodsChange(type, index, goodsIndex, 'dimensions')} 
                                                    fullWidth
                                                />
                                            </Grid>
                                        )}
                                        <Grid item xs={12}>
                                            <TextField 
                                                label="Popis tovaru" 
                                                value={item.description} 
                                                onChange={handleGoodsChange(type, index, goodsIndex, 'description')} 
                                                fullWidth
                                            />
                                        </Grid>
                                    </Grid>
                                    {place.goods && goodsIndex < place.goods.length - 1 && (
                                         <Divider sx={{ my: 2 }} />
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </Box>
                </Grid>
            ))}
        </>
    );
};

export default PlaceSection; 