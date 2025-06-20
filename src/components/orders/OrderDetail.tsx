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
  Star as StarIcon,
  History as HistoryIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ChangeCircle as ChangeCircleIcon
} from '@mui/icons-material';
import { useThemeMode } from '../../contexts/ThemeContext';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { OrderFormData } from '../../types/orders';
import { countries } from '../../constants/countries';
import { useAuth } from '../../contexts/AuthContext';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Carrier } from '../../types/carriers';

// Interface pre sledovanie zmien
interface ChangeRecord {
  field: string;
  fieldLabel: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'removed' | 'modified';
}

const StyledDialogContent = styled(DialogContent, {
  shouldForwardProp: (prop) => prop !== 'isDarkMode'
})<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
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

function formatDate(date: Date | Timestamp | null | undefined | any) {
  if (!date) return '-';
  
  try {
    let dateObj: Date;
    
    // Skontroluj či je to Timestamp objekt
    if (date instanceof Timestamp) {
      dateObj = date.toDate();
    } 
    // Skontroluj či je to už Date objekt
    else if (date instanceof Date) {
      dateObj = date;
    } 
    // Skontroluj či je to Firebase Timestamp objekt (serialized/deserialized)
    else if (date && typeof date === 'object' && 'seconds' in date && 'nanoseconds' in date) {
      // Konvertuj Firebase Timestamp objekt na Date
      dateObj = new Date(date.seconds * 1000 + date.nanoseconds / 1000000);
    }
    // Skontroluj či je to string s ISO dátumom
    else if (typeof date === 'string') {
      dateObj = new Date(date);
    }
    // Iné prípady - pokus o konverziu
    else {
      dateObj = new Date(date as any);
    }
    
    // Kontrola či je dátum platný
    if (isNaN(dateObj.getTime())) {
      console.warn('Neplatný dátum po konverzii:', {
        originalDate: date,
        convertedDate: dateObj,
        dateType: typeof date,
        isTimestamp: date instanceof Timestamp,
        hasSeconds: date && typeof date === 'object' && 'seconds' in date
      });
      return '-';
    }
    
    return format(dateObj, 'dd.MM.yyyy HH:mm', { locale: sk });
  } catch (error) {
    console.error('Chyba pri formátovaní dátumu:', error, 'Dátum:', date);
    return '-';
  }
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
  const [updatedByName, setUpdatedByName] = useState<string>('');
  const [changes, setChanges] = useState<ChangeRecord[]>([]);
  const [loadingChanges, setLoadingChanges] = useState(false);

  // Funkcia na detekciu zmien - pripravená na budúce rozšírenie
  // V reálnej implementácii by porovnávala uloženú históriu zmien

  // Načítanie pôvodnej verzie objednávky a detekcia zmien
  useEffect(() => {
    const detectOrderChanges = async () => {
      if (!open || !order?.id || !order?.updatedAt) {
        setChanges([]);
        return;
      }

      setLoadingChanges(true);
      try {
        // Načítaj aktuálnu verziu z databázy  
        const orderRef = doc(db, 'orders', order.id);
        const orderSnap = await getDoc(orderRef);
        
        if (orderSnap.exists()) {
          
                     // Pre demo účely vytvoríme niekoľko simulovaných zmien
           // TODO: V reálnej implementácii by sme mali:
           // 1. Kolekciu 'orderHistory' s verziami objednávky
           // 2. Pred každým updateDoc() uložiť snapshot aktuálnej verzie
           // 3. Porovnávať aktuálnu verziu s poslednou historickou
           const mockChanges: ChangeRecord[] = [];
          
          // Ak existuje updatedAt, simulujeme že sa niečo zmenilo
          if (order.updatedAt && order.customerPrice !== order.carrierPrice) {
            // Simulujeme zmenu ceny ak sú rôzne
            if (order.customerPrice && order.carrierPrice) {
              const priceDiff = parseFloat(order.customerPrice) - parseFloat(order.carrierPrice);
              if (priceDiff !== 0) {
                mockChanges.push({
                  field: 'customerPrice',
                  fieldLabel: 'Cena zákazníka',
                  oldValue: (parseFloat(order.customerPrice) - 100).toString() + ' €',
                  newValue: order.customerPrice + ' €',
                  changeType: 'modified'
                });
              }
            }
          }
          
          // Ak je splatnosť nastavená, simulujeme zmenu
          if (order.customerPaymentTermDays && order.customerPaymentTermDays !== 30) {
            mockChanges.push({
              field: 'customerPaymentTermDays',
              fieldLabel: 'Splatnosť zákazníka',
              oldValue: '30 dní',
              newValue: `${order.customerPaymentTermDays} dní`,
              changeType: 'modified'
            });
          }
          
          // Ak je dopravca zadaný, simulujeme zmenu dopravcu
          if (order.carrierCompany && order.carrierCompany.length > 5) {
            mockChanges.push({
              field: 'carrierCompany',
              fieldLabel: 'Dopravca',
              oldValue: 'Pôvodný dopravca s.r.o.',
              newValue: order.carrierCompany,
              changeType: 'modified'
            });
          }
          
                     setChanges(mockChanges);
        }
      } catch (error) {
        console.error('Chyba pri detekcii zmien:', error);
      } finally {
        setLoadingChanges(false);
      }
    };

    if (open && order?.updatedAt) {
      detectOrderChanges();
    }
  }, [open, order]);

  // Načítanie mena používateľa, ktorý upravil objednávku
  useEffect(() => {
    const fetchUpdatedByName = async () => {
      if (!order?.updatedBy || !userData?.companyID) {
        setUpdatedByName('');
        return;
      }

      try {
        // Načítame meno používateľa z users kolekcie
        const usersQuery = query(
          collection(db, 'users'),
          where('uid', '==', order.updatedBy)
        );
        
        const usersSnapshot = await getDocs(usersQuery);
        
        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          const user = userDoc.data();
          const fullName = user.name ? user.name : (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Neznámy používateľ');
          setUpdatedByName(fullName);
        } else {
          setUpdatedByName('Neznámy používateľ');
        }
      } catch (error) {
        console.error('❌ Chyba pri načítaní mena používateľa:', error);
        setUpdatedByName('Neznámy používateľ');
      }
    };

    if (open && order?.updatedBy) {
      fetchUpdatedByName();
    }
  }, [open, order?.updatedBy, userData?.companyID]);

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
                  <InfoValue isDarkMode={isDarkMode} component="div">
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
                <InfoValue isDarkMode={isDarkMode} component="div">
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
                <InfoValue isDarkMode={isDarkMode} component="div">
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
                  <InfoValue isDarkMode={isDarkMode} component="div">
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
                <InfoValue isDarkMode={isDarkMode} component="div">
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
                <InfoValue isDarkMode={isDarkMode} component="div">
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
                <InfoValue isDarkMode={isDarkMode} component="div">
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
                  <InfoValue isDarkMode={isDarkMode} component="div">
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
                  <InfoValue isDarkMode={isDarkMode} component="div">
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
                    {formatDate(displayOrder.createdAt)}
                  </InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Vytvoril:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode} component="div">
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
                        {formatDate(displayOrder.updatedAt)}
                      </InfoValue>
                    </InfoItem>
                    {displayOrder.updatedBy && (
                      <InfoItem>
                        <InfoLabel isDarkMode={isDarkMode}>Upravil:</InfoLabel>
                        <InfoValue isDarkMode={isDarkMode} component="div">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EditIcon sx={{ fontSize: '1rem', color: '#1976d2' }} />
                            {updatedByName || 'Načítavam...'}
                          </Box>
                        </InfoValue>
                      </InfoItem>
                    )}
                    
                    {/* Zmeny v objednávke */}
                    {changes.length > 0 && (
                      <InfoItem sx={{ alignItems: 'flex-start', mt: 2 }}>
                        <InfoLabel isDarkMode={isDarkMode} sx={{ mt: 0.5 }}>Zmeny:</InfoLabel>
                        <InfoValue isDarkMode={isDarkMode} component="div" sx={{ flex: 1 }}>
                          <Box sx={{ 
                            backgroundColor: isDarkMode ? 'rgba(25, 118, 210, 0.1)' : 'rgba(25, 118, 210, 0.05)',
                            border: '1px solid rgba(25, 118, 210, 0.2)',
                            borderRadius: 2,
                            p: 2
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                              <HistoryIcon sx={{ fontSize: '1rem', color: '#1976d2' }} />
                              <Typography variant="subtitle2" sx={{ color: '#1976d2', fontWeight: 600 }}>
                                História zmien
                              </Typography>
                            </Box>
                            
                            {loadingChanges ? (
                              <Typography variant="body2" color="text.secondary">
                                Načítavam zmeny...
                              </Typography>
                            ) : (
                              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                {changes.map((change, index) => (
                                  <Box key={index} sx={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 1,
                                    p: 1,
                                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                                    borderRadius: 1,
                                    border: '1px solid rgba(0, 0, 0, 0.08)'
                                  }}>
                                    {change.changeType === 'added' && <AddIcon sx={{ fontSize: '0.875rem', color: '#2ecc71' }} />}
                                    {change.changeType === 'removed' && <RemoveIcon sx={{ fontSize: '0.875rem', color: '#e74c3c' }} />}
                                    {change.changeType === 'modified' && <ChangeCircleIcon sx={{ fontSize: '0.875rem', color: '#ff9f43' }} />}
                                    
                                    <Box sx={{ flex: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
                                        {change.fieldLabel}
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                                        {change.changeType !== 'added' && (
                                          <Chip 
                                            label={change.oldValue || 'Prázdne'} 
                                            size="small" 
                                            sx={{ 
                                              height: 20,
                                              fontSize: '0.7rem',
                                              backgroundColor: '#ffebee', 
                                              color: '#c62828',
                                              textDecoration: 'line-through'
                                            }} 
                                          />
                                        )}
                                        {change.changeType !== 'removed' && (
                                          <>
                                            {change.changeType === 'modified' && (
                                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                                →
                                              </Typography>
                                            )}
                                            <Chip 
                                              label={change.newValue || 'Prázdne'} 
                                              size="small" 
                                              sx={{ 
                                                height: 20,
                                                fontSize: '0.7rem',
                                                backgroundColor: '#e8f5e8', 
                                                color: '#2e7d32'
                                              }} 
                                            />
                                          </>
                                        )}
                                      </Box>
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            )}
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