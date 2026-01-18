import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Session persistence logic
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (_event === 'SIGNED_OUT') {
         // handle clean up if needed
      }
      setLoading(false); 
    });
    return () => subscription.unsubscribe();
  }, []);

  // Inactivity Timeout
  useEffect(() => {
     if (!user) return;

     let timeout;
     const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 Minutes

     const resetTimer = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
           alert("You have been logged out due to inactivity.");
           logout();
        }, INACTIVITY_LIMIT);
     };

     const events = ['mousemove', 'keydown', 'click', 'scroll'];
     events.forEach(event => window.addEventListener(event, resetTimer));
     
     resetTimer(); // Init

     return () => {
         clearTimeout(timeout);
         events.forEach(event => window.removeEventListener(event, resetTimer));
     };
  }, [user]);

  /* 
     Enhanced Auth Logic:
     - login: Request OTP
     - verifyOtp: Verify the code
  */
  const login = async (email) => {
    // We utilize signInWithOtp. Using 'email' type usually sends a magic link.
    // To Force OTP Code (if supported by project settings) we can try passing options.
    // However, usually 'shouldCreateUser: false' prevents signup on login.
    const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
            shouldCreateUser: false // Login only
        }
    });
    if (error) throw error;
  };

  const signup = async (email, metadata) => {
     // For signup, we also use signInWithOtp but we pass metadata
     const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: true,
            data: metadata // { name, student_id, batch }
        }
     });
     if (error) throw error;
  };

  const verifyOtp = async (email, token) => {
      const { data, error } = await supabase.auth.verifyOtp({
          email,
          token,
          type: 'email'
      });
      if (error) throw error;
      return data;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, verifyOtp, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
