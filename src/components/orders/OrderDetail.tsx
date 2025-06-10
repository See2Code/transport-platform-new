import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  Paper,
  styled,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell
} from '@mui/material';
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  LocalShipping as LocalShippingIcon,
  Inventory as InventoryIcon,
  AccessTime as AccessTimeIcon,
  LocationOn as LocationOnIcon,
  Euro as EuroIcon,
  Notes as NotesIcon,
  Edit as EditIcon,
  Star as StarIcon
} from '@mui/icons-material';
import { useThemeMode } from '../../contexts/ThemeContext';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { OrderFormData } from '../../types/orders';
import { countries } from '../../constants/countries';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Carrier } from '../../types/carriers';

const StyledDialogContent = styled(DialogContent)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  borderRadius: '12px',
  padding: '24px',
  maxWidth: '900px',
  width: '100%',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
}));

const InfoSection = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3),
}));

const SectionTitle = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1.1rem',
  fontWeight: 600,
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: isDarkMode ? '#ffffff' : '#000000',
  '& .MuiSvgIcon-root': {
    color: '#ff9f43',
  }
}));

const InfoItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  marginBottom: theme.spacing(1),
}));

const InfoLabel = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontWeight: 600,
  minWidth: '160px',
  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
}));

const InfoValue = styled(Typography, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  color: isDarkMode ? '#ffffff' : '#000000',
  wordBreak: 'break-word',
  '& p': {
    margin: 0,
    display: 'inline',
  }
}));

const StyledPaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(37, 37, 56, 0.7)' : 'rgba(255, 255, 255, 0.7)',
  padding: '16px',
  borderRadius: '8px',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  height: '100%',
}));

const StyledTableCell = styled(TableCell, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  color: isDarkMode ? '#ffffff' : '#000000',
  borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  padding: '8px 16px',
}));

interface OrderDetailProps {
  open: boolean;
  onClose: () => void;
  order: OrderFormData | null;
}

function formatDate(date: Date | Timestamp | null | undefined) {
  if (!date) return '-';
  
  let dateObj: Date;
  if (date instanceof Timestamp) {
    dateObj = date.toDate();
  } else {
    dateObj = date;
  }
  
  return format(dateObj, 'dd.MM.yyyy HH:mm', { locale: sk });
}

// Komponent pre zobrazenie hodnotenia
const RatingIndicator = ({ rating, size }: { rating: number; size?: string }) => {
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return '#2ecc71'; // Zelená
    if (rating >= 3.5) return '#ff9f43'; // Oranžová
    if (rating >= 2) return '#e74c3c'; // Červená
    return '#95a5a6'; // Sivá
  };

  const getRatingText = (rating: number) => {
    if (rating >= 4.5) return 'Výborné';
    if (rating >= 3.5) return 'Dobré';
    if (rating >= 2) return 'Slabé';
    return 'Veľmi slabé';
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      <StarIcon 
        sx={{ 
          color: getRatingColor(rating), 
          fontSize: size === 'small' ? '1rem' : '1.2rem' 
        }} 
      />
      <span 
        style={{ 
          color: getRatingColor(rating), 
          fontWeight: 'bold',
          fontSize: size === 'small' ? '0.75rem' : '0.875rem'
        }}
      >
        {rating > 0 ? `${rating.toFixed(1)} (${getRatingText(rating)})` : 'Bez hodnotenia'}
      </span>
    </Box>
  );
};

