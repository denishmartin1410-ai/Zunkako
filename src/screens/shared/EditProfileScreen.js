// src/screens/shared/EditProfileScreen.js
// ✅ Camera OR Gallery choice dialog (Image 2 போல!)
// ✅ Cloudinary upload - farmer & consumer
// ✅ InputField OUTSIDE - smooth typing
// ✅ Proper padding

import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import {useTranslation} from 'react-i18next';
import {useAuth} from '../../context/AuthContext';
import {useTheme} from '../../context/ThemeContext';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  SHADOWS,
  getThemeColors,
} from '../../utils/theme';
import BackButton from '../../utils/BackButton';

const {width} = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

// ✅ OUTSIDE component - no re-render, smooth typing!
const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboard = 'default',
  editable = true,
}) => {
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, {color: themeColors.text}]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.fieldInput,
          {
            backgroundColor: themeColors.inputBg,
            borderColor: themeColors.border,
            color: themeColors.text,
          },
          !editable && {
            backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5',
            color: themeColors.textMuted,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={
          isDark ? 'rgba(255,255,255,0.4)' : COLORS.textGray
        }
        keyboardType={keyboard}
        autoCorrect={false}
        autoCapitalize="none"
        editable={editable}
      />
    </View>
  );
};

const EditProfileScreen = ({navigation}) => {
  const {t} = useTranslation();
  const {user, updateUser} = useAuth();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [farmName, setFarmName] = useState(user?.farmName || '');
  const [avatarUri, setAvatarUri] = useState(user?.avatar || '');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const isFarmer = user?.userType === 'farmer';
  const letter = (name || 'U').charAt(0).toUpperCase();
  const bg = ['#1B8A4E', '#1565C0', '#E65100', '#6A1B9A'][
    letter.charCodeAt(0) % 4
  ];

  // Pick from camera or gallery
  const pickImage = useCallback(
    async source => {
      try {
        const {
          launchCamera,
          launchImageLibrary,
        } = require('react-native-image-picker');
        const opts = {
          mediaType: 'photo',
          quality: 0.8,
          maxWidth: 400,
          maxHeight: 400,
        };
        const result =
          source === 'camera'
            ? await launchCamera(opts)
            : await launchImageLibrary(opts);
        if (result.didCancel || !result.assets?.[0]) {
          return;
        }
        const uri = result.assets[0].uri;
        setAvatarUri(uri);
        setIsUploading(true);
        const {
          uploadImageToCloudinary,
        } = require('../../services/cloudinaryServices');
        const up = await uploadImageToCloudinary(uri, 'avatars');
        setIsUploading(false);
        if (up.success) {
          setAvatarUri(up.url);
          Alert.alert(
            '✅',
            t('profile.photoUpdated', {
              defaultValue: 'புகைப்படம் புதுப்பிக்கப்பட்டது!',
            }),
          );
        } else {
          setAvatarUri(user?.avatar || '');
          Alert.alert(
            t('common.error', {defaultValue: 'பிழை'}),
            up.error || 'Upload failed',
          );
        }
      } catch (e) {
        setIsUploading(false);
        console.log('pick error:', e);
      }
    },
    [user, t],
  );

  // Show Camera/Gallery choice dialog
  const handlePhotoPick = useCallback(() => {
    setModalVisible(true);
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('profile.nameRequired', {defaultValue: 'பெயர் உள்ளிடவும்'}),
      );
      return;
    }
    setIsSaving(true);
    const r = await updateUser({
      name: name.trim(),
      phone: phone.trim(),
      location: location.trim(),
      about: user?.about || '',
      avatar: avatarUri,
      ...(isFarmer && {farmName: farmName.trim()}),
    });
    setIsSaving(false);
    if (r.success) {
      Alert.alert(
        '✅',
        t('profile.profileUpdated', {
          defaultValue: 'சுயவிவரம் புதுப்பிக்கப்பட்டது!',
        }),
        [
          {
            text: t('common.ok', {defaultValue: 'சரி'}),
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } else {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        r.error || 'Update failed',
      );
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: themeColors.bg}]}>
      <LinearGradient colors={['#0D5C32', '#1565C0']} style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <View style={{flex: 1, alignItems: 'center'}}>
          <Text style={styles.headerTitle}>
            ✏️ {t('settings.editProfile', {defaultValue: 'சுயவிவரம் திருத்து'})}
          </Text>
        </View>
        <View style={{width: rs(40)}} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handlePhotoPick} disabled={isUploading}>
            {avatarUri ? (
              <FastImage
                source={{uri: avatarUri, priority: FastImage.priority.normal}}
                style={styles.avatarImg}
                resizeMode={FastImage.resizeMode.cover}
              />
            ) : (
              <View style={[styles.avatarLetter, {backgroundColor: bg}]}>
                <Text style={styles.avatarLetterTxt}>{letter}</Text>
              </View>
            )}
            <View style={styles.camOverlay}>
              {isUploading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={{fontSize: rs(14)}}>📷</Text>
              )}
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, {color: themeColors.textMuted}]}>
            {t('profile.tapToChange', {
              defaultValue:
                'புகைப்படம் மாற்ற கிளிக் செய்யவும் / Tap to change photo',
            })}
          </Text>
        </View>

        {/* Form */}
        <View
          style={[
            styles.formCard,
            {
              backgroundColor: themeColors.cardBg,
              borderColor: themeColors.border,
              borderWidth: 1,
            },
          ]}>
          <Text style={[styles.sectionTitle, {color: themeColors.text}]}>
            👤 {t('profile.basicInfo', {defaultValue: 'அடிப்படை தகவல்'})}
          </Text>
          <Field
            label={'👤 ' + t('profile.fullName', {defaultValue: 'பெயர்'})}
            value={name}
            onChangeText={setName}
            placeholder={t('profile.namePlaceholder', {
              defaultValue: 'உங்கள் பெயர்',
            })}
          />
          <Field
            label={'📱 ' + t('profile.phoneLabel', {defaultValue: 'தொலைபேசி'})}
            value={phone}
            onChangeText={setPhone}
            placeholder="9876543210"
            keyboard="phone-pad"
          />
          <Field
            label={
              '📧 ' +
              t('profile.emailLabel', {
                defaultValue: 'மின்னஞ்சல் (வாசிக்க மட்டும்)',
              })
            }
            value={user?.email || ''}
            onChangeText={() => {}}
            editable={false}
          />
          <Field
            label={
              '📍 ' + t('profile.locationLabel', {defaultValue: 'இடம் / நகரம்'})
            }
            value={location}
            onChangeText={setLocation}
            placeholder={t('profile.locationPlaceholder', {
              defaultValue: 'நகரம், மாவட்டம்',
            })}
          />
          {isFarmer && (
            <Field
              label={
                '🏡 ' +
                t('farmer.farmName', {defaultValue: 'பண்ணை பெயர் / Farm Name'})
              }
              value={farmName}
              onChangeText={setFarmName}
              placeholder={t('farmer.farmNamePlaceholder', {
                defaultValue: 'உங்கள் பண்ணையின் பெயர்',
              })}
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          disabled={isSaving}>
          <LinearGradient
            colors={isSaving ? ['#9E9E9E', '#757575'] : COLORS.gradientButton}
            style={styles.saveGrad}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            {isSaving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.saveTxt}>
                💾 {t('common.save', {defaultValue: 'சேமிக்கவும்'})}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
        <View style={{height: rs(40)}} />
      </ScrollView>

      {/* Photo Picker Bottom Sheet Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={styles.modalBgDismiss}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View
            style={[styles.modalCard, {backgroundColor: themeColors.cardBg}]}>
            <View style={styles.modalBar} />

            <Text style={[styles.modalTitle, {color: themeColors.text}]}>
              📷 {t('profile.changePhoto', {defaultValue: 'Change Photo'})}
            </Text>
            <Text
              style={[styles.modalSubtitle, {color: themeColors.textMuted}]}>
              {t('profile.chooseSource', {
                defaultValue: 'Choose from Camera or Gallery',
              })}
            </Text>

            <TouchableOpacity
              style={[
                styles.modalOption,
                {borderBottomWidth: 1, borderBottomColor: themeColors.border},
              ]}
              onPress={() => {
                setModalVisible(false);
                pickImage('camera');
              }}>
              <Text style={[styles.modalOptionText, {color: themeColors.text}]}>
                📷 {t('profile.camera', {defaultValue: 'Camera'})}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalOption,
                {borderBottomWidth: 1, borderBottomColor: themeColors.border},
              ]}
              onPress={() => {
                setModalVisible(false);
                pickImage('gallery');
              }}>
              <Text style={[styles.modalOptionText, {color: themeColors.text}]}>
                🖼️ {t('profile.gallery', {defaultValue: 'Gallery'})}
              </Text>
            </TouchableOpacity>

            {!!avatarUri && (
              <TouchableOpacity
                style={[
                  styles.modalOption,
                  {borderBottomWidth: 1, borderBottomColor: themeColors.border},
                ]}
                onPress={() => {
                  setModalVisible(false);
                  setAvatarUri('');
                }}>
                <Text
                  style={[
                    styles.modalOptionText,
                    {color: COLORS.error || '#D32F2F'},
                  ]}>
                  🗑️ {t('profile.deletePhoto', {defaultValue: 'Delete Photo'})}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.modalCancelBtn,
                {backgroundColor: isDark ? '#2A2A2A' : '#F5F5F5'},
              ]}
              onPress={() => setModalVisible(false)}>
              <Text style={[styles.modalCancelText, {color: themeColors.text}]}>
                {t('common.cancel', {defaultValue: 'No'})}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  header: {
    paddingTop: rs(50),
    paddingBottom: rs(20),
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {width: rs(40)},
  backTxt: {color: COLORS.white, fontSize: rs(22), fontWeight: 'bold'},
  headerTitle: {
    fontSize: rs(FONTS.lg),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerSub: {
    fontSize: rs(FONTS.xs),
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  content: {padding: SPACING.lg},
  avatarSection: {alignItems: 'center', marginBottom: SPACING.xl},
  avatarImg: {
    width: rs(100),
    height: rs(100),
    borderRadius: rs(50),
    borderWidth: 3,
    borderColor: COLORS.primaryGreen,
  },
  avatarLetter: {
    width: rs(100),
    height: rs(100),
    borderRadius: rs(50),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.primaryGreen,
  },
  avatarLetterTxt: {color: COLORS.white, fontSize: rs(40), fontWeight: 'bold'},
  camOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: rs(32),
    height: rs(32),
    borderRadius: rs(16),
    backgroundColor: COLORS.primaryGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  avatarHint: {
    fontSize: rs(FONTS.xs),
    color: COLORS.textMuted,
    marginTop: SPACING.sm,
    textAlign: 'center',
    lineHeight: rs(18),
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  fieldWrap: {marginBottom: SPACING.lg},
  fieldLabel: {
    fontSize: rs(FONTS.sm),
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: rs(6),
  },
  fieldInput: {
    backgroundColor: COLORS.background,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    height: rs(52),
    fontSize: rs(FONTS.md),
    color: COLORS.textPrimary,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
  },
  fieldDisabled: {backgroundColor: '#F5F5F5', color: COLORS.textMuted},
  saveBtn: {borderRadius: RADIUS.lg, overflow: 'hidden'},
  saveGrad: {paddingVertical: rs(16), alignItems: 'center'},
  saveTxt: {color: COLORS.white, fontSize: rs(FONTS.lg), fontWeight: 'bold'},
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBgDismiss: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xl,
    paddingBottom: rs(34),
    alignItems: 'center',
    width: '100%',
  },
  modalBar: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#CCCCCC',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: rs(FONTS.lg),
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: rs(FONTS.sm),
    marginBottom: SPACING.xl,
    textAlign: 'center',
  },
  modalOption: {
    width: '100%',
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: rs(16),
    fontWeight: '500',
  },
  modalCancelBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  modalCancelText: {
    fontSize: rs(16),
    fontWeight: 'bold',
  },
});

export default EditProfileScreen;
