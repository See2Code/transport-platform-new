import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  IconButton,
  Chip,
  Tooltip,
  Divider,
  styled,
  Badge,
  Button,
  Alert,
  Snackbar
} from '@mui/material';
import { collection, query, where, getDocs, orderBy, Timestamp, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import NotificationsIcon from '@mui/icons-material/Notifications';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BusinessIcon from '@mui/icons-material/Business';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import DeleteIcon from '@mui/icons-material/Delete';
import { useThemeMode } from '../contexts/ThemeContext';
import { useNotifications as useNotificationsContext } from '../contexts/NotificationsContext';

// Definícia typov notifikácií
interface Notification {
  id: string;
  type: 'loading' | 'unloading' | 'business'; // Typ notifikácie: nakládka, vykládka, obchodný prípad
  reminderTime?: Timestamp | Date | null; // Čas pripomienky
  reminderDateTime?: Timestamp | Date | null; // Alternatívny názov pre čas pripomienky
  orderNumber?: string; // Číslo objednávky pre pripomienky transportu
  companyName?: string; // Názov firmy pre pripomienky obchodného prípadu
  address?: string; // Adresa pre pripomienky transportu
  sent: boolean; // Či bola odoslaná emailom
  shown?: boolean; // Či bola zobrazená v prehliadači
  createdAt: Timestamp | Date;
  userEmail?: string; // Email používateľa
  transportId?: string; // ID prepravy
  businessCaseId?: string; // ID obchodného prípadu
  reminderNote?: string; // Poznámka k pripomienke
}

// Štýly
const PageWrapper = styled('div')({
  padding: '24px',
  '@media (max-width: 600px)': {
    padding: '16px',
    paddingBottom: '80px',
    overflowX: 'hidden',
    width: '100%',
    maxWidth: '100vw'
  }
});

const PageHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
  '@media (max-width: 600px)': {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px'
  }
});

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

const StyledTableCell = styled(TableCell)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  color: isDarkMode ? '#ffffff' : '#000000',
  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  '&.MuiTableCell-head': {
    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    fontWeight: 600,
  }
}));

const StyledTableRow = styled(TableRow)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  '&:hover': {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  },
  '& .MuiTableCell-root': {
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  }
}));

const NotificationIconContainer = styled(Box)<{ type: string, isDarkMode: boolean }>(({ type, isDarkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  backgroundColor: type === 'business' 
    ? 'rgba(33, 150, 243, 0.15)' 
    : type === 'loading' 
      ? 'rgba(255, 159, 67, 0.15)' 
      : 'rgba(76, 175, 80, 0.15)',
  color: type === 'business' 
    ? '#2196f3' 
    : type === 'loading' 
      ? '#ff9f43' 
      : '#4caf50',
}));

const NotificationCard = styled(Box)<{ isDarkMode: boolean, sent: boolean }>(({ isDarkMode, sent }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  borderRadius: '12px',
  padding: '16px',
  marginBottom: '16px',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  opacity: sent ? 0.7 : 1,
  position: 'relative',
  overflow: 'hidden',
  '&::before': sent ? {
    content: '""',
    position: 'absolute',
    top: 0,
    right: 0,
    width: '60px',
    height: '60px',
    background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(76, 175, 80, 0) 100%)',
    zIndex: 1
  } : {}
}));

const NotificationHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
});

const NotificationTitle = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontWeight: 600,
  fontSize: '1.1rem',
  color: isDarkMode ? '#ffffff' : '#000000',
}));

const NotificationTime = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
  fontSize: '0.85rem',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
}));

const NotificationContent = styled(Box)({
  marginTop: '12px',
});

const NotificationActions = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '16px',
  gap: '8px',
});

