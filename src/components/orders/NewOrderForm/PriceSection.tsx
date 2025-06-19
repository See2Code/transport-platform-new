import React from 'react';
import { Grid, Typography, TextField, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox, useTheme } from '@mui/material';
import { OrderFormData } from '../../../types/orders';
import { SelectChangeEvent } from '@mui/material/Select';

interface PriceSectionProps {
    formData: Partial<OrderFormData>;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSelectChange: (e: SelectChangeEvent<string>) => void;
}

const PriceSection: React.FC<PriceSectionProps> = ({ formData, handleInputChange, handleSelectChange }) => {
    const theme = useTheme();

    return (
        <>
            <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                    Cena
                </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
                <TextField 
                    fullWidth 
                    label="Suma *" 
                    name="suma" 
                    type="number" 
                    value={formData.suma || ''} 
                    onChange={handleInputChange} 
                    required 
                    inputProps={{ min: 0, step: "0.01" }} 
                />
            </Grid>
            <Grid item xs={6} sm={3}>
                <FormControl fullWidth required>
                    <InputLabel>Mena *</InputLabel>
                    <Select 
                        name="mena" 
                        value={formData.mena || 'EUR'} 
                        label="Mena *" 
                        onChange={handleSelectChange}
                    >
                        <MenuItem value="EUR">EUR</MenuItem>
                        <MenuItem value="CZK">CZK</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={6} sm={5}>
                <FormControlLabel 
                    control={
                        <Checkbox 
                            name="vyuctovaniePodlaMnozstva" 
                            checked={formData.vyuctovaniePodlaMnozstva || false} 
                            onChange={handleInputChange} 
                        />
                    } 
                    label="Vyúčtovanie podľa množstva" 
                />
            </Grid>
        </>
    );
};

export default PriceSection; 