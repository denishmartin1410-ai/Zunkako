import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Alert} from 'react-native';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

const DELIVERY_FEE = 40;
const FREE_DELIVERY_THRESHOLD = 500;

export const CartProvider = ({children}) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load cart from AsyncStorage on mount
  useEffect(() => {
    loadCart();
  }, []);

  // Save cart to AsyncStorage whenever it changes
  useEffect(() => {
    if (!isLoading) {
      saveCart(cartItems);
    }
  }, [cartItems, isLoading]);

  const loadCart = async () => {
    try {
      const savedCart = await AsyncStorage.getItem('@F2C_cart');
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.log('Error loading cart:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCart = async items => {
    try {
      await AsyncStorage.setItem('@F2C_cart', JSON.stringify(items));
    } catch (error) {
      console.log('Error saving cart:', error);
    }
  };

  // ✅ Add item to cart
  const addToCart = item => {
    setCartItems(prev => {
      const existingItem = prev.find(i => i.id === item.id);
      const currentQty = existingItem ? existingItem.quantity : 0;
      const maxStock = item.stock !== undefined ? Number(item.stock) : 999;

      if (currentQty >= maxStock) {
        Alert.alert(
          'மன்னிக்கவும் (Sorry)',
          'போதுமான இருப்பு இல்லை! (Not enough stock available!)',
        );
        return prev;
      }

      if (existingItem) {
        // Increase quantity if already exists
        return prev.map(i =>
          i.id === item.id ? {...i, quantity: i.quantity + 1} : i,
        );
      }
      // Add new item with quantity 1
      return [...prev, {...item, quantity: 1}];
    });
  };

  // ✅ Increase quantity
  const increaseQuantity = itemId => {
    setCartItems(prev =>
      prev.map(item => {
        if (item.id === itemId) {
          const maxStock = item.stock !== undefined ? Number(item.stock) : 999;
          if (item.quantity >= maxStock) {
            Alert.alert(
              'மன்னிக்கவும் (Sorry)',
              'போதுமான இருப்பு இல்லை! (Not enough stock available!)',
            );
            return item;
          }
          return {...item, quantity: item.quantity + 1};
        }
        return item;
      }),
    );
  };

  // ✅ Decrease quantity
  const decreaseQuantity = itemId => {
    setCartItems(prev => {
      const item = prev.find(i => i.id === itemId);
      if (item && item.quantity === 1) {
        // Remove item if quantity becomes 0
        return prev.filter(i => i.id !== itemId);
      }
      return prev.map(i =>
        i.id === itemId ? {...i, quantity: i.quantity - 1} : i,
      );
    });
  };

  // ✅ Update quantity directly (used by CartScreen +/- buttons)
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      setCartItems(prev => prev.filter(item => item.id !== itemId));
    } else {
      setCartItems(prev => {
        const targetItem = prev.find(item => item.id === itemId);
        if (targetItem) {
          const maxStock =
            targetItem.stock !== undefined ? Number(targetItem.stock) : 999;
          if (newQuantity > maxStock) {
            Alert.alert(
              'மன்னிக்கவும் (Sorry)',
              'போதுமான இருப்பு இல்லை! (Not enough stock available!)',
            );
            return prev;
          }
        }
        return prev.map(item =>
          item.id === itemId ? {...item, quantity: newQuantity} : item,
        );
      });
    }
  };

  // ✅ Remove item from cart
  const removeFromCart = itemId => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  // ✅ Clear entire cart
  const clearCart = () => {
    setCartItems([]);
  };

  // ✅ Check if item is in cart
  const isInCart = itemId => {
    return cartItems.some(item => item.id === itemId);
  };

  // ✅ Get item quantity in cart
  const getItemQuantity = itemId => {
    const item = cartItems.find(i => i.id === itemId);
    return item ? item.quantity : 0;
  };

  // ✅ Cart Calculations
  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.consumerPrice || item.price) * item.quantity,
    0,
  );
  const totalAmount = subtotal; // ✅ alias used by CartScreen & CheckoutScreen

  const BULK_DISCOUNT_THRESHOLD = 999999; // Disable threshold
  const discount = 0; // Forced to 0 to disable bulk/cooperative discount

  const deliveryFee =
    subtotal === 0 ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;

  const total = subtotal + deliveryFee;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isFreeDelivery = subtotal >= FREE_DELIVERY_THRESHOLD;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        isLoading,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        updateQuantity,
        removeFromCart,
        clearCart,
        isInCart,
        getItemQuantity,
        subtotal,
        totalAmount,
        discount,
        BULK_DISCOUNT_THRESHOLD,
        deliveryFee,
        total,
        totalItems,
        isFreeDelivery,
        FREE_DELIVERY_THRESHOLD,
      }}>
      {children}
    </CartContext.Provider>
  );
};
