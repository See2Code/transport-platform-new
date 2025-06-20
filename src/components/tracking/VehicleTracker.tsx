import React, { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { GoogleMap, useJsApiLoader, InfoWindow, Polyline } from '@react-google-maps/api';
import { useTheme } from '@mui/material/styles';
import { Box, Typography, GlobalStyles } from '@mui/material';
import { Vehicle } from '../../types/vehicle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';

// Google Maps libraries konštanta mimo komponentu pre lepšiu performanciu
// Obsahuje všetky libraries potrebné v aplikácii
const libraries: ("places" | "marker")[] = ["places", "marker"];

const darkMapStyle: google.maps.MapTypeStyle[] = [
    {
        featureType: 'all',
        elementType: 'geometry',
        stylers: [{ color: '#1a1a2e' }]
    },
    {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#ffffff' }]
    },
    {
        featureType: 'all',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#1a1a2e', weight: 2 }]
    },
    {
        featureType: 'administrative.country',
        elementType: 'geometry.stroke',
        stylers: [
            { color: '#ffffff' },
            { weight: 0.5 },
            { opacity: 0.3 }
        ]
    },
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [
            { color: '#12121f' }
        ]
    },
    {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [
            { color: '#1a1a2e' }
        ]
    },
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [
            { color: '#2a2a4e' }
        ]
    },
    {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [
            { color: '#212a37' }
        ]
    },
    {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [
            { color: '#ffffff' }
        ]
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [
            { color: '#3a3a6e' }
        ]
    },
    {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [
            { visibility: 'off' }
        ]
    },
    {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [
            { visibility: 'off' }
        ]
    },
    {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [
            { color: '#ffffff' }
        ]
    },
    {
        featureType: 'administrative.locality',
        elementType: 'labels.text.stroke',
        stylers: [
            { color: '#1a1a2e' },
            { weight: 2 }
        ]
    }
];

const lightMapStyle: google.maps.MapTypeStyle[] = [
    {
        featureType: 'all',
        elementType: 'geometry',
        stylers: [{ color: '#ffffff' }]
    },
    {
        featureType: 'all',
        elementType: 'labels.text.fill',
        stylers: [{ color: '#000000' }]
    },
    {
        featureType: 'all',
        elementType: 'labels.text.stroke',
        stylers: [{ color: '#ffffff', weight: 2 }]
    },
    {
        featureType: 'administrative.country',
        elementType: 'geometry.stroke',
        stylers: [
            { color: '#000000' },
            { weight: 0.5 },
            { opacity: 0.3 }
        ]
    },
    {
        featureType: 'water',
        elementType: 'geometry',
        stylers: [
            { color: '#f0f0f0' }
        ]
    },
    {
        featureType: 'landscape',
        elementType: 'geometry',
        stylers: [
            { color: '#ffffff' }
        ]
    },
    {
        featureType: 'road',
        elementType: 'geometry',
        stylers: [
            { color: '#e0e0e0' }
        ]
    },
    {
        featureType: 'road',
        elementType: 'geometry.stroke',
        stylers: [
            { color: '#d0d0d0' }
        ]
    },
    {
        featureType: 'road',
        elementType: 'labels.text.fill',
        stylers: [
            { color: '#000000' }
        ]
    },
    {
        featureType: 'road.highway',
        elementType: 'geometry',
        stylers: [
            { color: '#cccccc' }
        ]
    },
    {
        featureType: 'poi',
        elementType: 'geometry',
        stylers: [
            { visibility: 'off' }
        ]
    },
    {
        featureType: 'transit',
        elementType: 'geometry',
        stylers: [
            { visibility: 'off' }
        ]
    },
    {
        featureType: 'administrative.locality',
        elementType: 'labels.text.fill',
        stylers: [
            { color: '#000000' }
        ]
    },
    {
        featureType: 'administrative.locality',
        elementType: 'labels.text.stroke',
        stylers: [
            { color: '#ffffff' },
            { weight: 2 }
        ]
    }
];

