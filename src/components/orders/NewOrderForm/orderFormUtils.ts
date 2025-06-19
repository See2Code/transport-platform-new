import { db } from '../../../firebase';
import { Timestamp, doc, runTransaction } from 'firebase/firestore';

export const generateOrderNumber = async (companyID: string | undefined) => {
    try {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0'); // 01-12
        const year = today.getFullYear();
        // Vytvoríme referenciu na dokument počítadla pre aktuálny mesiac a rok
        const counterDocRef = doc(db, 'counters', `orders_${companyID}_${year}_${month}`);
        // Použijeme transakciu na bezpečné atomické zvýšenie počítadla
        return await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterDocRef);
            let nextNumber = 1;
            if (counterDoc.exists()) {
                nextNumber = (counterDoc.data().currentValue || 0) + 1;
            }
            transaction.set(counterDocRef, {
                currentValue: nextNumber,
                companyID,
                month,
                year,
                lastUpdated: Timestamp.now()
            });
            const orderNumber = nextNumber.toString().padStart(4, '0');
            const orderNumberFormatted = `${orderNumber}/${month}/${year}`;
            return {
                formattedNumber: orderNumberFormatted,
                orderNumber: orderNumber,
                orderMonth: month,
                orderYear: year.toString()
            };
        });
    } catch (error) {
        console.error('Chyba pri generovaní čísla objednávky:', error);
        throw error;
    }
}; 