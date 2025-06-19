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
import { Customer } from '../../../types/customers';
import { RatingIndicator } from './OrderComponents';
import BareTooltip from '../../common/BareTooltip';
import { countries } from '../../../constants/countries';

interface CustomersTableProps {
  isDarkMode: boolean;
  customers: Customer[];
  customerSearchQuery: string;
  setCustomerSearchQuery: (query: string) => void;
  isLoadingCustomers: boolean;
  customersPage: number;
  customersRowsPerPage: number;
  setCustomersPage: (page: number) => void;
  setCustomersRowsPerPage: (rowsPerPage: number) => void;
  handleAddCustomer: () => void;
  handleEditCustomer: (customer: Customer) => void;
  openCustomerDeleteConfirmation: (id: string) => void;
  handleOpenCustomerRating: (customer: Customer) => void;
  getCustomerAverageRating: (customer: Customer) => number;
  t: (key: string) => string;
}

const CustomersTable: React.FC<CustomersTableProps> = ({
  isDarkMode,
  customers,
  customerSearchQuery,
  setCustomerSearchQuery,
  isLoadingCustomers,
  customersPage,
  customersRowsPerPage,
  setCustomersPage,
  setCustomersRowsPerPage,
  handleAddCustomer,
  handleEditCustomer,
  openCustomerDeleteConfirmation,
  handleOpenCustomerRating,
  getCustomerAverageRating,
  t
}) => {
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

  const paginatedCustomers = filteredCustomers.slice(
    customersPage * customersRowsPerPage, 
    customersPage * customersRowsPerPage + customersRowsPerPage
  );

  return (
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
  );
};

export default CustomersTable; 