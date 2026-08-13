// src/hooks/use-store-config.ts
// Hook que carrega o singleton store_config (id=1) uma vez por componente.
// RLS: public read habilitado; serve pra qualquer pagina.
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface StoreConfig {
  whatsapp_number: string;
  whatsapp_display: string;
  email: string;
  instagram_url: string | null;
  production_time: string;
  shipping_time: string;
  warranty: string;
  pix_discount_percent: number;
  payment_methods: string[];
  address_locality: string | null;
  address_region: string | null;
  address_country: string;
  site_url: string;
  og_image_url: string | null;
}

export function useStoreConfig() {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error: e } = await supabase
          .from('store_config')
          .select('*')
          .eq('id', 1)
          .maybeSingle();
        if (cancelled) return;
        if (e) { setError(e.message); setConfig(null); }
        else { setConfig(data as StoreConfig | null); setError(null); }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { config, loading, error };
}
