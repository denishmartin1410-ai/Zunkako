// src/context/AuthContext.js
// ✅ FINAL FIX: Login screen-ல் select பண்ண userType ALWAYS wins
// Farmer select → Farmer dashboard, Consumer select → Consumer dashboard

import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { firebaseEmailLogin, firebaseEmailRegister, sendPhoneOTP, verifyPhoneOTP, firebaseLogout, saveUserProfile, getUserProfile, sendPasswordResetEmail, saveFCMToken } from '../services/firebase';

const AuthContext = createContext(null);
export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth must be used within AuthProvider');
  return c;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);

  // Auto-login on app open
  useEffect(() => {
    const unsub = auth().onAuthStateChanged(async fbUser => {
      try {
        if (fbUser) {
          setFirebaseUser(fbUser);
          const storedUser = await AsyncStorage.getItem('@F2C_user');
          const storedType = await AsyncStorage.getItem('@F2C_userType');
          if (storedUser && storedType) {
            setUser(JSON.parse(storedUser));
            setUserType(storedType);
            saveFCMToken(fbUser.uid);
          } else {
            const r = await getUserProfile(fbUser.uid);
            if (r.success && r.data) {
              const t = r.data.userType || 'consumer';
              setUser(r.data); setUserType(t);
              saveFCMToken(fbUser.uid);
              await AsyncStorage.setItem('@F2C_user', JSON.stringify(r.data));
              await AsyncStorage.setItem('@F2C_userType', t);
            }
          }
        } else {
          setFirebaseUser(null); setUser(null); setUserType(null);
        }
      } catch (e) { console.log('auth error:', e); }
      finally { setIsLoading(false); }
    });
    return () => unsub();
  }, []);

  // ✅ CRITICAL FIX: selectedType (from login screen) ALWAYS used
  // Never override with Firestore value during login
  const login = async (email, password, selectedType) => {
    try {
      const r = await firebaseEmailLogin(email, password);
      if (!r.success) return { success: false, error: r.error, errorType: r.errorType };
      const fbUser = r.user;

      // Get profile data for name/phone etc
      const pr = await getUserProfile(fbUser.uid);
      let userData;
      if (pr.success && pr.data) {
        userData = pr.data;
      } else {
        userData = {
          id: fbUser.uid, uid: fbUser.uid,
          name: fbUser.displayName || email.split('@')[0],
          email: fbUser.email || email, phone: '', avatar: '',
          isVerified: false,
        };
      }

      // ✅ Preserve 'admin' and 'delivery' types from Firestore, otherwise use selectedType from login screen
      const storedType = pr.success && pr.data ? pr.data.userType : null;
      const finalUserType = (storedType === 'admin') ? 'admin' : selectedType;

      userData.userType = finalUserType;
      await saveUserProfile(fbUser.uid, { userType: finalUserType });

      await AsyncStorage.setItem('@F2C_user', JSON.stringify(userData));
      await AsyncStorage.setItem('@F2C_userType', finalUserType);
      setUser(userData);
      setUserType(finalUserType); // ✅ This drives RootNavigator
      setFirebaseUser(fbUser);
      saveFCMToken(fbUser.uid);
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  };

  const register = async (formData, type) => {
    try {
      const r = await firebaseEmailRegister(formData.email, formData.password);
      if (!r.success) return { success: false, error: r.error, errorType: r.errorType };
      const fbUser = r.user;
      const userData = {
        id: fbUser.uid, uid: fbUser.uid, name: formData.name,
        email: formData.email, phone: formData.phone || '',
        location: formData.location || '', userType: type,
        avatar: '', isVerified: false, createdAt: new Date().toISOString(),
        ...(type === 'farmer' && {
          farmName: formData.name + "'s Farm",
          qrCode: `F2C-FARMER-${fbUser.uid.slice(0, 8).toUpperCase()}`,
          rating: 0, isActive: true,
        }),
      };
      await saveUserProfile(fbUser.uid, userData);
      if (type === 'farmer') {
        await firestore().collection('farmers').doc(fbUser.uid).set({
          ...userData, createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }
      if (type === 'delivery') {
        await firestore().collection('deliveryBoys').doc(fbUser.uid).set({
          ...userData, 
          isAvailable: true,
          currentLocation: null,
          totalDeliveries: 0,
          createdAt: firestore.FieldValue.serverTimestamp(),
        });
      }
      await AsyncStorage.setItem('@F2C_user', JSON.stringify(userData));
      await AsyncStorage.setItem('@F2C_userType', type);
      setUser(userData); setUserType(type); setFirebaseUser(fbUser);
      saveFCMToken(fbUser.uid);
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  };

  const sendOTP = async phone => await sendPhoneOTP(phone);

  const verifyOTP = async (confirmation, otp, type, name) => {
    try {
      const r = await verifyPhoneOTP(confirmation, otp);
      if (!r.success) return { success: false, error: r.error };
      const fbUser = r.user;
      
      const pr = await getUserProfile(fbUser.uid);
      const isExistingAdmin = pr.success && pr.data && pr.data.userType === 'admin';
      const actualType = isExistingAdmin ? 'admin' : (type || 'consumer');
      
      let userData;
      if (pr.success && pr.data) { userData = { ...pr.data, userType: actualType }; }
      else {
        userData = {
          id: fbUser.uid, uid: fbUser.uid, name: name || 'F2C User',
          phone: fbUser.phoneNumber?.replace('+91', '') || '',
          email: '', userType: actualType, avatar: '', isVerified: false,
        };
        await saveUserProfile(fbUser.uid, userData);
      }
      await AsyncStorage.setItem('@F2C_user', JSON.stringify(userData));
      await AsyncStorage.setItem('@F2C_userType', actualType);
      setUser(userData); setUserType(actualType); setFirebaseUser(fbUser);
      saveFCMToken(fbUser.uid);
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  };

  const logout = async () => {
    try {
      await firebaseLogout();
      await AsyncStorage.multiRemove(['@F2C_user', '@F2C_userType']);
      setUser(null); setUserType(null); setFirebaseUser(null);
    } catch (e) { console.log('logout error:', e); }
  };

  const forgotPassword = async email => await sendPasswordResetEmail(email);

  const updateUser = async updated => {
    try {
      const fbUser = auth().currentUser;
      if (!fbUser) return { success: false, error: 'Not logged in' };
      await saveUserProfile(fbUser.uid, updated);
      const newUser = { ...user, ...updated };
      await AsyncStorage.setItem('@F2C_user', JSON.stringify(newUser));
      setUser(newUser);
      return { success: true };
    } catch (e) { return { success: false, error: e.message }; }
  };

  return (
    <AuthContext.Provider value={{
      user, userType, firebaseUser, isLoading,
      isAuthenticated: !!firebaseUser,
      isFarmer: userType === 'farmer',
      isConsumer: userType === 'consumer',
      isDelivery: userType === 'delivery',
      login, register, sendOTP, verifyOTP, logout, forgotPassword, updateUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
