// ============================================================
// 💬 FARMER CHAT SCREEN
// ✅ Real Firestore chat - no fake messages!
// Consumer ↔ Farmer real-time messaging
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
import { sendChatMessage, listenToChatMessages, createOrGetChatRoom, deleteChatMessage } from '../../services/firebase';
import { getAllFarmers } from '../../services/firebase';
import BackButton from '../../utils/BackButton';

const AvatarView = ({ uri, name, size = 58, style }) => {
  const [err, setErr] = useState(false);
  const letter = (name || 'F').charAt(0).toUpperCase();
  const bg = ['#1B8A4E', '#1565C0', '#E65100', '#6A1B9A'][letter.charCodeAt(0) % 4];
  if (!uri || err) return <View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }, style]}><Text style={{ color: '#fff', fontSize: size * 0.4, fontWeight: 'bold' }}>{letter}</Text></View>;
  return <FastImage source={{ uri, priority: FastImage.priority.normal }} style={[{ width: size, height: size, borderRadius: size / 2 }, style]} resizeMode={FastImage.resizeMode.cover} onError={() => setErr(true)} />;
};

// ── Quick Reply suggestions ──
const QUICK_REPLIES = [
  'chat.quickReply1',
  'chat.quickReply2',
  'chat.quickReply3',
  'chat.quickReply4',
];

// ── Single Message Bubble ──
const MessageBubble = ({ message, isMe, onLongPress }) => (
  <TouchableOpacity onLongPress={onLongPress} delayLongPress={500} activeOpacity={0.8} style={[styles.bubbleWrap, isMe ? styles.bubbleRight : styles.bubbleLeft]}>
    {!isMe && (
      <View style={styles.farmerDot}>
        <Text style={{ fontSize: 10 }}>👨‍🌾</Text>
      </View>
    )}
    <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleFarmer]}>
      <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
        {message.text}
      </Text>
      <View style={styles.bubbleMeta}>
        <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
          {message.time || ''} {isMe ? '✓✓' : ''}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);

// ── Chat List Screen (All Conversations) ──
export const ChatListScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [farmers, setFarmers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const r = await getAllFarmers();
        setFarmers(Array.isArray(r?.data) ? r.data : []);
      } catch (e) { setFarmers([]); }
      setIsLoading(false);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.headerTitle, { marginLeft: SPACING.md }]}>💬 {t('chat.farmerChat', { defaultValue: 'விவசாயி அரட்டை' })}</Text>
      </LinearGradient>

      {isLoading ? (
        <ActivityIndicator color={COLORS.primaryGreen} size="large" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={farmers}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: SPACING.lg }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.chatListItem}
              onPress={() => navigation.navigate('FarmerChatRoom', { farmer: item })}>
              <View style={styles.avatarWrap}>
                <AvatarView uri={item.avatar || item.photoURL} name={item.nameTa || item.name} size={58} />
                <View style={styles.onlineIndicator} />
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatInfoTop}>
                  <View style={styles.nameRow}>
                    <Text style={styles.chatFarmerName}>{item.nameTa || item.name}</Text>
                    {item.isVerified && <Text style={{ fontSize: 13 }}>  ✅</Text>}
                  </View>
                </View>
                <Text style={styles.lastMessage} numberOfLines={1}>
                  {t('chat.startChatting', { defaultValue: 'அரட்டையை தொடங்குங்கள்' })}
                </Text>
                <Text style={styles.chatFarmerLoc}>📍 {(item.location || '').split(',')[0]}</Text>
              </View>
              <Text style={styles.chatArrow}>›</Text>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: 60 }}>
              <Text style={{ fontSize: 56 }}>👨‍🌾</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

