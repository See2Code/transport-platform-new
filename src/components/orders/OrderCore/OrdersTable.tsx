import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  Typography,
  Chip
} from '@mui/material';
import { OrderFormData } from './OrderComponents';
import { OrderRow, SortableTableCell, StyledTableCell } from './OrderComponents';

interface OrdersTableProps {
  isDarkMode: boolean;
  paginatedOrders: OrderFormData[];
  getFilteredCustomerOrders: () => OrderFormData[];
  ordersPage: number;
  ordersRowsPerPage: number;
  setOrdersPage: (page: number) => void;
  setOrdersRowsPerPage: (rowsPerPage: number) => void;
  sortField: 'orderNumber' | 'createdAt' | null;
  sortDirection: 'asc' | 'desc';
  handleSort: (field: 'orderNumber' | 'createdAt') => void;
  teamMembers: Record<string, any>;
  selectedRowId: string | null;
  handleRowClick: (order: OrderFormData) => void;
  handleShowOrderDetail: (order: OrderFormData) => void;
  handleEditOrder: (order: OrderFormData) => void;
  handleDuplicateOrder: (order: OrderFormData) => void;
  handlePreviewPDFForTable: (event: React.MouseEvent<HTMLElement, MouseEvent>, order: OrderFormData) => void;
  handleDownloadPDFForTable: (event: React.MouseEvent<HTMLElement, MouseEvent>, order: OrderFormData) => void;
  openDeleteConfirmation: (id: string) => void;
  handleOpenOrderRating: (order: OrderFormData) => void;
  calculateOrderStats: () => {
    count: number;
    totalCustomerPrice: number;
    totalCarrierPrice: number;
    totalProfit: number;
  };
  t: (key: string) => string;
  getOrderAverageRating: (order: OrderFormData) => number;
}

