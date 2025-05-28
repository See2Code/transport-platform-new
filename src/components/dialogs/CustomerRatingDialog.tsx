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
    Rating
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import StarIcon from '@mui/icons-material/Star';
import PaymentIcon from '@mui/icons-material/Payment';
import ChatIcon from '@mui/icons-material/Chat';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import { Customer, CustomerRating } from '../../types/customers';
import { useThemeMode } from '../../contexts/ThemeContext';
import { Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { styled } from '@mui/material/styles';

interface CustomerRatingDialogProps {
    open: boolean;
    onClose: () => void;
    customer: Customer;
    onSubmit: (rating: CustomerRating) => void;
}

const StyledRating = styled(Rating)(() => ({
    '& .MuiRating-iconFilled': {
        color: '#ff9f43',
    },
    '& .MuiRating-iconHover': {
        color: '#ffa726',
    },
    '& .MuiRating-icon': {
        fontSize: '2rem',
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
    marginBottom: theme.spacing(2)
}));

const CustomerRatingDialog: React.FC<CustomerRatingDialogProps> = ({
    open,
    onClose,
    customer,
    onSubmit
}) => {
    const { isDarkMode } = useThemeMode();
    const { userData } = useAuth();
    
    const [paymentReliability, setPaymentReliability] = useState<number>(customer.rating?.paymentReliability || 0);
    const [communication, setCommunication] = useState<number>(customer.rating?.communication || 0);
    const [overallSatisfaction, setOverallSatisfaction] = useState<number>(customer.rating?.overallSatisfaction || 0);
    const [notes, setNotes] = useState<string>(customer.rating?.notes || '');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (customer.rating) {
            setPaymentReliability(customer.rating.paymentReliability || 0);
            setCommunication(customer.rating.communication || 0);
            setOverallSatisfaction(customer.rating.overallSatisfaction || 0);
            setNotes(customer.rating.notes || '');
        }
    }, [customer]);

    const handleSubmit = () => {
        const rating: CustomerRating = {
            paymentReliability,
            communication,
            overallSatisfaction,
            notes,
            lastUpdated: Timestamp.now(),
            ratedBy: userData?.uid || 'unknown'
        };
        
        onSubmit(rating);
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            onClose();
        }, 1500);
    };

    const averageRating = (paymentReliability + communication + overallSatisfaction) / 3;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
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
                        <StarIcon sx={{ color: '#ff9f43' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            Hodnotenie zákazníka
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
                            Hodnotenie bolo úspešne uložené!
                        </Alert>
                    )}

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                            {customer.company}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {customer.contactName} {customer.contactSurname}
                        </Typography>
                    </Box>

                    {/* Platobná spoľahlivosť */}
                    <RatingBox>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <PaymentIcon sx={{ color: '#ff9f43' }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Platobná spoľahlivosť
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Ako hodnotíte platobnú disciplínu tohto zákazníka?
                        </Typography>
                        <StyledRating
                            value={paymentReliability}
                            onChange={(_event: React.SyntheticEvent, newValue: number | null) => setPaymentReliability(newValue || 0)}
                            size="large"
                            icon={<StarIcon fontSize="inherit" />}
                            emptyIcon={<StarIcon fontSize="inherit" />}
                        />
                    </RatingBox>

                    {/* Komunikácia */}
                    <RatingBox>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <ChatIcon sx={{ color: '#ff9f43' }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Komunikácia
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Kvalita a rýchlosť komunikácie so zákazníkom
                        </Typography>
                        <StyledRating
                            value={communication}
                            onChange={(_event: React.SyntheticEvent, newValue: number | null) => setCommunication(newValue || 0)}
                            size="large"
                            icon={<StarIcon fontSize="inherit" />}
                            emptyIcon={<StarIcon fontSize="inherit" />}
                        />
                    </RatingBox>

                    {/* Celková spokojnosť */}
                    <RatingBox>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <SentimentSatisfiedAltIcon sx={{ color: '#ff9f43' }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Celková spokojnosť
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Vaša celková spokojnosť s týmto zákazníkom
                        </Typography>
                        <StyledRating
                            value={overallSatisfaction}
                            onChange={(_event: React.SyntheticEvent, newValue: number | null) => setOverallSatisfaction(newValue || 0)}
                            size="large"
                            icon={<StarIcon fontSize="inherit" />}
                            emptyIcon={<StarIcon fontSize="inherit" />}
                        />
                    </RatingBox>

                    {/* Priemerné hodnotenie */}
                    {averageRating > 0 && (
                        <Box sx={{ 
                            mt: 3, 
                            p: 2, 
                            borderRadius: 2, 
                            backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.1)' : 'rgba(255, 159, 67, 0.05)',
                            border: `1px solid #ff9f43`,
                            textAlign: 'center'
                        }}>
                            <Typography variant="body2" color="text.secondary">
                                Priemerné hodnotenie
                            </Typography>
                            <Typography variant="h4" sx={{ color: '#ff9f43', fontWeight: 700 }}>
                                {averageRating.toFixed(1)}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                                <Rating value={averageRating} readOnly precision={0.1} />
                            </Box>
                        </Box>
                    )}

                    {/* Poznámky */}
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Poznámky"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Pridajte dodatočné poznámky k hodnoteniu..."
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

export default CustomerRatingDialog; 