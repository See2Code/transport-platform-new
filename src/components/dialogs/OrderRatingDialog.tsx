import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Box,
    Typography,
    IconButton,
    Divider,
    Alert,
    Rating,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ChatIcon from '@mui/icons-material/Chat';
import HighQualityIcon from '@mui/icons-material/HighQuality';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PaymentIcon from '@mui/icons-material/Payment';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssignmentIcon from '@mui/icons-material/Assignment';
import { OrderFormData, OrderRating } from '../../types/orders';
import { Customer } from '../../types/customers';
import { Carrier } from '../../types/carriers';
import { useThemeMode } from '../../contexts/ThemeContext';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { styled } from '@mui/material/styles';

interface OrderRatingDialogProps {
    open: boolean;
    onClose: () => void;
    order: OrderFormData;
    customer?: Customer;
    carrier?: Carrier;
    onSubmit: (rating: OrderRating) => void;
}

const StyledRating = styled(Rating)(() => ({
    '& .MuiRating-iconFilled': {
        color: '#ff9f43',
    },
    '& .MuiRating-iconHover': {
        color: '#ffa726',
    },
    '& .MuiRating-icon': {
        fontSize: '1.8rem',
    }
}));

const RatingBox = styled(Box)(({ theme }) => ({
    padding: theme.spacing(2),
    borderRadius: theme.spacing(2),
    backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.05)' 
        : 'rgba(0, 0, 0, 0.02)',
    border: `1px solid ${theme.palette.mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.1)' 
        : 'rgba(0, 0, 0, 0.1)'}`,
    marginBottom: theme.spacing(1.5)
}));

