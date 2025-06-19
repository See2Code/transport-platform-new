import { ChangeEvent } from 'react';
import { SelectChangeEvent } from '@mui/material';
import { LoadingPlace, UnloadingPlace, GoodsItem, OrderFormData } from '../../../types/orders';
import { emptyGoodsItem } from './orderFormConstants';

export const useOrderPlacesHandlers = (
    formData: Partial<OrderFormData>,
    setFormData: (data: Partial<OrderFormData> | ((prev: Partial<OrderFormData>) => Partial<OrderFormData>)) => void
) => {
    const handleDateTimeChange = (type: 'loading' | 'unloading', index: number) => (date: Date | null) => {
        setFormData((prev: Partial<OrderFormData>) => {
            const places = type === 'loading' ? [...(prev.loadingPlaces || [])] : [...(prev.unloadingPlaces || [])];
            if (places[index]) {
                places[index] = { ...places[index], dateTime: date };
            }
            return type === 'loading' ? { ...prev, loadingPlaces: places } : { ...prev, unloadingPlaces: places };
        });
    };

    const handlePlaceInputChange = (type: 'loading' | 'unloading', index: number, field: keyof LoadingPlace | keyof UnloadingPlace) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData((prev: Partial<OrderFormData>) => {
            const places = type === 'loading' ? [...(prev.loadingPlaces || [])] : [...(prev.unloadingPlaces || [])];
            if (places[index]) {
                places[index] = { ...places[index], [field]: e.target.value };
            }
            return type === 'loading' ? { ...prev, loadingPlaces: places } : { ...prev, unloadingPlaces: places };
        });
    };

    const handlePlaceAutocompleteChange = (type: 'loading' | 'unloading', index: number, field: keyof LoadingPlace | keyof UnloadingPlace) => (event: any, newValue: { name: string, code: string } | null) => {
        setFormData((prev: Partial<OrderFormData>) => {
            const places = type === 'loading' ? [...(prev.loadingPlaces || [])] : [...(prev.unloadingPlaces || [])];
            if (places[index]) {
                places[index] = { ...places[index], [field]: newValue?.name || 'Slovensko' }; // Default to Slovensko if null
            }
            return type === 'loading' ? { ...prev, loadingPlaces: places } : { ...prev, unloadingPlaces: places };
        });
    };

    const handleGoodsChange = (type: 'loading' | 'unloading', placeIndex: number, goodsIndex: number, field: keyof GoodsItem) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
        const value = e.target.value;
        setFormData((prev: Partial<OrderFormData>) => {
            const places = type === 'loading' ? [...(prev.loadingPlaces || [])] : [...(prev.unloadingPlaces || [])];
            const place = places[placeIndex];
            if (place?.goods?.[goodsIndex]) {
                place.goods[goodsIndex] = { ...place.goods[goodsIndex], [field]: value };
            }
            return type === 'loading' ? { ...prev, loadingPlaces: places } : { ...prev, unloadingPlaces: places };
        });
    };

    const addPlace = (type: 'loading' | 'unloading') => {
        setFormData((prev: Partial<OrderFormData>) => {
            const newPlace = type === 'loading' 
                ? { 
                    id: crypto.randomUUID(), 
                    street: '', 
                    city: '', 
                    zip: '', 
                    country: 'Slovensko', 
                    dateTime: null, 
                    contactPerson: '', 
                    contactPersonName: '', 
                    contactPersonPhone: '', 
                    goods: [{...emptyGoodsItem, id: crypto.randomUUID()}] 
                } 
                : { 
                    id: crypto.randomUUID(), 
                    street: '', 
                    city: '', 
                    zip: '', 
                    country: 'Slovensko', 
                    dateTime: null, 
                    contactPerson: '', 
                    contactPersonName: '', 
                    contactPersonPhone: '', 
                    goods: [{...emptyGoodsItem, id: crypto.randomUUID()}] 
                };
            return type === 'loading'
                ? { ...prev, loadingPlaces: [...(prev.loadingPlaces || []), newPlace] }
                : { ...prev, unloadingPlaces: [...(prev.unloadingPlaces || []), newPlace] };
        });
    };

    const addGoodsItem = (type: 'loading' | 'unloading', placeIndex: number) => {
        setFormData((prev: Partial<OrderFormData>) => {
            const places = type === 'loading' ? [...(prev.loadingPlaces || [])] : [...(prev.unloadingPlaces || [])];
            if (places[placeIndex]) {
                places[placeIndex] = { 
                    ...places[placeIndex], 
                    goods: [...(places[placeIndex].goods || []), { ...emptyGoodsItem, id: crypto.randomUUID() }] 
                };
            }
            return type === 'loading' ? { ...prev, loadingPlaces: places } : { ...prev, unloadingPlaces: places };
        });
    };

    const removeGoodsItem = (type: 'loading' | 'unloading', placeIndex: number, goodsIndex: number) => {
        setFormData((prev: Partial<OrderFormData>) => {
            const places = type === 'loading' ? [...(prev.loadingPlaces || [])] : [...(prev.unloadingPlaces || [])];
            const place = places[placeIndex];
            if (place?.goods && place.goods.length > 1) {
                place.goods = place.goods.filter((_: any, i: number) => i !== goodsIndex);
            }
            return type === 'loading' ? { ...prev, loadingPlaces: places } : { ...prev, unloadingPlaces: places };
        });
    };

    return {
        handleDateTimeChange,
        handlePlaceInputChange,
        handlePlaceAutocompleteChange,
        handleGoodsChange,
        addPlace,
        addGoodsItem,
        removeGoodsItem
    };
}; 