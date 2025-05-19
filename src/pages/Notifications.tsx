import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Chat as ChatIcon,
  AccessTime as AccessTimeIcon,
  Business as BusinessIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  MarkEmailRead as MarkEmailReadIcon
} from '@mui/icons-material';
import { useNotifications} from '../contexts/NotificationsContext';
import { useThemeMode } from '../contexts/ThemeContext';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

const Notifications = () => {
  const { notifications, loading, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const { isDarkMode } = useThemeMode();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <ChatIcon fontSize="small" />;
      case 'reminder':
        return <AccessTimeIcon fontSize="small" />;
      case 'business':
        return <BusinessIcon fontSize="small" />;
      default:
        return <NotificationsIcon fontSize="small" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'primary';
      case 'reminder':
        return 'warning';
      case 'business':
        return 'success';
      default:
        return 'default';
    }
  };

  const formatDateTime = (timestamp: Timestamp | null): string => {
    if (!timestamp) return 'Neznámy čas';
    return format(timestamp.toDate(), 'dd.MM.yyyy HH:mm');
  };

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', margin: '0 auto' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3 
      }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Notifikácie
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<MarkEmailReadIcon />}
            onClick={() => markAllAsRead()}
            disabled={loading || notifications.filter(n => !n.read).length === 0}
          >
            Označiť všetky ako prečítané
          </Button>
          <IconButton 
            onClick={() => refreshNotifications()}
            disabled={loading}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Paper 
          sx={{ 
            p: 4, 
            textAlign: 'center',
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          }}
        >
          <NotificationsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Nemáte žiadne notifikácie
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {notifications.map((notification) => (
            <Paper
              key={notification.id}
              sx={{
                p: 2,
                backgroundColor: notification.read 
                  ? (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)')
                  : (isDarkMode ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.05)'),
                border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: 2
                }
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {getNotificationIcon(notification.type)}
                  <Typography variant="subtitle1" fontWeight="bold">
                    {notification.title}
                  </Typography>
                  <Chip
                    size="small"
                    label={notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                    color={getNotificationColor(notification.type)}
                    sx={{ height: '24px' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="caption" color="text.secondary">
                    {formatDateTime(notification.createdAt)}
                  </Typography>
                  {!notification.read && (
                    <Tooltip title="Označiť ako prečítané">
                      <IconButton 
                        size="small" 
                        onClick={() => markAsRead(notification.id)}
                      >
                        <MarkEmailReadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
              
              <Typography variant="body1" sx={{ mb: 2 }}>
                {notification.message}
              </Typography>

              {notification.metadata && Object.keys(notification.metadata).length > 0 && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {notification.metadata.orderId && (
                      <Chip
                        size="small"
                        label={`Objednávka: ${notification.metadata.orderId}`}
                        sx={{ height: '24px' }}
                      />
                    )}
                    {notification.metadata.businessCaseId && (
                      <Chip
                        size="small"
                        label={`Obchodný prípad: ${notification.metadata.businessCaseId}`}
                        sx={{ height: '24px' }}
                      />
                    )}
                    {notification.metadata.transportId && (
                      <Chip
                        size="small"
                        label={`Preprava: ${notification.metadata.transportId}`}
                        sx={{ height: '24px' }}
                      />
                    )}
                  </Box>
                </>
              )}
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Notifications; 