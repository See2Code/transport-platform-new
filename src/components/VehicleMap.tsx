import React, { useEffect, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Libraries, Circle, Polyline } from '@react-google-maps/api';
import { collection, onSnapshot, query, where, doc, getDoc, getDocs, addDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { Box, Typography, Paper, Grid, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Chip, GlobalStyles, Tooltip, Switch, FormControlLabel, FormGroup, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem, Select, InputLabel, FormControl, SelectChangeEvent, Menu, ListItemIcon } from '@mui/material';
import { 
    DirectionsCar as CarIcon, 
    AccessTime as TimeIcon, 
    Business as CompanyIcon, 
    LocationOn as LocationIcon,
    Person as PersonIcon,
    FilterAlt as FilterIcon,
    TrackChanges as TrackChangesIcon,
    Visibility as VisibilityIcon,
    History as HistoryIcon,
    SaveAlt as SaveIcon,
    Delete as DeleteIcon,
    CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { sk } from 'date-fns/locale';
import { format } from 'date-fns';

interface VehicleTrailPoint {
    lat: number;
    lng: number;
    timestamp: Date;
}

interface VehicleLocation {
    id: string;
    latitude: number;
    longitude: number;
    driverName: string;
    companyID: string;
    companyName?: string;
    lastUpdate: Date;
    status: string;
    address?: string;
    currentLat?: number;
    currentLng?: number;
    licensePlate: string;
    isOffline?: boolean;
    lastOnline?: Date;
    heading?: number;
    trail?: VehicleTrailPoint[];
}

interface RouteHistoryEntry {
    id: string;
    vehicleId: string;
    driverName: string;
    licensePlate: string;
    startTime: Date;
    endTime: Date;
    distance: number; // v kilometroch
    points: VehicleTrailPoint[];
    name?: string;
    notes?: string;
    autoSaved: boolean;
}

const mapContainerStyle = {
    width: '100%',
    height: '700px',
    borderRadius: '12px'
};

const defaultCenter = {
    lat: 48.669026, // Slovensko centrum
    lng: 19.699024
};

const libraries: Libraries = ['places'];

// Zjednotené konštanty pre časové prahy medzi webom a iOS aplikáciou
const ONLINE_STATUS_THRESHOLD = 5 * 60 * 1000; // 5 minút - pod touto hranicou je stav "Online"
const INACTIVE_STATUS_THRESHOLD = 15 * 60 * 1000; // 15 minút - pod touto hranicou je stav "Neaktívny"
const LOCATION_MAX_AGE = INACTIVE_STATUS_THRESHOLD; // Maximálny vek polohy pre zobrazenie

const darkMapStyles = [
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

const lightMapStyles = [
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

// Pridáme štýly pre InfoWindow
const hideGoogleMapElements = {
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
    },
    '.gm-style-iw-tc': {
        display: 'none !important'
    }
};

// --- Helper Functions (mimo komponentu) ---
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; const dLat = (lat2 - lat1) * Math.PI / 180; const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); return R * c;
};

const formatTimeDiff = (lastUpdate: Date | undefined | null): string => {
    if (!lastUpdate) return '-';
    const now = new Date(); const diffMinutes = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));
    if (diffMinutes < 1) return 'Práve teraz'; if (diffMinutes === 1) return 'Pred 1 min'; if (diffMinutes < 60) return `Pred ${diffMinutes} min`;
    const hours = Math.floor(diffMinutes / 60); const remainingMinutes = diffMinutes % 60;
    if (hours === 1) return `Pred 1 hod ${remainingMinutes > 0 ? remainingMinutes + ' min' : ''}`.trim();
    return `Pred ${hours} hod ${remainingMinutes > 0 ? remainingMinutes + ' min' : ''}`.trim();
};

const getStatusColor = (vehicle: VehicleLocation): "success" | "warning" | "error" => {
    if (vehicle.isOffline) return 'error';
    const now = new Date();
    const diffMs = now.getTime() - vehicle.lastUpdate.getTime();
    if (diffMs < ONLINE_STATUS_THRESHOLD) return 'success';
    if (diffMs < INACTIVE_STATUS_THRESHOLD) return 'warning';
    return 'error';
};

const getStatusText = (vehicle: VehicleLocation): string => {
    if (vehicle.isOffline) return "Offline";
    const now = new Date();
    const diffMs = now.getTime() - vehicle.lastUpdate.getTime();
    if (diffMs < ONLINE_STATUS_THRESHOLD) return "Online";
    if (diffMs < INACTIVE_STATUS_THRESHOLD) return "Neaktívny";
    return "Offline";
};

const getInfoWindowPosition = (vehicle: VehicleLocation | null): { lat: number; lng: number } => {
    if (!vehicle) return { lat: 0, lng: 0 }; // Default or handle null case
    return { lat: vehicle.latitude + 0.0008, lng: vehicle.longitude };
};

const getVehicleTrail = (vehicle: VehicleLocation): VehicleTrailPoint[] => {
    if (vehicle.trail && vehicle.trail.length > 0) return vehicle.trail;
    const simulatedTrail: VehicleTrailPoint[] = []; const now = new Date();
    for (let i = 1; i <= 5; i++) {
        const latOffset = (Math.random() - 0.5) * 0.002; const lngOffset = (Math.random() - 0.5) * 0.002;
        const timestamp = new Date(now.getTime() - i * 60000);
        simulatedTrail.push({ lat: vehicle.latitude + latOffset, lng: vehicle.longitude + lngOffset, timestamp: timestamp });
    }
    return simulatedTrail.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
};

const loadAllVehiclesHistory = async (companyID: string, startDate: Date | null, endDate: Date | null): Promise<RouteHistoryEntry[]> => {
    if (!companyID) return [];
    try {
        let q = query(collection(db, 'routeHistory'), where('companyID', '==', companyID));
        if (startDate) q = query(q, where('startTime', '>=', startDate));
        if (endDate) q = query(q, where('endTime', '<=', endDate));
        q = query(q, orderBy('startTime', 'desc'), limit(50));
        const snapshots = await getDocs(q);
        return snapshots.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id, vehicleId: data.vehicleId, driverName: data.driverName, licensePlate: data.licensePlate,
                startTime: data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime),
                endTime: data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime),
                distance: data.distance || 0,
                points: data.points?.map((p: any) => ({ lat: p.lat, lng: p.lng, timestamp: p.timestamp?.toDate ? p.timestamp.toDate() : new Date(p.timestamp) })) || [],
                name: data.name, notes: data.notes, autoSaved: data.autoSaved || false
            } as RouteHistoryEntry;
        });
    } catch (error) { console.error('Chyba pri načítaní histórie všetkých vozidiel:', error); return []; }
};

