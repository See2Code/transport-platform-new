import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Box, Chip, Stack } from '@mui/material';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { DOCUMENT_TYPE_CONFIG, DocumentType } from '../../types/documents';
import type { OrderDocument } from '../../types/documents';
import BareTooltip from '../common/BareTooltip';

interface DocumentsIndicatorProps {
  orderId: string;
}

const DocumentsIndicator: React.FC<DocumentsIndicatorProps> = ({ orderId }) => {
  const { userData } = useAuth();
  const [documents, setDocuments] = useState<OrderDocument[]>([]);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Memoizujem kompajnID aby sa useEffect nespúšťal zbytočne
  const companyID = useMemo(() => userData?.companyID, [userData?.companyID]);

  useEffect(() => {
    // Ak nie sú potrebné údaje, resetuj a skonči
    if (!orderId || !companyID) {
      setDocuments([]);
      // Cleanup existujúceho listenera
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      return;
    }

    // Cleanup predchádzajúceho listenera ak existuje
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const documentsRef = collection(db, 'orderDocuments');
    const q = query(
      documentsRef,
      where('orderId', '==', orderId),
      where('companyID', '==', companyID)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as OrderDocument[];
      
      // Optimalizácia: Porovnaj nové dokumenty s existujúcimi
      setDocuments(prevDocs => {
        // Ak sa počet dokumentov nezmenil a ID sú rovnaké, skontroluj obsah
        if (prevDocs.length === docs.length && docs.length > 0) {
          const prevIds = prevDocs.map(d => d.id).sort();
          const newIds = docs.map(d => d.id).sort();
          const idsChanged = prevIds.length !== newIds.length || 
                            prevIds.some((id, index) => id !== newIds[index]);
          
          // Ak sa ID nezmenili, skontroluj obsah dokumentov (typ, názov)
          if (!idsChanged) {
            const contentChanged = docs.some(newDoc => {
              const prevDoc = prevDocs.find(p => p.id === newDoc.id);
              return !prevDoc || 
                     prevDoc.type !== newDoc.type || 
                     prevDoc.name !== newDoc.name ||
                     prevDoc.updatedAt?.seconds !== newDoc.updatedAt?.seconds;
            });
            
            if (!contentChanged) {
              return prevDocs; // Vráť existujúce dokumenty bez zmeny
            }
          }
        }
        
        return docs;
      });
    }, (err) => {
      console.error('Chyba pri načítaní dokumentov pre indikátor:', err);
    });

    // Ulož unsubscribe funkciu do ref
    unsubscribeRef.current = unsubscribe;

    // Cleanup funkcia
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [orderId, companyID]); // Použijem memoizovaný companyID

  // Memoizuj groupedDocs aby sa nepočítali zbytočne
  const groupedDocs = useMemo(() => {
    return documents.reduce((acc, doc) => {
      const type = doc.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(doc);
      return acc;
    }, {} as Record<DocumentType, OrderDocument[]>);
  }, [documents]);

  if (!documents || documents.length === 0) {
    return null;
  }

  return (
    <Stack direction="row" spacing={0.5} alignItems="center">
      {Object.entries(groupedDocs).map(([type, docs]) => {
        const config = DOCUMENT_TYPE_CONFIG[type as DocumentType];
        const count = docs.length;

        if (!config) return null;

        // Tooltip text
        const tooltipText = count > 1 
          ? `${config.label} (${count}x)`
          : config.label;

        return (
          <BareTooltip key={type} title={tooltipText} placement="bottom">
            <Box
              sx={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                cursor: 'pointer'
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  backgroundColor: config.color,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                  transition: 'all 0.2s ease-in-out' // Smooth transitions
                }}
              >
                {config.icon}
              </Box>
              {count > 1 && (
                <Chip
                  label={count}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    minWidth: 18,
                    height: 18,
                    fontSize: '0.65rem',
                    fontWeight: 'bold',
                    backgroundColor: 'error.main',
                    color: 'white',
                    transition: 'all 0.2s ease-in-out', // Smooth transitions
                    '& .MuiChip-label': {
                      px: 0.5
                    }
                  }}
                />
              )}
            </Box>
          </BareTooltip>
        );
      })}
    </Stack>
  );
};

export default React.memo(DocumentsIndicator); 