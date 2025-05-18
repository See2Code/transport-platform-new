import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Alert, Dialog, IconButton, DialogContent, DialogTitle } from '@mui/material';
import VehicleTracker from '../tracking/VehicleTracker';
import { useVehicleTracking } from '../../hooks/useVehicleTracking';
import CloseIcon from '@mui/icons-material/Close';
import styled from '@mui/material/styles/styled';

// Štýl pre dialógové okno na celú obrazovku
const FullScreenMapDialog = styled(Dialog)(({ theme }) => ({
    '& .MuiDialog-paper': {
        margin: 0,
        maxWidth: '100%',
        width: '100%',
        height: '100%',
        borderRadius: 0,
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
    },
    '& .MuiDialogTitle-root': {
        padding: '16px 24px',
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        '& .MuiTypography-root': {
            fontWeight: 700
        }
    },
    '& .MuiDialogContent-root': {
        padding: 0,
        height: 'calc(100% - 64px)'
    }
}));

const TrackedDeliveries: React.FC = () => {
    const { vehicles, loading, error } = useVehicleTracking();
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
    const [showInfoWindow, setShowInfoWindow] = useState<string | null>(null);
    const [mapDialogOpen, setMapDialogOpen] = useState(false);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={2}>
                <Alert severity="error">
                    Chyba pri načítaní vozidiel: {error}
                </Alert>
            </Box>
        );
    }

    if (vehicles.length === 0) {
        return (
            <Box p={2}>
                <Typography variant="h6" gutterBottom>
                    Sledované prepravy
                </Typography>
                <Typography color="textSecondary">
                    Momentálne nie sú žiadne aktívne prepravy na sledovanie.
                </Typography>
            </Box>
        );
    }

    return (
        <>
            <Box p={2}>
                <Typography variant="h6" gutterBottom>
                    Sledované prepravy
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                    Aktívne vozidlá: {vehicles.length}
                </Typography>
                <Box 
                    mt={2} 
                    sx={{ 
                        height: '400px', 
                        borderRadius: '12px', 
                        overflow: 'hidden',
                        cursor: 'pointer',
                        '&:hover': {
                            boxShadow: '0 5px 15px rgba(0,0,0,0.15)'
                        }
                    }}
                    onClick={() => setMapDialogOpen(true)}
                >
                    <VehicleTracker 
                        vehicles={vehicles}
                        selectedVehicle={selectedVehicle}
                        hiddenVehicles={[]}
                        onMarkerClick={(vehicleId) => {
                            setSelectedVehicle(vehicleId);
                            setShowInfoWindow(vehicleId);
                        }}
                        showInfoWindow={showInfoWindow}
                        onInfoWindowClose={() => setShowInfoWindow(null)}
                    />
                </Box>
            </Box>

            {/* Dialógové okno s mapou na celú obrazovku */}
            <FullScreenMapDialog 
                open={mapDialogOpen} 
                onClose={() => setMapDialogOpen(false)}
                fullScreen
            >
                <DialogTitle>
                    <Typography variant="h6">Sledované prepravy - Mapa</Typography>
                    <IconButton onClick={() => setMapDialogOpen(false)} size="large">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <VehicleTracker 
                        vehicles={vehicles}
                        selectedVehicle={selectedVehicle}
                        hiddenVehicles={[]}
                        onMarkerClick={(vehicleId) => {
                            setSelectedVehicle(vehicleId);
                            setShowInfoWindow(vehicleId);
                        }}
                        showInfoWindow={showInfoWindow}
                        onInfoWindowClose={() => setShowInfoWindow(null)}
                    />
                </DialogContent>
            </FullScreenMapDialog>
        </>
    );
};

export default TrackedDeliveries; 