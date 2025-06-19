import React from 'react';
import { Box, TextField, InputAdornment, Autocomplete, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import DescriptionIcon from '@mui/icons-material/Description';
import { DOCUMENT_TYPE_CONFIG } from '../../../types/documents';

interface OrdersSearchProps {
  isDarkMode: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  documentFilter: string;
  setDocumentFilter: (filter: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  t: (key: string) => string;
}

const OrdersSearch: React.FC<OrdersSearchProps> = ({
  isDarkMode,
  searchQuery,
  setSearchQuery,
  documentFilter,
  setDocumentFilter,
  showFilters,
  setShowFilters,
  t
}) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 2, 
      alignItems: 'center', 
      flex: 1, 
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      '@media (max-width: 900px)': {
        flexDirection: 'column',
        alignItems: 'stretch',
        '& > *': {
          width: '100%',
          maxWidth: 'none !important'
        }
      }
    }}>
      <TextField
        id="search-order"
        name="searchOrder"
        label={t('orders.searchOrder')}
        variant="outlined"
        size="small"
        value={searchQuery}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
        sx={{ 
          flexGrow: 1, 
          minWidth: '220px', 
          maxWidth: '380px',
          '& .MuiOutlinedInput-root': {
            height: '40px',
          }
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />
      <Autocomplete
        options={Object.values(DOCUMENT_TYPE_CONFIG).map(config => config.label)}
        value={documentFilter}
        onChange={(event, newValue) => setDocumentFilter(newValue || '')}
        renderInput={(params) => (
          <TextField
            {...params}
            label={t('orders.documentFilter')}
            variant="outlined"
            size="small"
            placeholder={t('orders.documentFilterPlaceholder')}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <DescriptionIcon />
                  </InputAdornment>
                  {params.InputProps.startAdornment}
                </>
              ),
            }}
          />
        )}
        sx={{ 
          minWidth: '200px', 
          maxWidth: '220px',
          '& .MuiOutlinedInput-root': {
            height: '40px', // Rovnaká výška ako TextField
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            '& .MuiAutocomplete-input': {
              padding: '8.5px 4px 8.5px 0 !important', // Štandardný padding ako v TextField
            }
          },
          '& .MuiInputLabel-root': {
            transform: 'translate(52px, 12px) scale(1)', // Štandardná pozícia ako v TextField
            '&.MuiInputLabel-shrink': {
              transform: 'translate(14px, -9px) scale(0.75)', // Vrátim späť na normálnu pozíciu
            }
          },
          '& .MuiOutlinedInput-notchedOutline': {
            '& legend': {
              marginLeft: '2px', // Menší posun - z 4px na 2px aby F malo viac miesta
              paddingRight: '10px', // Zvýšim padding z 8px na 10px pre pravú čiaru
            }
          },
          '& .MuiInputAdornment-root': {
            color: isDarkMode ? 'rgba(255, 255, 255, 0.54)' : 'rgba(0, 0, 0, 0.54)', // Farba podľa témy
          }
        }}
        clearOnEscape
        freeSolo
        disableClearable={false}
      />
      <IconButton onClick={() => setShowFilters(!showFilters)}>
        <FilterListIcon />
      </IconButton>
    </Box>
  );
};

export default OrdersSearch; 