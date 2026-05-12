// ============================================================
// 💬 FARMER CUSTOMER CHAT SCREEN
// ✅ Farmer side of full-duplex chat
// ✅ Lists all customer conversations
// ✅ Real-time Firestore messaging
// ============================================================

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import {
  listenToFarmerChats, sendChatMessage,
  listenToChatMessages, getUserProfile, deleteChatMessage
} from '../../services/firebase';
import BackButton from '../../utils/BackButton';

const AvatarView = ({ uri, name, size = 52, style }) => {
  const [err, setErr] = useState(false);
  const letter = (name || 'C').charAt(0).toUpperCase();
  const bg = ['#1565C0', '#E65100', '#6A1B9A', '#1B8A4E'][letter.charCodeAt(0) % 4];
  if (!uri || err) return <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }, style]}><Text style={{ color: '#fff', fontSize: size * 0.4, fontWeight: 'bold' }}>{letter}</Text></View>;
  return <FastImage source={{ uri, priority: FastImage.priority.normal }} style={[{ width: size, height: size, borderRadius: size / 2 }, style]} resizeMode={FastImage.resizeMode.cover} onError={() => setErr(true)} />;
};

// ── Message Bubble ──
const MessageBubble = ({ message, isMe, onLongPress }) => (
  <TouchableOpacity onLongPress={onLongPress} delayLongPress={500} activeOpacity={0.8} style={[styles.bubbleWrap, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
    {!isMe && (
      <View style={styles.customerDot}>
        <Text style={{ fontSize: 10 }}>👤</Text>
      </View>
    )}
    <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleCustomer]}>
      <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>{message.text}</Text>
      <View style={styles.bubbleMeta}>
        <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>{message.time || ''}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

// ── Farmer Chat List (All Customer Conversations) ──
export const FarmerChatListScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [customerNames, setCustomerNames] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const farmerId = user?.id || user?.uid;

  // ✅ Real-time listener for all farmer's chat rooms
  useEffect(() => {
    if (!farmerId) { setIsLoading(false); return; }
    const unsub = listenToFarmerChats(farmerId, result => {
      const chatData = Array.isArray(result?.data) ? result.data : [];
      setChats(chatData);
      setIsLoading(false);

      // Fetch customer names for each chat
      chatData.forEach(async chat => {
        const cId = chat.consumerId;
        if (cId && !customerNames[cId]) {
          try {
            const profile = await getUserProfile(cId);
            if (profile.success && profile.data) {
              setCustomerNames(prev => ({ ...prev, [cId]: profile.data }));
            }
          } catch (e) { /* skip */ }
        }
      });
    });
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [farmerId]);

  const getTimeAgo = (timestamp) => {
    if (!timestamp?.toDate) return '';
    const date = timestamp.toDate();
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'இப்போது';
    if (diff < 3600) return `${Math.floor(diff / 60)} நிமி`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} மணி`;
    return date.toLocaleDateString('ta-IN');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={{ flex: 1, marginLeft: SPACING.md }}>
          <Text style={styles.headerTitle}>💬 {t('farmer.customerChats', { defaultValue: 'நுகர்வோர் அரட்டை' })}</Text>
        </View>
      </LinearGradient>

      {isLoading ? (
        <ActivityIndicator color={COLORS.primaryGreen} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}
          renderItem={({ item }) => {
            const customer = customerNames[item.consumerId] || {};
            const customerName = customer.name || customer.nameTa || item.consumerId?.slice(0, 8) || 'Customer';
            return (
              <TouchableOpacity
                style={styles.chatListItem}
                onPress={() => navigation.navigate('FarmerCustomerChatRoom', {
                  consumerId: item.consumerId,
                  consumerName: customerName,
                  consumerAvatar: customer.avatar || customer.photoURL,
                })}>
                <AvatarView
                  uri={customer.avatar || customer.photoURL}
                  name={customerName}
                  size={52}
                />
                <View style={styles.chatInfo}>
                  <View style={styles.chatInfoTop}>
                    <Text style={styles.chatName} numberOfLines={1}>{customerName}</Text>
                    <Text style={styles.chatTime}>{getTimeAgo(item.lastMessageTime)}</Text>
                  </View>
                  <Text style={styles.chatLastMsg} numberOfLines={1}>
                    {item.lastSenderId === farmerId ? '✓ ' : ''}{item.lastMessage || t('chat.startChatting', { defaultValue: 'அரட்டையை தொடங்குங்கள்' })}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: SPACING.sm }} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={{ fontSize: 56 }}>💬</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

// ── Farmer Chat Room (Individual conversation with a customer) ──
export const FarmerCustomerChatRoomScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { consumerId, consumerName, consumerAvatar } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef(null);

  const farmerId = user?.id || user?.uid || '';

  // ✅ Real-time listener - farmer role
  useEffect(() => {
    if (!farmerId || !consumerId) return;
    const unsub = listenToChatMessages(farmerId, consumerId, result => {
      setMessages(Array.isArray(result?.data) ? result.data : []);
    }, 'farmer');
    return () => { if (typeof unsub === 'function') unsub(); };
  }, [farmerId, consumerId]);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 300);
  }, [messages]);

  // ✅ Send as farmer
  const handleSend = async () => {
    if (!inputText.trim() || isSending) return;
    setIsSending(true);
    try {
      await sendChatMessage(farmerId, consumerId, inputText.trim(), 'farmer');
      setInputText('');
    } catch (e) {
      console.log('Farmer send error:', e.message);
    }
    setIsSending(false);
  };

  const handleDeleteMessage = (msgId) => {
    Alert.alert('Delete Message / செய்தியை நீக்கு', 'Are you sure you want to delete this message?', [
      { text: 'Cancel / ரத்துசெய்', style: 'cancel' },
      { text: 'Delete / நீக்கு', style: 'destructive', onPress: async () => {
        await deleteChatMessage(farmerId, consumerId, msgId);
      }}
    ]);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.roomHeader}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={{ marginLeft: SPACING.md }}>
          <AvatarView uri={consumerAvatar} name={consumerName} size={44} style={{ borderWidth: 2, borderColor: COLORS.white }} />
        </View>
        <View style={{ flex: 1, marginLeft: SPACING.sm }}>
          <Text style={styles.roomName} numberOfLines={1}>{consumerName}</Text>
          <Text style={styles.roomSub}>👤 Customer</Text>
        </View>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: SPACING.xl }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <MessageBubble 
            message={item} 
            isMe={item.senderId === farmerId} 
            onLongPress={() => handleDeleteMessage(item.id)} 
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 56 }}>💬</Text>
            <Text style={styles.emptyTitle}>{consumerName}</Text>
            <Text style={styles.emptySub}>{t('chat.startConversation', { defaultValue: 'அரட்டையை தொடங்குங்கள்!' })}</Text>
          </View>
        }
      />

      {/* Quick replies for farmer */}
      <View style={styles.quickRow}>
        {[
          'ஆர்டர் உறுதி ஆகிவிட்டது ✅',
          'விநியோகம் நாளை வரும் 🚚',
          'கையிருப்பு உள்ளது 👍',
          'நன்றி! 🙏',
        ].map((text, i) => (
          <TouchableOpacity key={i} style={styles.quickChip} onPress={() => setInputText(text)}>
            <Text style={styles.quickTxt} numberOfLines={1}>{text}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.chatInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder={t('chat.placeholder', { defaultValue: 'செய்தி அனுப்புங்கள்...' })}
          placeholderTextColor={COLORS.textGray}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}>
          <LinearGradient
            colors={inputText.trim() ? COLORS.gradientButton : ['#E0E0E0', '#BDBDBD']}
            style={styles.sendGrad}>
            <Text style={styles.sendTxt}>➤</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 50, paddingBottom: 20, paddingHorizontal: SPACING.xl,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
  },
  backBtn: { padding: 4 },
  backTxt: { color: COLORS.white, fontSize: 22, fontWeight: 'bold' },
  headerTitle: { fontSize: FONTS.xl, fontWeight: 'bold', color: COLORS.white },
  headerSub: { fontSize: FONTS.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  chatListItem: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.md, ...SHADOWS.small,
  },
  chatInfo: { flex: 1 },
  chatInfoTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  chatName: { flex: 1, fontSize: FONTS.md, fontWeight: 'bold', color: COLORS.textPrimary },
  chatTime: { fontSize: FONTS.xs, color: COLORS.textMuted },
  chatLastMsg: { fontSize: FONTS.sm, color: COLORS.textSecondary, lineHeight: 18 },
  emptyBox: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: FONTS.lg, fontWeight: 'bold', color: COLORS.textSecondary, marginTop: SPACING.md },
  emptySub: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 4 },
  roomHeader: {
    paddingTop: 50, paddingBottom: 16, paddingHorizontal: SPACING.xl,
    flexDirection: 'row', alignItems: 'center',
  },
  roomName: { fontSize: FONTS.lg, fontWeight: 'bold', color: COLORS.white },
  roomSub: { fontSize: FONTS.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  bubbleWrap: { flexDirection: 'row', marginBottom: SPACING.md, alignItems: 'flex-end' },
  bubbleRight: { justifyContent: 'flex-end' },
  bubbleLeft: { justifyContent: 'flex-start' },
  customerDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#E3F2FD', alignItems: 'center',
    justifyContent: 'center', marginRight: SPACING.sm,
  },
  bubble: { maxWidth: '75%', borderRadius: RADIUS.xl, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm },
  bubbleMe: { backgroundColor: COLORS.primaryGreen, borderBottomRightRadius: 4 },
  bubbleCustomer: { backgroundColor: COLORS.white, borderBottomLeftRadius: 4, ...SHADOWS.small },
  bubbleText: { fontSize: FONTS.md, color: COLORS.textPrimary, lineHeight: 22 },
  bubbleTextMe: { color: COLORS.white },
  bubbleMeta: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 },
  bubbleTime: { fontSize: FONTS.xs, color: COLORS.textMuted },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.7)' },
  quickRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white, borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  quickChip: {
    backgroundColor: '#E8F5E9', borderRadius: RADIUS.full || 100,
    paddingHorizontal: SPACING.sm, paddingVertical: 5,
    borderWidth: 1, borderColor: COLORS.primaryGreen,
  },
  quickTxt: { fontSize: FONTS.xs, color: COLORS.primaryGreen, fontWeight: '600' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: COLORS.white, padding: SPACING.md,
    paddingHorizontal: SPACING.lg, gap: SPACING.sm,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
  },
  chatInput: {
    flex: 1, backgroundColor: COLORS.background,
    borderRadius: RADIUS.xl, paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm, fontSize: FONTS.md,
    color: COLORS.textPrimary, maxHeight: 100,
    borderWidth: 1.5, borderColor: COLORS.borderLight,
  },
  sendBtn: { borderRadius: 24, overflow: 'hidden' },
  sendGrad: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  sendTxt: { color: COLORS.white, fontSize: FONTS.xl, fontWeight: 'bold' },
});

export default FarmerChatListScreen;
