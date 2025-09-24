import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  created_at: string;
}

export const useRoles = () => {
  const { user } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setUserRoles([]);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    fetchUserRoles();
  }, [user]);

  const fetchUserRoles = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      setUserRoles(data || []);
      setIsAdmin(data?.some(role => role.role === 'admin') || false);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      setUserRoles([]);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const assignRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });

      if (error) throw error;
      
      if (userId === user?.id) {
        await fetchUserRoles();
      }
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  };

  const removeRole = async (userId: string, role: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) throw error;
      
      if (userId === user?.id) {
        await fetchUserRoles();
      }
    } catch (error) {
      console.error('Error removing role:', error);
      throw error;
    }
  };

  return {
    userRoles,
    isAdmin,
    loading,
    assignRole,
    removeRole,
    refetch: fetchUserRoles
  };
};