const OrderDetail: React.FC<OrderDetailProps> = ({ open, onClose, order }) => {
  const { isDarkMode } = useThemeMode();
  const { userData } = useAuth();
  const [enhancedOrder, setEnhancedOrder] = useState<OrderFormData | null>(null);

  // Doplnenie údajov dopravcu ak chýbajú
  useEffect(() => {
    const fetchCompleteCarrierData = async () => {
      if (!order || !order.carrierCompany || !userData?.companyID) {
        setEnhancedOrder(order);
        return;
      }

      // Ak má objednávka dopravcu, ale chýbajú detaily
      if (!order.carrierEmail || !order.carrierPhone || !order.carrierCountry) {
        try {
          // Načítame dopravcu z databázy
          const carriersQuery = query(
            collection(db, 'carriers'),
            where('companyID', '==', userData.companyID),
            where('companyName', '==', order.carrierCompany)
          );
          
          const carriersSnapshot = await getDocs(carriersQuery);
          
          if (!carriersSnapshot.empty) {
            const carrierDoc = carriersSnapshot.docs[0];
            const carrierData = carrierDoc.data() as Carrier;
            

            
            // Vypočítame priemerné hodnotenie dopravcu
            const getCarrierAverageRating = (carrier: Carrier): number => {
              if (!carrier.rating) return 0;
              const { reliability, communication, serviceQuality, timeManagement } = carrier.rating;
              if (reliability === 0 && communication === 0 && serviceQuality === 0 && timeManagement === 0) return 0;
              return Math.round((reliability + communication + serviceQuality + timeManagement) / 4);
            };

            // Vytvoríme rozšírenú objednávku s kompletými údajmi dopravcu
            const enhanced = {
              ...order,
              carrierEmail: order.carrierEmail || carrierData.contactEmail || '',
              carrierPhone: order.carrierPhone || carrierData.contactPhone || '',
              carrierIco: order.carrierIco || carrierData.ico || '',
              carrierDic: order.carrierDic || carrierData.dic || '',
              carrierIcDph: order.carrierIcDph || carrierData.icDph || '',
              carrierStreet: order.carrierStreet || carrierData.street || '',
              carrierCity: order.carrierCity || carrierData.city || '',
              carrierZip: order.carrierZip || carrierData.zip || '',
              carrierCountry: order.carrierCountry || carrierData.country || 'Slovensko',
              carrierVehicleTypes: order.carrierVehicleTypes || carrierData.vehicleTypes || [],
              carrierNotes: order.carrierNotes || carrierData.notes || '',
              carrierRating: order.carrierRating || getCarrierAverageRating(carrierData),
              carrierContact: order.carrierContact || `${carrierData.contactName} ${carrierData.contactSurname}`.trim() || '',
            };
            
            setEnhancedOrder(enhanced);

          } else {
            setEnhancedOrder(order);
          }
        } catch (error) {
          console.error('❌ Chyba pri načítaní údajov dopravcu:', error);
          setEnhancedOrder(order);
        }
      } else {
        setEnhancedOrder(order);
      }
    };

    if (open && order) {
      fetchCompleteCarrierData();
    }
  }, [open, order, userData?.companyID]);

  // Použijeme enhancedOrder namiesto order v celom komponente
  const displayOrder = enhancedOrder || order;
  
  if (!displayOrder) return null;

  // Vypočítame zisk
  const customerPrice = parseFloat(displayOrder.customerPrice || displayOrder.suma || '0');
  const carrierPrice = parseFloat(displayOrder.carrierPrice || '0');
  const profit = !isNaN(customerPrice) && !isNaN(carrierPrice) ? customerPrice - carrierPrice : 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background: 'none',
          boxShadow: 'none',
          margin: {
            xs: '8px',
            sm: '16px'
          }
        }
      }}
      BackdropProps={{
        sx: {
          backdropFilter: 'blur(10px)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }
      }}
    >
      <StyledDialogContent isDarkMode={isDarkMode}>
        <DialogTitle sx={{ 
          p: 0, 
          mb: 3, 
          fontWeight: 700, 
          color: isDarkMode ? '#ffffff' : '#000000',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <BusinessIcon sx={{ color: '#ff9f43' }} />
          Detail objednávky č. {displayOrder.orderNumberFormatted || 'N/A'}
        </DialogTitle>

        <Divider sx={{ mb: 3, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />

        <Grid container spacing={3}>
          {/* Zákazník - kompletné údaje */}
          <Grid item xs={12} md={6}>
            <StyledPaper isDarkMode={isDarkMode}>
              <SectionTitle isDarkMode={isDarkMode}>
                <BusinessIcon />
                Zákazník
              </SectionTitle>
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Spoločnosť:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode}>{(displayOrder.zakaznik || displayOrder.customerCompany) || '-'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Kontaktná osoba:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode}>
                  {(displayOrder.kontaktnaOsoba || `${displayOrder.customerContactName || ''} ${displayOrder.customerContactSurname || ''}`).trim() || '-'}
                </InfoValue>
              </InfoItem>
              {displayOrder.customerEmail && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Email:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>{displayOrder.customerEmail}</InfoValue>
                </InfoItem>
              )}
              {displayOrder.customerPhone && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Telefón:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {displayOrder.customerPhone.startsWith('+') && (
                        <>
                          <img 
                            loading="lazy" 
                            width="20" 
                            height="15"
                            src={`https://flagcdn.com/${(countries.find(c => displayOrder.customerPhone?.startsWith(c.prefix))?.code || 'sk').toLowerCase()}.svg`} 
                            alt="Vlajka krajiny" 
                            style={{ borderRadius: '2px', objectFit: 'cover' }}
                          />
                          <span>{displayOrder.customerPhone}</span>
                        </>
                      )}
                      {!displayOrder.customerPhone.startsWith('+') && (
                        <span>{displayOrder.customerPhone}</span>
                      )}
                    </Box>
                  </InfoValue>
                </InfoItem>
              )}
              {(displayOrder as any).customerIco && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>IČO:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>{(displayOrder as any).customerIco}</InfoValue>
                </InfoItem>
              )}
              {displayOrder.customerVatId && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>IČ DPH:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>{displayOrder.customerVatId}</InfoValue>
                </InfoItem>
              )}
              {(displayOrder as any).customerDic && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>DIČ:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>{(displayOrder as any).customerDic}</InfoValue>
                </InfoItem>
              )}
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Krajina:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <img 
                      loading="lazy" 
                      width="20" 
                      height="15"
                      src={`https://flagcdn.com/${(countries.find(c => c.name === displayOrder.customerCountry)?.code || 'sk').toLowerCase()}.svg`} 
                      alt="Vlajka krajiny" 
                      style={{ borderRadius: '2px', objectFit: 'cover' }}
                    />
                    <span>{displayOrder.customerCountry || 'Slovensko'}</span>
                  </Box>
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Splatnosť:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode}>
                  <Chip 
                    label={`${displayOrder.customerPaymentTermDays || 30} dní`}
                    color="primary"
                    size="small"
                    sx={{ 
                      backgroundColor: '#ff9f43',
                      color: '#ffffff',
                      fontWeight: 'bold'
                    }}
                  />
                </InfoValue>
              </InfoItem>
              {(displayOrder as any).customerRating && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Hodnotenie:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>
                    <RatingIndicator rating={(displayOrder as any).customerRating} size="small" />
                  </InfoValue>
                </InfoItem>
              )}
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Adresa:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode}>
                  {displayOrder.customerStreet ? `${displayOrder.customerStreet}, ${displayOrder.customerZip} ${displayOrder.customerCity}, ${displayOrder.customerCountry}` : '-'}
                </InfoValue>
              </InfoItem>
            </StyledPaper>
          </Grid>

          {/* Dopravca - kompletné údaje */}
          <Grid item xs={12} md={6}>
            <StyledPaper isDarkMode={isDarkMode}>
              <SectionTitle isDarkMode={isDarkMode}>
                <LocalShippingIcon />
                Dopravca
              </SectionTitle>
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Spoločnosť:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode}>{displayOrder.carrierCompany || '-'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Kontaktná osoba:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode}>{displayOrder.carrierContact || '-'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Email:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode}>{displayOrder.carrierEmail || '-'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Telefón:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode}>
                  {displayOrder.carrierPhone ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {displayOrder.carrierPhone.startsWith('+') && (
                        <>
                          <img 
                            loading="lazy" 
                            width="20" 
                            height="15"
                            src={`https://flagcdn.com/${(countries.find(c => displayOrder.carrierPhone?.startsWith(c.prefix))?.code || 'sk').toLowerCase()}.svg`} 
                            alt="Vlajka krajiny" 
                            style={{ borderRadius: '2px', objectFit: 'cover' }}
                          />
                          <span>{displayOrder.carrierPhone}</span>
                        </>
                      )}
                      {!displayOrder.carrierPhone.startsWith('+') && (
                        <span>{displayOrder.carrierPhone}</span>
                      )}
                    </Box>
                  ) : (
                    <span>-</span>
                  )}
                </InfoValue>
              </InfoItem>
              {displayOrder.carrierIco && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>IČO:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>{displayOrder.carrierIco}</InfoValue>
                </InfoItem>
              )}
              {displayOrder.carrierIcDph && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>IČ DPH:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>{displayOrder.carrierIcDph}</InfoValue>
                </InfoItem>
              )}
              {displayOrder.carrierDic && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>DIČ:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>{displayOrder.carrierDic}</InfoValue>
                </InfoItem>
              )}
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Krajina:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <img 
                      loading="lazy" 
                      width="20" 
                      height="15"
                      src={`https://flagcdn.com/${(countries.find(c => c.name === displayOrder.carrierCountry)?.code || 'sk').toLowerCase()}.svg`} 
                      alt="Vlajka krajiny" 
                      style={{ borderRadius: '2px', objectFit: 'cover' }}
                    />
                    <span>{displayOrder.carrierCountry || 'Slovensko'}</span>
                  </Box>
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Splatnosť:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode}>
                  <Chip 
                    label={`${displayOrder.carrierPaymentTermDays || 60} dní`}
                    color="primary"
                    size="small"
                    sx={{ 
                      backgroundColor: '#ff9f43',
                      color: '#ffffff',
                      fontWeight: 'bold'
                    }}
                  />
                </InfoValue>
              </InfoItem>

              {(displayOrder.carrierRating && displayOrder.carrierRating > 0) ? (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Hodnotenie:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>
                    <RatingIndicator rating={displayOrder.carrierRating} size="small" />
                  </InfoValue>
                </InfoItem>
              ) : null}
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Adresa:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode}>
                  {displayOrder.carrierStreet ? `${displayOrder.carrierStreet}, ${displayOrder.carrierZip} ${displayOrder.carrierCity}, ${displayOrder.carrierCountry}` : '-'}
                </InfoValue>
              </InfoItem>
              {displayOrder.carrierVehicleTypes && displayOrder.carrierVehicleTypes.length > 0 && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Typy vozidiel:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>{displayOrder.carrierVehicleTypes.join(', ')}</InfoValue>
                </InfoItem>
              )}
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>ŠPZ vozidla:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode}>{displayOrder.carrierVehicleReg || '-'}</InfoValue>
              </InfoItem>
              {displayOrder.vyzadujeSaTypNavesu && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Typ návesu:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>{displayOrder.vyzadujeSaTypNavesu}</InfoValue>
                </InfoItem>
              )}
            </StyledPaper>
          </Grid>

          {/* Miesta nakládky */}
          <Grid item xs={12}>
            <StyledPaper isDarkMode={isDarkMode}>
              <SectionTitle isDarkMode={isDarkMode}>
                <LocationOnIcon />
                Miesta nakládky
              </SectionTitle>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <StyledTableCell isDarkMode={isDarkMode}><strong>Adresa</strong></StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}><strong>Čas nakládky</strong></StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}><strong>Kontaktná osoba</strong></StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}><strong>Telefón</strong></StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayOrder.loadingPlaces && displayOrder.loadingPlaces.length > 0 ? (
                    displayOrder.loadingPlaces.map((place, index) => (
                      <TableRow key={place.id || `loading-${index}`}>
                        <StyledTableCell isDarkMode={isDarkMode}>
                          {place.street}, {place.zip} {place.city}, {place.country}
                        </StyledTableCell>
                        <StyledTableCell isDarkMode={isDarkMode}>
                          {formatDate(place.dateTime)}
                        </StyledTableCell>
                        <StyledTableCell isDarkMode={isDarkMode}>
                          {place.contactPersonName || place.contactPerson || '-'}
                        </StyledTableCell>
                        <StyledTableCell isDarkMode={isDarkMode}>
                          {place.contactPersonPhone || '-'}
                        </StyledTableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <StyledTableCell isDarkMode={isDarkMode} colSpan={4}>
                        Nie sú definované žiadne miesta nakládky
                      </StyledTableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </StyledPaper>
          </Grid>

          {/* Miesta vykládky */}
          <Grid item xs={12}>
            <StyledPaper isDarkMode={isDarkMode}>
              <SectionTitle isDarkMode={isDarkMode}>
                <LocationOnIcon />
                Miesta vykládky
              </SectionTitle>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <StyledTableCell isDarkMode={isDarkMode}><strong>Adresa</strong></StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}><strong>Čas vykládky</strong></StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}><strong>Kontaktná osoba</strong></StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}><strong>Telefón</strong></StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayOrder.unloadingPlaces && displayOrder.unloadingPlaces.length > 0 ? (
                    displayOrder.unloadingPlaces.map((place, index) => (
                      <TableRow key={place.id || `unloading-${index}`}>
                        <StyledTableCell isDarkMode={isDarkMode}>
                          {place.street}, {place.zip} {place.city}, {place.country}
                        </StyledTableCell>
                        <StyledTableCell isDarkMode={isDarkMode}>
                          {formatDate(place.dateTime)}
                        </StyledTableCell>
                        <StyledTableCell isDarkMode={isDarkMode}>
                          {place.contactPersonName || place.contactPerson || '-'}
                        </StyledTableCell>
                        <StyledTableCell isDarkMode={isDarkMode}>
                          {place.contactPersonPhone || '-'}
                        </StyledTableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <StyledTableCell isDarkMode={isDarkMode} colSpan={4}>
                        Nie sú definované žiadne miesta vykládky
                      </StyledTableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </StyledPaper>
          </Grid>

          {/* Tovar */}
          <Grid item xs={12}>
            <StyledPaper isDarkMode={isDarkMode}>
              <SectionTitle isDarkMode={isDarkMode}>
                <InventoryIcon />
                Tovar
              </SectionTitle>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <StyledTableCell isDarkMode={isDarkMode}><strong>Názov</strong></StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}><strong>Množstvo</strong></StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}><strong>Jednotka</strong></StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}><strong>Váha (t)</strong></StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}><strong>Výmena paliet</strong></StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}><strong>Rozmery</strong></StyledTableCell>
                    <StyledTableCell isDarkMode={isDarkMode}><strong>Popis</strong></StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {displayOrder.loadingPlaces && displayOrder.loadingPlaces.flatMap(place => place.goods).length > 0 ? (
                    displayOrder.loadingPlaces.flatMap(place => 
                      place.goods.map((item, index) => (
                        <TableRow key={item.id || `goods-${index}`}>
                          <StyledTableCell isDarkMode={isDarkMode}>{item.name || '-'}</StyledTableCell>
                          <StyledTableCell isDarkMode={isDarkMode}>{item.quantity || '-'}</StyledTableCell>
                          <StyledTableCell isDarkMode={isDarkMode}>{item.unit || '-'}</StyledTableCell>
                          <StyledTableCell isDarkMode={isDarkMode}>{item.weight ? `${item.weight} t` : '-'}</StyledTableCell>
                          <StyledTableCell isDarkMode={isDarkMode}>{item.palletExchange || '-'}</StyledTableCell>
                          <StyledTableCell isDarkMode={isDarkMode}>{item.dimensions || '-'}</StyledTableCell>
                          <StyledTableCell isDarkMode={isDarkMode}>{item.description || '-'}</StyledTableCell>
                        </TableRow>
                      ))
                    )
                  ) : (
                    <TableRow>
                      <StyledTableCell isDarkMode={isDarkMode} colSpan={7}>
                        Nie sú definované žiadne položky tovaru
                      </StyledTableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </StyledPaper>
          </Grid>

          {/* Finančné údaje a poznámky */}
          <Grid item xs={12} sm={6}>
            <StyledPaper isDarkMode={isDarkMode}>
              <SectionTitle isDarkMode={isDarkMode}>
                <EuroIcon />
                Finančné údaje
              </SectionTitle>
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Cena zákazníka:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode} sx={{ color: '#ff9f43', fontWeight: 'bold' }}>
                  {(displayOrder.customerPrice || displayOrder.suma || '0')} € {displayOrder.mena ? `(${displayOrder.mena})` : ''}
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Cena dopravcu:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode} sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                  {displayOrder.carrierPrice || '0'} €
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Zisk:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode} sx={{ 
                  color: profit > 0 ? '#2ecc71' : profit < 0 ? '#ff6b6b' : isDarkMode ? '#ffffff' : '#000000',
                  fontWeight: 'bold' 
                }}>
                  {profit.toFixed(2)} €
                </InfoValue>
              </InfoItem>
              {displayOrder.vyuctovaniePodlaMnozstva && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Vyúčtovanie:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>
                    <Chip 
                      label="Podľa množstva" 
                      size="small" 
                      sx={{ 
                        backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.2)' : 'rgba(255, 159, 67, 0.1)',
                        color: '#ff9f43',
                        fontWeight: 600,
                        fontSize: '0.75rem' 
                      }} 
                    />
                  </InfoValue>
                </InfoItem>
              )}
            </StyledPaper>
          </Grid>

          <Grid item xs={12} sm={6}>
            <StyledPaper isDarkMode={isDarkMode}>
              <SectionTitle isDarkMode={isDarkMode}>
                <NotesIcon />
                Poznámky a ďalšie údaje
              </SectionTitle>
              {displayOrder.cisloNakladuZakaznika && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Číslo zákazníka:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>{displayOrder.cisloNakladuZakaznika}</InfoValue>
                </InfoItem>
              )}
              {displayOrder.poziadavky && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Požiadavky:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>{displayOrder.poziadavky}</InfoValue>
                </InfoItem>
              )}
              {displayOrder.internaPoznamka && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Interná poznámka:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>{displayOrder.internaPoznamka}</InfoValue>
                </InfoItem>
              )}
            </StyledPaper>
          </Grid>

          {/* Informácie o vytvorení */}
          <Grid item xs={12}>
            <InfoSection>
              <SectionTitle isDarkMode={isDarkMode}>
                <AccessTimeIcon />
                Informácie o vytvorení
              </SectionTitle>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Vytvorená:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>
                    {displayOrder.createdAt ? 
                      (displayOrder.createdAt instanceof Timestamp ? 
                        format(displayOrder.createdAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: sk }) : 
                        format(new Date(displayOrder.createdAt), 'dd.MM.yyyy HH:mm', { locale: sk })) 
                      : '-'}
                  </InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Vytvoril:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ fontSize: '1rem', color: '#ff9f43' }} />
                      {displayOrder.createdByName || '-'}
                    </Box>
                  </InfoValue>
                </InfoItem>
                {displayOrder.updatedAt && (
                  <>
                    <InfoItem>
                      <InfoLabel isDarkMode={isDarkMode}>Aktualizovaná:</InfoLabel>
                      <InfoValue isDarkMode={isDarkMode}>
                        {format(displayOrder.updatedAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: sk })}
                      </InfoValue>
                    </InfoItem>
                    {displayOrder.updatedBy && (
                      <InfoItem>
                        <InfoLabel isDarkMode={isDarkMode}>Upravil:</InfoLabel>
                        <InfoValue isDarkMode={isDarkMode}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EditIcon sx={{ fontSize: '1rem', color: '#1976d2' }} />
                            ID: {displayOrder.updatedBy}
                          </Box>
                        </InfoValue>
                      </InfoItem>
                    )}
                  </>
                )}
              </Box>
            </InfoSection>
          </Grid>
        </Grid>

        <DialogActions sx={{ p: 0, mt: 3 }}>
          <Button 
            onClick={onClose} 
            variant="contained"
            sx={{
              backgroundColor: '#ff9f43',
              color: '#ffffff',
              '&:hover': {
                backgroundColor: '#f39c12',
              },
              fontWeight: 600
            }}
          >
            Zavrieť
          </Button>
        </DialogActions>
      </StyledDialogContent>
    </Dialog>
  );
};

export default OrderDetail; 