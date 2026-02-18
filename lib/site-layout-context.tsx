"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface SiteLayoutSettings {
  showLogoInHeader: boolean;
  stickyHeader: boolean;
  showHero: boolean;
  showTrending: boolean;
  showFooter: boolean;
}

const defaultSettings: SiteLayoutSettings = {
  showLogoInHeader: true,
  stickyHeader: true,
  showHero: true,
  showTrending: true,
  showFooter: true,
};

const SiteLayoutContext = createContext<SiteLayoutSettings>(defaultSettings);

export function SiteLayoutProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteLayoutSettings>(defaultSettings);

  const load = () => {
    fetch("/api/site-settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data.showLogoInHeader === "boolean") {
          setSettings({
            showLogoInHeader: data.showLogoInHeader ?? true,
            stickyHeader: data.stickyHeader ?? true,
            showHero: data.showHero ?? true,
            showTrending: data.showTrending ?? true,
            showFooter: data.showFooter ?? true,
          });
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return (
    <SiteLayoutContext.Provider value={settings}>
      {children}
    </SiteLayoutContext.Provider>
  );
}

export function useSiteLayout() {
  return useContext(SiteLayoutContext);
}
