import React from 'react';
import { OrderFormData, GoodsItem } from '../../../types/orders';
import { emptyGoodsItem, emptyLoadingPlace, emptyUnloadingPlace } from './types';

export interface LocationHandlersProps {
  setFormData: React.Dispatch<React.SetStateAction<Partial<OrderFormData>>>;
  expandedLocationCards: { [key: string]: boolean };
  setExpandedLocationCards: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
}

export const useLocationHandlers = ({ setFormData, expandedLocationCards: _expandedLocationCards, setExpandedLocationCards }: LocationHandlersProps) => {
  
  const addLocation = (type: 'loading' | 'unloading') => {
    const newLocation = type === 'loading' ? { ...emptyLoadingPlace } : { ...emptyUnloadingPlace };
    newLocation.id = crypto.randomUUID();
    // Nebudeme už automaticky vyplňovať názov firmy z vybraného zákazníka
    
    setFormData(prev => ({
      ...prev,
      [`${type}Places`]: [...(prev[`${type}Places` as keyof typeof prev] as any[]), newLocation]
    }));
  };

  const removeLocation = (type: 'loading' | 'unloading', index: number) => {
    setFormData(prev => {
      const places = [...(prev[`${type}Places` as keyof typeof prev] as any[])];
      places.splice(index, 1);
      return {
        ...prev,
        [`${type}Places`]: places
      };
    });
  };

  const duplicateLocation = (type: 'loading' | 'unloading', index: number) => {
    setFormData(prev => {
      const places = [...(prev[`${type}Places` as keyof typeof prev] as any[])];
      const locationToDuplicate = { ...places[index] };
      locationToDuplicate.id = crypto.randomUUID();
      locationToDuplicate.goods = locationToDuplicate.goods.map((item: GoodsItem) => ({
        ...item,
        id: crypto.randomUUID()
      }));
      places.splice(index + 1, 0, locationToDuplicate);
      return {
        ...prev,
        [`${type}Places`]: places
      };
    });
  };

  const updateLocation = (type: 'loading' | 'unloading', index: number, field: string, value: any) => {
    setFormData(prev => {
      const places = [...(prev[`${type}Places` as keyof typeof prev] as any[])];
      places[index] = { ...places[index], [field]: value };
      return {
        ...prev,
        [`${type}Places`]: places
      };
    });
  };

  const addGoods = (type: 'loading' | 'unloading', locationIndex: number) => {
    const newGoods = { ...emptyGoodsItem };
    newGoods.id = crypto.randomUUID();
    
    setFormData(prev => {
      const places = [...(prev[`${type}Places` as keyof typeof prev] as any[])];
      places[locationIndex].goods = [...places[locationIndex].goods, newGoods];
      
      // Automatické kopírovanie tovaru z nakládky do vykládky
      // Len ak má užívateľ jednu nakládku a jednu vykládku
      const updatedFormData = {
        ...prev,
        [`${type}Places`]: places
      };
      
      if (type === 'loading' && 
          prev.loadingPlaces?.length === 1 && 
          prev.unloadingPlaces?.length === 1 &&
          prev.unloadingPlaces[0].goods?.length === 0) {
        // Skopírujeme všetky tovary z nakládky do vykládky
        const loadingGoods = places[locationIndex].goods;
        const unloadingPlaces = [...prev.unloadingPlaces];
        unloadingPlaces[0].goods = loadingGoods.map((goods: GoodsItem) => ({
          ...goods,
          id: crypto.randomUUID() // Nové ID pre kopiu
        }));
        updatedFormData.unloadingPlaces = unloadingPlaces;
      }
      
      return updatedFormData;
    });
  };

  const removeGoods = (type: 'loading' | 'unloading', locationIndex: number, goodsIndex: number) => {
    setFormData(prev => {
      const places = [...(prev[`${type}Places` as keyof typeof prev] as any[])];
      places[locationIndex].goods.splice(goodsIndex, 1);
      
      const updatedFormData = {
        ...prev,
        [`${type}Places`]: places
      };
      
      // Automatické kopírovanie zmien tovaru z nakládky do vykládky
      // Len ak má užívateľ jednu nakládku a jednu vykládku
      if (type === 'loading' && 
          prev.loadingPlaces?.length === 1 && 
          prev.unloadingPlaces?.length === 1) {
        // Skopírujeme všetky tovary z nakládky do vykládky
        const loadingGoods = places[locationIndex].goods;
        const unloadingPlaces = [...prev.unloadingPlaces];
        unloadingPlaces[0].goods = loadingGoods.map((goods: GoodsItem) => ({
          ...goods,
          id: crypto.randomUUID() // Nové ID pre kopiu
        }));
        updatedFormData.unloadingPlaces = unloadingPlaces;
      }
      
      return updatedFormData;
    });
  };

  const updateGoods = (
    type: 'loading' | 'unloading', 
    locationIndex: number, 
    goodsIndex: number, 
    field: string, 
    value: any
  ) => {
    setFormData(prev => {
      const places = [...(prev[`${type}Places` as keyof typeof prev] as any[])];
      places[locationIndex].goods[goodsIndex] = {
        ...places[locationIndex].goods[goodsIndex],
        [field]: value
      };
      
      const updatedFormData = {
        ...prev,
        [`${type}Places`]: places
      };
      
      // Automatické kopírovanie zmien tovaru z nakládky do vykládky
      // Len ak má užívateľ jednu nakládku a jednu vykládku
      if (type === 'loading' && 
          prev.loadingPlaces?.length === 1 && 
          prev.unloadingPlaces?.length === 1 &&
          prev.unloadingPlaces[0].goods?.length > 0) {
        // Skopírujeme všetky tovary z nakládky do vykládky
        const loadingGoods = places[locationIndex].goods;
        const unloadingPlaces = [...prev.unloadingPlaces];
        unloadingPlaces[0].goods = loadingGoods.map((goods: GoodsItem) => ({
          ...goods,
          id: crypto.randomUUID() // Nové ID pre kopiu
        }));
        updatedFormData.unloadingPlaces = unloadingPlaces;
      }
      
      return updatedFormData;
    });
  };

  const toggleLocationCard = (type: 'loading' | 'unloading', index: number) => {
    const key = `${type}-${index}`;
    setExpandedLocationCards(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return {
    addLocation,
    removeLocation,
    duplicateLocation,
    updateLocation,
    addGoods,
    removeGoods,
    updateGoods,
    toggleLocationCard
  };
}; 