interface VehicleTrackerProps {
    vehicles: Vehicle[];
    selectedVehicle?: string | null;
    hiddenVehicles?: string[];
    onMarkerClick?: (vehicleId: string) => void;
    showInfoWindow?: string | null;
    onInfoWindowClose?: () => void;
    locationHistory?: { latitude: number; longitude: number; timestamp: number }[];
}

export interface VehicleTrackerRef {
    panToVehicle: (vehicle: Vehicle, offset?: { x: number; y: number }) => void;
}

const hideGoogleMapCloseButton = {
    '.gm-ui-hover-effect': {
        display: 'none !important'
    },
    '.gm-style-iw.gm-style-iw-c': {
        padding: '0 !important',
        backgroundColor: 'transparent !important',
        boxShadow: 'none !important',
        border: 'none !important',
        maxWidth: '300px !important'
    },
    '.gm-style-iw-d': {
        overflow: 'hidden !important',
        padding: '0 !important',
        backgroundColor: 'transparent !important'
    },
    '.gm-style .gm-style-iw-t::after': {
        display: 'none !important'
    },
    '.gm-style .gm-style-iw': {
        background: 'transparent !important'
    },
    '.gm-style .gm-style-iw > button': {
        display: 'none !important'
    }
};

const VehicleTracker = forwardRef<VehicleTrackerRef, VehicleTrackerProps>((props, ref) => {
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
        libraries
    });

    const { 
        vehicles, 
        hiddenVehicles = [], 
        onMarkerClick = () => {}, 
        showInfoWindow, 
        onInfoWindowClose = () => {},
        locationHistory = []
    } = props;
    
    const mapRef = useRef<google.maps.Map | null>(null);
    const markersRef = useRef<{ [key: string]: google.maps.marker.AdvancedMarkerElement }>({});
    const theme = useTheme();

    // Efekt pre inicializáciu mapy
    useEffect(() => {
        if (!isLoaded || !mapRef.current) return;
        console.log('🗺️ Inicializujem mapu');

        // Nastavíme počiatočné zobrazenie mapy na Slovensko
        const slovakiaBounds = {
            north: 49.603,
            south: 47.731,
            west: 16.84,
            east: 22.57
        };
        
        mapRef.current.fitBounds(slovakiaBounds);
    }, [isLoaded]);

    // Efekt pre správu markerov
    useEffect(() => {
        if (!mapRef.current || !isLoaded) return;

        const updateMarkers = () => {
            console.log('🔄 Aktualizujem markery, počet vozidiel:', vehicles.length);

            // Filtrujeme aktívne vozidlá
            const activeVehicles = vehicles.filter(vehicle => 
                vehicle.location && 
                !hiddenVehicles.includes(vehicle.id) &&
                vehicle.lastActive > Date.now() - 5 * 60 * 1000 // aktívne za posledných 5 minút
            );

            // Odstránime neaktívne markery
            Object.entries(markersRef.current).forEach(([id, marker]) => {
                if (!activeVehicles.find(v => v.id === id)) {
                    marker.map = null;
                    delete markersRef.current[id];
                }
            });

            // Aktualizujeme alebo pridávame markery
            activeVehicles.forEach(vehicle => {
                const position = {
                    lat: vehicle.location.latitude,
                    lng: vehicle.location.longitude
                };

                if (markersRef.current[vehicle.id]) {
                    // Plynulá animácia pohybu markeru
                    const marker = markersRef.current[vehicle.id];
                    const currentPosition = marker.position;
                    if (currentPosition) {
                        const currentLat = typeof currentPosition.lat === 'function' ? currentPosition.lat() : currentPosition.lat;
                        const currentLng = typeof currentPosition.lng === 'function' ? currentPosition.lng() : currentPosition.lng;
                        const latDiff = position.lat - currentLat;
                        const lngDiff = position.lng - currentLng;
                        let step = 0;
                        const numSteps = 20;

                        const animate = () => {
                            step++;
                            if (step <= numSteps) {
                                const newLat = currentLat + (latDiff * step / numSteps);
                                const newLng = currentLng + (lngDiff * step / numSteps);
                                marker.position = { lat: newLat, lng: newLng };
                                requestAnimationFrame(animate);
                            }
                        };

                        requestAnimationFrame(animate);
                    } else {
                        marker.position = position;
                    }

                    // Pre AdvancedMarkerElement sa rotácia rieši cez CSS transform v content elemente
                    // Aktualizujeme rotáciu ak je potrebné
                    if (vehicle.location.heading !== undefined && marker.content) {
                        const element = marker.content as HTMLElement;
                        element.style.transform = `rotate(${vehicle.location.heading}deg)`;
                    }
                } else {
                    // Vytvoríme nový AdvancedMarkerElement s truck ikonou
                    const markerElement = document.createElement('div');
                    markerElement.innerHTML = `
                        <div style="
                            width: 32px; 
                            height: 32px; 
                            background: linear-gradient(135deg, #FF9F43 0%, #FE8A71 100%); 
                            border: 3px solid white; 
                            border-radius: 50%; 
                            box-shadow: 0 4px 12px rgba(255, 159, 67, 0.4), 0 2px 4px rgba(0,0,0,0.2);
                            cursor: pointer;
                            transition: all 0.3s ease;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            position: relative;
                        " onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                                <path d="M20,8h-3V4H3C2.45,4 2,4.45 2,5v11h2c0,1.66 1.34,3 3,3s3-1.34 3-3h4c0,1.66 1.34,3 3,3s3-1.34 3-3h2v-5L20,8z M7,17.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5 1.5-1.5s1.5,0.67 1.5,1.5S7.83,17.5 7,17.5z M17,17.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5 1.5-1.5s1.5,0.67 1.5,1.5S17.83,17.5 17,17.5z M18,10h1.5l1.5,2H18V10z"/>
                            </svg>
                        </div>
                    `;

                    const marker = new google.maps.marker.AdvancedMarkerElement({
                        position,
                        map: mapRef.current,
                        content: markerElement,
                        title: `${vehicle.driverName} (${vehicle.licensePlate || vehicle.vehicleId})`
                    });

                    // Pre AdvancedMarkerElement používame addEventListener namiesto addListener
                    markerElement.addEventListener('click', () => onMarkerClick(vehicle.id));
                    markersRef.current[vehicle.id] = marker;
                }
            });

            // Ak máme len jedno vozidlo, vycentrujeme ho
            if (activeVehicles.length === 1) {
                const vehicle = activeVehicles[0];
                mapRef.current?.panTo({
                    lat: vehicle.location.latitude,
                    lng: vehicle.location.longitude
                });
            }
        };

        // Aktualizujeme markery
        updateMarkers();

        // Nastavíme interval pre pravidelné kontroly aktivity
        const interval = setInterval(() => {
            updateMarkers();
        }, 10000); // každých 10 sekúnd

        return () => {
            clearInterval(interval);
        };
    }, [vehicles, hiddenVehicles, isLoaded, onMarkerClick]);



    useImperativeHandle(ref, () => ({
        panToVehicle: (vehicle: Vehicle, offset?: { x: number; y: number }) => {
            if (mapRef.current && vehicle.location) {
                // Najprv nastavíme zoom
                mapRef.current.setZoom(15);

                // Počkáme na dokončenie zoom animácie
                setTimeout(() => {
                    if (!mapRef.current) return;

                    // Získame aktuálne rozmery mapy
                    const mapDiv = mapRef.current.getDiv();
                    const mapWidth = mapDiv.offsetWidth;
                    
                    // Vypočítame offset v pixeloch (polovica šírky bočného panela)
                    const offsetPixels = offset?.x || 0;
                    
                    // Prevedieme offset z pixelov na koordináty
                    const projection = mapRef.current.getProjection();
                    if (projection) {
                        const latLng = new google.maps.LatLng(
                            vehicle.location.latitude,
                            vehicle.location.longitude
                        );
                        
                        // Získame pixel koordináty bodu
                        const scale = Math.pow(2, mapRef.current.getZoom() || 0);
                        const worldPoint = projection.fromLatLngToPoint(latLng);
                        if (worldPoint) {
                            // Posunieme bod o offset
                            const offsetPoint = new google.maps.Point(
                                worldPoint.x + (offsetPixels / mapWidth) * (360 / scale),
                                worldPoint.y
                            );
                            
                            // Prevedieme späť na koordináty
                            const offsetLatLng = projection.fromPointToLatLng(offsetPoint);
                            if (offsetLatLng) {
                                mapRef.current.panTo(offsetLatLng);
                            }
                        }
                    }
                }, 100); // Počkáme 100ms na dokončenie zoom animácie
            }
        }
    }));

    if (!isLoaded) return null;

    return (
        <>
            <GlobalStyles styles={hideGoogleMapCloseButton} />
            <GoogleMap
                mapContainerStyle={{ 
                    width: '100%', 
                    height: '100%', 
                    borderRadius: '12px'
                }}
                center={{ lat: 48.669026, lng: 19.699024 }}
                zoom={8}
                options={{
                    styles: theme.palette.mode === 'dark' ? darkMapStyle : lightMapStyle,
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: true,
                    scaleControl: true,
                    streetViewControl: true,
                    rotateControl: true,
                    fullscreenControl: true
                }}
                onLoad={map => {
                    console.log('🗺️ Mapa načítaná');
                    mapRef.current = map;
                }}
            >
                {/* Zobrazenie histórie trasy */}
                {locationHistory.length > 0 && (
                    <Polyline
                        path={locationHistory.map(point => ({
                            lat: point.latitude,
                            lng: point.longitude
                        }))}
                        options={{
                            strokeColor: '#F4A142',
                            strokeOpacity: 0.8,
                            strokeWeight: 3,
                            geodesic: true
                        }}
                    />
                )}

                {showInfoWindow && vehicles.find(v => v.id === showInfoWindow)?.location && (
                    <InfoWindow
                        position={{
                            lat: vehicles.find(v => v.id === showInfoWindow)!.location.latitude,
                            lng: vehicles.find(v => v.id === showInfoWindow)!.location.longitude
                        }}
                        onCloseClick={onInfoWindowClose}
                        options={{
                            pixelOffset: new google.maps.Size(0, -35),
                            maxWidth: 350
                        }}
                    >
                        <Box sx={{ 
                            backgroundColor: theme.palette.mode === 'dark' ? '#1c1c2d' : '#ffffff',
                            borderRadius: '16px',
                            p: 2.5,
                            minWidth: '300px',
                            border: 'none',
                            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
                        }}>
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                mb: 2,
                                pb: 2,
                                borderBottom: theme.palette.mode === 'dark' 
                                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                                    : '1px solid rgba(0, 0, 0, 0.1)'
                            }}>
                                <Box sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: '12px',
                                    backgroundColor: theme.palette.mode === 'dark' 
                                        ? 'rgba(255, 159, 67, 0.15)' 
                                        : 'rgba(255, 159, 67, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    mr: 2
                                }}>
                                    <LocalShippingIcon sx={{ 
                                        color: '#ff9f43', 
                                        fontSize: 28,
                                        transform: 'rotate(-5deg)'
                                    }} />
                                </Box>
                                <Box>
                                    <Typography variant="h6" sx={{ 
                                        fontWeight: 600,
                                        color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                                        mb: 0.5
                                    }}>
                                        {vehicles.find(v => v.id === showInfoWindow)?.driverName}
                                    </Typography>
                                    <Typography variant="body2" sx={{
                                        color: theme.palette.mode === 'dark' 
                                            ? 'rgba(255, 255, 255, 0.7)' 
                                            : 'rgba(0, 0, 0, 0.7)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5
                                    }}>
                                        ŠPZ: {vehicles.find(v => v.id === showInfoWindow)?.licensePlate}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{ 
                                display: 'grid', 
                                gridTemplateColumns: '1fr 1fr', 
                                gap: 2, 
                                mb: 2,
                                pb: 2,
                                borderBottom: theme.palette.mode === 'dark' 
                                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                                    : '1px solid rgba(0, 0, 0, 0.1)'
                            }}>
                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: '12px',
                                    backgroundColor: theme.palette.mode === 'dark' 
                                        ? 'rgba(255, 255, 255, 0.03)' 
                                        : 'rgba(0, 0, 0, 0.03)',
                                    border: `1px solid ${theme.palette.mode === 'dark' 
                                        ? 'rgba(255, 255, 255, 0.05)' 
                                        : 'rgba(0, 0, 0, 0.05)'}`
                                }}>
                                    <Typography variant="caption" sx={{
                                        color: theme.palette.mode === 'dark' 
                                            ? 'rgba(255, 255, 255, 0.5)' 
                                            : 'rgba(0, 0, 0, 0.5)',
                                        display: 'block',
                                        mb: 0.5
                                    }}>
                                        Rýchlosť
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {(() => {
                                            const vehicle = vehicles.find(v => v.id === showInfoWindow);
                                            if (vehicle?.location?.speed) {
                                                return `${Math.round(vehicle.location.speed * 3.6)} km/h`;
                                            }
                                            return 'N/A';
                                        })()}
                                    </Typography>
                                </Box>
                                <Box sx={{
                                    p: 1.5,
                                    borderRadius: '12px',
                                    backgroundColor: theme.palette.mode === 'dark' 
                                        ? 'rgba(255, 255, 255, 0.03)' 
                                        : 'rgba(0, 0, 0, 0.03)',
                                    border: `1px solid ${theme.palette.mode === 'dark' 
                                        ? 'rgba(255, 255, 255, 0.05)' 
                                        : 'rgba(0, 0, 0, 0.05)'}`
                                }}>
                                    <Typography variant="caption" sx={{
                                        color: theme.palette.mode === 'dark' 
                                            ? 'rgba(255, 255, 255, 0.5)' 
                                            : 'rgba(0, 0, 0, 0.5)',
                                        display: 'block',
                                        mb: 0.5
                                    }}>
                                        Presnosť GPS
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {(() => {
                                            const vehicle = vehicles.find(v => v.id === showInfoWindow);
                                            if (vehicle?.location?.accuracy) {
                                                return `±${Math.round(vehicle.location.accuracy)} m`;
                                            }
                                            return 'N/A';
                                        })()}
                                    </Typography>
                                </Box>
                            </Box>

                            <Box sx={{
                                p: 1.5,
                                borderRadius: '12px',
                                backgroundColor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255, 255, 255, 0.03)' 
                                    : 'rgba(0, 0, 0, 0.03)',
                                border: `1px solid ${theme.palette.mode === 'dark' 
                                    ? 'rgba(255, 255, 255, 0.05)' 
                                    : 'rgba(0, 0, 0, 0.05)'}`
                            }}>
                                <Typography variant="caption" sx={{
                                    color: theme.palette.mode === 'dark' 
                                        ? 'rgba(255, 255, 255, 0.5)' 
                                        : 'rgba(0, 0, 0, 0.5)',
                                    display: 'block',
                                    mb: 0.5
                                }}>
                                    Súradnice
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                    fontFamily: 'monospace',
                                    mb: 0.5,
                                    color: theme.palette.mode === 'dark' 
                                        ? 'rgba(255, 255, 255, 0.9)' 
                                        : 'rgba(0, 0, 0, 0.9)'
                                }}>
                                    {vehicles.find(v => v.id === showInfoWindow)?.location.latitude.toFixed(6)}°N
                                </Typography>
                                <Typography variant="body2" sx={{ 
                                    fontFamily: 'monospace',
                                    color: theme.palette.mode === 'dark' 
                                        ? 'rgba(255, 255, 255, 0.9)' 
                                        : 'rgba(0, 0, 0, 0.9)'
                                }}>
                                    {vehicles.find(v => v.id === showInfoWindow)?.location.longitude.toFixed(6)}°E
                                </Typography>
                            </Box>

                            <Typography variant="caption" sx={{ 
                                display: 'block', 
                                textAlign: 'center', 
                                mt: 2,
                                color: theme.palette.mode === 'dark' 
                                    ? 'rgba(255, 255, 255, 0.5)' 
                                    : 'rgba(0, 0, 0, 0.5)'
                            }}>
                                Aktualizované: {new Date(vehicles.find(v => v.id === showInfoWindow)!.location.timestamp).toLocaleString('sk-SK')}
                            </Typography>
                        </Box>
                    </InfoWindow>
                )}
            </GoogleMap>
        </>
    );
});

export default React.memo(VehicleTracker); 