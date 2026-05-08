import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WishlistContext = createContext(null);

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({children}) => {
  const [wishlistItems, setWishlistItems] = useState([]);

  useEffect(() => {
    loadWishlist();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('@F2C_wishlist', JSON.stringify(wishlistItems)).catch(
      console.log,
    );
  }, [wishlistItems]);

  const loadWishlist = async () => {
    try {
      const saved = await AsyncStorage.getItem('@F2C_wishlist');
      if (saved) {
        setWishlistItems(JSON.parse(saved));
      }
    } catch {}
  };

  const addToWishlist = item => {
    setWishlistItems(prev => {
      if (prev.find(i => i.id === item.id)) {
        return prev;
      }
      return [...prev, item];
    });
  };

  const removeFromWishlist = itemId => {
    setWishlistItems(prev => prev.filter(i => i.id !== itemId));
  };

  const toggleWishlist = item => {
    if (isInWishlist(item.id)) {
      removeFromWishlist(item.id);
      return false;
    } else {
      addToWishlist(item);
      return true;
    }
  };

  const isInWishlist = itemId => wishlistItems.some(i => i.id === itemId);

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist,
        wishlistCount: wishlistItems.length,
      }}>
      {children}
    </WishlistContext.Provider>
  );
};
