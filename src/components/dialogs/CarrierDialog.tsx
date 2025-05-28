import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    IconButton,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Carrier } from '../../types/carriers';

interface CarrierDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (carrierData: Carrier) => void;
}

const vehicleTypes = [
    'Plachta',
    'Skriňa',
    'Chladiarenský',
    'Mraziarenský',
    'Špeciálny',
];

const CarrierDialog: React.FC<CarrierDialogProps> = ({ open, onClose, onSubmit }) => {
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleVehicleTypesChange = (event: any) => {
        const { value } = event.target;
        setFormData(prev => ({
            ...prev,
            vehicleTypes: typeof value === 'string' ? value.split(',') : value,
        }));
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
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Pridať nového dopravcu
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    <Grid container spacing={2}>
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
                                label="Telefón"
                                name="contactPhone"
                                value={formData.contactPhone}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="IČO"
                                name="ico"
                                value={formData.ico}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="DIČ"
                                name="dic"
                                value={formData.dic}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="IČ DPH"
                                name="icDph"
                                value={formData.icDph}
                                onChange={handleChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                fullWidth
                                label="Splatnosť (dni)"
                                name="paymentTermDays"
                                type="number"
                                value={formData.paymentTermDays || 60}
                                onChange={handleChange}
                                helperText="Počet dní na úhradu faktúry"
                                inputProps={{ min: 1, max: 365 }}
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Typy vozidiel</InputLabel>
                                <Select
                                    multiple
                                    name="vehicleTypes"
                                    value={formData.vehicleTypes || []}
                                    onChange={handleVehicleTypesChange}
                                    renderValue={(selected) => (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {(selected as string[]).map((value) => (
                                                <Chip key={value} label={value} />
                                            ))}
                                        </Box>
                                    )}
                                >
                                    {vehicleTypes.map((type) => (
                                        <MenuItem key={type} value={type}>
                                            {type}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Poznámky"
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                multiline
                                rows={4}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Zrušiť</Button>
                    <Button type="submit" variant="contained" color="primary">
                        Pridať dopravcu
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default CarrierDialog; 