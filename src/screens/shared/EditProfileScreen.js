// src/screens/shared/EditProfileScreen.js
// ✅ Camera OR Gallery choice dialog (Image 2 போல!)
// ✅ Cloudinary upload - farmer & consumer
// ✅ InputField OUTSIDE - smooth typing
// ✅ Proper padding

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

const { width } = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

// ✅ OUTSIDE component - no re-render, smooth typing!
const Field = ({ label, value, onChangeText, placeholder, keyboard = 'default', editable = true }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={[styles.fieldInput, !editable && styles.fieldDisabled]}
      value={value} onChangeText={onChangeText}
      placeholder={placeholder} placeholderTextColor={COLORS.textGray}
      keyboardType={keyboard} autoCorrect={false} autoCapitalize="none" editable={editable}
    />
  </View>
);

const EditProfileScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [farmName, setFarmName] = useState(user?.farmName || '');
  const [about, setAbout] = useState(user?.about || '');
  const [avatarUri, setAvatarUri] = useState(user?.avatar || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isFarmer = user?.userType === 'farmer';
  const letter = (name || 'U').charAt(0).toUpperCase();
  const bg = ['#1B8A4E', '#1565C0', '#E65100', '#6A1B9A'][letter.charCodeAt(0) % 4];

  // Pick from camera or gallery
  const pickImage = useCallback(async source => {
    try {
      const { launchCamera, launchImageLibrary } = require('react-native-image-picker');
      const opts = { mediaType: 'photo', quality: 0.8, maxWidth: 400, maxHeight: 400 };
      const result = source === 'camera' ? await launchCamera(opts) : await launchImageLibrary(opts);
      if (result.didCancel || !result.assets?.[0]) return;
      const uri = result.assets[0].uri;
      setAvatarUri(uri);
      setIsUploading(true);
      const { uploadImageToCloudinary } = require('../../services/cloudinaryServices');
      const up = await uploadImageToCloudinary(uri, 'avatars');
      setIsUploading(false);
      if (up.success) {
        setAvatarUri(up.url);
        Alert.alert('✅', t('profile.photoUpdated', { defaultValue: 'புகைப்படம் புதுப்பிக்கப்பட்டது!' }));
      } else {
        setAvatarUri(user?.avatar || '');
        Alert.alert(t('common.error', { defaultValue: 'பிழை' }), up.error || 'Upload failed');
      }
    } catch (e) { setIsUploading(false); console.log('pick error:', e); }
  }, [user, t]);

  // Show Camera/Gallery choice dialog
  const handlePhotoPick = useCallback(() => {
    const options = [
      { text: '📷 ' + t('profile.camera', { defaultValue: 'கேமரா' }), onPress: () => pickImage('camera') },
      { text: '🖼 ' + t('profile.gallery', { defaultValue: 'கேலரி' }), onPress: () => pickImage('gallery') }
    ];

    if (avatarUri) {
      options.push({ text: '🗑 ' + t('profile.deletePhoto', { defaultValue: 'புகைப்படம் நீக்கு' }), onPress: () => setAvatarUri(''), style: 'destructive' });
    }

    options.push({ text: t('common.cancel', { defaultValue: 'ரத்து / CANCEL' }), style: 'cancel' });

    Alert.alert(
      '📷 ' + t('profile.changePhoto', { defaultValue: 'புகைப்படம் மாற்றவும்' }),
      t('profile.chooseSource', { defaultValue: 'கேமரா அல்லது கேலரியில் இருந்து தேர்வு பண்ணுங்கள்\nChoose from Camera or Gallery' }),
      options
    );
  }, [pickImage, t, avatarUri]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert(t('common.error', { defaultValue: 'பிழை' }), t('profile.nameRequired', { defaultValue: 'பெயர் உள்ளிடவும்' })); return; }
    setIsSaving(true);
    const r = await updateUser({
      name: name.trim(), phone: phone.trim(), location: location.trim(),
      about: about.trim(), avatar: avatarUri,
      ...(isFarmer && { farmName: farmName.trim() }),
    });
    setIsSaving(false);
    if (r.success) Alert.alert('✅', t('profile.profileUpdated', { defaultValue: 'சுயவிவரம் புதுப்பிக்கப்பட்டது!' }), [{ text: t('common.ok', { defaultValue: 'சரி' }), onPress: () => navigation.goBack() }]);
    else Alert.alert(t('common.error', { defaultValue: 'பிழை' }), r.error || 'Update failed');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D5C32', '#1565C0']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}><Text style={styles.backTxt}>←</Text></TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>✏️ {t('settings.editProfile', { defaultValue: 'சுயவிவரம் திருத்து' })}</Text>
          <Text style={styles.headerSub}>Edit Profile</Text>
        </View>
        <View style={{ width: rs(40) }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePhotoPick} disabled={isUploading}>
            {avatarUri
              ? <FastImage source={{ uri: avatarUri, priority: FastImage.priority.normal }} style={styles.avatarImg} resizeMode={FastImage.resizeMode.cover} />
              : <View style={[styles.avatarLetter, { backgroundColor: bg }]}><Text style={styles.avatarLetterTxt}>{letter}</Text></View>
            }
            <View style={styles.camOverlay}>
              {isUploading ? <ActivityIndicator color={COLORS.white} size="small" /> : <Text style={{ fontSize: rs(14) }}>📷</Text>}
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>
            {t('profile.tapToChange', { defaultValue: 'புகைப்படம் மாற்ற கிளிக் செய்யவும்' })}
            {'\n'}Tap to change photo
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>👤 {t('profile.basicInfo', { defaultValue: 'அடிப்படை தகவல் / Basic Info' })}</Text>
          <Field label={'👤 ' + t('profile.fullName', { defaultValue: 'பெயர் / Name' })} value={name} onChangeText={setName} placeholder={t('profile.namePlaceholder', { defaultValue: 'உங்கள் பெயர்' })} />
          <Field label={'📱 ' + t('profile.phoneLabel', { defaultValue: 'தொலைபேசி / Phone' })} value={phone} onChangeText={setPhone} placeholder="9876543210" keyboard="phone-pad" />
          <Field label={'📧 ' + t('profile.emailLabel', { defaultValue: 'மின்னஞ்சல் / Email (read-only)' })} value={user?.email || ''} onChangeText={() => { }} editable={false} />
          <Field label={'📍 ' + t('profile.locationLabel', { defaultValue: 'இடம் / Location / City' })} value={location} onChangeText={setLocation} placeholder={t('profile.locationPlaceholder', { defaultValue: 'நகரம், மாவட்டம்' })} />
          <Field label={'✍️ ' + t('profile.aboutLabel', { defaultValue: 'உங்களைப் பற்றி / About You (Optional)' })} value={about} onChangeText={setAbout} placeholder={t('profile.aboutPlaceholder', { defaultValue: 'சிறு விளக்கம்...' })} />
          {isFarmer && <Field label={'🏡 ' + t('farmer.farmName', { defaultValue: 'பண்ணை பெயர் / Farm Name' })} value={farmName} onChangeText={setFarmName} placeholder={t('farmer.farmNamePlaceholder', { defaultValue: 'உங்கள் பண்ணையின் பெயர்' })} />}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
          <LinearGradient colors={isSaving ? ['#9E9E9E', '#757575'] : COLORS.gradientButton} style={styles.saveGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
            {isSaving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveTxt}>💾 {t('common.save', { defaultValue: 'சேமிக்கவும்' })}</Text>}
          </LinearGradient>
        </TouchableOpacity>
        <View style={{ height: rs(40) }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: rs(50), paddingBottom: rs(20), paddingHorizontal: SPACING.xl, flexDirection: 'row', alignItems: 'center' },
  backBtn: { width: rs(40) },
  backTxt: { color: COLORS.white, fontSize: rs(22), fontWeight: 'bold' },
  headerTitle: { fontSize: rs(FONTS.lg), fontWeight: 'bold', color: COLORS.white },
  headerSub: { fontSize: rs(FONTS.xs), color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  content: { padding: SPACING.lg },
  avatarSection: { alignItems: 'center', marginBottom: SPACING.xl },
  avatarImg: { width: rs(100), height: rs(100), borderRadius: rs(50), borderWidth: 3, borderColor: COLORS.primaryGreen },
  avatarLetter: { width: rs(100), height: rs(100), borderRadius: rs(50), alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: COLORS.primaryGreen },
  avatarLetterTxt: { color: COLORS.white, fontSize: rs(40), fontWeight: 'bold' },
  camOverlay: { position: 'absolute', bottom: 0, right: 0, width: rs(32), height: rs(32), borderRadius: rs(16), backgroundColor: COLORS.primaryGreen, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.white },
  avatarHint: { fontSize: rs(FONTS.xs), color: COLORS.textMuted, marginTop: SPACING.sm, textAlign: 'center', lineHeight: rs(18) },
  formCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.lg, ...SHADOWS.small },
  sectionTitle: { fontSize: rs(FONTS.md), fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.lg },
  fieldWrap: { marginBottom: SPACING.lg },
  fieldLabel: { fontSize: rs(FONTS.sm), fontWeight: '600', color: COLORS.textSecondary, marginBottom: rs(6) },
  fieldInput: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, paddingHorizontal: SPACING.lg, height: rs(52), fontSize: rs(FONTS.md), color: COLORS.textPrimary, borderWidth: 1.5, borderColor: COLORS.borderLight },
  fieldDisabled: { backgroundColor: '#F5F5F5', color: COLORS.textMuted },
  saveBtn: { borderRadius: RADIUS.lg, overflow: 'hidden' },
  saveGrad: { paddingVertical: rs(16), alignItems: 'center' },
  saveTxt: { color: COLORS.white, fontSize: rs(FONTS.lg), fontWeight: 'bold' },
});

export default EditProfileScreen;
