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
  TablePagination,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import BareTooltip from '../../common/BareTooltip';

interface LocationsTableProps {
  isDarkMode: boolean;
  locations: any[];
  locationSearchQuery: string;
  setLocationSearchQuery: (query: string) => void;
  isLoadingLocations: boolean;
  locationsPage: number;
  locationsRowsPerPage: number;
  setLocationsPage: (page: number) => void;
  setLocationsRowsPerPage: (rowsPerPage: number) => void;
  handleAddLocation: () => void;
  handleEditLocation: (location: any) => void;
  openLocationDeleteConfirmation: (id: string) => void;
  t: (key: string) => string;
}

const LocationsTable: React.FC<LocationsTableProps> = ({
  isDarkMode,
  locations,
  locationSearchQuery,
  setLocationSearchQuery,
  isLoadingLocations,
  locationsPage,
  locationsRowsPerPage,
  setLocationsPage,
  setLocationsRowsPerPage,
  handleAddLocation,
  handleEditLocation,
  openLocationDeleteConfirmation,
  t
}) => {
  const filteredLocations = locations.filter(location => 
    location.companyName.toLowerCase().includes(locationSearchQuery.toLowerCase())
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleAddLocation}
            sx={{
              backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.8)' : '#ff9f43',
              color: '#ffffff',
              fontWeight: 500,
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.9)' : '#f7b067',
              }
            }}
          >
            {t('orders.addLocation') || 'Pridať miesto'}
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
          <TextField
            id="search-location"
            name="searchLocation"
            label={t('orders.searchLocation') || 'Hľadať miesto'}
            variant="outlined"
            size="small"
            value={locationSearchQuery}
            onChange={(e) => setLocationSearchQuery(e.target.value)}
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

      {isLoadingLocations ? (
        <Box display="flex" justifyContent="center" alignItems="center" mt={4} p={4}>
          <CircularProgress />
          <Typography variant="body2" sx={{ ml: 2 }}>
            Načítavam miesta...
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
                <TableCell>{t('orders.type') || 'Typ'}</TableCell>
                <TableCell>{t('orders.companyName') || 'Názov firmy'}</TableCell>
                <TableCell>{t('orders.city') || 'Mesto'}</TableCell>
                <TableCell>{t('orders.street') || 'Ulica'}</TableCell>
                <TableCell>{t('orders.zipCode') || 'PSČ'}</TableCell>
                <TableCell>{t('orders.country') || 'Krajina'}</TableCell>
                <TableCell>{t('orders.contactPerson') || 'Kontaktná osoba'}</TableCell>
                <TableCell>Telefón</TableCell>
                <TableCell>{t('orders.usageCount') || 'Počet použití'}</TableCell>
                <TableCell>{t('orders.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLocations
                .slice(locationsPage * locationsRowsPerPage, (locationsPage + 1) * locationsRowsPerPage)
                .map((location) => (
                  <TableRow key={location.id}>
                    <TableCell>
                      <Chip 
                        label={location.type === 'loading' ? 'Nakládka' : 'Vykládka'} 
                        color={location.type === 'loading' ? 'success' : 'info'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{location.companyName || '-'}</TableCell>
                    <TableCell>{location.city}</TableCell>
                    <TableCell>{location.street || '-'}</TableCell>
                    <TableCell>{location.zip || '-'}</TableCell>
                    <TableCell>{location.country || '-'}</TableCell>
                    <TableCell>{location.contactPersonName || location.contactPerson || '-'}</TableCell>
                    <TableCell>{location.contactPersonPhone || '-'}</TableCell>
                    <TableCell>{location.usageCount || 0}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <BareTooltip title={t('orders.edit')}>
                          <IconButton 
                            onClick={() => handleEditLocation(location)}
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
                            onClick={() => openLocationDeleteConfirmation(location.id)}
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
            count={filteredLocations.length}
            page={locationsPage}
            onPageChange={(e: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => setLocationsPage(newPage)}
            rowsPerPage={locationsRowsPerPage}
            onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
              setLocationsRowsPerPage(parseInt(e.target.value, 10));
              setLocationsPage(0);
            }}
            rowsPerPageOptions={[10, 25, 50, 100]}
            labelRowsPerPage={t('business.rowsPerPage')}
          />
        </TableContainer>
      )}
    </Box>
  );
};

export default LocationsTable; 