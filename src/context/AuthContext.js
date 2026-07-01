// src/context/AuthContext.js
// ✅ FINAL FIX: Login screen-ல் select பண்ண userType ALWAYS wins
// Farmer select → Farmer dashboard, Consumer select → Consumer dashboard

import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import i18n from '../locales/i18n';
import {
  firebaseEmailLogin,
  firebaseEmailRegister,
  sendPhoneOTP,
  verifyPhoneOTP,
  firebaseLogout,
  saveUserProfile,
  getUserProfile,
  sendPasswordResetEmail,
  saveFCMToken,
} from '../services/firebase';

const AuthContext = createContext(null);
export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return c;
};

export const AuthProvider = ({children}) => {
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
              setUser(r.data);
              setUserType(t);
              saveFCMToken(fbUser.uid);
              await AsyncStorage.setItem('@F2C_user', JSON.stringify(r.data));
              await AsyncStorage.setItem('@F2C_userType', t);
            }
          }
        } else {
          setFirebaseUser(null);
          setUser(null);
          setUserType(null);
        }
      } catch (e) {
        console.log('auth error:', e);
      } finally {
        setIsLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const login = async (email, password, selectedType) => {
    try {
      const authModule = require('@react-native-firebase/auth').default;
      const formattedEmail = email.trim().toLowerCase();

      const r = await firebaseEmailLogin(formattedEmail, password);
      if (!r.success) {
        let errorType = r.errorType;
        if (errorType === 'wrong-password') {
          try {
            const firestoreModule = require('@react-native-firebase/firestore').default;
            const userQuery = await firestoreModule()
              .collection('users')
              .where('email', '==', formattedEmail)
              .get();
            if (userQuery.empty) {
              errorType = 'user-not-found';
            }
          } catch (e) {
            console.log('Pre-login Firestore email check bypassed:', e.message);
          }
        }
        return {success: false, error: r.error, errorType: errorType};
      }
      const fbUser = r.user;

      // ✅ Email Verification Check
      if (!fbUser.emailVerified) {
        await authModule().signOut(); // Don't keep unverified user logged in
        return {
          success: false,
          error: i18n.t('authAlerts.emailNotVerifiedMsg'),
          errorType: 'email-not-verified',
          fbUser: fbUser,
        };
      }

      // Get profile data for name/phone etc
      const pr = await getUserProfile(fbUser.uid);

      // ✅ CRITICAL FIX for Issue 2: Strict Dashboard Segregation
      if (pr.success && pr.data) {
        const storedType = pr.data.userType;
        if (
          storedType &&
          storedType !== 'admin' &&
          storedType !== selectedType
        ) {
          // ❌ User tried to login to the WRONG dashboard!
          await authModule().signOut(); // Immediately sign them out

          const typeLabel = i18n.t(`login.${storedType}`, {
            defaultValue: storedType,
          });
          return {
            success: false,
            errorType: 'wrong-dashboard',
            error: i18n.t('authAlerts.wrongDashboardDetails', {
              type: typeLabel,
            }),
          };
        }
      }

      let userData;
      if (pr.success && pr.data) {
        userData = pr.data;
      } else {
        userData = {
          id: fbUser.uid,
          uid: fbUser.uid,
          name: fbUser.displayName || formattedEmail.split('@')[0],
          email: fbUser.email || formattedEmail,
          phone: '',
          avatar: '',
          isVerified: true,
          emailVerified: true,
        };
      }

      // ✅ Update emailVerified status in Firestore
      userData.emailVerified = true;
      userData.isVerified = true;

      // ✅ Preserve 'admin' and 'delivery' types from Firestore, otherwise use selectedType from login screen
      const storedType = pr.success && pr.data ? pr.data.userType : null;
      const finalUserType = storedType === 'admin' ? 'admin' : selectedType;

      userData.userType = finalUserType;
      await saveUserProfile(fbUser.uid, {
        userType: finalUserType,
        emailVerified: true,
        isVerified: true,
      });

      if (finalUserType === 'delivery') {
        await firestore()
          .collection('deliveryBoys')
          .doc(fbUser.uid)
          .set(
            {
              id: fbUser.uid,
              uid: fbUser.uid,
              name:
                userData.name ||
                fbUser.displayName ||
                formattedEmail.split('@')[0],
              email: fbUser.email || formattedEmail,
              phone: userData.phone || '',
              userType: 'delivery',
              isAvailable: true,
              totalDeliveries: userData.totalDeliveries || 0,
              updatedAt: firestore.FieldValue.serverTimestamp(),
            },
            {merge: true},
          );
      }
      if (finalUserType === 'farmer') {
        await firestore()
          .collection('farmers')
          .doc(fbUser.uid)
          .set(
            {
              id: fbUser.uid,
              uid: fbUser.uid,
              name:
                userData.name ||
                fbUser.displayName ||
                formattedEmail.split('@')[0],
              email: fbUser.email || formattedEmail,
              phone: userData.phone || '',
              userType: 'farmer',
              updatedAt: firestore.FieldValue.serverTimestamp(),
            },
            {merge: true},
          );
      }

      await AsyncStorage.setItem('@F2C_user', JSON.stringify(userData));
      await AsyncStorage.setItem('@F2C_userType', finalUserType);
      setUser(userData);
      setUserType(finalUserType); // ✅ This drives RootNavigator
      setFirebaseUser(fbUser);
      saveFCMToken(fbUser.uid);
      return {success: true};
    } catch (e) {
      return {success: false, error: e.message};
    }
  };

  // ✅ Resend Email Verification
  const resendVerificationEmail = async () => {
    try {
      const currentUser = auth().currentUser;
      if (currentUser && !currentUser.emailVerified) {
        await currentUser.sendEmailVerification();
        return {success: true};
      }
      return {success: false, error: 'User not found or already verified'};
    } catch (e) {
      return {success: false, error: e.message};
    }
  };

  const register = async (formData, type) => {
    try {
      // Step 1: Create Firebase Auth account FIRST (so user becomes authenticated)
      const r = await firebaseEmailRegister(formData.email, formData.password);
      if (!r.success) {
        return {success: false, error: r.error, errorType: r.errorType};
      }
      const fbUser = r.user;

      // Step 2: NOW user is authenticated → Firestore reads are allowed by rules
      // ✅ CRITICAL: Phone Number Lock - Check if phone already registered
      if (formData.phone) {
        try {
          const phoneCheck = await firestore()
            .collection('users')
            .where('phone', '==', formData.phone)
            .limit(1)
            .get();

          if (!phoneCheck.empty) {
            const existingUser = phoneCheck.docs[0].data();
            const existingType = existingUser.userType || 'unknown';
            const typeLabel = i18n.t(`login.${existingType}`, {
              defaultValue: existingType,
            });
            // ❌ Phone already exists → Delete the just-created auth account
            await fbUser.delete();
            return {
              success: false,
              error: i18n.t('authAlerts.phoneExistsDetails', {
                type: typeLabel,
              }),
              errorType: 'phone-exists',
            };
          }
        } catch (phoneErr) {
          console.log('Phone check error (non-critical):', phoneErr.message);
        }
      }

      // ✅ Also check if email already exists in Firestore (extra safety for duplicate profiles)
      try {
        const emailCheck = await firestore()
          .collection('users')
          .where('email', '==', formData.email)
          .limit(1)
          .get();

        if (!emailCheck.empty) {
          // Email profile already exists in Firestore → Delete the auth account
          await fbUser.delete();
          return {
            success: false,
            error: i18n.t('authAlerts.emailExistsSimple', {
              defaultValue: 'This email is already registered!',
            }),
            errorType: 'email-exists',
          };
        }
      } catch (emailErr) {
        console.log('Email check error (non-critical):', emailErr.message);
      }

      // Step 3: All checks passed → Send Email Verification
      try {
        await fbUser.sendEmailVerification();
      } catch (verifyErr) {
        console.log(
          'Email verification send error (non-critical):',
          verifyErr.message,
        );
      }

      // Step 4: Save user profile to Firestore
      const userData = {
        id: fbUser.uid,
        uid: fbUser.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone || '',
        location: formData.location || '',
        userType: type,
        avatar: '',
        isVerified: false,
        emailVerified: false,
        createdAt: new Date().toISOString(),
        ...(type === 'farmer' && {
          farmName: formData.name + "'s Farm",
          qrCode: `F2C-FARMER-${fbUser.uid.slice(0, 8).toUpperCase()}`,
          rating: 0,
          isActive: true,
        }),
      };
      await saveUserProfile(fbUser.uid, userData);
      if (type === 'farmer') {
        await firestore()
          .collection('farmers')
          .doc(fbUser.uid)
          .set({
            ...userData,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
      }
      if (type === 'delivery') {
        await firestore()
          .collection('deliveryBoys')
          .doc(fbUser.uid)
          .set({
            ...userData,
            isAvailable: true,
            currentLocation: null,
            totalDeliveries: 0,
            createdAt: firestore.FieldValue.serverTimestamp(),
          });
      }
      await AsyncStorage.setItem('@F2C_user', JSON.stringify(userData));
      await AsyncStorage.setItem('@F2C_userType', type);
      setUser(userData);
      setUserType(type);
      setFirebaseUser(fbUser);
      saveFCMToken(fbUser.uid);
      return {success: true, emailVerificationSent: true};
    } catch (e) {
      return {success: false, error: e.message};
    }
  };

  const sendOTP = async phone => await sendPhoneOTP(phone);

  const verifyOTP = async (confirmation, otp, type, name) => {
    try {
      const r = await verifyPhoneOTP(confirmation, otp);
      if (!r.success) {
        return {success: false, error: r.error};
      }
      const fbUser = r.user;

      const pr = await getUserProfile(fbUser.uid);
      const isExistingAdmin =
        pr.success && pr.data && pr.data.userType === 'admin';
      const actualType = isExistingAdmin ? 'admin' : type || 'consumer';

      let userData;
      if (pr.success && pr.data) {
        userData = {...pr.data, userType: actualType};
      } else {
        userData = {
          id: fbUser.uid,
          uid: fbUser.uid,
          name: name || 'F2C User',
          phone: fbUser.phoneNumber?.replace('+91', '') || '',
          email: '',
          userType: actualType,
          avatar: '',
          isVerified: false,
        };
        await saveUserProfile(fbUser.uid, userData);
      }

      if (actualType === 'delivery') {
        await firestore()
          .collection('deliveryBoys')
          .doc(fbUser.uid)
          .set(
            {
              id: fbUser.uid,
              uid: fbUser.uid,
              name: userData.name,
              email: userData.email || '',
              phone: userData.phone || '',
              userType: 'delivery',
              isAvailable: true,
              totalDeliveries: userData.totalDeliveries || 0,
              updatedAt: firestore.FieldValue.serverTimestamp(),
            },
            {merge: true},
          );
      }
      if (actualType === 'farmer') {
        await firestore()
          .collection('farmers')
          .doc(fbUser.uid)
          .set(
            {
              id: fbUser.uid,
              uid: fbUser.uid,
              name: userData.name,
              email: userData.email || '',
              phone: userData.phone || '',
              userType: 'farmer',
              updatedAt: firestore.FieldValue.serverTimestamp(),
            },
            {merge: true},
          );
      }
      await AsyncStorage.setItem('@F2C_user', JSON.stringify(userData));
      await AsyncStorage.setItem('@F2C_userType', actualType);
      setUser(userData);
      setUserType(actualType);
      setFirebaseUser(fbUser);
      saveFCMToken(fbUser.uid);
      return {success: true};
    } catch (e) {
      return {success: false, error: e.message};
    }
  };

  const logout = async () => {
    try {
      await firebaseLogout();
      await AsyncStorage.multiRemove(['@F2C_user', '@F2C_userType']);
      setUser(null);
      setUserType(null);
      setFirebaseUser(null);
    } catch (e) {
      console.log('logout error:', e);
    }
  };

  const forgotPassword = async email => await sendPasswordResetEmail(email);

  const updateUser = async updated => {
    try {
      const fbUser = auth().currentUser;
      if (!fbUser) {
        return {success: false, error: 'Not logged in'};
      }
      await saveUserProfile(fbUser.uid, updated);

      if (userType === 'farmer') {
        await firestore()
          .collection('farmers')
          .doc(fbUser.uid)
          .set(updated, {merge: true});
      }
      if (userType === 'delivery') {
        await firestore()
          .collection('deliveryBoys')
          .doc(fbUser.uid)
          .set(updated, {merge: true});
      }

      const newUser = {...user, ...updated};
      await AsyncStorage.setItem('@F2C_user', JSON.stringify(newUser));
      setUser(newUser);
      return {success: true};
    } catch (e) {
      return {success: false, error: e.message};
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        firebaseUser,
        isLoading,
        isAuthenticated: !!firebaseUser,
        isFarmer: userType === 'farmer',
        isConsumer: userType === 'consumer',
        isDelivery: userType === 'delivery',
        login,
        register,
        sendOTP,
        verifyOTP,
        logout,
        forgotPassword,
        updateUser,
        resendVerificationEmail,
      }}>
      {children}
    </AuthContext.Provider>
  );
};