// Hlavný komponent
const Notifications = () => {
  const { isDarkMode } = useThemeMode();
  const { userData } = useAuth();
  const { unreadCount, markAsRead, markAllAsRead, fetchNotifications, getLatestNotifications, syncNotifications } = useNotificationsContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Načítanie notifikácií
  const loadNotifications = useCallback(async () => {
    if (!userData?.companyID) {
      console.log("Chýba companyID, nemôžem načítať notifikácie");
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Použijeme len syncNotifications, ktorá už má ochranu proti duplicitným volaniam
      await syncNotifications();
      
      // Synchronizácia už obsahuje načítavanie dát, takže teraz priamo získame najnovšie notifikácie
      // bez synchronizácie, aby sme zabránili duplicitným volaniam
      const notificationsData = await getLatestNotifications(100);
      
      // Aktualizujeme stav len ak sú dáta rozdielne, aby sme predišli zbytočnému prekresľovaniu
      setNotifications(prev => {
        // Porovnáme IDs načítaných notifikácií s existujúcimi
        const currentIds = new Set(prev.map(n => n.id));
        const newIds = new Set(notificationsData.map(n => n.id));
        
        // Porovnáme počet a identifikátory notifikácií
        const isDifferent = 
          prev.length !== notificationsData.length || 
          notificationsData.some(n => !currentIds.has(n.id)) || 
          prev.some(n => !newIds.has(n.id));
        
        // Vrátime nové dáta len ak sa líšia, inak ponecháme existujúci stav
        return isDifferent ? (notificationsData as Notification[]) : prev;
      });
    } catch (error) {
      console.error("Chyba pri načítavaní notifikácií:", error);
      setSnackbar({
        open: true,
        message: "Nastala chyba pri načítavaní notifikácií",
        severity: "error"
      });
    } finally {
      setLoading(false);
    }
  }, [userData?.companyID, getLatestNotifications, syncNotifications]);

  // Načítanie dát pri mountovaní komponentu
  useEffect(() => {
    let isMounted = true;
    
    // Použijeme RAF pre plynulejšie načítanie a zabránenie preblikávania UI
    requestAnimationFrame(() => {
      if (isMounted) {
        loadNotifications();
      }
    });
    
    return () => {
      isMounted = false;
    };
  }, [loadNotifications]);

  // Označenie notifikácie ako prečítanej
  const handleMarkAsRead = async (notificationId: string) => {
    // Ako optimalizáciu, najprv aktualizujeme lokálny stav pre okamžitú odozvu
    // ešte predtým, než začneme komunikovať so serverom
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, sent: true, shown: true } 
          : notification
      )
    );
    
    try {
      await markAsRead(notificationId);
      
      setSnackbar({
        open: true,
        message: "Notifikácia označená ako prečítaná",
        severity: "success"
      });
    } catch (error) {
      console.error("Chyba pri označovaní notifikácie:", error);
      
      // Pri chybe vrátime notifikáciu späť do neprečítaného stavu
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, sent: false, shown: false } 
            : notification
        )
      );
      
      setSnackbar({
        open: true,
        message: "Nastala chyba pri označovaní notifikácie",
        severity: "error"
      });
    }
  };

  // Označenie všetkých notifikácií ako prečítané
  const handleMarkAllAsRead = async () => {
    if (notifications.length === 0) return;
    
    // Najprv aktualizujeme lokálny stav pre okamžitú odozvu
    const originalNotifications = [...notifications];
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ 
        ...notification, 
        sent: true, 
        shown: true 
      }))
    );
    
    try {
      await markAllAsRead();
      
      setSnackbar({
        open: true,
        message: "Všetky notifikácie označené ako prečítané",
        severity: "success"
      });
    } catch (error) {
      console.error("Chyba pri označovaní všetkých notifikácií:", error);
      
      // Pri chybe vrátime stav späť
      setNotifications(originalNotifications);
      
      setSnackbar({
        open: true,
        message: "Nastala chyba pri označovaní notifikácií",
        severity: "error"
      });
    }
  };

  // Formátovať dátum a čas
  const formatDateTime = (date: Timestamp | Date | undefined | null): string => {
    if (!date) return 'Neznámy čas';
    
    if (date instanceof Timestamp) {
      return format(date.toDate(), 'dd.MM.yyyy HH:mm');
    }
    
    return format(new Date(date), 'dd.MM.yyyy HH:mm');
  };

  // Render mobilnej karty notifikácie
  const renderNotificationCard = (notification: Notification) => (
    <NotificationCard key={notification.id} isDarkMode={isDarkMode} sent={notification.sent}>
      <NotificationHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <NotificationIconContainer 
            type={notification.type} 
            isDarkMode={isDarkMode}
          >
            {notification.type === 'business' ? (
              <BusinessIcon />
            ) : notification.type === 'loading' ? (
              <LocalShippingIcon />
            ) : (
              <LocalShippingIcon />
            )}
          </NotificationIconContainer>
          <NotificationTitle isDarkMode={isDarkMode}>
            {notification.type === 'business' 
              ? `Obchodný prípad: ${notification.companyName || 'Neznámy'}`
              : notification.type === 'loading'
                ? `Pripomienka nakládky: ${notification.orderNumber || 'Neznáma objednávka'}`
                : `Pripomienka vykládky: ${notification.orderNumber || 'Neznáma objednávka'}`}
          </NotificationTitle>
        </Box>
        <Chip 
          size="small" 
          label={notification.sent ? "Prečítané" : "Nové"} 
          color={notification.sent ? "default" : "primary"}
          sx={{ 
            height: '24px', 
            fontSize: '0.75rem',
            bgcolor: notification.sent ? isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' : undefined
          }}
        />
      </NotificationHeader>
      
      <Divider sx={{ my: 1 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <NotificationTime isDarkMode={isDarkMode}>
          <AccessTimeIcon sx={{ fontSize: '1rem' }} />
          {formatDateTime(notification.reminderTime || notification.reminderDateTime)}
        </NotificationTime>
        
        <Typography variant="caption" color="textSecondary">
          Vytvorené {formatDateTime(notification.createdAt)}
        </Typography>
      </Box>
      
      <NotificationContent>
        {notification.reminderNote && (
          <Typography variant="body2" sx={{ mt: 1, p: 1, bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)', borderRadius: 1 }}>
            {notification.reminderNote}
          </Typography>
        )}
        
        {notification.address && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Adresa:</strong> {notification.address}
          </Typography>
        )}
      </NotificationContent>
      
      <NotificationActions>
        {!notification.sent && (
          <Button 
            variant="outlined"
            size="small"
            startIcon={<MarkEmailReadIcon />}
            onClick={() => handleMarkAsRead(notification.id)}
            sx={{ borderRadius: '8px', textTransform: 'none' }}
          >
            Označiť ako prečítané
          </Button>
        )}
      </NotificationActions>
    </NotificationCard>
  );

  // Render tabuľky notifikácií pre desktop
  const renderNotificationsTable = (filteredNotifications: Notification[]) => (
    <TableContainer 
      component={Paper} 
      sx={{ 
        backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
        borderRadius: '12px',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <StyledTableCell isDarkMode={isDarkMode} width="5%">Typ</StyledTableCell>
            <StyledTableCell isDarkMode={isDarkMode} width="20%">Detaily</StyledTableCell>
            <StyledTableCell isDarkMode={isDarkMode} width="15%">Čas pripomienky</StyledTableCell>
            <StyledTableCell isDarkMode={isDarkMode} width="40%">Poznámka</StyledTableCell>
            <StyledTableCell isDarkMode={isDarkMode} width="10%">Status</StyledTableCell>
            <StyledTableCell isDarkMode={isDarkMode} width="10%">Akcie</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredNotifications.map((notification) => (
            <StyledTableRow key={notification.id} isDarkMode={isDarkMode}>
              <StyledTableCell isDarkMode={isDarkMode}>
                <NotificationIconContainer type={notification.type} isDarkMode={isDarkMode}>
                  {notification.type === 'business' ? (
                    <BusinessIcon />
                  ) : notification.type === 'loading' ? (
                    <LocalShippingIcon />
                  ) : (
                    <LocalShippingIcon />
                  )}
                </NotificationIconContainer>
              </StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode}>
                {notification.type === 'business' ? (
                  <Typography variant="body2">
                    <strong>Firma:</strong> {notification.companyName || 'Neznáma'}
                  </Typography>
                ) : (
                  <>
                    <Typography variant="body2">
                      <strong>Objednávka:</strong> {notification.orderNumber || 'Neznáma'}
                    </Typography>
                    {notification.address && (
                      <Typography variant="body2">
                        <strong>Adresa:</strong> {notification.address}
                      </Typography>
                    )}
                  </>
                )}
              </StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode}>
                {formatDateTime(notification.reminderTime || notification.reminderDateTime)}
              </StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode}>
                {notification.reminderNote || '-'}
              </StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode}>
                <Chip 
                  size="small" 
                  label={notification.sent ? "Prečítané" : "Nové"} 
                  color={notification.sent ? "default" : "primary"}
                  sx={{ height: '24px', fontSize: '0.75rem' }}
                />
              </StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode}>
                {!notification.sent && (
                  <Tooltip title="Označiť ako prečítané">
                    <IconButton
                      size="small"
                      onClick={() => handleMarkAsRead(notification.id)}
                      sx={{ color: '#4caf50' }}
                    >
                      <MarkEmailReadIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </StyledTableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <PageWrapper>
      <PageHeader>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PageTitle isDarkMode={isDarkMode}>Notifikácie</PageTitle>
          {unreadCount > 0 && (
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon color="primary" />
            </Badge>
          )}
        </Box>
        
        {unreadCount > 0 && (
          <Button
            variant="outlined"
            startIcon={<MarkEmailReadIcon />}
            onClick={handleMarkAllAsRead}
            disabled={loading}
            sx={{ 
              borderRadius: '8px', 
              textTransform: 'none',
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              } 
            }}
          >
            Označiť všetky ako prečítané
          </Button>
        )}
      </PageHeader>

      {loading && notifications.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          Nemáte žiadne notifikácie
        </Alert>
      ) : (
        <>
          {/* Zobrazíme diskrétny indikátor načítavania, keď sa aktualizujú existujúce dáta */}
          {loading && notifications.length > 0 && (
            <Box sx={{ 
              position: 'fixed', 
              top: '80px', 
              right: '20px', 
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.9)',
              padding: '4px 10px',
              borderRadius: '20px',
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
            }}>
              <CircularProgress size={16} thickness={5} />
              <Typography variant="caption" sx={{ color: isDarkMode ? 'white' : 'black' }}>
                Aktualizujem...
              </Typography>
            </Box>
          )}
          
          {/* Mobilné zobrazenie - zobrazíme len neprečítané alebo všetky, ak nie sú žiadne neprečítané */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {notifications
              .filter(notification => !notification.sent || unreadCount === 0)
              .map(notification => renderNotificationCard(notification))}
            {unreadCount === 0 && notifications.some(n => n.sent) && (
              <Typography sx={{ textAlign: 'center', mt: 2, mb: 2, color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                Všetky notifikácie boli prečítané
              </Typography>
            )}
          </Box>

          {/* Desktop zobrazenie - zobrazíme len neprečítané alebo všetky, ak nie sú žiadne neprečítané */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            {unreadCount > 0 ? (
              renderNotificationsTable(notifications.filter(notification => !notification.sent))
            ) : (
              <>
                {renderNotificationsTable(notifications)}
                <Typography sx={{ textAlign: 'center', mt: 2, mb: 2, color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                  Všetky notifikácie boli prečítané
                </Typography>
              </>
            )}
          </Box>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageWrapper>
  );
};

export default Notifications; 