import React from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

interface StarRatingProps {
    value: number;
    onChange?: (rating: number) => void;
    readonly?: boolean;
    showLabel?: boolean;
    label?: string;
    size?: 'small' | 'medium' | 'large';
    color?: string;
}

const StarRating: React.FC<StarRatingProps> = ({
    value,
    onChange,
    readonly = false,
    showLabel = false,
    label,
    size = 'medium',
    color = '#ffd700'
}) => {
    const starSize = {
        small: 16,
        medium: 20,
        large: 24
    };

    const handleStarClick = (rating: number) => {
        if (!readonly && onChange) {
            onChange(rating);
        }
    };

    const getRatingText = (rating: number): string => {
        if (rating === 0) return 'Nehodnotené';
        if (rating <= 2) return 'Problematický';
        if (rating <= 4) return 'Dobrý';
        return 'Výborný';
    };

    const getRatingColor = (rating: number): string => {
        if (rating === 0) return '#gray';
        if (rating <= 2) return '#f44336'; // červená
        if (rating <= 4) return '#ff9800'; // oranžová
        return '#4caf50'; // zelená
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {showLabel && label && (
                <Typography variant="body2" sx={{ minWidth: 120, fontSize: 12 }}>
                    {label}:
                </Typography>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = star <= value;
                    return (
                        <Tooltip 
                            key={star} 
                            title={readonly ? getRatingText(value) : `${star} hviezdičie${star > 1 ? 'k' : 'a'}`}
                        >
                            <IconButton
                                size="small"
                                onClick={() => handleStarClick(star)}
                                disabled={readonly}
                                sx={{
                                    padding: 0.2,
                                    '&:hover': readonly ? {} : { 
                                        backgroundColor: 'rgba(255, 215, 0, 0.1)' 
                                    }
                                }}
                            >
                                {isFilled ? (
                                    <StarIcon 
                                        sx={{ 
                                            fontSize: starSize[size], 
                                            color: readonly ? getRatingColor(value) : color 
                                        }} 
                                    />
                                ) : (
                                    <StarBorderIcon 
                                        sx={{ 
                                            fontSize: starSize[size], 
                                            color: readonly ? '#e0e0e0' : '#e0e0e0' 
                                        }} 
                                    />
                                )}
                            </IconButton>
                        </Tooltip>
                    );
                })}
                {readonly && (
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            ml: 1, 
                            color: getRatingColor(value),
                            fontWeight: 600,
                            fontSize: 11
                        }}
                    >
                        {getRatingText(value)}
                    </Typography>
                )}
            </Box>
        </Box>
    );
};

export default StarRating; 