// ── Chat Room Screen (Individual Conversation) ──
const FarmerChatRoomScreen = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { farmer } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState(route.params?.initialMessage || '');
  const [isSending, setIsSending] = useState(false);
  const flatListRef = useRef(null);

  const userId = user?.id || user?.uid || '';

  // ✅ Real-time Firestore listener for messages (consumer role)
  useEffect(() => {
    if (!userId || !farmer?.id) return;
    let unsub = null;

    // Must await room creation BEFORE starting listener
    // Messages rule does get() on parent doc — it must exist first
    const setup = async () => {
      await createOrGetChatRoom(farmer.id, userId);
      unsub = listenToChatMessages(userId, farmer.id, result => {
        setMessages(Array.isArray(result?.data) ? result.data : []);
      }, 'consumer');
    };
    setup();

    return () => { if (typeof unsub === 'function') unsub(); };
  }, [userId, farmer?.id]);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 300);
  }, [messages]);

  // ✅ Send real message via Firestore
  const handleSendMessage = async () => {
    if (!inputText.trim() || isSending) return;
    setIsSending(true);
    try {
      await sendChatMessage(userId, farmer.id, inputText.trim(), 'consumer');
      setInputText('');
    } catch (e) {
      console.log('Send message error:', e.message);
    }
    setIsSending(false);
  };

  const handleDeleteMessage = (msgId) => {
    Alert.alert(t('chat.deleteTitle', { defaultValue: 'Delete Message' }), t('chat.deletePrompt', { defaultValue: 'Are you sure you want to delete this message?' }), [
      { text: t('chat.deleteForMe', { defaultValue: 'Delete for me' }), onPress: async () => {
        await deleteChatMessage(farmer.id, userId, msgId);
      }},
      { text: t('chat.deleteForEveryone', { defaultValue: 'Delete for everyone' }), style: 'destructive', onPress: async () => {
        await deleteChatMessage(farmer.id, userId, msgId);
      }},
      { text: t('chat.cancel', { defaultValue: 'Cancel' }), style: 'cancel' }
    ]);
  };

  const sendQuickReply = (reply) => {
    setInputText(reply.ta);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* Header */}
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.chatRoomHeader}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={{ marginLeft: SPACING.md }}>
          <AvatarView uri={farmer.avatar || farmer.photoURL} name={farmer.nameTa || farmer.name} size={44} style={{ borderWidth: 2, borderColor: COLORS.white }} />
        </View>
        <View style={styles.roomInfo}>
          <View style={styles.roomNameRow}>
            <Text style={styles.roomName}>{farmer.nameTa || farmer.name}</Text>
            {farmer.isVerified && <Text style={{ fontSize: 13, marginLeft: 4 }}>✅</Text>}
          </View>
          <Text style={styles.roomStatus}>🟢 Online</Text>
        </View>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesList}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isMe={item.senderId === userId}
            onLongPress={() => handleDeleteMessage(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyChatEmoji}>💬</Text>
            <Text style={styles.emptyChatTxt}>
              {farmer.nameTa || farmer.name} - {t('chat.startConversation', { defaultValue: 'அரட்டையை தொடங்குங்கள்!' })}
            </Text>
            <Text style={styles.emptyChatSubTxt}>
              {t('chat.startConversation', { defaultValue: 'Start chatting with ' })}{farmer.name || farmer.nameTa}!
            </Text>
          </View>
        }
      />

      {/* Quick replies */}
      <View style={styles.quickRepliesWrap}>
        <FlatList
          data={QUICK_REPLIES}
          keyExtractor={(_, i) => String(i)}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: SPACING.md }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.quickReplyChip}
              onPress={() => sendQuickReply({ ta: t(item) })}>
              <Text style={styles.quickReplyTxt}>{t(item)}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Input bar */}
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
          style={[styles.sendBtn, inputText.trim() && styles.sendBtnActive]}
          onPress={handleSendMessage}
          disabled={!inputText.trim() || isSending}>
          <LinearGradient
            colors={inputText.trim() ? COLORS.gradientButton : ['#E0E0E0', '#BDBDBD']}
            style={styles.sendBtnGrad}>
            <Text style={styles.sendBtnTxt}>➤</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingTop: 50, paddingBottom: 20,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
  },
  backBtn: { padding: 4 },
  backTxt: { color: COLORS.white, fontSize: FONTS.xxl, fontWeight: FONTS.bold },
  headerTitle: { flex: 1, fontSize: FONTS.xl, fontWeight: FONTS.bold, color: COLORS.white },
  headerSubtitle: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.7)' },
  chatListItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.md, ...SHADOWS.small,
  },
  avatarWrap: { position: 'relative', marginRight: SPACING.md },
  onlineIndicator: {
    position: 'absolute', bottom: 2, right: 2,
    width: 13, height: 13, borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2, borderColor: COLORS.white,
  },
  chatInfo: { flex: 1 },
  chatInfoTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  nameRow: { flexDirection: 'row', alignItems: 'center' },
  chatFarmerName: { fontSize: FONTS.md, fontWeight: FONTS.bold, color: COLORS.textPrimary },
  lastMessage: { flex: 1, fontSize: FONTS.sm, color: COLORS.textSecondary },
  chatFarmerLoc: { fontSize: FONTS.xs, color: COLORS.textMuted, marginTop: 2 },
  chatArrow: { fontSize: FONTS.xl, color: COLORS.textMuted, marginLeft: SPACING.sm },
  separator: { height: SPACING.sm },
  chatRoomHeader: {
    paddingTop: 50, paddingBottom: 16, paddingHorizontal: SPACING.xl,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
  },
  roomInfo: { flex: 1 },
  roomNameRow: { flexDirection: 'row', alignItems: 'center' },
  roomName: { fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.white },
  roomStatus: { fontSize: FONTS.xs, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  messagesList: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  bubbleWrap: { flexDirection: 'row', marginBottom: SPACING.md, alignItems: 'flex-end' },
  bubbleRight: { justifyContent: 'flex-end' },
  bubbleLeft: { justifyContent: 'flex-start' },
  farmerDot: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#E8F5E9', alignItems: 'center',
    justifyContent: 'center', marginRight: SPACING.sm,
  },
  bubble: {
    maxWidth: '75%', borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  bubbleMe: { backgroundColor: COLORS.primaryGreen, borderBottomRightRadius: 4 },
  bubbleFarmer: { backgroundColor: COLORS.white, borderBottomLeftRadius: 4, ...SHADOWS.small },
  bubbleText: { fontSize: FONTS.md, color: COLORS.textPrimary, lineHeight: 22 },
  bubbleTextMe: { color: COLORS.white },
  bubbleMeta: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 4, gap: 4 },
  bubbleTime: { fontSize: FONTS.xs, color: COLORS.textMuted },
  bubbleTimeMe: { color: 'rgba(255,255,255,0.7)' },
  quickRepliesWrap: {
    backgroundColor: COLORS.white,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1, borderTopColor: COLORS.borderLight,
  },
  quickReplyChip: {
    backgroundColor: '#E8F5E9', borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md, paddingVertical: 7,
    marginRight: SPACING.sm, borderWidth: 1.5,
    borderColor: COLORS.primaryGreen,
  },
  quickReplyTxt: { fontSize: FONTS.sm, color: COLORS.primaryGreen, fontWeight: FONTS.semiBold },
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
  sendBtn: { borderRadius: RADIUS.round, overflow: 'hidden' },
  sendBtnActive: {},
  sendBtnGrad: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  sendBtnTxt: { color: COLORS.white, fontSize: FONTS.xl, fontWeight: FONTS.bold },
  emptyChat: { alignItems: 'center', paddingVertical: 60 },
  emptyChatEmoji: { fontSize: 56, marginBottom: SPACING.md },
  emptyChatTxt: { fontSize: FONTS.lg, color: COLORS.textSecondary, fontWeight: FONTS.semiBold },
  emptyChatSubTxt: { fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 4 },
});

export default FarmerChatRoomScreen;
