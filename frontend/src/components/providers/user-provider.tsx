"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types/database";

interface UserContextValue {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  refreshUser: async () => {},
});

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchUser() {
    const supabase = createClient();
    
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    const { data: dbUser } = await supabase
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single();

    setUser(dbUser);
    setLoading(false);
  }

  useEffect(() => {
    fetchUser();

    // Listen for auth state changes
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          fetchUser();
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser: fetchUser }}>
      {children}
    </UserContext.Provider>
  );
}
