// ============================================================
// 👨‍👩‍👧 VILLAGE GROUP BUY SCREEN
// "கூட்டு வாங்கல்" - Community Group Buying
// 5 பேர் சேர்ந்து order பண்ணினால் → Free Delivery + Discount!
// எந்த Grocery App-லயும் இல்லாத UNIQUE Feature!
// ============================================================

import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Share,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import {useAuth} from '../../context/AuthContext';
import {
  listenToGroupBuys,
  createGroupBuy,
  joinGroupBuy,
  getAllConsumers,
} from '../../services/firebase';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  SHADOWS,
  getThemeColors,
} from '../../utils/theme';
import BackButton from '../../utils/BackButton';
import {useTheme} from '../../context/ThemeContext';

// Read from Firestore instead of hardcoded data

const STATUS_CONFIG = {
  open: {
    color: COLORS.primaryGreen,
    bg: '#E8F5E9',
    labelKey: 'spotsAvailable',
  },
  almostFull: {
    color: COLORS.accentGold,
    bg: '#FFF9E6',
    labelKey: 'almostFull',
  },
  full: {
    color: COLORS.accentRed,
    bg: '#FFEBEE',
    labelKey: 'full',
  },
};

const GroupCard = ({group, onJoin, onDirectAdd, user}) => {
  const {t} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);

  const creatorCount = 1;
  const invitedCount = Math.max(0, group.currentMembers - 1);
  const targetInvited = 5;
  const neededCount = Math.max(0, targetInvited - invitedCount);

  const fillPercent = Math.min((invitedCount / targetInvited) * 100, 100);
  const statusKey =
    neededCount === 0 ? 'full' : neededCount <= 2 ? 'almostFull' : 'open';
  const status = STATUS_CONFIG[statusKey];

  const isMember =
    group.members && group.members.includes(user?.uid || user?.id);

  const handleInvite = async () => {
    const shareMsg = `கூட்டு வாங்கல்: "${group.title}" குழுவில் இணைந்து 15-25% தள்ளுபடி பெறுங்கள்! 🎁\n\nVillage Group Buy! Join "${group.title}" to get 15-25% discount & free delivery!\n\nJoin now: f2capp://groupbuy/${group.id}`;
    try {
      await Share.share({message: shareMsg});
    } catch (e) {}
  };

  return (
    <View
      style={[
        styles.groupCard,
        {
          backgroundColor: themeColors.cardBg,
          borderColor: themeColors.border,
          borderWidth: isDark ? 1 : 0,
        },
      ]}>
      {/* Card Header */}
      <LinearGradient
        colors={
          group.status === 'full' ? ['#E0E0E0', '#BDBDBD'] : COLORS.gradientSoft
        }
        style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.groupEmoji}>{group.emoji}</Text>
          <View style={{flex: 1, paddingRight: 8}}>
            <Text
              style={[styles.groupTitle, {color: themeColors.text}]}
              numberOfLines={1}>
              {group.title}
            </Text>
            <Text style={[styles.groupLocation, {color: themeColors.subText}]}>
              📍 {group.location}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.cardBody}>
        {/* Members progress */}
        <View style={styles.membersSection}>
          <View style={styles.membersHeader}>
            <Text style={[styles.membersLabel, {color: themeColors.text}]}>
              👥 {t('groupBuy.members')}:
            </Text>
            <Text style={[styles.membersCount, {color: themeColors.text}]}>
              1 / {invitedCount}
            </Text>
          </View>
          <View
            style={[
              styles.progressBg,
              {backgroundColor: isDark ? '#333333' : '#E0E0E0'},
            ]}>
            <LinearGradient
              colors={
                group.status === 'full'
                  ? [COLORS.accentRed, '#E53935']
                  : COLORS.gradientButton
              }
              style={[styles.progressFill, {width: `${fillPercent}%`}]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
            />
          </View>
          {/* Member avatars */}
          <View style={styles.avatarsRow}>
            {(group.memberNames || []).slice(0, 5).map((m, i) => (
              <View
                key={i}
                style={[styles.memberAvatar, {marginLeft: i > 0 ? -8 : 0}]}>
                <Text style={styles.memberAvatarTxt}>
                  {typeof m === 'string' && m.length > 0 ? m[0] : 'U'}
                </Text>
              </View>
            ))}
            {group.currentMembers > 5 && (
              <View
                style={[
                  styles.memberAvatar,
                  {marginLeft: -8, backgroundColor: COLORS.primaryBlue},
                ]}>
                <Text style={styles.memberAvatarTxt}>
                  +{group.currentMembers - 5}
                </Text>
              </View>
            )}
            <Text
              style={[styles.membersNeeded, {color: themeColors.textMuted}]}>
              {neededCount > 0
                ? `${neededCount} ${t('groupBuy.needed', {
                    defaultValue: 'more needed',
                  })}`
                : t('groupBuy.full', {defaultValue: 'Full'})}
            </Text>
          </View>
        </View>

        {/* Products */}
        <View style={styles.productsSection}>
          <Text
            style={[styles.productsSectionTitle, {color: themeColors.text}]}>
            🛒 {t('groupBuy.products')}:
          </Text>
          {(group.products || []).map((p, i) => (
            <View key={i} style={styles.productRow}>
              <Text style={[styles.productName, {color: themeColors.text}]}>
                {p.name}
              </Text>
              <Text style={[styles.productQty, {color: themeColors.subText}]}>
                {p.qty}
              </Text>
              <Text style={[styles.productPrice, {color: themeColors.text}]}>
                ₹{p.price}
              </Text>
            </View>
          ))}
        </View>

        {/* Benefits */}
        <View style={styles.benefitsRow}>
          <View style={[styles.benefitChip, {backgroundColor: themeColors.bg}]}>
            <Text style={styles.benefitEmoji}>🎁</Text>
            <Text style={[styles.benefitLabel, {color: themeColors.text}]}>
              {group.discount} {t('groupBuy.discount')}
            </Text>
            <Text style={[styles.benefitValue, {color: themeColors.subText}]}>
              ₹{group.discountAmount} {t('groupBuy.savings')}
            </Text>
          </View>
          <View style={styles.benefitChip}>
            <Text style={styles.benefitEmoji}>🚚</Text>
            <Text style={styles.benefitLabel}>Delivery</Text>
            <Text style={styles.benefitValue}>{t('groupBuy.free')}</Text>
          </View>
          <View style={styles.benefitChip}>
            <Text style={styles.benefitEmoji}>📅</Text>
            <Text style={styles.benefitLabel}>Deadline</Text>
            <Text style={styles.benefitValue}>{group.deadline}</Text>
          </View>
        </View>

        {/* Join or Invite button */}
        {group.status !== 'full' ? (
          isMember ? (
            <View style={{gap: 8}}>
              <TouchableOpacity style={styles.joinBtn} onPress={handleInvite}>
                <LinearGradient
                  colors={COLORS.gradientButton}
                  style={styles.joinBtnGrad}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}>
                  <Text style={styles.joinBtnTxt}>
                    📢 {t('groupBuy.inviteFriends')}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              {group.organizerId === (user?.uid || user?.id) && (
                <TouchableOpacity
                  style={styles.joinBtn}
                  onPress={() => onDirectAdd(group)}>
                  <LinearGradient
                    colors={['#1565C0', '#1E88E5']}
                    style={styles.joinBtnGrad}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 0}}>
                    <Text style={styles.joinBtnTxt}>
                      👥{' '}
                      {t('groupBuy.directAddBtn', {
                        defaultValue:
                          'உறுப்பினர்களை நேரடியாக சேர் / Add Member',
                      })}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <TouchableOpacity
              style={styles.joinBtn}
              onPress={() => onJoin(group)}>
              <LinearGradient
                colors={COLORS.gradientButton}
                style={styles.joinBtnGrad}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}>
                <Text style={styles.joinBtnTxt}>
                  ✅ {t('groupBuy.joinGroup')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )
        ) : (
          <View style={styles.fullBtn}>
            <Text style={styles.fullBtnTxt}>🔴 {t('groupBuy.groupFull')}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const VillageGroupBuyScreen = ({navigation}) => {
  const {t} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const {user} = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({
    title: '',
    location: '',
    targetMembers: '5',
  });
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showDirectAdd, setShowDirectAdd] = useState(false);
  const [selectedGroupForAdd, setSelectedGroupForAdd] = useState(null);
  const [allConsumers, setAllConsumers] = useState([]);
  const [consumersLoading, setConsumersLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [addingUserId, setAddingUserId] = useState(null);

  const handleOpenDirectAdd = async group => {
    setSelectedGroupForAdd(group);
    setShowDirectAdd(true);
    setConsumersLoading(true);
    setSearchQuery('');

    const res = await getAllConsumers();
    if (res.success && res.data) {
      setAllConsumers(res.data);
    } else {
      Alert.alert('Error', res.error || 'Failed to fetch consumers');
    }
    setConsumersLoading(false);
  };

  const handleAddConsumerDirectly = async consumer => {
    if (!selectedGroupForAdd) {
      return;
    }
    setAddingUserId(consumer.id || consumer.uid);

    const consumerName = consumer.nameTa || consumer.name || 'User';
    const res = await joinGroupBuy(
      selectedGroupForAdd.id,
      consumer.id || consumer.uid,
      consumerName,
    );

    if (res.success) {
      setSelectedGroupForAdd(prev => ({
        ...prev,
        currentMembers: (prev.currentMembers || 0) + 1,
        members: [...(prev.members || []), consumer.id || consumer.uid],
        memberNames: [...(prev.memberNames || []), consumerName],
      }));

      Alert.alert(
        t('groupBuy.successTitle', {defaultValue: '🎉 வெற்றி!'}),
        `${consumerName} ${t('groupBuy.addedSuccess', {
          defaultValue: 'குழுவில் சேர்க்கப்பட்டார்!',
        })}`,
      );
    } else {
      Alert.alert('Error', res.error || 'Failed to add member');
    }
    setAddingUserId(null);
  };

  const handleAddUnregisteredEmail = async email => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('groupBuy.invalidEmail', {defaultValue: 'மின்னஞ்சல் முகவரி தவறானது'}),
      );
      return;
    }

    setAddingUserId(email);
    const emailPrefix = email.split('@')[0];
    const organizerName = user.nameTa || user.name || 'User';

    const res = await joinGroupBuy(selectedGroupForAdd.id, email, emailPrefix);
    if (res.success) {
      setSelectedGroupForAdd(prev => ({
        ...prev,
        currentMembers: (prev.currentMembers || 0) + 1,
        members: [...(prev.members || []), email],
        memberNames: [...(prev.memberNames || []), emailPrefix],
      }));

      Alert.alert(
        t('groupBuy.inviteSuccessTitle', {
          defaultValue: '📧 அழைப்பு அனுப்பப்பட்டது!',
        }),
        t('groupBuy.inviteSuccessMsg', {
          defaultValue: `${email} முகவரிக்கு வெற்றிகரமாக அழைப்பு மின்னஞ்சல் அனுப்பப்பட்டது. நீங்கள் (${organizerName}) அவர்களை இந்த குழுவில் சேர்த்துள்ளீர்கள் என்பது அவர்களுக்குத் தெரிவிக்கப்பட்டது!`,
          email: email,
          organizer: organizerName,
        }),
      );
      setSearchQuery('');
    } else {
      Alert.alert('Error', res.error || 'Failed to add email');
    }
    setAddingUserId(null);
  };

  const filteredConsumers = allConsumers.filter(consumer => {
    const isAlreadyMember = selectedGroupForAdd?.members?.includes(
      consumer.id || consumer.uid,
    );
    if (isAlreadyMember) {
      return false;
    }

    if (consumer.id === (user?.uid || user?.id)) {
      return false;
    }

    if (!searchQuery.trim()) {
      return false;
    }
    const q = searchQuery.trim().toLowerCase();
    const email = (consumer.email || '').toLowerCase();
    return email.includes(q);
  });

  React.useEffect(() => {
    const unsubscribe = listenToGroupBuys(res => {
      if (res.success) {
        setGroups(res.data);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleJoin = group => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to join a group.');
      return;
    }
    Alert.alert(
      '✅ குழுவில் சேர்',
      `"${group.title}" குழுவில் சேர வேண்டுமா?\n\nநீங்கள் ${group.discount} தள்ளுபடி மற்றும் இலவச டெலிவரி பெறுவீர்கள்!\n\nJoin "${group.title}"?\nYou'll get ${group.discount} discount + free delivery!`,
      [
        {text: 'இல்லை / No', style: 'cancel'},
        {
          text: 'ஆமா சேர் / Yes Join!',
          onPress: async () => {
            const res = await joinGroupBuy(
              group.id,
              user.uid || user.id,
              user.name || 'User',
            );
            if (res.success) {
              Alert.alert(
                '🎉 சேர்ந்தீர்கள்!',
                'வெற்றிகரமாக குழுவில் சேர்ந்தீர்கள்!\nSuccessfully joined the group!',
              );
            } else {
              Alert.alert('Error', res.error);
            }
          },
        },
      ],
    );
  };

  const handleCreate = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to create a group.');
      return;
    }
    if (!newGroup.title || !newGroup.location) {
      Alert.alert(
        'பிழை / Error',
        'அனைத்து விவரங்களையும் நிரப்பவும் / Fill all fields',
      );
      return;
    }

    const target = 6; // Fixed: 1 creator + 5 friends = 6 members total
    const discount = '15%';

    const res = await createGroupBuy({
      title: newGroup.title,
      titleEn: newGroup.title, // Simplified
      location: newGroup.location,
      organizerId: user.uid || user.id,
      organizerName: user.name || 'User',
      targetMembers: target,
      discount: discount,
      discountAmount: 100, // Hardcoded for now
      deliveryFee: 0,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0], // 7 days from now
      emoji: '🏘️',
      products: [], // Empty initially
    });

    if (res.success) {
      Alert.alert(
        '✅ குழு உருவாக்கப்பட்டது!',
        'உங்கள் கூட்டு வாங்கல் குழு வெற்றிகரமாக உருவாக்கப்பட்டது!\nYour group has been created!',
        [
          {
            text: 'சரி / OK',
            onPress: () => {
              setShowCreate(false);
              setNewGroup({title: '', location: '', targetMembers: '5'});
            },
          },
        ],
      );
    } else {
      Alert.alert('Error', res.error);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: themeColors.bg}]}>
      {/* Header */}
      <LinearGradient
        colors={['#0D5C32', '#1B8A4E', '#1565C0']}
        style={styles.headerRow}>
        <View style={styles.headerTop}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>👨‍👩‍👧</Text>
          <Text style={styles.headerTitle}>
            {t('groupBuy.title', {defaultValue: 'கூட்டு வாங்கல்'})}
          </Text>
          <Text style={styles.headerDesc}>
            {t('groupBuy.desc', {
              defaultValue:
                '5 பேர் சேர்ந்து ஆர்டர் பண்ணினால்\n15-25% தள்ளுபடி + இலவச டெலிவரி!',
            })}
          </Text>
        </View>
      </LinearGradient>

      {/* How it works */}
      <View
        style={[
          styles.howItWorks,
          {
            backgroundColor: themeColors.cardBg,
            borderBottomColor: themeColors.border,
            borderBottomWidth: 1,
          },
        ]}>
        <Text style={[styles.howTitle, {color: themeColors.text}]}>
          ⚡ {t('groupBuy.howItWorks', {defaultValue: 'எப்படி வேலை செய்யும்?'})}
        </Text>
        <View style={styles.stepsRow}>
          {[
            {step: '1', emoji: '👥', label: t('groupBuy.step1')},
            {step: '2', emoji: '📢', label: t('groupBuy.step2')},
            {step: '3', emoji: '🛒', label: t('groupBuy.step3')},
            {step: '4', emoji: '🎁', label: t('groupBuy.step4')},
          ].map((s, i) => (
            <View key={i} style={styles.stepItem}>
              <Text style={{fontSize: 26, marginBottom: 4}}>{s.emoji}</Text>
              <Text style={[styles.stepLabel, {color: themeColors.subText}]}>
                {s.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{padding: SPACING.lg, paddingBottom: 100}}>
        {/* Create group button */}
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => setShowCreate(!showCreate)}>
          <LinearGradient
            colors={COLORS.gradientButton}
            style={styles.createBtnGrad}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            <Text style={styles.createBtnTxt}>
              {showCreate
                ? `✕ ${t('common.close', {defaultValue: 'மூடு'})}`
                : `➕ ${t('groupBuy.createBtn', {
                    defaultValue: 'புதிய குழு உருவாக்கு',
                  })}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Create form */}
        {showCreate && (
          <View
            style={[
              styles.createForm,
              {
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border,
                borderWidth: 1,
              },
            ]}>
            <Text style={[styles.createFormTitle, {color: themeColors.text}]}>
              🆕 {t('groupBuy.createTitle')}
            </Text>
            {[
              {key: 'title', label: t('groupBuy.formName'), placeholder: ''},
              {
                key: 'location',
                label: t('groupBuy.formLocation'),
                placeholder: '',
              },
              {key: 'targetMembers', label: t('groupBuy.formTarget')},
            ].map(field => {
              const isTargetMembers = field.key === 'targetMembers';
              return (
                <View key={field.key} style={styles.formField}>
                  <Text style={[styles.formLabel, {color: themeColors.text}]}>
                    {field.label}
                  </Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      {
                        backgroundColor: themeColors.inputBg,
                        color: themeColors.text,
                        borderColor: themeColors.border,
                      },
                      isTargetMembers && {
                        backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5',
                        color: themeColors.subText,
                      },
                    ]}
                    value={
                      isTargetMembers
                        ? t('groupBuy.mustInclude5', {
                            defaultValue: 'Must include 5 people',
                          })
                        : newGroup[field.key]
                    }
                    onChangeText={v => {
                      if (!isTargetMembers) {
                        setNewGroup(prev => ({...prev, [field.key]: v}));
                      }
                    }}
                    placeholder={field.placeholder}
                    placeholderTextColor={COLORS.textGray}
                    keyboardType={field.keyboard || 'default'}
                    editable={!isTargetMembers}
                  />
                </View>
              );
            })}
            <TouchableOpacity
              style={styles.createSubmitBtn}
              onPress={handleCreate}>
              <LinearGradient
                colors={COLORS.gradientButton}
                style={styles.createSubmitGrad}>
                <Text style={styles.createSubmitTxt}>
                  ✅ {t('groupBuy.createBtnSubmit')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Active groups */}
        <Text style={[styles.activeGroupsTitle, {color: themeColors.text}]}>
          🏘️{' '}
          {t('groupBuy.activeGroups', {defaultValue: 'இப்போ உள்ள குழுக்கள்'})} (
          {groups.length})
        </Text>
        {loading ? (
          <Text style={{textAlign: 'center', marginTop: 20}}>
            {t('common.loading', {defaultValue: 'Loading...'})}
          </Text>
        ) : groups.length === 0 ? null : (
          groups.map(group => (
            <GroupCard
              key={group.id}
              group={group}
              onJoin={handleJoin}
              onDirectAdd={handleOpenDirectAdd}
              user={user}
            />
          ))
        )}
      </ScrollView>

      {/* Direct Add Member Modal */}
      <Modal
        visible={showDirectAdd}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDirectAdd(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContainer,
              {
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border,
                borderWidth: isDark ? 1 : 0,
              },
            ]}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text
                style={[styles.modalTitle, {color: themeColors.text}]}
                numberOfLines={1}>
                👥{' '}
                {t('groupBuy.directAddTitle', {
                  defaultValue: 'உறுப்பினர்களை நேரடியாக சேர்',
                })}
              </Text>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setShowDirectAdd(false)}>
                <Text style={[styles.closeBtnTxt, {color: themeColors.text}]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View
              style={[
                styles.searchBarContainer,
                {
                  backgroundColor: themeColors.bg,
                  borderColor: themeColors.border,
                  borderWidth: 1,
                },
              ]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={[styles.searchInput, {color: themeColors.text}]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={t('groupBuy.searchPlaceholder', {
                  defaultValue: 'பெயர் அல்லது மின்னஞ்சல் மூலம் தேடவும்...',
                })}
                placeholderTextColor={COLORS.textGray}
              />
            </View>

            {/* Content */}
            {consumersLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primaryGreen} />
                <Text style={[styles.loadingText, {color: themeColors.text}]}>
                  {t('common.loading', {defaultValue: 'Loading...'})}
                </Text>
              </View>
            ) : filteredConsumers.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text
                  style={[styles.emptyText, {color: themeColors.textMuted}]}>
                  📭{' '}
                  {t('groupBuy.noConsumers', {
                    defaultValue: 'வாடிக்கையாளர்கள் யாரும் இல்லை.',
                  })}
                </Text>
                {searchQuery.trim().includes('@') && (
                  <TouchableOpacity
                    style={[
                      styles.createSubmitBtn,
                      {marginTop: SPACING.md, width: '100%'},
                    ]}
                    disabled={addingUserId === searchQuery.trim()}
                    onPress={() =>
                      handleAddUnregisteredEmail(searchQuery.trim())
                    }>
                    <LinearGradient
                      colors={COLORS.gradientButton}
                      style={styles.createSubmitGrad}>
                      {addingUserId === searchQuery.trim() ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                      ) : (
                        <Text style={styles.createSubmitTxt}>
                          ✉️{' '}
                          {t('groupBuy.inviteBtn', {
                            defaultValue:
                              'நேரடியாகச் சேர் மற்றும் அழைப்பு அனுப்பு',
                          })}
                        </Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.consumerList}>
                {filteredConsumers.map(consumer => {
                  const cName = consumer.nameTa || consumer.name || 'User';
                  return (
                    <View
                      key={consumer.id || consumer.uid}
                      style={[
                        styles.consumerItem,
                        {borderBottomColor: themeColors.border},
                      ]}>
                      <View style={styles.consumerInfo}>
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarLetter}>
                            {cName.length > 0 ? cName[0].toUpperCase() : 'U'}
                          </Text>
                        </View>
                        <View style={styles.consumerDetails}>
                          <Text
                            style={[
                              styles.consumerName,
                              {color: themeColors.text},
                            ]}>
                            {cName}
                          </Text>
                          <Text
                            style={[
                              styles.consumerEmail,
                              {color: themeColors.subText},
                            ]}>
                            {consumer.email || consumer.phone || ''}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.addMemberBtn}
                        disabled={
                          addingUserId === (consumer.id || consumer.uid)
                        }
                        onPress={() => handleAddConsumerDirectly(consumer)}>
                        <LinearGradient
                          colors={COLORS.gradientButton}
                          style={styles.addMemberGrad}>
                          {addingUserId === (consumer.id || consumer.uid) ? (
                            <ActivityIndicator
                              size="small"
                              color={COLORS.white}
                            />
                          ) : (
                            <Text style={styles.addMemberTxt}>
                              ➕ {t('groupBuy.addBtn', {defaultValue: 'சேர்'})}
                            </Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},

  // Header
  headerRow: {paddingTop: 50, paddingBottom: 24, paddingHorizontal: SPACING.xl},
  headerTop: {marginBottom: SPACING.md, alignSelf: 'flex-start'},
  headerContent: {alignItems: 'center'},
  headerEmoji: {fontSize: 44, marginBottom: 6},
  headerTitle: {
    fontSize: FONTS.xxl,
    fontWeight: FONTS.bold,
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  headerDesc: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.md,
  },

  // How it works
  howItWorks: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  howTitle: {
    fontSize: FONTS.md,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  stepsRow: {flexDirection: 'row', justifyContent: 'space-between'},
  stepItem: {alignItems: 'center', flex: 1},
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stepNumTxt: {color: COLORS.white, fontSize: FONTS.sm, fontWeight: FONTS.bold},
  stepEmoji: {fontSize: 26, marginBottom: 6},
  stepLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 4,
    fontWeight: '600',
  },

  // Group card
  groupCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: SPACING.md,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  groupEmoji: {fontSize: 32},
  groupTitle: {
    fontSize: FONTS.md,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
  },
  groupTitleEn: {fontSize: FONTS.xs, color: COLORS.textMuted},
  groupLocation: {fontSize: FONTS.xs, color: COLORS.textSecondary},
  statusBadge: {
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
    minWidth: 90,
  },
  statusLabel: {
    fontSize: FONTS.xs,
    fontWeight: FONTS.bold,
    textAlign: 'center',
  },
  statusLabelEn: {fontSize: 9, textAlign: 'center'},
  cardBody: {padding: SPACING.lg},

  // Members
  membersSection: {marginBottom: SPACING.md},
  membersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  membersLabel: {fontSize: FONTS.sm, color: COLORS.textSecondary},
  membersCount: {
    fontSize: FONTS.md,
    fontWeight: FONTS.bold,
    color: COLORS.primaryGreen,
  },
  progressBg: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {height: '100%', borderRadius: RADIUS.full},
  avatarsRow: {flexDirection: 'row', alignItems: 'center'},
  memberAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  memberAvatarTxt: {
    color: COLORS.white,
    fontSize: FONTS.xs,
    fontWeight: FONTS.bold,
  },
  membersNeeded: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    marginLeft: SPACING.sm,
  },

  // Products
  productsSection: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  productsSectionTitle: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productName: {flex: 1, fontSize: FONTS.sm, color: COLORS.textSecondary},
  productQty: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    marginHorizontal: SPACING.sm,
  },
  productPrice: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
    color: COLORS.primaryGreen,
  },

  // Benefits
  benefitsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  benefitChip: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    alignItems: 'center',
  },
  benefitEmoji: {fontSize: 20, marginBottom: 2},
  benefitLabel: {
    fontSize: FONTS.xs,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  benefitValue: {
    fontSize: FONTS.xs,
    fontWeight: FONTS.bold,
    color: COLORS.primaryGreen,
    textAlign: 'center',
  },

  // Buttons
  joinBtn: {borderRadius: RADIUS.lg, overflow: 'hidden'},
  joinBtnGrad: {paddingVertical: 14, alignItems: 'center'},
  joinBtnTxt: {color: COLORS.white, fontSize: FONTS.md, fontWeight: FONTS.bold},
  fullBtn: {
    backgroundColor: '#F5F5F5',
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  fullBtnTxt: {
    color: COLORS.textMuted,
    fontSize: FONTS.md,
    fontWeight: FONTS.semiBold,
  },

  // Create form
  createBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  createBtnGrad: {paddingVertical: 14, alignItems: 'center'},
  createBtnTxt: {
    color: COLORS.white,
    fontSize: FONTS.md,
    fontWeight: FONTS.bold,
  },
  activeGroupsTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  createForm: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.card,
  },
  createFormTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  formField: {marginBottom: SPACING.md},
  formLabel: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.semiBold,
    color: COLORS.textSecondary,
    marginBottom: 6,
    lineHeight: 18,
  },
  formInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    height: 50,
    fontSize: FONTS.md,
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  createSubmitTxt: {
    color: COLORS.white,
    fontSize: FONTS.md,
    fontWeight: FONTS.bold,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContainer: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    paddingBottom: SPACING.sm,
  },
  modalTitle: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnTxt: {
    fontSize: 22,
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 48,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FONTS.sm,
    color: COLORS.textPrimary,
  },
  consumerList: {
    marginBottom: SPACING.md,
  },
  consumerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  consumerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.sm,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryGreenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: COLORS.white,
    fontSize: FONTS.md,
    fontWeight: FONTS.bold,
  },
  consumerDetails: {
    flex: 1,
  },
  consumerName: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.semiBold,
    color: COLORS.textPrimary,
  },
  consumerEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  addMemberBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    minWidth: 70,
  },
  addMemberGrad: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  addMemberTxt: {
    color: COLORS.white,
    fontSize: FONTS.xs,
    fontWeight: FONTS.bold,
  },
  loadingContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONTS.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  emptyContainer: {
    paddingVertical: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});

export default VillageGroupBuyScreen;
