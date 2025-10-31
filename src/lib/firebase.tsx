'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '@/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from './types';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

interface UserContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({ user: null, firebaseUser: null, loading: true });

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        // User is signed in.
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          setUser({ id: fbUser.uid, ...userDoc.data() } as User);
        } else {
          // Handle case where user is authenticated but not in Firestore
          // This could be a new registration, or a data consistency issue
           setUser({
            id: fbUser.uid,
            email: fbUser.email || "",
            name: fbUser.displayName || "User",
            role: 'student' // default role
           });
        }
      } else {
        // User is signed out.
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, firebaseUser, loading }}>
      <FirebaseErrorListener />
      {children}
    </UserContext.Provider>
  );
}
