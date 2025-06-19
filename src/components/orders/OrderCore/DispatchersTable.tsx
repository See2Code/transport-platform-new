import React from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface Dispatcher {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalRevenue: number;
  totalCosts: number;
  totalProfit: number;
  avgProfit: number;
  avgProfitMargin: number;
}

interface DispatchersTableProps {
  isDarkMode: boolean;
  dispatchers: Dispatcher[];
  dispatcherSearchQuery: string;
  setDispatcherSearchQuery: (query: string) => void;
  isLoadingDispatchers: boolean;
  dispatchersPage: number;
  dispatchersRowsPerPage: number;
  setDispatchersPage: (page: number) => void;
  setDispatchersRowsPerPage: (rowsPerPage: number) => void;
  t: (key: string) => string;
}

const DispatchersTable: React.FC<DispatchersTableProps> = ({
  isDarkMode,
  dispatchers,
  dispatcherSearchQuery,
  setDispatcherSearchQuery,
  isLoadingDispatchers,
  dispatchersPage,
  dispatchersRowsPerPage,
  setDispatchersPage,
  setDispatchersRowsPerPage,
  t
}) => {
  const filteredDispatchers = dispatchers.filter(dispatcher =>
    dispatcher.name.toLowerCase().includes(dispatcherSearchQuery.toLowerCase())
  );

  return (
    <>
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
      {isLoadingDispatchers ? (
        <Box display="flex" justifyContent="center" alignItems="center" mt={4} p={4}>
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Načítavam štatistiky špeditérov...
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
              {filteredDispatchers
                .slice(dispatchersPage * dispatchersRowsPerPage, (dispatchersPage + 1) * dispatchersRowsPerPage)
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
      )}
    </>
  );
};

export default DispatchersTable; 