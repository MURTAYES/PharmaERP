import React, { createContext, useContext, useState, useEffect } from 'react';
import { PharmacySettings } from '../types';
import { settingsApi } from '../services/settingsApi';

interface SettingsContextType {
  settings: PharmacySettings | null;
  refreshSettings: () => Promise<void>;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  refreshSettings: async () => {},
  loading: false,
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<PharmacySettings | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshSettings = async () => {
    try {
      setLoading(true);
      const res = await settingsApi.get();
      setSettings(res.settings);
    } catch {
      // Ignore if unauthenticated or offline
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, refreshSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
