import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Dimensions
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';
import { useAuth } from '../../context/AuthContext';
import { addHarvest } from '../../services/firebase';
import BackButton from '../../utils/BackButton';

const { width } = Dimensions.get('window');

const FormField = ({ label, value, onChangeText, keyboard = 'default' }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={styles.fieldInput}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboard}
    />
  </View>
);

const FarmerAddHarvestScreen = ({ navigation }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    emoji: '',
    harvestDate: '',
    qty: '',
    price: '',
    originalPrice: '',
    unit: '',
    description: '',
  });

  const handleSave = async () => {
    if (!formData.name || !formData.harvestDate || !formData.qty || !formData.price) {
      Alert.alert('பிழை / Error', 'தயவுசெய்து அனைத்து முக்கிய விவரங்களையும் நிரப்பவும்!');
      return;
    }

    setLoading(true);
    try {
      const harvestData = {
        farmerId: user?.id || user?.uid,
        farmer: user?.name || 'Farmer',
        farmLocation: user?.address || 'Tamil Nadu',
        name: formData.name,
        nameEn: formData.nameEn || formData.name,
        emoji: formData.emoji || '🌾',
        image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400', // Default image for now
        harvestDate: formData.harvestDate, // YYYY-MM-DD
        qty: formData.qty,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice || formData.price),
        unit: formData.unit || 'kg',
        description: formData.description,
        descriptionEn: formData.description,
        totalPreOrders: 0,
        targetPreOrders: 50,
      };

      const res = await addHarvest(harvestData);
      if (res.success) {
        Alert.alert('✅ வெற்றி', 'உங்கள் அறுவடை விவரம் Calendar-ல் சேர்க்கப்பட்டது!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', res.error);
      }
    } catch (e) {
      Alert.alert('Error', e.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.headerTitle, { marginLeft: SPACING.md }]}>📅 {t('farmer.addHarvest', { defaultValue: 'Add Harvest' })}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{t('farmer.harvestDetails', { defaultValue: 'Harvest Details' })}</Text>
          
          <FormField label={t('farmer.productNameTa', { defaultValue: 'பொருளின் பெயர் (தமிழ்)' })} value={formData.name} onChangeText={(t) => setFormData({...formData, name: t})} />
          <FormField label={t('farmer.productNameEn', { defaultValue: 'Product Name (English)' })} value={formData.nameEn} onChangeText={(t) => setFormData({...formData, nameEn: t})} />
          <FormField label={t('farmer.harvestDate', { defaultValue: 'அறுவடை தேதி (YYYY-MM-DD)' })} value={formData.harvestDate} onChangeText={(t) => setFormData({...formData, harvestDate: t})} keyboard="numeric" />
          
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <View style={{ flex: 1 }}>
              <FormField label={t('farmer.qty', { defaultValue: 'அளவு (Qty)' })} value={formData.qty} onChangeText={(t) => setFormData({...formData, qty: t})} keyboard="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label={t('farmer.unit', { defaultValue: 'அலகு (Unit)' })} value={formData.unit} onChangeText={(t) => setFormData({...formData, unit: t})} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <View style={{ flex: 1 }}>
              <FormField label={t('farmer.discountPrice', { defaultValue: 'தள்ளுபடி விலை (₹)' })} value={formData.price} onChangeText={(t) => setFormData({...formData, price: t})} keyboard="numeric" />
            </View>
            <View style={{ flex: 1 }}>
              <FormField label={t('farmer.originalPrice', { defaultValue: 'வழக்கமான விலை (₹)' })} value={formData.originalPrice} onChangeText={(t) => setFormData({...formData, originalPrice: t})} keyboard="numeric" />
            </View>
          </View>
        </View>

        <TouchableOpacity style={styles.submitBtn} onPress={handleSave} disabled={loading}>
          <LinearGradient colors={COLORS.gradientButton} style={styles.submitGrad}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitTxt}>✅ {t('farmer.saveHarvest', { defaultValue: 'Save to Calendar' })}</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingTop: 50, paddingBottom: 20, paddingHorizontal: SPACING.lg, flexDirection: 'row', alignItems: 'center' },
  backBtn: { marginRight: SPACING.md },
  backTxt: { color: COLORS.white, fontSize: 28, fontWeight: 'bold' },
  headerTitle: { color: COLORS.white, fontSize: 20, fontWeight: 'bold' },
  scroll: { padding: SPACING.lg, paddingBottom: 100 },
  card: { backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl, ...SHADOWS.small },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.lg },
  fieldWrap: { marginBottom: SPACING.md },
  fieldLabel: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 6, fontWeight: '600' },
  fieldInput: { backgroundColor: '#F5F5F5', borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: 12, fontSize: 16, color: COLORS.textPrimary },
  submitBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', ...SHADOWS.medium },
  submitGrad: { paddingVertical: 16, alignItems: 'center' },
  submitTxt: { color: COLORS.white, fontSize: 18, fontWeight: 'bold' },
});

export default FarmerAddHarvestScreen;
