import React from 'react';
import {
  Box,
  Typography,
  IconButton,
  Chip,
  Tooltip,
  styled,
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  FileDownload as FileDownloadIcon,
  Person as PersonIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { OrderFormData } from '../../types/orders';
import { useThemeMode } from '../../contexts/ThemeContext';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';

interface MobileOrderCardProps {
  order: OrderFormData;
  onEdit: (order: OrderFormData) => void;
  onDelete: (id: string) => void;
  onPreviewPDF: (order: OrderFormData) => Promise<void>;
  onDownloadPDF: (order: OrderFormData) => Promise<void>;
}

const StyledMobileOrderCard = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' 
    ? 'rgba(28, 28, 45, 0.75)' 
    : 'rgba(255, 255, 255, 0.95)',
  borderRadius: '16px !important',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(0, 0, 0, 0.1)'}`,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 4px 12px rgba(0, 0, 0, 0.2)'
    : '0 4px 12px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease-in-out',
  overflow: 'hidden',
  position: 'relative',
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    backgroundColor: theme.palette.mode === 'dark' ? '#ff9f43' : theme.palette.primary.main, // Prispôsobenie farby
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.palette.mode === 'dark' 
      ? '0 8px 24px rgba(255, 159, 67, 0.3) !important' // Responzívny tieň
      : '0 8px 24px rgba(0, 0, 0, 0.15) !important', // Responzívny tieň
    border: theme.palette.mode === 'dark' 
      ? '1px solid rgba(255, 159, 67, 0.3) !important' 
      : '1px solid rgba(0, 0, 0, 0.15) !important',
  }
}));

const CardHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(1),
  width: '100%',
}));

const CompanyName = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  fontSize: '1.1rem',
  color: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.text.primary,
}));

const CardContent = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  width: '100%',
}));

const InfoRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  '& .MuiSvgIcon-root': {
    fontSize: '1rem',
    marginRight: theme.spacing(1),
    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : theme.palette.text.secondary,
  },
  '& .MuiTypography-root': {
     color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.9)' : theme.palette.text.primary,
     fontSize: '0.9rem'
  }
}));

const CardActions = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '4px',
  marginTop: '8px',
  paddingTop: '8px',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
});

const MobileOrderCard: React.FC<MobileOrderCardProps> = ({
  order,
  onEdit,
  onDelete,
  onPreviewPDF,
  onDownloadPDF
}) => {
  const { isDarkMode } = useThemeMode();
  const theme = useTheme();

  const displayDate = order.createdAt 
    ? (order.createdAt instanceof Date 
      ? format(order.createdAt, 'dd.MM.yyyy HH:mm', { locale: sk })
      : format(order.createdAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: sk }))
    : '';

  return (
    <StyledMobileOrderCard theme={theme} >
      <CardHeader theme={theme}>
        <CompanyName theme={theme}>
          {order.customerCompany || 'Neznámy zákazník'}
        </CompanyName>
        {order.orderNumberFormatted && (
             <Chip 
                label={`Obj. ${order.orderNumberFormatted}`}
                size="small"
                sx={{
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                    color: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.text.primary,
                    fontWeight: 'bold'
                }}
            />
        )}
      </CardHeader>
      <CardContent theme={theme}>
        <InfoRow theme={theme}>
          <Typography variant="body2">Dátum vytvorenia:</Typography>
          <Typography variant="body2">{displayDate}</Typography>
        </InfoRow>
        {order.customerPrice && (
           <InfoRow theme={theme}>
              <Typography variant="body2">Cena:</Typography>
              <Typography variant="body2">{order.customerPrice} €</Typography>
           </InfoRow>
        )}
         {(order as any).createdByName && (
            <InfoRow theme={theme}>
                 <PersonIcon fontSize="small" />
                 <Typography variant="body2">{(order as any).createdByName}</Typography>
            </InfoRow>
         )}
         {order.customerEmail && (
            <InfoRow theme={theme}>
                 <EmailIcon fontSize="small" />
                 <Typography variant="body2">{order.customerEmail}</Typography>
            </InfoRow>
         )}
        {/* Môžete pridať ďalšie dôležité informácie o objednávke */}
      </CardContent>
      <CardActions>
        <Tooltip title="Upraviť objednávku">
          <IconButton size="small" onClick={() => onEdit(order)}>
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zmazať objednávku">
          <IconButton size="small" onClick={() => onDelete(order.id!)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Zobraziť PDF">
          <IconButton size="small" onClick={() => onPreviewPDF(order)}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Stiahnuť PDF">
          <IconButton size="small" onClick={() => onDownloadPDF(order)}>
            <FileDownloadIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </StyledMobileOrderCard>
  );
};

export default MobileOrderCard; 