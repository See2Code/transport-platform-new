import React, { useState, ChangeEvent, useEffect, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  Button, 
  IconButton,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TablePagination,
  Tabs,
  Tab,
  Grid,
  useMediaQuery,
  useTheme,
  styled,
  Divider,
  Collapse,
  Autocomplete
} from '@mui/material';
import { useThemeMode } from '../../contexts/ThemeContext';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers';
import { sk } from 'date-fns/locale';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DescriptionIcon from '@mui/icons-material/Description';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Tooltip from '@mui/material/Tooltip';
import { collection, addDoc, query, where, getDocs, Timestamp, orderBy, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';

import NewOrderWizard from './NewOrderWizard';
import CloseIcon from '@mui/icons-material/Close';
import CustomerForm, { CustomerData } from '../management/CustomerForm';
import LocationForm, { LocationData } from '../management/LocationForm';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase';
import MobileOrderCard from './MobileOrderCard'; // Import nového komponentu
import OrderDetail from './OrderDetail';
import DocumentManager from './DocumentManager';
import DocumentsIndicator from './DocumentsIndicator';
import { DOCUMENT_TYPE_CONFIG } from '../../types/documents';
// import RatingIndicator from '../common/RatingIndicator';
import CustomerRatingDialog from '../dialogs/CustomerRatingDialog';
import CarrierRatingDialog from '../dialogs/CarrierRatingDialog';
import OrderRatingDialog from '../dialogs/OrderRatingDialog';
import LanguageSelector from './LanguageSelector';
import { Customer, CustomerRating } from '../../types/customers';
import { Carrier, CarrierRating } from '../../types/carriers';
import StarIcon from '@mui/icons-material/Star';
// import OrderRatingDialog from '../dialogs/OrderRatingDialog';
import { OrderRating } from '../../types/orders';
import BareTooltip from '../common/BareTooltip';
import { OrderFormData as BaseOrderFormData, LoadingPlace, UnloadingPlace, } from '../../types/orders';
import { countries } from '../../constants/countries';
import { useTranslation } from 'react-i18next';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(2, 0),
  width: '100%',
  background: theme.palette.mode === 'dark' 
    ? 'rgba(28, 28, 45, 0.35)' 
    : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(0, 0, 0, 0.1)'}`,
  borderRadius: 12,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 4px 20px rgba(0, 0, 0, 0.2)'
    : '0 4px 20px rgba(0, 0, 0, 0.1)',
  '& .MuiTableCell-root, & .MuiTypography-root, & .MuiInputBase-root, & .MuiInputLabel-root, & .MuiTab-root, & .MuiSelect-select, & .MuiMenuItem-root, & .MuiFormLabel-root, & input, & .MuiAutocomplete-input': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  },
  '& .MuiOutlinedInput-root': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    '& input': {
      color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    }
  },
  '& .MuiAutocomplete-option': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  },
  '@media (max-width: 600px)': {
    padding: theme.spacing(2),
    margin: 0,
    borderRadius: 0,
    border: 'none',
    boxShadow: 'none',
    width: '100vw',
    position: 'relative',
    left: '50%',
    transform: 'translateX(-50%)',
    '&:hover': {
      transform: 'translateX(-50%)',
    }
  }
}));

const PageWrapper = styled('div')({
  padding: '24px',
  '@media (max-width: 600px)': {
    padding: 0,
    paddingBottom: '80px',
    overflowX: 'hidden',
    width: '100%',
    maxWidth: '100vw'
  }
});

const PageHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(4),
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(1.5)
  }
}));

const PageTitle = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
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

const PageDescription = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#000000',
  marginTop: theme.spacing(3)
}));





interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// eslint-disable-next-line
const _emptyLoadingPlace: LoadingPlace = {
  id: '',
  street: '',
  city: '',
  zip: '',
  country: 'Slovensko',
  dateTime: null,
  contactPerson: '',
  contactPersonName: '',
  contactPersonPhone: '',
  goods: []
};

// eslint-disable-next-line
const _emptyUnloadingPlace: UnloadingPlace = {
  id: '',
  street: '',
  city: '',
  zip: '',
  country: 'Slovensko',
  dateTime: null,
  contactPerson: '',
  contactPersonName: '',
  contactPersonPhone: '',
  goods: []
};

interface OrderFormData extends BaseOrderFormData {
    id?: string;
    createdAt?: Timestamp | Date;
    reminderDateTime?: Date | null;
    companyID?: string;
    createdBy?: string;
    rating?: OrderRating; // Explicitne pridám rating pole
}

const convertToDate = (dateTime: any): Date | null => {
    if (!dateTime) return null;
    if (dateTime instanceof Date) return dateTime;
    if (dateTime instanceof Timestamp) return dateTime.toDate();
    if (dateTime.toDate && typeof dateTime.toDate === 'function') return dateTime.toDate();
    try { 
        const date = new Date(dateTime.seconds ? dateTime.seconds * 1000 : dateTime);
        return isNaN(date.getTime()) ? null : date; 
    } catch { return null; }
};

// Dočasné placeholder komponenty
const RatingIndicator = ({ rating, size, showChip: _showChip }: { rating: number; size?: string; showChip?: boolean }) => {
  // Funkcia pre získanie farby podľa hodnotenia
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#4caf50'; // Zelená - výborné
    if (rating >= 4.0) return '#8bc34a'; // Svetlo zelená - veľmi dobré
    if (rating >= 3.5) return '#ff9f43'; // Oranžová - dobré
    if (rating >= 3.0) return '#ff9800'; // Tmavo oranžová - priemerné
    if (rating >= 2.0) return '#f44336'; // Červená - slabé
    if (rating > 0) return '#9c27b0'; // Fialová - veľmi slabé
    return '#e0e0e0'; // Sivá - bez hodnotenia
  };

  // Funkcia pre získanie textového popisu
  const getRatingText = (rating: number) => {
    if (rating >= 4.5) return 'Výborné';
    if (rating >= 4.0) return 'Veľmi dobré';
    if (rating >= 3.5) return 'Dobré';
    if (rating >= 3.0) return 'Priemerné';
    if (rating >= 2.0) return 'Slabé';
    if (rating > 0) return 'Veľmi slabé';
    return 'Bez hodnotenia';
  };

  const color = getRatingColor(rating);
  const text = getRatingText(rating);
  const fontSize = size === 'small' ? '1rem' : '1.25rem';
  const textSize = size === 'small' ? '0.75rem' : '0.875rem';

  if (rating === 0) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <StarIcon sx={{ fontSize, color: '#e0e0e0' }} />
        <Typography variant="caption" sx={{ fontSize: textSize, color: '#9e9e9e', whiteSpace: 'nowrap' }}>
          Bez hodnotenia
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <StarIcon sx={{ fontSize, color }} />
      <Typography variant="caption" sx={{ 
        fontSize: textSize, 
        fontWeight: 600, 
        color, 
        whiteSpace: 'nowrap'
      }}>
        {rating.toFixed(1)} • {text}
      </Typography>
    </Box>
  );
};

const DialogGlobalStyles = ({ open }: { open: boolean }) => (
  <style>
    {open && `
      .MuiDialog-root .MuiDialog-paper {
        max-height: 100vh !important;
        overflow: hidden !important;
      }
      .MuiDialog-root .MuiDialogContent-root:not([data-delete-dialog]) {
        overflow: auto !important;
        padding: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        max-height: 90vh !important;
      }
      body {
        overflow: hidden;
      }
    `}
  </style>
);



const StyledTableRow = styled(TableRow, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode',
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  transition: 'all 0.2s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
  }
}));

const StyledTableCell = styled(TableCell, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode',
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  color: isDarkMode ? '#ffffff' : '#000000',
  borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  padding: '16px',
  fontSize: '0.9rem',
  whiteSpace: 'nowrap'
}));

// Sortovateľná hlavička tabuľky
interface SortableTableCellProps {
  isDarkMode: boolean;
  sortField: 'orderNumber' | 'createdAt' | null;
  currentField: 'orderNumber' | 'createdAt';
  sortDirection: 'asc' | 'desc';
  onSort: (field: 'orderNumber' | 'createdAt') => void;
  children: React.ReactNode;
  sx?: any;
}

const SortableTableCell: React.FC<SortableTableCellProps> = ({
  isDarkMode,
  sortField,
  currentField,
  sortDirection,
  onSort,
  children,
  sx
}) => {
  const isActive = sortField === currentField;
  
  const getTooltipText = () => {
    if (isActive) {
      return sortDirection === 'desc' ? 'Zoradiť vzostupne' : 'Zoradiť zostupne (ďalší klik resetuje)';
    }
    return 'Kliknite pre zoradenie';
  };
  
  return (
    <Tooltip title={getTooltipText()} arrow>
      <StyledTableCell 
        isDarkMode={isDarkMode}
        sx={{
          ...sx,
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          }
        }}
        onClick={() => onSort(currentField)}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {children}
          {isActive ? (
            sortDirection === 'desc' ? (
              <ArrowDownwardIcon fontSize="small" sx={{ color: '#ff9f43' }} />
            ) : (
              <ArrowUpwardIcon fontSize="small" sx={{ color: '#ff9f43' }} />
            )
          ) : (
            <Box sx={{ width: 20, height: 20, opacity: 0.3 }}>
              <ArrowUpwardIcon fontSize="small" />
            </Box>
          )}
        </Box>
      </StyledTableCell>
    </Tooltip>
  );
};

// Optimalizovaný OrderRow komponent s React.memo
interface OrderRowProps {
  order: OrderFormData;
  isDarkMode: boolean;
  teamMembers: any;
  onRowClick: (order: OrderFormData) => void;
  onEditOrder: (order: OrderFormData) => void;
  onDuplicateOrder: (order: OrderFormData) => void;
  onPreviewPDF: (event: React.MouseEvent<HTMLElement>, order: OrderFormData) => void;
  onDownloadPDF: (event: React.MouseEvent<HTMLElement>, order: OrderFormData) => void;
  onDeleteOrder: (id: string) => void;
  t: any;
  onRateOrder: (order: OrderFormData) => void;
  getOrderAverageRating: (order: OrderFormData) => number;
}

const OrderRow = React.memo<OrderRowProps>(({ 
  order, 
  isDarkMode, 
  teamMembers, 
  onRowClick, 
  onEditOrder, 
  onDuplicateOrder, 
  onPreviewPDF, 
  onDownloadPDF, 
  onDeleteOrder,
  t,
  onRateOrder,
  getOrderAverageRating
}) => {
  return (
    <StyledTableRow 
      isDarkMode={isDarkMode} 
      onClick={() => onRowClick(order)}
    >
      <StyledTableCell isDarkMode={isDarkMode}>{(order as any).orderNumberFormatted || 'N/A'}</StyledTableCell>
      <StyledTableCell isDarkMode={isDarkMode}>
        <Box 
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <DocumentsIndicator orderId={order.id || ''} />
          <DocumentManager orderId={order.id || ''} />
        </Box>
      </StyledTableCell>
      <StyledTableCell isDarkMode={isDarkMode}>{(order as any).zakaznik || order.customerCompany || '-'}</StyledTableCell>
      <StyledTableCell isDarkMode={isDarkMode}>
        {(order as any).kontaktnaOsoba || 
         `${(order as any).customerContactName || ''} ${(order as any).customerContactSurname || ''}`.trim() || 
         '-'}
      </StyledTableCell>
      <StyledTableCell isDarkMode={isDarkMode}>{order.carrierCompany || '-'}</StyledTableCell>
      <StyledTableCell isDarkMode={isDarkMode}>{order.carrierContact || '-'}</StyledTableCell>
      <StyledTableCell isDarkMode={isDarkMode}>
        {order.carrierVehicleReg ? (
          <Box
            sx={{
              backgroundColor: '#1976d2',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              textAlign: 'center',
              minWidth: '60px',
              fontFamily: 'monospace'
            }}
          >
            {order.carrierVehicleReg}
          </Box>
        ) : '-'}
      </StyledTableCell>
      <StyledTableCell isDarkMode={isDarkMode}>
        {order.loadingPlaces?.[0] ? (
          <Box>
            {order.loadingPlaces[0].companyName && (
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                {order.loadingPlaces[0].companyName}
              </Typography>
            )}
            <Typography variant="body2" sx={{ fontSize: '0.8rem', opacity: 0.8 }}>
              {order.loadingPlaces[0].city}
            </Typography>
          </Box>
        ) : '-'}
      </StyledTableCell>
      <StyledTableCell isDarkMode={isDarkMode}>{order.loadingPlaces?.[0]?.dateTime ? format(convertToDate(order.loadingPlaces[0].dateTime)!, 'dd.MM HH:mm') : '-'}</StyledTableCell>
      <StyledTableCell isDarkMode={isDarkMode}>
        {order.unloadingPlaces?.[0] ? (
          <Box>
            {order.unloadingPlaces[0].companyName && (
              <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.85rem' }}>
                {order.unloadingPlaces[0].companyName}
              </Typography>
            )}
            <Typography variant="body2" sx={{ fontSize: '0.8rem', opacity: 0.8 }}>
              {order.unloadingPlaces[0].city}
            </Typography>
          </Box>
        ) : '-'}
      </StyledTableCell>
      <StyledTableCell isDarkMode={isDarkMode}>{order.unloadingPlaces?.[0]?.dateTime ? format(convertToDate(order.unloadingPlaces[0].dateTime)!, 'dd.MM HH:mm') : '-'}</StyledTableCell>
      <StyledTableCell isDarkMode={isDarkMode}>{order.loadingPlaces?.[0]?.goods?.[0]?.name || '-'}</StyledTableCell>
      <StyledTableCell isDarkMode={isDarkMode} sx={{ color: '#ff9f43', fontWeight: 'bold' }}>{`${(order as any).suma || order.customerPrice || '0'} €`}</StyledTableCell>
      <StyledTableCell isDarkMode={isDarkMode} sx={{ color: '#1976d2', fontWeight: 'bold' }}>{`${order.carrierPrice || '0'} €`}</StyledTableCell>
      <StyledTableCell isDarkMode={isDarkMode} sx={{ 
        fontWeight: 'bold',
        color: (() => {
          const customerPrice = parseFloat((order as any).suma || order.customerPrice || '0');
          const carrierPrice = parseFloat(order.carrierPrice || '0');
          const profit = customerPrice - carrierPrice;
          return profit > 0 ? '#2ecc71' : profit < 0 ? '#e74c3c' : (isDarkMode ? '#ffffff' : '#000000');
        })()
      }}>
        {(() => {
          const customerPrice = parseFloat((order as any).suma || order.customerPrice || '0');
          const carrierPrice = parseFloat(order.carrierPrice || '0');
          const profit = customerPrice - carrierPrice;
          return `${profit.toFixed(2)} €`;
        })()}
      </StyledTableCell>
      <StyledTableCell isDarkMode={isDarkMode}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, height: '100%' }}>
          <RatingIndicator 
            rating={getOrderAverageRating(order)} 
            size="small" 
            showChip 
          />
          <BareTooltip title="Pridať/upraviť hodnotenie">
            <IconButton 
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onRateOrder(order); }}
              size="small"
              sx={{ 
                color: '#2196f3',
                padding: '4px',
                '&:hover': { 
                  backgroundColor: 'rgba(33, 150, 243, 0.1)' 
                } 
              }}
            >
              <StarIcon fontSize="small" />
            </IconButton>
          </BareTooltip>
        </Box>
      </StyledTableCell>
      <StyledTableCell isDarkMode={isDarkMode}>
        {
          // Logika na zobrazenie mena namiesto emailu v tabuľke
          (order.createdBy && teamMembers[order.createdBy]?.name) ||
          ((order as any).createdByName && !(order as any).createdByName.includes('@') ? (order as any).createdByName : null) ||
          ((order as any).createdByName && (order as any).createdByName.includes('@') ? (order as any).createdByName.split('@')[0] : null) || // Fallback na časť emailu pred @
          'Neznámy'
        }
      </StyledTableCell>
      <StyledTableCell isDarkMode={isDarkMode}>{order.createdAt ? format(convertToDate(order.createdAt)!, 'dd.MM.yyyy HH:mm') : 'N/A'}</StyledTableCell>
      <StyledTableCell isDarkMode={isDarkMode}> {/* Akcie */} 
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <BareTooltip title={t('orders.edit')} placement="bottom">
            <IconButton onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onEditOrder(order); }} sx={{ color: '#ff9f43' }}>
              <EditIcon fontSize="small"/>
            </IconButton>
          </BareTooltip>
          <BareTooltip title={t('orders.duplicate') || 'Duplikovať'} placement="bottom">
            <IconButton onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onDuplicateOrder(order); }} sx={{ color: '#2196f3' }}>
              <ContentCopyIcon fontSize="small"/>
            </IconButton>
          </BareTooltip>
          <BareTooltip title={t('orders.previewPDF')} placement="bottom">
            <IconButton onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onPreviewPDF(e, order); }} sx={{ color: '#1e88e5' }}>
              <VisibilityIcon fontSize="small"/>
            </IconButton>
          </BareTooltip>
          <BareTooltip title={t('orders.downloadPDF')} placement="bottom">
            <IconButton onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onDownloadPDF(e, order); }} sx={{ color: '#4caf50' }}>
              <FileDownloadIcon fontSize="small"/>
            </IconButton>
          </BareTooltip>
          <BareTooltip title={t('orders.delete')} placement="bottom">
            <IconButton onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onDeleteOrder(order.id || ''); }} sx={{ color: '#ff6b6b' }}>
              <DeleteIcon fontSize="small"/>
            </IconButton>
          </BareTooltip>
        </Box>
      </StyledTableCell>
    </StyledTableRow>
  );
}, (prevProps, nextProps) => {
  // Custom comparison funkcia pre hlbšie porovnanie
  if (prevProps.isDarkMode !== nextProps.isDarkMode) return false;
  if (prevProps.order.id !== nextProps.order.id) return false;
  
  // Porovnaj kľúčové vlastnosti objednávky
  const prevOrder = prevProps.order;
  const nextOrder = nextProps.order;
  
  return (
    prevOrder.customerCompany === nextOrder.customerCompany &&
    prevOrder.customerPrice === nextOrder.customerPrice &&
    prevOrder.carrierPrice === nextOrder.carrierPrice &&
    prevOrder.carrierCompany === nextOrder.carrierCompany &&
    prevOrder.carrierContact === nextOrder.carrierContact &&
    prevOrder.carrierVehicleReg === nextOrder.carrierVehicleReg &&
    (prevOrder as any).orderNumberFormatted === (nextOrder as any).orderNumberFormatted &&
    (prevOrder as any).zakaznik === (nextOrder as any).zakaznik &&
    (prevOrder as any).kontaktnaOsoba === (nextOrder as any).kontaktnaOsoba &&
    (prevOrder as any).customerContactName === (nextOrder as any).customerContactName &&
    (prevOrder as any).customerContactSurname === (nextOrder as any).customerContactSurname &&
    prevOrder.loadingPlaces?.[0]?.city === nextOrder.loadingPlaces?.[0]?.city &&
    prevOrder.unloadingPlaces?.[0]?.city === nextOrder.unloadingPlaces?.[0]?.city &&
    prevOrder.loadingPlaces?.[0]?.goods?.[0]?.name === nextOrder.loadingPlaces?.[0]?.goods?.[0]?.name &&
    (prevOrder as any).createdByName === (nextOrder as any).createdByName &&
    JSON.stringify(prevOrder.rating || {}) === JSON.stringify(nextOrder.rating || {}) // Pridám porovnanie rating
  );
});

