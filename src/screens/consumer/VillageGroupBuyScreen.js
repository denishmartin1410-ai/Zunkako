// ============================================================
// 👨‍👩‍👧 VILLAGE GROUP BUY SCREEN
// "கூட்டு வாங்கல்" - Community Group Buying
// 5 பேர் சேர்ந்து order பண்ணினால் → Free Delivery + Discount!
// எந்த Grocery App-லயும் இல்லாத UNIQUE Feature!
// ============================================================

import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { listenToGroupBuys, createGroupBuy, joinGroupBuy } from '../../services/firebase';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import BackButton from '../../utils/BackButton';

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

const GroupCard = ({ group, onJoin, user }) => {
  const { t } = useTranslation();
  
  const fillPercent = Math.min((group.currentMembers / group.targetMembers) * 100, 100);
  const statusKey = group.currentMembers >= group.targetMembers ? 'full' 
    : (group.targetMembers - group.currentMembers <= 2 ? 'almostFull' : 'open');
  const status = STATUS_CONFIG[statusKey];
  
  const isMember = group.members && group.members.includes(user?.uid || user?.id);

  return (
    <View style={styles.groupCard}>
      {/* Card Header */}
      <LinearGradient
        colors={group.status === 'full' ? ['#E0E0E0', '#BDBDBD'] : COLORS.gradientSoft}
        style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.groupEmoji}>{group.emoji}</Text>
          <View>
            <Text style={styles.groupTitle} numberOfLines={1}>{group.title}</Text>
            <Text style={styles.groupTitleEn} numberOfLines={1}>{group.titleEn}</Text>
            <Text style={styles.groupLocation}>📍 {group.location}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusLabel, { color: status.color }]}>{statusKey === 'open' ? '✅ ' : statusKey === 'almostFull' ? '⚡ ' : '🔴 '}{t(`groupBuy.${status.labelKey}`)}</Text>
        </View>
      </LinearGradient>

      <View style={styles.cardBody}>
        {/* Members progress */}
        <View style={styles.membersSection}>
          <View style={styles.membersHeader}>
            <Text style={styles.membersLabel}>
              👥 {t('groupBuy.members')}:
            </Text>
            <Text style={styles.membersCount}>
              {group.currentMembers} / {group.targetMembers}
            </Text>
          </View>
          <View style={styles.progressBg}>
            <LinearGradient
              colors={group.status === 'full'
                ? [COLORS.accentRed, '#E53935']
                : COLORS.gradientButton}
              style={[styles.progressFill, { width: `${fillPercent}%` }]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            />
          </View>
          {/* Member avatars */}
          <View style={styles.avatarsRow}>
            {(group.memberNames || []).slice(0, 5).map((m, i) => (
              <View key={i} style={[styles.memberAvatar, { marginLeft: i > 0 ? -8 : 0 }]}>
                <Text style={styles.memberAvatarTxt}>{typeof m === 'string' && m.length > 0 ? m[0] : 'U'}</Text>
              </View>
            ))}
            {group.currentMembers > 5 && (
              <View style={[styles.memberAvatar, { marginLeft: -8, backgroundColor: COLORS.primaryBlue }]}>
                <Text style={styles.memberAvatarTxt}>+{group.currentMembers - 5}</Text>
              </View>
            )}
            <Text style={styles.membersNeeded}>
              {group.targetMembers - group.currentMembers > 0
                ? `${group.targetMembers - group.currentMembers} ${t('groupBuy.needed')}`
                : t('groupBuy.full')}
            </Text>
          </View>
        </View>

        {/* Products */}
        <View style={styles.productsSection}>
          <Text style={styles.productsSectionTitle}>🛒 {t('groupBuy.products')}:</Text>
          {(group.products || []).map((p, i) => (
            <View key={i} style={styles.productRow}>
              <Text style={styles.productName}>{p.name}</Text>
              <Text style={styles.productQty}>{p.qty}</Text>
              <Text style={styles.productPrice}>₹{p.price}</Text>
            </View>
          ))}
        </View>

        {/* Benefits */}
        <View style={styles.benefitsRow}>
          <View style={styles.benefitChip}>
            <Text style={styles.benefitEmoji}>🎁</Text>
            <Text style={styles.benefitLabel}>{group.discount} {t('groupBuy.discount')}</Text>
            <Text style={styles.benefitValue}>₹{group.discountAmount} {t('groupBuy.savings')}</Text>
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
            <TouchableOpacity style={styles.joinBtn} onPress={() => Alert.alert(t('groupBuy.inviteFriends'), t('groupBuy.inviteMsg'))}>
              <LinearGradient colors={COLORS.gradientButton} style={styles.joinBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                <Text style={styles.joinBtnTxt}>
                  📢 {t('groupBuy.inviteFriends')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.joinBtn} onPress={() => onJoin(group)}>
              <LinearGradient colors={COLORS.gradientButton} style={styles.joinBtnGrad}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
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

const VillageGroupBuyScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [newGroup, setNewGroup] = useState({ title: '', location: '', targetMembers: '' });
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    const unsubscribe = listenToGroupBuys((res) => {
      if (res.success) setGroups(res.data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleJoin = (group) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to join a group.');
      return;
    }
    Alert.alert(
      '✅ குழுவில் சேர்',
      `"${group.title}" குழுவில் சேர வேண்டுமா?\n\nநீங்கள் ${group.discount} தள்ளுபடி மற்றும் இலவச டெலிவரி பெறுவீர்கள்!\n\nJoin "${group.title}"?\nYou'll get ${group.discount} discount + free delivery!`,
      [
        { text: 'இல்லை / No', style: 'cancel' },
        {
          text: 'ஆமா சேர் / Yes Join!',
          onPress: async () => {
            const res = await joinGroupBuy(group.id, user.uid || user.id, user.name || 'User');
            if (res.success) {
              Alert.alert('🎉 சேர்ந்தீர்கள்!', 'வெற்றிகரமாக குழுவில் சேர்ந்தீர்கள்!\nSuccessfully joined the group!');
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
    if (!newGroup.title || !newGroup.location || !newGroup.targetMembers) {
      Alert.alert('பிழை / Error', 'அனைத்து fields நிரப்பவும் / Fill all fields');
      return;
    }
    
    // Auto calculate discount based on target members
    const target = parseInt(newGroup.targetMembers, 10);
    const discount = target >= 10 ? '25%' : target >= 8 ? '20%' : '15%';

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
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      emoji: '🏘️',
      products: [], // Empty initially
    });

    if (res.success) {
      Alert.alert(
        '✅ குழு உருவாக்கப்பட்டது!',
        'உங்கள் Group Buy குழு வெற்றிகரமாக உருவாக்கப்பட்டது!\nYour group has been created!',
        [{ text: 'சரி / OK', onPress: () => {
          setShowCreate(false);
          setNewGroup({ title: '', location: '', targetMembers: '' });
        }}]
      );
    } else {
      Alert.alert('Error', res.error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={['#0D5C32', '#1B8A4E', '#1565C0']} style={styles.headerRow}>
        <View style={styles.headerTop}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>👨‍👩‍👧</Text>
          <Text style={styles.headerTitle}>{t('groupBuy.title', { defaultValue: 'கூட்டு வாங்கல்' })}</Text>
          <Text style={styles.headerDesc}>
            {t('groupBuy.desc', { defaultValue: '5 பேர் சேர்ந்து order பண்ணினால்\n15-25% தள்ளுபடி + இலவச டெலிவரி!' })}
          </Text>
        </View>
      </LinearGradient>

      {/* How it works */}
      <View style={styles.howItWorks}>
        <Text style={styles.howTitle}>⚡ {t('groupBuy.howItWorks', { defaultValue: 'எப்படி வேலை செய்யும்?' })}</Text>
        <View style={styles.stepsRow}>
          {[
            { step: '1', emoji: '👥', label: t('groupBuy.step1') },
            { step: '2', emoji: '📢', label: t('groupBuy.step2') },
            { step: '3', emoji: '🛒', label: t('groupBuy.step3') },
            { step: '4', emoji: '🎁', label: t('groupBuy.step4') },
          ].map((s, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumTxt}>{s.step}</Text>
              </View>
              <Text style={styles.stepEmoji}>{s.emoji}</Text>
              <Text style={styles.stepLabel} numberOfLines={2}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 100 }}>

        {/* Create group button */}
        <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreate(!showCreate)}>
          <LinearGradient colors={COLORS.gradientButton} style={styles.createBtnGrad}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            <Text style={styles.createBtnTxt}>
              {showCreate ? `✕ ${t('common.close', { defaultValue: 'மூடு' })}` : `➕ ${t('groupBuy.createBtn', { defaultValue: 'புதிய குழு உருவாக்கு' })}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Create form */}
        {showCreate && (
          <View style={styles.createForm}>
            <Text style={styles.createFormTitle}>🆕 {t('groupBuy.createTitle')}</Text>
            {[
              { key: 'title', label: t('groupBuy.formName'), placeholder: 'எ.கா: அண்ணா நகர் காய்கறி குழு' },
              { key: 'location', label: t('groupBuy.formLocation'), placeholder: 'எ.கா: அண்ணா நகர், சென்னை' },
              { key: 'targetMembers', label: t('groupBuy.formTarget'), placeholder: 'எ.கா: 5', keyboard: 'numeric' },
            ].map(field => (
              <View key={field.key} style={styles.formField}>
                <Text style={styles.formLabel}>{field.label}</Text>
                <TextInput
                  style={styles.formInput}
                  value={newGroup[field.key]}
                  onChangeText={v => setNewGroup(prev => ({ ...prev, [field.key]: v }))}
                  placeholder={field.placeholder}
                  placeholderTextColor={COLORS.textGray}
                  keyboardType={field.keyboard || 'default'}
                />
              </View>
            ))}
            <TouchableOpacity style={styles.createSubmitBtn} onPress={handleCreate}>
              <LinearGradient colors={COLORS.gradientButton} style={styles.createSubmitGrad}>
                <Text style={styles.createSubmitTxt}>✅ {t('groupBuy.createBtnSubmit')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Active groups */}
        <Text style={styles.activeGroupsTitle}>
          🏘️ {t('groupBuy.activeGroups', { defaultValue: 'இப்போ உள்ள குழுக்கள்' })} ({groups.length})
        </Text>
        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 20 }}>{t('common.loading', { defaultValue: 'Loading...' })}</Text>
        ) : groups.length === 0 ? null : (
          groups.map(group => (
            <GroupCard key={group.id} group={group} onJoin={handleJoin} user={user} />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Header
  headerRow: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: SPACING.xl },
  headerTop: { marginBottom: SPACING.md, alignSelf: 'flex-start' },
  headerContent: { alignItems: 'center' },
  headerEmoji: { fontSize: 44, marginBottom: 6 },
  headerTitle: { fontSize: FONTS.xxl, fontWeight: FONTS.bold, color: COLORS.white, marginBottom: SPACING.sm },
  headerDesc: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22, paddingHorizontal: SPACING.md },

  // How it works
  howItWorks: { backgroundColor: COLORS.white, padding: SPACING.lg, ...SHADOWS.small },
  howTitle: { fontSize: FONTS.md, fontWeight: FONTS.bold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  stepsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stepItem: { alignItems: 'center', flex: 1 },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primaryGreen, alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  stepNumTxt: { color: COLORS.white, fontSize: FONTS.sm, fontWeight: FONTS.bold },
  stepEmoji: { fontSize: 22, marginBottom: 4 },
  stepLabel: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 14, paddingHorizontal: 2 },

  // Group card
  groupCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, marginBottom: SPACING.lg, overflow: 'hidden', ...SHADOWS.medium },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', padding: SPACING.md },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: SPACING.sm },
  groupEmoji: { fontSize: 32 },
  groupTitle: { fontSize: FONTS.md, fontWeight: FONTS.bold, color: COLORS.textPrimary },
  groupTitleEn: { fontSize: FONTS.xs, color: COLORS.textMuted },
  groupLocation: { fontSize: FONTS.xs, color: COLORS.textSecondary },
  statusBadge: { borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', minWidth: 90 },
  statusLabel: { fontSize: FONTS.xs, fontWeight: FONTS.bold, textAlign: 'center' },
  statusLabelEn: { fontSize: 9, textAlign: 'center' },
  cardBody: { padding: SPACING.lg },

  // Members
  membersSection: { marginBottom: SPACING.md },
  membersHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  membersLabel: { fontSize: FONTS.sm, color: COLORS.textSecondary },
  membersCount: { fontSize: FONTS.md, fontWeight: FONTS.bold, color: COLORS.primaryGreen },
  progressBg: { height: 10, backgroundColor: '#E0E0E0', borderRadius: RADIUS.full, overflow: 'hidden', marginBottom: SPACING.sm },
  progressFill: { height: '100%', borderRadius: RADIUS.full },
  avatarsRow: { flexDirection: 'row', alignItems: 'center' },
  memberAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.primaryGreen, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.white,
  },
  memberAvatarTxt: { color: COLORS.white, fontSize: FONTS.xs, fontWeight: FONTS.bold },
  membersNeeded: { fontSize: FONTS.xs, color: COLORS.textMuted, marginLeft: SPACING.sm },

  // Products
  productsSection: { backgroundColor: COLORS.background, borderRadius: RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md },
  productsSectionTitle: { fontSize: FONTS.sm, fontWeight: FONTS.bold, color: COLORS.textPrimary, marginBottom: SPACING.sm },
  productRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  productName: { flex: 1, fontSize: FONTS.sm, color: COLORS.textSecondary },
  productQty: { fontSize: FONTS.sm, color: COLORS.textMuted, marginHorizontal: SPACING.sm },
  productPrice: { fontSize: FONTS.sm, fontWeight: FONTS.bold, color: COLORS.primaryGreen },

  // Benefits
  benefitsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  benefitChip: {
    flex: 1, backgroundColor: '#E8F5E9', borderRadius: RADIUS.md,
    padding: SPACING.sm, alignItems: 'center',
  },
  benefitEmoji: { fontSize: 20, marginBottom: 2 },
  benefitLabel: { fontSize: FONTS.xs, color: COLORS.textMuted, textAlign: 'center' },
  benefitValue: { fontSize: FONTS.xs, fontWeight: FONTS.bold, color: COLORS.primaryGreen, textAlign: 'center' },

  // Buttons
  joinBtn: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  joinBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  joinBtnTxt: { color: COLORS.white, fontSize: FONTS.md, fontWeight: FONTS.bold },
  fullBtn: {
    backgroundColor: '#F5F5F5', borderRadius: RADIUS.lg,
    paddingVertical: 14, alignItems: 'center',
  },
  fullBtnTxt: { color: COLORS.textMuted, fontSize: FONTS.md, fontWeight: FONTS.semiBold },

  // Create form
  createBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.lg },
  createBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  createBtnTxt: { color: COLORS.white, fontSize: FONTS.md, fontWeight: FONTS.bold },
  activeGroupsTitle: { fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.textPrimary, marginBottom: SPACING.md },
  createForm: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.xl, marginBottom: SPACING.lg, ...SHADOWS.card,
  },
  createFormTitle: { fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.textPrimary, marginBottom: SPACING.lg },
  formField: { marginBottom: SPACING.md },
  formLabel: { fontSize: FONTS.sm, fontWeight: FONTS.semiBold, color: COLORS.textSecondary, marginBottom: 6, lineHeight: 18 },
  formInput: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg, height: 50,
    fontSize: FONTS.md, color: COLORS.textPrimary,
    borderWidth: 1.5, borderColor: COLORS.borderLight,
  },
  createSubmitBtn: { borderRadius: RADIUS.md, overflow: 'hidden', marginTop: SPACING.md },
  createSubmitGrad: { paddingVertical: 14, alignItems: 'center' },
  createSubmitTxt: { color: COLORS.white, fontSize: FONTS.md, fontWeight: FONTS.bold },
});

export default VillageGroupBuyScreen;
