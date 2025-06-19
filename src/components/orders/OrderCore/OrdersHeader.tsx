import React from 'react';
import { Box, Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import OrdersSearch from './OrdersSearch';

interface OrdersHeaderProps {
  isDarkMode: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  documentFilter: string;
  setDocumentFilter: (filter: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  handleOpenNewOrderForm: () => void;
  t: (key: string) => string;
}

const OrdersHeader: React.FC<OrdersHeaderProps> = ({
  isDarkMode,
  searchQuery,
  setSearchQuery,
  documentFilter,
  setDocumentFilter,
  showFilters,
  setShowFilters,
  handleOpenNewOrderForm,
  t
}) => {
  return (
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
      <OrdersSearch
        isDarkMode={isDarkMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        documentFilter={documentFilter}
        setDocumentFilter={setDocumentFilter}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        t={t}
      />
    </Box>
  );
};

export default OrdersHeader; 