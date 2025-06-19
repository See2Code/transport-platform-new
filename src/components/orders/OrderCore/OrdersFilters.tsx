import React from 'react';
import { Box, Button } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers';
import { sk } from 'date-fns/locale';

interface OrdersFiltersProps {
  startDate: Date | null;
  endDate: Date | null;
  setStartDate: (date: Date | null) => void;
  setEndDate: (date: Date | null) => void;
  setDispatcherFilter: (filter: 'all' | 'thisMonth' | 'thisYear' | 'custom') => void;
  setCustomStartDate: (date: Date | null) => void;
  setCustomEndDate: (date: Date | null) => void;
  setDocumentFilter: (filter: string) => void;
  t: (key: string) => string;
}

const OrdersFilters: React.FC<OrdersFiltersProps> = ({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  setDispatcherFilter,
  setCustomStartDate,
  setCustomEndDate,
  setDocumentFilter,
  t
}) => {
  return (
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
  );
};

export default OrdersFilters; 