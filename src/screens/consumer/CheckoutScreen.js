// ============================================================
// src/screens/consumer/CheckoutScreen.js
// ✅ default export - ConsumerNavigator crash fix!
// ✅ Form validation: name, address, pincode required
// ============================================================

import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    Alert, ActivityIndicator, Dimensions, TextInput, Platform, PermissionsAndroid,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { createOrder } from '../../services/firebase';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import BackButton from '../../utils/BackButton';
import Geolocation from '@react-native-community/geolocation';

const { width } = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

const CheckoutScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { cartItems, totalAmount, clearCart } = useCart();
    const [customerName, setCustomerName] = useState(user?.name || '');
    const [address, setAddress] = useState(user?.address || user?.location || '');
    const [pincode, setPincode] = useState(user?.pincode || '');
    const [isLoading, setIsLoading] = useState(false);

    const deliveryFee = totalAmount < 500 ? 40 : 0;
    const finalAmount = totalAmount + deliveryFee;

    // ✅ Get consumer's current location for delivery navigation
    const getConsumerLocation = () => {
        return new Promise((resolve) => {
            try {
                if (Platform.OS === 'android') {
                    PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
                        .then(() => {
                            Geolocation.getCurrentPosition(
                                pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                                () => resolve(null),
                                { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
                            );
                        })
                        .catch(() => resolve(null));
                } else {
                    Geolocation.getCurrentPosition(
                        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                        () => resolve(null),
                        { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
                    );
                }
            } catch (e) {
                resolve(null);
            }
        });
    };

    const handlePlaceOrder = async () => {
        if (cartItems.length === 0) {
            Alert.alert(t('common.error', { defaultValue: 'பிழை' }), t('checkout.emptyCart', { defaultValue: 'கார்ட் காலி! தயாரிப்புகள் சேர்க்கவும்' }));
            return;
        }

        // ✅ Validation: name, address, pincode must be filled
        if (!customerName.trim()) {
            Alert.alert(t('common.error', { defaultValue: 'பிழை' }), t('checkout.nameRequired', { defaultValue: 'பெயர் நிரப்பவும்' }));
            return;
        }
        if (!address.trim()) {
            Alert.alert(t('common.error', { defaultValue: 'பிழை' }), t('checkout.addressRequired', { defaultValue: 'முகவரி நிரப்பவும்' }));
            return;
        }
        if (!pincode.trim() || pincode.trim().length < 6) {
            Alert.alert(t('common.error', { defaultValue: 'பிழை' }), t('checkout.pincodeRequired', { defaultValue: 'சரியான PIN கோடு நிரப்பவும் (6 இலக்கம்)' }));
            return;
        }

        setIsLoading(true);
        try {
            // ✅ Get location ONCE before creating orders
            const consumerLocation = await getConsumerLocation();

            // Group by farmer
            const farmerGroups = {};
            cartItems.forEach(item => {
                const fid = item.farmerId || 'unknown';
                if (!farmerGroups[fid]) farmerGroups[fid] = [];
                farmerGroups[fid].push(item);
            });

            const orderPromises = Object.entries(farmerGroups).map(([farmerId, items]) => {
                const subtotal = items.reduce((s, i) => s + (i.consumerPrice || i.price) * i.quantity, 0);
                return createOrder({
                    consumerId: user?.id || user?.uid,
                    consumerName: customerName.trim(),
                    farmerId,
                    farmerName: items[0]?.farmerName || '',
                    items: items.map(i => ({
                        id: i.id,
                        name: i.name,
                        nameTa: i.nameTa || i.name,
                        price: i.consumerPrice || i.price,  // Store consumer price
                        basePrice: i.price, // Store base price for farmer visibility separately if needed
                        quantity: i.quantity,
                        unit: i.unit,
                        image: i.image,
                    })),
                    subtotal,
                    deliveryFee: deliveryFee,
                    total: subtotal + deliveryFee,
                    deliveryAddress: address.trim(),
                    deliveryPincode: pincode.trim(),
                    paymentMethod: 'COD',
                    // Store consumer location for delivery navigation
                    consumerCoords: consumerLocation,
                });
            });

            await Promise.all(orderPromises);
            clearCart();
            setIsLoading(false);

            Alert.alert(
                `✅ ${t('checkout.success', { defaultValue: 'ஆர்டர் வெற்றி!' })}`,
                t('checkout.successMsg', { defaultValue: 'உங்கள் ஆர்டர் வெற்றிகரமாக பதிவாகியது!\nYour order has been placed successfully!' }),
                [{
                    text: t('common.ok', { defaultValue: 'சரி' }),
                    onPress: () => navigation.reset({ index: 0, routes: [{ name: 'ConsumerTabs' }] }),
                }],
            );
        } catch (e) {
            setIsLoading(false);
            Alert.alert(t('common.error', { defaultValue: 'பிழை' }), e.message || t('checkout.failed', { defaultValue: 'ஆர்டர் பதிவு ஆகவில்லை' }));
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>🛍 {t('checkout.title', { defaultValue: 'Checkout' })}</Text>
                <View style={{ width: rs(40) }} />
            </LinearGradient>

            <ScrollView
                contentContainerStyle={{ padding: SPACING.lg, paddingBottom: rs(120) }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled">

                {/* ✅ Delivery Details - Name, Address, Pincode */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📋 {t('checkout.deliveryDetails', { defaultValue: 'டெலிவரி விவரங்கள்' })}</Text>
                    <View style={styles.formField}>
                        <Text style={styles.formLabel}>{t('checkout.name', { defaultValue: 'பெயர்' })} *</Text>
                        <TextInput
                            style={styles.formInput}
                            value={customerName}
                            onChangeText={setCustomerName}
                            placeholder={t('checkout.namePlaceholder', { defaultValue: 'உங்கள் பெயர்' })}
                            placeholderTextColor={COLORS.textGray}
                        />
                    </View>
                    <View style={styles.formField}>
                        <Text style={styles.formLabel}>{t('checkout.address', { defaultValue: 'முகவரி' })} *</Text>
                        <TextInput
                            style={[styles.formInput, { height: rs(80), textAlignVertical: 'top', paddingTop: SPACING.md }]}
                            value={address}
                            onChangeText={setAddress}
                            placeholder={t('checkout.addressPlaceholder', { defaultValue: 'முழு முகவரி நிரப்பவும்' })}
                            placeholderTextColor={COLORS.textGray}
                            multiline
                        />
                    </View>
                    <View style={styles.formField}>
                        <Text style={styles.formLabel}>{t('checkout.pincode', { defaultValue: 'PIN கோடு' })} *</Text>
                        <TextInput
                            style={styles.formInput}
                            value={pincode}
                            onChangeText={setPincode}
                            placeholder={t('checkout.pincodePlaceholder', { defaultValue: '6 இலக்க PIN கோடு' })}
                            placeholderTextColor={COLORS.textGray}
                            keyboardType="numeric"
                            maxLength={6}
                        />
                    </View>
                </View>

                {/* Order Items */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>🛒 {t('checkout.yourOrder', { defaultValue: 'உங்கள் ஆர்டர்' })}</Text>
                    {cartItems.map((item, i) => (
                        <View key={i} style={[styles.itemRow, i < cartItems.length - 1 && styles.itemBorder]}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemName}>{item.nameTa || item.name}</Text>
                                <Text style={styles.itemQty}>x{item.quantity} × ₹{item.consumerPrice || item.price}</Text>
                            </View>
                            <Text style={styles.itemTotal}>₹{(item.consumerPrice || item.price) * item.quantity}</Text>
                        </View>
                    ))}
                </View>

                {/* Price */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>💰 {t('checkout.priceDetails', { defaultValue: 'தொகை விவரம்' })}</Text>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>{t('checkout.subtotal', { defaultValue: 'தொகை' })}</Text>
                        <Text style={styles.priceVal}>₹{totalAmount}</Text>
                    </View>
                    <View style={styles.priceRow}>
                        <Text style={styles.priceLabel}>{t('checkout.delivery', { defaultValue: 'டெலிவரி' })}</Text>
                        <Text style={[styles.priceVal, deliveryFee === 0 && { color: COLORS.primaryGreen }]}>
                            {deliveryFee === 0 ? t('checkout.free', { defaultValue: 'இலவசம்!' }) : `₹${deliveryFee}`}
                        </Text>
                    </View>
                    <View style={[styles.priceRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>{t('checkout.total', { defaultValue: 'மொத்தம்' })}</Text>
                        <Text style={styles.totalVal}>₹{finalAmount}</Text>
                    </View>
                </View>

                {/* COD Note */}
                <View style={styles.codCard}>
                    <Text style={styles.codIcon}>💵</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.codTitle}>{t('checkout.cod', { defaultValue: 'Cash on Delivery' })}</Text>
                        <Text style={styles.codSub}>{t('checkout.codSub', { defaultValue: 'பொருள் வந்ததும் பணம் கொடுக்கலாம்' })}</Text>
                    </View>
                </View>

            </ScrollView>

            {/* Place Order Button */}
            <View style={styles.bottomBar}>
                <View>
                    <Text style={styles.totalSmall}>{t('checkout.total', { defaultValue: 'மொத்தம்' })}</Text>
                    <Text style={styles.totalBig}>₹{finalAmount}</Text>
                </View>
                <TouchableOpacity
                    style={styles.orderBtn}
                    onPress={handlePlaceOrder}
                    disabled={isLoading}>
                    <LinearGradient
                        colors={COLORS.gradientButton}
                        style={styles.orderBtnGrad}
                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                        {isLoading
                            ? <ActivityIndicator color={COLORS.white} />
                            : <Text style={styles.orderBtnTxt}>{t('checkout.placeOrder', { defaultValue: 'ஆர்டர் செய்' })} →</Text>
                        }
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: {
        paddingTop: rs(50), paddingBottom: rs(16),
        paddingHorizontal: SPACING.xl,
        flexDirection: 'row', alignItems: 'center',
    },
    backBtn: { width: rs(40) },
    backTxt: { color: COLORS.white, fontSize: rs(22), fontWeight: 'bold' },
    headerTitle: {
        flex: 1, textAlign: 'center',
        fontSize: rs(FONTS.xl), fontWeight: 'bold', color: COLORS.white,
    },
    card: {
        backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
        padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.small,
    },
    cardTitle: {
        fontSize: rs(FONTS.md), fontWeight: 'bold',
        color: COLORS.textPrimary, marginBottom: SPACING.md,
    },
    // ✅ Form fields for delivery details
    formField: { marginBottom: SPACING.md },
    formLabel: {
        fontSize: rs(FONTS.sm), fontWeight: '600',
        color: COLORS.textSecondary, marginBottom: 6,
    },
    formInput: {
        backgroundColor: COLORS.background, borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.lg, height: rs(48),
        fontSize: rs(FONTS.md), color: COLORS.textPrimary,
        borderWidth: 1.5, borderColor: COLORS.borderLight,
    },
    itemRow: {
        flexDirection: 'row', alignItems: 'center',
        paddingVertical: SPACING.sm,
    },
    itemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
    itemName: { fontSize: rs(FONTS.md), color: COLORS.textPrimary, fontWeight: '600' },
    itemQty: { fontSize: rs(FONTS.xs), color: COLORS.textMuted },
    itemTotal: { fontSize: rs(FONTS.md), fontWeight: 'bold', color: COLORS.primaryGreen },
    priceRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        paddingVertical: SPACING.xs || 4,
    },
    priceLabel: { fontSize: rs(FONTS.sm), color: COLORS.textSecondary },
    priceVal: { fontSize: rs(FONTS.sm), color: COLORS.textPrimary, fontWeight: '600' },
    totalRow: {
        borderTopWidth: 1, borderTopColor: COLORS.borderLight,
        marginTop: SPACING.sm, paddingTop: SPACING.sm,
    },
    totalLabel: { fontSize: rs(FONTS.lg), fontWeight: 'bold', color: COLORS.textPrimary },
    totalVal: { fontSize: rs(FONTS.xl), fontWeight: 'bold', color: COLORS.primaryGreen },
    codCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#E8F5E9', borderRadius: RADIUS.xl,
        padding: SPACING.lg, marginBottom: SPACING.md,
        borderLeftWidth: 4, borderLeftColor: COLORS.primaryGreen,
    },
    codIcon: { fontSize: rs(32), marginRight: SPACING.md },
    codTitle: { fontSize: rs(FONTS.md), fontWeight: 'bold', color: COLORS.primaryGreen },
    codSub: { fontSize: rs(FONTS.xs), color: COLORS.textSecondary, marginTop: 2 },
    bottomBar: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: COLORS.white, padding: SPACING.lg,
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        borderTopWidth: 1, borderTopColor: COLORS.borderLight,
        ...SHADOWS.large,
    },
    totalSmall: { fontSize: rs(FONTS.xs), color: COLORS.textMuted },
    totalBig: { fontSize: rs(FONTS.xxl), fontWeight: 'bold', color: COLORS.primaryGreen },
    orderBtn: { borderRadius: RADIUS.lg, overflow: 'hidden' },
    orderBtnGrad: { paddingVertical: rs(14), paddingHorizontal: rs(32), alignItems: 'center' },
    orderBtnTxt: { color: COLORS.white, fontSize: rs(FONTS.lg), fontWeight: 'bold' },
});

export default CheckoutScreen;
