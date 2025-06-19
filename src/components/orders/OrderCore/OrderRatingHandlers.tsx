import { useCallback } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebase';
import { Customer, CustomerRating } from '../../../types/customers';
import { Carrier, CarrierRating } from '../../../types/carriers';
import { OrderRating } from '../../../types/orders';
import { type OrderFormData } from './OrderComponents';

// Hook pre rating handler funkcie
export const useRatingHandlers = (
  setSelectedCustomerForRating: (customer: Customer | null) => void,
  setShowCustomerRatingDialog: (show: boolean) => void,
  setSelectedCarrierForRating: (carrier: Carrier | null) => void,
  setShowCarrierRatingDialog: (show: boolean) => void,
  setSelectedOrderForRating: (order: OrderFormData | null) => void,
  setShowOrderRatingDialog: (show: boolean) => void,
  setOrders: (updater: (orders: OrderFormData[]) => OrderFormData[]) => void
) => {

  // Funkcie pre hodnotenie zákazníkov
  const handleOpenCustomerRating = useCallback((customer: Customer) => {
    setSelectedCustomerForRating(customer);
    setShowCustomerRatingDialog(true);
  }, [setSelectedCustomerForRating, setShowCustomerRatingDialog]);

  const handleCloseCustomerRating = useCallback(() => {
    setShowCustomerRatingDialog(false);
    setSelectedCustomerForRating(null);
  }, [setShowCustomerRatingDialog, setSelectedCustomerForRating]);

  const handleSubmitCustomerRating = useCallback(async (rating: CustomerRating, selectedCustomer?: Customer) => {
    const customerId = selectedCustomer?.id;
    if (!customerId) return;
    
    try {
      const customerRef = doc(db, 'customers', customerId);
      await updateDoc(customerRef, { rating });
      console.log('✅ Hodnotenie zákazníka bolo úspešne uložené');
    } catch (error) {
      console.error('❌ Chyba pri ukladaní hodnotenia zákazníka:', error);
      alert('Nastala chyba pri ukladaní hodnotenia: ' + (error as Error).message);
    }
  }, []);

  // Funkcie pre hodnotenie dopravcov
  const handleOpenCarrierRating = useCallback((carrier: Carrier) => {
    setSelectedCarrierForRating(carrier);
    setShowCarrierRatingDialog(true);
  }, [setSelectedCarrierForRating, setShowCarrierRatingDialog]);

  const handleCloseCarrierRating = useCallback(() => {
    setSelectedCarrierForRating(null);
    setShowCarrierRatingDialog(false);
  }, [setSelectedCarrierForRating, setShowCarrierRatingDialog]);

  const handleSubmitCarrierRating = useCallback(async (rating: CarrierRating, selectedCarrier?: Carrier) => {
    const carrierId = selectedCarrier?.id;
    if (!carrierId) return;
    
    try {
      const carrierRef = doc(db, 'carriers', carrierId);
      await updateDoc(carrierRef, { rating });
      console.log('✅ Hodnotenie dopravcu bolo úspešne uložené');
    } catch (error) {
      console.error('❌ Chyba pri ukladaní hodnotenia dopravcu:', error);
      alert('Nastala chyba pri ukladaní hodnotenia: ' + (error as Error).message);
    }
  }, []);

  // Funkcie pre hodnotenie objednávok
  const handleOpenOrderRating = useCallback((order: OrderFormData) => {
    setSelectedOrderForRating(order);
    setShowOrderRatingDialog(true);
  }, [setSelectedOrderForRating, setShowOrderRatingDialog]);

  const handleCloseOrderRating = useCallback(() => {
    setSelectedOrderForRating(null);
    setShowOrderRatingDialog(false);
  }, [setSelectedOrderForRating, setShowOrderRatingDialog]);

  const handleSubmitOrderRating = useCallback(async (rating: OrderRating, selectedOrder?: OrderFormData) => {
    const orderId = selectedOrder?.id;
    if (!orderId) return;
    
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        rating: rating
      });
      
      // Aktualizuj lokálny state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId 
            ? { ...order, rating: rating }
            : order
        )
      );
      
      console.log('✅ Hodnotenie objednávky uložené úspešne');
    } catch (error) {
      console.error('❌ Chyba pri ukladaní hodnotenia objednávky:', error);
      alert('Nastala chyba pri ukladaní hodnotenia: ' + (error as Error).message);
    }
  }, [setOrders]);

  // Pomocné funkcie pre výpočet priemerného hodnotenia
  const getCustomerAverageRating = useCallback((customer: Customer): number => {
    if (!customer.rating) return 0;
    const { paymentReliability, communication, overallSatisfaction } = customer.rating;
    if (paymentReliability === 0 && communication === 0 && overallSatisfaction === 0) return 0;
    return Math.round((paymentReliability + communication + overallSatisfaction) / 3);
  }, []);

  const getCarrierAverageRating = useCallback((carrier: Carrier): number => {
    if (!carrier.rating) return 0;
    const { reliability, communication, serviceQuality, timeManagement } = carrier.rating;
    if (reliability === 0 && communication === 0 && serviceQuality === 0 && timeManagement === 0) return 0;
    return Math.round((reliability + communication + serviceQuality + timeManagement) / 4);
  }, []);

  const getOrderAverageRating = useCallback((order: OrderFormData): number => {
    if (!order.rating) return 0;
    return order.rating.overallTransportRating || 0;
  }, []);

  return {
    handleOpenCustomerRating,
    handleCloseCustomerRating,
    handleSubmitCustomerRating,
    handleOpenCarrierRating,
    handleCloseCarrierRating,
    handleSubmitCarrierRating,
    handleOpenOrderRating,
    handleCloseOrderRating,
    handleSubmitOrderRating,
    getCustomerAverageRating,
    getCarrierAverageRating,
    getOrderAverageRating
  };
}; 