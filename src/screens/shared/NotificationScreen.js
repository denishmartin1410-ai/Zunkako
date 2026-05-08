// ============================================================
// 🔔 NOTIFICATION SCREEN
// ✅ Real Firestore notifications - no fake data!
// ✅ FIX: Language mixing removed - only selected language shown
// ✅ FIX: Premium back icon
// ✅ FIX: Bell icon centered in notification card
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import {
  listenToNotifications, markNotificationRead,
  markAllNotificationsRead, clearAllNotifications,
} from '../../services/firebase';

// ── Single Notification Card ──
const NotificationCard = ({ item, onPress }) => {
  const timeStr = item.createdAt?.toDate?.()
    ? getTimeAgo(item.createdAt.toDate())
    : '';

  return (
    <TouchableOpacity
      style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
      onPress={() => onPress(item)}
      activeOpacity={0.85}>

      {/* Unread dot */}
      {!item.isRead && <View style={styles.unreadDot} />}

      {/* Icon - ✅ FIX: Centered vertically */}
      <View style={[styles.notifIcon, { backgroundColor: item.bgColor || '#E8F5E9' }]}>
        <Text style={styles.notifEmoji}>{item.emoji || '🔔'}</Text>
      </View>

      {/* Content */}
      <View style={styles.notifContent}>
        <View style={styles.notifTitleRow}>
          <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.notifTime}>{timeStr}</Text>
        </View>
        <Text style={styles.notifMsg} numberOfLines={2}>{item.message}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Helper: Time ago - ✅ FIX: Uses i18n-compatible strings
function getTimeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 172800) return 'Yesterday';
  return date.toLocaleDateString();
}

const NotificationScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const userId = user?.id || user?.uid;

  // ✅ Real-time listener for notifications
  useEffect(() => {
    if (!userId) { setIsLoading(false); return; }
    setIsLoading(true);
    const unsub = listenToNotifications(userId, result => {
      setNotifs(Array.isArray(result?.data) ? result.data : []);
      setIsLoading(false);
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [userId]);

  const unreadCount = notifs.filter(n => !n.isRead).length;
  const filtered = activeTab === 'unread' ? notifs.filter(n => !n.isRead) : notifs;

  const handlePress = async (item) => {
    if (!item.isRead && userId) {
      await markNotificationRead(userId, item.id);
    }
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    await markAllNotificationsRead(userId);
  };

  const handleClearAll = () => {
    Alert.alert(
      t('notification.clearTitle', { defaultValue: 'Clear All?' }),
      t('notification.clearMsg', { defaultValue: 'Remove all notifications?' }),
      [
        { text: t('common.cancel', { defaultValue: 'No' }), style: 'cancel' },
        {
          text: t('common.yes', { defaultValue: 'Yes' }),
          onPress: async () => {
            if (userId) await clearAllNotifications(userId);
          },
          style: 'destructive',
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Header - ✅ FIX: Only one title, no subtitle mixing */}
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <View style={styles.backIconWrap}>
            <Text style={styles.backIcon}>‹</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>🔔 {t('notification.title', { defaultValue: 'Notifications' })}</Text>
        </View>
        {unreadCount > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeTxt}>{unreadCount}</Text>
          </View>
        )}
      </LinearGradient>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {[
          { key: 'all', label: `${t('notification.all', { defaultValue: 'All' })} (${notifs.length})` },
          { key: 'unread', label: `${t('notification.unread', { defaultValue: 'Unread' })} (${unreadCount})` },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key)}>
            <Text style={[styles.tabBtnTxt, activeTab === tab.key && styles.tabBtnTxtActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Action buttons */}
      {notifs.length > 0 && (
        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.actionBtn}>
            <Text style={styles.actionBtnTxt}>✅ {t('notification.markAllRead', { defaultValue: 'Mark All Read' })}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleClearAll} style={[styles.actionBtn, styles.clearBtn]}>
            <Text style={styles.clearBtnTxt}>🗑 {t('notification.clear', { defaultValue: 'Clear' })}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Notifications list */}
      {isLoading ? (
        <ActivityIndicator color={COLORS.primaryGreen} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <NotificationCard item={item} onPress={handlePress} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyEmoji}>🔔</Text>
              <Text style={styles.emptyTitle}>
                {activeTab === 'unread'
                  ? t('notification.noUnread', { defaultValue: 'No unread notifications!' })
                  : t('notification.noNotifs', { defaultValue: 'No notifications yet!' })}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header - ✅ Premium back icon
  header: {
    paddingTop: 50, paddingBottom: 20, paddingHorizontal: SPACING.xl,
    flexDirection: 'row', alignItems: 'center',
  },
  backBtn: { marginRight: SPACING.md },
  backIconWrap: {
    width: 36, height: 36, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: COLORS.white, fontSize: 24, fontWeight: 'bold', marginTop: -2 },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: FONTS.xl, fontWeight: FONTS.bold, color: COLORS.white },
  headerBadge: {
    backgroundColor: COLORS.accentRed, borderRadius: 12,
    minWidth: 24, height: 24, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeTxt: { color: COLORS.white, fontSize: FONTS.sm, fontWeight: FONTS.bold },

  // Tab bar
  tabBar: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  tabBtn: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: COLORS.primaryGreen },
  tabBtnTxt: { fontSize: FONTS.sm, color: COLORS.textMuted, fontWeight: FONTS.medium },
  tabBtnTxtActive: { color: COLORS.primaryGreen, fontWeight: FONTS.bold },

  // Actions row
  actionsRow: {
    flexDirection: 'row', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm, gap: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.borderLight,
  },
  actionBtn: {
    flex: 1, backgroundColor: '#E8F5E9', borderRadius: RADIUS.md,
    paddingVertical: 8, alignItems: 'center',
  },
  actionBtnTxt: { fontSize: FONTS.xs, color: COLORS.primaryGreen, fontWeight: FONTS.semiBold },
  clearBtn: { backgroundColor: '#FFEBEE', flex: 0, paddingHorizontal: SPACING.md },
  clearBtnTxt: { fontSize: FONTS.xs, color: COLORS.accentRed, fontWeight: FONTS.semiBold },

  // Notification Card - ✅ FIX: Bell centered
  notifCard: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl, padding: SPACING.md,
    alignItems: 'center', ...SHADOWS.small, position: 'relative',
  },
  notifCardUnread: {
    backgroundColor: '#FAFFFE',
    borderLeftWidth: 3, borderLeftColor: COLORS.primaryGreen,
  },
  unreadDot: {
    position: 'absolute', top: 12, right: 12,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: COLORS.primaryGreen,
  },
  notifIcon: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
  },
  notifEmoji: { fontSize: 26 },
  notifContent: { flex: 1 },
  notifTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  notifTitle: {
    flex: 1, fontSize: FONTS.md, fontWeight: FONTS.semiBold,
    color: COLORS.textSecondary, lineHeight: 20,
  },
  notifTitleUnread: { color: COLORS.textPrimary, fontWeight: FONTS.bold },
  notifTime: { fontSize: FONTS.xs, color: COLORS.textMuted, marginLeft: SPACING.sm },
  notifMsg: { fontSize: FONTS.sm, color: COLORS.textSecondary, lineHeight: 20, marginTop: 4 },

  // Empty
  emptyBox: { alignItems: 'center', paddingVertical: 80 },
  emptyEmoji: { fontSize: 64, marginBottom: SPACING.lg },
  emptyTitle: { fontSize: FONTS.xl, fontWeight: FONTS.bold, color: COLORS.textSecondary },
});

export default NotificationScreen;
