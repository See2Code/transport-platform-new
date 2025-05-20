import React, { useState, useEffect, useCallback } from 'react';
import { 
  styled,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
} from '@mui/material';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import Paper from '@mui/material/Paper';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Card from '@mui/material/Card';
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  Contacts as ContactsIcon,
  DriveEta as DriveEtaIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { collection, query, getDocs, where, Timestamp, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import CountUp from 'react-countup';
import { useThemeMode } from '../../contexts/ThemeContext';
import { formatDistanceToNow } from 'date-fns';
import { sk } from 'date-fns/locale';
import { PageTitle } from '../styled/PageTitle';

interface BusinessCase {
  id?: string;
  companyName: string;
  vatNumber: string;
  status: string;
  createdAt: Timestamp | any;
  companyID: string;
  client?: string;
  value?: number;
  currency?: string;
}

interface VehicleLocation {
  id: string;
  latitude: number;
  longitude: number;
  driverName: string;
  companyID: string;
  lastUpdate: Timestamp | any;
  status: string;
  licensePlate?: string;
  isOffline?: boolean;
  lastOnline?: Timestamp | any;
}

const PageWrapper = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode, _theme }) => ({
  padding: '24px',
  minHeight: '100vh',
  background: 'transparent',
  color: isDarkMode ? '#ffffff' : '#333333',
  position: 'relative',
  '& > *': {
    position: 'relative',
    zIndex: 1,
  },
  '@media (max-width: 600px)': {
    padding: '16px',
    paddingBottom: '80px',
    overflowX: 'hidden',
    width: '100%',
    maxWidth: '100vw'
  }
}));

const PageHeader = styled(Box)(({ _theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
  '@media (max-width: 600px)': {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px'
  }
}));

const StatsCard = styled(Card)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.75)' : '#ffffff',
  borderRadius: '16px !important',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'} !important`,
  boxShadow: `${isDarkMode 
    ? '0 4px 12px rgba(0, 0, 0, 0.15)'
    : '0 4px 12px rgba(0, 0, 0, 0.1)'} !important`,
  transition: 'all 0.2s ease-in-out',
  overflow: 'hidden',
  position: 'relative',
  '&.MuiPaper-root': {
    backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.75)' : '#ffffff !important',
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'} !important`,
  },
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    backgroundColor: '#ff9f43'
  },
  '& .MuiTypography-h4': {
    color: isDarkMode ? '#ffffff' : '#2d3436',
    fontWeight: 600,
    fontSize: '2rem'
  },
  '& .MuiTypography-body1': {
    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(45, 52, 54, 0.7)',
    fontWeight: 500
  },
  '& .MuiSvgIcon-root': {
    filter: `drop-shadow(0 2px 4px ${isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.2)'})`
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(255, 159, 67, 0.3) !important',
    border: '1px solid rgba(255, 159, 67, 0.3) !important',
    '& .MuiCardContent-root': {
      background: 'linear-gradient(180deg, rgba(255, 159, 67, 0.1) 0%, rgba(255, 159, 67, 0) 100%)',
    }
  }
}));

const StatsCardContent = styled(CardContent)({
  padding: '24px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  transition: 'all 0.3s ease',
  position: 'relative',
  zIndex: 1,
  '&:last-child': {
    paddingBottom: '24px'
  }
});

const COLORS = ['#ff9f43', '#ffd43b', '#ff6b6b', '#ff9ff3', '#48dbfb', '#4caf50', '#9e9e9e'];

// Definujeme mapovanie statusov na farby, aby sme mali konzistenciu v celej aplikácii
const STATUS_COLORS: Record<string, string> = {
  'ACTIVE': '#ff9f43',     // oranžová
  'PENDING': '#ffd43b',    // žltá
  'MEETING': '#ffd43b',    // žltá
  'INTERESTED': '#4caf50', // zelená
  'EMAIL_SENT': '#48dbfb', // modrá
  'CALLED': '#ff9f43',     // oranžová
  'CALL_LATER': '#ff9ff3', // ružová
  'NOT_CALLED': '#9c27b0', // tmavo fialová (zmenené z bordovej)
  'NOT_INTERESTED': '#ff6b6b', // červená
  'CLOSED': '#9e9e9e',     // šedá
  'CANCELED': '#616161',   // tmavá šedá
  'REJECTED': '#d32f2f',   // tmavá červená
  'IN_PROGRESS': '#ff9f43', // oranžová
};

