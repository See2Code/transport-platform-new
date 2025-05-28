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
    useTheme,
    Alert,
    Rating
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import StarIcon from '@mui/icons-material/Star';
import ChatIcon from '@mui/icons-material/Chat';
import HighQualityIcon from '@mui/icons-material/HighQuality';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { Carrier, CarrierRating } from '../../types/carriers';
import { useAuth } from '../../contexts/AuthContext';
import { Timestamp } from 'firebase/firestore';
import { styled } from '@mui/material/styles';

interface CarrierRatingDialogProps {
    open: boolean;
    onClose: () => void;
    carrier: Carrier;
    onSubmit: (rating: CarrierRating) => void;
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

const CarrierRatingDialog: React.FC<CarrierRatingDialogProps> = ({
    open,
    onClose,
    carrier,
    onSubmit
}) => {
    const theme = useTheme();
    const { userData } = useAuth();
    const isDarkMode = theme.palette.mode === 'dark';

    const [reliability, setReliability] = useState<number>(carrier.rating?.reliability || 0);
    const [communication, setCommunication] = useState<number>(carrier.rating?.communication || 0);
    const [serviceQuality, setServiceQuality] = useState<number>(carrier.rating?.serviceQuality || 0);
    const [timeManagement, setTimeManagement] = useState<number>(carrier.rating?.timeManagement || 0);
    const [notes, setNotes] = useState<string>(carrier.rating?.notes || '');
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (carrier.rating) {
            setReliability(carrier.rating.reliability || 0);
            setCommunication(carrier.rating.communication || 0);
            setServiceQuality(carrier.rating.serviceQuality || 0);
            setTimeManagement(carrier.rating.timeManagement || 0);
            setNotes(carrier.rating.notes || '');
        }
    }, [carrier]);

    const handleSubmit = () => {
        const rating: CarrierRating = {
            reliability,
            communication,
            serviceQuality,
            timeManagement,
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

    const averageRating = (reliability + communication + serviceQuality + timeManagement) / 4;

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
                            Hodnotenie dopravcu
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
                            {carrier.companyName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {carrier.contactName} {carrier.contactSurname}
                        </Typography>
                    </Box>

                    {/* Spoľahlivosť */}
                    <RatingBox>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <LocalShippingIcon sx={{ color: '#ff9f43' }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Spoľahlivosť
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Spoľahlivosť dodávok a služieb
                        </Typography>
                        <StyledRating
                            value={reliability}
                            onChange={(_event: React.SyntheticEvent, newValue: number | null) => setReliability(newValue || 0)}
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
                            Kvalita a rýchlosť komunikácie
                        </Typography>
                        <StyledRating
                            value={communication}
                            onChange={(_event: React.SyntheticEvent, newValue: number | null) => setCommunication(newValue || 0)}
                            size="large"
                            icon={<StarIcon fontSize="inherit" />}
                            emptyIcon={<StarIcon fontSize="inherit" />}
                        />
                    </RatingBox>

                    {/* Kvalita služieb */}
                    <RatingBox>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <HighQualityIcon sx={{ color: '#ff9f43' }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Kvalita služieb
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Celková kvalita poskytovaných služieb
                        </Typography>
                        <StyledRating
                            value={serviceQuality}
                            onChange={(_event: React.SyntheticEvent, newValue: number | null) => setServiceQuality(newValue || 0)}
                            size="large"
                            icon={<StarIcon fontSize="inherit" />}
                            emptyIcon={<StarIcon fontSize="inherit" />}
                        />
                    </RatingBox>

                    {/* Dodržiavanie termínov */}
                    <RatingBox>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <AccessTimeIcon sx={{ color: '#ff9f43' }} />
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                Dodržiavanie termínov
                            </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Presnosť a dodržiavanie dohodnutých termínov
                        </Typography>
                        <StyledRating
                            value={timeManagement}
                            onChange={(_event: React.SyntheticEvent, newValue: number | null) => setTimeManagement(newValue || 0)}
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

export default CarrierRatingDialog; 