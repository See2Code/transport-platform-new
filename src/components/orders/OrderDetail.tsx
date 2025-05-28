import React from 'react';
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
  Edit as EditIcon
} from '@mui/icons-material';
import { useThemeMode } from '../../contexts/ThemeContext';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import { OrderFormData } from '../../types/orders';

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

const OrderDetail: React.FC<OrderDetailProps> = ({ open, onClose, order }) => {
  const { isDarkMode } = useThemeMode();
  
  if (!order) return null;

  // Vypočítame zisk
  const customerPrice = parseFloat(order.customerPrice || order.suma || '0');
  const carrierPrice = parseFloat(order.carrierPrice || '0');
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
          Detail objednávky č. {order.orderNumberFormatted || 'N/A'}
        </DialogTitle>

        <Divider sx={{ mb: 3, borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />

        <Grid container spacing={3}>
          {/* Základné údaje o objednávke */}
          <Grid item xs={12} md={6}>
            <StyledPaper isDarkMode={isDarkMode}>
              <SectionTitle isDarkMode={isDarkMode}>
                <BusinessIcon />
                Zákazník
              </SectionTitle>
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Spoločnosť:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode}>{(order.zakaznik || order.customerCompany) || '-'}</InfoValue>
              </InfoItem>
              {order.customerVatId && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>IČ DPH:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>{order.customerVatId}</InfoValue>
                </InfoItem>
              )}
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Kontaktná osoba:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode}>
                  {(order.kontaktnaOsoba || `${order.customerContactName || ''} ${order.customerContactSurname || ''}`).trim() || '-'}
                </InfoValue>
              </InfoItem>
              {order.customerEmail && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Email:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>{order.customerEmail}</InfoValue>
                </InfoItem>
              )}
              {order.customerPhone && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Telefón:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>{order.customerPhone}</InfoValue>
                </InfoItem>
              )}
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Adresa:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode}>
                  {order.customerStreet ? `${order.customerStreet}, ${order.customerZip} ${order.customerCity}, ${order.customerCountry}` : '-'}
                </InfoValue>
              </InfoItem>
            </StyledPaper>
          </Grid>

          {/* Dopravca */}
          <Grid item xs={12} md={6}>
            <StyledPaper isDarkMode={isDarkMode}>
              <SectionTitle isDarkMode={isDarkMode}>
                <LocalShippingIcon />
                Dopravca
              </SectionTitle>
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Spoločnosť:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode}>{order.carrierCompany || '-'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Kontakt:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode}>{order.carrierContact || '-'}</InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>ŠPZ vozidla:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode}>{order.carrierVehicleReg || '-'}</InfoValue>
              </InfoItem>
              {order.vyzadujeSaTypNavesu && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Typ návesu:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>{order.vyzadujeSaTypNavesu}</InfoValue>
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
                  {order.loadingPlaces && order.loadingPlaces.length > 0 ? (
                    order.loadingPlaces.map((place, index) => (
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
                  {order.unloadingPlaces && order.unloadingPlaces.length > 0 ? (
                    order.unloadingPlaces.map((place, index) => (
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
                  {order.loadingPlaces && order.loadingPlaces.flatMap(place => place.goods).length > 0 ? (
                    order.loadingPlaces.flatMap(place => 
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
                  {(order.customerPrice || order.suma || '0')} € {order.mena ? `(${order.mena})` : ''}
                </InfoValue>
              </InfoItem>
              <InfoItem>
                <InfoLabel isDarkMode={isDarkMode}>Cena dopravcu:</InfoLabel>
                <InfoValue isDarkMode={isDarkMode} sx={{ color: '#1976d2', fontWeight: 'bold' }}>
                  {order.carrierPrice || '0'} €
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
              {order.vyuctovaniePodlaMnozstva && (
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
              {order.cisloNakladuZakaznika && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Číslo zákazníka:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>{order.cisloNakladuZakaznika}</InfoValue>
                </InfoItem>
              )}
              {order.poziadavky && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Požiadavky:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>{order.poziadavky}</InfoValue>
                </InfoItem>
              )}
              {order.internaPoznamka && (
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Interná poznámka:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>{order.internaPoznamka}</InfoValue>
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
                    {order.createdAt ? 
                      (order.createdAt instanceof Timestamp ? 
                        format(order.createdAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: sk }) : 
                        format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm', { locale: sk })) 
                      : '-'}
                  </InfoValue>
                </InfoItem>
                <InfoItem>
                  <InfoLabel isDarkMode={isDarkMode}>Vytvoril:</InfoLabel>
                  <InfoValue isDarkMode={isDarkMode}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon sx={{ fontSize: '1rem', color: '#ff9f43' }} />
                      {order.createdByName || '-'}
                    </Box>
                  </InfoValue>
                </InfoItem>
                {order.updatedAt && (
                  <>
                    <InfoItem>
                      <InfoLabel isDarkMode={isDarkMode}>Aktualizovaná:</InfoLabel>
                      <InfoValue isDarkMode={isDarkMode}>
                        {format(order.updatedAt.toDate(), 'dd.MM.yyyy HH:mm', { locale: sk })}
                      </InfoValue>
                    </InfoItem>
                    {order.updatedBy && (
                      <InfoItem>
                        <InfoLabel isDarkMode={isDarkMode}>Upravil:</InfoLabel>
                        <InfoValue isDarkMode={isDarkMode}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <EditIcon sx={{ fontSize: '1rem', color: '#1976d2' }} />
                            ID: {order.updatedBy}
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