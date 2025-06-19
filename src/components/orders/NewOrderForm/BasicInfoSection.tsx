import React from 'react';
import { Grid, Typography, useTheme } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { sk } from 'date-fns/locale';
import { OrderFormData } from '../../../types/orders';

interface BasicInfoSectionProps {
    formData: Partial<OrderFormData>;
    handleDateChange: (name: keyof OrderFormData) => (date: Date | null) => void;
}

const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({ formData, handleDateChange }) => {
    const theme = useTheme();

    return (
        <>
            <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                    Základné údaje
                </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                    <DatePicker 
                        label="Dátum prijatia *" 
                        value={formData.datumPrijatia} 
                        onChange={handleDateChange('datumPrijatia')} 
                        slotProps={{ textField: { fullWidth: true, required: true } }} 
                    />
                </LocalizationProvider>
            </Grid>
        </>
    );
};

export default BasicInfoSection; 