// Pridáme animovaný box komponent
const AnimatedBox = styled(Box)<{ delay?: string; duration?: string; animation?: string }>(
  ({ delay = '0s', duration = '0.6s', animation = 'fadeIn' }) => ({
    opacity: 0,
    animation: `${animation} ${duration} cubic-bezier(0.4, 0, 0.2, 1) ${delay} forwards`,
    '@keyframes fadeIn': {
      '0%': {
        opacity: 0,
        transform: 'translateY(8px)',
      },
      '100%': {
        opacity: 1,
        transform: 'translateY(0)',
      },
    },
    '@keyframes scaleIn': {
      '0%': {
        opacity: 0,
        transform: 'scale(0.95)',
      },
      '100%': {
        opacity: 1,
        transform: 'scale(1)',
      },
    },
    '@keyframes slideFromLeft': {
      '0%': {
        opacity: 0,
        transform: 'translateX(-20px)',
      },
      '100%': {
        opacity: 1,
        transform: 'translateX(0)',
      },
    },
  })
);

// Vytvoríme animovaný kontajner pre celý graf - nový prístup s maska efektom
const AnimatedGraphContainer = styled(Box)(({ _theme }) => ({
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
  maskImage: 'linear-gradient(to right, black 0%, black 100%)',
  WebkitMaskImage: 'linear-gradient(to right, black 0%, black 100%)',
  maskSize: '0% 100%',
  WebkitMaskSize: '0% 100%',
  maskRepeat: 'no-repeat',
  WebkitMaskRepeat: 'no-repeat',
  maskPosition: 'left',
  WebkitMaskPosition: 'left',
  animation: 'revealMask 1.4s cubic-bezier(0.33, 1, 0.68, 1) forwards',
  '@keyframes revealMask': {
    '0%': {
      maskSize: '0% 100%',
      WebkitMaskSize: '0% 100%'
    },
    '100%': {
      maskSize: '100% 100%',
      WebkitMaskSize: '100% 100%'
    }
  }
}));

// Upravíme progressbar segment - odstránime vlastnú animáciu
const ProgressBarSegment = styled(Box)<{ 
  percentage: number; 
  isDarkMode: boolean; 
  color: string; 
  sx?: any;
}>(({ percentage, isDarkMode, color, sx }) => ({
  width: `${percentage}%`,
  height: '100%',
  backgroundColor: color,
  position: 'relative',
  ...sx
}));

