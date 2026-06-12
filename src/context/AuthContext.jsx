import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, isFirebaseEnabled } from '../services/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('owner');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseEnabled) {
      // Local sandbox mode session restoration
      const isLocalLoggedIn = localStorage.getItem('fh_is_logged_in') === 'true';
      if (isLocalLoggedIn) {
        setCurrentUser({
          uid: 'local_user',
          email: 'demo@health.com',
          displayName: 'Srinivas (Local)'
        });
        setUserRole(localStorage.getItem('fh_local_role') || 'owner');
      } else {
        setCurrentUser(null);
        setUserRole('owner');
      }
      setLoading(false);
      return;
    }

    // Firebase Auth session restoration
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // fetch user role from db
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role || 'owner');
          } else {
            // create doc
            const newDoc = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              role: 'owner',
              createdAt: new Date()
            };
            await setDoc(userDocRef, newDoc);
            setUserRole('owner');
          }
        } catch (e) {
          console.error("Error reading user role from Firestore:", e);
          setUserRole('owner');
        }
      } else {
        setCurrentUser(null);
        setUserRole('owner');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithEmail = async (email, password) => {
    if (!isFirebaseEnabled) {
      if (email === 'demo@health.com' && password === '123456') {
        localStorage.setItem('fh_is_logged_in', 'true');
        const mockUser = {
          uid: 'local_user',
          email: 'demo@health.com',
          displayName: 'Srinivas (Local)'
        };
        setCurrentUser(mockUser);
        setUserRole(localStorage.getItem('fh_local_role') || 'owner');
        return { user: mockUser };
      } else {
        throw new Error("Local demo credentials: demo@health.com / 123456. Or configure Firebase config in Settings.");
      }
    }

    return signInWithEmailAndPassword(auth, email, password);
  };

  const registerWithEmail = async (email, password, name) => {
    if (!isFirebaseEnabled) {
      throw new Error("Registration is disabled in local mode. Please use demo@health.com / 123456.");
    }

    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;
    // create users collection doc
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName: name || email.split('@')[0],
      role: 'owner',
      createdAt: new Date()
    });
    return cred;
  };

  const loginWithGoogle = async () => {
    if (!isFirebaseEnabled) {
      throw new Error("Google Sign-In is disabled in local mode. Connect Firebase in Settings.");
    }

    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const user = cred.user;
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
      await setDoc(userDocRef, {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || 'User',
        role: 'owner',
        createdAt: new Date()
      });
    }
    return cred;
  };

  const logout = async () => {
    if (!isFirebaseEnabled) {
      localStorage.setItem('fh_is_logged_in', 'false');
      setCurrentUser(null);
      setUserRole('owner');
      return;
    }

    return signOut(auth);
  };

  const updateLocalRole = (role) => {
    setUserRole(role);
    localStorage.setItem('fh_local_role', role);
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userRole,
      loading,
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle,
      logout,
      isFirebaseEnabled,
      updateLocalRole
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
