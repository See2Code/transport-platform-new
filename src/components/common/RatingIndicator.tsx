import React from 'react';
import { Box, Typography, Chip, Rating } from '@mui/material';
import { styled } from '@mui/material/styles';

interface RatingIndicatorProps {
    rating: number; // 0-5
    size?: 'small' | 'medium' | 'large';
    showChip?: boolean;
    showStars?: boolean;
    showValue?: boolean;
}

const StyledRating = styled(Rating)(() => ({
    '& .MuiRating-iconFilled': {
        color: '#ff9f43',
    },
    '& .MuiRating-iconEmpty': {
        color: 'rgba(255, 159, 67, 0.2)',
    }
}));

const RatingIndicator: React.FC<RatingIndicatorProps> = ({
    rating,
    size = 'medium',
    showChip = true,
    showStars = true,
    showValue = false
}) => {
    const getRatingColor = (rating: number): string => {
        if (rating === 0) return '#9e9e9e'; // gray
        if (rating <= 2) return '#f44336'; // red
        if (rating <= 3.5) return '#ff9800'; // orange
        return '#4caf50'; // green
    };

    const getRatingLabel = (rating: number): string => {
        if (rating === 0) return 'Nehodnotené';
        if (rating <= 2) return 'Problematický';
        if (rating <= 3.5) return 'Dobrý';
        return 'Výborný';
    };

    const getStarSize = (size: string): 'small' | 'medium' | 'large' => {
        switch (size) {
            case 'small': return 'small';
            case 'large': return 'large';
            default: return 'medium';
        }
    };

    const getChipSize = (size: string): 'small' | 'medium' => {
        return size === 'small' ? 'small' : 'medium';
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'nowrap' }}>
            {/* Farebná bodka indikátor */}
            <Box
                sx={{
                    width: size === 'small' ? 8 : size === 'large' ? 12 : 10,
                    height: size === 'small' ? 8 : size === 'large' ? 12 : 10,
                    borderRadius: '50%',
                    backgroundColor: getRatingColor(rating),
                    boxShadow: `0 0 0 2px ${getRatingColor(rating)}20`
                }}
            />

            {/* Hviezdičky */}
            {showStars && (
                <StyledRating
                    value={rating}
                    readOnly
                    precision={0.1}
                    size={getStarSize(size)}
                />
            )}

            {/* Číselná hodnota */}
            {showValue && (
                <Typography 
                    variant={size === 'small' ? 'caption' : 'body2'} 
                    sx={{ 
                        fontWeight: 600, 
                        color: getRatingColor(rating),
                        minWidth: '24px'
                    }}
                >
                    {rating.toFixed(1)}
                </Typography>
            )}

            {/* Chip s labelom */}
            {showChip && (
                <Chip
                    label={getRatingLabel(rating)}
                    size={getChipSize(size)}
                    sx={{
                        backgroundColor: `${getRatingColor(rating)}20`,
                        color: getRatingColor(rating),
                        fontWeight: 600,
                        fontSize: size === 'small' ? '0.7rem' : '0.75rem',
                        whiteSpace: 'nowrap'
                    }}
                />
            )}
        </Box>
    );
};

export default RatingIndicator; 