const saveVehicleHistory = async (companyID: string | undefined, vehicleId: string, driverName: string, licensePlate: string, points: VehicleTrailPoint[]) => {
    if (!points || points.length < 2 || !vehicleId || !companyID) return;
    try {
        let totalDistance = 0;
        for (let i = 1; i < points.length; i++) totalDistance += calculateDistance(points[i-1].lat, points[i-1].lng, points[i].lat, points[i].lng);
        if (totalDistance < 0.1) { console.log('Trasa je príliš krátka na auto-uloženie:', totalDistance.toFixed(2), 'km'); return; }
        const startDate = points[0].timestamp; const endDate = points[points.length-1].timestamp;
        const routeName = `Auto: ${licensePlate} (${format(startDate, 'dd.MM.yyyy HH:mm')})`;
        await addDoc(collection(db, 'routeHistory'), {
            vehicleId, driverName, licensePlate, companyID, startTime: startDate, endTime: endDate,
            distance: parseFloat(totalDistance.toFixed(2)), points, name: routeName,
            notes: `Automaticky uložená trasa pre vozidlo ${licensePlate}`, createdAt: new Date(), autoSaved: true
        });
        console.log('Trasa automaticky uložená:', routeName, '- vzdialenosť:', totalDistance.toFixed(2), 'km');
    } catch (error) { console.error('Chyba pri automatickom ukladaní trasy:', error); }
};

// --- Sub-Components (definované mimo hlavného komponentu) ---

// Pulzujúci efekt
interface PulsingCircleProps { position: google.maps.LatLng | google.maps.LatLngLiteral; color: string; isSelected: boolean; }
const PulsingCircle: React.FC<PulsingCircleProps> = ({ position, color, isSelected }) => {
    const [radius, setRadius] = useState(30);
    useEffect(() => {
        let interval: NodeJS.Timeout | undefined;
        if (isSelected) {
            let direction = 1, value = 30; const minRadius = 30, maxRadius = 50;
            interval = setInterval(() => {
                value += direction; if (value >= maxRadius) direction = -1; if (value <= minRadius) direction = 1; setRadius(value);
            }, 50);
        }
        return () => { if (interval) clearInterval(interval); };
    }, [isSelected]);
    if (!isSelected) return null;
    return <Circle center={position} radius={radius} options={{ strokeColor: color, strokeOpacity: 0.8, strokeWeight: 2, fillColor: color, fillOpacity: 0.2, clickable: false, draggable: false, editable: false, visible: true, zIndex: 1 }} />;
};

// Stopa vozidla
interface VehicleTrailProps { vehicle: VehicleLocation; showTrail: boolean; selectedVehicle: VehicleLocation | null; isLoaded: boolean; }
const VehicleTrail: React.FC<VehicleTrailProps> = ({ vehicle, showTrail, selectedVehicle, isLoaded }) => {
    const [pathData, setPathData] = useState<{ trailPath: VehicleTrailPoint[]; pathCoordinates: { lat: number; lng: number; }[]; }>({ trailPath: [], pathCoordinates: [] });
    useEffect(() => {
        if (showTrail && selectedVehicle?.id === vehicle.id && isLoaded && window.google) {
            const trail = getVehicleTrail(vehicle);
            const coordinates = [...trail.map(p => ({ lat: p.lat, lng: p.lng })), { lat: vehicle.currentLat || vehicle.latitude, lng: vehicle.currentLng || vehicle.longitude }];
            setPathData({ trailPath: trail, pathCoordinates: coordinates });
        } else {
            setPathData({ trailPath: [], pathCoordinates: [] });
        }
    }, [vehicle, selectedVehicle, showTrail, isLoaded]);
    if (!showTrail || selectedVehicle?.id !== vehicle.id || !isLoaded || !window.google || pathData.pathCoordinates.length === 0) return null;
    return (
        <React.Fragment>
            <Polyline path={pathData.pathCoordinates} options={{ strokeColor: '#FF6B00', strokeOpacity: 0.7, strokeWeight: 3, icons: [{ icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 3, fillColor: '#FF6B00', fillOpacity: 0.7, strokeWeight: 0 }, repeat: '50px' }] }} />
            {pathData.trailPath.map((point, index) => (
                <Marker key={`trail-${vehicle.id}-${index}`} position={{ lat: point.lat, lng: point.lng }} icon={{ path: window.google.maps.SymbolPath.CIRCLE, fillColor: '#FF6B00', fillOpacity: 0.6 - (index * 0.1), strokeWeight: 0, scale: 4 } as google.maps.Symbol} zIndex={0} />
            ))}
        </React.Fragment>
    );
};

// Smerová šípka
interface DirectionIndicatorProps { vehicle: VehicleLocation; selectedVehicle: VehicleLocation | null; showInfoWindow: boolean; isLoaded: boolean; }
const DirectionIndicator: React.FC<DirectionIndicatorProps> = ({ vehicle, selectedVehicle, showInfoWindow, isLoaded }) => {
    const [arrowData, setArrowData] = useState<{ source: { lat: number; lng: number; }; target: { lat: number; lng: number; }; } | null>(null);
    useEffect(() => {
        if (vehicle.heading && selectedVehicle?.id === vehicle.id && showInfoWindow && isLoaded && window.google) {
            const angle = vehicle.heading * Math.PI / 180; const distance = 0.0003;
            const lat = vehicle.currentLat || vehicle.latitude; const lng = vehicle.currentLng || vehicle.longitude;
            const targetLat = lat + Math.cos(angle) * distance; const targetLng = lng + Math.sin(angle) * distance;
            setArrowData({ source: { lat, lng }, target: { lat: targetLat, lng: targetLng } });
        } else {
            setArrowData(null);
        }
    }, [vehicle, selectedVehicle, showInfoWindow, isLoaded]);
    if (!arrowData || !window.google) return null;
    return <Polyline path={[arrowData.source, arrowData.target]} options={{ strokeColor: '#FF6B00', strokeOpacity: 1, strokeWeight: 3, icons: [{ icon: { path: window.google.maps.SymbolPath.FORWARD_OPEN_ARROW, scale: 3, fillColor: '#FF6B00', fillOpacity: 1, strokeWeight: 1, strokeColor: '#FFFFFF' }, offset: '100%', repeat: '0' }] }} />;
};