export default function Dashboard() {
  const { userData } = useAuth();
  const { isDarkMode } = useThemeMode();
  const [stats, setStats] = useState({
    totalBusinessCases: 0,
    totalContacts: 0,
    activeBusinessCases: 0,
    totalTeamMembers: 0,
    totalDrivers: 0,
    statusDistribution: [] as { name: string; value: number; total?: number }[],
    recentBusinessCases: [] as BusinessCase[],
  });
  const [activeVehicles, setActiveVehicles] = useState<VehicleLocation[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(true);
  const [statusGraphLoading, setStatusGraphLoading] = useState(true);

  // Fetch jednorazových dát - použitie useCallback, aby sme mali stabilnú referenciu na funkciu
  const fetchStaticData = useCallback(async () => {
    if (!userData?.companyID) return;

    try {
      const [contactsSnap, usersSnap, driversSnap] = await Promise.all([
        getDocs(query(collection(db, 'contacts'), where('companyID', '==', userData.companyID))),
        getDocs(query(collection(db, 'users'), where('companyID', '==', userData.companyID))),
        getDocs(query(collection(db, 'users'), 
          where('companyID', '==', userData.companyID),
          where('role', '==', 'driver')
        ))
      ]);

      setStats(prev => ({
        ...prev,
        totalContacts: contactsSnap.size,
        totalTeamMembers: usersSnap.size,
        totalDrivers: driversSnap.size
      }));
    } catch (_error) {
      console.error('Error fetching static data:', _error);
    }
  }, [userData]);

  useEffect(() => {
    let unsubscribeVehicles: (() => void) | undefined;
    let unsubscribeBusinessCases: (() => void) | undefined;
    let isMounted = true;

    const setupListeners = async () => {
      if (!userData?.companyID) return;

      try {
        // Najprv vykonáme fetchStaticData
        await fetchStaticData();
        
        // Nastavenie poslucháča pre vozidlá s retry logikou
        const setupVehiclesListener = async (retryCount = 0) => {
          try {
            const vehiclesQuery = query(
              collection(db, 'vehicleLocations'),
              where('companyID', '==', userData.companyID),
              orderBy('lastUpdate', 'desc')
            );

            unsubscribeVehicles = onSnapshot(vehiclesQuery, 
              (snapshot) => {
                if (!isMounted) return;
                const vehicles = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                })) as VehicleLocation[];
                setActiveVehicles(vehicles);
                setVehiclesLoading(false);
              },
              (error) => {
                console.error('Chyba pri sledovaní vozidiel:', error);
                if (retryCount < 3) {
                  setTimeout(() => setupVehiclesListener(retryCount + 1), 1000 * (retryCount + 1));
                } else {
                  setVehiclesLoading(false);
                }
              }
            );
          } catch (err) {
            console.error('Chyba pri nastavovaní vehicle listenera:', err);
            if (retryCount < 3) {
              setTimeout(() => setupVehiclesListener(retryCount + 1), 1000 * (retryCount + 1));
            }
          }
        };

        // Nastavenie poslucháča pre business cases s retry logikou
        const setupBusinessCasesListener = async (retryCount = 0) => {
          try {
            setStatusGraphLoading(true);
            
            // Nastavíme dátum pred 14 dňami pre filtrovanie záznamov
            const fourteenDaysAgo = new Date();
            fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
            const fourteenDaysAgoTimestamp = Timestamp.fromDate(fourteenDaysAgo);

            const businessCasesQuery = query(
              collection(db, 'businessCases'),
              where('companyID', '==', userData.companyID),
              where('createdAt', '>=', fourteenDaysAgoTimestamp),
              orderBy('createdAt', 'desc')
            );

            unsubscribeBusinessCases = onSnapshot(businessCasesQuery,
              (snapshot) => {
                if (!isMounted) return;
                const cases = snapshot.docs.map(doc => ({
                  id: doc.id,
                  ...doc.data()
                })) as BusinessCase[];
                
                // Výpočet rozdelenia podľa statusu
                const statusMap: { [key: string]: number } = {};
                cases.forEach(bc => {
                  const status = (bc.status || 'Neznámy').toUpperCase();
                  statusMap[status] = (statusMap[status] || 0) + 1;
                });
                
                // Prevedieme na pole a zoradíme podľa hodnoty (zostupne)
                const statusDistribution = Object.entries(statusMap)
                  .map(([name, value]) => ({
                    name,
                    value,
                    total: cases.length
                  }))
                  .sort((a, b) => b.value - a.value); // Zoradíme zostupne podľa hodnoty

                setStats(prev => ({
                  ...prev,
                  totalBusinessCases: snapshot.size,
                  recentBusinessCases: cases.slice(0, 5), // Zobrazíme len 5 najnovších prípadov v zozname
                  activeBusinessCases: cases.filter(bc => 
                    bc.status !== 'CLOSED' && 
                    bc.status !== 'CANCELED' && 
                    bc.status !== 'REJECTED'
                  ).length,
                  statusDistribution
                }));
                
                // Pridáme oneskorenie, aby používateľ videl plynulý prechod
                setTimeout(() => {
                  setStatusGraphLoading(false);
                }, 1000);
              },
              (error) => {
                console.error('Chyba pri sledovaní business cases:', error);
                if (retryCount < 3) {
                  setTimeout(() => setupBusinessCasesListener(retryCount + 1), 1000 * (retryCount + 1));
                } else {
                  setStatusGraphLoading(false);
                }
              }
            );
          } catch (err) {
            console.error('Chyba pri nastavovaní business cases listenera:', err);
            if (retryCount < 3) {
              setTimeout(() => setupBusinessCasesListener(retryCount + 1), 1000 * (retryCount + 1));
            } else {
              setStatusGraphLoading(false);
            }
          }
        };

        // Spustenie listenerov - fetchStaticData sme už vyvolali, netreba ho tu volať znova
        await Promise.all([
          setupVehiclesListener(),
          setupBusinessCasesListener(),
        ]);

      } catch (error) {
        console.error('Chyba pri nastavovaní listenerov:', error);
        setVehiclesLoading(false);
      }
    };

    setupListeners();

    return () => {
      isMounted = false;
      if (unsubscribeVehicles) {
        try {
          unsubscribeVehicles();
        } catch (err) {
          console.error('Chyba pri odpájaní vehicle listenera:', err);
        }
      }
      if (unsubscribeBusinessCases) {
        try {
          unsubscribeBusinessCases();
        } catch (err) {
          console.error('Chyba pri odpájaní business cases listenera:', err);
        }
      }
    };
  }, [userData, fetchStaticData]); // pridaný fetchStaticData ako závislosť

  // Helper function to format time ago
  const formatTimeAgo = (timestamp: Timestamp | any) => {
    if (!timestamp) return 'Neznámy čas';
    
    let date;
    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }
    
    return formatDistanceToNow(date, { addSuffix: true, locale: sk });
  };

  const getDriverStatusColor = (vehicle: VehicleLocation) => {
    if (vehicle.isOffline) return '#ff9f43'; // Orange for explicitly offline

    const lastUpdate = vehicle.lastUpdate?.toDate?.() || 
                       (vehicle.lastUpdate?.seconds ? new Date(vehicle.lastUpdate.seconds * 1000) : null);

    if (!lastUpdate) return '#9e9e9e'; // Grey for unknown status

    // Check if the location update is older than 5 minutes
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    if (lastUpdate > fiveMinutesAgo) {
      return '#4caf50'; // Green for online (updated within 5 mins)
    } else {
      return '#ff9f43'; // Orange for inactive/offline (updated > 5 mins ago)
    }
  };

  const getDriverStatus = (vehicle: VehicleLocation) => {
    if (vehicle.isOffline) return 'Offline';
    
    const lastUpdate = vehicle.lastUpdate?.toDate?.() || 
                       (vehicle.lastUpdate?.seconds ? new Date(vehicle.lastUpdate.seconds * 1000) : null);
    
    if (!lastUpdate) return 'Neznámy';
    
    // Kontrola, či je aktualizácia polohy staršia ako 15 minút
    const fifteenMinutesAgo = new Date();
    fifteenMinutesAgo.setMinutes(fifteenMinutesAgo.getMinutes() - 15);
    
    // Kontrola, či je aktualizácia polohy staršia ako 5 minút
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);
    
    if (lastUpdate > fiveMinutesAgo) {
      return 'Online';
    } else if (lastUpdate > fifteenMinutesAgo) {
      return 'Neaktívny';
    } else {
      return 'Offline';
    }
  };

  // Upravíme funkciu getStatusChipStyles aby používala naše definované farby
  const getStatusChipStyles = (status: string) => {
    const statusKey = status?.toUpperCase() || 'NOT_CALLED';
    
    // Získame farbu zo statusu, alebo použijeme default červenú ak status nie je definovaný
    const color = STATUS_COLORS[statusKey] || '#f44336';
    
    return { 
      backgroundColor: `${color}20`, // 20 je hex pre 12% priehľadnosť
      color: color,
      fontWeight: 600,
      fontSize: '0.75rem',
      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      border: `1px solid ${color}40` // 40 je hex pre 25% priehľadnosť
    };
  };

  return (
    <PageWrapper isDarkMode={isDarkMode}>
      <PageHeader>
        <PageTitle isDarkMode={isDarkMode}>Dashboard</PageTitle>
      </PageHeader>

      <Grid container spacing={3}>
        {/* Štatistické karty */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard isDarkMode={isDarkMode}>
            <StatsCardContent>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 2 }, 
                mb: { xs: 1, sm: 2 } 
              }}>
                <BusinessIcon sx={{ 
                  color: '#ff9f43', 
                  fontSize: { xs: 32, sm: 40 } 
                }} />
                <Typography variant="h4" sx={{
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}>
                  <CountUp
                    end={stats.totalBusinessCases}
                    duration={2.5}
                    separator=" "
                  />
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ 
                opacity: 0.7,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}>Obchodné prípady</Typography>
            </StatsCardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard isDarkMode={isDarkMode}>
            <StatsCardContent>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 2 }, 
                mb: { xs: 1, sm: 2 } 
              }}>
                <ContactsIcon sx={{ 
                  color: '#ff9f43', 
                  fontSize: { xs: 32, sm: 40 } 
                }} />
                <Typography variant="h4" sx={{
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}>
                  <CountUp
                    end={stats.totalContacts}
                    duration={2.5}
                    separator=" "
                  />
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ 
                opacity: 0.7,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}>Kontakty</Typography>
            </StatsCardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard isDarkMode={isDarkMode}>
            <StatsCardContent>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 2 }, 
                mb: { xs: 1, sm: 2 } 
              }}>
                <DriveEtaIcon sx={{ 
                  color: '#2196f3', 
                  fontSize: { xs: 32, sm: 40 } 
                }} />
                <Typography variant="h4" sx={{
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}>
                  <CountUp
                    end={stats.totalDrivers}
                    duration={2.5}
                    separator=" "
                  />
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ 
                opacity: 0.7,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}>Počet vodičov</Typography>
            </StatsCardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard isDarkMode={isDarkMode}>
            <StatsCardContent>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 2 }, 
                mb: { xs: 1, sm: 2 } 
              }}>
                <PersonIcon sx={{ 
                  color: '#ff9ff3', 
                  fontSize: { xs: 32, sm: 40 } 
                }} />
                <Typography variant="h4" sx={{
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}>
                  <CountUp
                    end={stats.totalTeamMembers}
                    duration={2.5}
                    separator=" "
                  />
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ 
                opacity: 0.7,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}>Členovia tímu</Typography>
            </StatsCardContent>
          </StatsCard>
        </Grid>

        {/* Grafy */}
        <Grid item xs={12}>
          <StatsCard isDarkMode={isDarkMode}>
            <StatsCardContent>
              <Typography variant="h6" sx={{ 
                mb: { xs: 2, sm: 3 }, 
                color: isDarkMode ? '#ffffff' : '#000000',
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                fontWeight: 600
              }}>
                Rozdelenie podľa statusu (posledných 14 dní)
              </Typography>
              
              {statusGraphLoading ? (
                <Box sx={{ width: '100%' }}>
                  {/* Skeleton pre graf počas načítania */}
                  <Skeleton 
                    variant="rectangular" 
                    width="100%" 
                    height={24} 
                    sx={{ 
                      borderRadius: '12px',
                      bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      mb: 2,
                      animation: 'pulse 1.5s ease-in-out 0.5s infinite',
                      '@keyframes pulse': {
                        '0%': { opacity: 0.6 },
                        '50%': { opacity: 0.8 },
                        '100%': { opacity: 0.6 },
                      }
                    }} 
                  />
                  
                  <Box sx={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 2,
                    mt: 2
                  }}>
                    {[...Array(4)].map((_, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          flexBasis: { xs: '45%', sm: 'auto' },
                          opacity: 0,
                          animation: `fadeIn 0.5s ease-out ${0.2 + index * 0.1}s forwards`,
                          '@keyframes fadeIn': {
                            from: { opacity: 0, transform: 'translateY(8px)' },
                            to: { opacity: 1, transform: 'translateY(0)' }
                          }
                        }}
                      >
                        <Skeleton 
                          variant="rectangular" 
                          width={12} 
                          height={12} 
                          sx={{ 
                            borderRadius: '3px',
                            bgcolor: isDarkMode ? `rgba(255, 255, 255, ${0.1 + index * 0.1})` : `rgba(0, 0, 0, ${0.1 + index * 0.04})`,
                            animation: 'pulse 1.5s ease-in-out 0.5s infinite',
                          }} 
                        />
                        <Skeleton 
                          variant="text" 
                          width={80 + index * 10} 
                          sx={{ 
                            bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                            animation: 'pulse 1.5s ease-in-out 0.5s infinite',
                          }} 
                        />
                      </Box>
                    ))}
                  </Box>
                  
                  <Box 
                    sx={{ 
                      mt: 2,
                      opacity: 0,
                      animation: 'fadeIn 0.5s ease-out 0.6s forwards',
                    }}
                  >
                    <Skeleton 
                      variant="text" 
                      width={80} 
                      sx={{ 
                        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        animation: 'pulse 1.5s ease-in-out 0.5s infinite'
                      }} 
                    />
                  </Box>
                </Box>
              ) : (
                <Box sx={{ 
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: { xs: 1.5, sm: 2 },
                  position: 'relative',
                  animation: 'fadeIn 0.3s ease-out',
                  '@keyframes fadeIn': {
                    from: { opacity: 0 },
                    to: { opacity: 1 }
                  }
                }}>
                  {/* Progress Bar Container */}
                  <Box sx={{ 
                    width: '100%',
                    height: { xs: '20px', sm: '24px' },
                    borderRadius: { xs: '10px', sm: '12px' },
                    overflow: 'hidden',
                    position: 'relative',
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <AnimatedGraphContainer>
                      <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
                        {stats.statusDistribution.map((item, index) => {
                          const percentage = (item.value / (item.total || 1)) * 100;
                          const color = STATUS_COLORS[item.name] || COLORS[index % COLORS.length];
                          
                          return (
                            <ProgressBarSegment
                              key={item.name}
                              percentage={percentage}
                              isDarkMode={isDarkMode}
                              color={color}
                              sx={{
                                borderRight: index === stats.statusDistribution.length - 1 ? 'none' : `2px solid ${isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)'}`
                              }}
                            />
                          );
                        })}
                      </Box>
                    </AnimatedGraphContainer>
                  </Box>

                  {/* Legend */}
                  <Box
                    sx={{ 
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: { xs: 1, sm: 2 },
                      mt: { xs: 1.5, sm: 2 }
                    }}
                  >
                    {stats.statusDistribution.map((item, index) => (
                      <AnimatedBox 
                        key={item.name}
                        delay={`${0.3 + index * 0.1}s`}
                        duration="0.6s"
                        animation="fadeIn"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          flexBasis: { xs: '45%', sm: 'auto' }
                        }}
                      >
                        <Box
                          sx={{
                            width: { xs: '10px', sm: '12px' },
                            height: { xs: '10px', sm: '12px' },
                            borderRadius: '3px',
                            backgroundColor: STATUS_COLORS[item.name] || COLORS[index % COLORS.length],
                            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                          }}
                        />
                        <Typography sx={{ 
                          color: isDarkMode ? '#ffffff' : '#000000',
                          fontSize: { xs: '0.8rem', sm: '0.9rem' },
                          fontWeight: 500
                        }}>
                          {item.name}: {item.value} ({((item.value / (item.total || 1)) * 100).toFixed(1)}%)
                        </Typography>
                      </AnimatedBox>
                    ))}
                  </Box>

                  {/* Total */}
                  <AnimatedBox 
                    delay="0.8s"
                    duration="0.5s"
                    animation="fadeIn"
                    sx={{ 
                      color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                      fontSize: { xs: '0.8rem', sm: '0.9rem' },
                      fontWeight: 500,
                      mt: { xs: 1, sm: 1.5 }
                    }}
                  >
                    <Typography component="span">
                      Celkom: {stats.statusDistribution.reduce((acc, curr) => acc + curr.value, 0)}
                    </Typography>
                  </AnimatedBox>
                </Box>
              )}
            </StatsCardContent>
          </StatsCard>
        </Grid>

        {/* Aktívni vodiči a vozidlá */}
        <Grid item xs={12}>
          <StatsCard isDarkMode={isDarkMode}>
            <StatsCardContent>
              <Typography variant="h6" sx={{ 
                mb: { xs: 2, sm: 3 }, 
                color: isDarkMode ? '#ffffff' : '#000000',
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <DriveEtaIcon sx={{ color: '#2196f3' }} />
                Aktuálny stav vozidiel
              </Typography>

              {vehiclesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress sx={{ color: '#2196f3' }} />
                </Box>
              ) : activeVehicles.length === 0 ? (
                <Typography sx={{ 
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                  py: 4,
                  textAlign: 'center'
                }}>
                  Žiadne aktívne vozidlá neboli nájdené
                </Typography>
              ) : (
                <TableContainer component={Paper} sx={{ 
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  borderRadius: '12px'
                }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ 
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                          fontWeight: 600,
                          borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
                        }}>Vodič</TableCell>
                        <TableCell sx={{ 
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                          fontWeight: 600,
                          borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
                        }}>ŠPZ</TableCell>
                        <TableCell sx={{ 
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                          fontWeight: 600,
                          borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
                        }}>Status</TableCell>
                        <TableCell sx={{ 
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                          fontWeight: 600,
                          borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
                        }}>Posledná aktivita</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeVehicles.map((vehicle) => (
                        <TableRow key={vehicle.id} sx={{ 
                          '&:last-child td, &:last-child th': { border: 0 },
                          '&:hover': {
                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                          }
                        }}>
                          <TableCell sx={{ 
                            color: isDarkMode ? '#ffffff' : '#2d3436',
                            borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ 
                                bgcolor: getDriverStatusColor(vehicle),
                                width: 30,
                                height: 30,
                                fontSize: '0.8rem',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                              }}>
                                {vehicle.driverName?.split(' ').map(name => name[0]).join('') || '?'}
                              </Avatar>
                              <Typography sx={{ 
                                color: isDarkMode ? '#ffffff' : '#000000',
                                fontSize: '0.9rem',
                                fontWeight: 500
                              }}>
                                {vehicle.driverName || 'Neznámy vodič'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ 
                            color: isDarkMode ? '#ffffff' : '#2d3436',
                            borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
                          }}>
                            {vehicle.licensePlate || '-'}
                          </TableCell>
                          <TableCell sx={{ 
                            borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
                          }}>
                            <Chip 
                              label={getDriverStatus(vehicle)}
                              size="small"
                              sx={{
                                backgroundColor: getDriverStatusColor(vehicle),
                                color: '#ffffff',
                                fontSize: '0.7rem',
                                fontWeight: 500,
                                height: '20px',
                                minWidth: '80px'
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ 
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                            fontSize: '0.9rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-start',
                            gap: 0.5,
                            height: '64px',
                            borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
                          }}>
                            <AccessTimeIcon sx={{ fontSize: '1rem' }} />
                            {formatTimeAgo(vehicle.lastUpdate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </StatsCardContent>
          </StatsCard>
        </Grid>

        {/* Posledné obchodné prípady */}
        <Grid item xs={12}>
          <StatsCard isDarkMode={isDarkMode}>
            <StatsCardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <BusinessIcon sx={{ color: '#ff9f43', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, color: isDarkMode ? '#ffffff' : '#2d3436' }}>
                  Posledné obchodné prípady
                </Typography>
              </Box>
              <TableContainer component={Paper} sx={{ 
                backgroundColor: 'transparent',
                boxShadow: 'none',
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                borderRadius: '12px'
              }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ 
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                        fontWeight: 600,
                        borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
                      }}>Názov spoločnosti</TableCell>
                      <TableCell sx={{ 
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                        fontWeight: 600,
                        borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
                      }}>Status</TableCell>
                      <TableCell sx={{ 
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                        fontWeight: 600,
                        borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
                      }}>Vytvorené</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.recentBusinessCases.map((case_, index) => (
                      <TableRow key={case_.id || index} sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        '&:hover': {
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)'
                        }
                      }}>
                        <TableCell sx={{
                          color: isDarkMode ? '#ffffff' : '#2d3436',
                          borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
                        }}>
                          {case_.companyName}
                        </TableCell>
                        <TableCell sx={{
                          borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
                        }}>
                          <Chip
                            label={case_.status || 'Neznámy'}
                            size="small"
                            sx={{
                              ...getStatusChipStyles(case_.status),
                              fontWeight: 600,
                              fontSize: '0.75rem'
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                          borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
                        }}>
                          {case_.createdAt instanceof Timestamp ? 
                            formatDistanceToNow(case_.createdAt.toDate(), { addSuffix: true, locale: sk }) : 
                            case_.createdAt ? formatDistanceToNow(new Date(case_.createdAt), { addSuffix: true, locale: sk }) : 
                            'Neznámy dátum'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </StatsCardContent>
          </StatsCard>
        </Grid>
      </Grid>
    </PageWrapper>
  );
} 