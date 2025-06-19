import React from 'react';
import { Grid, Typography, TextField, FormControl, InputLabel, Select, MenuItem, useTheme } from '@mui/material';
import { OrderFormData } from '../../../types/orders';
import { SelectChangeEvent } from '@mui/material/Select';

interface CargoSectionProps {
    formData: Partial<OrderFormData>;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleSelectChange: (e: SelectChangeEvent<string>) => void;
}

const CargoSection: React.FC<CargoSectionProps> = ({ formData, handleInputChange, handleSelectChange }) => {
    const theme = useTheme();

    return (
        <>
            <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                    Náklad
                </Typography>
            </Grid>
            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label="Číslo nákladu zákazníka"
                    name="cisloNakladuZakaznika"
                    value={formData.cisloNakladuZakaznika || ''}
                    onChange={handleInputChange}
                    placeholder="Referenčné číslo zákazníka"
                />
            </Grid>
            <Grid item xs={12}>
                <TextField
                    fullWidth
                    label="Interná poznámka"
                    name="internaPoznamka"
                    value={formData.internaPoznamka || ''}
                    onChange={handleInputChange}
                    multiline
                    rows={2}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                    <InputLabel id="navesLabel">Vyžaduje sa typ návesu</InputLabel>
                    <Select
                        labelId="navesLabel"
                        name="vyzadujeSaTypNavesu"
                        value={formData.vyzadujeSaTypNavesu || ''}
                        label="Vyžaduje sa typ návesu"
                        onChange={handleSelectChange}
                    >
                        <MenuItem value=""><em>Žiadny</em></MenuItem>
                        <MenuItem value="plachta">Plachta</MenuItem>
                        <MenuItem value="skriňa">Skriňa</MenuItem>
                        <MenuItem value="chladiak">Chladiarenský</MenuItem>
                        <MenuItem value="mraziak">Mraziarenský</MenuItem>
                        <MenuItem value="specialny">Špeciálny</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField
                    fullWidth
                    label="Požiadavky"
                    name="poziadavky"
                    placeholder="Napr. GPS, Pásy, ADR..."
                    value={formData.poziadavky || ''}
                    onChange={handleInputChange}
                />
            </Grid>
            <Grid item xs={12}></Grid>
        </>
    );
};

export default CargoSection; 