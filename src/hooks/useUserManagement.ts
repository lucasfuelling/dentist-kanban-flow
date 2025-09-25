import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

interface UserWithRoles extends User {
  roles?: string[];
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Fetch user roles with profile data
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select(`
          user_id, 
          role,
          profiles!inner(email, display_name)
        `);

      if (error) throw error;

      // Group roles by user_id and include profile data
      const usersMap = new Map<string, { roles: string[], profile: any }>();
      userRoles?.forEach(({ user_id, role, profiles }) => {
        if (!usersMap.has(user_id)) {
          usersMap.set(user_id, { roles: [], profile: profiles });
        }
        usersMap.get(user_id)!.roles.push(role);
      });

      // Create user objects with actual profile data
      const usersWithRoles: UserWithRoles[] = Array.from(usersMap.entries()).map(([user_id, { roles, profile }]) => ({
        id: user_id,
        email: profile?.display_name || profile?.email || `user-${user_id.slice(0, 8)}@example.com`,
        roles,
        // Other required User properties as placeholders
        aud: 'authenticated',
        role: 'authenticated',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {}
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (email: string, password: string, role: string = 'user') => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // Assign role to the new user
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: data.user.id, role });

        if (roleError) throw roleError;

        await fetchUsers();
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Error creating user:', error);
      return { user: null, error };
    }
  };

  return {
    users,
    loading,
    createUser,
    refetch: fetchUsers
  };
};
