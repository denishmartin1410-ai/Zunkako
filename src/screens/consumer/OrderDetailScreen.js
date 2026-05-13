// ============================================================
// src/screens/consumer/OrderDetailScreen.js
// ✅ default export - ConsumerNavigator-க்கு தேவை!
// ✅ Delivered status in timeline
// ✅ Refund Request feature
// ============================================================

import React from 'react';
import {
    View, Text, StyleSheet, ScrollView,
    TouchableOpacity, Dimensions, Alert, Linking, Modal
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { updateOrderStatus, createNotification } from '../../services/firebase';
import BackButton from '../../utils/BackButton';

const { width } = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

const STATUS_COLOR = {
    Pending: '#FF9800',
    Confirmed: '#2196F3',
    Shipped: '#9C27B0',
    Delivered: '#4CAF50',
    Cancelled: '#F44336',
    'Refund Requested': '#FF5722',
};
const STATUS_TA = {
    Pending: 'காத்திருக்கிறது',
    Confirmed: 'உறுதி செய்யப்பட்டது',
    Shipped: 'அனுப்பப்பட்டது',
    Delivered: 'வழங்கப்பட்டது',
    Cancelled: 'ரத்து செய்யப்பட்டது',
    'Refund Requested': 'பணம் திரும்ப கோரிக்கை',
};

const OrderDetailScreen = ({ route, navigation }) => {
    const { t } = useTranslation();
    const { order } = route.params || {};

    if (!order) {
        return (
            <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
                <Text style={{ fontSize: rs(48) }}>📦</Text>
                <Text style={{ color: COLORS.textMuted, fontSize: rs(FONTS.md), marginTop: 12 }}>
                    {t('orders.noOrderInfo', { defaultValue: 'ஆர்டர் தகவல் இல்லை' })}
                </Text>
                <TouchableOpacity
                    style={styles.backBtn2}
                    onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn2Txt}>← {t('common.back', { defaultValue: 'திரும்பு' })}</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const statusColor = STATUS_COLOR[order.status] || '#999';
    const getStatusI18nKey = (status) => {
        if (status === 'Pending') return 'orders.statusPending';
        if (status === 'Confirmed') return 'orders.statusConfirmed';
        if (status === 'Shipped') return 'orders.statusShipped';
        if (status === 'Delivered') return 'orders.statusDelivered';
        if (status === 'Cancelled') return 'orders.statusCancelled';
        if (status === 'Refund Requested') return 'orders.status_Refund_Requested';
        return 'orders.status_' + status.replace(' ', '_');
    };
    const statusTa = t(getStatusI18nKey(order.status), { defaultValue: STATUS_TA[order.status] || order.status });
    const orderDate = order.createdAt?.toDate?.()?.toLocaleDateString('ta-IN') || '';

    const [cancelModalVisible, setCancelModalVisible] = React.useState(false);
    const [cancelReason, setCancelReason] = React.useState('');

    const CANCEL_REASONS = [
        { id: 1, label: t('orders.reasonNoNeed', { defaultValue: 'தயாரிப்பு இப்போது தேவையில்லை' }) },
        { id: 2, label: t('orders.reasonMistake', { defaultValue: 'தவறுதலாக ஆர்டர் செய்துவிட்டேன்' }) },
        { id: 3, label: t('orders.reasonPrice', { defaultValue: 'விலை அதிகமாக உள்ளது' }) },
        { id: 4, label: t('orders.reasonDelivery', { defaultValue: 'டெலிவரி நேரம் அதிகம்' }) },
    ];

    // Timeline steps
    let steps = [
        { key: 'Pending', label: t('orders.statusPending', { defaultValue: 'ஆர்டர் பெற்றோம்' }), icon: '📋' },
        { key: 'Confirmed', label: t('orders.statusConfirmed', { defaultValue: 'உறுதி செய்யப்பட்டது' }), icon: '✅' },
        { key: 'Shipped', label: t('orders.statusShipped', { defaultValue: 'அனுப்பப்பட்டது' }), icon: '🚚' },
        { key: 'Delivered', label: t('orders.statusDelivered', { defaultValue: 'வழங்கப்பட்டது' }), icon: '🎉' },
    ];
    let statusOrder = ['Pending', 'Confirmed', 'Shipped', 'Delivered'];
    
    if (order.status === 'Cancelled') {
        steps = [
            { key: 'Pending', label: t('orders.statusPending', { defaultValue: 'ஆர்டர் பெற்றோம்' }), icon: '📋' },
            { key: 'Cancelled', label: t('orders.statusCancelled', { defaultValue: 'ரத்து செய்யப்பட்டது' }), icon: '❌' },
        ];
        statusOrder = ['Pending', 'Cancelled'];
    }
    const currentIdx = statusOrder.indexOf(order.status);

    // ✅ Refund request handler
    const handleRefundRequest = () => {
        Alert.alert(
            t('orders.refundConfirmTitle', { defaultValue: 'பணம் திரும்ப கோரிக்கை' }),
            t('orders.refundConfirmMsg', { defaultValue: 'இந்த ஆர்டருக்கு பணம் திரும்ப கோர விரும்புகிறீர்களா?' }),
            [
                { text: t('common.cancel', { defaultValue: 'இல்லை' }), style: 'cancel' },
                {
                    text: t('common.yes', { defaultValue: 'ஆமா' }),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const result = await updateOrderStatus(order.id, 'Refund Requested');
                            if (result.success) {
                                // Trigger WhatsApp message to Admin for Refund
                                const adminPhone = "919360425423";
                                const msg = `*Refund Request*\n\nOrder ID: ${order.orderId || order.id}\nCustomer: ${order.consumerName || 'Customer'}\nTotal Amount: ₹${order.total}\n\nPlease process this refund.`;
                                const whatsappUrl = `whatsapp://send?phone=${adminPhone}&text=${encodeURIComponent(msg)}`;

                                Linking.openURL(whatsappUrl).catch(() => {
                                    Alert.alert('WhatsApp Error', 'Could not open WhatsApp. Please contact admin manually.');
                                });

                                Alert.alert(
                                    '✅',
                                    t('orders.refundSuccess', { defaultValue: 'பணம் திரும்ப கோரிக்கை சமர்ப்பிக்கப்பட்டது!' }),
                                    [{ text: t('common.ok', { defaultValue: 'சரி' }), onPress: () => navigation.goBack() }]
                                );
                            } else {
                                Alert.alert(t('common.error', { defaultValue: 'பிழை' }), result.error || 'Failed');
                            }
                        } catch (e) {
                            Alert.alert(t('common.error', { defaultValue: 'பிழை' }), e.message);
                        }
                    },
                },
            ],
        );
    };

    // ✅ Cancel order handler - 12 hour window
    const handleCancelOrderClick = () => {
        // Check if order is within 12 hours
        const orderTime = order.createdAt?.toDate?.();
        if (orderTime) {
            const hoursSinceOrder = (Date.now() - orderTime.getTime()) / (1000 * 60 * 60);
            if (hoursSinceOrder > 12) {
                Alert.alert(
                    '⚠️ ' + t('orders.cancelExpired', { defaultValue: 'Cannot Cancel' }),
                    t('orders.cancelExpiredMsg', { defaultValue: 'Orders can only be cancelled within 12 hours of placing. This order was placed more than 12 hours ago.' }),
                );
                return;
            }
        }
        setCancelModalVisible(true);
    };

    const submitCancellation = async () => {
        if (!cancelReason) {
            Alert.alert(t('common.error', { defaultValue: 'பிழை' }), t('orders.selectReason', { defaultValue: 'காரணத்தை தேர்ந்தெடுக்கவும்' }));
            return;
        }
        setCancelModalVisible(false);
        try {
            const result = await updateOrderStatus(order.id, 'Cancelled');
            if (result.success) {
                // Send notification to farmer
                if (order.farmerId) {
                    await createNotification({
                        userId: order.farmerId,
                        title: t('notification.orderCancelled', { defaultValue: 'Order Cancelled' }),
                        message: `Order #${order.orderId || order.id?.slice(-4)} has been cancelled. Reason: ${cancelReason}`,
                        emoji: '❌',
                        bgColor: '#FFEBEE',
                        type: 'order_cancelled',
                    });
                }
                // Send notification to customer
                if (order.consumerId) {
                    await createNotification({
                        userId: order.consumerId,
                        title: t('notification.orderCancelled', { defaultValue: 'Order Cancelled' }),
                        message: `Your order #${order.orderId || order.id?.slice(-4)} has been cancelled.`,
                        emoji: '❌',
                        bgColor: '#FFEBEE',
                        type: 'order_cancelled',
                    });
                }
                Alert.alert('✅', t('orders.cancelSuccess', { defaultValue: 'Order cancelled successfully!' }),
                    [{ text: t('common.ok', { defaultValue: 'OK' }), onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert(t('common.error', { defaultValue: 'Error' }), result.error || 'Failed');
            }
        } catch (e) {
            Alert.alert(t('common.error', { defaultValue: 'Error' }), e.message);
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
                <BackButton onPress={() => navigation.goBack()} />
                <Text style={styles.headerTitle}>📦 {t('orders.orderDetails', { defaultValue: 'Order Details' })}</Text>
                <View style={{ width: rs(40) }} />
            </LinearGradient>

            <ScrollView
                contentContainerStyle={{ padding: SPACING.lg, paddingBottom: rs(100) }}
                showsVerticalScrollIndicator={false}>

                {/* Order ID + Status */}
                <View style={styles.orderTopCard}>
                    <View style={styles.orderIdRow}>
                        <Text style={styles.orderIdLabel}>{t('orders.orderId', { defaultValue: 'ஆர்டர் எண்' })}</Text>
                        <Text style={styles.orderId}>
                            #{order.orderId || order.id?.slice(-6)?.toUpperCase()}
                        </Text>
                    </View>
                    {orderDate ? (
                        <Text style={styles.orderDate}>📅 {orderDate}</Text>
                    ) : null}
                    <View style={[styles.statusBadge, { backgroundColor: statusColor + '22', maxWidth: '60%' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]} numberOfLines={1} adjustsFontSizeToFit>
                            {statusTa}
                        </Text>
                    </View>
                </View>

                {/* Timeline (always show unless Refund Requested) */}
                {order.status !== 'Refund Requested' && (
                    <View style={styles.timelineCard}>
                        <Text style={styles.sectionTitle}>🚀 {t('orders.orderStatus', { defaultValue: 'ஆர்டர் நிலை' })}</Text>
                        <View style={styles.timeline}>
                            {steps.map((step, idx) => {
                                const done = idx <= currentIdx;
                                const active = idx === currentIdx;
                                return (
                                    <View key={step.key} style={styles.timelineStep}>
                                        <View style={styles.timelineLeft}>
                                            <View style={[
                                                styles.timelineDot,
                                                done && styles.timelineDotDone,
                                                active && styles.timelineDotActive,
                                            ]}>
                                                <Text style={{ fontSize: rs(12) }}>{done ? '✓' : ''}</Text>
                                            </View>
                                            {idx < steps.length - 1 && (
                                                <View style={[
                                                    styles.timelineLine,
                                                    done && styles.timelineLineDone,
                                                ]} />
                                            )}
                                        </View>
                                        <View style={styles.timelineContent}>
                                            <Text style={[styles.timelineIcon]}>{step.icon}</Text>
                                            <Text style={[
                                                styles.timelineLabel,
                                                active && styles.timelineLabelActive,
                                            ]}>
                                                {step.label}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    </View>
                )}

                {/* Refund Requested Status Card */}
                {order.status === 'Refund Requested' && (
                    <View style={styles.refundStatusCard}>
                        <Text style={styles.refundStatusIcon}>💸</Text>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.refundStatusTitle}>
                                {t('orders.refundRequested', { defaultValue: 'பணம் திரும்ப கோரிக்கை சமர்ப்பிக்கப்பட்டது' })}
                            </Text>
                            <Text style={styles.refundStatusSub}>
                                {t('orders.refundProcessing', { defaultValue: 'உங்கள் கோரிக்கை செயலில் உள்ளது' })}
                            </Text>
                        </View>
                    </View>
                )}

                {/* Items */}
                <View style={styles.itemsCard}>
                    <Text style={styles.sectionTitle}>🛍 {t('orders.products', { defaultValue: 'தயாரிப்புகள்' })}</Text>
                    {(order.items || []).map((item, i) => (
                        <View key={i} style={[
                            styles.itemRow,
                            i < (order.items || []).length - 1 && styles.itemBorder,
                        ]}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.nameTa || item.name}</Text>
                                <Text style={styles.itemQty}>
                                    x{item.quantity} × ₹{item.price}
                                </Text>
                            </View>
                            <Text style={styles.itemTotal}>
                                ₹{(item.price * item.quantity).toLocaleString()}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Price Summary */}
                <View style={styles.summaryCard}>
                    <Text style={styles.sectionTitle}>💰 {t('orders.priceSummary', { defaultValue: 'தொகை விவரம்' })}</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>{t('cart.subtotal', { defaultValue: 'தொகை' })}</Text>
                        <Text style={styles.summaryVal}>₹{order.subtotal || order.total}</Text>
                    </View>
                    {order.deliveryFee > 0 && (
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>{t('cart.delivery', { defaultValue: 'டெலிவரி கட்டணம்' })}</Text>
                            <Text style={styles.summaryVal}>₹{order.deliveryFee}</Text>
                        </View>
                    )}
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>{t('orders.total', { defaultValue: 'மொத்தம்' })}</Text>
                        <Text style={styles.totalVal}>₹{order.total}</Text>
                    </View>
                </View>

                {/* Farmer info */}
                {order.farmerName && (
                    <View style={styles.farmerCard}>
                        <Text style={styles.sectionTitle}>👨‍🌾 {t('farmer.farmer', { defaultValue: 'விவசாயி' })}</Text>
                        <Text style={styles.farmerName}>
                            {order.farmerNameTa || order.farmerName}
                        </Text>
                        {order.farmerPhone && (
                            <Text style={styles.farmerPhone}>📞 {order.farmerPhone}</Text>
                        )}
                    </View>
                )}

                {/* ✅ Cancel Order Button - only for Pending/Confirmed within 12 hours */}
                {order.status === 'Pending' && (
                    <TouchableOpacity
                        style={styles.cancelBtn}
                        onPress={handleCancelOrderClick}>
                        <Text style={styles.cancelBtnTxt}>
                            {t('orders.cancelOrder', { defaultValue: 'ஆர்டரை ரத்து செய்' })}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* ✅ Refund Request Button - only for Delivered orders */}
                {order.status === 'Delivered' && (
                    <TouchableOpacity style={styles.refundBtn} onPress={handleRefundRequest}>
                        <Text style={styles.refundBtnTxt}>
                            💸 {t('orders.requestRefund', { defaultValue: 'Request Refund' })}
                        </Text>
                    </TouchableOpacity>
                )}

            </ScrollView>

            {/* Cancellation Reason Modal */}
            <Modal visible={cancelModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{t('orders.cancelReason', { defaultValue: 'ரத்து செய்வதற்கான காரணம்' })}</Text>
                        
                        {CANCEL_REASONS.map(reason => (
                            <TouchableOpacity 
                                key={reason.id} 
                                style={[styles.reasonOption, cancelReason === reason.label && styles.reasonOptionActive]}
                                onPress={() => setCancelReason(reason.label)}>
                                <View style={[styles.radioDot, cancelReason === reason.label && styles.radioDotActive]} />
                                <Text style={styles.reasonText}>{reason.label}</Text>
                            </TouchableOpacity>
                        ))}

                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCancelModalVisible(false)}>
                                <Text style={styles.modalCancelBtnTxt}>{t('common.close', { defaultValue: 'மூடு' })}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalSubmitBtn, !cancelReason && { opacity: 0.5 }]} 
                                onPress={submitCancellation}
                                disabled={!cancelReason}>
                                <Text style={styles.modalSubmitBtnTxt}>{t('common.submit', { defaultValue: 'சமர்ப்பி' })}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
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
    headerTitle: {
        flex: 1, textAlign: 'center',
        fontSize: rs(FONTS.xl), fontWeight: 'bold', color: COLORS.white,
    },
    backBtn2: {
        marginTop: 20, backgroundColor: COLORS.primaryGreen,
        borderRadius: RADIUS.md, paddingHorizontal: 24, paddingVertical: 10,
    },
    backBtn2Txt: { color: COLORS.white, fontSize: rs(FONTS.md), fontWeight: 'bold' },

    orderTopCard: {
        backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
        padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.small,
    },
    orderIdRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 6,
    },
    orderIdLabel: { fontSize: rs(FONTS.xs), color: COLORS.textMuted },
    orderId: { fontSize: rs(FONTS.lg), fontWeight: 'bold', color: COLORS.textPrimary },
    orderDate: { fontSize: rs(FONTS.xs), color: COLORS.textMuted, marginBottom: 10 },
    statusBadge: {
        alignSelf: 'flex-start', borderRadius: RADIUS.full,
        paddingHorizontal: 14, paddingVertical: 5,
    },
    statusText: { fontSize: rs(FONTS.sm), fontWeight: 'bold' },

    timelineCard: {
        backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
        padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.small,
    },
    sectionTitle: {
        fontSize: rs(FONTS.md), fontWeight: 'bold',
        color: COLORS.textPrimary, marginBottom: SPACING.md,
    },
    timeline: {},
    timelineStep: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
    timelineLeft: { alignItems: 'center', width: rs(32), marginRight: SPACING.md },
    timelineDot: {
        width: rs(26), height: rs(26), borderRadius: rs(13),
        backgroundColor: '#E0E0E0', alignItems: 'center', justifyContent: 'center',
        borderWidth: 2, borderColor: '#BDBDBD',
    },
    timelineDotDone: { backgroundColor: COLORS.primaryGreen, borderColor: COLORS.primaryGreen },
    timelineDotActive: {
        backgroundColor: COLORS.primaryGreen, borderColor: COLORS.primaryGreen,
        width: rs(30), height: rs(30), borderRadius: rs(15),
    },
    timelineLine: { width: 2, height: rs(28), backgroundColor: '#E0E0E0', marginVertical: 2 },
    timelineLineDone: { backgroundColor: COLORS.primaryGreen },
    timelineContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: rs(4) },
    timelineIcon: { fontSize: rs(16), marginRight: 8 },
    timelineLabel: { fontSize: rs(FONTS.sm), color: COLORS.textSecondary },
    timelineLabelActive: { color: COLORS.primaryGreen, fontWeight: 'bold' },

    itemsCard: {
        backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
        padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.small,
    },
    itemRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        alignItems: 'center', paddingVertical: SPACING.sm,
    },
    itemBorder: { borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
    itemInfo: { flex: 1 },
    itemName: { fontSize: rs(FONTS.md), fontWeight: '600', color: COLORS.textPrimary },
    itemQty: { fontSize: rs(FONTS.xs), color: COLORS.textMuted, marginTop: 2 },
    itemTotal: { fontSize: rs(FONTS.md), fontWeight: 'bold', color: COLORS.primaryGreen },

    summaryCard: {
        backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
        padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.small,
    },
    summaryRow: {
        flexDirection: 'row', justifyContent: 'space-between',
        marginBottom: SPACING.sm,
    },
    summaryLabel: { fontSize: rs(FONTS.sm), color: COLORS.textSecondary },
    summaryVal: { fontSize: rs(FONTS.sm), color: COLORS.textPrimary, fontWeight: '600' },
    totalRow: {
        borderTopWidth: 1, borderTopColor: COLORS.borderLight,
        paddingTop: SPACING.sm, marginTop: SPACING.sm,
    },
    totalLabel: { fontSize: rs(FONTS.lg), fontWeight: 'bold', color: COLORS.textPrimary },
    totalVal: { fontSize: rs(FONTS.xl), fontWeight: 'bold', color: COLORS.primaryGreen },

    farmerCard: {
        backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
        padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.small,
    },
    farmerName: { fontSize: rs(FONTS.md), fontWeight: '600', color: COLORS.textPrimary },
    farmerPhone: { fontSize: rs(FONTS.sm), color: COLORS.textMuted, marginTop: 4 },

    // ✅ Cancel button
    cancelBtn: {
        backgroundColor: '#FFEBEE', borderRadius: RADIUS.xl,
        paddingVertical: rs(16), alignItems: 'center',
        borderWidth: 1.5, borderColor: '#F44336',
        marginBottom: SPACING.md,
    },
    cancelBtnTxt: {
        color: '#F44336', fontSize: rs(FONTS.md), fontWeight: 'bold',
    },

    // ✅ Refund button
    refundBtn: {
        backgroundColor: '#FFF3E0', borderRadius: RADIUS.xl,
        paddingVertical: rs(16), alignItems: 'center',
        borderWidth: 1.5, borderColor: '#FF5722',
        marginBottom: SPACING.md,
    },
    refundBtnTxt: {
        color: '#FF5722', fontSize: rs(FONTS.md), fontWeight: 'bold',
    },

    // ✅ Refund requested status card
    refundStatusCard: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#FFF3E0', borderRadius: RADIUS.xl,
        padding: SPACING.lg, marginBottom: SPACING.md,
        borderLeftWidth: 4, borderLeftColor: '#FF5722',
    },
    refundStatusIcon: { fontSize: rs(32), marginRight: SPACING.md },
    refundStatusTitle: {
        fontSize: rs(FONTS.md), fontWeight: 'bold', color: '#FF5722',
    },
    refundStatusSub: {
        fontSize: rs(FONTS.xs), color: COLORS.textSecondary, marginTop: 2,
    },

    // Modal Styles
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: SPACING.lg },
    modalContent: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xl },
    modalTitle: { fontSize: rs(FONTS.lg), fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.lg, textAlign: 'center' },
    reasonOption: { flexDirection: 'row', alignItems: 'center', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.borderLight },
    reasonOptionActive: { backgroundColor: '#F1F8E9' },
    radioDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: COLORS.textMuted, marginRight: SPACING.md },
    radioDotActive: { borderColor: COLORS.primaryGreen, backgroundColor: COLORS.primaryGreen },
    reasonText: { fontSize: rs(FONTS.sm), color: COLORS.textPrimary, flex: 1 },
    modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: SPACING.xl, gap: SPACING.md },
    modalCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: '#EEEEEE', alignItems: 'center' },
    modalCancelBtnTxt: { fontSize: rs(FONTS.md), color: COLORS.textPrimary, fontWeight: 'bold' },
    modalSubmitBtn: { flex: 1, paddingVertical: 12, borderRadius: RADIUS.md, backgroundColor: COLORS.primaryGreen, alignItems: 'center' },
    modalSubmitBtnTxt: { fontSize: rs(FONTS.md), color: COLORS.white, fontWeight: 'bold' },
});

// ✅ IMPORTANT: default export
export default OrderDetailScreen;
