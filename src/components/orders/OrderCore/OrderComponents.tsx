import React from 'react';
import { 
  Box, 
  Typography, 
  TableCell, 
  TableRow, 
  IconButton,
  styled,
} from '@mui/material';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import StarIcon from '@mui/icons-material/Star';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import InfoIcon from '@mui/icons-material/Info';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Tooltip from '@mui/material/Tooltip';
import { OrderFormData as BaseOrderFormData, LoadingPlace, UnloadingPlace, OrderRating } from '../../../types/orders';
import DocumentManager from '../DocumentManager';
import DocumentsIndicator from '../DocumentsIndicator';
import BareTooltip from '../../common/BareTooltip';

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
  shouldForwardProp: (prop) => prop !== 'isDarkMode' && prop !== 'isSelected',
})<{ isDarkMode: boolean; isSelected?: boolean }>(({ isDarkMode, isSelected }) => ({
  transition: 'all 0.2s ease-in-out',
  cursor: 'pointer',
  backgroundColor: isSelected 
    ? (isDarkMode ? 'rgba(255, 159, 67, 0.15)' : 'rgba(255, 159, 67, 0.1)')
    : 'transparent',
  border: isSelected 
    ? `2px solid #ff9f43`
    : 'none',
  '&:hover': {
    backgroundColor: isSelected
      ? (isDarkMode ? 'rgba(255, 159, 67, 0.25) !important' : 'rgba(255, 159, 67, 0.18) !important')
      : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
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
  isSelected: boolean;
  onRowClick: (order: OrderFormData) => void;
  onShowDetail: (order: OrderFormData) => void;
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
  isSelected,
  onRowClick,
  onShowDetail,
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
      isSelected={isSelected}
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
                      <StyledTableCell isDarkMode={isDarkMode}>
                  {(() => {
                    const date = order.loadingPlaces?.[0]?.dateTime ? convertToDate(order.loadingPlaces[0].dateTime) : null;
                    return date ? format(date, 'dd.MM.yyyy HH:mm') : '-';
                  })()}
                </StyledTableCell>
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
                      <StyledTableCell isDarkMode={isDarkMode}>
                  {(() => {
                    const date = order.unloadingPlaces?.[0]?.dateTime ? convertToDate(order.unloadingPlaces[0].dateTime) : null;
                    return date ? format(date, 'dd.MM.yyyy HH:mm') : '-';
                  })()}
                </StyledTableCell>
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
                      <StyledTableCell isDarkMode={isDarkMode}>
                  {(() => {
                    const date = order.createdAt ? convertToDate(order.createdAt) : null;
                    return date ? format(date, 'dd.MM.yyyy HH:mm') : 'N/A';
                  })()}
                </StyledTableCell>
      <StyledTableCell isDarkMode={isDarkMode}> {/* Akcie */} 
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <BareTooltip title="Detail objednávky" placement="bottom">
            <IconButton onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); onShowDetail(order); }} sx={{ color: '#2196f3' }}>
              <InfoIcon fontSize="small"/>
            </IconButton>
          </BareTooltip>
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
  if (prevProps.isSelected !== nextProps.isSelected) return false;
  
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

export {
  TabPanel,
  convertToDate,
  RatingIndicator,
  DialogGlobalStyles,
  StyledTableRow,
  StyledTableCell,
  SortableTableCell,
  OrderRow
};

export type {
  OrderFormData,
  TabPanelProps,
  SortableTableCellProps,
  OrderRowProps
}; 