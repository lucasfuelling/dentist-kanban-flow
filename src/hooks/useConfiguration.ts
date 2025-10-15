import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface SystemConfiguration {
  id: string;
  webhook_url: string | null;
  email_template_first: string | null;
  email_template_reminder: string | null;
  dentist_name: string | null;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export const useConfiguration = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: configuration, isLoading: loading } = useQuery({
    queryKey: ['system-configuration'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('*')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<Pick<SystemConfiguration, 'webhook_url' | 'email_template_first' | 'email_template_reminder' | 'dentist_name' | 'logo_url'>>) => {
      if (!configuration) {
        // Create new configuration if none exists
        const { data, error } = await supabase
          .from('system_configurations')
          .insert(updates)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Update existing configuration
        const { data, error } = await supabase
          .from('system_configurations')
          .update(updates)
          .eq('id', configuration.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['system-configuration'], data);
    },
    onError: (error) => {
      console.error('Error updating configuration:', error);
    }
  });

  return {
    configuration: configuration ?? null,
    loading,
    updateConfiguration: updateMutation.mutateAsync,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['system-configuration'] })
  };
};