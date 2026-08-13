import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const SettingsContext = createContext({});

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axios.get('https://streaming-store-api.onrender.com/api/settings');
      setSettings(res.data);

      // Atualiza o Favicon dinamicamente
      if (res.data.favicon_url) {
        let link = document.querySelector("link[rel~='icon']");
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = res.data.favicon_url;
      }
      
      // Atualiza o Título do Documento se quiser
      if (res.data.store_name) {
        document.title = res.data.store_name;
      }
    } catch (err) {
      console.error('Erro ao buscar configurações', err);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
