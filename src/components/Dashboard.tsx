import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  styled,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  CircularProgress,
  Fade,
  Grow,
  Skeleton,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  Contacts as ContactsIcon,
  DriveEta as DriveEtaIcon,
  AccessTime as AccessTimeIcon,
} from '@mui/icons-material';
import { collection, query, getDocs, where, Timestamp, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import CountUp from 'react-countup';
import { useThemeMode } from '../contexts/ThemeContext';
import { format, formatDistanceToNow } from 'date-fns';
import { sk } from 'date-fns/locale';

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

const PageWrapper = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode, theme }) => ({
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

const PageHeader = styled(Box)(({ theme }) => ({
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

const PageTitle = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1.75rem',
  fontWeight: 700,
  color: isDarkMode ? '#ffffff' : '#000000',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-8px',
    left: 0,
    width: '60px',
    height: '4px',
    backgroundColor: '#ff9f43',
    borderRadius: '2px',
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

const COLORS = ['#ff9f43', '#ffd43b', '#ff6b6b', '#ff9ff3', '#48dbfb'];

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
  const [error, setError] = useState<string | null>(null);

  // Fetch jednorazových dát
  const fetchStaticData = async () => {
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
    } catch (err) {
      console.error('Chyba pri načítaní statických dát:', err);
      setError('Nepodarilo sa načítať všetky dáta');
    }
  };

  useEffect(() => {
    let unsubscribeVehicles: (() => void) | undefined;
    let unsubscribeBusinessCases: (() => void) | undefined;
    let isMounted = true;

    const setupListeners = async () => {
      if (!userData?.companyID) return;

      try {
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
                  setError('Nepodarilo sa načítať údaje o vozidlách');
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
                const statusDistribution = Object.entries(statusMap).map(([name, value]) => ({
                  name,
                  value,
                  total: cases.length
                }));

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
                
                // Pridáme malé oneskorenie aby sa animácia zobrazila
                setTimeout(() => {
                  setStatusGraphLoading(false);
                }, 800);
              },
              (error) => {
                console.error('Chyba pri sledovaní business cases:', error);
                if (retryCount < 3) {
                  setTimeout(() => setupBusinessCasesListener(retryCount + 1), 1000 * (retryCount + 1));
                } else {
                  setError('Nepodarilo sa načítať obchodné prípady');
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

        // Spustenie listenerov
        await Promise.all([
          setupVehiclesListener(),
          setupBusinessCasesListener(),
          fetchStaticData()
        ]);

      } catch (error) {
        console.error('Chyba pri nastavovaní listenerov:', error);
        setError('Nepodarilo sa načítať dáta');
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
  }, [userData?.companyID]);

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

  const getStatusChipStyles = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return { backgroundColor: 'rgba(76, 175, 80, 0.2)', color: '#4caf50' };
      case 'PENDING':
        return { backgroundColor: 'rgba(255, 152, 0, 0.2)', color: '#ff9800' };
      case 'INTERESTED':
        return { backgroundColor: 'rgba(33, 150, 243, 0.2)', color: '#2196f3' }; // Blue
      case 'EMAIL_SENT':
        return { backgroundColor: 'rgba(156, 39, 176, 0.2)', color: '#9c27b0' }; // Purple
      case 'CLOSED':
        return { backgroundColor: 'rgba(158, 158, 158, 0.2)', color: '#9e9e9e' }; // Grey
      case 'CANCELED':
        return { backgroundColor: 'rgba(97, 97, 97, 0.2)', color: '#616161' };    // Dark Grey
      case 'REJECTED':
        return { backgroundColor: 'rgba(211, 47, 47, 0.2)', color: '#d32f2f' };   // Dark Red
      default:
        return { backgroundColor: 'rgba(244, 67, 54, 0.2)', color: '#f44336' }; // Default Red
    }
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
                <Fade in={statusGraphLoading} timeout={800}>
                  <Box sx={{ width: '100%' }}>
                    {/* Skeleton pre graf počas načítania */}
                    <Skeleton 
                      variant="rectangular" 
                      width="100%" 
                      height={24} 
                      sx={{ 
                        borderRadius: '12px',
                        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                        mb: 2
                      }} 
                    />
                    
                    <Box sx={{ 
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 2,
                      mt: 1
                    }}>
                      {[1, 2, 3, 4].map((item) => (
                        <Box
                          key={item}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            flexBasis: { xs: '45%', sm: 'auto' }
                          }}
                        >
                          <Skeleton 
                            variant="rectangular" 
                            width={12} 
                            height={12} 
                            sx={{ 
                              borderRadius: '3px',
                              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                            }} 
                          />
                          <Skeleton 
                            variant="text" 
                            width={100} 
                            sx={{ 
                              bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                            }} 
                          />
                        </Box>
                      ))}
                    </Box>
                    
                    <Skeleton 
                      variant="text" 
                      width={80} 
                      sx={{ 
                        mt: 1,
                        bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                      }} 
                    />
                  </Box>
                </Fade>
              ) : (
                <Grow in={!statusGraphLoading} timeout={800}>
                  <Box sx={{ 
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: { xs: 1.5, sm: 2 },
                    position: 'relative'
                  }}>
                    {/* Progress Bar Container */}
                    <Box sx={{ 
                      width: '100%',
                      height: { xs: '20px', sm: '24px' },
                      borderRadius: { xs: '10px', sm: '12px' },
                      overflow: 'hidden',
                      display: 'flex',
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                    }}>
                      {stats.statusDistribution.map((item, index) => {
                        const percentage = (item.value / (item.total || 1)) * 100;
                        return (
                          <Box
                            key={item.name}
                            sx={{
                              width: `${percentage}%`,
                              height: '100%',
                              backgroundColor: COLORS[index % COLORS.length],
                              position: 'relative',
                              borderRight: index !== stats.statusDistribution.length - 1 ? '2px solid rgba(0,0,0,0.1)' : 'none',
                              transition: 'width 1s ease-in-out',
                              animation: `growWidth 1.2s ease-out ${index * 0.15}s`,
                              '@keyframes growWidth': {
                                from: { width: '0%' },
                                to: { width: `${percentage}%` }
                              }
                            }}
                          />
                        );
                      })}
                    </Box>

                    {/* Legend */}
                    <Box
                      sx={{ 
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: { xs: 1, sm: 2 },
                        mt: { xs: 0.5, sm: 1 }
                      }}
                    >
                      {stats.statusDistribution.map((item, index) => (
                        <Fade 
                          key={item.name}
                          in={true} 
                          timeout={500} 
                          style={{ transitionDelay: `${150 + index * 100}ms` }}
                        >
                          <Box
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
                                backgroundColor: COLORS[index % COLORS.length]
                              }}
                            />
                            <Typography sx={{ 
                              color: isDarkMode ? '#ffffff' : '#000000',
                              fontSize: { xs: '0.8rem', sm: '0.9rem' },
                              fontWeight: 500
                            }}>
                              {item.name}: {item.value} ({((item.value / (item.total || 1)) * 100).toFixed(1)}%)
                            </Typography>
                          </Box>
                        </Fade>
                      ))}
                    </Box>

                    {/* Total */}
                    <Fade in={true} timeout={800} style={{ transitionDelay: '600ms' }}>
                      <Typography sx={{ 
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                        fontSize: { xs: '0.8rem', sm: '0.9rem' },
                        fontWeight: 500,
                        mt: { xs: 0.5, sm: 1 }
                      }}>
                        Celkom: {stats.statusDistribution.reduce((acc, curr) => acc + curr.value, 0)}
                      </Typography>
                    </Fade>
                  </Box>
                </Grow>
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