const OrderRatingDialog: React.FC<OrderRatingDialogProps> = ({
    open,
    onClose,
    order,
    customer: _customer,
    carrier: _carrier,
    onSubmit
}) => {
    const { isDarkMode } = useThemeMode();
    const { userData } = useAuth();
    
    // Hodnotenie dopravcu pre túto prepravu
    const [carrierReliability, setCarrierReliability] = useState<number>(order.rating?.carrierReliability || 0);
    const [carrierCommunication, setCarrierCommunication] = useState<number>(order.rating?.carrierCommunication || 0);
    const [carrierServiceQuality, setCarrierServiceQuality] = useState<number>(order.rating?.carrierServiceQuality || 0);
    const [carrierTimeManagement, setCarrierTimeManagement] = useState<number>(order.rating?.carrierTimeManagement || 0);
    
    // Hodnotenie zákazníka pre túto prepravu
    const [customerPaymentReliability, setCustomerPaymentReliability] = useState<number>(order.rating?.customerPaymentReliability || 0);
    const [customerCommunication, setCustomerCommunication] = useState<number>(order.rating?.customerCommunication || 0);
    const [customerOverallSatisfaction, setCustomerOverallSatisfaction] = useState<number>(order.rating?.customerOverallSatisfaction || 0);
    
    // Celkové hodnotenie prepravy - vypočíta sa automaticky
    const [notes, setNotes] = useState<string>(order.rating?.notes || '');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (order.rating) {
            setCarrierReliability(order.rating.carrierReliability || 0);
            setCarrierCommunication(order.rating.carrierCommunication || 0);
            setCarrierServiceQuality(order.rating.carrierServiceQuality || 0);
            setCarrierTimeManagement(order.rating.carrierTimeManagement || 0);
            setCustomerPaymentReliability(order.rating.customerPaymentReliability || 0);
            setCustomerCommunication(order.rating.customerCommunication || 0);
            setCustomerOverallSatisfaction(order.rating.customerOverallSatisfaction || 0);
            setNotes(order.rating.notes || '');
        }
    }, [order]);

    const handleSubmit = () => {
        const carrierAverageRating = (carrierReliability + carrierCommunication + carrierServiceQuality + carrierTimeManagement) / 4;
        const customerAverageRating = (customerPaymentReliability + customerCommunication + customerOverallSatisfaction) / 3;
        const overallTransportRating = (carrierAverageRating + customerAverageRating) / 2;
        
        const rating: OrderRating = {
            carrierReliability,
            carrierCommunication,
            carrierServiceQuality,
            carrierTimeManagement,
            customerPaymentReliability,
            customerCommunication,
            customerOverallSatisfaction,
            overallTransportRating,
            notes,
            lastUpdated: Timestamp.now(),
            ratedBy: userData?.uid || 'unknown',
            carrierAverageRating,
            customerAverageRating
        };
        
        onSubmit(rating);
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            onClose();
        }, 1500);
    };

    const averageCarrierRating = (carrierReliability + carrierCommunication + carrierServiceQuality + carrierTimeManagement) / 4;
    const averageCustomerRating = (customerPaymentReliability + customerCommunication + customerOverallSatisfaction) / 3;
    const overallTransportRating = (averageCarrierRating + averageCustomerRating) / 2;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    background: 'none',
                    boxShadow: 'none',
                    borderRadius: '24px'
                }
            }}
            BackdropProps={{
                sx: {
                    backdropFilter: 'blur(8px)',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)'
                }
            }}
        >
            <Box
                sx={{
                    backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
                    borderRadius: '24px',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                }}
            >
                <DialogTitle sx={{ 
                    p: 3, 
                    pb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AssignmentIcon sx={{ color: '#ff9f43' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Hodnotenie prepravy
                        </Typography>
                    </Box>
                    <IconButton onClick={onClose} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <Divider sx={{ borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />

                <DialogContent sx={{ p: 3 }}>
                    {showSuccess && (
                        <Alert severity="success" sx={{ mb: 2 }}>
                            Hodnotenie prepravy bolo úspešne uložené!
                        </Alert>
                    )}

                    {/* Informácie o objednávke */}
                    <Box sx={{ mb: 3, p: 2, backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.1)' : 'rgba(255, 159, 67, 0.05)', borderRadius: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: '#ff9f43' }}>
                            Objednávka #{order.orderNumberFormatted || order.id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Zákazník: {order.customerCompany || order.zakaznik} • Dopravca: {order.carrierCompany}
                        </Typography>
                    </Box>

                    {/* Hodnotenie dopravcu */}
                    <Accordion defaultExpanded sx={{ mb: 2, backgroundColor: 'transparent', boxShadow: 'none' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LocalShippingIcon sx={{ color: '#ff9f43' }} />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Hodnotenie dopravcu ({order.carrierCompany})
                                </Typography>
                                {averageCarrierRating > 0 && (
                                    <Typography variant="body2" sx={{ ml: 1, color: '#ff9f43', fontWeight: 600 }}>
                                        ⭐ {averageCarrierRating.toFixed(1)}
                                    </Typography>
                                )}
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <RatingBox>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <LocalShippingIcon sx={{ color: '#ff9f43', fontSize: '1.2rem' }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        Spoľahlivosť
                                    </Typography>
                                </Box>
                                <StyledRating
                                    value={carrierReliability}
                                    onChange={(_event: React.SyntheticEvent, newValue: number | null) => setCarrierReliability(newValue || 0)}
                                    icon={<StarIcon fontSize="inherit" />}
                                    emptyIcon={<StarIcon fontSize="inherit" />}
                                />
                            </RatingBox>

                            <RatingBox>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <ChatIcon sx={{ color: '#ff9f43', fontSize: '1.2rem' }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        Komunikácia
                                    </Typography>
                                </Box>
                                <StyledRating
                                    value={carrierCommunication}
                                    onChange={(_event: React.SyntheticEvent, newValue: number | null) => setCarrierCommunication(newValue || 0)}
                                    icon={<StarIcon fontSize="inherit" />}
                                    emptyIcon={<StarIcon fontSize="inherit" />}
                                />
                            </RatingBox>

                            <RatingBox>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <HighQualityIcon sx={{ color: '#ff9f43', fontSize: '1.2rem' }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        Kvalita služieb
                                    </Typography>
                                </Box>
                                <StyledRating
                                    value={carrierServiceQuality}
                                    onChange={(_event: React.SyntheticEvent, newValue: number | null) => setCarrierServiceQuality(newValue || 0)}
                                    icon={<StarIcon fontSize="inherit" />}
                                    emptyIcon={<StarIcon fontSize="inherit" />}
                                />
                            </RatingBox>

                            <RatingBox>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <AccessTimeIcon sx={{ color: '#ff9f43', fontSize: '1.2rem' }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        Dodržiavanie termínov
                                    </Typography>
                                </Box>
                                <StyledRating
                                    value={carrierTimeManagement}
                                    onChange={(_event: React.SyntheticEvent, newValue: number | null) => setCarrierTimeManagement(newValue || 0)}
                                    icon={<StarIcon fontSize="inherit" />}
                                    emptyIcon={<StarIcon fontSize="inherit" />}
                                />
                            </RatingBox>
                        </AccordionDetails>
                    </Accordion>

                    {/* Hodnotenie zákazníka */}
                    <Accordion defaultExpanded sx={{ mb: 2, backgroundColor: 'transparent', boxShadow: 'none' }}>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PaymentIcon sx={{ color: '#ff9f43' }} />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Hodnotenie zákazníka ({order.customerCompany || order.zakaznik})
                                </Typography>
                                {averageCustomerRating > 0 && (
                                    <Typography variant="body2" sx={{ ml: 1, color: '#ff9f43', fontWeight: 600 }}>
                                        ⭐ {averageCustomerRating.toFixed(1)}
                                    </Typography>
                                )}
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                            <RatingBox>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <PaymentIcon sx={{ color: '#ff9f43', fontSize: '1.2rem' }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        Platobná spoľahlivosť
                                    </Typography>
                                </Box>
                                <StyledRating
                                    value={customerPaymentReliability}
                                    onChange={(_event: React.SyntheticEvent, newValue: number | null) => setCustomerPaymentReliability(newValue || 0)}
                                    icon={<StarIcon fontSize="inherit" />}
                                    emptyIcon={<StarIcon fontSize="inherit" />}
                                />
                            </RatingBox>

                            <RatingBox>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <ChatIcon sx={{ color: '#ff9f43', fontSize: '1.2rem' }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        Komunikácia
                                    </Typography>
                                </Box>
                                <StyledRating
                                    value={customerCommunication}
                                    onChange={(_event: React.SyntheticEvent, newValue: number | null) => setCustomerCommunication(newValue || 0)}
                                    icon={<StarIcon fontSize="inherit" />}
                                    emptyIcon={<StarIcon fontSize="inherit" />}
                                />
                            </RatingBox>

                            <RatingBox>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                    <SentimentSatisfiedAltIcon sx={{ color: '#ff9f43', fontSize: '1.2rem' }} />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                        Celková spokojnosť
                                    </Typography>
                                </Box>
                                <StyledRating
                                    value={customerOverallSatisfaction}
                                    onChange={(_event: React.SyntheticEvent, newValue: number | null) => setCustomerOverallSatisfaction(newValue || 0)}
                                    icon={<StarIcon fontSize="inherit" />}
                                    emptyIcon={<StarIcon fontSize="inherit" />}
                                />
                            </RatingBox>
                        </AccordionDetails>
                    </Accordion>

                    {/* Celkové hodnotenie prepravy */}
                    <Box sx={{ 
                        mt: 3, 
                        p: 3, 
                        borderRadius: 2, 
                        backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.15)' : 'rgba(255, 159, 67, 0.1)',
                        border: `2px solid #ff9f43`,
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <StarIcon sx={{ color: '#ff9f43' }} />
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                Celkové hodnotenie prepravy
                            </Typography>
                            {overallTransportRating > 0 && (
                                <Typography variant="body2" sx={{ ml: 1, color: '#ff9f43', fontWeight: 600 }}>
                                    ⭐ {overallTransportRating.toFixed(1)}
                                </Typography>
                            )}
                        </Box>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontStyle: 'italic' }}>
                            Automaticky vypočítané ako priemer hodnotenia dopravcu a zákazníka
                        </Typography>
                        <StyledRating
                            value={overallTransportRating}
                            readOnly
                            size="large"
                            icon={<StarIcon fontSize="inherit" />}
                            emptyIcon={<StarIcon fontSize="inherit" />}
                        />
                    </Box>

                    {/* Poznámky */}
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Poznámky k preprave"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Pridajte poznámky k hodnoteniu tejto prepravy..."
                        sx={{ mt: 3 }}
                    />
                </DialogContent>

                <Divider sx={{ borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />

                <DialogActions sx={{ p: 3, pt: 2 }}>
                    <Button 
                        onClick={onClose}
                        sx={{ 
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                            '&:hover': { 
                                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' 
                            }
                        }}
                    >
                        Zrušiť
                    </Button>
                    <Button 
                        onClick={handleSubmit}
                        variant="contained"
                        sx={{
                            backgroundColor: '#ff9f43',
                            color: '#ffffff',
                            '&:hover': { backgroundColor: '#f7b067' }
                        }}
                    >
                        Uložiť hodnotenie
                    </Button>
                </DialogActions>
            </Box>
        </Dialog>
    );
};

export default OrderRatingDialog; 