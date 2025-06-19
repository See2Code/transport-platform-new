import React from 'react';
import { Box, Button } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers';
import { sk } from 'date-fns/locale';

interface DispatchersFiltersProps {
  dispatcherFilter: 'all' | 'thisMonth' | 'thisYear' | 'custom';
  setDispatcherFilter: (filter: 'all' | 'thisMonth' | 'thisYear' | 'custom') => void;
  customStartDate: Date | null;
  setCustomStartDate: (date: Date | null) => void;
  customEndDate: Date | null;
  setCustomEndDate: (date: Date | null) => void;
  t: (key: string) => string;
}

const DispatchersFilters: React.FC<DispatchersFiltersProps> = ({
  dispatcherFilter,
  setDispatcherFilter,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  t
}) => {
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
      <Button
        variant={dispatcherFilter === 'all' ? 'contained' : 'outlined'}
        onClick={() => setDispatcherFilter('all')}
        sx={{
          backgroundColor: dispatcherFilter === 'all' ? '#ff9f43' : 'transparent',
          borderColor: '#ff9f43',
          color: dispatcherFilter === 'all' ? '#ffffff' : '#ff9f43',
          '&:hover': {
            backgroundColor: dispatcherFilter === 'all' ? '#f7b067' : 'rgba(255, 159, 67, 0.1)',
          }
        }}
      >
        {t('common.allOrders')}
      </Button>
      
      <Button
        variant={dispatcherFilter === 'thisMonth' ? 'contained' : 'outlined'}
        onClick={() => setDispatcherFilter('thisMonth')}
        sx={{
          backgroundColor: dispatcherFilter === 'thisMonth' ? '#ff9f43' : 'transparent',
          borderColor: '#ff9f43',
          color: dispatcherFilter === 'thisMonth' ? '#ffffff' : '#ff9f43',
          '&:hover': {
            backgroundColor: dispatcherFilter === 'thisMonth' ? '#f7b067' : 'rgba(255, 159, 67, 0.1)',
          }
        }}
      >
        {t('common.thisMonth')}
      </Button>
      
      <Button
        variant={dispatcherFilter === 'thisYear' ? 'contained' : 'outlined'}
        onClick={() => setDispatcherFilter('thisYear')}
        sx={{
          backgroundColor: dispatcherFilter === 'thisYear' ? '#ff9f43' : 'transparent',
          borderColor: '#ff9f43',
          color: dispatcherFilter === 'thisYear' ? '#ffffff' : '#ff9f43',
          '&:hover': {
            backgroundColor: dispatcherFilter === 'thisYear' ? '#f7b067' : 'rgba(255, 159, 67, 0.1)',
          }
        }}
      >
        {t('common.thisYear')}
      </Button>
      
      <Button
        variant={dispatcherFilter === 'custom' ? 'contained' : 'outlined'}
        onClick={() => setDispatcherFilter('custom')}
        sx={{
          backgroundColor: dispatcherFilter === 'custom' ? '#ff9f43' : 'transparent',
          borderColor: '#ff9f43',
          color: dispatcherFilter === 'custom' ? '#ffffff' : '#ff9f43',
          '&:hover': {
            backgroundColor: dispatcherFilter === 'custom' ? '#f7b067' : 'rgba(255, 159, 67, 0.1)',
          }
        }}
      >
        Vlastný rozsah
      </Button>

      <Button 
        onClick={() => { 
          setDispatcherFilter('all'); 
          setCustomStartDate(null); 
          setCustomEndDate(null); 
        }}
        size="small"
        sx={{ 
          color: '#ff9f43',
          '&:hover': { backgroundColor: 'rgba(255, 159, 67, 0.04)' }
        }}
      >
        {t('common.clearFilter')}
      </Button>

      {dispatcherFilter === 'custom' && (
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
            <DatePicker
              label={t('common.from')}
              value={customStartDate}
              onChange={(newValue) => setCustomStartDate(newValue)}
              slotProps={{ 
                textField: { 
                  size: 'small',
                  sx: { minWidth: 150 }
                }
              }}
            />
            <DatePicker
              label={t('common.to')}
              value={customEndDate}
              onChange={(newValue) => setCustomEndDate(newValue)}
              slotProps={{ 
                textField: { 
                  size: 'small',
                  sx: { minWidth: 150 }
                }
              }}
            />
          </LocalizationProvider>
        </Box>
      )}
    </Box>
  );
};

export default DispatchersFilters; 