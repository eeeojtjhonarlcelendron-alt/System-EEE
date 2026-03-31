import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

// Demo users for non-admin roles (team_leader, gasoline_staff)
const DEMO_USERS = [
  { id: 2, email: 'leader@fuel.com', password: 'leader123', name: 'Team Leader', role: 'team_leader', hubId: 1 },
  { id: 5, email: 'staff@fuel.com', password: 'staff123', name: 'Gas Station Staff', role: 'gasoline_staff', stationId: 1 },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fuelUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  // Check for existing Supabase session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();
        
        if (profile) {
          const userData = {
            id: session.user.id,
            email: session.user.email,
            name: profile.name || session.user.email,
            role: profile.role || 'admin',
          };
          setUser(userData);
          localStorage.setItem('fuelUser', JSON.stringify(userData));
        }
      }
    };
    checkSession();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    
    // First try Supabase auth (for admin users from database)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (data?.user && !error) {
        // Fetch user profile from database
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single();

        const userData = {
          id: data.user.id,
          email: data.user.email,
          name: profile?.name || data.user.email,
          role: profile?.role || 'admin',
        };
        
        setUser(userData);
        localStorage.setItem('fuelUser', JSON.stringify(userData));
        setLoading(false);
        return { success: true, user: userData };
      }
    } catch (supabaseError) {
      // Supabase auth failed, fall back to demo users
    }

    // Fallback to demo users (team_leader, gasoline_staff)
    const found = DEMO_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      const { password, ...userWithoutPassword } = found;
      setUser(userWithoutPassword);
      localStorage.setItem('fuelUser', JSON.stringify(userWithoutPassword));
      setLoading(false);
      return { success: true, user: userWithoutPassword };
    }
    
    setLoading(false);
    return { success: false, error: 'Invalid email or password' };
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('fuelUser');
  }, []);

  const hasRole = useCallback((role) => {
    if (!user) return false;
    if (Array.isArray(role)) return role.includes(user.role);
    return user.role === role;
  }, [user]);

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    hasRole,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
