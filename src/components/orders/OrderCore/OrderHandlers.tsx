import { useCallback } from 'react';
import { convertToDate, type OrderFormData } from './OrderComponents';
import { DOCUMENT_TYPE_CONFIG } from '../../../types/documents';

// Hook pre order handler funkcie
export const useOrderHandlers = (
  orders: OrderFormData[],
  searchQuery: string,
  documentFilter: string,
  orderDocuments: Record<string, any[]>,
  teamMembers: Record<string, any>,
  sortField: 'orderNumber' | 'createdAt' | null,
  sortDirection: 'asc' | 'desc',
  setSortField: (field: 'orderNumber' | 'createdAt' | null) => void,
  setSortDirection: (direction: 'asc' | 'desc') => void,
  setTabValue: (value: number) => void,
  setSelectedOrderId: (id: string | null) => void,
  setShowDeleteConfirm: (show: boolean) => void,
  setSelectedOrder: (order: OrderFormData | null) => void,
  setIsEditMode: (mode: boolean) => void,
  setShowNewOrderWizard: (show: boolean) => void,
  _handleDeleteOrder: (id: string) => Promise<void>
) => {

  const handleTabChange = useCallback((event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, [setTabValue]);

  const handleSort = useCallback((field: 'orderNumber' | 'createdAt') => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        // Tretí klik - resetujeme zoradenie
        setSortField(null);
        setSortDirection('desc');
        localStorage.removeItem('orders-sort-field');
        localStorage.removeItem('orders-sort-direction');
      } else {
        // Druhý klik - zmeníme smer na vzostupný
        setSortDirection('asc');
        localStorage.setItem('orders-sort-direction', 'asc');
      }
    } else {
      // Prvý klik na nový stĺpec - nastavíme zostupné zoradenie
      setSortField(field);
      setSortDirection('desc');
      localStorage.setItem('orders-sort-field', field);
      localStorage.setItem('orders-sort-direction', 'desc');
    }
  }, [sortField, sortDirection, setSortField, setSortDirection]);

  const filteredOrders = useCallback(() => {
    return orders.filter(order => {
      if (!order) return false;
      
      const searchTermLower = searchQuery.toLowerCase();
      const kontaktnaOsoba = (order as any).kontaktnaOsoba || 
            `${order.customerContactName || ''} ${order.customerContactSurname || ''}`.trim();
      const spediterName = (order as any).createdByName || 
            (order.createdBy && teamMembers[order.createdBy] ? teamMembers[order.createdBy].name : '');
      const orderNumber = (order as any).orderNumberFormatted || '';
      
      const matchesSearch = 
        order.customerCompany?.toLowerCase().includes(searchTermLower) ||
        kontaktnaOsoba.toLowerCase().includes(searchTermLower) ||
        spediterName.toLowerCase().includes(searchTermLower) ||
        orderNumber.toLowerCase().includes(searchTermLower) ||
        order.customerVatId?.toLowerCase().includes(searchTermLower) ||
        order.carrierCompany?.toLowerCase().includes(searchTermLower) ||
        order.carrierContact?.toLowerCase().includes(searchTermLower) ||
        order.carrierVehicleReg?.toLowerCase().includes(searchTermLower) ||
        order.loadingPlaces?.[0]?.city?.toLowerCase().includes(searchTermLower) ||
        order.loadingPlaces?.some(place => 
          place.contactPersonName?.toLowerCase().includes(searchTermLower) ||
          place.contactPersonPhone?.toLowerCase().includes(searchTermLower)
        ) ||
        order.unloadingPlaces?.[0]?.city?.toLowerCase().includes(searchTermLower) ||
        order.unloadingPlaces?.some(place => 
          place.contactPersonName?.toLowerCase().includes(searchTermLower) ||
          place.contactPersonPhone?.toLowerCase().includes(searchTermLower)
        ) ||
        order.id?.toLowerCase().includes(searchTermLower);

      // Filter pre dokumenty - ak je nastavený dokumentový filter
      if (documentFilter && order.id) {
        const orderDocs = orderDocuments[order.id] || [];
        const hasMatchingDocument = orderDocs.some((doc: any) => {
          const documentTypeLabel = DOCUMENT_TYPE_CONFIG[doc.type as keyof typeof DOCUMENT_TYPE_CONFIG]?.label || '';
          return documentTypeLabel.toLowerCase().includes(documentFilter.toLowerCase());
        });
        
        if (!hasMatchingDocument) {
          return false;
        }
      }
        
      return matchesSearch;
    });
  }, [orders, searchQuery, documentFilter, orderDocuments, teamMembers]);

  const getFilteredCustomerOrders = useCallback(() => {
    let filtered = filteredOrders().filter(order => {
      // Filter pre zákazníkov - zobrazujeme len objednávky, ktoré majú zákazníka (customerCompany) alebo (zakaznik)
      return (order.customerCompany || (order as any).zakaznik);
    });

    // Aplikujeme sorting ak je nastavený
    if (sortField) {
      filtered = filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (sortField === 'orderNumber') {
          // Porovnávame číselné hodnoty order number
          aValue = parseInt((a as any).orderNumberFormatted?.replace(/\D/g, '') || '0');
          bValue = parseInt((b as any).orderNumberFormatted?.replace(/\D/g, '') || '0');
        } else if (sortField === 'createdAt') {
          // Porovnávame dátumy
          aValue = convertToDate(a.createdAt)?.getTime() || 0;
          bValue = convertToDate(b.createdAt)?.getTime() || 0;
        }

        if (sortDirection === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      });
    }

    return filtered;
  }, [filteredOrders, sortField, sortDirection]);

  const calculateOrderStats = useCallback(() => {
    const filteredOrders = getFilteredCustomerOrders();
    const count = filteredOrders.length;
    
    const totalCustomerPrice = filteredOrders.reduce((sum, order) => {
      const price = parseFloat(order.customerPrice || (order as any).suma || '0');
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
    
    const totalCarrierPrice = filteredOrders.reduce((sum, order) => {
      const price = parseFloat(order.carrierPrice || '0');
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
    
    const totalProfit = totalCustomerPrice - totalCarrierPrice;
    
    return {
      count,
      totalCustomerPrice,
      totalCarrierPrice,
      totalProfit
    };
  }, [getFilteredCustomerOrders]);

  const openDeleteConfirmation = useCallback((id: string) => {
    setSelectedOrderId(id);
    setShowDeleteConfirm(true);
  }, [setSelectedOrderId, setShowDeleteConfirm]);

  const handleDeleteConfirmed = useCallback(async () => {
    // Táto funkcia bude potrebovať selectedOrderId z parent komponentu
    // Implementácia bude v parent komponente
  }, []);

  const handleDeleteCancel = useCallback(() => {
    setShowDeleteConfirm(false);
    setSelectedOrderId(null);
  }, [setShowDeleteConfirm, setSelectedOrderId]);

  const handleEditOrder = useCallback((order: OrderFormData) => {
    const modifiedOrder = {
      ...order,
      zakaznik: order.customerCompany || '',
      kontaktnaOsoba: `${order.customerContactName || ''} ${order.customerContactSurname || ''}`.trim(),
      suma: order.customerPrice || '',
      mena: 'EUR',
    };
    
    setSelectedOrder(modifiedOrder);
    setIsEditMode(true);
    setShowNewOrderWizard(true);
  }, [setSelectedOrder, setIsEditMode, setShowNewOrderWizard]);

  const handleDuplicateOrder = useCallback((order: OrderFormData) => {
    // Hlbšia kópia objednávky pre duplikovanie
    const duplicatedOrder: OrderFormData = {
      ...order,
      // Resetujeme všetky ID a časové značky
      id: undefined,
      createdAt: undefined,
      updatedAt: undefined,
      orderNumber: undefined,
      orderNumberFormatted: undefined,
      
      // Mapujeme polia pre kompatibilitu s formulárom
      zakaznik: order.customerCompany || '',
      kontaktnaOsoba: `${order.customerContactName || ''} ${order.customerContactSurname || ''}`.trim(),
      suma: order.customerPrice || '',
      mena: 'EUR',
      
      // Hlbšia kópia loading places s resetovanými ID
      loadingPlaces: order.loadingPlaces ? order.loadingPlaces.map(place => ({
        ...place,
        id: '', // Reset ID pre nové miesto
      })) : [],
      
      // Hlbšia kópia unloading places s resetovanými ID
      unloadingPlaces: order.unloadingPlaces ? order.unloadingPlaces.map(place => ({
        ...place,
        id: '', // Reset ID pre nové miesto
      })) : [],
    };
    
    setSelectedOrder(duplicatedOrder);
    setIsEditMode(false); // Pre duplikovanie nastavíme na false (nová objednávka)
    setShowNewOrderWizard(true);
  }, [setSelectedOrder, setIsEditMode, setShowNewOrderWizard]);

  return {
    handleTabChange,
    handleSort,
    filteredOrders: filteredOrders(),
    getFilteredCustomerOrders,
    calculateOrderStats,
    openDeleteConfirmation,
    handleDeleteConfirmed,
    handleDeleteCancel,
    handleEditOrder,
    handleDuplicateOrder
  };
}; 