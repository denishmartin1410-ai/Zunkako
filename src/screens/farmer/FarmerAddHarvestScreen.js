import React, {useState, useEffect} from 'react';
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
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import LinearGradient from 'react-native-linear-gradient';
import {useTranslation} from 'react-i18next';
import {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  SHADOWS,
  getThemeColors,
} from '../../utils/theme';
import {useAuth} from '../../context/AuthContext';
import {useTheme} from '../../context/ThemeContext';
import {
  addHarvest,
  deleteHarvest,
  listenToHarvests,
} from '../../services/firebase';
import {convertToDbDate, formatToUiDate} from '../../utils/dateHelper';
import {
  getLocalProductName,
  getProductVisualDetails,
} from '../../utils/translationHelper';
import BackButton from '../../utils/BackButton';

const {width} = Dimensions.get('window');

const FormField = ({
  label,
  value,
  onChangeText,
  keyboard = 'default',
  placeholder = '',
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
        ]}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboard}
        placeholder={placeholder}
        placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : '#A0A0A0'}
      />
    </View>
  );
};

const FarmerAddHarvestScreen = ({navigation}) => {
  const {t, i18n} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const {user} = useAuth();

  const [loading, setLoading] = useState(false);
  const [activeHarvests, setActiveHarvests] = useState([]);
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

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locStatus, setLocStatus] = useState('fetching'); // fetching, success, error

  const getCurrentLocationWithFallback = () => {
    Geolocation.getCurrentPosition(
      position => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
        setLocStatus('success');
      },
      error => {
        console.log(
          'High accuracy location failed, retrying with low accuracy:',
          error,
        );
        Geolocation.getCurrentPosition(
          pos => {
            setLatitude(pos.coords.latitude);
            setLongitude(pos.coords.longitude);
            setLocStatus('success');
          },
          err => {
            console.log('Low accuracy location failed:', err);
            setLocStatus('error');
          },
          {enableHighAccuracy: false, timeout: 15000, maximumAge: 10000},
        );
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 0},
    );
  };

  const fetchLocation = async () => {
    setLocStatus('fetching');
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t('farmer.locationPermissionTitle', {
              defaultValue: 'இருப்பிட அனுமதி',
            }),
            message: t('farmer.locationPermissionMsg', {
              defaultValue:
                'பொருளின் இடத்தை வாடிக்கையாளருக்கு காட்ட இருப்பிட அனுமதி தேவை.',
            }),
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          getCurrentLocationWithFallback();
        } else {
          setLocStatus('error');
          Alert.alert(
            t('farmer.locationPermissionTitle', {
              defaultValue: 'இருப்பிட அனுமதி',
            }),
            t('farmer.locationDeniedMsg', {
              defaultValue:
                'அறுவடையைச் சேர்க்க இருப்பிட அனுமதி தேவை. அதை அமைப்புகளில் அனுமதிக்கவும்.\nLocation permission is required to add harvests. Please allow it in App Settings.',
            }),
            [
              {
                text: t('common.cancel', {defaultValue: 'Cancel'}),
                style: 'cancel',
              },
              {
                text: t('profile.settings', {defaultValue: 'Settings'}),
                onPress: () => Linking.openSettings(),
              },
            ],
          );
        }
      } else {
        getCurrentLocationWithFallback();
      }
    } catch (err) {
      setLocStatus('error');
      console.warn(err);
    }
  };

  useEffect(() => {
    fetchLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen to this farmer's harvests in real time
  useEffect(() => {
    const userId = user?.id || user?.uid;
    if (!userId) {
      return;
    }

    const unsub = listenToHarvests(res => {
      if (res.success && res.data) {
        const filtered = res.data.filter(h => h.farmerId === userId);
        setActiveHarvests(filtered);
      }
    });
    return unsub;
  }, [user]);

  const handleSave = async () => {
    if (
      !formData.name ||
      !formData.harvestDate ||
      !formData.qty ||
      !formData.price
    ) {
      Alert.alert(t('common.error'), t('farmer.fillAllHarvestDetails'));
      return;
    }

    const sanitizedDate = formData.harvestDate.replace(/-/g, '/');
    const dbDate = convertToDbDate(sanitizedDate);
    if (!dbDate) {
      Alert.alert(t('common.error'), t('farmer.invalidDateFormat'));
      return;
    }

    setLoading(true);
    try {
      const visualDetails = getProductVisualDetails(
        formData.nameEn,
        formData.name,
      );

      const harvestData = {
        farmerId: user?.id || user?.uid,
        farmer: user?.name || 'Farmer',
        farmLocation: user?.address || 'Tamil Nadu',
        name: formData.name,
        nameEn: formData.nameEn || formData.name,
        emoji: formData.emoji || visualDetails.emoji || '🌾',
        image:
          'https://images.unsplash.com/photo-1553279768-865429fa0078?w=400', // Default mango image identifier to replace dynamically
        harvestDate: dbDate, // YYYY-MM-DD
        qty: formData.qty,
        price: Number(formData.price),
        originalPrice: Number(formData.originalPrice || formData.price),
        unit: formData.unit || 'kg',
        description: formData.description || '',
        descriptionEn: formData.description || '',
        totalPreOrders: 0,
        targetPreOrders: 50,
        coordinates:
          latitude && longitude ? {lat: latitude, lng: longitude} : null,
        location: user?.location || '',
      };

      const res = await addHarvest(harvestData);
      if (res.success) {
        Alert.alert(
          t('common.success', {defaultValue: 'Success'}),
          t('farmer.changesSaved', {defaultValue: 'Changes Saved!'}),
        );
        setFormData({
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
      } else {
        Alert.alert(t('common.error'), res.error);
      }
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    }
    setLoading(false);
  };

  const handleDelete = harvestId => {
    Alert.alert(
      t('farmer.confirmDeleteHarvest', {
        defaultValue: 'Are you sure you want to delete this harvest?',
      }),
      '',
      [
        {text: t('common.cancel', {defaultValue: 'No'}), style: 'cancel'},
        {
          text: t('common.yes', {defaultValue: 'Yes'}),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const res = await deleteHarvest(harvestId);
            setLoading(false);
            if (res.success) {
              Alert.alert(
                t('common.success'),
                t('farmer.deleteHarvestSuccess'),
              );
            } else {
              Alert.alert(t('common.error'), res.error);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={[styles.container, {backgroundColor: themeColors.bg}]}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={[styles.headerTitle, {marginLeft: SPACING.md}]}>
          {t('farmer.addHarvest', {defaultValue: 'Add Harvest'})}
        </Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: themeColors.cardBg,
              borderColor: themeColors.border,
              borderWidth: 1,
            },
          ]}>
          <Text style={[styles.cardTitle, {color: themeColors.text}]}>
            {t('farmer.harvestDetails', {defaultValue: 'Harvest Details'})}
          </Text>

          <FormField
            label={t('farmer.productNameTa', {
              defaultValue: 'பொருளின் பெயர் (தமிழ்)',
            })}
            value={formData.name}
            onChangeText={t => setFormData({...formData, name: t})}
            placeholder=""
          />
          <FormField
            label={t('farmer.productNameEn', {
              defaultValue: 'Product Name (English)',
            })}
            value={formData.nameEn}
            onChangeText={t => setFormData({...formData, nameEn: t})}
            placeholder=""
          />
          <FormField
            label={t('farmer.harvestDate', {
              defaultValue: 'Harvest Date (DD/MM/YYYY)',
            })}
            value={formData.harvestDate}
            onChangeText={t => setFormData({...formData, harvestDate: t})}
            keyboard="default"
            placeholder=""
          />

          <TouchableOpacity
            onPress={() => {
              if (locStatus === 'error') {
                Alert.alert(
                  t('location.turnOnGpsTitle', {defaultValue: 'GPS இயக்கவும்'}),
                  t('location.turnOnGpsMsg', {
                    defaultValue:
                      'விளைபொருளை சேர்க்க ஜிபிஎஸ் இருப்பிடத்தை இயக்க வேண்டும். தயவுசெய்து அமைப்புகளில் அதனை இயக்கவும்.\nTo add harvests, GPS location services must be enabled. Please turn it on in settings.',
                  }),
                  [
                    {
                      text: t('common.cancel', {defaultValue: 'No, thanks'}),
                      style: 'cancel',
                    },
                    {
                      text: t('location.turnOn', {defaultValue: 'Turn on'}),
                      onPress: () => {
                        if (Platform.OS === 'android') {
                          Linking.sendIntent(
                            'android.settings.LOCATION_SOURCE_SETTINGS',
                          );
                        } else {
                          Linking.openURL('app-settings:');
                        }
                      },
                    },
                  ],
                );
              } else {
                fetchLocation();
              }
            }}
            style={{
              marginBottom: SPACING.md,
              padding: SPACING.md,
              backgroundColor: isDark ? 'rgba(46, 125, 50, 0.2)' : '#E8F5E9',
              borderRadius: RADIUS.md,
              flexDirection: 'row',
              alignItems: 'center',
            }}>
            <Text style={{fontSize: 24, marginRight: 10}}></Text>
            <View style={{flex: 1}}>
              <Text
                style={{
                  fontSize: FONTS.sm,
                  fontWeight: FONTS.semiBold,
                  color: isDark ? COLORS.primaryGreen : COLORS.primaryGreenDark,
                }}>
                {locStatus === 'fetching'
                  ? t('farmer.fetchingLocation', {
                      defaultValue: 'Fetching your location...',
                    })
                  : locStatus === 'success'
                  ? t('farmer.locationAdded', {
                      defaultValue: 'Your location added successfully!',
                    })
                  : t('farmer.locationError', {
                      defaultValue: 'Could not get location. Turn on GPS.',
                    })}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={{flexDirection: 'row', gap: SPACING.md}}>
            <View style={{flex: 1}}>
              <FormField
                label={t('farmer.qty', {defaultValue: 'Quantity (Qty)'})}
                value={formData.qty}
                onChangeText={t => setFormData({...formData, qty: t})}
                keyboard="numeric"
                placeholder="50"
              />
            </View>
            <View style={{flex: 1}}>
              <FormField
                label={t('farmer.unit', {defaultValue: 'Unit'})}
                value={formData.unit}
                onChangeText={t => setFormData({...formData, unit: t})}
                placeholder="kg"
              />
            </View>
          </View>

          <View style={{flexDirection: 'row', gap: SPACING.md}}>
            <View style={{flex: 1}}>
              <FormField
                label={t('farmer.discountPrice', {
                  defaultValue: 'Discount Price (₹)',
                })}
                value={formData.price}
                onChangeText={t => setFormData({...formData, price: t})}
                keyboard="numeric"
                placeholder="25"
              />
            </View>
            <View style={{flex: 1}}>
              <FormField
                label={t('farmer.originalPrice', {
                  defaultValue: 'Regular Price (₹)',
                })}
                value={formData.originalPrice}
                onChangeText={t => setFormData({...formData, originalPrice: t})}
                keyboard="numeric"
                placeholder="35"
              />
            </View>
          </View>
        </View>

        {/* Zunkako Harvest Field Guide */}
        <View
          style={[
            styles.guideCard,
            {
              backgroundColor: isDark ? '#14251B' : '#EBF8F1',
              borderColor: isDark ? '#1F3F2D' : '#C8E6C9',
            },
          ]}>
          <Text
            style={[
              styles.guideCardTitle,
              {color: isDark ? '#4CAF50' : '#0D5C32'},
            ]}>
            {t('farmer.explanationsTitle', {
              defaultValue: '🌾 Zunkako Harvest Field Guide',
            })}
          </Text>
          <View style={styles.guideItem}>
            <Text style={styles.guideEmoji}></Text>
            <Text style={[styles.guideText, {color: themeColors.subText}]}>
              {t('farmer.qtyExpl', {
                defaultValue:
                  'Quantity (Qty): Total estimated crops you plan to harvest and sell (e.g. 50).',
              })}
            </Text>
          </View>
          <View style={styles.guideItem}>
            <Text style={styles.guideEmoji}></Text>
            <Text style={[styles.guideText, {color: themeColors.subText}]}>
              {t('farmer.unitExpl', {
                defaultValue:
                  'Unit: The measurement unit for your crop (e.g., Kg, Bundle, Litre).',
              })}
            </Text>
          </View>
          <View style={styles.guideItem}>
            <Text style={styles.guideEmoji}></Text>
            <Text style={[styles.guideText, {color: themeColors.subText}]}>
              {t('farmer.discountPriceExpl', {
                defaultValue:
                  'Discount Price (₹): The special lower price for consumers who pre-order early.',
              })}
            </Text>
          </View>
          <View style={styles.guideItem}>
            <Text style={styles.guideEmoji}></Text>
            <Text style={[styles.guideText, {color: themeColors.subText}]}>
              {t('farmer.regularPriceExpl', {
                defaultValue:
                  'Regular Price (₹): The standard market price for normal sales after harvest.',
              })}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSave}
          disabled={loading}>
          <LinearGradient
            colors={COLORS.gradientButton}
            style={styles.submitGrad}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.submitTxt}>
                {t('farmer.saveHarvest', {defaultValue: 'Save to Calendar'})}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Farmer's My Added Harvests Section */}
        <View style={styles.harvestListSection}>
          <Text style={[styles.sectionHeader, {color: themeColors.text}]}>
            {t('farmer.myAddedHarvests', {defaultValue: 'My Added Harvests'})}
          </Text>
          {activeHarvests.length === 0 ? (
            <Text
              style={[styles.noHarvestsText, {color: themeColors.textMuted}]}>
              {t('farmer.noAddedHarvests', {
                defaultValue: 'No harvests added yet.',
              })}
            </Text>
          ) : (
            activeHarvests.map(item => {
              const productName = getLocalProductName(
                item.nameEn,
                item.name,
                i18n.language,
              );
              const visual = getProductVisualDetails(item.nameEn, item.name);
              const uiDate = formatToUiDate(item.harvestDate);

              return (
                <View
                  key={item.id}
                  style={[
                    styles.harvestItemCard,
                    {
                      backgroundColor: themeColors.cardBg,
                      borderColor: themeColors.border,
                      borderWidth: 1,
                    },
                  ]}>
                  <LinearGradient
                    colors={visual.colors || ['#E8F5E9', '#C8E6C9']}
                    style={styles.harvestItemEmojiContainer}>
                    <Text style={styles.harvestItemEmoji}>
                      {visual.emoji || ''}
                    </Text>
                  </LinearGradient>

                  <View style={styles.harvestItemInfo}>
                    <Text
                      style={[
                        styles.harvestItemName,
                        {color: themeColors.text},
                      ]}>
                      {productName}
                    </Text>
                    <Text
                      style={[
                        styles.harvestItemDetails,
                        {color: themeColors.subText},
                      ]}>
                      {uiDate} • {item.qty} {item.unit}
                    </Text>
                    <Text
                      style={[
                        styles.harvestItemPrice,
                        {color: isDark ? '#4CAF50' : '#0D5C32'},
                      ]}>
                      ₹{item.price} (Reg: ₹{item.originalPrice})
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.deleteIconButton,
                      {
                        backgroundColor: isDark ? '#3D1B1E' : '#FFEBEE',
                        borderColor: isDark ? '#5C2429' : '#FFCDD2',
                      },
                    ]}
                    onPress={() => handleDelete(item.id)}>
                    <Text
                      style={[
                        styles.deleteIconText,
                        {color: isDark ? '#FF8A80' : '#C62828'},
                      ]}>
                      {t('farmer.deleteBtn', {defaultValue: 'Delete'})}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {color: COLORS.white, fontSize: 20, fontWeight: 'bold'},
  scroll: {padding: SPACING.lg, paddingBottom: 100},
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.small,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  fieldWrap: {marginBottom: SPACING.md},
  fieldLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '600',
  },
  fieldInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  submitBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
    marginBottom: SPACING.xl,
  },
  submitGrad: {paddingVertical: 16, alignItems: 'center'},
  submitTxt: {color: COLORS.white, fontSize: 18, fontWeight: 'bold'},

  // Guide Card styling
  guideCard: {
    backgroundColor: '#EBF8F1',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    ...SHADOWS.small,
  },
  guideCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0D5C32',
    marginBottom: SPACING.md,
  },
  guideItem: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
    alignItems: 'flex-start',
  },
  guideEmoji: {
    marginRight: SPACING.sm,
    fontSize: 16,
    marginTop: 2,
  },
  guideText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },

  // Active harvests listing
  harvestListSection: {
    marginTop: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  noHarvestsText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  harvestItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  harvestItemEmojiContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  harvestItemEmoji: {
    fontSize: 24,
  },
  harvestItemInfo: {
    flex: 1,
  },
  harvestItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  harvestItemDetails: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  harvestItemPrice: {
    fontSize: 12,
    color: '#0D5C32',
    fontWeight: '600',
    marginTop: 2,
  },
  deleteIconButton: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  deleteIconText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default FarmerAddHarvestScreen;