// Zobrazenie historickej trasy
interface HistoryRouteDisplayProps { route: RouteHistoryEntry | null; isDarkMode: boolean; setSelectedHistoryRoute: (route: RouteHistoryEntry | null) => void; }
const HistoryRouteDisplay: React.FC<HistoryRouteDisplayProps> = ({ route, isDarkMode, setSelectedHistoryRoute }) => {
    const [routeData, setRouteData] = useState<{ pathPoints: { lat: number; lng: number; }[]; startPoint: { lat: number; lng: number; } | null; endPoint: { lat: number; lng: number; } | null; startTime: string; endTime: string; }>({ pathPoints: [], startPoint: null, endPoint: null, startTime: '', endTime: '' });
    useEffect(() => {
        if (route?.points && route.points.length > 0 && window.google) {
            const points = route.points.map(p => ({ lat: p.lat, lng: p.lng }));
            setRouteData({
                pathPoints: points, startPoint: points[0], endPoint: points[points.length - 1],
                startTime: route.points[0]?.timestamp?.toLocaleTimeString('sk-SK') || '-',
                endTime: route.points[route.points.length-1]?.timestamp?.toLocaleTimeString('sk-SK') || '-'
            });
        } else {
            setRouteData({ pathPoints: [], startPoint: null, endPoint: null, startTime: '', endTime: '' });
        }
    }, [route]);
    if (!route || !window.google) return null;
    return (
        <React.Fragment>
            <Polyline path={routeData.pathPoints} options={{ strokeColor: '#4CAF50', strokeOpacity: 0.8, strokeWeight: 4, icons: [{ icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 3, fillColor: '#4CAF50', fillOpacity: 0.9, strokeWeight: 0 }, repeat: '80px' }] }} />
            {routeData.startPoint && <Marker position={routeData.startPoint} icon={{ path: window.google.maps.SymbolPath.CIRCLE, fillColor: '#4CAF50', fillOpacity: 1, strokeWeight: 2, strokeColor: '#FFFFFF', scale: 8 } as google.maps.Symbol} title={`Začiatok: ${routeData.startTime}`} />}
            {routeData.endPoint && <Marker position={routeData.endPoint} icon={{ path: window.google.maps.SymbolPath.CIRCLE, fillColor: '#F44336', fillOpacity: 1, strokeWeight: 2, strokeColor: '#FFFFFF', scale: 8 } as google.maps.Symbol} title={`Koniec: ${routeData.endTime}`} />}
            <Box sx={{ position: 'absolute', bottom: 30, left: '50%', transform: 'translateX(-50%)', zIndex: 1000, p: 2, borderRadius: 2, bgcolor: isDarkMode ? 'rgba(42, 45, 62, 0.9)' : 'rgba(255, 255, 255, 0.9)', boxShadow: 3, minWidth: 300, maxWidth: 500, color: isDarkMode ? '#FFF' : '#000' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}><Typography variant="h6" sx={{ fontWeight: 'bold' }}>{route.name || `Trasa ${route.driverName}`}</Typography><IconButton size="small" onClick={() => setSelectedHistoryRoute(null)}><DeleteIcon fontSize="small" /></IconButton></Box>
                <Grid container spacing={2}>
                    <Grid item xs={6}><Typography variant="body2" color="text.secondary">Vodič</Typography><Typography variant="body1">{route.driverName}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="body2" color="text.secondary">ŠPZ</Typography><Typography variant="body1">{route.licensePlate}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="body2" color="text.secondary">Začiatok</Typography><Typography variant="body1">{route.startTime ? format(route.startTime, 'dd.MM.yyyy HH:mm') : '-'}</Typography></Grid>
                    <Grid item xs={6}><Typography variant="body2" color="text.secondary">Koniec</Typography><Typography variant="body1">{route.endTime ? format(route.endTime, 'dd.MM.yyyy HH:mm') : '-'}</Typography></Grid>
                    <Grid item xs={12}><Typography variant="body2" color="text.secondary">Vzdialenosť</Typography><Typography variant="body1">{route.distance.toFixed(1)} km</Typography></Grid>
                    {route.notes && <Grid item xs={12}><Typography variant="body2" color="text.secondary">Poznámky</Typography><Typography variant="body1">{route.notes}</Typography></Grid>}
                </Grid>
            </Box>
        </React.Fragment>
    );
};

// Dialóg pre históriu trás
interface HistoryRoutesDialogProps { open: boolean; onClose: () => void; routes: RouteHistoryEntry[]; onSelectRoute: (route: RouteHistoryEntry) => void; startDate: Date | null; endDate: Date | null; onStartDateChange: (date: Date | null) => void; onEndDateChange: (date: Date | null) => void; onFilterClick: () => void; }
const HistoryRoutesDialog: React.FC<HistoryRoutesDialogProps> = ({ open, onClose, routes, onSelectRoute, startDate, endDate, onStartDateChange, onEndDateChange, onFilterClick }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Typography variant="h6">História trás</Typography><Box sx={{ display: 'flex', gap: 1 }}><LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}><DatePicker label="Od dátumu" value={startDate} onChange={onStartDateChange} slotProps={{ textField: { size: 'small', sx: { width: 140 }}}} /><DatePicker label="Do dátumu" value={endDate} onChange={onEndDateChange} slotProps={{ textField: { size: 'small', sx: { width: 140 }}}} /></LocalizationProvider><Button variant="outlined" size="small" onClick={onFilterClick}>Filtrovať</Button></Box></Box></DialogTitle>
            <DialogContent dividers>
                {routes.length === 0 ? <Typography sx={{ p: 2, textAlign: 'center' }}>Žiadne trasy neboli nájdené pre vybrané obdobie.</Typography> : <List>{routes.map(route => (<React.Fragment key={route.id}><ListItem button onClick={() => onSelectRoute(route)}><ListItemAvatar><Avatar sx={{ bgcolor: '#4CAF50' }}><TrackChangesIcon /></Avatar></ListItemAvatar><ListItemText primary={<Typography fontWeight="medium">{route.name || `Trasa ${route.startTime ? format(route.startTime, 'dd.MM.yyyy') : ''}`}</Typography>} secondary={<Box><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}><TimeIcon fontSize="small" /><Typography variant="body2">{route.startTime ? format(route.startTime, 'dd.MM HH:mm') : ''} - {route.endTime ? format(route.endTime, 'HH:mm') : ''}</Typography></Box><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CarIcon fontSize="small" /><Typography variant="body2">{route.licensePlate} ({route.distance.toFixed(1)} km)</Typography></Box></Box>} /></ListItem><Divider /></React.Fragment>))}</List>}
            </DialogContent>
            <DialogActions><Button onClick={onClose}>Zavrieť</Button></DialogActions>
        </Dialog>
    );
};

