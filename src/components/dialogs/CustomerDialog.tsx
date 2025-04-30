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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Customer } from '../../types/customers';

interface CustomerDialogProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (customerData: Customer) => void;
}

const CustomerDialog: React.FC<CustomerDialogProps> = ({ open, onClose, onSubmit }) => {
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
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                Pridať nového zákazníka
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
                <DialogActions>
                    <Button onClick={onClose}>Zrušiť</Button>
                    <Button type="submit" variant="contained" color="primary">
                        Pridať zákazníka
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default CustomerDialog; 