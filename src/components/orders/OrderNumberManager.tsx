import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Alert,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  Divider
} from '@mui/material';
import {
  Warning as WarningIcon,
  Error as ErrorIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeContext';

interface DuplicateOrder {
  id: string;
  orderNumberFormatted: string;
  customerCompany: string;
  createdAt: Date;
  createdByName: string;
  sum: number;
  status?: string;
}

interface OrderNumberManagerProps {
  open: boolean;
  onClose: () => void;
  onOrderNumberFixed?: () => void;
}

const OrderNumberManager: React.FC<OrderNumberManagerProps> = ({
  open,
  onClose,
  onOrderNumberFixed
}) => {
  const { userData } = useAuth();
  const { isDarkMode } = useThemeMode();
  
  const [duplicates, setDuplicates] = useState<{ [key: string]: DuplicateOrder[] }>({});
  const [loading, setLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [newOrderNumber, setNewOrderNumber] = useState<string>('');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Načítanie duplicitných objednávok
  const loadDuplicateOrders = useCallback(async () => {
    if (!userData?.companyID) return;

    setLoading(true);
    try {
      console.log('🔍 Hľadám duplicitné čísla objednávok...');
      
      const ordersQuery = query(
        collection(db, 'orders'),
        where('companyID', '==', userData.companyID)
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const allOrders: DuplicateOrder[] = [];
      
      ordersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.orderNumberFormatted) {
          allOrders.push({
            id: doc.id,
            orderNumberFormatted: data.orderNumberFormatted,
            customerCompany: data.customerCompany || data.zakaznik || 'Neznámy zákazník',
            createdAt: data.createdAt?.toDate() || new Date(),
            createdByName: data.createdByName || 'Neznámy',
            sum: parseFloat(data.suma || data.customerPrice || '0'),
            status: data.status || 'active'
          });
        }
      });

      // Nájdenie duplicít
      const orderNumberCounts: { [key: string]: DuplicateOrder[] } = {};
      
      allOrders.forEach(order => {
        if (!orderNumberCounts[order.orderNumberFormatted]) {
          orderNumberCounts[order.orderNumberFormatted] = [];
        }
        orderNumberCounts[order.orderNumberFormatted].push(order);
      });

      // Filtrovanie len duplicitných čísel
      const duplicateNumbers: { [key: string]: DuplicateOrder[] } = {};
      Object.entries(orderNumberCounts).forEach(([orderNumber, orders]) => {
        if (orders.length > 1) {
          // Zoradíme podľa dátumu vytvorenia
          orders.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          duplicateNumbers[orderNumber] = orders;
        }
      });

      console.log('📊 Nájdené duplicitné čísla:', Object.keys(duplicateNumbers).length);
      console.log('🔍 Detaily duplicít:', duplicateNumbers);
      
      setDuplicates(duplicateNumbers);
      
    } catch (error) {
      console.error('❌ Chyba pri načítaní duplicitných objednávok:', error);
    } finally {
      setLoading(false);
    }
  }, [userData?.companyID]);

  // Načítanie dát pri otvorení dialógu
  useEffect(() => {
    if (open) {
      loadDuplicateOrders();
    }
  }, [open, loadDuplicateOrders]);

  // Generovanie nového unikátneho čísla objednávky
  const generateUniqueOrderNumber = async (): Promise<string> => {
    if (!userData?.companyID) return '';

    try {
      const currentDate = new Date();
      const orderYear = currentDate.getFullYear().toString();
      const orderMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      
      // Načítame všetky objednávky pre aktuálny mesiac
      const ordersQuery = query(
        collection(db, 'orders'),
        where('companyID', '==', userData.companyID),
        where('orderYear', '==', orderYear),
        where('orderMonth', '==', orderMonth)
      );
      
      const ordersSnapshot = await getDocs(ordersQuery);
      const existingNumbers = new Set<string>();
      
      ordersSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.orderNumberFormatted) {
          existingNumbers.add(data.orderNumberFormatted);
        }
      });
      
      // Nájdeme najvyššie číslo a pridáme 1
      let highestNumber = 0;
      existingNumbers.forEach(numberFormatted => {
        if (numberFormatted.startsWith(orderYear + orderMonth)) {
          const orderPart = parseInt(numberFormatted.substring(6));
          if (orderPart > highestNumber) {
            highestNumber = orderPart;
          }
        }
      });
      
      const newOrderNumber = (highestNumber + 1).toString().padStart(3, '0');
      return `${orderYear}${orderMonth}${newOrderNumber}`;
      
    } catch (error) {
      console.error('❌ Chyba pri generovaní unikátneho čísla:', error);
      return '';
    }
  };

  // Uloženie nového čísla objednávky
  const handleSaveNewOrderNumber = async (orderId: string) => {
    if (!newOrderNumber || newOrderNumber.length !== 8) {
      alert('Zadajte platné 8-miestne číslo objednávky (YYYYMMNN)');
      return;
    }

    try {
      // Kontrola duplicity
      const duplicateQuery = query(
        collection(db, 'orders'),
        where('companyID', '==', userData?.companyID),
        where('orderNumberFormatted', '==', newOrderNumber)
      );
      
      const duplicateSnapshot = await getDocs(duplicateQuery);
      const existingDuplicates = duplicateSnapshot.docs.filter(doc => doc.id !== orderId);
      
      if (existingDuplicates.length > 0) {
        alert(`Číslo objednávky ${newOrderNumber} už existuje! Zvoľte iné číslo.`);
        return;
      }

      // Extrahovanie častí čísla
      const orderYear = newOrderNumber.substring(0, 4);
      const orderMonth = newOrderNumber.substring(4, 6);
      const orderNumber = newOrderNumber.substring(6, 8);

      // Aktualizácia v databáze
      await updateDoc(doc(db, 'orders', orderId), {
        orderNumberFormatted: newOrderNumber,
        orderYear,
        orderMonth,
        orderNumber,
        updatedAt: Timestamp.now(),
        updatedBy: userData?.uid,
        orderNumberUpdatedAt: Timestamp.now(),
        orderNumberUpdatedBy: userData?.uid
      });

      console.log('✅ Číslo objednávky úspešne zmenené:', newOrderNumber);
      
      // Reset editácie
      setEditingOrder(null);
      setNewOrderNumber('');
      
      // Refresh dát
      await loadDuplicateOrders();
      onOrderNumberFixed?.();
      
    } catch (error) {
      console.error('❌ Chyba pri ukladaní čísla objednávky:', error);
      alert('Nastala chyba pri ukladaní čísla objednávky');
    }
  };

  // Automatické opravenie duplicity
  const handleAutoFix = async (orderNumber: string, orders: DuplicateOrder[]) => {
    if (orders.length < 2) return;
    
    try {
      // Prvá objednávka zostáva, ostatné dostanú nové čísla
      const ordersToFix = orders.slice(1);
      
      for (const order of ordersToFix) {
        const uniqueNumber = await generateUniqueOrderNumber();
        if (uniqueNumber) {
          // Nastavíme nové číslo a uložíme
          setNewOrderNumber(uniqueNumber);
          await handleSaveNewOrderNumber(order.id);
          console.log(`✅ Automaticky opravené: ${order.id} -> ${uniqueNumber}`);
        }
      }
      
      await loadDuplicateOrders();
      onOrderNumberFixed?.();
      
    } catch (error) {
      console.error('❌ Chyba pri automatickej oprave:', error);
    }
  };

  // Filtrovanie duplicít
  const filteredDuplicates = Object.entries(duplicates).filter(([orderNumber, orders]) => {
    if (!searchFilter) return true;
    return orderNumber.includes(searchFilter) || 
           orders.some(order => 
             order.customerCompany.toLowerCase().includes(searchFilter.toLowerCase()) ||
             order.createdByName.toLowerCase().includes(searchFilter.toLowerCase())
           );
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          backgroundColor: isDarkMode ? '#1e1e2e' : '#ffffff'
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: isDarkMode ? '#2d2d44' : '#f5f5f5',
        color: isDarkMode ? '#ffffff' : '#000000'
      }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={1}>
            <WarningIcon sx={{ color: '#ff9800' }} />
            <Typography variant="h6">Správa čísel objednávok</Typography>
          </Box>
          <Box display="flex" gap={1}>
            <IconButton onClick={loadDuplicateOrders} disabled={loading}>
              <RefreshIcon />
            </IconButton>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {/* Súhrn a vyhľadávanie */}
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Alert 
              severity={Object.keys(duplicates).length > 0 ? "warning" : "success"}
              icon={Object.keys(duplicates).length > 0 ? <ErrorIcon /> : <CheckIcon />}
            >
              {Object.keys(duplicates).length > 0 
                ? `Nájdených ${Object.keys(duplicates).length} duplicitných čísel objednávok`
                : 'Všetky čísla objednávok sú unikátne'
              }
            </Alert>
            
            <TextField
              size="small"
              placeholder="Vyhľadať..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          
          {loading && (
            <Box display="flex" justifyContent="center" p={2}>
              <CircularProgress />
            </Box>
          )}
        </Box>

        {/* Tabuľka duplicít */}
        {!loading && Object.keys(duplicates).length > 0 && (
          <Box>
            {filteredDuplicates.map(([orderNumber, orders]) => (
              <Paper key={orderNumber} sx={{ mb: 3, p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" color="error">
                    Duplicitné číslo: {orderNumber}
                  </Typography>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => handleAutoFix(orderNumber, orders)}
                    size="small"
                  >
                    Automaticky opraviť
                  </Button>
                </Box>
                
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Zákazník</TableCell>
                        <TableCell>Suma</TableCell>
                        <TableCell>Vytvoril</TableCell>
                        <TableCell>Dátum vytvorenia</TableCell>
                        <TableCell align="center">Akcie</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {orders.map((order, index) => (
                        <TableRow key={order.id}>
                          <TableCell>{order.customerCompany}</TableCell>
                          <TableCell>{order.sum.toFixed(2)} €</TableCell>
                          <TableCell>{order.createdByName}</TableCell>
                          <TableCell>
                            {order.createdAt.toLocaleDateString('sk-SK')} {order.createdAt.toLocaleTimeString('sk-SK')}
                            {index === 0 && (
                              <Chip label="Prvá" size="small" color="success" sx={{ ml: 1 }} />
                            )}
                          </TableCell>
                          <TableCell align="center">
                            {editingOrder === order.id ? (
                              <Box display="flex" alignItems="center" gap={1}>
                                <TextField
                                  size="small"
                                  value={newOrderNumber}
                                  onChange={(e) => setNewOrderNumber(e.target.value)}
                                  placeholder="YYYYMMNN"
                                  inputProps={{ maxLength: 8 }}
                                  sx={{ width: 120 }}
                                />
                                <IconButton
                                  size="small"
                                  onClick={() => handleSaveNewOrderNumber(order.id)}
                                  color="success"
                                >
                                  <CheckIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setEditingOrder(null);
                                    setNewOrderNumber('');
                                  }}
                                  color="error"
                                >
                                  <CloseIcon />
                                </IconButton>
                              </Box>
                            ) : (
                              <IconButton
                                size="small"
                                onClick={async () => {
                                  setEditingOrder(order.id);
                                  // Predvyplníme nové číslo
                                  const uniqueNumber = await generateUniqueOrderNumber();
                                  setNewOrderNumber(uniqueNumber);
                                }}
                                color="primary"
                              >
                                <EditIcon />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ))}
          </Box>
        )}

        {/* Informácie o príčinách duplicít */}
        {!loading && Object.keys(duplicates).length > 0 && (
          <Box mt={3}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Možné príčiny duplicitných čísel:
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              <Typography component="li" variant="body2" gutterBottom>
                **Race condition**: Rýchle vytvorenie viacerých objednávok súčasne
              </Typography>
              <Typography component="li" variant="body2" gutterBottom>
                **Chyba v transakciách**: Prerušené ukladanie objednávky
              </Typography>
              <Typography component="li" variant="body2" gutterBottom>
                **Cache problém**: Dáta neboli správne synchronizované
              </Typography>
              <Typography component="li" variant="body2" gutterBottom>
                **Manuálna úprava**: Ručné nastavenie rovnakého čísla
              </Typography>
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Zavrieť
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrderNumberManager; 