// Dialóg pre uloženie trasy
interface SaveRouteDialogProps { open: boolean; onClose: () => void; routeName: string; routeNotes: string; onNameChange: (value: string) => void; onNotesChange: (value: string) => void; onSave: () => void; }
const SaveRouteDialog: React.FC<SaveRouteDialogProps> = ({ open, onClose, routeName, routeNotes, onNameChange, onNotesChange, onSave }) => {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Uložiť trasu</DialogTitle>
            <DialogContent><TextField autoFocus margin="dense" label="Názov trasy" type="text" fullWidth variant="outlined" value={routeName} onChange={(e) => onNameChange(e.target.value)} sx={{ mb: 2 }} /><TextField margin="dense" label="Poznámky (voliteľné)" type="text" fullWidth variant="outlined" multiline rows={3} value={routeNotes} onChange={(e) => onNotesChange(e.target.value)} /></DialogContent>
            <DialogActions><Button onClick={onClose}>Zrušiť</Button><Button onClick={onSave} variant="contained" color="primary">Uložiť</Button></DialogActions>
        </Dialog>
    );
};

// --- Hlavný komponent VehicleMap ---

const VehicleMap: React.FC = () => {
    // --- State Declarations ---
    const [vehicles, setVehicles] = useState<VehicleLocation[]>([]);
    const [staleVehicles, setStaleVehicles] = useState<VehicleLocation[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleLocation | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [showInfoWindow, setShowInfoWindow] = useState(false);
    const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
    const { userData } = useAuth();
    const [, setTimeUpdate] = useState(0);
    const { isDarkMode } = useThemeMode();
    const [showTrail, setShowTrail] = useState(false);
    const [filterOptions, setFilterOptions] = useState({ showOfflineVehicles: true, showOnlineOnly: false });
    const [routeHistory, setRouteHistory] = useState<RouteHistoryEntry[]>([]);
    const [selectedHistoryRoute, setSelectedHistoryRoute] = useState<RouteHistoryEntry | null>(null);
    const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
    const [showHistoryPanel, setShowHistoryPanel] = useState(true);
    const [dateRangeFilter, setDateRangeFilter] = useState<{ startDate: Date | null; endDate: Date | null; }>({ startDate: new Date(new Date().setDate(new Date().getDate() - 7)), endDate: new Date() });
    const [vehiclePoints, setVehiclePoints] = useState<{ [vehicleId: string]: VehicleTrailPoint[] }>({});
    const [autoSaveEnabled, setAutoSaveEnabled] = useState<boolean>(true);
    const [lastAutoSave, setLastAutoSave] = useState<{ [vehicleId: string]: Date }>({});
    const [historyMenu, setHistoryMenu] = useState<{ anchor: HTMLElement | null; vehicleId: string | null; }>({ anchor: null, vehicleId: null });
    const [saveRouteDialog, setSaveRouteDialog] = useState<{ open: boolean; routeName: string; routeNotes: string; vehicleId: string | null; }>({ open: false, routeName: "", routeNotes: "", vehicleId: null });

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
        libraries,
        id: 'script-loader'
    });

    // --- Icon Definitions ---
    const getVehicleIcons = useCallback(() => {
        if (!isLoaded || !window.google) return { ACTIVE: null, INACTIVE: null, SELECTED: null };
        return {
            ACTIVE: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, fillColor: '#FF6B00', fillOpacity: 1, strokeWeight: 2, strokeColor: '#d95a00', scale: 6, anchor: new window.google.maps.Point(0, 0), rotation: 0 } as google.maps.Symbol,
            INACTIVE: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, fillColor: '#888888', fillOpacity: 0.7, strokeWeight: 1, strokeColor: '#666666', scale: 5, anchor: new window.google.maps.Point(0, 0), rotation: 0 } as google.maps.Symbol,
            SELECTED: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, fillColor: '#FF6B00', fillOpacity: 1, strokeWeight: 3, strokeColor: '#FFFFFF', scale: 7, anchor: new window.google.maps.Point(0, 0), rotation: 0 } as google.maps.Symbol
        };
    }, [isLoaded]);
    const vehicleIcons = getVehicleIcons();

    // --- Handlers defined inside the component ---
    const handleFilterChange = useCallback((filter: keyof typeof filterOptions) => (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilterOptions(prev => ({ ...prev, [filter]: event.target.checked }));
    }, []);

    const getFilteredVehicles = useCallback(() => {
        let filtered = vehicles; // Start with only active vehicles if offline are hidden initially
        if (filterOptions.showOfflineVehicles) {
            filtered = [...vehicles, ...staleVehicles];
        }
        if (!filterOptions.showOfflineVehicles) {
            filtered = filtered.filter(v => !v.isOffline && (new Date().getTime() - v.lastUpdate.getTime()) < INACTIVE_STATUS_THRESHOLD);
        }
        if (filterOptions.showOnlineOnly) {
            filtered = filtered.filter(v => !v.isOffline && (new Date().getTime() - v.lastUpdate.getTime()) < ONLINE_STATUS_THRESHOLD);
        }
        return filtered;
    }, [vehicles, staleVehicles, filterOptions]);

    const handleMarkerClick = useCallback((vehicle: VehicleLocation) => {
        if (selectedVehicle?.id === vehicle.id) {
            if (showInfoWindow) { setShowInfoWindow(false); setShowTrail(true); }
            else if (showTrail) { setShowTrail(false); setSelectedVehicle(null); }
            else { setShowInfoWindow(true); }
        } else {
            setSelectedVehicle(vehicle);
            setShowInfoWindow(true);
            setShowTrail(false);
        }
    }, [selectedVehicle, showInfoWindow, showTrail]);

    const handleListItemClick = useCallback((vehicle: VehicleLocation) => {
        setSelectedVehicle(vehicle);
        setShowInfoWindow(false);
    }, []);

    const handleInfoWindowClose = useCallback(() => {
        setShowInfoWindow(false);
    }, []);

    const handleCloseHistoryDialog = useCallback(() => {
        setHistoryDialogOpen(false);
        // Reset selected route when closing dialog to remove it from map
        setSelectedHistoryRoute(null); 
    }, []);

    const handleSelectHistoryRoute = useCallback((route: RouteHistoryEntry) => {
        setSelectedHistoryRoute(route);
        setHistoryDialogOpen(false); // Close dialog on selection
        // Pan/Zoom is handled by useEffect below
    }, []);

    const handleVehicleMenuOpen = useCallback((event: React.MouseEvent<HTMLElement>, vehicleId: string) => {
        event.stopPropagation();
        setHistoryMenu({ anchor: event.currentTarget, vehicleId: vehicleId });
    }, []);
    
    const handleVehicleMenuClose = useCallback(() => {
        setHistoryMenu({ anchor: null, vehicleId: null });
    }, []);

    const loadVehicleRouteHistory = useCallback(async (vehicleId: string) => {
        if (!userData?.companyID) return;
        try {
            const routesQuery = query(
                collection(db, 'routeHistory'),
                where('vehicleId', '==', vehicleId),
                where('companyID', '==', userData.companyID),
                where('startTime', '>=', dateRangeFilter.startDate || new Date(0)),
                where('endTime', '<=', dateRangeFilter.endDate || new Date()),
                orderBy('startTime', 'desc'), limit(50)
            );
            const routeSnapshots = await getDocs(routesQuery);
            const routes: RouteHistoryEntry[] = routeSnapshots.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id, vehicleId: data.vehicleId, driverName: data.driverName, licensePlate: data.licensePlate,
                    startTime: data.startTime?.toDate ? data.startTime.toDate() : new Date(data.startTime),
                    endTime: data.endTime?.toDate ? data.endTime.toDate() : new Date(data.endTime),
                    distance: data.distance || 0,
                    points: data.points?.map((p: any) => ({ lat: p.lat, lng: p.lng, timestamp: p.timestamp?.toDate ? p.timestamp.toDate() : new Date(p.timestamp) })) || [],
                    name: data.name, notes: data.notes, autoSaved: data.autoSaved || false
                };
            });
            setRouteHistory(routes); // Update history for the dialog
            setHistoryDialogOpen(true);
        } catch (error) { console.error('Chyba pri načítaní histórie trás:', error); }
    }, [userData?.companyID, dateRangeFilter.startDate, dateRangeFilter.endDate]);

    const saveCurrentVehicleRoute = useCallback((vehicleId: string) => {
        const vehicle = [...vehicles, ...staleVehicles].find(v => v.id === vehicleId);
        if (!vehicle) return;
        setSaveRouteDialog({ open: true, routeName: `Trasa ${vehicle.driverName} ${new Date().toLocaleDateString('sk-SK')}`, routeNotes: '', vehicleId: vehicleId });
    }, [vehicles, staleVehicles]);

    const confirmSaveRoute = useCallback(async () => {
        const vehicleId = saveRouteDialog.vehicleId;
        if (!vehicleId || !userData?.companyID) return;
        const vehicle = [...vehicles, ...staleVehicles].find(v => v.id === vehicleId);
        if (!vehicle) return;
        try {
            const routePoints = vehiclePoints[vehicleId] || getVehicleTrail(vehicle);
            if (routePoints.length < 2) { console.warn("Nedostatok bodov pre uloženie trasy."); return; }
            let totalDistance = 0;
            for (let i = 1; i < routePoints.length; i++) totalDistance += calculateDistance(routePoints[i-1].lat, routePoints[i-1].lng, routePoints[i].lat, routePoints[i].lng);
            await addDoc(collection(db, 'routeHistory'), {
                vehicleId: vehicle.id, driverName: vehicle.driverName, licensePlate: vehicle.licensePlate, companyID: userData.companyID,
                startTime: routePoints[0].timestamp, endTime: routePoints[routePoints.length-1].timestamp,
                distance: parseFloat(totalDistance.toFixed(2)), points: routePoints, name: saveRouteDialog.routeName, notes: saveRouteDialog.routeNotes,
                createdAt: new Date(), autoSaved: false
            });
            setSaveRouteDialog({ open: false, routeName: "", routeNotes: "", vehicleId: null });
            // Refresh history panel after saving
            const historyData = await loadAllVehiclesHistory(userData.companyID, dateRangeFilter.startDate, dateRangeFilter.endDate);
            setRouteHistory(historyData);
            setShowHistoryPanel(true);
        } catch (error) { console.error('Chyba pri ukladaní trasy:', error); }
    }, [saveRouteDialog, userData?.companyID, vehicles, staleVehicles, vehiclePoints, dateRangeFilter.startDate, dateRangeFilter.endDate]);

    const filterHistory = useCallback(async () => {
        if (userData?.companyID) {
            const historyData = await loadAllVehiclesHistory(userData.companyID, dateRangeFilter.startDate, dateRangeFilter.endDate);
            setRouteHistory(historyData);
        }
    }, [userData?.companyID, dateRangeFilter.startDate, dateRangeFilter.endDate]);

    // --- useEffect Hooks (All unconditional) ---
    useEffect(() => {
        const timer = setInterval(() => setTimeUpdate(prev => prev + 1), 15000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;
        if (userData?.companyID && isLoaded) {
            const q = query(collection(db, 'vehicleLocations'), where('companyID', '==', userData.companyID));
            unsubscribe = onSnapshot(q, async (snapshot) => {
                const latestVehicleDataByDriver: { [driverName: string]: VehicleLocation } = {};
                const companyPromises = snapshot.docs.map(docSnapshot => getDoc(doc(db, 'companies', docSnapshot.data().companyID)));
                const companyDocs = await Promise.all(companyPromises);
                const companyNames: { [id: string]: string } = {};
                companyDocs.forEach((doc, index) => { if (doc.exists()) companyNames[snapshot.docs[index].data().companyID] = doc.data().name; });

                for (const docSnapshot of snapshot.docs) {
                    const data = docSnapshot.data(); const driverName = data.driverName || 'Neznámy vodič';
                    if (!data.latitude || !data.longitude) continue;
                    const vehicleData: VehicleLocation = {
                        id: docSnapshot.id, latitude: data.latitude, longitude: data.longitude, driverName: driverName, companyID: data.companyID,
                        companyName: companyNames[data.companyID] || data.companyID, lastUpdate: data.lastUpdate?.toDate() || new Date(0),
                        lastOnline: data.lastOnline?.toDate() || (data.lastUpdate?.toDate() || new Date(0)), status: data.status || 'unknown',
                        currentLat: data.latitude, currentLng: data.longitude, licensePlate: data.licensePlate || 'Neznáme ŠPZ',
                        isOffline: data.isOffline === true, heading: data.heading
                    };
                    const existingData = latestVehicleDataByDriver[driverName];
                    if (!existingData || vehicleData.lastUpdate.getTime() > existingData.lastUpdate.getTime()) latestVehicleDataByDriver[driverName] = vehicleData;
                    }
                const latestVehiclesArray = Object.values(latestVehicleDataByDriver);
                const activeVehiclesData: VehicleLocation[] = []; const staleVehiclesData: VehicleLocation[] = []; const now = Date.now();
                latestVehiclesArray.forEach(vehicleData => {
                    const updateAge = now - vehicleData.lastUpdate.getTime();
                    if (vehicleData.isOffline || updateAge > LOCATION_MAX_AGE) staleVehiclesData.push(vehicleData); else activeVehiclesData.push(vehicleData);
                });
                setVehicles(activeVehiclesData);
                setStaleVehicles(staleVehiclesData);
                if (activeVehiclesData.length > 0 && map && window.google) {
                    const validVehicles = activeVehiclesData.filter(v => typeof v.latitude === 'number' && !isNaN(v.latitude) && typeof v.longitude === 'number' && !isNaN(v.longitude));
                    if (validVehicles.length > 0) {
                        const bounds = new window.google.maps.LatLngBounds();
                        validVehicles.forEach(vehicle => bounds.extend({ lat: vehicle.latitude, lng: vehicle.longitude }));
                        if (!bounds.isEmpty()) {
                            map.fitBounds(bounds);
                            if (validVehicles.length === 1) { map.setCenter({ lat: validVehicles[0].latitude, lng: validVehicles[0].longitude }); map.setZoom(15); }
                        }
                    }
                }
            });
        }
        return () => { if (unsubscribe) unsubscribe(); };
    }, [userData?.companyID, map, isLoaded]);

    useEffect(() => {
        if (isLoaded && !geocoder && window.google) {
            setGeocoder(new window.google.maps.Geocoder());
        }
    }, [isLoaded, geocoder]);

    // Efekt pre pan/zoom na VYBRANÚ HISTORICKÚ trasu - opravená podmienka
    useEffect(() => {
        // Skontrolujeme, či máme mapu, vybranú trasu, body trasy a Google API
        if (map && selectedHistoryRoute && selectedHistoryRoute.points && selectedHistoryRoute.points.length > 0 && window.google) {
            const bounds = new window.google.maps.LatLngBounds();
            selectedHistoryRoute.points.forEach(point => bounds.extend({ lat: point.lat, lng: point.lng }));
            map.fitBounds(bounds);
        }
    }, [selectedHistoryRoute, map]); // Závislosť len na zmene vybranej trasy a mapy

    // Načítanie histórie pri zmene filtra alebo companyID
    useEffect(() => {
        filterHistory(); // Zavoláme funkciu pre načítanie/filtrovanie
        const intervalId = setInterval(filterHistory, 5 * 60 * 1000); // Pravidelné obnovenie
        return () => clearInterval(intervalId);
    }, [filterHistory]); // Riadok cca 1438

    // Automatické ukladanie trás
    useEffect(() => {
        let isMounted = true;
        const updatePointsAndSave = () => {
            if (!autoSaveEnabled || !userData?.companyID) return; // Podmienka tu
            const now = new Date();
            setVehiclePoints(prevPoints => {
                const updatedPoints = { ...prevPoints };
                vehicles.forEach(vehicle => {
                    if (!updatedPoints[vehicle.id]) updatedPoints[vehicle.id] = [];
                    if (vehicle.latitude && vehicle.longitude) {
                        const lastPoint = updatedPoints[vehicle.id][updatedPoints[vehicle.id].length - 1];
                        if (!lastPoint || now.getTime() - lastPoint.timestamp.getTime() > 60000) {
                            updatedPoints[vehicle.id].push({ lat: vehicle.latitude, lng: vehicle.longitude, timestamp: now });
                        }
                    }
                    const lastSaveTime = lastAutoSave[vehicle.id] || new Date(0);
                    if (updatedPoints[vehicle.id].length >= 10 && now.getTime() - lastSaveTime.getTime() > 30 * 60 * 1000) {
                        saveVehicleHistory(userData.companyID, vehicle.id, vehicle.driverName, vehicle.licensePlate, [...updatedPoints[vehicle.id]]);
                        if (isMounted) setLastAutoSave(prev => ({ ...prev, [vehicle.id]: now }));
                        updatedPoints[vehicle.id] = [];
                    }
                });
                return updatedPoints;
            });
        };
        const intervalId = setInterval(updatePointsAndSave, 60 * 1000);
        return () => { isMounted = false; clearInterval(intervalId); };
    }, [vehicles, autoSaveEnabled, lastAutoSave, userData?.companyID]); // Riadok cca 1465

    // --- Render --- 
    if (!isLoaded) {
        return <Box>Načítavam mapu...</Box>;
    }

    return (
        <Box sx={{ p: 2 }}>
            <GlobalStyles styles={hideGoogleMapElements} />
            {/* Panel filtrov */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Mapa vozidiel</Typography>
                <Paper elevation={2} sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 2, backgroundColor: isDarkMode ? 'rgba(42, 45, 62, 0.8)' : 'rgba(255, 255, 255, 0.8)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><FilterIcon sx={{ color: isDarkMode ? '#888' : '#555' }} /><Typography variant="body2" fontWeight={500}>Filtre:</Typography></Box>
                    <FormGroup row>
                        <Tooltip title="Zobraziť offline vozidlá"><FormControlLabel control={<Switch size="small" checked={filterOptions.showOfflineVehicles} onChange={handleFilterChange('showOfflineVehicles')} color="primary" />} label={<Typography variant="body2">Offline vozidlá</Typography>} /></Tooltip>
                        <Tooltip title="Zobraziť len online vozidlá (menej ako 5 minút)"><FormControlLabel control={<Switch size="small" checked={filterOptions.showOnlineOnly} onChange={handleFilterChange('showOnlineOnly')} color="warning" />} label={<Typography variant="body2">Len online</Typography>} /></Tooltip>
                        <Tooltip title="Automaticky ukladať trasy vozidiel"><FormControlLabel control={<Switch size="small" checked={autoSaveEnabled} onChange={(e) => setAutoSaveEnabled(e.target.checked)} color="success" />} label={<Typography variant="body2">Auto-ukladanie</Typography>} /></Tooltip>
                        <Tooltip title="Zobraziť/skryť panel histórie"><IconButton size="small" onClick={() => setShowHistoryPanel(!showHistoryPanel)} color={showHistoryPanel ? "primary" : "default"}><HistoryIcon /></IconButton></Tooltip>
                    </FormGroup>
                </Paper>
            </Box>
            <Grid container spacing={3}>
                {/* Zoznam vozidiel */} 
                <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ height: '700px', overflow: 'auto' }}>
                        <List>
                            <ListItem><ListItemText primary={<Typography variant="h6">Aktívni vodiči ({vehicles.length})</Typography>} /></ListItem><Divider />
                            {vehicles.length === 0 ? <ListItem><ListItemText primary="Žiadni aktívni vodiči" secondary="Momentálne nie sú k dispozícii žiadne aktívne vozidlá" /></ListItem> : vehicles.map((vehicle: VehicleLocation) => (
                                    <React.Fragment key={vehicle.id}>
                                    <ListItem button onClick={() => handleListItemClick(vehicle)} selected={selectedVehicle?.id === vehicle.id} secondaryAction={<IconButton edge="end" aria-label="história" onClick={(e) => handleVehicleMenuOpen(e, vehicle.id)}><HistoryIcon /></IconButton>}>
                                        <ListItemAvatar><Avatar><CarIcon /></Avatar></ListItemAvatar>
                                            <ListItemText
                                                primary={vehicle.driverName}
                                                secondary={
                                                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <TimeIcon fontSize="small" />
                                                    <Typography variant="body2" component="span">{formatTimeDiff(vehicle.lastUpdate)}</Typography>
                                                    <Chip size="small" color={getStatusColor(vehicle)} label={getStatusText(vehicle)} sx={{ ml: 1 }} />
                                                    </Box>
                                                }
                                            />
                                    </ListItem><Divider />
                                    </React.Fragment>
                            ))}
                            {filterOptions.showOfflineVehicles && staleVehicles.length > 0 && (
                                <>
                                    <ListItem><ListItemText primary={<Typography variant="h6">Neaktívni vodiči ({staleVehicles.length})</Typography>} /></ListItem><Divider />
                                    {staleVehicles.map((vehicle: VehicleLocation) => (
                                        <React.Fragment key={`stale-${vehicle.id}`}>
                                            <ListItem button onClick={() => handleListItemClick(vehicle)} selected={selectedVehicle?.id === vehicle.id} sx={{ opacity: 0.6 }}>
                                                <ListItemAvatar><Avatar sx={{ opacity: 0.7 }}><CarIcon /></Avatar></ListItemAvatar>
                                                <ListItemText
                                                    primary={vehicle.driverName}
                                                    secondary={
                                                        <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <TimeIcon fontSize="small" />
                                                            <Typography variant="body2" component="span">{formatTimeDiff(vehicle.lastUpdate)}</Typography>
                                                            <Chip size="small" color={getStatusColor(vehicle)} label="Offline" sx={{ ml: 1 }} />
                                                        </Box>
                                                    }
                                                />
                                            </ListItem><Divider />
                                        </React.Fragment>
                                    ))}
                                </>
                            )}
                        </List>
                    </Paper>
                </Grid>
                {/* Mapa */} 
                <Grid item xs={12} md={8}>
                    <Paper elevation={3}>
                        <GoogleMap mapContainerStyle={mapContainerStyle} center={defaultCenter} zoom={7} onLoad={map => setMap(map)} options={{ styles: isDarkMode ? darkMapStyles : lightMapStyles, disableDefaultUI: false, zoomControl: true, mapTypeControl: false, scaleControl: true, streetViewControl: false, rotateControl: true, fullscreenControl: true, backgroundColor: isDarkMode ? '#1a1a2e' : '#ffffff' }}>
                            {getFilteredVehicles().map((vehicle: VehicleLocation) => (
                                <React.Fragment key={vehicle.id}>
                                    <VehicleTrail vehicle={vehicle} showTrail={showTrail} selectedVehicle={selectedVehicle} isLoaded={isLoaded}/>
                                    <DirectionIndicator vehicle={vehicle} selectedVehicle={selectedVehicle} showInfoWindow={showInfoWindow} isLoaded={isLoaded}/>
                                    <PulsingCircle position={{ lat: vehicle.currentLat || vehicle.latitude, lng: vehicle.currentLng || vehicle.longitude }} color="#FF6B00" isSelected={selectedVehicle?.id === vehicle.id} />
                                    {vehicleIcons.ACTIVE && vehicleIcons.SELECTED && (
                                        <Marker position={{ lat: vehicle.currentLat || vehicle.latitude, lng: vehicle.currentLng || vehicle.longitude }} onClick={() => handleMarkerClick(vehicle)} icon={{ ...(selectedVehicle?.id === vehicle.id ? vehicleIcons.SELECTED : vehicleIcons.ACTIVE), rotation: vehicle.heading || 0 } as google.maps.Symbol} zIndex={selectedVehicle?.id === vehicle.id ? 2 : 1} />
                                    )}
                                </React.Fragment>
                            ))}
                            {selectedHistoryRoute && <HistoryRouteDisplay route={selectedHistoryRoute} isDarkMode={isDarkMode} setSelectedHistoryRoute={setSelectedHistoryRoute} />}
                            {selectedVehicle && showInfoWindow && (
                                <InfoWindow position={getInfoWindowPosition(selectedVehicle)} onCloseClick={handleInfoWindowClose} options={{ pixelOffset: new window.google.maps.Size(0, -5), maxWidth: 300 }}>
                                    <Box sx={{ p: 2.5, minWidth: '280px', bgcolor: isDarkMode ? '#2A2D3E' : '#ffffff', borderRadius: 2, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.16)', color: isDarkMode ? '#fff' : '#000' }}>
                                        <Box sx={{ mb: 2 }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}><PersonIcon sx={{ color: '#FF6B00', fontSize: 28 }} /><Typography variant="h6" sx={{ color: isDarkMode ? '#fff' : '#000', fontWeight: 600 }}>{selectedVehicle.driverName || 'Neznámy vodič'}</Typography></Box><Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}><TimeIcon sx={{ color: '#FF6B00' }} /><Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)', fontWeight: 500 }}>{formatTimeDiff(selectedVehicle.lastUpdate)}</Typography><Chip size="small" color={getStatusColor(selectedVehicle)} label={getStatusText(selectedVehicle)} sx={{ ml: 'auto', height: '20px', fontSize: '0.7rem' }} /></Box></Box>
                                        <Divider sx={{ my: 2, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}><Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}><CarIcon sx={{ color: '#FF6B00', fontSize: 22, mt: 0.3 }} /><Box><Typography sx={{ color: isDarkMode ? '#fff' : '#000', fontWeight: 500, mb: 0.5 }}>{selectedVehicle.licensePlate || 'Neznáme ŠPZ'}</Typography><Typography variant="caption" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)', display: 'block' }}>Aktuálne vozidlo</Typography></Box></Box><Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}><CompanyIcon sx={{ color: '#FF6B00', fontSize: 22, mt: 0.3 }} /><Box><Typography sx={{ color: isDarkMode ? '#fff' : '#000', fontWeight: 500, mb: 0.5 }}>{selectedVehicle.companyName || 'AESA Group'}</Typography><Typography variant="caption" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)', display: 'block' }}>ID: {selectedVehicle.companyID}</Typography></Box></Box></Box>
                                    </Box>
                                </InfoWindow>
                            )}
                        </GoogleMap>
                    </Paper>
                </Grid>
                {/* Panel histórie */} 
                {showHistoryPanel && (
                    <Grid item xs={12}>
                        <Paper elevation={3} sx={{ p: 2, mt: 2, backgroundColor: isDarkMode ? '#2A2D3E' : '#FFFFFF' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">História trás vozidiel</Typography>
                                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}><DatePicker label="Od dátumu" value={dateRangeFilter.startDate} onChange={(newDate) => setDateRangeFilter(prev => ({ ...prev, startDate: newDate }))} slotProps={{ textField: { size: 'small', sx: { width: 140 }}}} /><DatePicker label="Do dátumu" value={dateRangeFilter.endDate} onChange={(newDate) => setDateRangeFilter(prev => ({ ...prev, endDate: newDate }))} slotProps={{ textField: { size: 'small', sx: { width: 140 }}}} /></LocalizationProvider>
                                    <Button variant="outlined" size="small" startIcon={<FilterIcon />} onClick={filterHistory}>Filtrovať</Button>
                                </Box>
                            </Box>
                            {routeHistory.length === 0 ? <Typography sx={{ textAlign: 'center', p: 3, color: 'text.secondary' }}>Neboli nájdené žiadne trasy pre zvolené obdobie.</Typography> : <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>{routeHistory.map((route: RouteHistoryEntry) => (<Paper key={route.id} elevation={selectedHistoryRoute?.id === route.id ? 3 : 1} sx={{ width: 280, p: 2, cursor: 'pointer', transition: 'all 0.2s ease', borderLeft: `4px solid ${route.autoSaved ? '#4CAF50' : '#FF6B00'}`, backgroundColor: selectedHistoryRoute?.id === route.id ? (isDarkMode ? '#3A3D4E' : '#f5f5f5') : (isDarkMode ? '#2A2D3E' : '#FFFFFF'), '&:hover': { backgroundColor: isDarkMode ? '#3A3D4E' : '#f5f5f5' } }} onClick={() => handleSelectHistoryRoute(route)}><Box sx={{ mb: 1 }}><Typography variant="subtitle1" fontWeight="medium" noWrap>{route.name || `Trasa ${route.licensePlate}`}</Typography><Typography variant="caption" sx={{ color: 'text.secondary' }}>{route.autoSaved ? 'Automaticky uložená' : 'Manuálne uložená'}</Typography></Box><Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CarIcon fontSize="small" sx={{ color: '#FF6B00' }} /><Typography variant="body2">{route.licensePlate}</Typography></Box><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PersonIcon fontSize="small" sx={{ color: '#FF6B00' }} /><Typography variant="body2" noWrap>{route.driverName}</Typography></Box><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><TimeIcon fontSize="small" sx={{ color: '#FF6B00' }} /><Typography variant="body2">{format(route.startTime, 'dd.MM.yyyy HH:mm')}</Typography></Box><Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><TrackChangesIcon fontSize="small" sx={{ color: '#FF6B00' }} /><Typography variant="body2">{route.distance.toFixed(1)} km</Typography></Box></Box></Paper>))}</Box>}
                        </Paper>
            </Grid>
                )}
            </Grid>
            <Menu anchorEl={historyMenu.anchor} open={Boolean(historyMenu.anchor)} onClose={handleVehicleMenuClose}>
                <MenuItem onClick={() => { if (historyMenu.vehicleId) loadVehicleRouteHistory(historyMenu.vehicleId); handleVehicleMenuClose(); }}><ListItemIcon><HistoryIcon fontSize="small" /></ListItemIcon><ListItemText>Zobraziť históriu trás</ListItemText></MenuItem>
                <MenuItem onClick={() => { if (historyMenu.vehicleId) saveCurrentVehicleRoute(historyMenu.vehicleId); handleVehicleMenuClose(); }}><ListItemIcon><SaveIcon fontSize="small" /></ListItemIcon><ListItemText>Uložiť aktuálnu trasu</ListItemText></MenuItem>
            </Menu>
            <HistoryRoutesDialog 
                open={historyDialogOpen}
                onClose={handleCloseHistoryDialog}
                routes={routeHistory}
                onSelectRoute={handleSelectHistoryRoute}
                startDate={dateRangeFilter.startDate}
                endDate={dateRangeFilter.endDate}
                onStartDateChange={(date) => setDateRangeFilter(prev => ({ ...prev, startDate: date }))}
                onEndDateChange={(date) => setDateRangeFilter(prev => ({ ...prev, endDate: date }))}
                onFilterClick={filterHistory} 
            />
            <SaveRouteDialog 
                open={saveRouteDialog.open}
                onClose={() => setSaveRouteDialog(prev => ({ ...prev, open: false }))}
                routeName={saveRouteDialog.routeName}
                routeNotes={saveRouteDialog.routeNotes}
                onNameChange={(value) => setSaveRouteDialog(prev => ({ ...prev, routeName: value }))}
                onNotesChange={(value) => setSaveRouteDialog(prev => ({ ...prev, routeNotes: value }))}
                onSave={confirmSaveRoute}
            />
        </Box>
    );
};

export default VehicleMap; 