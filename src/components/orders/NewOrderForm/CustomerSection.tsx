import React from 'react';
import { Grid, Typography, TextField, Autocomplete, IconButton, useTheme } from '@mui/material';
import { OrderFormData } from '../../../types/orders';
import { Customer } from '../../../types/customers';
import { AutocompleteRenderInputParams } from '@mui/material/Autocomplete';
import type { FilterOptionsState } from '@mui/material/useAutocomplete';
import AddIcon from '@mui/icons-material/Add';

interface CustomerSectionProps {
    formData: Partial<OrderFormData>;
    customerOptions: Customer[];
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleCustomerAutocompleteChange: (event: React.SyntheticEvent, value: Customer | null) => void;
    handleAddNewCustomer: () => void;
}

const CustomerSection: React.FC<CustomerSectionProps> = ({
    formData,
    customerOptions,
    handleInputChange,
    handleCustomerAutocompleteChange,
    handleAddNewCustomer
}) => {
    const theme = useTheme();

    return (
        <>
            <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                    Údaje zákazníka
                </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
                <Autocomplete
                    options={customerOptions}
                    getOptionLabel={(option) => option.company}
                    value={formData.zakaznikData}
                    onChange={handleCustomerAutocompleteChange}
                    loading={false}
                    filterOptions={(options: Customer[], state: FilterOptionsState<Customer>): Customer[] => {
                        const inputValue = state.inputValue.toLowerCase();
                        return options.filter(option => {
                            const company = option.company?.toLowerCase() || '';
                            const contactName = option.contactName?.toLowerCase() || '';
                            const contactSurname = option.contactSurname?.toLowerCase() || '';
                            const email = option.email?.toLowerCase() || '';
                            const vatId = option.vatId?.toLowerCase() || '';
                            
                            return company.includes(inputValue) ||
                                contactName.includes(inputValue) ||
                                contactSurname.includes(inputValue) ||
                                email.includes(inputValue) ||
                                vatId.includes(inputValue);
                        });
                    }}
                    renderInput={(params: AutocompleteRenderInputParams) => (
                        <TextField
                            {...params}
                            label="Zákazník *"
                            required
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        <IconButton
                                            size="small"
                                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                e.stopPropagation();
                                                handleAddNewCustomer();
                                            }}
                                            sx={{ mr: 1 }}
                                        >
                                            <AddIcon />
                                        </IconButton>
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField 
                    fullWidth 
                    label="Kontaktná osoba" 
                    name="kontaktnaOsoba" 
                    value={formData.kontaktnaOsoba || ''} 
                    onChange={handleInputChange} 
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField 
                    fullWidth 
                    label="Splatnosť zákazníka (dni)" 
                    name="customerPaymentTermDays" 
                    type="number"
                    value={formData.customerPaymentTermDays || 30} 
                    InputProps={{
                        readOnly: true,
                    }}
                    helperText="Automaticky načítané zo zákazníka"
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField 
                    fullWidth 
                    label="IČ DPH" 
                    name="customerVatId" 
                    value={formData.customerVatId || ''} 
                    onChange={handleInputChange}
                    InputLabelProps={{
                        shrink: true,
                    }}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField 
                    fullWidth 
                    label="Ulica" 
                    name="customerStreet" 
                    value={formData.customerStreet || ''} 
                    onChange={handleInputChange} 
                />
            </Grid>
        </>
    );
};

export default CustomerSection; 