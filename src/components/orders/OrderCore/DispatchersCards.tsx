import React from 'react';
import { Box, Typography } from '@mui/material';

interface Dispatcher {
  id: string;
  name: string;
  email?: string;
  totalProfit: number;
  avgProfitMargin: number;
}

interface DispatchersCardsProps {
  dispatchers: Dispatcher[];
  dispatcherSearchQuery: string;
  isDarkMode: boolean;
}

const DispatchersCards: React.FC<DispatchersCardsProps> = ({
  dispatchers,
  dispatcherSearchQuery,
  isDarkMode
}) => {
  const filteredDispatchers = dispatchers
    .filter(dispatcher => {
      const searchLower = dispatcherSearchQuery.toLowerCase();
      return (
        dispatcher.name?.toLowerCase().includes(searchLower) ||
        dispatcher.email?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => b.totalProfit - a.totalProfit);

  if (filteredDispatchers.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h6" sx={{ mb: 3, color: '#ff9f43', fontWeight: 600, textAlign: 'center' }}>
        🏆 Výkonnostný rebríček špeditérov
      </Typography>
      
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 2, 
        justifyContent: 'center',
        alignItems: 'flex-end',
        minHeight: '200px',
        p: 2,
        background: isDarkMode 
          ? 'linear-gradient(135deg, rgba(28, 28, 45, 0.6) 0%, rgba(40, 40, 65, 0.8) 100%)'
          : 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(240, 240, 255, 0.9) 100%)',
        borderRadius: '20px',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
        backdropFilter: 'blur(10px)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Pozadie s dekoratívnymi prvkami */}
        <Box sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `radial-gradient(circle at 20% 50%, rgba(255, 159, 67, 0.1) 0%, transparent 50%), 
                      radial-gradient(circle at 80% 20%, rgba(46, 204, 113, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 40% 80%, rgba(52, 152, 219, 0.1) 0%, transparent 50%)`,
          zIndex: 0
        }} />
        
        {filteredDispatchers.map((dispatcher, index) => {
          // Vypočítame veľkosť karty na základe zisku (relatívne k najlepšiemu)
          const maxProfit = Math.max(...dispatchers.map(d => d.totalProfit));
          const minProfit = Math.min(...dispatchers.map(d => d.totalProfit));
          const profitRange = maxProfit - minProfit;
          
          // Veľkosť od 80px do 160px
          const minSize = 80;
          const maxSize = 160;
          const cardSize = profitRange > 0 
            ? minSize + ((dispatcher.totalProfit - minProfit) / profitRange) * (maxSize - minSize)
            : minSize;
          
          // Farby podľa pozície
          const getCardColor = (index: number) => {
            if (index === 0) return { bg: '#ffd700', text: '#000', emoji: '🥇' }; // Zlato
            if (index === 1) return { bg: '#c0c0c0', text: '#000', emoji: '🥈' }; // Striebro  
            if (index === 2) return { bg: '#cd7f32', text: '#fff', emoji: '🥉' }; // Bronz
            return { bg: '#ff9f43', text: '#fff', emoji: '💼' }; // Ostatní
          };
          
          const cardStyle = getCardColor(index);
          
          return (
            <Box
              key={dispatcher.id}
              sx={{
                width: `${cardSize}px`,
                height: `${cardSize}px`,
                borderRadius: '20px',
                background: `linear-gradient(135deg, ${cardStyle.bg} 0%, ${cardStyle.bg}dd 100%)`,
                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                zIndex: 1,
                '&:hover': {
                  transform: 'translateY(-8px) scale(1.05)',
                  boxShadow: '0 15px 35px rgba(0, 0, 0, 0.25)',
                  zIndex: 10
                }
              }}
            >
              {/* Pozícia badge */}
              <Box sx={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: isDarkMode ? 'rgba(28, 28, 45, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: 'bold',
                color: isDarkMode ? '#ffffff' : '#000000',
                border: `2px solid ${cardStyle.bg}`
              }}>
                #{index + 1}
              </Box>
              
              {/* Emoji a meno */}
              <Box sx={{ textAlign: 'center', color: cardStyle.text }}>
                <Typography sx={{ fontSize: `${Math.max(20, cardSize * 0.15)}px`, mb: 0.5 }}>
                  {cardStyle.emoji}
                </Typography>
                <Typography sx={{ 
                  fontSize: `${Math.max(10, cardSize * 0.08)}px`, 
                  fontWeight: 'bold',
                  lineHeight: 1.2,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: `${cardSize - 20}px`
                }}>
                  {dispatcher.name}
                </Typography>
                
                {/* Zisk */}
                <Typography sx={{ 
                  fontSize: `${Math.max(8, cardSize * 0.06)}px`, 
                  fontWeight: 600,
                  mt: 0.5,
                  opacity: 0.9
                }}>
                  {dispatcher.totalProfit.toFixed(0)} €
                </Typography>
                
                {/* Marža */}
                <Typography sx={{ 
                  fontSize: `${Math.max(6, cardSize * 0.05)}px`, 
                  fontWeight: 500,
                  opacity: 0.8
                }}>
                  {dispatcher.avgProfitMargin.toFixed(1)}%
                </Typography>
              </Box>
              
              {/* Efekt lesku */}
              <Box sx={{
                position: 'absolute',
                top: '10%',
                left: '10%',
                right: '60%',
                bottom: '60%',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%)',
                borderRadius: '20px',
                pointerEvents: 'none'
              }} />
            </Box>
          );
        })}
      </Box>
      
      {/* Legenda */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="body2" sx={{ 
          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
          fontSize: '0.75rem'
        }}>
          💡 Veľkosť karty = výška zisku | Pozícia = celkový výkon | Hover pre detail
        </Typography>
      </Box>
    </Box>
  );
};

export default DispatchersCards; 