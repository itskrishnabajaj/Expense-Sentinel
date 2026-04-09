import { useState, useEffect, useCallback } from 'react';
import { getAllSettings, setSetting, AppSettings } from '../database';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    monthly_budget: 2000,
    currency: 'USD',
  });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllSettings();
      setSettings(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    await setSetting(key, value);
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  return { settings, loading, updateSetting, refresh: load };
}
