import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

// Bezpečný prístup k Google Maps API cez Cloud Functions
export const MapsService = {
  // Vyhľadávanie adresy (geocoding)
  geocode: async (address: string) => {
    try {
      const googleMapsProxyFn = httpsCallable(functions, 'googleMapsProxy');
      const result = await googleMapsProxyFn({
        endpoint: 'geocode',
        params: {
          address,
          language: 'sk'
        }
      });
      
      return result.data;
    } catch (error) {
      console.error('Chyba pri geocoding:', error);
      throw error;
    }
  },

  // Výpočet trasy medzi dvoma bodmi
  getDirections: async (origin: string, destination: string, waypoints: string[] = []) => {
    try {
      const googleMapsProxyFn = httpsCallable(functions, 'googleMapsProxy');
      const waypointsParam = waypoints.length > 0 ? waypoints.join('|') : '';
      
      const result = await googleMapsProxyFn({
        endpoint: 'directions',
        params: {
          origin,
          destination,
          waypoints: waypointsParam,
          language: 'sk',
          region: 'sk',
          mode: 'driving'
        }
      });
      
      return result.data;
    } catch (error) {
      console.error('Chyba pri získavaní trasy:', error);
      throw error;
    }
  },

  // Výpočet vzdialenosti a času prepravy
  getDistanceMatrix: async (origins: string[], destinations: string[]) => {
    try {
      const googleMapsProxyFn = httpsCallable(functions, 'googleMapsProxy');
      
      const result = await googleMapsProxyFn({
        endpoint: 'distancematrix',
        params: {
          origins: origins.join('|'),
          destinations: destinations.join('|'),
          language: 'sk',
          region: 'sk',
          mode: 'driving'
        }
      });
      
      return result.data;
    } catch (error) {
      console.error('Chyba pri výpočte vzdialenosti:', error);
      throw error;
    }
  },

  // Vyhľadávanie miest (napr. pre autocomplete)
  searchPlaces: async (query: string, location?: {lat: number, lng: number}, radius: number = 50000) => {
    try {
      const googleMapsProxyFn = httpsCallable(functions, 'googleMapsProxy');
      
      const params: any = {
        input: query,
        language: 'sk',
        types: 'address',
        components: 'country:sk|country:cz'
      };
      
      if (location) {
        params.location = `${location.lat},${location.lng}`;
        params.radius = radius;
      }
      
      const result = await googleMapsProxyFn({
        endpoint: 'places',
        params
      });
      
      return result.data;
    } catch (error) {
      console.error('Chyba pri vyhľadávaní miest:', error);
      throw error;
    }
  }
}; 