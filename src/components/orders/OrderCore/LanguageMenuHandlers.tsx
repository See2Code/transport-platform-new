import React from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase';
import { OrderFormData } from './OrderComponents';

// Hook pre handling jazykového menu a PDF operácie s jazykom
export const useLanguageMenuHandlers = (
  setLanguageMenuAnchor: (anchor: HTMLElement | null) => void,
  setOrderForLanguageSelection: (order: OrderFormData | null) => void,
  setLanguageMenuAction: (action: 'preview' | 'download') => void,
  setShowLanguageMenu: (show: boolean) => void,
  setShowPdfLoadingDialog: (show: boolean) => void,
  setPdfLoadingMessage: (message: string) => void,
  setLoadingPdf: (loading: boolean) => void,
  setPreviewOrder: (order: OrderFormData | null) => void,
  setPdfUrl: (url: string | null) => void,
  setShowPdfPreview: (show: boolean) => void,
  setLoading: (loading: boolean) => void
) => {

  const handleShowLanguageMenu = (event: React.MouseEvent<HTMLElement>, order: OrderFormData, action: 'preview' | 'download') => {
    event.stopPropagation();
    setLanguageMenuAnchor(event.currentTarget);
    setOrderForLanguageSelection(order);
    setLanguageMenuAction(action);
    setShowLanguageMenu(true);
  };

  const handleCloseLanguageMenu = () => {
    setShowLanguageMenu(false);
    setLanguageMenuAnchor(null);
    setOrderForLanguageSelection(null);
  };

  const handleLanguageSelect = async (
    language: 'sk' | 'en' | 'de' | 'cs' | 'pl',
    orderForLanguageSelection: OrderFormData | null,
    languageMenuAction: 'preview' | 'download',
    handlePreviewPDFWithLanguage: (order: OrderFormData, language: 'sk' | 'en' | 'de' | 'cs' | 'pl') => Promise<void>,
    handleDownloadPDFWithLanguage: (order: OrderFormData, language: 'sk' | 'en' | 'de' | 'cs' | 'pl') => Promise<void>
  ) => {
    if (!orderForLanguageSelection) return;
    
    handleCloseLanguageMenu();
    
    if (languageMenuAction === 'preview') {
      await handlePreviewPDFWithLanguage(orderForLanguageSelection, language);
    } else {
      await handleDownloadPDFWithLanguage(orderForLanguageSelection, language);
    }
  };

  const handlePreviewPDFWithLanguage = async (order: OrderFormData, language: 'sk' | 'en' | 'de' | 'cs' | 'pl' = 'sk') => {
    try {
      if (!order.id) {
        alert('Objednávka nemá priradené ID. Prosím, uložte objednávku a skúste znovu.');
        return;
      }
      
      // Zobraziť loading dialog
      setShowPdfLoadingDialog(true);
      setPdfLoadingMessage('Generujem PDF náhľad...');
      
      setLoadingPdf(true);
      setPreviewOrder(order);
      
      // Volanie serverovej funkcie pre generovanie PDF s jazykom
      const generatePdf = httpsCallable(functions, 'generateOrderPdf');
      const result = await generatePdf({ orderId: order.id, language });
      
      // @ts-ignore - výsledok obsahuje pdfBase64 a fileName
      const { pdfBase64 } = result.data;
      
      if (!pdfBase64) {
        throw new Error('PDF data not received from server');
      }
      
      // Konverzia base64 na Blob
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Vytvorenie URL pre blob
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      
      // Teraz otvoríme preview dialog keď je PDF pripravené
      setShowPdfPreview(true);
      setLoadingPdf(false);
      // Zavrieť loading dialog
      setShowPdfLoadingDialog(false);
    } catch (error) {
      console.error('Chyba pri generovaní náhľadu PDF:', error);
      alert('Nastala chyba pri generovaní PDF objednávky: ' + (error as Error).message);
      setLoadingPdf(false);
      setShowPdfPreview(false);
      // Zavrieť loading dialog aj pri chybe
      setShowPdfLoadingDialog(false);
    }
  };

  const handleDownloadPDFWithLanguage = async (order: OrderFormData, language: 'sk' | 'en' | 'de' | 'cs' | 'pl' = 'sk') => {
    try {
      if (!order.id) {
        alert('Objednávka nemá priradené ID. Prosím, uložte objednávku a skúste znovu.');
        return;
      }
      
      // Zobraziť loading dialog
      setShowPdfLoadingDialog(true);
      setPdfLoadingMessage('Generujem PDF na stiahnutie...');
      
      setLoading(true);
      
      // Volanie serverovej funkcie pre generovanie PDF s jazykom
      const generatePdf = httpsCallable(functions, 'generateOrderPdf');
      const result = await generatePdf({ orderId: order.id, language });
      
      // @ts-ignore - výsledok obsahuje pdfBase64 a fileName
      const { pdfBase64, fileName } = result.data;
      
      // Konverzia base64 na Blob
      const byteCharacters = atob(pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });
      
      // Vytvorenie URL a stiahnutie
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || `order_${order.orderNumber || order.id.substring(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setLoading(false);
      // Zavrieť loading dialog
      setShowPdfLoadingDialog(false);
    } catch (error) {
      console.error('Chyba pri sťahovaní PDF:', error);
      alert('Nastala chyba pri generovaní PDF objednávky: ' + (error as Error).message);
      setLoading(false);
      // Zavrieť loading dialog aj pri chybe
      setShowPdfLoadingDialog(false);
    }
  };

  // Wrapper funkcie pre tabuľku
  const handlePreviewPDFForTable = (event: React.MouseEvent<HTMLElement>, order: OrderFormData) => {
    handleShowLanguageMenu(event, order, 'preview');
  };

  const handleDownloadPDFForTable = (event: React.MouseEvent<HTMLElement>, order: OrderFormData) => {
    handleShowLanguageMenu(event, order, 'download');
  };

  return {
    handleShowLanguageMenu,
    handleCloseLanguageMenu,
    handleLanguageSelect,
    handlePreviewPDFWithLanguage,
    handleDownloadPDFWithLanguage,
    handlePreviewPDFForTable,
    handleDownloadPDFForTable
  };
}; 