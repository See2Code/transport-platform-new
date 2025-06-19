import React from 'react';
import { Grid, Typography, TextField, Autocomplete, IconButton, Box, InputAdornment, Tooltip, useTheme, CircularProgress } from '@mui/material';
import { OrderFormData } from '../../../types/orders';
import { Carrier } from '../../../types/carriers';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface CarrierSectionProps {
    formData: Partial<OrderFormData>;
    carriers: Carrier[];
    isCarrierLoading: boolean;
    isEditingCarrierPaymentTerms: boolean;
    userData: any;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    handleCarrierAutocompleteChange: (event: React.SyntheticEvent, value: Carrier | null) => void;
    setIsCarrierDialogOpen: (open: boolean) => void;
    setIsEditingCarrierPaymentTerms: (editing: boolean) => void;
    handleStartEditCarrierPaymentTerms: () => void;
    handleCancelEditCarrierPaymentTerms: () => void;
    handleCarrierPaymentTermsChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const CarrierSection: React.FC<CarrierSectionProps> = ({
    formData,
    carriers,
    isCarrierLoading,
    isEditingCarrierPaymentTerms,
    userData,
    handleInputChange,
    handleCarrierAutocompleteChange,
    setIsCarrierDialogOpen,
    setIsEditingCarrierPaymentTerms,
    handleStartEditCarrierPaymentTerms,
    handleCancelEditCarrierPaymentTerms,
    handleCarrierPaymentTermsChange
}) => {
    const theme = useTheme();

    return (
        <>
            <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mt: 3, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
                    Dopravca (Vykonávateľ)
                </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
                <Autocomplete
                    options={carriers}
                    getOptionLabel={(option) => option.companyName}
                    value={carriers.find(c => c.companyName === formData.carrierCompany) || null}
                    onChange={handleCarrierAutocompleteChange}
                    loading={isCarrierLoading}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Názov firmy dopravcu"
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {isCarrierLoading ? <CircularProgress color="inherit" size={20} /> : null}
                                        <IconButton
                                            size="small"
                                            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                                                e.stopPropagation();
                                                setIsCarrierDialogOpen(true);
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
            <Grid item xs={12} sm={6}>
                <TextField 
                    fullWidth 
                    label="Kontakt na dopravcu" 
                    name="carrierContact" 
                    value={formData.carrierContact || ''} 
                    onChange={handleInputChange} 
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField 
                    fullWidth 
                    label="EČV Vozidla" 
                    name="carrierVehicleReg" 
                    value={formData.carrierVehicleReg || ''} 
                    onChange={handleInputChange} 
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <TextField 
                    fullWidth 
                    label="Cena za prepravu (€)" 
                    name="carrierPrice" 
                    type="number" 
                    value={formData.carrierPrice || ''} 
                    onChange={handleInputChange} 
                    inputProps={{ min: 0, step: "0.01" }}
                />
            </Grid>
            <Grid item xs={12} sm={6}>
                <Box sx={{ position: 'relative' }}>
                    {isEditingCarrierPaymentTerms ? (
                        <TextField
                            fullWidth
                            label="Splatnosť dopravcu (dni)"
                            type="number"
                            value={formData.carrierPaymentTermDays || 60}
                            onChange={handleCarrierPaymentTermsChange}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="Uložiť">
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setIsEditingCarrierPaymentTerms(false)}
                                                    sx={{ color: '#4caf50' }}
                                                >
                                                    <CheckIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Zrušiť">
                                                <IconButton
                                                    size="small"
                                                    onClick={handleCancelEditCarrierPaymentTerms}
                                                    sx={{ color: '#f44336' }}
                                                >
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </InputAdornment>
                                ),
                            }}
                            inputProps={{ min: 1, max: 365 }}
                            autoFocus
                        />
                    ) : (
                        <TextField
                            fullWidth
                            label="Splatnosť dopravcu (dni)"
                            value={formData.carrierPaymentTermDays || 60}
                            InputProps={{
                                readOnly: true,
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <AccessTimeIcon sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: userData?.role === 'admin' ? (
                                    <InputAdornment position="end">
                                        <Tooltip title="Upraviť splatnosť pre túto objednávku">
                                            <IconButton
                                                size="small"
                                                onClick={handleStartEditCarrierPaymentTerms}
                                                sx={{ color: '#ff9f43' }}
                                            >
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </Tooltip>
                                    </InputAdornment>
                                ) : null,
                            }}
                            helperText={userData?.role === 'admin' 
                                ? "Kliknite na ikonu pera pre úpravu len tejto objednávky" 
                                : "Automaticky načítané z dopravcu"
                            }
                        />
                    )}
                </Box>
            </Grid>
        </>
    );
};

export default CarrierSection; 