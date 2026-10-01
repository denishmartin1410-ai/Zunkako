// ============================================================
// src/components/ContentReportModal.js
// Content Moderation Report Modal for Zunkako App
// Allows users to report inappropriate Reels, Stories, Products, or Users
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, RADIUS, SPACING } from '../utils/theme';
import { firestore } from '../services/firebase';

const { width } = Dimensions.get('window');

const REPORT_REASONS = [
  { id: 'adult_explicit', icon: '🔞', labelEn: 'Adult / Explicit Content', labelTa: 'ஆபாசம் / தவறான படங்கள்', labelMl: 'അശ്ലീല ഉള്ളടക്കം' },
  { id: 'fake_product', icon: '🚫', labelEn: 'Fake or Misleading Product', labelTa: 'போலி அல்லது தவறான தயாரிப்பு', labelMl: 'വ്യാജ ഉൽപ്പന്നം' },
  { id: 'offensive_video', icon: '⚠️', labelEn: 'Offensive or Violent Video', labelTa: 'வன்முறை / தாக்குதல் வீடியோ', labelMl: 'അക്രമകരമായ വീഡിയോ' },
  { id: 'spam_unrelated', icon: '📢', labelEn: 'Spam or Unrelated Content', labelTa: 'ஸ்பேம் / சம்பந்தமில்லாத வீடியோ', labelMl: 'സ്പാം ഉള്ളടക്കം' },
  { id: 'political_movie', icon: '🎬', labelEn: 'Political / Movie / Meme Clips', labelTa: 'அரசியல் / சினிமா / மீம்ஸ்கள்', labelMl: 'രാഷ്ട്രീയ/സിനിമാ വീഡിയോ' },
  { id: 'other', icon: '❓', labelEn: 'Other Concern', labelTa: 'மற்ற பிற புகார்கள்', labelMl: 'മറ്റ് പരാതികൾ' },
];

const ContentReportModal = ({
  visible,
  onClose,
  targetId,
  targetTitle = '',
  contentType = 'reel', // 'reel', 'story', 'product', 'user'
  reporterId = '',
}) => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || 'ta';
  const [selectedReason, setSelectedReason] = useState(null);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReportSubmit = async () => {
    if (!selectedReason) {
      Alert.alert(
        t('common.alert', { defaultValue: 'Alert' }),
        currentLang === 'ta'
          ? 'தயவுசெய்து புகார் அளிப்பதற்கான காரணத்தை தேர்வு செய்யவும்!'
          : currentLang === 'ml'
          ? 'ദയവായി പരാതിയുടെ കാരണം തിരഞ്ഞെടുക്കുക!'
          : 'Please select a reason for reporting!'
      );
      return;
    }

    try {
      setSubmitting(true);

      const reportData = {
        reporterId: reporterId || 'anonymous_user',
        contentType,
        targetId: targetId || 'unknown_target',
        targetTitle,
        reasonId: selectedReason.id,
        reasonText: selectedReason.labelEn,
        additionalNotes: additionalNotes.trim(),
        status: 'pending', // 'pending', 'reviewed', 'action_taken', 'dismissed'
        createdAt: new Date().toISOString(),
      };

      await firestore().collection('content_reports').add(reportData);

      setSubmitting(false);
      setSelectedReason(null);
      setAdditionalNotes('');
      onClose();

      Alert.alert(
        '✅ ' + (currentLang === 'ta' ? 'புகார் பெறப்பட்டது' : currentLang === 'ml' ? 'പരാതി ലഭിച്ചു' : 'Report Received'),
        currentLang === 'ta'
          ? 'உங்கள் புகாருக்கு நன்றி! எங்கள் AI & அட்மின் குழு 24 மணி நேரத்திற்குள் இதை ஆய்வு செய்து நடவடிக்கை எடுக்கும்.'
          : currentLang === 'ml'
          ? 'നിങ്ങളുടെ പരാതി ലഭിച്ചു! ഞങ്ങളുടെ അഡ്മിൻ ടീം 24 മണിക്കൂറിനുള്ളിൽ പരിശോധിക്കും.'
          : 'Thank you for reporting. Our moderation team will review this item within 24 hours.'
      );
    } catch (error) {
      setSubmitting(false);
      console.error('Report submission error:', error);
      Alert.alert(
        'Error',
        currentLang === 'ta'
          ? 'புகார் அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'
          : 'Failed to submit report. Please try again.'
      );
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>
              🛡️ {currentLang === 'ta' ? 'உள்ளடக்கப் புகார் அளித்தல்' : currentLang === 'ml' ? 'ഉള്ളടക്ക പരാതി' : 'Report Content'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subTitle}>
            {currentLang === 'ta'
              ? 'இந்த வீடியோ/தயாரிப்பு Zunkako சமூக விதிமுறைகளுக்கு முரணாக உள்ளதா? காரணத்தைத் தேர்ந்தெடுக்கவும்:'
              : currentLang === 'ml'
              ? 'ഈ ഉള്ളടക്കം കമ്മ്യൂണിറ്റി മാർഗ്ഗനിർദ്ദേശങ്ങൾക്ക് വിരുദ്ധമാണോ? കാരണം തിരഞ്ഞെടുക്കുക:'
              : 'Does this item violate Zunkako community guidelines? Select a reason:'}
          </Text>

          {/* Reasons List */}
          <View style={styles.reasonsList}>
            {REPORT_REASONS.map(item => {
              const isSelected = selectedReason?.id === item.id;
              const label =
                currentLang === 'ta'
                  ? item.labelTa
                  : currentLang === 'ml'
                  ? item.labelMl
                  : item.labelEn;

              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.reasonOption,
                    isSelected && styles.reasonOptionSelected,
                  ]}
                  onPress={() => setSelectedReason(item)}
                >
                  <Text style={styles.reasonIcon}>{item.icon}</Text>
                  <Text
                    style={[
                      styles.reasonText,
                      isSelected && styles.reasonTextSelected,
                    ]}
                  >
                    {label}
                  </Text>
                  {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Additional Notes */}
          <TextInput
            style={styles.textInput}
            placeholder={
              currentLang === 'ta'
                ? 'கூடுதல் விவரங்கள் (விருப்பப்பட்டால்)...'
                : currentLang === 'ml'
                ? 'കൂടുതൽ വിവരങ്ങൾ...'
                : 'Additional details (optional)...'
            }
            placeholderTextColor="#888"
            multiline
            numberOfLines={3}
            value={additionalNotes}
            onChangeText={setAdditionalNotes}
          />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleReportSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitButtonText}>
                {currentLang === 'ta'
                  ? 'புகார் அனுப்புக'
                  : currentLang === 'ml'
                  ? 'പരാതി സമർപ്പിക്കുക'
                  : 'Submit Report'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ContentReportModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '85%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#D32F2F',
  },
  closeBtn: {
    padding: SPACING.xs,
  },
  closeBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#555',
  },
  subTitle: {
    fontSize: 13,
    color: '#666',
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  reasonsList: {
    marginBottom: SPACING.md,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: '#F5F5F5',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  reasonOptionSelected: {
    backgroundColor: '#FFEBEE',
    borderColor: '#D32F2F',
  },
  reasonIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  reasonTextSelected: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  checkIcon: {
    fontSize: 16,
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  textInput: {
    backgroundColor: '#F9F9F9',
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    fontSize: 13,
    color: '#333',
    textAlignVertical: 'top',
    marginBottom: SPACING.md,
    minHeight: 60,
  },
  submitButton: {
    backgroundColor: '#D32F2F',
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
});
