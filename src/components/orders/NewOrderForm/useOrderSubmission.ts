import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../firebase';
import { OrderFormData } from '../../../types/orders';

export const useOrderSubmission = () => {
    // Funkcia na generovanie PDF
    const generatePDF = async (orderData: OrderFormData & { id: string }) => {
        try {
            // Volanie serverovej funkcie pre generovanie PDF
            const generatePdf = httpsCallable(functions, 'generateOrderPdf');
            const result = await generatePdf({ orderId: orderData.id });
            
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
            link.download = fileName || `objednavka_${orderData.id.substring(0, 8)}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Chyba pri generovaní PDF:', error);
            throw new Error('Nastala chyba pri generovaní PDF objednávky: ' + (error as Error).message);
        }
    };

    return {
        generatePDF
    };
}; 