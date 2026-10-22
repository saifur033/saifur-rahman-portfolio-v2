import React, { useState, useEffect } from 'react';
import { PortfolioProvider } from './context/PortfolioContext';
import { PublicPortfolio } from './components/PublicPortfolio';
import { AdminStudio } from './components/AdminStudio';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'public' | 'studio'>(() => {
    return window.location.hash.includes('studio') || window.location.pathname.includes('studio')
      ? 'studio'
      : 'public';
  });

  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash.includes('studio')) {
        setCurrentView('studio');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <PortfolioProvider>
      {currentView === 'studio' ? (
        <AdminStudio
          onBackToPublic={() => {
            window.location.hash = '';
            setCurrentView('public');
          }}
        />
      ) : (
        <PublicPortfolio
          onOpenStudio={() => {
            window.location.hash = 'studio';
            setCurrentView('studio');
          }}
        />
      )}
    </PortfolioProvider>
  );
};

export default App;
