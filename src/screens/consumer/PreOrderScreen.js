// ============================================================
// 📅 PRE-ORDER SCREEN
// விளைவதற்கு முன்பே Order பண்ணலாம்!
// Farmer-க்கு guaranteed income!
// Consumer-க்கு guaranteed fresh!
// எந்த app-லயும் இல்லாத UNIQUE Feature!
// ============================================================

import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
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

import {listenToHarvests, createPreOrder} from '../../services/firebase';
import BackButton from '../../utils/BackButton';
import {parseLocalDate} from '../../utils/dateHelper';
import {
  getLocalProductName,
  getProductVisualDetails,
} from '../../utils/translationHelper';

const {width} = Dimensions.get('window');

const PreOrderCard = ({item, onPreOrder, isHighlighted}) => {
  const {t, i18n} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const [quantity, setQuantity] = useState(1);
  const fillPercent = (item.totalPreOrders / item.targetPreOrders) * 100;

  const localName = getLocalProductName(item.nameEn, item.name, i18n.language);
  const localDesc =
    i18n.language === 'ta'
      ? item.descriptionTa || item.description
      : item.description || item.descriptionTa;

  const isDefaultImage =
    !item.image ||
    item.image.includes('unsplash.com') ||
    item.image.includes('photo-1553279768-865429fa0078');
  const visual = getProductVisualDetails(item.nameEn, item.name);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: themeColors.cardBg,
          borderColor: themeColors.border,
          borderWidth: isDark ? 1 : 0,
        },
        isHighlighted && {
          borderWidth: 2,
          borderColor: COLORS.primaryGreen,
          shadowColor: COLORS.primaryGreen,
          shadowOffset: {width: 0, height: 0},
          shadowOpacity: 0.8,
          shadowRadius: 10,
          elevation: 8,
        },
      ]}>
      {isHighlighted && (
        <View style={styles.highlightBadge}>
          <Text style={styles.highlightBadgeTxt}>
            🎯 {t('preOrder.selectedHarvest')}
          </Text>
        </View>
      )}
      {/* Image */}
      <View style={styles.imgWrap}>
        {isDefaultImage ? (
          <LinearGradient colors={visual.colors} style={styles.cardImgGrad}>
            <Text style={styles.cardImgEmoji}>{visual.emoji}</Text>
          </LinearGradient>
        ) : (
          <FastImage
            source={{uri: item.image, priority: FastImage.priority.normal}}
            style={styles.cardImg}
            resizeMode={FastImage.resizeMode.cover}
          />
        )}
        {/* Badges */}
        <View
          style={[
            styles.topBadge,
            {backgroundColor: item.badgeColor || COLORS.accentGold},
          ]}>
          <Text style={styles.topBadgeTxt}>{item.badge || '⭐ Hot'}</Text>
        </View>
        <View style={styles.savingsBadge}>
          <Text style={styles.savingsTxt}>
            💰 ₹{item.originalPrice - item.price}{' '}
            {t('product.savings', {defaultValue: 'சேமிப்பு'})}
          </Text>
        </View>
        {/* Countdown */}
        <View style={styles.countdownBadge}>
          <Text style={styles.countdownTxt}>
            ⏳{' '}
            {item.daysUntilHarvest === 0
              ? t('preOrder.harvestingToday', {defaultValue: 'அறுவடை இன்று!'})
              : item.daysUntilHarvest === 1
              ? t('preOrder.harvestingTomorrow', {defaultValue: 'அறுவடை நாளை!'})
              : t('preOrder.inDays', {
                  defaultValue: '{{count}} நாட்களில்',
                  count: item.daysUntilHarvest,
                })}
          </Text>
          <Text style={styles.countdownSubTxt}>
            In {item.daysUntilHarvest} days
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        {/* Product info */}
        <Text style={[styles.itemName, {color: themeColors.text}]}>
          {localName}
        </Text>
        {localName !== item.nameEn && (
          <Text style={[styles.itemNameEn, {color: themeColors.subText}]}>
            {item.nameEn}
          </Text>
        )}

        {/* Farmer + Harvest date */}
        <View style={styles.metaRow}>
          <View
            style={[
              styles.metaChip,
              {backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5'},
            ]}>
            <Text style={[styles.metaChipTxt, {color: themeColors.text}]}>
              👨‍🌾 {item.farmer}
            </Text>
          </View>
          <View
            style={[
              styles.metaChip,
              {backgroundColor: isDark ? '#1A334B' : '#E3F2FD'},
            ]}>
            <Text style={[styles.metaChipTxt, {color: COLORS.primaryBlue}]}>
              📅 {item.harvestDate}
            </Text>
          </View>
        </View>

        {/* Description */}
        <Text style={[styles.description, {color: themeColors.subText}]}>
          {localDesc}
        </Text>

        {/* Pre-orders progress */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressLabel, {color: themeColors.text}]}>
              🔥{' '}
              {t('preOrder.peoplePreOrdered', {
                count: item.totalPreOrders,
                defaultValue: '{{count}} pre-ordered',
              })}
            </Text>
            <Text style={[styles.progressCount, {color: themeColors.text}]}>
              {item.totalPreOrders}/{item.targetPreOrders}
            </Text>
          </View>
          <View
            style={[
              styles.progressBg,
              {backgroundColor: isDark ? '#333333' : '#E0E0E0'},
            ]}>
            <LinearGradient
              colors={COLORS.gradientButton}
              style={[
                styles.progressFill,
                {width: `${Math.min(fillPercent, 100)}%`},
              ]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
            />
          </View>
          {fillPercent >= 80 && (
            <Text style={styles.almostText}>
              ⚡ கிட்டத்தட்ட நிரம்பியது! / Almost full!
            </Text>
          )}
        </View>

        {/* Price row */}
        <View style={styles.priceRow}>
          <View>
            <Text style={[styles.price, {color: themeColors.text}]}>
              ₹{item.price}
              <Text style={[styles.unit, {color: themeColors.textMuted}]}>
                {' '}
                /{item.unit}
              </Text>
            </Text>
            <Text
              style={[styles.originalPrice, {color: themeColors.textMuted}]}>
              {t('preOrder.regular')}: ₹{item.originalPrice} |{' '}
              {t('preOrder.savings')}: ₹{item.originalPrice - item.price}
            </Text>
          </View>
          {/* Qty selector */}
          <View style={styles.qtyRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => setQuantity(q => Math.max(item.minOrder, q - 1))}>
              <Text style={styles.qtyBtnTxt}>−</Text>
            </TouchableOpacity>
            <Text style={styles.qtyNum}>{quantity}</Text>
            <TouchableOpacity
              style={[styles.qtyBtn, styles.qtyBtnPlus]}
              onPress={() => setQuantity(q => Math.min(item.maxOrder, q + 1))}>
              <Text style={[styles.qtyBtnTxt, {color: COLORS.white}]}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Guarantee */}
        <View style={styles.guaranteeBox}>
          <Text style={styles.guaranteeTxt}>
            ✅ {t('preOrder.guaranteeFresh')}
          </Text>
        </View>

        {/* Total + Pre-order button */}
        <View style={styles.orderRow}>
          <View>
            <Text style={styles.totalLabel}>
              {t('common.total', {defaultValue: 'Total'})}:
            </Text>
            <Text style={styles.totalValue}>₹{item.price * quantity}</Text>
          </View>
          <TouchableOpacity
            style={[styles.preOrderBtn, {flex: 1, marginLeft: SPACING.md}]}
            onPress={() => onPreOrder(item, quantity)}>
            <LinearGradient
              colors={COLORS.gradientButton}
              style={styles.preOrderGrad}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}>
              <Text
                style={styles.preOrderTxt}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}>
                📅 {t('preOrder.preOrderBtnText')}
              </Text>
              <Text
                style={styles.preOrderSubTxt}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}>
                {t('preOrder.preOrderSubText')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const PreOrderScreen = ({navigation, route}) => {
  const {t, i18n} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const {user} = useAuth();
  const [harvests, setHarvests] = useState([]);
  const [loading, setLoading] = useState(true);
  const selectedHarvestId = route?.params?.selectedHarvestId;

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItemForPreOrder, setSelectedItemForPreOrder] = useState(null);
  const [selectedQtyForPreOrder, setSelectedQtyForPreOrder] = useState(1);
  const [customerName, setCustomerName] = useState(user?.name || '');
  const [address, setAddress] = useState(user?.address || user?.location || '');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [coords, setCoords] = useState(null);
  const [linkingLocation, setLinkingLocation] = useState(false);

  useEffect(() => {
    const fid = user?.id || user?.uid;
    if (fid) {
      const {getUserProfile} = require('../../services/firebase');
      getUserProfile(fid).then(res => {
        if (res.success && res.data) {
          const profile = res.data;
          if (profile.name) {
            setCustomerName(profile.name);
          }
          if (profile.address) {
            setAddress(profile.address);
          }
          if (profile.pincode) {
            setPincode(profile.pincode);
          }
          if (profile.phone) {
            setPhone(profile.phone);
          }
        }
      });
    }
  }, [user]);

  const handleLinkLocation = () => {
    setLinkingLocation(true);
    Geolocation.getCurrentPosition(
      position => {
        const {latitude, longitude} = position.coords;
        setCoords({latitude, longitude});
        setLinkingLocation(false);
        Alert.alert(
          t('common.success', {defaultValue: 'வெற்றி'}),
          t('preOrder.gpsLinked', {defaultValue: 'Location Linked ✓'}),
        );
      },
      error => {
        setLinkingLocation(false);
        Alert.alert(
          t('common.error', {defaultValue: 'பிழை'}),
          error.message || 'Failed to get location',
        );
      },
      {enableHighAccuracy: true, timeout: 15000, maximumAge: 10000},
    );
  };

  React.useEffect(() => {
    const unsubscribe = listenToHarvests(res => {
      if (res.success) {
        // Calculate days until harvest for each item
        const processed = res.data
          .map(h => {
            const harvestDate = parseLocalDate(h.harvestDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const dateMidnight = new Date(
              harvestDate.getFullYear(),
              harvestDate.getMonth(),
              harvestDate.getDate(),
            );
            const diffTime = dateMidnight - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
              ...h,
              daysUntilHarvest: diffDays,
              guarantee: 'Fresh delivery within 24hrs of harvest',
              minOrder: 1,
              maxOrder: 10,
            };
          })
          .filter(h => h.daysUntilHarvest >= 0); // Show today and future harvests

        // Sort selectedHarvestId to the top if present
        if (selectedHarvestId) {
          processed.sort((a, b) => {
            if (a.id === selectedHarvestId) {
              return -1;
            }
            if (b.id === selectedHarvestId) {
              return 1;
            }
            return 0;
          });
        }

        setHarvests(processed);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [selectedHarvestId]);

  const handlePreOrder = (item, qty) => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to pre-order.');
      return;
    }
    setSelectedItemForPreOrder(item);
    setSelectedQtyForPreOrder(qty);
    setShowDetailsModal(true);
  };

  const confirmAndSubmitPreOrder = async () => {
    if (!customerName.trim() || !phone.trim()) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('orders.fillDetails', {
          defaultValue: 'தயவுசெய்து அனைத்து விவரங்களையும் நிரப்பவும்',
        }),
      );
      return;
    }

    const cleanAddress = address.trim();
    const userLoc = (user?.location || '').trim();
    if (
      !cleanAddress ||
      (userLoc && cleanAddress.toLowerCase() === userLoc.toLowerCase()) ||
      cleanAddress.length < 15
    ) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('checkout.fullAddressRequired', {
          defaultValue:
            'முழு முகவரியையும் உள்ளிடவும்! (தெரு பெயர், கதவு எண் போன்ற விவரங்களுடன்)',
        }),
      );
      return;
    }

    if (!pincode.trim() || pincode.trim().length < 6) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('checkout.pincodeRequired', {
          defaultValue: 'சரியான PIN கோடு நிரப்பவும் (6 இலக்கம்)',
        }),
      );
      return;
    }

    const item = selectedItemForPreOrder;
    const qty = selectedQtyForPreOrder;
    if (!item) {
      return;
    }

    setShowDetailsModal(false);

    const deliveryDetails = {
      deliveryName: customerName,
      deliveryPhone: phone,
      deliveryAddress: address,
      deliveryPincode: pincode,
      deliveryLocation: coords ? `${coords.latitude},${coords.longitude}` : '',
      preOrderDate: new Date().toISOString(),
    };

    const res = await createPreOrder(
      item.id,
      user.uid || user.id,
      user.name || customerName || 'User',
      qty,
      item.price * qty,
      deliveryDetails,
    );

    if (res.success) {
      // Send notification to Farmer
      if (item.farmerId) {
        const {createNotification} = require('../../services/firebase');
        await createNotification({
          userId: item.farmerId,
          title: t('notification.newPreOrderTitle', {
            defaultValue: 'புதிய முன் ஆர்டர்',
          }),
          message: `A new pre-order of ${qty} kg ${getLocalProductName(
            item.nameEn,
            item.name,
            i18n.language,
          )} has been placed by ${customerName}.`,
          emoji: '📅',
          bgColor: '#E3F2FD',
          type: 'new_preorder',
        });
      }

      // Send notification to Customer
      const {createNotification} = require('../../services/firebase');
      await createNotification({
        userId: user.uid || user.id,
        title: t('preOrder.successTitle', {
          defaultValue: '🎉 முன் ஆர்டர் வெற்றி!',
        }),
        message: t('preOrder.successDesc', {
          defaultValue:
            'உங்கள் முன் ஆர்டர் உறுதி செய்யப்பட்டது! விவசாயிக்கு தகவல் அனுப்பப்பட்டது.',
        }),
        emoji: '🎉',
        bgColor: '#E8F5E9',
        type: 'preorder_confirmed',
      });

      Alert.alert(
        t('preOrder.successTitle', {defaultValue: '🎉 முன் ஆர்டர் வெற்றி!'}),
        t('preOrder.successDesc', {
          defaultValue:
            'உங்கள் முன் ஆர்டர் உறுதி செய்யப்பட்டது! விவசாயிக்கு தகவல் அனுப்பப்பட்டது.',
        }),
      );
    } else {
      Alert.alert('Error', res.error);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: themeColors.bg}]}>
      <LinearGradient
        colors={['#0D5C32', '#1B8A4E', '#1565C0']}
        style={styles.headerRow}>
        <View style={styles.headerTop}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>📅</Text>
          <Text style={styles.headerTitle}>
            {t('preOrder.title', {defaultValue: 'முன் ஆர்டர்'})}
          </Text>
          <Text style={styles.headerDesc}>
            {t('preOrder.desc', {
              defaultValue:
                'விளைவதற்கு முன்பே ஆர்டர் பண்ணுங்கள்!\nஅதிக சேமிப்பு + புதிய உத்தரவாதம்!',
            })}
          </Text>
        </View>
      </LinearGradient>

      {/* Benefits bar */}
      <View style={styles.benefitsBar}>
        {[
          {
            emoji: '💰',
            label: t('preOrder.benefit1', {
              defaultValue: 'Up to 28%\nதள்ளுபடி',
            }),
          },
          {
            emoji: '🌿',
            label: t('preOrder.benefit2', {defaultValue: '100%\nபுதியது'}),
          },
          {
            emoji: '🚚',
            label: t('preOrder.benefit3', {defaultValue: 'நேரடி\nடெலிவரி'}),
          },
          {
            emoji: '✅',
            label: t('preOrder.benefit4', {
              defaultValue: 'Guaranteed\nQuality',
            }),
          },
        ].map((b, i) => (
          <View key={i} style={styles.benefitItem}>
            <Text style={styles.benefitEmoji}>{b.emoji}</Text>
            <Text style={styles.benefitLabel}>{b.label}</Text>
          </View>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{padding: SPACING.lg, paddingBottom: 100}}>
        {loading ? (
          <Text style={{textAlign: 'center', marginTop: 50}}>
            {t('common.loading', {defaultValue: 'Loading...'})}
          </Text>
        ) : harvests.length === 0 ? (
          <Text
            style={{
              textAlign: 'center',
              marginTop: 50,
              fontSize: 16,
              color: COLORS.textGray,
            }}>
            {t('preOrder.noPreOrders', {
              defaultValue: 'தற்போது எந்த முன் ஆர்டரும் இல்லை.',
            })}
          </Text>
        ) : (
          harvests.map(item => (
            <PreOrderCard
              key={item.id}
              item={item}
              onPreOrder={handlePreOrder}
              isHighlighted={item.id === selectedHarvestId}
            />
          ))
        )}
      </ScrollView>

      {/* Details Confirmation Modal */}
      <Modal
        visible={showDetailsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDetailsModal(false)}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border,
              },
            ]}>
            <Text style={[styles.modalTitle, {color: themeColors.text}]}>
              {t('preOrder.fillDetailsTitle', {
                defaultValue: '📋 Enter Delivery Details',
              })}
            </Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{width: '100%', maxHeight: 380}}>
              {/* Name */}
              <View style={styles.formField}>
                <Text style={[styles.formLabel, {color: themeColors.subText}]}>
                  {t('preOrder.deliveryName', {defaultValue: 'Name'})} *
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: themeColors.inputBg,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    },
                  ]}
                  value={customerName}
                  onChangeText={setCustomerName}
                  placeholder={t('checkout.namePlaceholder', {
                    defaultValue: 'Your Name',
                  })}
                  placeholderTextColor={
                    isDark ? 'rgba(255,255,255,0.4)' : COLORS.textGray
                  }
                />
              </View>

              {/* Phone */}
              <View style={styles.formField}>
                <Text style={[styles.formLabel, {color: themeColors.subText}]}>
                  {t('preOrder.deliveryPhone', {defaultValue: 'Phone Number'})}{' '}
                  *
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: themeColors.inputBg,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    },
                  ]}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  placeholder={t('checkout.phonePlaceholder', {
                    defaultValue: 'Phone Number',
                  })}
                  placeholderTextColor={
                    isDark ? 'rgba(255,255,255,0.4)' : COLORS.textGray
                  }
                />
              </View>

              {/* Address */}
              <View style={styles.formField}>
                <Text style={[styles.formLabel, {color: themeColors.subText}]}>
                  {t('preOrder.deliveryAddress', {
                    defaultValue: 'Delivery Address',
                  })}{' '}
                  *
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      height: 80,
                      textAlignVertical: 'top',
                      paddingTop: SPACING.md,
                      backgroundColor: themeColors.inputBg,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    },
                  ]}
                  value={address}
                  onChangeText={setAddress}
                  multiline={true}
                  placeholder={t('checkout.addressPlaceholder', {
                    defaultValue: 'Full Address',
                  })}
                  placeholderTextColor={
                    isDark ? 'rgba(255,255,255,0.4)' : COLORS.textGray
                  }
                />
              </View>

              {/* PIN Code */}
              <View style={styles.formField}>
                <Text style={[styles.formLabel, {color: themeColors.subText}]}>
                  {t('preOrder.deliveryPincode', {defaultValue: 'PIN Code'})} *
                </Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: themeColors.inputBg,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    },
                  ]}
                  value={pincode}
                  onChangeText={setPincode}
                  keyboardType="number-pad"
                  placeholder={t('checkout.pincodePlaceholder', {
                    defaultValue: 'Pincode',
                  })}
                  placeholderTextColor={
                    isDark ? 'rgba(255,255,255,0.4)' : COLORS.textGray
                  }
                />
              </View>

              {/* GPS coordinates */}
              <TouchableOpacity
                style={[
                  styles.locationBtn,
                  {
                    backgroundColor: coords ? '#E8F5E9' : themeColors.inputBg,
                    borderColor: coords
                      ? COLORS.primaryGreen
                      : themeColors.border,
                    borderWidth: 1,
                  },
                ]}
                onPress={handleLinkLocation}
                disabled={linkingLocation}>
                {linkingLocation ? (
                  <ActivityIndicator size="small" color={COLORS.primaryGreen} />
                ) : (
                  <Text
                    style={[
                      styles.locationBtnTxt,
                      {color: coords ? COLORS.primaryGreen : themeColors.text},
                    ]}>
                    {coords
                      ? t('preOrder.gpsLinked', {
                          defaultValue: 'Location Linked ✓',
                        })
                      : t('preOrder.linkGPSBtn', {
                          defaultValue: '📍 Link GPS Location',
                        })}
                  </Text>
                )}
              </TouchableOpacity>
              {coords && (
                <Text style={[styles.coordsText, {color: themeColors.subText}]}>
                  {coords.latitude.toFixed(6)}, {coords.longitude.toFixed(6)}
                </Text>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowDetailsModal(false)}>
                <Text style={styles.modalCancelBtnTxt}>
                  {t('orders.close', {defaultValue: 'மூடு'})}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={confirmAndSubmitPreOrder}>
                <Text style={styles.modalSubmitBtnTxt}>
                  {t('preOrder.confirmBtn', {defaultValue: 'Confirm'})}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
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

  benefitsBar: {
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    ...SHADOWS.small,
  },
  benefitItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  benefitEmoji: {fontSize: 24, marginBottom: 2},
  benefitLabel: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  imgWrap: {position: 'relative'},
  cardImg: {width: '100%', height: 200},
  topBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  topBadgeTxt: {
    color: COLORS.white,
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
  },
  savingsBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.accentGold,
    borderRadius: RADIUS.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  savingsTxt: {color: COLORS.white, fontSize: FONTS.sm, fontWeight: FONTS.bold},
  countdownBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  countdownTxt: {
    color: COLORS.white,
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
  },
  countdownSubTxt: {color: 'rgba(255,255,255,0.8)', fontSize: FONTS.xs},

  cardBody: {padding: SPACING.lg},
  itemName: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
  },
  itemNameEn: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
    flexWrap: 'wrap',
  },
  metaChip: {
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  metaChipTxt: {
    fontSize: FONTS.xs,
    color: COLORS.primaryGreen,
    fontWeight: FONTS.semiBold,
  },
  description: {
    fontSize: FONTS.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },

  progressSection: {marginBottom: SPACING.md},
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: {flex: 1, fontSize: FONTS.sm, color: COLORS.textSecondary},
  progressCount: {
    fontSize: FONTS.sm,
    fontWeight: FONTS.bold,
    color: COLORS.primaryGreen,
  },
  progressBg: {
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {height: '100%', borderRadius: RADIUS.full},
  almostText: {
    fontSize: FONTS.xs,
    color: COLORS.accentGold,
    fontWeight: FONTS.semiBold,
    marginTop: 4,
  },

  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  price: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.extraBold,
    color: COLORS.primaryGreen,
  },
  unit: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    fontWeight: FONTS.regular,
  },
  originalPrice: {
    fontSize: FONTS.xs,
    color: COLORS.textGray,
    textDecorationLine: 'line-through',
  },
  qtyRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.sm},
  qtyBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnPlus: {
    backgroundColor: COLORS.primaryGreen,
    borderColor: COLORS.primaryGreen,
  },
  qtyBtnTxt: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
  },
  qtyNum: {
    fontSize: FONTS.lg,
    fontWeight: FONTS.bold,
    color: COLORS.textPrimary,
    minWidth: 28,
    textAlign: 'center',
  },

  guaranteeBox: {
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  guaranteeTxt: {
    fontSize: FONTS.sm,
    color: COLORS.primaryGreen,
    fontWeight: FONTS.semiBold,
  },

  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {fontSize: FONTS.sm, color: COLORS.textMuted},
  totalValue: {
    fontSize: FONTS.xl,
    fontWeight: FONTS.extraBold,
    color: COLORS.primaryGreen,
  },
  preOrderBtn: {borderRadius: RADIUS.lg, overflow: 'hidden'},
  preOrderGrad: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.xl,
    alignItems: 'center',
  },
  preOrderTxt: {
    color: COLORS.white,
    fontSize: FONTS.md,
    fontWeight: FONTS.bold,
  },
  preOrderSubTxt: {color: 'rgba(255,255,255,0.8)', fontSize: FONTS.xs},
  highlightBadge: {
    backgroundColor: COLORS.primaryGreen,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightBadgeTxt: {
    color: COLORS.white,
    fontSize: FONTS.xs,
    fontWeight: FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardImgGrad: {
    width: '100%',
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImgEmoji: {
    fontSize: 72,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  formField: {
    marginBottom: SPACING.md,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  formInput: {
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg,
    height: 48,
    fontSize: 14,
    borderWidth: 1.5,
  },
  locationBtn: {
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.sm,
  },
  locationBtnTxt: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  coordsText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#FFEBEE',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  modalCancelBtnTxt: {
    color: '#FF5252',
    fontWeight: 'bold',
  },
  modalSubmitBtn: {
    flex: 1,
    backgroundColor: COLORS.primaryGreen,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  modalSubmitBtnTxt: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
});

export default PreOrderScreen;
