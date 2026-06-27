// ============================================================
// 💬 FARMER CUSTOMER CHAT SCREEN
// ✅ Farmer side of full-duplex chat
// ✅ Lists all customer conversations
// ✅ Real-time Firestore messaging
// ============================================================

import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../../context/AuthContext';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  SHADOWS,
  getThemeColors,
} from '../../utils/theme';
import {useTheme} from '../../context/ThemeContext';
import {
  listenToFarmerChats,
  sendChatMessage,
  listenToChatMessages,
  getUserProfile,
  deleteChatMessage,
  deleteChatMessageForEveryone,
} from '../../services/firebase';
import BackButton from '../../utils/BackButton';

const AvatarView = ({uri, name, size = 52, style}) => {
  const [err, setErr] = useState(false);
  const letter = (name || 'C').charAt(0).toUpperCase();
  const bg = ['#1565C0', '#E65100', '#6A1B9A', '#1B8A4E'][
    letter.charCodeAt(0) % 4
  ];
  if (!uri || err) {
    return (
      <View
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bg,
            alignItems: 'center',
            justifyContent: 'center',
          },
          style,
        ]}>
        <Text style={{color: '#fff', fontSize: size * 0.4, fontWeight: 'bold'}}>
          {letter}
        </Text>
      </View>
    );
  }
  return (
    <FastImage
      source={{uri, priority: FastImage.priority.normal}}
      style={[{width: size, height: size, borderRadius: size / 2}, style]}
      resizeMode={FastImage.resizeMode.cover}
      onError={() => setErr(true)}
    />
  );
};

