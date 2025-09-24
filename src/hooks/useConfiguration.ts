import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface SystemConfiguration {
  id: string;
  webhook_url: string | null;
  email_template: string | null;
  created_at: string;
  updated_at: string;
}

export const useConfiguration = () => {
  const { user } = useAuth();
  const [configuration, setConfiguration] = useState<SystemConfiguration | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConfiguration();
    }
  }, [user]);

  const fetchConfiguration = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('system_configurations')
        .select('*')
        .maybeSingle();

      if (error) throw error;
      setConfiguration(data);
    } catch (error) {
      console.error('Error fetching configuration:', error);
      setConfiguration(null);
    } finally {
      setLoading(false);
    }
  };

  const updateConfiguration = async (updates: Partial<Pick<SystemConfiguration, 'webhook_url' | 'email_template'>>) => {
    try {
      if (!configuration) {
        // Create new configuration if none exists
        const { data, error } = await supabase
          .from('system_configurations')
          .insert(updates)
          .select()
          .single();

        if (error) throw error;
        setConfiguration(data);
      } else {
        // Update existing configuration
        const { data, error } = await supabase
          .from('system_configurations')
          .update(updates)
          .eq('id', configuration.id)
          .select()
          .single();

        if (error) throw error;
        setConfiguration(data);
      }
    } catch (error) {
      console.error('Error updating configuration:', error);
      throw error;
    }
  };

  return {
    configuration,
    loading,
    updateConfiguration,
    refetch: fetchConfiguration
  };
};