const OrdersList: React.FC = () => {
  const { t } = useTranslation();
  const { isDarkMode } = useThemeMode();
  const theme = useTheme();
  const { userData } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // State pre objednávky, zákazníkov, dopravcov, filtre, atď.
  const [orders, setOrders] = useState<OrderFormData[]>([]);
  const [orderDocuments, setOrderDocuments] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Špecifické loading states pre jednotlivé tabuľky
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);
  const [isLoadingCarriers, setIsLoadingCarriers] = useState(true);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [isLoadingDispatchers, setIsLoadingDispatchers] = useState(true);
  // eslint-disable-next-line
  const [_isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [documentFilter, setDocumentFilter] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [dispatcherFilter, setDispatcherFilter] = useState<'all' | 'thisMonth' | 'thisYear' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  // Načítanie sort nastavení z localStorage
  const [sortField, setSortField] = useState<'orderNumber' | 'createdAt' | null>(() => {
    const saved = localStorage.getItem('orders-sort-field');
    return saved ? (saved as 'orderNumber' | 'createdAt') : null;
  });
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(() => {
    const saved = localStorage.getItem('orders-sort-direction');
    return saved ? (saved as 'asc' | 'desc') : 'desc';
  });

  // Synchronizácia filtrov špeditérov s hlavnými filtrami
  useEffect(() => {
    if (startDate && endDate) {
      setDispatcherFilter('custom');
      setCustomStartDate(startDate);
      setCustomEndDate(endDate);
    }
  }, [startDate, endDate]);
  const [showFilters, setShowFilters] = useState(false);
  const [showNewOrderWizard, setShowNewOrderWizard] = useState(false);
  const [teamMembers, setTeamMembers] = useState<Record<string, any>>({});
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderFormData | null>(null);
  const [tabValue, setTabValue] = useState(0);
  // eslint-disable-next-line
  const [_orderToUpdateId, setOrderToUpdateId] = useState<string | null>(null);
  // eslint-disable-next-line
  const [_newOrderNumber, setNewOrderNumber] = useState('');
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [previewOrder, setPreviewOrder] = useState<OrderFormData | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<Customer | null>(null);
  const [showCustomerDeleteConfirm, setShowCustomerDeleteConfirm] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string>('');
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [carrierSearchQuery, setCarrierSearchQuery] = useState('');
  const [showCarrierForm, setShowCarrierForm] = useState(false);
  const [carrierFormData, setCarrierFormData] = useState({
    companyName: '',
    street: '',
    city: '',
    zip: '',
    country: 'Slovensko',
    contactName: '',
    contactSurname: '',
    contactEmail: '',
    contactPhone: '',
    ico: '',
    dic: '',
    icDph: '',
    vehicleTypes: '',
    notes: '',
    paymentTermDays: '60' // Default 60 dní ako string pre TextField
  });
  // eslint-disable-next-line
  const [selectedCarrierForEdit, setSelectedCarrierForEdit] = useState<Carrier | null>(null);
  const [showCarrierDeleteConfirm, setShowCarrierDeleteConfirm] = useState(false);
  const [carrierToDelete, setCarrierToDelete] = useState<string>('');
  const [loadingPdf, setLoadingPdf] = useState(false);
  // eslint-disable-next-line
  const [_showOrderNumberDialog, setShowOrderNumberDialog] = useState(false);
  // eslint-disable-next-line
  const [_orderToDelete, _setOrderToDelete] = useState<string>('');
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [_deleteDialogOpen, _setDeleteDialogOpen] = useState(false);

  // State pre Miesta
  const [locations, setLocations] = useState<any[]>([]);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [selectedLocationForEdit, setSelectedLocationForEdit] = useState<LocationData | null>(null);
  const [showLocationDeleteConfirm, setShowLocationDeleteConfirm] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState<string>('');

  // State pre Špeditéri (dispatchers)
  const [dispatchers, setDispatchers] = useState<any[]>([]);
  const [dispatcherSearchQuery, setDispatcherSearchQuery] = useState('');

  // State pre hodnotenie
  const [showCustomerRatingDialog, setShowCustomerRatingDialog] = useState(false);
  const [selectedCustomerForRating, setSelectedCustomerForRating] = useState<Customer | null>(null);
  const [showCarrierRatingDialog, setShowCarrierRatingDialog] = useState(false);
  const [selectedCarrierForRating, setSelectedCarrierForRating] = useState<Carrier | null>(null);
  const [showOrderRatingDialog, setShowOrderRatingDialog] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<OrderFormData | null>(null);

  // State pre výber jazyka PDF
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [languageMenuAnchor, setLanguageMenuAnchor] = useState<null | HTMLElement>(null);
  const [languageMenuAction, setLanguageMenuAction] = useState<'preview' | 'download'>('preview');
  const [orderForLanguageSelection, setOrderForLanguageSelection] = useState<OrderFormData | null>(null);
  
  // PDF loading dialog state
  const [showPdfLoadingDialog, setShowPdfLoadingDialog] = useState(false);
  const [pdfLoadingMessage, setPdfLoadingMessage] = useState('');

  // State pre stránkovanie všetkých kariet
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersRowsPerPage, setOrdersRowsPerPage] = useState(25);
  const [customersPage, setCustomersPage] = useState(0);
  const [customersRowsPerPage, setCustomersRowsPerPage] = useState(25);
  const [carriersPage, setCarriersPage] = useState(0);
  const [carriersRowsPerPage, setCarriersRowsPerPage] = useState(25);
  const [locationsPage, setLocationsPage] = useState(0);
  const [locationsRowsPerPage, setLocationsRowsPerPage] = useState(25);
  const [dispatchersPage, setDispatchersPage] = useState(0);
  const [dispatchersRowsPerPage, setDispatchersRowsPerPage] = useState(25);

  // --- FETCH FUNKCIE (presunuté SEM HORE) ---
  
  const fetchTeamMembers = useCallback(async () => {
    if (!userData?.companyID) return;
    setIsLoadingTeamMembers(true);
    try {
      const usersQuery = query(collection(db, 'users'), where('companyID', '==', userData.companyID));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData: {[id: string]: {name: string, email: string}} = {};
      usersSnapshot.docs.forEach(doc => {
        const userDoc = doc.data();
        let userName = '';
        if (userDoc.firstName || userDoc.lastName) userName = `${userDoc.firstName || ''} ${userDoc.lastName || ''}`.trim();
        if (!userName && userDoc.displayName) userName = userDoc.displayName;
        if (!userName && userDoc.email) {
          const emailParts = userDoc.email.split('@');
          if (emailParts.length > 0) {
            const nameParts = emailParts[0].split(/[._-]/);
            userName = nameParts.map((part: string) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
          }
        }
        if (!userName) userName = userDoc.email ? userDoc.email.split('@')[0] : 'Používateľ';
        usersData[doc.id] = { name: userName, email: userDoc.email || '' };
      });
      if (userData.uid && !usersData[userData.uid]) {
        let currentUserName = '';
        if ((userData as any).firstName || (userData as any).lastName) currentUserName = `${(userData as any).firstName || ''} ${(userData as any).lastName || ''}`.trim();
        if (!currentUserName && (userData as any).displayName) currentUserName = (userData as any).displayName;
        if (!currentUserName && userData.email) {
          const emailParts = userData.email.split('@');
          if (emailParts.length > 0) {
            const nameParts = emailParts[0].split(/[._-]/);
            currentUserName = nameParts.map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()).join(' ');
          }
        }
        if (!currentUserName) currentUserName = userData.email ? userData.email.split('@')[0] : 'Aktuálny používateľ';
        usersData[userData.uid] = { name: currentUserName, email: userData.email || '' };
      }
      setTeamMembers(usersData);
    } catch (err) { 
      console.error('Chyba pri načítaní členov tímu:', err); 
    } finally {
      setIsLoadingTeamMembers(false);
    }
  }, [userData]); // Pridaná celá userData dependency

  const fetchCustomers = useCallback(() => {
    console.log("Attempting to fetch customers..."); // Log začiatku
    if (!userData?.companyID) {
      console.log("Fetch Customers: No companyID found.");
      setCustomers([]);
      setIsLoadingCustomers(false);
      return () => {}; // Return empty cleanup function
    } 
    
    setIsLoadingCustomers(true);
    try {
      const customersRef = collection(db, 'customers');
      const q = query(
        customersRef, 
        where('companyID', '==', userData.companyID),
        orderBy('createdAt', 'desc')
      );
      
      // Používame onSnapshot namiesto getDocs pre real-time aktualizácie
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        // console.log('🔄 Real-time aktualizácia zákazníkov - počet dokumentov:', querySnapshot.docs.length);
        
        const customersData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return { 
            id: doc.id, 
            ...data, 
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt 
          } as Customer;
        });
        
        console.log(`Fetched ${customersData.length} customers for company ${userData.companyID}.`); // Log výsledku
        setCustomers(customersData);
        setIsLoadingCustomers(false);
      }, (error) => {
        console.error('Fetch Customers Error:', error); // Log chyby
        setIsLoadingCustomers(false);
      });
      
      return unsubscribe; // Return cleanup function
    } catch (error) {
      console.error('Error setting up customers listener:', error);
      setIsLoadingCustomers(false);
      return () => {}; // Return empty cleanup function
    }
  }, [userData?.companyID]); // Optimalizované dependencies
  
  const fetchCarriers = useCallback(() => {
    console.log("Attempting to fetch carriers..."); // Log začiatku
    if (!userData?.companyID) {
      console.log("Fetch Carriers: No companyID found.");
      setCarriers([]);
      setIsLoadingCarriers(false);
      return () => {}; // Return empty cleanup function
    }
    
    setIsLoadingCarriers(true);
    try {
      const carriersRef = collection(db, 'carriers');
      const q = query(
        carriersRef, 
        where('companyID', '==', userData.companyID), 
        orderBy('createdAt', 'desc')
      );
      
      // Používame onSnapshot namiesto getDocs pre real-time aktualizácie
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        // console.log('🔄 Real-time aktualizácia dopravcov - počet dokumentov:', querySnapshot.docs.length);
        // console.log('📋 Typ zmeny dokumentov:', querySnapshot.docChanges().map(change => ({
        //   type: change.type,
        //   id: change.doc.id,
        //   data: change.doc.data()
        // })));
        
        const carriersData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const carrier = { // Vytvoríme premennú pre logovanie
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
          } as Carrier;
          // console.log("🚛 Mapping carrier:", {
          //   id: carrier.id,
          //   companyName: carrier.companyName,
          //   vehicleTypes: carrier.vehicleTypes,
          //   paymentTermDays: carrier.paymentTermDays
          // }); // Logujeme kľúčové údaje
          return carrier;
        });
        
        console.log(`📊 Fetched ${carriersData.length} carriers for company ${userData.companyID}.`); 
        setCarriers(carriersData);
        setIsLoadingCarriers(false);
      }, (error) => {
        console.error('Fetch Carriers Error:', error); 
        setIsLoadingCarriers(false);
      });
      
      return unsubscribe; // Return cleanup function
    } catch (error) {
      console.error('Error setting up carriers listener:', error);
      setIsLoadingCarriers(false);
      return () => {}; // Return empty cleanup function
    }
  }, [userData?.companyID]); // Optimalizované dependencies

  const fetchOrders = useCallback(() => {
    if (!userData?.companyID) { 
      setOrders([]); 
      setLoading(false); 
      setIsLoadingOrders(false);
      setError('Nemáte priradenú firmu.'); 
      return () => {}; // Return empty cleanup function
    }
    
    setLoading(true); 
    setIsLoadingOrders(true);
    setError(null);
    
    try {
      let ordersQuery = query(collection(db, 'orders'), where('companyID', '==', userData.companyID));
      
      if (startDate) {
        ordersQuery = query(ordersQuery, where('createdAt', '>=', Timestamp.fromDate(new Date(startDate.setHours(0,0,0,0)))));
      }
      
      if (endDate) {
        const endOfDay = new Date(endDate); 
        endOfDay.setHours(23, 59, 59, 999);
        ordersQuery = query(ordersQuery, where('createdAt', '<=', Timestamp.fromDate(endOfDay)));
      }
      
      ordersQuery = query(ordersQuery, orderBy('createdAt', 'desc'));
      
      // Používama onSnapshot namiesto getDocs pre real-time aktualizácie
      const unsubscribe = onSnapshot(ordersQuery, (querySnapshot) => {
        // console.log('🔄 Real-time aktualizácia objednávok - počet dokumentov:', querySnapshot.docs.length);
        
        const currentTeamMembers = teamMembers;
        const ordersData: OrderFormData[] = querySnapshot.docs.map(doc => {
          const data = doc.data();
          const createdByName = (data.createdBy && currentTeamMembers[data.createdBy]?.name) || data.createdByName || ''; 
          const loadingPlacesWithDates = (data.loadingPlaces || []).map((p: any) => ({ ...p, dateTime: convertToDate(p.dateTime) }));
          const unloadingPlacesWithDates = (data.unloadingPlaces || []).map((p: any) => ({ ...p, dateTime: convertToDate(p.dateTime) }));
          const createdAtTimestamp = data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(convertToDate(data.createdAt) || new Date());
          
          const order: OrderFormData = {
            id: doc.id, 
            companyID: data.companyID, 
            createdBy: data.createdBy, 
            createdAt: createdAtTimestamp, 
            loadingPlaces: loadingPlacesWithDates, 
            unloadingPlaces: unloadingPlacesWithDates, 
            customerCompany: data.zakaznik || data.customerCompany || '', 
            customerPrice: data.suma || data.customerPrice || '', 
            customerContactName: data.customerContactName || '', 
            customerContactSurname: data.customerContactSurname || '', 
            customerVatId: data.customerVatId || '', 
            customerStreet: data.customerStreet || '', 
            customerCity: data.customerCity || '', 
            customerZip: data.customerZip || '', 
            customerCountry: data.customerCountry || 'Slovensko', 
            customerEmail: data.customerEmail || '', 
            customerPhone: data.customerPhone || '', 
            goodsDescription: data.goodsDescription || '', 
            weightKg: data.weightKg || '', 
            dimensionsL: data.dimensionsL || '', 
            dimensionsW: data.dimensionsW || '', 
            dimensionsH: data.dimensionsH || '', 
            quantity: data.quantity || '', 
            carrierCompany: data.carrierCompany || '', 
            carrierContact: data.carrierContact || '', 
            carrierVehicleReg: data.carrierVehicleReg || '', 
            carrierPrice: data.carrierPrice || '', 
            // Kompletné údaje dopravcu
            carrierEmail: data.carrierEmail || '',
            carrierPhone: data.carrierPhone || '',
            carrierIco: data.carrierIco || '',
            carrierDic: data.carrierDic || '',
            carrierIcDph: data.carrierIcDph || '',
            carrierStreet: data.carrierStreet || '',
            carrierCity: data.carrierCity || '',
            carrierZip: data.carrierZip || '',
            carrierCountry: data.carrierCountry || '',
            carrierVehicleTypes: data.carrierVehicleTypes || [],
            carrierNotes: data.carrierNotes || '',
            carrierRating: data.carrierRating || 0,
            reminderDateTime: convertToDate(data.reminderDateTime),
            rating: data.rating || null, // Pridám rating pole
          };
          
          (order as any).zakaznik = data.zakaznik || data.customerCompany || '';
          (order as any).kontaktnaOsoba = data.kontaktnaOsoba || `${data.customerContactName || ''} ${data.customerContactSurname || ''}`.trim();
          (order as any).suma = data.suma || data.customerPrice || '';
          (order as any).createdByName = createdByName;
          (order as any).orderNumberFormatted = data.orderNumberFormatted || '';
          return order;
        });
        
        // Optimalizácia: Porovnaj nové orders s existujúcimi
        setOrders(prevOrders => {
          // Ak je rovnaký počet objednávok a rovnaké ID, nepotrebujeme update
          if (prevOrders.length === ordersData.length) {
            const prevIds = prevOrders.map(o => o.id).sort();
            const newIds = ordersData.map(o => o.id).sort();
            
            // Porovnaj ID objednávok
            const idsAreSame = prevIds.length === newIds.length && 
                              prevIds.every((id, index) => id === newIds[index]);
            
            if (idsAreSame) {
              // Skontroluj či sa zmenili hodnoty (porovnaj key properties)
              const hasChanges = ordersData.some((newOrder, index) => {
                const prevOrder = prevOrders[index];
                return (
                  prevOrder.customerCompany !== newOrder.customerCompany ||
                  prevOrder.customerPrice !== newOrder.customerPrice ||
                  prevOrder.carrierPrice !== newOrder.carrierPrice ||
                  (prevOrder as any).orderNumberFormatted !== (newOrder as any).orderNumberFormatted ||
                  prevOrder.loadingPlaces?.[0]?.city !== newOrder.loadingPlaces?.[0]?.city ||
                  prevOrder.unloadingPlaces?.[0]?.city !== newOrder.unloadingPlaces?.[0]?.city ||
                  JSON.stringify(prevOrder.rating || {}) !== JSON.stringify(newOrder.rating || {}) // Pridám porovnanie rating
                );
              });
              
              if (!hasChanges) {
                // console.log('⚡ Žiadne zmeny v orders - preskakujem update');
                return prevOrders; // Vráť existujúce orders bez zmeny
              }
            }
          }
          
          // console.log('📋 Aktualizujem orders - nájdené zmeny');
          return ordersData;
        });
        
        setLoading(false);
        setIsLoadingOrders(false);
      }, (err) => { 
        console.error('Chyba pri real-time načítaní objednávok:', err); 
        setError('Nastala chyba pri načítaní objednávok');
        setLoading(false);
        setIsLoadingOrders(false);
      });
      
      return unsubscribe; // Return cleanup function
    } catch (err) { 
      console.error('Chyba pri nastavovaní real-time listenera objednávok:', err); 
      setError('Nastala chyba pri načítaní objednávok');
      setLoading(false);
      setIsLoadingOrders(false);
      return () => {}; // Return empty cleanup function
    }
  }, [userData?.companyID, startDate, endDate, teamMembers]); // Optimalizované dependencies

  const fetchLocations = useCallback(async () => {
    if (!userData?.companyID) {
      setLocations([]);
      setIsLoadingLocations(false);
      return () => {}; // Return empty cleanup function
    }
    
    setIsLoadingLocations(true);
    try {
      // Načítame miesta z dedikovanej kolekcie
      const locationsRef = collection(db, 'locations');
      const q = query(
        locationsRef, 
        where('companyID', '==', userData.companyID),
        orderBy('createdAt', 'desc')
      );
      
      // Používame onSnapshot pre real-time aktualizácie
      const unsubscribeLocations = onSnapshot(q, (querySnapshot) => {
        // console.log('🔄 Real-time aktualizácia miest - počet dokumentov:', querySnapshot.docs.length);
        
        const locationsData = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt
          };
        });
        
        console.log(`Načítané ${locationsData.length} miest pre firmu ${userData.companyID}.`);
        setLocations(locationsData);
        setIsLoadingLocations(false);
      }, (error) => {
        console.error('Chyba pri načítaní miest:', error);
        setIsLoadingLocations(false);
      });
      
      return unsubscribeLocations;
    } catch (error) {
      console.error('Chyba pri nastavovaní real-time listenera miest:', error);
      setIsLoadingLocations(false);
      return () => {};
    }
  }, [userData?.companyID]); // Optimalizované dependencies

  // Nová, jednoduchá funkcia na výpočet štatistík špeditérov z existujúcich objednávok
  const calculateDispatcherStats = useCallback(() => {
    if (!orders || orders.length === 0) {
      console.log('🔍 Žiadne objednávky na spracovanie pre špeditérov');
      setDispatchers([]);
      setIsLoadingDispatchers(false);
      return;
    }

    console.log('📊 Počítam štatistiky špeditérov z', orders.length, 'objednávok s filtrom:', dispatcherFilter);
    
    // Aplikujeme filtrovanie podľa dispatcherFilter
    let filteredOrders = orders;
    
    if (dispatcherFilter === 'thisMonth') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      
      filteredOrders = orders.filter(order => {
        const orderDate = order.createdAt instanceof Timestamp 
          ? order.createdAt.toDate() 
          : new Date(order.createdAt || new Date());
        return orderDate >= startOfMonth && orderDate <= endOfMonth;
      });
      
      console.log('📅 Filtered for thisMonth:', filteredOrders.length, 'objednávok');
    } else if (dispatcherFilter === 'thisYear') {
      const now = new Date();
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      
      filteredOrders = orders.filter(order => {
        const orderDate = order.createdAt instanceof Timestamp 
          ? order.createdAt.toDate() 
          : new Date(order.createdAt || new Date());
        return orderDate >= startOfYear && orderDate <= endOfYear;
      });
      
      console.log('📅 Filtered for thisYear:', filteredOrders.length, 'objednávok');
    } else if (dispatcherFilter === 'custom' && customStartDate && customEndDate) {
      const startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
      
      filteredOrders = orders.filter(order => {
        const orderDate = order.createdAt instanceof Timestamp 
          ? order.createdAt.toDate() 
          : new Date(order.createdAt || new Date());
        return orderDate >= startDate && orderDate <= endDate;
      });
      
      console.log('📅 Filtered for custom range:', filteredOrders.length, 'objednávok');
    }

    const dispatcherStats: { [key: string]: any } = {};
    
    filteredOrders.forEach(order => {
      const createdBy = order.createdBy;
      const createdByName = (order as any).createdByName;
      const customerPrice = parseFloat((order as any).suma || order.customerPrice || '0');
      const carrierPrice = parseFloat(order.carrierPrice || '0');
      const profit = customerPrice - carrierPrice;
      
      if (createdBy && !isNaN(profit)) {
        if (!dispatcherStats[createdBy]) {
          dispatcherStats[createdBy] = {
            id: createdBy,
            name: createdByName || teamMembers[createdBy]?.name || 'Neznámy',
            email: teamMembers[createdBy]?.email || '',
            totalOrders: 0,
            totalRevenue: 0,
            totalCosts: 0,
            totalProfit: 0,
            avgProfit: 0,
            avgProfitMargin: 0,
            orders: []
          };
        }
        
        dispatcherStats[createdBy].totalOrders += 1;
        dispatcherStats[createdBy].totalRevenue += customerPrice;
        dispatcherStats[createdBy].totalCosts += carrierPrice;
        dispatcherStats[createdBy].totalProfit += profit;
        dispatcherStats[createdBy].orders.push({
          id: order.id,
          customerPrice,
          carrierPrice,
          profit,
          profitMargin: customerPrice > 0 ? ((profit / customerPrice) * 100) : 0,
          date: order.createdAt
        });
      }
    });
    
    // Vypočítame priemerné hodnoty
    Object.values(dispatcherStats).forEach((dispatcher: any) => {
      dispatcher.avgProfit = dispatcher.totalOrders > 0 
        ? dispatcher.totalProfit / dispatcher.totalOrders 
        : 0;
      dispatcher.avgProfitMargin = dispatcher.totalRevenue > 0 
        ? ((dispatcher.totalProfit / dispatcher.totalRevenue) * 100) 
        : 0;
    });
    
    const resultArray = Object.values(dispatcherStats);
    console.log('👥 Vypočítané štatistiky pre', resultArray.length, 'špeditérov');
    
    setDispatchers(resultArray);
    setIsLoadingDispatchers(false);
  }, [orders, dispatcherFilter, customStartDate, customEndDate, teamMembers]);

  // --- useEffect HOOKY (optimalizované pre zamedzenie duplicitných načítaní) ---

  // Jeden centrálny useEffect pre načítanie team members
  useEffect(() => {
    if (userData?.companyID) {
      fetchTeamMembers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.companyID]); // Odstránená fetchTeamMembers dependency aby sme zabránili nekonečným loop

  // useEffect pre načítanie dokumentov všetkých objednávok
  useEffect(() => {
    if (!userData?.companyID) return;

    const documentsRef = collection(db, 'orderDocuments');
    const q = query(
      documentsRef,
      where('companyID', '==', userData.companyID)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docsData: Record<string, any[]> = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        const orderId = data.orderId;
        
        if (!docsData[orderId]) {
          docsData[orderId] = [];
        }
        
        docsData[orderId].push({
          id: doc.id,
          ...data
        });
      });
      
      setOrderDocuments(docsData);
    }, (err) => {
      console.error('Chyba pri načítaní dokumentov:', err);
    });

    return () => unsubscribe();
  }, [userData?.companyID]);

  // Hlavný useEffect pre inicializáciu základných real-time listeners (len pre customers, carriers, locations)
  useEffect(() => {
    if (!userData?.companyID) {
      console.log("❌ No companyID available, skipping data fetch");
      return;
    }

    console.log("✅ Running initial data fetch on component mount for company:", userData.companyID);
    
    // Nastavíme real-time listenery len pre statické data (customers, carriers, locations)
    const unsubscribeCustomers = fetchCustomers(); 
    const unsubscribeCarriers = fetchCarriers();
    
    // Osobitne spracujeme async fetchLocations
    let unsubscribeLocations: (() => void) | undefined;
    fetchLocations().then(unsubscribe => {
      unsubscribeLocations = unsubscribe;
    });
    
    // Cleanup funkcie pre real-time listenery
    return () => {
      console.log("🧹 Cleaning up real-time listeners");
      if (typeof unsubscribeCustomers === 'function') {
        unsubscribeCustomers();
      }
      if (typeof unsubscribeCarriers === 'function') {
        unsubscribeCarriers();
      }
      if (typeof unsubscribeLocations === 'function') {
        unsubscribeLocations();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.companyID]); // Odstránené fetch funkcie dependencies aby sme zabránili nekonečným loop

  // Samostatný useEffect pre fetchOrders s dátumovými filtrami
  useEffect(() => {
    if (!userData?.companyID) {
      return;
    }

    console.log("🔄 Running fetchOrders due to filter change (startDate, endDate).");
    // Nastavíme nový listener s aktualizovanými filtrami
    const unsubscribeOrders = fetchOrders(); 
    
    // Cleanup predchádzajúceho listenera
    return () => {
      if (typeof unsubscribeOrders === 'function') {
        unsubscribeOrders();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.companyID, startDate, endDate]); // Odstránená fetchOrders dependency aby sme zabránili nekonečným loop

  // useEffect pre dispatchers - spúšťa sa len pri zmene relevantných filtrov
  useEffect(() => {
    if (userData?.companyID && Object.keys(teamMembers).length > 0) {
      console.log("📊 Running calculateDispatcherStats due to filter change");
      calculateDispatcherStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData?.companyID, dispatcherFilter, customStartDate, customEndDate, teamMembers, orders]); // Pridané orders dependency


  // --- OSTATNÉ FUNKCIE --- 

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSort = (field: 'orderNumber' | 'createdAt') => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        // Tretí klik - resetujeme zoradenie
        setSortField(null);
        setSortDirection('desc');
        localStorage.removeItem('orders-sort-field');
        localStorage.removeItem('orders-sort-direction');
      } else {
        // Druhý klik - zmeníme smer na vzostupný
        setSortDirection('asc');
        localStorage.setItem('orders-sort-direction', 'asc');
      }
    } else {
      // Prvý klik na nový stĺpec - nastavíme zostupné zoradenie
      setSortField(field);
      setSortDirection('desc');
      localStorage.setItem('orders-sort-field', field);
      localStorage.setItem('orders-sort-direction', 'desc');
    }
  };

  const getFilteredCustomerOrders = () => {
    let filtered = filteredOrders.filter(order => {
      // Filter pre zákazníkov - zobrazujeme len objednávky, ktoré majú zákazníka (customerCompany) alebo (zakaznik)
      return (order.customerCompany || (order as any).zakaznik);
    });

    // Aplikujeme sorting ak je nastavený
    if (sortField) {
      filtered = filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortField === 'orderNumber') {
          // Porovnávame číselné hodnoty order number
          aValue = parseInt((a as any).orderNumberFormatted?.replace(/\D/g, '') || '0');
          bValue = parseInt((b as any).orderNumberFormatted?.replace(/\D/g, '') || '0');
        } else if (sortField === 'createdAt') {
          // Porovnávame dátumy
          aValue = convertToDate(a.createdAt)?.getTime() || 0;
          bValue = convertToDate(b.createdAt)?.getTime() || 0;
        }

        if (sortDirection === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    }

    return filtered;
  };

  const filteredOrders = orders.filter(order => {
    if (!order) return false;
    
    const searchTermLower = searchQuery.toLowerCase();
    const kontaktnaOsoba = (order as any).kontaktnaOsoba || 
          `${order.customerContactName || ''} ${order.customerContactSurname || ''}`.trim();
    const spediterName = (order as any).createdByName || 
          (order.createdBy && teamMembers[order.createdBy] ? teamMembers[order.createdBy].name : '');
    const orderNumber = (order as any).orderNumberFormatted || '';
    
    const matchesSearch = 
      order.customerCompany?.toLowerCase().includes(searchTermLower) ||
      kontaktnaOsoba.toLowerCase().includes(searchTermLower) ||
      spediterName.toLowerCase().includes(searchTermLower) ||
      orderNumber.toLowerCase().includes(searchTermLower) ||
      order.customerVatId?.toLowerCase().includes(searchTermLower) ||
      order.carrierCompany?.toLowerCase().includes(searchTermLower) ||
      order.carrierContact?.toLowerCase().includes(searchTermLower) ||
      order.carrierVehicleReg?.toLowerCase().includes(searchTermLower) ||
      order.loadingPlaces?.[0]?.city?.toLowerCase().includes(searchTermLower) ||
      order.loadingPlaces?.some(place => 
        place.contactPersonName?.toLowerCase().includes(searchTermLower) ||
        place.contactPersonPhone?.toLowerCase().includes(searchTermLower)
      ) ||
      order.unloadingPlaces?.[0]?.city?.toLowerCase().includes(searchTermLower) ||
      order.unloadingPlaces?.some(place => 
        place.contactPersonName?.toLowerCase().includes(searchTermLower) ||
        place.contactPersonPhone?.toLowerCase().includes(searchTermLower)
      ) ||
      order.id?.toLowerCase().includes(searchTermLower);

    // Filter pre dokumenty - ak je nastavený dokumentový filter
    if (documentFilter && order.id) {
      const orderDocs = orderDocuments[order.id] || [];
      const hasMatchingDocument = orderDocs.some((doc: any) => {
        const documentTypeLabel = DOCUMENT_TYPE_CONFIG[doc.type as keyof typeof DOCUMENT_TYPE_CONFIG]?.label || '';
        return documentTypeLabel.toLowerCase().includes(documentFilter.toLowerCase());
      });
      
      if (!hasMatchingDocument) {
        return false;
      }
    }
      
    return matchesSearch;
  });

  const openDeleteConfirmation = (id: string) => {
    setSelectedOrderId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirmed = async () => {
    if (selectedOrderId) {
      await handleDeleteOrder(selectedOrderId);
      setShowDeleteConfirm(false);
      setSelectedOrderId(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setSelectedOrderId(null);
  };

  const handleEditOrder = (order: OrderFormData) => {
    const modifiedOrder = {
      ...order,
      zakaznik: order.customerCompany || '',
      kontaktnaOsoba: `${order.customerContactName || ''} ${order.customerContactSurname || ''}`.trim(),
      suma: order.customerPrice || '',
      mena: 'EUR',
    };
    
    setSelectedOrder(modifiedOrder);
    setIsEditMode(true);
    setShowNewOrderWizard(true);
  };

  const handleDuplicateOrder = (order: OrderFormData) => {
    // Hlbšia kópia objednávky pre duplikovanie
    const duplicatedOrder: OrderFormData = {
      ...order,
      // Resetujeme všetky ID a časové značky
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      orderNumber: undefined,
      orderNumberFormatted: undefined,
      
      // Mapujeme polia pre kompatibilitu s formulárom
      zakaznik: order.customerCompany || '',
      kontaktnaOsoba: `${order.customerContactName || ''} ${order.customerContactSurname || ''}`.trim(),
      suma: order.customerPrice || '',
      mena: 'EUR',
      
      // Hlbšia kópia loading places s resetovanými ID
      loadingPlaces: order.loadingPlaces ? order.loadingPlaces.map(place => ({
        ...place,
        id: '', // Resetujeme ID miesta
        goods: place.goods ? place.goods.map(good => ({
          ...good,
          id: '' // Resetujeme ID tovaru - string namiesto undefined
        })) : []
      })) : [],
      
      // Hlbšia kópia unloading places s resetovanými ID  
      unloadingPlaces: order.unloadingPlaces ? order.unloadingPlaces.map(place => ({
        ...place,
        id: '', // Resetujeme ID miesta
        goods: place.goods ? place.goods.map(good => ({
          ...good,
          id: '' // Resetujeme ID tovaru - string namiesto undefined
        })) : []
      })) : [],
      
      // Pridáme prefix k poznámkam
      internaPoznamka: order.internaPoznamka ? `KÓPIA: ${order.internaPoznamka}` : 'KÓPIA objednávky',
      
      // Resetujeme hodnotenie
      rating: undefined
    } as any; // Dočasné any pre zložité typy
    
    console.log('🔄 Duplikovanie objednávky:', {
      original: order,
      duplicated: duplicatedOrder
    });
    
    setSelectedOrder(duplicatedOrder);
    setIsEditMode(false); // Dôležité - nastavíme na false aby sa vytvorila nová objednávka
    setShowNewOrderWizard(true);
  };

  const handleDeleteOrder = async (id: string) => {
    if (!userData?.companyID) {
      console.log('Chýba companyID');
      setError('Nemáte priradenú firmu.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await deleteDoc(doc(db, 'orders', id));
      // fetchOrders(); // Odstránené - real-time listener automaticky aktualizuje
      
      // Obnovíme štatistiky špeditérov po vymazaní objednávky
      if (userData?.companyID && Object.keys(teamMembers).length > 0) {
        console.log("📊 Obnova štatistík špeditérov po vymazaní objednávky");
        calculateDispatcherStats();
      }
    } catch (err) {
      console.error('Chyba pri mazaní objednávky:', err);
      setError('Nastala chyba pri mazaní objednávky');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenNewOrderForm = () => {
    setShowNewOrderWizard(true);
    setSelectedOrder(null);
    setIsEditMode(false);
  };

  const handleCloseNewOrderForm = () => {
    setShowNewOrderWizard(false);
    setSelectedOrder(null);
    setIsEditMode(false);
    // fetchOrders(); // Odstránené - real-time listener automaticky aktualizuje
    
    // Obnovíme štatistiky špeditérov po uložení/úprave objednávky
    if (userData?.companyID && Object.keys(teamMembers).length > 0) {
      console.log("📊 Obnova štatistík špeditérov po uložení objednávky");
      calculateDispatcherStats();
    }
  };

  // Upravená funkcia pre náhľad PDF
  const _handlePreviewPDF = async (order: OrderFormData) => {
    try {
      if (!order.id) {
        alert('Objednávka nemá priradené ID. Prosím, uložte objednávku a skúste znovu.');
        return;
      }
      
      setLoadingPdf(true);
      setShowPdfPreview(true);
      setPreviewOrder(order); // Nastaviť aktuálnu objednávku do stavu
      
      // Volanie serverovej funkcie pre generovanie PDF
      const generatePdf = httpsCallable(functions, 'generateOrderPdf');
      const result = await generatePdf({ orderId: order.id });
      
      // @ts-ignore - výsledok obsahuje pdfBase64 a fileName
      const { pdfBase64 } = result.data;
      
      // Konverzia base64 na Blob
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Vytvorenie URL pre blob
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
      setLoadingPdf(false);
    } catch (error) {
      console.error('Chyba pri generovaní náhľadu PDF:', error);
      alert('Nastala chyba pri generovaní PDF objednávky: ' + (error as Error).message);
      setLoadingPdf(false);
      setShowPdfPreview(false);
    }
  };

  // Upravená funkcia pre stiahnutie PDF
  const _handleDownloadPDF = async (order: OrderFormData) => {
    try {
      if (!order.id) {
        alert('Objednávka nemá priradené ID. Prosím, uložte objednávku a skúste znovu.');
        return;
      }
      
      setLoading(true);
      
      // Volanie serverovej funkcie pre generovanie PDF
      const generatePdf = httpsCallable(functions, 'generateOrderPdf');
      const result = await generatePdf({ orderId: order.id });
      
      // @ts-ignore - výsledok obsahuje pdfBase64 a fileName
      const { pdfBase64, fileName } = result.data;
      
      // Konverzia base64 na Blob
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Vytvorenie URL a stiahnutie
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `order_${order.orderNumber || order.id.substring(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setLoading(false);
    } catch (error) {
      console.error('Chyba pri sťahovaní PDF:', error);
      alert('Nastala chyba pri generovaní PDF objednávky: ' + (error as Error).message);
      setLoading(false);
    }
  };

  const handleAddCustomer = () => {
    setShowCustomerForm(true);
  };

  const handleCustomerSubmit = async (customerData: CustomerData) => {
    if (!userData?.companyID) {
      alert("Chyba: Nemáte priradenú firmu.");
      return;
    }
    try {
      console.log('Začínam ukladanie/aktualizáciu zákazníka:', customerData);
      
      const customerDataToSave = {
        company: customerData.companyName, // Mapujeme companyName na company
        street: customerData.street,
        city: customerData.city,
        zip: customerData.zip,
        country: customerData.country,
        contactName: customerData.contactName,
        contactSurname: customerData.contactSurname,
        email: customerData.contactEmail, // Mapujeme contactEmail na email
        phone: customerData.contactPhonePrefix && customerData.contactPhone 
          ? `${customerData.contactPhonePrefix}${customerData.contactPhone}` 
          : '', // Kombinujeme predvoľbu a číslo
        contactPhonePrefix: customerData.contactPhonePrefix || '+421',
        contactPhone: customerData.contactPhone || '',
        ico: customerData.ico || '',
        dic: customerData.dic || '',
        vatId: customerData.icDph || '', // Mapujeme icDph na vatId
        paymentTermDays: customerData.paymentTermDays || 30,
        companyID: userData.companyID // Pridanie companyID
      };

      // Ak máme selectedCustomerForEdit, ideme aktualizovať existujúceho zákazníka
      if (selectedCustomerForEdit) {
        if (!selectedCustomerForEdit.id) {
          console.error('Chyba: Zákazník nemá ID');
          alert('Chyba: Zákazník nemá ID');
          return;
        }
        const customerRef = doc(db, 'customers', selectedCustomerForEdit.id);
        
        await updateDoc(customerRef, {
          ...customerDataToSave, // companyID sa prenesie
          updatedAt: Timestamp.fromDate(new Date())
        });
        
        console.log('Zákazník bol úspešne aktualizovaný s ID:', selectedCustomerForEdit.id);
      } else {
        // Ide o nového zákazníka
        const customersRef = collection(db, 'customers');
        const newCustomer = {
          ...customerDataToSave, // companyID sa prenesie
          createdAt: Timestamp.fromDate(new Date())
        };
        
        const docRef = await addDoc(customersRef, newCustomer);
        console.log('Zákazník bol úspešne uložený s ID:', docRef.id);
      }
      
      // Real-time listener automaticky aktualizuje zoznam zákazníkov
      console.log("Real-time listener automaticky aktualizuje zákazníkov");
      
      // Resetujeme stav editácie a zatvoríme formulár
      setSelectedCustomerForEdit(null);
      setShowCustomerForm(false);
    } catch (error) {
      console.error('Chyba pri ukladaní/aktualizácii zákazníka:', error);
      alert('Nastala chyba pri ukladaní/aktualizácii zákazníka: ' + (error as Error).message);
    }
  };

  // useEffect pre zákazníkov odstránený - real-time listener sa nastavuje v hlavnom useEffect

  const filteredCustomers = customers.filter(customer => {
    const searchLower = customerSearchQuery.toLowerCase();
    return (
      (customer.company || (customer as any).companyName || '').toLowerCase().includes(searchLower) ||
      (customer.contactName || '').toLowerCase().includes(searchLower) ||
      (customer.contactSurname || '').toLowerCase().includes(searchLower) ||
      (customer.email || (customer as any).contactEmail || '').toLowerCase().includes(searchLower) ||
      (customer.ico || '').toLowerCase().includes(searchLower) ||
      (customer.dic || '').toLowerCase().includes(searchLower) ||
      (customer.vatId || (customer as any).icDph || '').toLowerCase().includes(searchLower)
    );
  });

  // Paginované verzie všetkých filtrov
  const paginatedOrders = getFilteredCustomerOrders().slice(ordersPage * ordersRowsPerPage, ordersPage * ordersRowsPerPage + ordersRowsPerPage);
  const paginatedCustomers = filteredCustomers.slice(customersPage * customersRowsPerPage, customersPage * customersRowsPerPage + customersRowsPerPage);

  const handleAddCarrier = () => {
    setSelectedCarrierForEdit(null); // Reset editácie
    setShowCarrierForm(true);
  };

  const _handleCarrierSubmit = async (carrierData: any) => {
    if (!userData?.companyID) {
      alert("Chyba: Nemáte priradenú firmu.");
      return;
    }
    try {
      console.log('Začínam ukladanie/aktualizáciu dopravcu:', carrierData);
      
      const carrierDataToSave = {
        companyName: carrierData.companyName,
        street: carrierData.street,
        city: carrierData.city,
        zip: carrierData.zip,
        country: carrierData.country,
        contactName: carrierData.contactName,
        contactSurname: carrierData.contactSurname,
        contactEmail: carrierData.contactEmail,
        contactPhone: carrierData.contactPhone || '',
        ico: carrierData.ico || '',
        dic: carrierData.dic || '',
        icDph: carrierData.icDph || '',
        vehicleTypes: carrierData.vehicleTypes || [],
        notes: carrierData.notes || '',
        paymentTermDays: carrierData.paymentTermDays || 60, // Default 60 days
        companyID: userData.companyID // Pridanie companyID
      };

      console.log('💾 Objekt na uloženie:', carrierDataToSave);

      // Ak editujeme existujúceho dopravcu
      if (selectedCarrierForEdit?.id) {
        console.log('✏️ Editujem existujúceho dopravcu s ID:', selectedCarrierForEdit.id);
        const carrierRef = doc(db, 'carriers', selectedCarrierForEdit.id);
        await updateDoc(carrierRef, carrierDataToSave);
        console.log('✅ Dopravca bol úspešne aktualizovaný s ID:', selectedCarrierForEdit.id);
        
        // Resetujeme stav editácie
        setSelectedCarrierForEdit(null);
      } else {
        console.log('➕ Vytváram nového dopravcu');
        // Vytvárame nového dopravcu
        const carriersRef = collection(db, 'carriers');
        const carrierDataWithTimestamp = {
          ...carrierDataToSave,
          createdAt: Timestamp.fromDate(new Date())
        };
        
        const docRef = await addDoc(carriersRef, carrierDataWithTimestamp);
        console.log('✅ Dopravca bol úspešne uložený s ID:', docRef.id);
      }
      
      // Real-time listener automaticky aktualizuje zoznam dopravcov
      console.log("🔄 Real-time listener automaticky aktualizuje dopravcov");
      
      // Resetujeme formulárové dáta
      setCarrierFormData({
        companyName: '',
        street: '',
        city: '',
        zip: '',
        country: 'Slovensko',
        contactName: '',
        contactSurname: '',
        contactEmail: '',
        contactPhone: '',
        ico: '',
        dic: '',
        icDph: '',
        vehicleTypes: '',
        notes: '',
        paymentTermDays: '60' // Default 60 dní ako string pre TextField
      });
      
      // Resetujeme aj selectedCarrierForEdit
      setSelectedCarrierForEdit(null);
      
      // Až potom zatvoríme formulár
      setShowCarrierForm(false);
    } catch (error) {
      console.error('❌ Chyba pri ukladaní dopravcu:', error);
      alert('Nastala chyba pri ukladaní dopravcu: ' + (error as Error).message);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomerForEdit(customer);
    setShowCustomerForm(true);
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      const customerRef = doc(db, 'customers', id);
      await deleteDoc(customerRef);
      console.log('Zákazník bol úspešne vymazaný');
      // fetchCustomers(); // Odstránené - real-time listener automaticky aktualizuje
    } catch (error) {
      console.error('Chyba pri vymazávaní zákazníka:', error);
      alert('Nastala chyba pri vymazávaní zákazníka: ' + (error as Error).message);
    }
  };

  const openCustomerDeleteConfirmation = (id: string) => {
    setCustomerToDelete(id);
    setShowCustomerDeleteConfirm(true);
  };

  const handleCustomerDeleteConfirmed = async () => {
    if (customerToDelete) {
      await handleDeleteCustomer(customerToDelete);
      setShowCustomerDeleteConfirm(false);
      setCustomerToDelete('');
    }
  };

  const handleCustomerDeleteCancel = () => {
    setShowCustomerDeleteConfirm(false);
    setCustomerToDelete('');
  };

  // Funkcie pre správu dopravcov
  const handleEditCarrier = (carrier: Carrier) => {
    setSelectedCarrierForEdit(carrier);
    // Nastavím formulárové dáta pre editáciu
    setCarrierFormData({
      companyName: carrier.companyName,
      street: carrier.street,
      city: carrier.city,
      zip: carrier.zip,
      country: carrier.country,
      contactName: carrier.contactName,
      contactSurname: carrier.contactSurname,
      contactEmail: carrier.contactEmail,
      contactPhone: carrier.contactPhone || '',
      ico: carrier.ico || '',
      dic: carrier.dic || '',
      icDph: carrier.icDph || '',
      vehicleTypes: carrier.vehicleTypes?.join(', ') || '',
      notes: carrier.notes || '',
      paymentTermDays: (carrier.paymentTermDays || 60).toString() // Convert number to string
    });
    setShowCarrierForm(true);
  };

  const handleDeleteCarrier = async (id: string) => {
    try {
      const carrierRef = doc(db, 'carriers', id);
      await deleteDoc(carrierRef);
      console.log('Dopravca bol úspešne vymazaný');
      // fetchCarriers(); // Odstránené - real-time listener automaticky aktualizuje
    } catch (error) {
      console.error('Chyba pri vymazávaní dopravcu:', error);
      alert('Nastala chyba pri vymazávaní dopravcu: ' + (error as Error).message);
    }
  };

  const openCarrierDeleteConfirmation = (id: string) => {
    setCarrierToDelete(id);
    setShowCarrierDeleteConfirm(true);
  };

  const handleCarrierDeleteConfirmed = async () => {
    if (carrierToDelete) {
      await handleDeleteCarrier(carrierToDelete);
      setShowCarrierDeleteConfirm(false);
      setCarrierToDelete('');
    }
  };

  const handleCarrierDeleteCancel = () => {
    setShowCarrierDeleteConfirm(false);
    setCarrierToDelete('');
  };

  // Pridám pomocnú funkciu nad renderom tabuľky:
  // eslint-disable-next-line
  const _getCustomerVatId = (customer: any) => {
    return customer.icDph || customer.vatId || customer['IČ_DPH'] || customer['ic_dph'] || '-';
  };

  // eslint-disable-next-line
  const _openOrderNumberEditDialog = (orderId: string) => {
    setOrderToUpdateId(orderId);
    setShowOrderNumberDialog(true);
  };

  // eslint-disable-next-line
  const _closeOrderNumberEditDialog = () => {
    setOrderToUpdateId(null);
    setNewOrderNumber('');
    setShowOrderNumberDialog(false);
  };

  const handleRowClick = (order: OrderFormData) => {
    setSelectedOrder(order);
    setDetailDialogOpen(true);
  };

  const handleCloseDetail = () => {
    setDetailDialogOpen(false);
  };

  // Funkcie pre správu miest
  const handleAddLocation = () => {
    setSelectedLocationForEdit(null);
    setShowLocationForm(true);
  };

  const handleLocationSubmit = async (locationData: LocationData) => {
    if (!userData?.companyID) {
      alert("Chyba: Nemáte priradenú firmu.");
      return;
    }
    try {
      console.log('Začínam ukladanie miesta:', locationData);
      
      const locationDataToSave = {
        type: locationData.type,
        companyName: locationData.companyName,
        city: locationData.city,
        street: locationData.street,
        zip: locationData.zip,
        country: locationData.country,
        contactPersonName: locationData.contactPersonName,
        contactPersonPhone: locationData.contactPersonPhone,
        companyID: userData.companyID,
        createdAt: Timestamp.fromDate(new Date()),
        usageCount: 0 // Počiatočný počet použití
      };

      if (selectedLocationForEdit) {
        // Editácia existujúceho miesta
        const locationRef = doc(db, 'locations', (selectedLocationForEdit as any).id);
        await updateDoc(locationRef, {
          ...locationDataToSave,
          updatedAt: Timestamp.fromDate(new Date())
        });
        console.log('Miesto bolo úspešne aktualizované');
      } else {
        // Pridanie nového miesta
        const locationsRef = collection(db, 'locations');
        const docRef = await addDoc(locationsRef, locationDataToSave);
        console.log('Miesto bolo úspešne uložené s ID:', docRef.id);
      }
      
      // Real-time listener automaticky aktualizuje zoznam miest
      console.log("Real-time listener automaticky aktualizuje miesta");
      
      // Resetujeme stav editácie a zatvoríme formulár
      setSelectedLocationForEdit(null);
      setShowLocationForm(false);
    } catch (error) {
      console.error('Chyba pri ukladaní miesta:', error);
      alert('Nastala chyba pri ukladaní miesta: ' + (error as Error).message);
    }
  };

  const handleEditLocation = (location: any) => {
    const locationForEdit: LocationData = {
      type: location.type,
      companyName: location.companyName,
      city: location.city,
      street: location.street,
      zip: location.zip,
      country: location.country,
      contactPersonName: location.contactPersonName,
      contactPersonPhone: location.contactPersonPhone
    };
    setSelectedLocationForEdit({ ...locationForEdit, id: location.id } as any);
    setShowLocationForm(true);
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      const locationRef = doc(db, 'locations', id);
      await deleteDoc(locationRef);
      console.log('Miesto bolo úspešne vymazané');
      // Real-time listener automaticky aktualizuje zoznam
    } catch (error) {
      console.error('Chyba pri vymazávaní miesta:', error);
      alert('Nastala chyba pri vymazávaní miesta: ' + (error as Error).message);
    }
  };

  const openLocationDeleteConfirmation = (id: string) => {
    setLocationToDelete(id);
    setShowLocationDeleteConfirm(true);
  };

  const handleLocationDeleteConfirmed = async () => {
    if (locationToDelete) {
      await handleDeleteLocation(locationToDelete);
      setShowLocationDeleteConfirm(false);
      setLocationToDelete('');
    }
  };

  const handleLocationDeleteCancel = () => {
    setShowLocationDeleteConfirm(false);
    setLocationToDelete('');
  };

  // Funkcie pre hodnotenie zákazníkov
  const handleOpenCustomerRating = (customer: Customer) => {
    setSelectedCustomerForRating(customer);
    setShowCustomerRatingDialog(true);
  };

  const handleCloseCustomerRating = () => {
    setShowCustomerRatingDialog(false);
    setSelectedCustomerForRating(null);
  };

  const handleSubmitCustomerRating = async (rating: CustomerRating) => {
    if (!selectedCustomerForRating?.id) return;
    
    try {
      const customerRef = doc(db, 'customers', selectedCustomerForRating.id);
      await updateDoc(customerRef, { rating });
      console.log('✅ Hodnotenie zákazníka bolo úspešne uložené');
    } catch (error) {
      console.error('❌ Chyba pri ukladaní hodnotenia zákazníka:', error);
      alert('Nastala chyba pri ukladaní hodnotenia: ' + (error as Error).message);
    }
  };

  // Funkcie pre hodnotenie dopravcov
  const handleOpenCarrierRating = (carrier: Carrier) => {
    setSelectedCarrierForRating(carrier);
    setShowCarrierRatingDialog(true);
  };

  const handleCloseCarrierRating = () => {
    setSelectedCarrierForRating(null);
    setShowCarrierRatingDialog(false);
  };

  const handleSubmitCarrierRating = async (rating: CarrierRating) => {
    if (!selectedCarrierForRating?.id) return;
    
    try {
      const carrierRef = doc(db, 'carriers', selectedCarrierForRating.id);
      await updateDoc(carrierRef, { rating });
      console.log('✅ Hodnotenie dopravcu bolo úspešne uložené');
    } catch (error) {
      console.error('❌ Chyba pri ukladaní hodnotenia dopravcu:', error);
      alert('Nastala chyba pri ukladaní hodnotenia: ' + (error as Error).message);
    }
  };

  // Pomocná funkcia pre výpočet priemerného hodnotenia zákazníka
  const getCustomerAverageRating = (customer: Customer): number => {
    if (!customer.rating) return 0;
    const { paymentReliability, communication, overallSatisfaction } = customer.rating;
    if (paymentReliability === 0 && communication === 0 && overallSatisfaction === 0) return 0;
    return Math.round((paymentReliability + communication + overallSatisfaction) / 3);
  };

  // Pomocná funkcia pre výpočet priemerného hodnotenia dopravcu
  const getCarrierAverageRating = (carrier: Carrier): number => {
    if (!carrier.rating) return 0;
    const { reliability, communication, serviceQuality, timeManagement } = carrier.rating;
    if (reliability === 0 && communication === 0 && serviceQuality === 0 && timeManagement === 0) return 0;
    return Math.round((reliability + communication + serviceQuality + timeManagement) / 4);
  };

  // useEffect pre dopravcov odstránený - real-time listener sa nastavuje v hlavnom useEffect

  const filteredCarriers = carriers.filter(carrier => {
    const searchLower = carrierSearchQuery.toLowerCase();
    return (
      (carrier.companyName || '').toLowerCase().includes(searchLower) ||
      (carrier.contactName || '').toLowerCase().includes(searchLower) ||
      (carrier.contactSurname || '').toLowerCase().includes(searchLower) ||
      (carrier.contactEmail || '').toLowerCase().includes(searchLower) ||
      (carrier.contactPhone || '').toLowerCase().includes(searchLower) ||
      (carrier.ico || '').toLowerCase().includes(searchLower) ||
      (carrier.dic || '').toLowerCase().includes(searchLower) ||
      (carrier.icDph || '').toLowerCase().includes(searchLower)
    );
  });

  const paginatedCarriers = filteredCarriers.slice(carriersPage * carriersRowsPerPage, carriersPage * carriersRowsPerPage + carriersRowsPerPage);

  // Filtrovanie miest
  const filteredLocations = locations.filter(location => {
    const searchLower = locationSearchQuery.toLowerCase();
    return (
      location.city?.toLowerCase().includes(searchLower) ||
      location.street?.toLowerCase().includes(searchLower) ||
      (location.contactPersonName || location.contactPerson)?.toLowerCase().includes(searchLower) ||
      location.contactPersonPhone?.toLowerCase().includes(searchLower) ||
      location.companyName?.toLowerCase().includes(searchLower)
    );
  });

  const paginatedLocations = filteredLocations.slice(locationsPage * locationsRowsPerPage, locationsPage * locationsRowsPerPage + locationsRowsPerPage);

  // Filtrovanie špeditérov
  const filteredDispatchers = dispatchers.filter(dispatcher => {
    const searchLower = dispatcherSearchQuery.toLowerCase();
    return (
      dispatcher.name?.toLowerCase().includes(searchLower) ||
      dispatcher.email?.toLowerCase().includes(searchLower)
    );
  });

  const paginatedDispatchers = filteredDispatchers.slice(dispatchersPage * dispatchersRowsPerPage, dispatchersPage * dispatchersRowsPerPage + dispatchersRowsPerPage);

  const handleCarrierFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCarrierFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Funkcia handleCarrierFormSubmit bola odstránená - namiesto toho sa používa _handleCarrierSubmit

  const handleSubmitOrderRating = async (rating: OrderRating) => {
    if (!selectedOrderForRating?.id) return;
    
    try {
      const orderRef = doc(db, 'orders', selectedOrderForRating.id);
      await updateDoc(orderRef, {
        rating: rating
      });
      
      // Aktualizuj lokálny state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === selectedOrderForRating.id 
            ? { ...order, rating: rating }
            : order
        )
      );
      
      // Zatvor dialóg
      handleCloseOrderRating();
      
      console.log('✅ Hodnotenie objednávky uložené úspešne');
    } catch (error) {
      console.error('❌ Chyba pri ukladaní hodnotenia objednávky:', error);
      alert('Nastala chyba pri ukladaní hodnotenia: ' + (error as Error).message);
    }
  };

  const getOrderAverageRating = (order: OrderFormData): number => {
    if (!order.rating) return 0;
    return order.rating.overallTransportRating || 0;
  };

  const handleOpenOrderRating = (order: OrderFormData) => {
    setSelectedOrderForRating(order);
    setShowOrderRatingDialog(true);
  };

  const handleCloseOrderRating = () => {
    setSelectedOrderForRating(null);
    setShowOrderRatingDialog(false);
  };

  // Nové funkcie pre výber jazyka
  const handleShowLanguageMenu = (event: React.MouseEvent<HTMLElement>, order: OrderFormData, action: 'preview' | 'download') => {
    event.stopPropagation();
    setLanguageMenuAnchor(event.currentTarget);
    setOrderForLanguageSelection(order);
    setLanguageMenuAction(action);
    setShowLanguageMenu(true);
  };

  const handleCloseLanguageMenu = () => {
    setShowLanguageMenu(false);
    setLanguageMenuAnchor(null);
    setOrderForLanguageSelection(null);
  };

  const handleLanguageSelect = async (language: 'sk' | 'en' | 'de' | 'cs' | 'pl') => {
    if (!orderForLanguageSelection) return;
    
    handleCloseLanguageMenu();
    
    if (languageMenuAction === 'preview') {
      await handlePreviewPDFWithLanguage(orderForLanguageSelection, language);
    } else {
      await handleDownloadPDFWithLanguage(orderForLanguageSelection, language);
    }
  };

  // Upravené funkcie pre PDF s jazykom
  const handlePreviewPDFWithLanguage = async (order: OrderFormData, language: 'sk' | 'en' | 'de' | 'cs' | 'pl' = 'sk') => {
    try {
      if (!order.id) {
        alert('Objednávka nemá priradené ID. Prosím, uložte objednávku a skúste znovu.');
        return;
      }
      
      // Zobraziť loading dialog
      setShowPdfLoadingDialog(true);
      setPdfLoadingMessage('Generujem PDF náhľad...');
      
      setLoadingPdf(true);
      setPreviewOrder(order);
      
      // Volanie serverovej funkcie pre generovanie PDF s jazykom
      const generatePdf = httpsCallable(functions, 'generateOrderPdf');
      const result = await generatePdf({ orderId: order.id, language });
      
      // @ts-ignore - výsledok obsahuje pdfBase64 a fileName
      const { pdfBase64 } = result.data;
      
      if (!pdfBase64) {
        throw new Error('PDF data not received from server');
      }
      
      // Konverzia base64 na Blob
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Vytvorenie URL pre blob
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
      // Teraz otvoríme preview dialog keď je PDF pripravené
      setShowPdfPreview(true);
      setLoadingPdf(false);
      // Zavrieť loading dialog
      setShowPdfLoadingDialog(false);
    } catch (error) {
      console.error('Chyba pri generovaní náhľadu PDF:', error);
      alert('Nastala chyba pri generovaní PDF objednávky: ' + (error as Error).message);
      setLoadingPdf(false);
      setShowPdfPreview(false);
      // Zavrieť loading dialog aj pri chybe
      setShowPdfLoadingDialog(false);
    }
  };

  const handleDownloadPDFWithLanguage = async (order: OrderFormData, language: 'sk' | 'en' | 'de' | 'cs' | 'pl' = 'sk') => {
    try {
      if (!order.id) {
        alert('Objednávka nemá priradené ID. Prosím, uložte objednávku a skúste znovu.');
        return;
      }
      
      // Zobraziť loading dialog
      setShowPdfLoadingDialog(true);
      setPdfLoadingMessage('Generujem PDF na stiahnutie...');
      
      setLoading(true);
      
      // Volanie serverovej funkcie pre generovanie PDF s jazykom
      const generatePdf = httpsCallable(functions, 'generateOrderPdf');
      const result = await generatePdf({ orderId: order.id, language });
      
      // @ts-ignore - výsledok obsahuje pdfBase64 a fileName
      const { pdfBase64, fileName } = result.data;
      
      // Konverzia base64 na Blob
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Vytvorenie URL a stiahnutie
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `order_${order.orderNumber || order.id.substring(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setLoading(false);
      // Zavrieť loading dialog
      setShowPdfLoadingDialog(false);
    } catch (error) {
      console.error('Chyba pri sťahovaní PDF:', error);
      alert('Nastala chyba pri generovaní PDF objednávky: ' + (error as Error).message);
      setLoading(false);
      // Zavrieť loading dialog aj pri chybe
      setShowPdfLoadingDialog(false);
    }
  };

  // Wrapper funkcie pre tabuľku
  const handlePreviewPDFForTable = (event: React.MouseEvent<HTMLElement>, order: OrderFormData) => {
    handleShowLanguageMenu(event, order, 'preview');
  };

  const handleDownloadPDFForTable = (event: React.MouseEvent<HTMLElement>, order: OrderFormData) => {
    handleShowLanguageMenu(event, order, 'download');
  };

  return (
    <PageWrapper>
      <DialogGlobalStyles open={showNewOrderWizard || showCustomerForm || showCarrierForm || showDeleteConfirm || showCustomerDeleteConfirm || showCarrierDeleteConfirm || showPdfLoadingDialog} />
      <PageHeader>
        <PageTitle isDarkMode={isDarkMode}>{t('navigation.orders')}</PageTitle>
              <PageDescription>
          {t('orders.description')}
              </PageDescription>
      </PageHeader>

      <StyledPaper>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="objednávky tabs"
              textColor="inherit"
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: '#ff9f43',
                },
                '& .MuiTab-root': {
                  fontSize: '1rem',
                  fontWeight: 600,
                  textTransform: 'none',
                  '&.Mui-selected': {
                    color: '#ff9f43',
                  },
                },
              }}
            >
              <Tab label={t('orders.allOrders')} />
              <Tab label={t('orders.customers')} />
              <Tab label={t('orders.carriers')} />
              <Tab label={t('orders.locations') || 'Miesta'} />
              <Tab label={t('orders.dispatchers') || 'Špeditéri'} />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenNewOrderForm}
            sx={{
                    backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.8)' : '#ff9f43',
                    color: '#ffffff',
                    fontWeight: 500,
              '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.9)' : '#f7b067',
                    }
            }}
          >
{t('orders.newOrder')}
          </Button>
        </Box>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                alignItems: 'center', 
                flex: 1, 
                justifyContent: 'flex-end',
                flexWrap: 'wrap',
                '@media (max-width: 900px)': {
                  flexDirection: 'column',
                  alignItems: 'stretch',
                  '& > *': {
                    width: '100%',
                    maxWidth: 'none !important'
                  }
                }
              }}>
              <TextField
                  id="search-order"
                  name="searchOrder"
                  label={t('orders.searchOrder')}
                  variant="outlined"
                  size="small"
                  value={searchQuery}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  sx={{ 
                    flexGrow: 1, 
                    minWidth: '220px', 
                    maxWidth: '380px',
                    '& .MuiOutlinedInput-root': {
                      height: '40px',
                    }
                  }}
                  InputProps={{
                      startAdornment: (
                          <InputAdornment position="start">
                              <SearchIcon />
                          </InputAdornment>
                      ),
                  }}
              />
              <Autocomplete
                options={Object.values(DOCUMENT_TYPE_CONFIG).map(config => config.label)}
                value={documentFilter}
                onChange={(event, newValue) => setDocumentFilter(newValue || '')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={t('orders.documentFilter')}
                    variant="outlined"
                    size="small"
                    placeholder={t('orders.documentFilterPlaceholder')}
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <InputAdornment position="start">
                            <DescriptionIcon />
                          </InputAdornment>
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                  />
                )}
                sx={{ 
                  minWidth: '200px', 
                  maxWidth: '220px',
                  '& .MuiOutlinedInput-root': {
                    height: '40px', // Rovnaká výška ako TextField
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    '& .MuiAutocomplete-input': {
                      padding: '8.5px 4px 8.5px 0 !important', // Štandardný padding ako v TextField
                    }
                  },
                  '& .MuiInputLabel-root': {
                    transform: 'translate(52px, 12px) scale(1)', // Štandardná pozícia ako v TextField
                    '&.MuiInputLabel-shrink': {
                      transform: 'translate(14px, -9px) scale(0.75)', // Vrátim späť na normálnu pozíciu
                    }
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    '& legend': {
                      marginLeft: '2px', // Menší posun - z 4px na 2px aby F malo viac miesta
                      paddingRight: '10px', // Zvýšim padding z 8px na 10px pre pravú čiaru
                    }
                  },
                  '& .MuiInputAdornment-root': {
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.54)' : 'rgba(0, 0, 0, 0.54)', // Farba podľa témy
                  }
                }}
                clearOnEscape
                freeSolo
                disableClearable={false}
              />
              <IconButton onClick={() => setShowFilters(!showFilters)}>
                  <FilterListIcon />
              </IconButton>
              </Box>
          </Box>

                        <Collapse in={showFilters}>
                  <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            const now = new Date();
                            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                            setStartDate(startOfMonth);
                            setEndDate(endOfMonth);
                          }}
                          sx={{
                            borderColor: '#ff9f43',
                            color: '#ff9f43',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 159, 67, 0.1)',
                            }
                          }}
                        >
                          {t('common.thisMonth')}
                        </Button>
                        
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => {
                            const now = new Date();
                            const startOfYear = new Date(now.getFullYear(), 0, 1);
                            const endOfYear = new Date(now.getFullYear(), 11, 31);
                            setStartDate(startOfYear);
                            setEndDate(endOfYear);
                          }}
                          sx={{
                            borderColor: '#ff9f43',
                            color: '#ff9f43',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 159, 67, 0.1)',
                            }
                          }}
                        >
                          {t('common.thisYear')}
                        </Button>
                      </Box>

                      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                          <DatePicker
                              label={t('common.from')}
                              value={startDate}
                              onChange={(newValue) => setStartDate(newValue)}
                              slotProps={{ textField: { size: 'small' } }}
                          />
                          <DatePicker
                              label={t('common.to')}
                              value={endDate}
                              onChange={(newValue) => setEndDate(newValue)}
                              slotProps={{ textField: { size: 'small' } }}
                          />
                      </LocalizationProvider>
                      <Button 
                        onClick={() => { 
                          setStartDate(null); 
                          setEndDate(null);
                          setDispatcherFilter('all');
                          setCustomStartDate(null); 
                          setCustomEndDate(null);
                          setDocumentFilter('');
                        }} 
                        size="small"
                        sx={{ 
                          color: '#ff9f43',
                          '&:hover': { backgroundColor: 'rgba(255, 159, 67, 0.04)' }
                        }}
                      >
                        {t('common.clearFilter')}
                      </Button>
                  </Box>
              </Collapse>
          
          {isLoadingOrders ? (
            <Box display="flex" justifyContent="center" mt={4}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Načítavam objednávky...
              </Typography>
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
          ) : isMobile ? ( // Ak je mobilné zariadenie, zobraz karty
            <Box mt={2}>
              {getFilteredCustomerOrders().map(order => (
                <MobileOrderCard 
                  key={order.id} 
                  order={order} 
                  onEdit={handleEditOrder} 
                  onDelete={handleDeleteOrder}
                  onPreviewPDF={handlePreviewPDFForTable}
                  onDownloadPDF={handleDownloadPDFForTable}
                />
              ))}
                                  {getFilteredCustomerOrders().length === 0 && (
                      <Typography variant="body1" align="center" sx={{ mt: 4 }}>
                        {t('orders.noOrdersFound')}
                      </Typography>
                   )}
            </Box>
          ) : ( // Ak nie je mobilné zariadenie, zobraz tabuľku
            <TableContainer 
              component={Paper} 
              sx={{ 
                  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
                  borderRadius: '20px',
                  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  backdropFilter: 'blur(20px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                  '& .MuiTableCell-root': {
                    color: isDarkMode ? '#ffffff' : '#000000',
                    borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    padding: '16px',
                    fontSize: '0.9rem',
                    whiteSpace: 'nowrap'
                  },
                  '& .MuiTableHead-root .MuiTableCell-root': {
                    fontWeight: 600,
                    backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    borderBottom: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  },
                  '& .MuiTableBody-root .MuiTableRow-root': {
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                    }
                  }
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <SortableTableCell 
                      isDarkMode={isDarkMode}
                      sortField={sortField}
                      currentField="orderNumber"
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    >
                      {t('orders.orderNumber')}
                    </SortableTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.documents') || 'Dokumenty'}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.customer')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.contactPerson')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>Dopravca</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>Kontaktná osoba dopravcu</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>ŠPZ</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.loading')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.loadingTime')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.unloading')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.unloadingTime')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.goods')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode} sx={{ color: '#ff9f43', fontWeight: 'bold' }}>{t('orders.customerPrice')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode} sx={{ color: '#1976d2', fontWeight: 'bold' }}>{t('orders.carrierPrice')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode} sx={{ color: '#2ecc71', fontWeight: 'bold' }}>{t('orders.profit')}</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>Hodnotenie</StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.dispatcher')}</StyledTableCell>
                    <SortableTableCell 
                      isDarkMode={isDarkMode}
                      sortField={sortField}
                      currentField="createdAt"
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    >
                      {t('orders.creationDate')}
                    </SortableTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}>{t('orders.actions')}</StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedOrders.map((order) => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      isDarkMode={isDarkMode}
                      teamMembers={teamMembers}
                      onRowClick={handleRowClick}
                      onEditOrder={handleEditOrder}
                      onDuplicateOrder={handleDuplicateOrder}
                      onPreviewPDF={handlePreviewPDFForTable}
                      onDownloadPDF={handleDownloadPDFForTable}
                      onDeleteOrder={openDeleteConfirmation}
                      onRateOrder={handleOpenOrderRating}
                      t={t}
                      getOrderAverageRating={getOrderAverageRating}
                    />
                  ))}
                  {getFilteredCustomerOrders().length === 0 && (
                    <TableRow>
                      <TableCell colSpan={19} align="center">
                        {t('orders.noOrdersFound')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <TablePagination
                component="div"
                count={getFilteredCustomerOrders().length}
                page={ordersPage}
                onPageChange={(e: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => setOrdersPage(newPage)}
                rowsPerPage={ordersRowsPerPage}
                onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                  setOrdersRowsPerPage(parseInt(e.target.value, 10));
                  setOrdersPage(0);
                }}
                rowsPerPageOptions={[10, 25, 50, 100]}
                labelRowsPerPage={t('business.rowsPerPage')}
              />
            </TableContainer>
          )}
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={handleAddCustomer}
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.8)' : '#ff9f43',
                      color: '#ffffff',
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.9)' : '#f7b067',
                      }
                    }}
                  >
{t('orders.addCustomer')}
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  <TextField
                    id="search-customer"
                    name="searchCustomer"
                    label={t('orders.searchCustomer')}
                    variant="outlined"
                    size="small"
                    value={customerSearchQuery}
                    onChange={(e) => setCustomerSearchQuery(e.target.value)}
                    sx={{ flexGrow: 1, minWidth: '250px', maxWidth: '500px' }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Box>

              {isLoadingCustomers ? (
                <Box display="flex" justifyContent="center" alignItems="center" mt={4} p={4}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    Načítavam zákazníkov...
                  </Typography>
                </Box>
              ) : (
                <TableContainer 
                  component={Paper} 
                  sx={{ // Tu začína správny sx objekt
                      backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
                      borderRadius: '20px',
                      border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                      '& .MuiTableCell-root': {
                        color: isDarkMode ? '#ffffff' : '#000000',
                        borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        padding: '16px',
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap'
                      },
                      '& .MuiTableHead-root .MuiTableCell-root': {
                        fontWeight: 600,
                        backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                        borderBottom: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      },
                      '& .MuiTableBody-root .MuiTableRow-root': {
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }
                      }
                    }} // Tu končí správny sx objekt
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('orders.companyName')}</TableCell>
                        <TableCell>{t('orders.contactPerson')}</TableCell>
                        <TableCell>{t('orders.email')}</TableCell>
                        <TableCell>Telefón</TableCell>
                        <TableCell>{t('orders.ico')}</TableCell>
                        <TableCell>{t('orders.icDph')}</TableCell>
                        <TableCell>{t('orders.dic')}</TableCell>
                        <TableCell>{t('orders.country')}</TableCell>
                        <TableCell>{t('orders.paymentTermDays') || 'Splatnosť (dni)'}</TableCell>
                        <TableCell>Hodnotenie</TableCell>
                        <TableCell>{t('orders.creationDate')}</TableCell>
                        <TableCell>{t('orders.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedCustomers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>{customer.company || (customer as any).companyName || '-'}</TableCell>
                          <TableCell>{`${customer.contactName || ''} ${customer.contactSurname || ''}`.trim() || '-'}</TableCell>
                          <TableCell>{customer.email || (customer as any).contactEmail || '-'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {customer.contactPhonePrefix && customer.contactPhone && (
                                <>
                                  <img 
                                    loading="lazy" 
                                    width="20" 
                                    height="15"
                                    src={`https://flagcdn.com/${(countries.find(c => c.prefix === customer.contactPhonePrefix)?.code || 'sk').toLowerCase()}.svg`} 
                                    alt="Vlajka krajiny" 
                                    style={{ borderRadius: '2px', objectFit: 'cover' }}
                                  />
                                  <Typography variant="body2">
                                    {customer.contactPhonePrefix}{customer.contactPhone}
                                  </Typography>
                                </>
                              )}
                              {!customer.contactPhonePrefix && customer.phone && (
                                <Typography variant="body2">{customer.phone}</Typography>
                              )}
                              {!customer.contactPhonePrefix && !customer.contactPhone && !customer.phone && (
                                <Typography variant="body2" sx={{ color: 'text.secondary' }}>-</Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>{customer.ico || '-'}</TableCell>
                          <TableCell>{customer.vatId || (customer as any).icDph || '-'}</TableCell>
                          <TableCell>{customer.dic || '-'}</TableCell>
                          <TableCell>{customer.country || '-'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={`${customer.paymentTermDays || 30} dní`}
                              color="primary"
                              size="small"
                              sx={{ 
                                backgroundColor: '#ff9f43',
                                color: '#ffffff',
                                fontWeight: 'bold'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, height: '100%' }}>
                              <RatingIndicator 
                                rating={getCustomerAverageRating(customer)} 
                                size="small" 
                                showChip 
                              />
                              <BareTooltip title="Pridať/upraviť hodnotenie">
                                <IconButton 
                                  onClick={() => handleOpenCustomerRating(customer)}
                                  size="small"
                                  sx={{ 
                                    color: '#2196f3',
                                    padding: '4px',
                                    '&:hover': { 
                                      backgroundColor: 'rgba(33, 150, 243, 0.1)' 
                                    } 
                                  }}
                                >
                                  <StarIcon fontSize="small" />
                                </IconButton>
                              </BareTooltip>
                            </Box>
                          </TableCell>
                          <TableCell>{customer.createdAt ? (
                            customer.createdAt instanceof Date 
                              ? customer.createdAt.toLocaleDateString('sk-SK', { year: 'numeric', month: '2-digit', day: '2-digit' })
                              : (customer.createdAt as any).toDate().toLocaleDateString('sk-SK', { year: 'numeric', month: '2-digit', day: '2-digit' })
                          ) : '-'}</TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <BareTooltip title={t('orders.edit')}>
                                <IconButton 
                                  onClick={() => handleEditCustomer(customer)}
                                  sx={{ 
                                    color: '#ff9f43',
                                    '&:hover': { 
                                      backgroundColor: 'rgba(255, 159, 67, 0.1)' 
                                    } 
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </BareTooltip>
                              <BareTooltip title={t('orders.delete')}>
                                <IconButton 
                                  onClick={() => {
                                    if (customer.id) {
                                      openCustomerDeleteConfirmation(customer.id);
                                    }
                                  }}
                                  sx={{ 
                                    color: '#ff6b6b',
                                    '&:hover': { 
                                      backgroundColor: 'rgba(255, 107, 107, 0.1)' 
                                    } 
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </BareTooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    component="div"
                    count={filteredCustomers.length}
                    page={customersPage}
                    onPageChange={(e: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => setCustomersPage(newPage)}
                    rowsPerPage={customersRowsPerPage}
                    onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                      setCustomersRowsPerPage(parseInt(e.target.value, 10));
                      setCustomersPage(0);
                    }}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    labelRowsPerPage={t('business.rowsPerPage')}
                  />
                </TableContainer>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={handleAddCarrier}
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.8)' : '#ff9f43',
                      color: '#ffffff',
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.9)' : '#f7b067',
                      }
                    }}
                  >
                    {t('orders.addCarrier')}
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  <TextField
                    id="search-carrier"
                    name="searchCarrier"
                    label={t('orders.searchCarrier')}
                    variant="outlined"
                    size="small"
                    value={carrierSearchQuery}
                    onChange={(e) => setCarrierSearchQuery(e.target.value)}
                    sx={{ flexGrow: 1, minWidth: '250px', maxWidth: '500px' }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Box>

              {isLoadingCarriers ? (
                <Box display="flex" justifyContent="center" alignItems="center" mt={4} p={4}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    Načítavam dopravcov...
                  </Typography>
                </Box>
              ) : (
                <TableContainer 
                  component={Paper} 
                  sx={{
                      // Štýly skopírované z BusinessCases.tsx
                      backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
                      borderRadius: '20px',
                      border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                      '& .MuiTableCell-root': {
                        color: isDarkMode ? '#ffffff' : '#000000',
                        borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        padding: '16px',
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap'
                      },
                      '& .MuiTableHead-root .MuiTableCell-root': {
                        fontWeight: 600,
                        backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                        borderBottom: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      },
                      '& .MuiTableBody-root .MuiTableRow-root': {
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }
                      }
                    }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('orders.companyName')}</TableCell>
                        <TableCell>{t('orders.contactPerson')}</TableCell>
                        <TableCell>{t('orders.email')}</TableCell>
                        <TableCell>{t('orders.phone')}</TableCell>
                        <TableCell>{t('orders.ico')}</TableCell>
                        <TableCell>{t('orders.icDph')}</TableCell>
                        <TableCell>{t('orders.dic')}</TableCell>
                        <TableCell>{t('orders.vehicleTypes')}</TableCell>
                        <TableCell>{t('orders.paymentTermDays') || 'Splatnosť (dni)'}</TableCell>
                        <TableCell>Hodnotenie</TableCell>
                        <TableCell>{t('orders.country')}</TableCell>
                        <TableCell>{t('orders.creationDate')}</TableCell>
                        <TableCell>{t('orders.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedCarriers.map((carrier) => (
                        <TableRow key={carrier.id}>
                          <TableCell>{carrier.companyName}</TableCell>
                          <TableCell>{`${carrier.contactName} ${carrier.contactSurname}`}</TableCell>
                          <TableCell>{carrier.contactEmail}</TableCell>
                          <TableCell>{carrier.contactPhone || '-'}</TableCell>
                          <TableCell>{carrier.ico || '-'}</TableCell>
                          <TableCell>{carrier.icDph || '-'}</TableCell>
                          <TableCell>{carrier.dic || '-'}</TableCell>
                          <TableCell>{carrier.vehicleTypes?.join(', ') || '-'}</TableCell>
                          <TableCell>
                            <Chip 
                              label={`${carrier.paymentTermDays || 60} dní`}
                              color="primary"
                              size="small"
                              sx={{ 
                                backgroundColor: '#ff9f43',
                                color: '#ffffff',
                                fontWeight: 'bold'
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, height: '100%' }}>
                              <RatingIndicator 
                                rating={getCarrierAverageRating(carrier)} 
                                size="small" 
                                showChip 
                              />
                              <BareTooltip title="Pridať/upraviť hodnotenie">
                                <IconButton 
                                  onClick={() => handleOpenCarrierRating(carrier)}
                                  size="small"
                                  sx={{ 
                                    color: '#2196f3',
                                    '&:hover': { 
                                      backgroundColor: 'rgba(33, 150, 243, 0.1)' 
                                    } 
                                  }}
                                >
                                  <StarIcon fontSize="small" />
                                </IconButton>
                              </BareTooltip>
                            </Box>
                          </TableCell>
                          <TableCell>{carrier.country}</TableCell>
                          <TableCell>
                            {carrier.createdAt ? (
                              carrier.createdAt instanceof Date ? 
                                carrier.createdAt.toLocaleDateString('sk-SK', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                }) :
                                carrier.createdAt.toDate().toLocaleDateString('sk-SK', {
                                  year: 'numeric',
                                  month: '2-digit',
                                  day: '2-digit'
                                })
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <BareTooltip title={t('orders.edit')}>
                                <IconButton 
                                  onClick={() => handleEditCarrier(carrier)}
                                  sx={{ 
                                    color: '#ff9f43',
                                    '&:hover': { 
                                      backgroundColor: 'rgba(255, 159, 67, 0.1)' 
                                    } 
                                  }}
                                >
                                  <EditIcon />
                                </IconButton>
                              </BareTooltip>
                              <BareTooltip title={t('orders.delete')}>
                                <IconButton 
                                  onClick={() => carrier.id && openCarrierDeleteConfirmation(carrier.id)}
                                  sx={{ 
                                    color: '#ff6b6b',
                                    '&:hover': { 
                                      backgroundColor: 'rgba(255, 107, 107, 0.1)' 
                                    } 
                                  }}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </BareTooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    component="div"
                    count={filteredCarriers.length}
                    page={carriersPage}
                    onPageChange={(e: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => setCarriersPage(newPage)}
                    rowsPerPage={carriersRowsPerPage}
                    onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                      setCarriersRowsPerPage(parseInt(e.target.value, 10));
                      setCarriersPage(0);
                    }}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    labelRowsPerPage={t('business.rowsPerPage')}
                  />
                </TableContainer>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={handleAddLocation}
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.8)' : '#ff9f43',
                      color: '#ffffff',
                      fontWeight: 500,
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.9)' : '#f7b067',
                      }
                    }}
                  >
                    {t('orders.addLocation') || 'Pridať miesto'}
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  <TextField
                    id="search-location"
                    name="searchLocation"
                    label={t('orders.searchLocation') || 'Hľadať miesto'}
                    variant="outlined"
                    size="small"
                    value={locationSearchQuery}
                    onChange={(e) => setLocationSearchQuery(e.target.value)}
                    sx={{ flexGrow: 1, minWidth: '250px', maxWidth: '500px' }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Box>

              {isLoadingLocations ? (
                <Box display="flex" justifyContent="center" alignItems="center" mt={4} p={4}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    Načítavam miesta...
                  </Typography>
                </Box>
              ) : (
                <TableContainer 
                  component={Paper} 
                  sx={{
                      backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
                      borderRadius: '20px',
                      border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      backdropFilter: 'blur(20px)',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                      '& .MuiTableCell-root': {
                        color: isDarkMode ? '#ffffff' : '#000000',
                        borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        padding: '16px',
                        fontSize: '0.9rem',
                        whiteSpace: 'nowrap'
                      },
                      '& .MuiTableHead-root .MuiTableCell-root': {
                        fontWeight: 600,
                        backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                        borderBottom: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      },
                      '& .MuiTableBody-root .MuiTableRow-root': {
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                          transform: 'translateY(-2px)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                        }
                      }
                    }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('orders.type') || 'Typ'}</TableCell>
                        <TableCell>{t('orders.companyName') || 'Názov firmy'}</TableCell>
                        <TableCell>{t('orders.city') || 'Mesto'}</TableCell>
                        <TableCell>{t('orders.street') || 'Ulica'}</TableCell>
                        <TableCell>{t('orders.zipCode') || 'PSČ'}</TableCell>
                        <TableCell>{t('orders.country') || 'Krajina'}</TableCell>
                        <TableCell>{t('orders.contactPerson') || 'Kontaktná osoba'}</TableCell>
                        <TableCell>Telefón</TableCell>
                        <TableCell>{t('orders.usageCount') || 'Počet použití'}</TableCell>
                        <TableCell>{t('orders.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedLocations.map((location) => (
                          <TableRow key={location.id}>
                            <TableCell>
                              <Chip 
                                label={location.type === 'loading' ? 'Nakládka' : 'Vykládka'} 
                                color={location.type === 'loading' ? 'success' : 'info'}
                                size="small"
                              />
                            </TableCell>
                            <TableCell>{location.companyName || '-'}</TableCell>
                            <TableCell>{location.city}</TableCell>
                            <TableCell>{location.street || '-'}</TableCell>
                            <TableCell>{location.zip || '-'}</TableCell>
                            <TableCell>{location.country || '-'}</TableCell>
                            <TableCell>{location.contactPersonName || location.contactPerson || '-'}</TableCell>
                            <TableCell>{location.contactPersonPhone || '-'}</TableCell>
                            <TableCell>{location.usageCount || 0}</TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <BareTooltip title={t('orders.edit')}>
                                  <IconButton 
                                    onClick={() => handleEditLocation(location)}
                                    sx={{ 
                                      color: '#ff9f43',
                                      '&:hover': { 
                                        backgroundColor: 'rgba(255, 159, 67, 0.1)' 
                                      } 
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </BareTooltip>
                                <BareTooltip title={t('orders.delete')}>
                                  <IconButton 
                                    onClick={() => openLocationDeleteConfirmation(location.id)}
                                    sx={{ 
                                      color: '#ff6b6b',
                                      '&:hover': { 
                                        backgroundColor: 'rgba(255, 107, 107, 0.1)' 
                                      } 
                                    }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </BareTooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                  <TablePagination
                    component="div"
                    count={filteredLocations.length}
                    page={locationsPage}
                    onPageChange={(e: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => setLocationsPage(newPage)}
                    rowsPerPage={locationsRowsPerPage}
                    onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                      setLocationsRowsPerPage(parseInt(e.target.value, 10));
                      setLocationsPage(0);
                    }}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    labelRowsPerPage={t('business.rowsPerPage')}
                  />
                </TableContainer>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" sx={{ color: '#ff9f43', fontWeight: 600 }}>
                  {t('orders.dispatcherStats') || 'Štatistiky špeditérov'}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                  <TextField
                    id="search-dispatcher"
                    name="searchDispatcher"
                    label={t('orders.searchDispatcher') || 'Hľadať špeditéra'}
                    variant="outlined"
                    size="small"
                    value={dispatcherSearchQuery}
                    onChange={(e) => setDispatcherSearchQuery(e.target.value)}
                    sx={{ flexGrow: 1, minWidth: '250px', maxWidth: '500px' }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Box>

              {/* Filtre pre časové obdobie */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant={dispatcherFilter === 'all' ? 'contained' : 'outlined'}
                  onClick={() => setDispatcherFilter('all')}
                  sx={{
                    backgroundColor: dispatcherFilter === 'all' ? '#ff9f43' : 'transparent',
                    borderColor: '#ff9f43',
                    color: dispatcherFilter === 'all' ? '#ffffff' : '#ff9f43',
                    '&:hover': {
                      backgroundColor: dispatcherFilter === 'all' ? '#f7b067' : 'rgba(255, 159, 67, 0.1)',
                    }
                  }}
                >
                  {t('common.allOrders')}
                </Button>
                
                <Button
                  variant={dispatcherFilter === 'thisMonth' ? 'contained' : 'outlined'}
                  onClick={() => setDispatcherFilter('thisMonth')}
                  sx={{
                    backgroundColor: dispatcherFilter === 'thisMonth' ? '#ff9f43' : 'transparent',
                    borderColor: '#ff9f43',
                    color: dispatcherFilter === 'thisMonth' ? '#ffffff' : '#ff9f43',
                    '&:hover': {
                      backgroundColor: dispatcherFilter === 'thisMonth' ? '#f7b067' : 'rgba(255, 159, 67, 0.1)',
                    }
                  }}
                >
                  {t('common.thisMonth')}
                </Button>
                
                <Button
                  variant={dispatcherFilter === 'thisYear' ? 'contained' : 'outlined'}
                  onClick={() => setDispatcherFilter('thisYear')}
                  sx={{
                    backgroundColor: dispatcherFilter === 'thisYear' ? '#ff9f43' : 'transparent',
                    borderColor: '#ff9f43',
                    color: dispatcherFilter === 'thisYear' ? '#ffffff' : '#ff9f43',
                    '&:hover': {
                      backgroundColor: dispatcherFilter === 'thisYear' ? '#f7b067' : 'rgba(255, 159, 67, 0.1)',
                    }
                  }}
                >
                  {t('common.thisYear')}
                </Button>
                
                <Button
                  variant={dispatcherFilter === 'custom' ? 'contained' : 'outlined'}
                  onClick={() => setDispatcherFilter('custom')}
                  sx={{
                    backgroundColor: dispatcherFilter === 'custom' ? '#ff9f43' : 'transparent',
                    borderColor: '#ff9f43',
                    color: dispatcherFilter === 'custom' ? '#ffffff' : '#ff9f43',
                    '&:hover': {
                      backgroundColor: dispatcherFilter === 'custom' ? '#f7b067' : 'rgba(255, 159, 67, 0.1)',
                    }
                  }}
                >
                  Vlastný rozsah
                </Button>

                <Button 
                  onClick={() => { 
                    setDispatcherFilter('all'); 
                    setCustomStartDate(null); 
                    setCustomEndDate(null); 
                  }}
                  size="small"
                  sx={{ 
                    color: '#ff9f43',
                    '&:hover': { backgroundColor: 'rgba(255, 159, 67, 0.04)' }
                  }}
                >
                  {t('common.clearFilter')}
                </Button>

                {dispatcherFilter === 'custom' && (
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                      <DatePicker
                        label={t('common.from')}
                        value={customStartDate}
                        onChange={(newValue) => setCustomStartDate(newValue)}
                        slotProps={{ 
                          textField: { 
                            size: 'small',
                            sx: { minWidth: 150 }
                          }
                        }}
                      />
                      <DatePicker
                        label={t('common.to')}
                        value={customEndDate}
                        onChange={(newValue) => setCustomEndDate(newValue)}
                        slotProps={{ 
                          textField: { 
                            size: 'small',
                            sx: { minWidth: 150 }
                          }
                        }}
                      />
                    </LocalizationProvider>
                  </Box>
                )}
              </Box>

              {isLoadingDispatchers ? (
                <Box display="flex" justifyContent="center" alignItems="center" mt={4} p={4}>
                  <CircularProgress />
                  <Typography variant="body2" sx={{ ml: 2 }}>
                    Načítavam štatistiky špeditérov...
                  </Typography>
                </Box>
              ) : (
                <>
                  <TableContainer 
                    component={Paper} 
                    sx={{
                        backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
                        borderRadius: '20px',
                        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
                        '& .MuiTableCell-root': {
                          color: isDarkMode ? '#ffffff' : '#000000',
                          borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                          padding: '16px',
                          fontSize: '0.9rem',
                          whiteSpace: 'nowrap'
                        },
                        '& .MuiTableHead-root .MuiTableCell-root': {
                          fontWeight: 600,
                          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                          borderBottom: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                        },
                        '& .MuiTableBody-root .MuiTableRow-root': {
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                          }
                        }
                      }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>{t('orders.dispatcherName') || 'Meno špeditéra'}</TableCell>
                          <TableCell>{t('orders.email') || 'Email'}</TableCell>
                          <TableCell>{t('orders.totalOrders') || 'Celkom objednávok'}</TableCell>
                          <TableCell sx={{ color: '#ff9f43', fontWeight: 'bold' }}>{t('orders.totalRevenue') || 'Celkové príjmy'}</TableCell>
                          <TableCell sx={{ color: '#1976d2', fontWeight: 'bold' }}>{t('orders.totalCosts') || 'Celkové náklady'}</TableCell>
                          <TableCell sx={{ color: '#2ecc71', fontWeight: 'bold' }}>{t('orders.totalProfit') || 'Celkový zisk'}</TableCell>
                          <TableCell sx={{ color: '#9c27b0', fontWeight: 'bold' }}>{t('orders.avgProfit') || 'Priemerný zisk'}</TableCell>
                          <TableCell sx={{ color: '#e74c3c', fontWeight: 'bold' }}>{t('orders.avgProfitMargin') || 'Priemerná marža'}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedDispatchers
                          .sort((a, b) => b.totalProfit - a.totalProfit) // Zoradenie podľa zisku
                          .map((dispatcher) => (
                            <TableRow key={dispatcher.id}>
                              <TableCell>{dispatcher.name}</TableCell>
                              <TableCell>{dispatcher.email || '-'}</TableCell>
                              <TableCell>{dispatcher.totalOrders}</TableCell>
                              <TableCell sx={{ color: '#ff9f43', fontWeight: 'bold' }}>
                                {`${dispatcher.totalRevenue.toFixed(2)} €`}
                              </TableCell>
                              <TableCell sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                                {`${dispatcher.totalCosts.toFixed(2)} €`}
                              </TableCell>
                              <TableCell sx={{ 
                                color: dispatcher.totalProfit >= 0 ? '#2ecc71' : '#e74c3c', 
                                fontWeight: 'bold' 
                              }}>
                                {`${dispatcher.totalProfit.toFixed(2)} €`}
                              </TableCell>
                              <TableCell sx={{ 
                                color: dispatcher.avgProfit >= 0 ? '#9c27b0' : '#e74c3c', 
                                fontWeight: 'bold' 
                              }}>
                                {`${dispatcher.avgProfit.toFixed(2)} €`}
                              </TableCell>
                              <TableCell sx={{ 
                                color: dispatcher.avgProfitMargin >= 0 ? '#e74c3c' : '#2ecc71', 
                                fontWeight: 'bold' 
                              }}>
                                {`${dispatcher.avgProfitMargin.toFixed(2)} %`}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                    <TablePagination
                      component="div"
                      count={filteredDispatchers.length}
                      page={dispatchersPage}
                      onPageChange={(e: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => setDispatchersPage(newPage)}
                      rowsPerPage={dispatchersRowsPerPage}
                      onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                        setDispatchersRowsPerPage(parseInt(e.target.value, 10));
                        setDispatchersPage(0);
                      }}
                      rowsPerPageOptions={[10, 25, 50, 100]}
                      labelRowsPerPage={t('business.rowsPerPage')}
                    />
                  </TableContainer>

                  {/* Motivačný graf špeditérov */}
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="h6" sx={{ mb: 3, color: '#ff9f43', fontWeight: 600, textAlign: 'center' }}>
                      🏆 Výkonnostný rebríček špeditérov
                    </Typography>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexWrap: 'wrap', 
                      gap: 2, 
                      justifyContent: 'center',
                      alignItems: 'flex-end',
                      minHeight: '200px',
                      p: 2,
                      background: isDarkMode 
                        ? 'linear-gradient(135deg, rgba(28, 28, 45, 0.6) 0%, rgba(40, 40, 65, 0.8) 100%)'
                        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(240, 240, 255, 0.9) 100%)',
                      borderRadius: '20px',
                      border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                      backdropFilter: 'blur(10px)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      {/* Pozadie s dekoratívnymi prvkami */}
                      <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `radial-gradient(circle at 20% 50%, rgba(255, 159, 67, 0.1) 0%, transparent 50%), 
                                    radial-gradient(circle at 80% 20%, rgba(46, 204, 113, 0.1) 0%, transparent 50%),
                                    radial-gradient(circle at 40% 80%, rgba(52, 152, 219, 0.1) 0%, transparent 50%)`,
                        zIndex: 0
                      }} />
                      
                      {dispatchers
                        .filter(dispatcher => {
                          const searchLower = dispatcherSearchQuery.toLowerCase();
                          return (
                            dispatcher.name?.toLowerCase().includes(searchLower) ||
                            dispatcher.email?.toLowerCase().includes(searchLower)
                          );
                        })
                        .sort((a, b) => b.totalProfit - a.totalProfit)
                        .map((dispatcher, index) => {
                          // Vypočítame veľkosť karty na základe zisku (relatívne k najlepšiemu)
                          const maxProfit = Math.max(...dispatchers.map(d => d.totalProfit));
                          const minProfit = Math.min(...dispatchers.map(d => d.totalProfit));
                          const profitRange = maxProfit - minProfit;
                          
                          // Veľkosť od 80px do 160px
                          const minSize = 80;
                          const maxSize = 160;
                          const cardSize = profitRange > 0 
                            ? minSize + ((dispatcher.totalProfit - minProfit) / profitRange) * (maxSize - minSize)
                            : minSize;
                          
                          // Farby podľa pozície
                          const getCardColor = (index: number) => {
                            if (index === 0) return { bg: '#ffd700', text: '#000', emoji: '🥇' }; // Zlato
                            if (index === 1) return { bg: '#c0c0c0', text: '#000', emoji: '🥈' }; // Striebro  
                            if (index === 2) return { bg: '#cd7f32', text: '#fff', emoji: '🥉' }; // Bronz
                            return { bg: '#ff9f43', text: '#fff', emoji: '💼' }; // Ostatní
                          };
                          
                          const cardStyle = getCardColor(index);
                          
                          return (
                            <Box
                              key={dispatcher.id}
                              sx={{
                                width: `${cardSize}px`,
                                height: `${cardSize}px`,
                                borderRadius: '20px',
                                background: `linear-gradient(135deg, ${cardStyle.bg} 0%, ${cardStyle.bg}dd 100%)`,
                                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                zIndex: 1,
                                '&:hover': {
                                  transform: 'translateY(-8px) scale(1.05)',
                                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.25)',
                                  zIndex: 10
                                }
                              }}
                            >
                              {/* Pozícia badge */}
                              <Box sx={{
                                position: 'absolute',
                                top: '-8px',
                                right: '-8px',
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                background: isDarkMode ? 'rgba(28, 28, 45, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: 'bold',
                                color: isDarkMode ? '#ffffff' : '#000000',
                                border: `2px solid ${cardStyle.bg}`
                              }}>
                                #{index + 1}
                              </Box>
                              
                              {/* Emoji a meno */}
                              <Box sx={{ textAlign: 'center', color: cardStyle.text }}>
                                <Typography sx={{ fontSize: `${Math.max(20, cardSize * 0.15)}px`, mb: 0.5 }}>
                                  {cardStyle.emoji}
                                </Typography>
                                <Typography sx={{ 
                                  fontSize: `${Math.max(10, cardSize * 0.08)}px`, 
                                  fontWeight: 'bold',
                                  lineHeight: 1.2,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  maxWidth: `${cardSize - 20}px`
                                }}>
                                  {dispatcher.name}
                                </Typography>
                                
                                {/* Zisk */}
                                <Typography sx={{ 
                                  fontSize: `${Math.max(8, cardSize * 0.06)}px`, 
                                  fontWeight: 600,
                                  mt: 0.5,
                                  opacity: 0.9
                                }}>
                                  {dispatcher.totalProfit.toFixed(0)} €
                                </Typography>
                                
                                {/* Marža */}
                                <Typography sx={{ 
                                  fontSize: `${Math.max(6, cardSize * 0.05)}px`, 
                                  fontWeight: 500,
                                  opacity: 0.8
                                }}>
                                  {dispatcher.avgProfitMargin.toFixed(1)}%
                                </Typography>
                              </Box>
                              
                              {/* Efekt lesku */}
                              <Box sx={{
                                position: 'absolute',
                                top: '10%',
                                left: '10%',
                                right: '60%',
                                bottom: '60%',
                                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%)',
                                borderRadius: '20px',
                                pointerEvents: 'none'
                              }} />
                            </Box>
                          );
                        })}
                    </Box>
                    
                    {/* Legenda */}
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Typography variant="body2" sx={{ 
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
                        fontSize: '0.75rem'
                      }}>
                        💡 Veľkosť karty = výška zisku | Pozícia = celkový výkon | Hover pre detail
                      </Typography>
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          </TabPanel>
        </Box>
      </StyledPaper>



      {/* Dialog pre mazanie OBJEDNÁVKY */}
      <Dialog
        open={showDeleteConfirm}
        onClose={handleDeleteCancel}
        aria-labelledby="confirm-order-delete-title"
        aria-describedby="confirm-order-delete-description"
        PaperProps={{
          sx: {
            background: 'none',
            boxShadow: 'none',
            margin: { xs: '8px', sm: '16px' },
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
        <Box sx={{
            backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000',
            padding: '0px',
            borderRadius: '24px',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minWidth: '400px',
            maxWidth: '500px'
         }}>
          <DialogTitle id="confirm-order-delete-title" 
            sx={{ 
              padding: '24px 24px 16px 24px',
              fontSize: '1.25rem',
              fontWeight: 600
            }}
          >
            📋 {t('common.confirmDelete')}
          </DialogTitle>
          <DialogContent 
            data-delete-dialog="true"
            sx={{ 
              padding: '0 24px 16px 24px !important'
            }}>
            <Typography
              sx={{
                textAlign: 'left !important',
                display: 'block !important',
                lineHeight: 1.6,
                fontSize: '0.95rem',
                color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                margin: '0 !important',
                paddingLeft: '0 !important',
                paddingRight: '0 !important',
                paddingTop: '0 !important',
                paddingBottom: '0 !important'
              }}
            >
              {t('orders.deleteConfirmation') || 'Naozaj chcete vymazať túto objednávku? Táto akcia je nenávratná.'}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ 
            padding: '0 24px 20px 24px',
            justifyContent: 'space-between'
          }}>
            <Button 
              onClick={handleDeleteCancel} 
              variant="outlined"
              sx={{ 
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                color: isDarkMode ? '#ffffff' : '#000000',
                fontWeight: 600,
                borderRadius: '12px',
                paddingX: 3,
                paddingY: 1.2,
                '&:hover': {
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleDeleteConfirmed} 
              variant="contained"
              disabled={loading}
              autoFocus
              sx={{ 
                backgroundColor: '#f44336',
                color: '#ffffff',
                fontWeight: 600,
                borderRadius: '12px',
                paddingX: 3,
                paddingY: 1.2,
                '&:hover': {
                  backgroundColor: '#d32f2f'
                }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : t('common.confirmDelete')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={showPdfPreview}
        onClose={() => {
            setShowPdfPreview(false);
            if (pdfUrl) {
                URL.revokeObjectURL(pdfUrl);
                setPdfUrl(null);
            }
        }}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            background: 'none',
            boxShadow: 'none',
            margin: {
              xs: '8px',
              sm: '16px'
            },
            maxHeight: '95vh',
            height: '95vh',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)'
          }
        }}
      >
        <Box
          sx={{
            backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
            borderRadius: '12px',
            padding: '16px',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            color: isDarkMode ? '#ffffff' : '#000000',
            maxWidth: '1400px',
            maxHeight: '95vh'
          }}
        >
          {/* Header */}
          <Box sx={{ 
            p: 0, 
            mb: 2, 
            fontWeight: 700, 
            color: isDarkMode ? '#ffffff' : '#000000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            minHeight: '40px'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <VisibilityIcon sx={{ color: '#ff9f43', fontSize: '1.2rem' }} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
                {t('orders.pdfPreviewTitle') || 'Náhľad PDF objednávky'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              {pdfUrl && (
                <BareTooltip title={t('orders.downloadPDF') || 'Stiahnuť PDF'}>
                  <IconButton 
                    size="small"
                    onClick={() => {
                      if (pdfUrl) {
                        const a = document.createElement('a');
                        a.href = pdfUrl;
                        a.download = `order_${(previewOrder as any)?.orderNumberFormatted || previewOrder?.id?.substring(0, 8) || 'preview'}.pdf`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                      }
                    }}
                    sx={{ 
                      color: '#4caf50',
                      '&:hover': { backgroundColor: 'rgba(76, 175, 80, 0.1)' }
                    }}
                  >
                    <FileDownloadIcon fontSize="small" />
                  </IconButton>
                </BareTooltip>
              )}
              <IconButton 
                size="small"
                onClick={() => {
                  setShowPdfPreview(false);
                  if (pdfUrl) {
                    URL.revokeObjectURL(pdfUrl);
                    setPdfUrl(null);
                  }
                }}
                edge="end" 
                aria-label="close"
                sx={{
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          
          <Divider sx={{ mb: 2, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', flexShrink: 0 }} />

          {/* Content */}
          <Box sx={{ 
            flex: 1,
            overflow: 'hidden',
            borderRadius: '8px',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            minHeight: '0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {loadingPdf ? (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                width: '100%',
                p: 3
              }}>
                <CircularProgress size={60} sx={{ mb: 2, color: '#ff9f43' }} />
                <Typography variant="h6" sx={{ mb: 1, color: isDarkMode ? '#ffffff' : '#000000' }}>
                  {t('orders.loadingPdf') || 'Načítavam PDF...'}
                </Typography>
                <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}>
                  {t('orders.processingTime') || 'Prosím čakajte, generuje sa náhľad...'}
                </Typography>
              </Box>
            ) : pdfUrl ? (
              <iframe 
                src={`${pdfUrl}#zoom=100&view=FitH&pagemode=none&toolbar=1&navpanes=0`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  border: 'none',
                  borderRadius: '8px',
                  minHeight: '75vh'
                }}
                title="PDF preview"
              />
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                width: '100%',
                flexDirection: 'column',
                gap: 2
              }}>
                <Typography variant="h6" sx={{ color: '#e74c3c' }}>
                  {t('orders.pdfLoadError') || 'Chyba pri načítaní PDF'}
                </Typography>
                <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}>
                  Skúste to znovu alebo kontaktujte podporu.
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Dialog>

    <CustomerForm
      open={showCustomerForm}
      onClose={() => {
        setShowCustomerForm(false);
        setSelectedCustomerForEdit(null);
      }}
      onSubmit={handleCustomerSubmit}
      editCustomer={selectedCustomerForEdit ? {
        companyName: selectedCustomerForEdit.company || (selectedCustomerForEdit as any).companyName || '', // Mapujeme company alebo companyName na companyName pre CustomerForm
        street: selectedCustomerForEdit.street,
        city: selectedCustomerForEdit.city,
        zip: selectedCustomerForEdit.zip,
        country: selectedCustomerForEdit.country,
        contactName: selectedCustomerForEdit.contactName,
        contactSurname: selectedCustomerForEdit.contactSurname,
        contactEmail: selectedCustomerForEdit.email || (selectedCustomerForEdit as any).contactEmail || '', // Mapujeme email alebo contactEmail na contactEmail pre CustomerForm
        contactPhonePrefix: selectedCustomerForEdit.contactPhonePrefix || '+421',
        contactPhone: selectedCustomerForEdit.contactPhone || '',
        ico: selectedCustomerForEdit.ico,
        dic: selectedCustomerForEdit.dic,
        icDph: selectedCustomerForEdit.vatId || (selectedCustomerForEdit as any).icDph || '', // Mapujeme vatId alebo icDph na icDph pre CustomerForm
        paymentTermDays: selectedCustomerForEdit.paymentTermDays || 30
      } : undefined}
    />

    {/* Formulár pre dopravcov */}
    <Dialog
      open={showCarrierForm}
      onClose={() => {
        setShowCarrierForm(false);
        setSelectedCarrierForEdit(null);
      }}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'none',
          boxShadow: 'none',
          margin: {
            xs: '8px',
            sm: '16px'
          },
          maxHeight: '90vh',
          overflow: 'hidden'
        }
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }
      }}
    >
      <Box
        sx={{
          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '900px',
          width: '100%',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          color: isDarkMode ? '#ffffff' : '#000000',
        }}
      >
        <Box sx={{ 
          p: 0, 
          mb: 3, 
          fontWeight: 700, 
          color: isDarkMode ? '#ffffff' : '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShippingIcon sx={{ color: '#ff9f43' }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {selectedCarrierForEdit ? 'Upraviť dopravcu' : t('orders.addCarrier')}
            </Typography>
          </Box>
          <IconButton 
            onClick={() => {
              setShowCarrierForm(false);
              setSelectedCarrierForEdit(null);
            }} 
            edge="end" 
            aria-label="close"
            sx={{
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.5)',
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        <Divider sx={{ mb: 3, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', flexShrink: 0 }} />

        <DialogContent sx={{ 
          p: 0, 
          mb: 3, 
          overflow: 'auto',
          flex: 1,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            borderRadius: '8px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
            }
          }
        }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
              {t('orders.carrierInfo')}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('orders.companyName')}
              name="companyName"
              value={carrierFormData.companyName}
              onChange={handleCarrierFormChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('orders.street')}
              name="street"
              value={carrierFormData.street}
              onChange={handleCarrierFormChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('orders.city')}
              name="city"
              value={carrierFormData.city}
              onChange={handleCarrierFormChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('orders.zipCode')}
              name="zip"
              value={carrierFormData.zip}
              onChange={handleCarrierFormChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              select
              label={t('orders.country')}
              name="country"
              value={carrierFormData.country}
              onChange={handleCarrierFormChange}
              SelectProps={{
                native: true,
              }}
              required
            >
              {countries.map((country) => (
                <option key={country.code} value={country.name}>
                  {country.name}
                </option>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
              {t('orders.taxInfo')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label={t('orders.ico')}
              name="ico"
              value={carrierFormData.ico}
              onChange={handleCarrierFormChange}
              helperText={t('orders.businessId')}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label={t('orders.dic')}
              name="dic"
              value={carrierFormData.dic}
              onChange={handleCarrierFormChange}
              helperText={t('orders.taxId')}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label={t('orders.icDph')}
              name="icDph"
              value={carrierFormData.icDph}
              onChange={handleCarrierFormChange}
              helperText={t('orders.vatIdDescription')}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
              {t('orders.contactPerson')}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('orders.firstName')}
              name="contactName"
              value={carrierFormData.contactName}
              onChange={handleCarrierFormChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('orders.lastName')}
              name="contactSurname"
              value={carrierFormData.contactSurname}
              onChange={handleCarrierFormChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('orders.email')}
              name="contactEmail"
              type="email"
              value={carrierFormData.contactEmail}
              onChange={handleCarrierFormChange}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('orders.phone')}
              name="contactPhone"
              type="tel"
              value={carrierFormData.contactPhone}
              onChange={handleCarrierFormChange}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" sx={{ mt: 2, mb: 2, color: theme.palette.mode === 'dark' ? '#ff9f43' : '#ff9f43' }}>
              {t('orders.additionalInfo')}
            </Typography>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('orders.vehicleTypes')}
              name="vehicleTypes"
              placeholder={t('orders.vehicleTypesPlaceholder')}
              value={carrierFormData.vehicleTypes}
              onChange={handleCarrierFormChange}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={t('orders.paymentTermDays') || 'Splatnosť (dni)'}
              name="paymentTermDays"
              type="number"
              value={carrierFormData.paymentTermDays}
              onChange={handleCarrierFormChange}
              helperText={t('orders.paymentTermDaysHelper') || 'Počet dní na úhradu faktúry (default: 60)'}
              inputProps={{ min: 1, max: 365 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            {/* Prázdny grid item pre zachovanie layoutu */}
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label={t('orders.notes')}
              name="notes"
              value={carrierFormData.notes}
              onChange={handleCarrierFormChange}
              multiline
              rows={3}
            />
          </Grid>
        </Grid>
        </DialogContent>
        
        <DialogActions sx={{ p: 0, flexShrink: 0 }}>
          <Button 
            onClick={() => {
              setShowCarrierForm(false);
              setSelectedCarrierForEdit(null);
            }} 
            sx={{ 
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
              '&:hover': { backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)' }
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={() => _handleCarrierSubmit(carrierFormData)} 
            variant="contained" 
            sx={{ 
              backgroundColor: '#ff9f43',
              color: '#ffffff',
              '&:hover': { 
                backgroundColor: '#f7b067',
              } 
            }}
          >
            {selectedCarrierForEdit ? 'Aktualizovať' : t('common.save')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>

    {/* Potvrdzovací dialóg pre vymazanie ZÁKAZNÍKA */}
    <Dialog
        open={showCustomerDeleteConfirm}
        onClose={handleCustomerDeleteCancel}
        aria-labelledby="confirm-customer-delete-title"
        aria-describedby="confirm-customer-delete-description"
        PaperProps={{
          sx: {
            background: 'none',
            boxShadow: 'none',
            margin: { xs: '8px', sm: '16px' },
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
        <Box sx={{
            backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000',
            padding: '0px',
            borderRadius: '24px',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minWidth: '400px',
            maxWidth: '500px'
         }}>
          <DialogTitle id="confirm-customer-delete-title" 
            sx={{ 
              padding: '24px 24px 16px 24px',
              fontSize: '1.25rem',
              fontWeight: 600
            }}
          >
            🗑️ {t('common.confirmDelete')}
          </DialogTitle>
          <DialogContent 
            data-delete-dialog="true"
            sx={{ 
              padding: '0 24px 16px 24px !important'
            }}>
            <Typography
              sx={{
                textAlign: 'left !important',
                display: 'block !important',
                lineHeight: 1.6,
                fontSize: '0.95rem',
                color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                margin: '0 !important',
                paddingLeft: '0 !important',
                paddingRight: '0 !important',
                paddingTop: '0 !important',
                paddingBottom: '0 !important'
              }}
            >
              {t('orders.deleteCustomerConfirmation') || 'Naozaj chcete vymazať tohto zákazníka? Táto akcia je nenávratná.'}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ 
            padding: '0 24px 20px 24px',
            justifyContent: 'space-between'
          }}>
            <Button 
              onClick={handleCustomerDeleteCancel} 
              variant="outlined"
              sx={{ 
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                color: isDarkMode ? '#ffffff' : '#000000',
                fontWeight: 600,
                borderRadius: '12px',
                paddingX: 3,
                paddingY: 1.2,
                '&:hover': {
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleCustomerDeleteConfirmed} 
              variant="contained"
              disabled={loading}
              autoFocus
              sx={{ 
                backgroundColor: '#f44336',
                color: '#ffffff',
                fontWeight: 600,
                borderRadius: '12px',
                paddingX: 3,
                paddingY: 1.2,
                '&:hover': {
                  backgroundColor: '#d32f2f'
                }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : t('common.confirmDelete')}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

    {/* Potvrdzovací dialóg pre vymazanie DOPRAVCU */}
    <Dialog
        open={showCarrierDeleteConfirm}
        onClose={handleCarrierDeleteCancel}
        aria-labelledby="confirm-carrier-delete-title"
        aria-describedby="confirm-carrier-delete-description"
        PaperProps={{
          sx: {
            background: 'none',
            boxShadow: 'none',
            margin: { xs: '8px', sm: '16px' },
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
        <Box sx={{
            backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000',
            padding: '0px',
            borderRadius: '24px',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            minWidth: '400px',
            maxWidth: '500px'
         }}>
          <DialogTitle id="confirm-carrier-delete-title" 
            sx={{ 
              padding: '24px 24px 16px 24px',
              fontSize: '1.25rem',
              fontWeight: 600
            }}
          >
            🚛 {t('common.confirmDelete')}
          </DialogTitle>
          <DialogContent 
            data-delete-dialog="true"
            sx={{ 
              padding: '0 24px 16px 24px !important'
            }}>
            <Typography
              sx={{
                textAlign: 'left !important',
                display: 'block !important',
                lineHeight: 1.6,
                fontSize: '0.95rem',
                color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
                margin: '0 !important',
                paddingLeft: '0 !important',
                paddingRight: '0 !important',
                paddingTop: '0 !important',
                paddingBottom: '0 !important'
              }}
            >
              {t('orders.deleteCarrierConfirmation') || 'Naozaj chcete vymazať tohto dopravcu? Táto akcia je nenávratná.'}
            </Typography>
          </DialogContent>
          <DialogActions sx={{ 
            padding: '0 24px 20px 24px',
            justifyContent: 'space-between'
          }}>
            <Button 
              onClick={handleCarrierDeleteCancel} 
              variant="outlined"
              sx={{ 
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                color: isDarkMode ? '#ffffff' : '#000000',
                fontWeight: 600,
                borderRadius: '12px',
                paddingX: 3,
                paddingY: 1.2,
                '&:hover': {
                  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                }
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              onClick={handleCarrierDeleteConfirmed} 
              variant="contained"
              disabled={loading}
              autoFocus
              sx={{ 
                backgroundColor: '#f44336',
                color: '#ffffff',
                fontWeight: 600,
                borderRadius: '12px',
                paddingX: 3,
                paddingY: 1.2,
                '&:hover': {
                  backgroundColor: '#d32f2f'
                }
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : t('common.confirmDelete')}
            </Button>
          </DialogActions>
        </Box>
    </Dialog>

    <OrderDetail 
      open={detailDialogOpen}
      onClose={handleCloseDetail}
      order={selectedOrder}
    />

    {/* New Order Wizard */}
    <NewOrderWizard
      open={showNewOrderWizard}
      onClose={handleCloseNewOrderForm}
      isEdit={isEditMode}
      orderData={selectedOrder || undefined}
      onOrderSaved={() => {
        // Callback po úspešnom uložení objednávky
        if (userData?.companyID && Object.keys(teamMembers).length > 0) {
          console.log("📊 Callback: Obnova štatistík špeditérov po uložení");
          calculateDispatcherStats();
        }
      }}
    />

    <LocationForm
      open={showLocationForm}
      onClose={() => {
        setShowLocationForm(false);
        setSelectedLocationForEdit(null);
      }}
      onSubmit={handleLocationSubmit}
      editLocation={selectedLocationForEdit}
    />

    {/* Potvrdzovací dialóg pre vymazanie MIESTA */}
    <Dialog
      open={showLocationDeleteConfirm}
      onClose={handleLocationDeleteCancel}
      aria-labelledby="confirm-location-delete-title"
      aria-describedby="confirm-location-delete-description"
      PaperProps={{
        sx: {
          background: 'none',
          boxShadow: 'none',
          margin: { xs: '8px', sm: '16px' },
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
      <Box sx={{
          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
          color: isDarkMode ? '#ffffff' : '#000000',
          padding: '0px',
          borderRadius: '24px',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minWidth: '400px',
          maxWidth: '500px'
       }}>
        <DialogTitle id="confirm-location-delete-title" 
          sx={{ 
            padding: '24px 24px 16px 24px',
            fontSize: '1.25rem',
            fontWeight: 600
          }}
        >
          📍 {t('common.confirmDelete')}
        </DialogTitle>
        <DialogContent 
          data-delete-dialog="true"
          sx={{ 
            padding: '0 24px 16px 24px !important'
          }}>
          <Typography
            sx={{
              textAlign: 'left !important',
              display: 'block !important',
              lineHeight: 1.6,
              fontSize: '0.95rem',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
              margin: '0 !important',
              paddingLeft: '0 !important',
              paddingRight: '0 !important',
              paddingTop: '0 !important',
              paddingBottom: '0 !important'
            }}
          >
            {t('orders.deleteLocationConfirmation') || 'Ste si istý, že chcete vymazať toto miesto? Táto akcia je nenávratná.'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          padding: '0 24px 20px 24px',
          justifyContent: 'space-between'
        }}>
          <Button 
            onClick={handleLocationDeleteCancel} 
            variant="outlined"
            sx={{ 
              borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
              color: isDarkMode ? '#ffffff' : '#000000',
              fontWeight: 600,
              borderRadius: '12px',
              paddingX: 3,
              paddingY: 1.2,
              '&:hover': {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
              }
            }}
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleLocationDeleteConfirmed} 
            variant="contained"
            disabled={loading}
            autoFocus
            sx={{ 
              backgroundColor: '#f44336',
              color: '#ffffff',
              fontWeight: 600,
              borderRadius: '12px',
              paddingX: 3,
              paddingY: 1.2,
              '&:hover': {
                backgroundColor: '#d32f2f'
              }
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : t('common.confirmDelete')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>

    {/* Dialógy pre hodnotenie */}
    {selectedCustomerForRating && (
      <CustomerRatingDialog
        open={showCustomerRatingDialog}
        onClose={handleCloseCustomerRating}
        customer={selectedCustomerForRating}
        onSubmit={handleSubmitCustomerRating}
      />
    )}

    {selectedCarrierForRating && (
      <CarrierRatingDialog
        open={showCarrierRatingDialog}
        onClose={handleCloseCarrierRating}
        carrier={selectedCarrierForRating}
        onSubmit={handleSubmitCarrierRating}
      />
    )}

    {selectedOrderForRating && (
      <OrderRatingDialog
        open={showOrderRatingDialog}
        onClose={handleCloseOrderRating}
        order={selectedOrderForRating}
        onSubmit={handleSubmitOrderRating}
      />
    )}

    {/* Language Selector Menu */}
    <LanguageSelector
      open={showLanguageMenu}
      anchorEl={languageMenuAnchor}
      onClose={handleCloseLanguageMenu}
      onLanguageSelect={handleLanguageSelect}
    />

    {/* PDF Loading Dialog */}
    <Dialog
      open={showPdfLoadingDialog}
      PaperProps={{
        sx: { 
          background: 'none', 
          boxShadow: 'none', 
          margin: { xs: '8px', sm: '16px' }, 
          borderRadius: '24px',
          minWidth: '320px'
        }
      }}
      BackdropProps={{
        sx: { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0, 0, 0, 0.6)' }
      }}
    >
      <Box
        sx={{
          background: isDarkMode 
            ? 'linear-gradient(135deg, rgba(28, 28, 45, 0.95) 0%, rgba(42, 42, 75, 0.95) 100%)' 
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.95) 100%)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          padding: '32px',
          textAlign: 'center',
          minHeight: '200px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '24px'
        }}
      >
        <CircularProgress 
          size={48} 
          sx={{ 
            color: '#ff9f43',
            '& .MuiCircularProgress-circle': {
              strokeLinecap: 'round',
            }
          }} 
        />
        <Typography 
          variant="h6" 
          sx={{ 
            color: isDarkMode ? '#ffffff' : '#000000',
            fontWeight: 600,
            fontSize: '1.1rem'
          }}
        >
          {pdfLoadingMessage}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
            fontSize: '0.9rem'
          }}
        >
          Prosím čakajte, generujeme váš dokument...
        </Typography>
      </Box>
    </Dialog>
    </PageWrapper>
  );
};

function OrdersForm() {
  return <OrdersList />;
}

export default OrdersForm; 