// ── Message Bubble ──
const MessageBubble = ({message, isMe, onLongPress}) => {
  const {t} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const isLocation = message.text && message.text.startsWith('📍 Location:');
  const locationUrl = isLocation ? message.text.split('Location: ')[1] : '';

  const handleOpenMap = () => {
    if (locationUrl) {
      Linking.openURL(locationUrl).catch(err =>
        console.log('Open map error:', err),
      );
    }
  };

  return (
    <TouchableOpacity
      onLongPress={onLongPress}
      delayLongPress={500}
      activeOpacity={0.8}
      style={[
        styles.bubbleWrap,
        isMe ? styles.bubbleRight : styles.bubbleLeft,
      ]}>
      {!isMe && (
        <View
          style={[styles.customerDot, isDark && {backgroundColor: '#1E1E1E'}]}>
          <Text style={{fontSize: 10}}>👤</Text>
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isMe
            ? styles.bubbleMe
            : [styles.bubbleCustomer, {backgroundColor: themeColors.cardBg}],
          isLocation && styles.bubbleLocation,
        ]}>
        {isLocation ? (
          <TouchableOpacity
            onPress={handleOpenMap}
            style={[
              styles.mapCard,
              {
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border,
              },
            ]}>
            <View style={styles.mapHeaderRow}>
              <Text style={{fontSize: 24}}>🗺️</Text>
              <View style={styles.mapTextCol}>
                <Text style={[styles.mapTitle, {color: themeColors.text}]}>
                  {t('chat.sharedLocation', {
                    defaultValue: '📍 Shared Location',
                  })}
                </Text>
                <Text
                  style={[styles.mapSubtitle, {color: themeColors.textMuted}]}
                  numberOfLines={1}>
                  {locationUrl}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.mapDivider,
                isMe ? styles.mapDividerMe : styles.mapDividerOther,
                {backgroundColor: themeColors.border},
              ]}
            />
            <Text style={[styles.mapBtnTxt, isMe && styles.mapBtnTxtMe]}>
              {t('chat.viewOnMap', {defaultValue: 'View on Map'})}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text
            style={[
              styles.bubbleText,
              isMe ? styles.bubbleTextMe : {color: themeColors.text},
            ]}>
            {message.text}
          </Text>
        )}
        <View style={styles.bubbleMeta}>
          <Text
            style={[
              styles.bubbleTime,
              isMe ? styles.bubbleTimeMe : {color: themeColors.textMuted},
            ]}>
            {message.time || ''} {isMe ? '✓✓' : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

// ── Farmer Chat List (All Customer Conversations) ──
export const FarmerChatListScreen = ({navigation}) => {
  const {t} = useTranslation();
  const {user} = useAuth();
  const [chats, setChats] = useState([]);
  const [customerNames, setCustomerNames] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const farmerId = user?.id || user?.uid;

  // ✅ Real-time listener for all farmer's chat rooms
  useEffect(() => {
    if (!farmerId) {
      setIsLoading(false);
      return;
    }
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
              setCustomerNames(prev => ({...prev, [cId]: profile.data}));
            }
          } catch (e) {
            /* skip */
          }
        }
      });
    });
    return () => {
      if (typeof unsub === 'function') {
        unsub();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [farmerId]);

  const getTimeAgo = timestamp => {
    if (!timestamp?.toDate) {
      return '';
    }
    const date = timestamp.toDate();
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) {
      return 'இப்போது';
    }
    if (diff < 3600) {
      return `${Math.floor(diff / 60)} நிமி`;
    }
    if (diff < 86400) {
      return `${Math.floor(diff / 3600)} மணி`;
    }
    return date.toLocaleDateString('ta-IN');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={{flex: 1, marginLeft: SPACING.md}}>
          <Text style={styles.headerTitle}>
            💬 {t('farmer.customerChats', {defaultValue: 'நுகர்வோர் அரட்டை'})}
          </Text>
        </View>
      </LinearGradient>

      {isLoading ? (
        <ActivityIndicator
          color={COLORS.primaryGreen}
          size="large"
          style={{marginTop: 40}}
        />
      ) : (
        <FlatList
          data={chats}
          keyExtractor={item => item.id}
          contentContainerStyle={{padding: SPACING.lg, paddingBottom: 100}}
          renderItem={({item}) => {
            const customer = customerNames[item.consumerId] || {};
            const customerName =
              customer.name ||
              customer.nameTa ||
              item.consumerId?.slice(0, 8) ||
              'Customer';
            return (
              <TouchableOpacity
                style={styles.chatListItem}
                onPress={() =>
                  navigation.navigate('FarmerCustomerChatRoom', {
                    consumerId: item.consumerId,
                    consumerName: customerName,
                    consumerAvatar: customer.avatar || customer.photoURL,
                  })
                }>
                <AvatarView
                  uri={customer.avatar || customer.photoURL}
                  name={customerName}
                  size={52}
                />
                <View style={styles.chatInfo}>
                  <View style={styles.chatInfoTop}>
                    <Text style={styles.chatName} numberOfLines={1}>
                      {customerName}
                    </Text>
                    <Text style={styles.chatTime}>
                      {getTimeAgo(item.lastMessageTime)}
                    </Text>
                  </View>
                  <Text style={styles.chatLastMsg} numberOfLines={1}>
                    {item.lastSenderId === farmerId ? '✓ ' : ''}
                    {item.lastMessage ||
                      t('chat.startChatting', {
                        defaultValue: 'அரட்டையை தொடங்குங்கள்',
                      })}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          ItemSeparatorComponent={() => <View style={{height: SPACING.sm}} />}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={{fontSize: 56}}>💬</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

// ── Farmer Chat Room (Individual conversation with a customer) ──
export const FarmerCustomerChatRoomScreen = ({route, navigation}) => {
  const {t} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const {user} = useAuth();
  const {consumerId, consumerName, consumerAvatar} = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const flatListRef = useRef(null);

  const farmerId = user?.id || user?.uid || '';

  // ✅ Real-time listener - farmer role
  useEffect(() => {
    if (!farmerId || !consumerId) {
      return;
    }
    const unsub = listenToChatMessages(
      farmerId,
      consumerId,
      result => {
        setMessages(Array.isArray(result?.data) ? result.data : []);
      },
      'farmer',
    );
    return () => {
      if (typeof unsub === 'function') {
        unsub();
      }
    };
  }, [farmerId, consumerId]);

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({animated: true});
    }, 300);
  }, [messages]);

  // ✅ Send as farmer
  const handleSend = async () => {
    if (!inputText.trim() || isSending) {
      return;
    }
    setIsSending(true);
    try {
      await sendChatMessage(farmerId, consumerId, inputText.trim(), 'farmer');
      setInputText('');
    } catch (e) {
      console.log('Farmer send error:', e.message);
    }
    setIsSending(false);
  };

  const handleDeleteMessage = message => {
    if (message.isDeleted) {
      return;
    }
    setSelectedMessage(message);
    setDeleteModalVisible(true);
  };

  const handleShareLocation = () => {
    Alert.alert(
      t('chat.sendLocationTitle', {defaultValue: 'Share Location'}),
      t('chat.sendLocationPrompt', {
        defaultValue: 'Send your current location?',
      }),
      [
        {
          text: t('common.cancel', {defaultValue: 'Cancel'}),
          style: 'cancel',
        },
        {
          text: t('common.send', {defaultValue: 'Send'}),
          onPress: async () => {
            try {
              const {PermissionsAndroid, Platform} = require('react-native');
              let granted = false;
              if (Platform.OS === 'android') {
                const res = await PermissionsAndroid.request(
                  PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                );
                granted = res === PermissionsAndroid.RESULTS.GRANTED;
              } else {
                granted = true;
              }

              if (!granted) {
                Alert.alert(
                  t('common.error', {defaultValue: 'பிழை'}),
                  t('chat.locationPermissionErr', {
                    defaultValue: 'GPS permission denied',
                  }),
                );
                return;
              }

              const Geolocation = require('@react-native-community/geolocation');
              Geolocation.getCurrentPosition(
                async pos => {
                  const {latitude, longitude} = pos.coords;
                  const locMsg = `📍 Location: https://maps.google.com/?q=${latitude},${longitude}`;
                  await sendChatMessage(farmerId, consumerId, locMsg, 'farmer');
                },
                err => {
                  Alert.alert(
                    t('common.error', {defaultValue: 'பிழை'}),
                    err.message,
                  );
                },
                {enableHighAccuracy: true, timeout: 15000, maximumAge: 0},
              );
            } catch (e) {
              console.log('Share location error:', e);
            }
          },
        },
      ],
    );
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, {backgroundColor: themeColors.bg}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.roomHeader}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={{marginLeft: SPACING.md}}>
          <AvatarView
            uri={consumerAvatar}
            name={consumerName}
            size={44}
            style={{borderWidth: 2, borderColor: COLORS.white}}
          />
        </View>
        <View style={{flex: 1, marginLeft: SPACING.sm}}>
          <Text style={styles.roomName} numberOfLines={1}>
            {consumerName}
          </Text>
          <Text style={styles.roomSub}>👤 Customer</Text>
        </View>
      </LinearGradient>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={{padding: SPACING.lg, paddingBottom: SPACING.xl}}
        showsVerticalScrollIndicator={false}
        renderItem={({item}) => (
          <MessageBubble
            message={item}
            isMe={item.senderId === farmerId}
            onLongPress={() => handleDeleteMessage(item)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={{fontSize: 56}}>💬</Text>
            <Text style={[styles.emptyTitle, {color: themeColors.text}]}>
              {consumerName}
            </Text>
          </View>
        }
      />

      {/* Quick replies for farmer */}
      <View
        style={[
          styles.quickRow,
          {
            backgroundColor: themeColors.cardBg,
            borderTopColor: themeColors.border,
          },
        ]}>
        {[
          'chat.farmerReply1',
          'chat.farmerReply2',
          'chat.farmerReply3',
          'chat.farmerReply4',
        ].map((key, i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.quickChip,
              {
                backgroundColor: isDark ? '#1E3A2F' : '#E8F5E9',
                borderColor: COLORS.primaryGreen,
              },
            ]}
            onPress={() => setInputText(t(key))}>
            <Text style={styles.quickTxt} numberOfLines={1}>
              {t(key)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input */}
      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: themeColors.cardBg,
            borderTopColor: themeColors.border,
          },
        ]}>
        <TouchableOpacity
          style={styles.locationPinBtn}
          onPress={handleShareLocation}>
          <Text style={{fontSize: 22}}>📍</Text>
        </TouchableOpacity>
        <TextInput
          style={[
            styles.chatInput,
            {
              backgroundColor: themeColors.inputBg,
              borderColor: themeColors.border,
              color: themeColors.text,
            },
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={t('chat.placeholder', {
            defaultValue: 'செய்தி அனுப்புங்கள்...',
          })}
          placeholderTextColor={
            isDark ? 'rgba(255,255,255,0.4)' : COLORS.textGray
          }
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}>
          <LinearGradient
            colors={
              inputText.trim()
                ? COLORS.gradientButton
                : isDark
                ? ['#333333', '#222222']
                : ['#E0E0E0', '#BDBDBD']
            }
            style={styles.sendGrad}>
            <Text style={styles.sendTxt}>➤</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* WhatsApp style stacked delete message modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDeleteModalVisible(false)}>
          <View
            style={[
              styles.modalContent,
              {backgroundColor: themeColors.cardBg},
            ]}>
            <Text style={[styles.modalTitle, {color: themeColors.text}]}>
              {t('chat.deleteTitle', {defaultValue: 'Delete message?'})}
            </Text>

            <View style={styles.modalButtonContainer}>
              {/* Delete for everyone - ONLY if current user is the sender */}
              {selectedMessage?.senderId === farmerId && (
                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'},
                  ]}
                  onPress={async () => {
                    setDeleteModalVisible(false);
                    const deletedText = t('chat.messageDeletedEveryone', {
                      defaultValue: '🚫 This message was deleted',
                    });
                    await deleteChatMessageForEveryone(
                      farmerId,
                      consumerId,
                      selectedMessage.id,
                      deletedText,
                    );
                    setSelectedMessage(null);
                  }}>
                  <Text
                    style={[styles.modalButtonText, styles.textDestructive]}>
                    {t('chat.deleteForEveryone', {
                      defaultValue: 'Delete for everyone',
                    })}
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'},
                ]}
                onPress={async () => {
                  setDeleteModalVisible(false);
                  await deleteChatMessage(
                    farmerId,
                    consumerId,
                    selectedMessage.id,
                  );
                  setSelectedMessage(null);
                }}>
                <Text style={styles.modalButtonText}>
                  {t('chat.deleteForMe', {defaultValue: 'Delete for me'})}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.modalCancelButton,
                  {
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.border,
                  },
                ]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setSelectedMessage(null);
                }}>
                <Text style={[styles.modalButtonText, styles.textCancel]}>
                  {t('chat.cancel', {defaultValue: 'Cancel'})}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  backBtn: {padding: 4},
  backTxt: {color: COLORS.white, fontSize: 22, fontWeight: 'bold'},
  headerTitle: {fontSize: FONTS.xl, fontWeight: 'bold', color: COLORS.white},
  headerSub: {fontSize: FONTS.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2},
  chatListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    ...SHADOWS.small,
  },
  chatInfo: {flex: 1},
  chatInfoTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 3,
  },
  chatName: {
    flex: 1,
    fontSize: FONTS.md,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  chatTime: {fontSize: FONTS.xs, color: COLORS.textMuted},
  chatLastMsg: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  emptyBox: {alignItems: 'center', paddingVertical: 80},
  emptyTitle: {
    fontSize: FONTS.lg,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptySub: {fontSize: FONTS.sm, color: COLORS.textMuted, marginTop: 4},
  roomHeader: {
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomName: {fontSize: FONTS.lg, fontWeight: 'bold', color: COLORS.white},
  roomSub: {fontSize: FONTS.xs, color: 'rgba(255,255,255,0.8)', marginTop: 2},
  bubbleWrap: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-end',
  },
  bubbleRight: {justifyContent: 'flex-end'},
  bubbleLeft: {justifyContent: 'flex-start'},
  customerDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  bubble: {
    maxWidth: '75%',
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  bubbleMe: {backgroundColor: COLORS.primaryGreen, borderBottomRightRadius: 4},
  bubbleCustomer: {
    backgroundColor: COLORS.white,
    borderBottomLeftRadius: 4,
    ...SHADOWS.small,
  },
  bubbleText: {fontSize: FONTS.md, color: COLORS.textPrimary, lineHeight: 22},
  bubbleTextMe: {color: COLORS.white},
  bubbleMeta: {flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4},
  bubbleTime: {fontSize: FONTS.xs, color: COLORS.textMuted},
  bubbleTimeMe: {color: 'rgba(255,255,255,0.7)'},
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  quickChip: {
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.full || 100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: COLORS.primaryGreen,
  },
  quickTxt: {fontSize: FONTS.xs, color: COLORS.primaryGreen, fontWeight: '600'},
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  chatInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.xl,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    fontSize: FONTS.md,
    color: COLORS.textPrimary,
    maxHeight: 100,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  sendBtn: {borderRadius: 24, overflow: 'hidden'},
  sendGrad: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendTxt: {color: COLORS.white, fontSize: FONTS.xl, fontWeight: 'bold'},

  // Custom WhatsApp-style Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
  },
  modalTitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textAlign: 'center',
    fontWeight: '500',
  },
  modalButtonContainer: {
    gap: SPACING.sm,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primaryGreen,
  },
  textDestructive: {
    color: COLORS.accentRed,
  },
  modalCancelButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#E0E0E0',
    marginTop: 4,
  },
  textCancel: {
    color: COLORS.textMuted,
  },

  // Share Location button and card
  locationPinBtn: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleLocation: {
    padding: 0,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  mapCard: {
    width: 230,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#E8F5E9',
    ...SHADOWS.small,
  },
  mapHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  mapTextCol: {
    flex: 1,
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  mapTitleMe: {
    color: COLORS.textPrimary,
  },
  mapSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  mapSubtitleMe: {
    color: COLORS.textMuted,
  },
  mapDivider: {
    height: 1,
    marginVertical: SPACING.md,
  },
  mapDividerMe: {
    backgroundColor: '#E8F5E9',
  },
  mapDividerOther: {
    backgroundColor: '#E0E0E0',
  },
  mapBtnTxt: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
    textAlign: 'center',
  },
  mapBtnTxtMe: {
    color: COLORS.primaryGreen,
  },
});

export default FarmerChatListScreen;
