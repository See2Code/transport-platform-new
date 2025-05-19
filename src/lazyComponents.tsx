import React, { lazy, Suspense } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

// Loading fallback komponent
const LoadingFallback = () => (
  <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
    <CircularProgress />
  </Box>
);

// HOC pre lazy loading s prefetchingom
const withLazyPreload = (importFunc: () => Promise<any>) => {
  const Component = lazy(importFunc);
  // Preload funkcia pre komponent, môže byť volaná vopred pre zlepšenie UX
  (Component as any).preload = importFunc;
  
  return (props: any) => (
    <Suspense fallback={<LoadingFallback />}>
      <Component {...props} />
    </Suspense>
  );
};

// Dashboard components (admin sekcia)
export const LazyDashboard = withLazyPreload(() => import('./components/layout/Dashboard'));
export const LazyTeam = withLazyPreload(() => import('./components/management/Team'));
export const LazySettings = withLazyPreload(() => import('./components/settings/Settings'));

// Mapy a tracking (heavy komponenty)
export const LazyVehicleMap = withLazyPreload(() => import('./components/tracking/VehicleMap'));
export const LazyTrackedTransports = withLazyPreload(() => import('./components/orders/TrackedTransports'));

// Business komponenty
export const LazyBusinessCases = withLazyPreload(() => import('./components/management/BusinessCases'));
export const LazyOrdersForm = withLazyPreload(() => import('./components/orders/Orders'));
export const LazyNewOrderForm = withLazyPreload(() => import('./components/orders/NewOrderForm'));

// Ostatné komponenty
export const LazyNotifications = withLazyPreload(() => import('./components/settings/Notifications'));

// Preload helper pre preloading komponentov podľa potreby
export const preloadComponent = (component: any) => {
  if (component && typeof component.preload === 'function') {
    component.preload();
  }
};

// Preload hlavných routov pri prvom načítaní aplikácie
export const preloadMainRoutes = () => {
  // Počas idle času preloadneme hlavné komponenty
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      preloadComponent(LazyDashboard);
      preloadComponent(LazySettings);
    });
  } else {
    // Fallback pre prehliadače bez requestIdleCallback
    setTimeout(() => {
      preloadComponent(LazyDashboard);
      preloadComponent(LazySettings);
    }, 2000);
  }
}; 