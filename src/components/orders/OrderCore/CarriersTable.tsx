import React from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import { Carrier } from '../../../types/carriers';
import { RatingIndicator } from './OrderComponents';
import BareTooltip from '../../common/BareTooltip';

interface CarriersTableProps {
  isDarkMode: boolean;
  carriers: Carrier[];
  carrierSearchQuery: string;
  setCarrierSearchQuery: (query: string) => void;
  isLoadingCarriers: boolean;
  carriersPage: number;
  carriersRowsPerPage: number;
  setCarriersPage: (page: number) => void;
  setCarriersRowsPerPage: (rowsPerPage: number) => void;
  handleAddCarrier: () => void;
  handleEditCarrier: (carrier: Carrier) => void;
  openCarrierDeleteConfirmation: (id: string) => void;
  handleOpenCarrierRating: (carrier: Carrier) => void;
  getCarrierAverageRating: (carrier: Carrier) => number;
  t: (key: string) => string;
}

const CarriersTable: React.FC<CarriersTableProps> = ({
  isDarkMode,
  carriers,
  carrierSearchQuery,
  setCarrierSearchQuery,
  isLoadingCarriers,
  carriersPage,
  carriersRowsPerPage,
  setCarriersPage,
  setCarriersRowsPerPage,
  handleAddCarrier,
  handleEditCarrier,
  openCarrierDeleteConfirmation,
  handleOpenCarrierRating,
  getCarrierAverageRating,
  t
}) => {
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

  const paginatedCarriers = filteredCarriers.slice(
    carriersPage * carriersRowsPerPage, 
    carriersPage * carriersRowsPerPage + carriersRowsPerPage
  );

  return (
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
  );
};

export default CarriersTable; 