const OrdersTable: React.FC<OrdersTableProps> = ({
  isDarkMode,
  paginatedOrders,
  getFilteredCustomerOrders,
  ordersPage,
  ordersRowsPerPage,
  setOrdersPage,
  setOrdersRowsPerPage,
  sortField,
  sortDirection,
  handleSort,
  teamMembers,
  selectedRowId,
  handleRowClick,
  handleShowOrderDetail,
  handleEditOrder,
  handleDuplicateOrder,
  handlePreviewPDFForTable,
  handleDownloadPDFForTable,
  openDeleteConfirmation,
  handleOpenOrderRating,
  calculateOrderStats,
  t,
  getOrderAverageRating
}) => {
  return (
    <Box 
      sx={{ 
        backgroundColor: isDarkMode ? 'rgba(45, 45, 65, 0.95)' : '#ffffff',
        borderRadius: '20px',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        backdropFilter: 'blur(20px)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '70vh',
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Jedna tabuľka s fixným headerom */}
      <Box 
        sx={{ 
          height: 'calc(100% - 120px)',
          overflow: 'auto',
          '::-webkit-scrollbar': {
            width: '14px',
            height: '14px',
          },
          '::-webkit-scrollbar-track': {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
          },
          '::-webkit-scrollbar-thumb': {
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)',
            borderRadius: '8px',
            border: `2px solid ${isDarkMode ? 'rgba(45, 45, 65, 0.95)' : '#ffffff'}`,
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
            },
          },
          '::-webkit-scrollbar-corner': {
            backgroundColor: isDarkMode ? 'rgba(45, 45, 65, 0.95)' : '#ffffff',
          },
          scrollbarWidth: 'auto',
          scrollbarColor: isDarkMode ? 'rgba(255, 255, 255, 0.4) rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.4) rgba(0, 0, 0, 0.1)',
        }}
      >
        <Table 
          sx={{ 
            minWidth: '3000px',
            width: 'max-content',
            '& .MuiTableCell-root': {
              color: isDarkMode ? '#ffffff' : '#000000',
              borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              padding: '12px 8px',
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            },
            '& .MuiTableHead-root .MuiTableCell-root': {
              position: 'sticky',
              top: 0,
              zIndex: 10,
              backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.98)' : '#ffffff',
              fontWeight: 600,
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
          <colgroup>
            <col style={{ width: '120px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '180px' }} />
            <col style={{ width: '150px' }} />
            <col style={{ width: '160px' }} />
            <col style={{ width: '150px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '140px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '140px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '150px' }} />
            <col style={{ width: '110px' }} />
            <col style={{ width: '110px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '100px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '120px' }} />
            <col style={{ width: '140px' }} />
          </colgroup>
          <TableHead>
            <TableRow>
              <SortableTableCell 
                isDarkMode={isDarkMode}
                sortField={sortField}
                currentField="orderNumber"
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                {t('orders.orderNumber')}
              </SortableTableCell>
              <StyledTableCell isDarkMode={isDarkMode}>{t('orders.documents') || 'Dokumenty'}</StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode}>{t('orders.customer')}</StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode}>{t('orders.contactPerson')}</StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode}>Dopravca</StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode}>Kontakt dopravcu</StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode}>ŠPZ</StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode}>{t('orders.loading')}</StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode}>{t('orders.loadingTime')}</StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode}>{t('orders.unloading')}</StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode}>{t('orders.unloadingTime')}</StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode}>{t('orders.goods')}</StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode} sx={{ color: '#ff9f43', fontWeight: 'bold' }}>{t('orders.customerPrice')}</StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode} sx={{ color: '#1976d2', fontWeight: 'bold' }}>{t('orders.carrierPrice')}</StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode} sx={{ color: '#2ecc71', fontWeight: 'bold' }}>{t('orders.profit')}</StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode}>Hodnotenie</StyledTableCell>
              <StyledTableCell isDarkMode={isDarkMode}>{t('orders.dispatcher')}</StyledTableCell>
              <SortableTableCell 
                isDarkMode={isDarkMode}
                sortField={sortField}
                currentField="createdAt"
                sortDirection={sortDirection}
                onSort={handleSort}
              >
                {t('orders.creationDate')}
              </SortableTableCell>
              <StyledTableCell isDarkMode={isDarkMode}>{t('orders.actions')}</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedOrders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                isDarkMode={isDarkMode}
                teamMembers={teamMembers}
                isSelected={selectedRowId === order.id}
                onRowClick={handleRowClick}
                onShowDetail={handleShowOrderDetail}
                onEditOrder={handleEditOrder}
                onDuplicateOrder={handleDuplicateOrder}
                onPreviewPDF={handlePreviewPDFForTable}
                onDownloadPDF={handleDownloadPDFForTable}
                onDeleteOrder={openDeleteConfirmation}
                onRateOrder={handleOpenOrderRating}
                t={t}
                getOrderAverageRating={getOrderAverageRating}
              />
            ))}
            {getFilteredCustomerOrders().length === 0 && (
              <TableRow>
                <TableCell colSpan={19} align="center">
                  {t('orders.noOrdersFound')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      {/* Fixný footer s prepočtami a pagination */}
      <Box 
        sx={{ 
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.98)' : '#f5f5f5',
          borderTop: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          display: 'flex',
          flexDirection: 'column',
          minHeight: '120px',
          borderBottomLeftRadius: '20px',
          borderBottomRightRadius: '20px',
        }}
      >
        {/* Súhrn štatistík */}
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-around', 
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          {(() => {
            const stats = calculateOrderStats();
            return (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: isDarkMode ? '#ffffff' : '#000000' }}>
                    Počet objednávok:
                  </Typography>
                  <Chip 
                    label={stats.count}
                    size="small"
                    sx={{ 
                      backgroundColor: '#2196f3',
                      color: '#ffffff',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#ff9f43' }}>
                    Suma zákazník:
                  </Typography>
                  <Chip 
                    label={`${stats.totalCustomerPrice.toFixed(2)} €`}
                    size="small"
                    sx={{ 
                      backgroundColor: '#ff9f43',
                      color: '#ffffff',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
                    Suma dopravca:
                  </Typography>
                  <Chip 
                    label={`${stats.totalCarrierPrice.toFixed(2)} €`}
                    size="small"
                    sx={{ 
                      backgroundColor: '#1976d2',
                      color: '#ffffff',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#2ecc71' }}>
                    Celkový zisk:
                  </Typography>
                  <Chip 
                    label={`${stats.totalProfit.toFixed(2)} €`}
                    size="small"
                    sx={{ 
                      backgroundColor: stats.totalProfit >= 0 ? '#2ecc71' : '#e74c3c',
                      color: '#ffffff',
                      fontWeight: 'bold'
                    }}
                  />
                </Box>
              </>
            );
          })()}
        </Box>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={getFilteredCustomerOrders().length}
          page={ordersPage}
          onPageChange={(e: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => setOrdersPage(newPage)}
          rowsPerPage={ordersRowsPerPage}
          onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setOrdersRowsPerPage(parseInt(e.target.value, 10));
            setOrdersPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          labelRowsPerPage={t('business.rowsPerPage')}
          sx={{
            '& .MuiTablePagination-root': {
              color: isDarkMode ? '#ffffff' : '#000000',
            },
            '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
              color: isDarkMode ? '#ffffff' : '#000000',
            },
            '& .MuiSelect-select': {
              color: isDarkMode ? '#ffffff' : '#000000',
            },
            '& .MuiIconButton-root': {
              color: isDarkMode ? '#ffffff' : '#000000',
            }
          }}
        />
      </Box>
    </Box>
  );
};

export default OrdersTable; 