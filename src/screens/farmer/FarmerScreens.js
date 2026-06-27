// src/screens/farmer/FarmerScreens.js - Full i18n ✅
import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  Dimensions,
  ActivityIndicator,
  Linking,
  PermissionsAndroid,
  Platform,
  Modal,
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
import Geolocation from '@react-native-community/geolocation';
import BackButton from '../../utils/BackButton';
import {getLocalProductName} from '../../utils/translationHelper';
import {CATEGORIES} from '../../utils/dummyData';
import {getCatName} from '../../utils/categoryHelper';

const {width} = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

const AvatarView = ({uri, name, size = 60, style}) => {
  const [err, setErr] = useState(false);
  const letter = (name || 'F').charAt(0).toUpperCase();
  const bg = ['#1B8A4E', '#1565C0', '#E65100', '#6A1B9A'][
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

// FormField outside component - no re-render/focus bug
const FormField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboard = 'default',
  multiline = false,
}) => {
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  return (
    <View style={S.fieldWrap}>
      <Text style={[S.fieldLabel, {color: themeColors.text}]}>{label}</Text>
      <TextInput
        style={[
          S.fieldInput,
          {
            backgroundColor: themeColors.inputBg,
            borderColor: themeColors.border,
            color: themeColors.text,
          },
          multiline && {
            height: rs(80),
            textAlignVertical: 'top',
            paddingTop: 10,
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
        multiline={multiline}
      />
    </View>
  );
};

// ── FARMER DASHBOARD ──
export const FarmerDashboardScreen = ({navigation}) => {
  const {t, i18n} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const {user} = useAuth();
  const [stats, setStats] = useState({
    totalSales: 0,
    thisMonthRevenue: 0,
    totalOrders: 0,
    totalProducts: 0,
  });
  const [myProducts, setMyProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const farmerId = user?.id || user?.uid;
    if (!farmerId) {
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const {
          getFarmerStats,
          getFarmerProducts,
        } = require('../../services/firebase');
        const [sr, pr] = await Promise.all([
          getFarmerStats(farmerId),
          getFarmerProducts(farmerId),
        ]);
        if (sr.success) {
          setStats(sr.data);
        }
        if (pr.success) {
          setMyProducts(pr.data);
        }
      } catch (e) {
        console.log('dashboard error:', e);
      }
      setIsLoading(false);
    })();
  }, [user]);

  const statCards = [
    {
      label: t('farmer.totalSales', {defaultValue: 'மொத்த விற்பனை'}),
      val: `₹${stats.totalSales.toLocaleString()}`,
      icon: '💰',
      color: '#4CAF50',
    },
    {
      label: t('farmer.thisMonth', {defaultValue: 'இந்த மாதம்'}),
      val: `₹${stats.thisMonthRevenue.toLocaleString()}`,
      icon: '📈',
      color: '#2196F3',
    },
    {
      label: t('nav.orders', {defaultValue: 'ஆர்டர்கள்'}),
      val: `${stats.totalOrders}`,
      icon: '📦',
      color: '#FF9800',
    },
    {
      label: t('nav.products', {defaultValue: 'தயாரிப்புகள்'}),
      val: `${myProducts.length}`,
      icon: '🥬',
      color: '#9C27B0',
    },
  ];

  return (
    <View style={[S.container, {backgroundColor: themeColors.bg}]}>
      <LinearGradient
        colors={['#0D5C32', '#1B8A4E', '#1565C0']}
        style={S.dashHeader}>
        <View style={S.dashHeaderTop}>
          <View style={{flex: 1}}>
            <Text style={S.dashGreeting}>
              {t('home.greeting', {defaultValue: 'வணக்கம்! 👨‍🌾'})}
            </Text>
            <Text style={S.dashName} numberOfLines={1}>
              {user?.name || t('farmer.farmer', {defaultValue: 'விவசாயி'})}
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: SPACING.sm,
            }}>
            <TouchableOpacity
              style={S.notifBtn}
              onPress={() => navigation.navigate('Notifications')}>
              <Text style={{fontSize: rs(24)}}>🔔</Text>
            </TouchableOpacity>
            <AvatarView
              uri={user?.avatar}
              name={user?.name}
              size={rs(56)}
              style={{borderWidth: 2, borderColor: COLORS.white}}
            />
          </View>
        </View>
        <Text style={S.farmName}>
          {user?.farmName || t('farmer.myFarm', {defaultValue: 'என் பண்ணை'})}
        </Text>
      </LinearGradient>
      <ScrollView showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <ActivityIndicator
            color={COLORS.primaryGreen}
            size="large"
            style={{marginTop: 40}}
          />
        ) : (
          <View style={S.statsGrid}>
            {statCards.map((stat, i) => (
              <View
                key={i}
                style={[
                  S.statCard,
                  {
                    borderTopColor: stat.color,
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.border,
                    borderWidth: 1,
                  },
                ]}>
                <Text style={S.statEmoji}>{stat.icon}</Text>
                <Text style={[S.statVal, {color: stat.color}]}>{stat.val}</Text>
                <Text style={[S.statLbl, {color: themeColors.subText}]}>
                  {stat.label}
                </Text>
              </View>
            ))}
          </View>
        )}
        <View style={S.section}>
          <Text style={[S.sTitle, {color: themeColors.text}]}>
            ⚡ {t('farmer.quickActions', {defaultValue: 'விரைவு செயல்கள்'})}
          </Text>
          <View style={S.qaGrid}>
            {[
              {
                icon: '➕',
                label: t('farmer.addProduct', {defaultValue: 'தயாரிப்பு சேர்'}),
                screen: 'AddProduct',
              },
              {
                icon: '📷',
                label: t('farmer.qrCode', {defaultValue: 'QR குறியீடு'}),
                screen: 'FarmerQR',
              },
              {
                icon: '📅',
                label: t('farmer.addHarvest', {defaultValue: 'அறுவடை சேர்'}),
                screen: 'FarmerAddHarvest',
              },
              {
                icon: '💬',
                label: t('farmer.customerChats', {
                  defaultValue: 'வாடிக்கையாளர் அரட்டை',
                }),
                screen: 'FarmerCustomerChats',
              },
              {
                icon: '🎬',
                label: t('farmer.myStory', {defaultValue: 'என் கதை'}),
                screen: 'StoryVideo',
              },
              {
                icon: '⚙️',
                label: t('profile.settings', {defaultValue: 'அமைப்புகள்'}),
                screen: 'Settings',
              },
            ].map((qa, i) => (
              <TouchableOpacity
                key={i}
                style={S.qaCard}
                onPress={() => navigation.navigate(qa.screen)}>
                <LinearGradient
                  colors={
                    isDark ? ['#1A3028', '#152A20'] : ['#E8F5E9', '#E3F2FD']
                  }
                  style={S.qaGrad}>
                  <Text style={S.qaIcon}>{qa.icon}</Text>
                  <Text style={[S.qaLabel, {color: themeColors.text}]}>
                    {qa.label}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={S.section}>
          <View style={S.sectionHeader}>
            <Text style={[S.sTitle, {color: themeColors.text}]}>
              🥬 {t('farmer.myProducts', {defaultValue: 'என் தயாரிப்புகள்'})}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('MyProducts')}>
              <Text style={S.seeAll}>
                {t('home.viewAll', {defaultValue: 'அனைத்தும் →'})}
              </Text>
            </TouchableOpacity>
          </View>
          {myProducts.length === 0 && !isLoading ? (
            <TouchableOpacity
              style={[
                S.emptyAddBtn,
                {
                  backgroundColor: COLORS.primaryGreen,
                  borderWidth: 0,
                },
              ]}
              onPress={() => navigation.navigate('AddProduct')}>
              <Text style={S.emptyAddTxt}>
                ➕{' '}
                {t('farmer.addProduct', {
                  defaultValue: 'தயாரிப்பு சேர்',
                })}{' '}
                🌱
              </Text>
            </TouchableOpacity>
          ) : (
            myProducts.slice(0, 3).map(p => (
              <View
                key={p.id}
                style={[
                  S.prodRow,
                  {
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.border,
                    borderWidth: 1,
                  },
                ]}>
                <FastImage
                  source={{uri: p.image}}
                  style={S.prodRowImg}
                  resizeMode={FastImage.resizeMode.cover}
                />
                <View style={S.prodRowInfo}>
                  <Text
                    style={[S.prodRowName, {color: themeColors.text}]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {getLocalProductName(p.name, p.nameTa, i18n.language)}
                  </Text>
                  <Text style={S.prodRowPrice}>
                    ₹{p.price}/{p.unit}
                  </Text>
                </View>
                <View
                  style={[
                    S.stockBadge,
                    {backgroundColor: isDark ? '#1E3A2F' : '#E8F5E9'},
                  ]}>
                  <Text style={S.stockText}>
                    {p.stock} {t('farmer.available', {defaultValue: 'உள்ளது'})}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>
        <View style={{height: 90}} />
      </ScrollView>
    </View>
  );
};

// ── MY PRODUCTS ──
export const MyProductsScreen = ({navigation}) => {
  const {t, i18n} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const {user} = useAuth();
  const [myProducts, setMyProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    const farmerId = user?.id || user?.uid;
    if (!farmerId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const {getFarmerProducts} = require('../../services/firebase');
      const r = await getFarmerProducts(farmerId);
      setMyProducts(r.success ? r.data : []);
    } catch (e) {
      setMyProducts([]);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = id => {
    Alert.alert(t('farmer.deleteProduct', {defaultValue: 'நீக்கவா?'}), '', [
      {text: t('common.cancel', {defaultValue: 'இல்லை'}), style: 'cancel'},
      {
        text: t('farmer.delete', {defaultValue: 'நீக்கு'}),
        style: 'destructive',
        onPress: async () => {
          const {deleteProduct} = require('../../services/firebase');
          const r = await deleteProduct(id);
          if (r.success) {
            setMyProducts(prev => prev.filter(p => p.id !== id));
          }
        },
      },
    ]);
  };

  return (
    <View style={[S.container, {backgroundColor: themeColors.bg}]}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={S.headerRow}>
        <Text style={S.headerTitle}>
          🥬 {t('farmer.myProducts', {defaultValue: 'என் தயாரிப்புகள்'})}
        </Text>
        <TouchableOpacity
          style={S.addBtn}
          onPress={() => navigation.navigate('AddProduct')}>
          <Text style={S.addBtnTxt}>
            + {t('farmer.add', {defaultValue: 'சேர்'})}
          </Text>
        </TouchableOpacity>
      </LinearGradient>
      {isLoading ? (
        <ActivityIndicator
          color={COLORS.primaryGreen}
          size="large"
          style={{marginTop: 40}}
        />
      ) : (
        <FlatList
          data={myProducts}
          keyExtractor={item => item.id}
          contentContainerStyle={{padding: SPACING.lg}}
          onRefresh={load}
          refreshing={isLoading}
          renderItem={({item}) => (
            <View
              style={[
                S.mpCard,
                {
                  backgroundColor: themeColors.cardBg,
                  borderColor: themeColors.border,
                  borderWidth: 1,
                },
              ]}>
              <FastImage
                source={{uri: item.image}}
                style={S.mpImg}
                resizeMode={FastImage.resizeMode.cover}
              />
              <View style={S.mpInfo}>
                <Text
                  style={[S.mpName, {color: themeColors.text}]}
                  numberOfLines={1}
                  ellipsizeMode="tail">
                  {getLocalProductName(item.name, item.nameTa, i18n.language)}
                </Text>
                <Text style={S.mpPrice}>
                  ₹{item.price}/{item.unit}
                </Text>
                <Text style={[S.mpStock, {color: themeColors.subText}]}>
                  {t('farmer.stock', {defaultValue: 'கையிருப்பு'})}:{' '}
                  {item.stock}
                </Text>
              </View>
              <View style={S.mpActions}>
                <TouchableOpacity
                  style={S.editBtn}
                  onPress={() =>
                    navigation.navigate('EditProduct', {product: item})
                  }>
                  <Text style={S.editBtnTxt}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={S.delBtn}
                  onPress={() => handleDelete(item.id)}>
                  <Text style={S.delBtnTxt}>🗑</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View style={S.emptyBox}>
              <Text style={S.MP_emptyEmoji || S.emptyEmoji}>🥬</Text>
              <Text style={[S.emptyText, {color: themeColors.textMuted}]}>
                {t('farmer.noProducts', {defaultValue: 'தயாரிப்புகள் இல்லை'})}
              </Text>
              <TouchableOpacity
                style={[
                  S.emptyAddBtn,
                  {
                    backgroundColor: COLORS.primaryGreen,
                    borderWidth: 0,
                  },
                ]}
                onPress={() => navigation.navigate('AddProduct')}>
                <Text style={S.emptyAddTxt}>
                  ➕{' '}
                  {t('farmer.addProduct', {
                    defaultValue: 'தயாரிப்பு சேர்',
                  })}{' '}
                  🌱
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
      <View style={{height: 80}} />
    </View>
  );
};

// ── ADD PRODUCT ──
export const AddProductScreen = ({navigation}) => {
  const {t, i18n} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const {user} = useAuth();
  const [name, setName] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('kg');
  const [category, setCategory] = useState('vegetables');
  const [freshHours, setFreshHours] = useState('24'); // Default 24 hours
  const [shelfLife, setShelfLife] = useState('6'); // Default 6 months
  const [material, setMaterial] = useState('');
  const [craftingTime, setCraftingTime] = useState('1'); // Default 1 day
  const [descriptionTa, setDescriptionTa] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const imageUrlRef = useRef('');

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locStatus, setLocStatus] = useState('fetching'); // fetching, success, error

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
          Geolocation.getCurrentPosition(
            position => {
              setLatitude(position.coords.latitude);
              setLongitude(position.coords.longitude);
              setLocStatus('success');
            },
            error => {
              setLocStatus('error');
              console.log('Location error:', error);
            },
            {enableHighAccuracy: true, timeout: 15000, maximumAge: 0},
          );
        } else {
          setLocStatus('error');
        }
      } else {
        Geolocation.getCurrentPosition(
          position => {
            setLatitude(position.coords.latitude);
            setLongitude(position.coords.longitude);
            setLocStatus('success');
          },
          error => {
            setLocStatus('error');
          },
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 0},
        );
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

  const units = ['kg', 'g', 'piece', 'dozen', 'bunch', 'litre'];
  const categories = [
    'vegetables',
    'fruits',
    'grains',
    'millets',
    'greens',
    'dairy',
    'herbs',
    'organic',
    'nuts',
    'handicrafts',
  ];

  const handleImagePick = async () => {
    try {
      const {launchImageLibrary} = require('react-native-image-picker');
      const {
        uploadImageToCloudinary,
      } = require('../../services/cloudinaryServices');
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800,
      });
      if (result.didCancel || !result.assets?.[0]) {
        return;
      }
      const uri = result.assets[0].uri;
      setImageUri(uri);
      imageUrlRef.current = '';
      setIsUploading(true);
      const up = await uploadImageToCloudinary(uri, 'products');
      setIsUploading(false);
      if (up.success) {
        imageUrlRef.current = up.url;
        setImageUri(uri + '?uploaded=1');
        Alert.alert(
          '✅',
          t('farmer.photoUploaded', {
            defaultValue: 'புகைப்படம் பதிவேற்றம் செய்யப்பட்டது!',
          }),
        );
      } else {
        setImageUri(null);
        imageUrlRef.current = '';
        Alert.alert(
          t('common.error', {defaultValue: 'பிழை'}),
          t('farmer.uploadFailed', {defaultValue: 'Upload failed'}),
        );
      }
    } catch (e) {
      setIsUploading(false);
    }
  };

  const handleAdd = async () => {
    if (!name.trim() || !price.trim() || !stock.trim()) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('farmer.fillAll', {
          defaultValue: 'பெயர், விலை, கையிருப்பு அனைத்தும் நிரப்பவும்',
        }),
      );
      return;
    }

    const isPerishable = [
      'vegetables',
      'fruits',
      'greens',
      'dairy',
      'herbs',
      'organic',
    ].includes(category);
    const isNonPerishable = ['grains', 'millets', 'nuts'].includes(category);
    const isHandicraft = category === 'handicrafts';

    if (isPerishable && !freshHours.trim()) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('farmer.fillFreshHours', {
          defaultValue: 'புத்துணர்வு நேரத்தை உள்ளிடவும்',
        }),
      );
      return;
    }

    if (isNonPerishable && !shelfLife.trim()) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('farmer.fillShelfLife', {
          defaultValue: 'பாதுகாப்பு காலத்தை உள்ளிடவும்',
        }),
      );
      return;
    }

    if (isHandicraft) {
      if (!material.trim()) {
        Alert.alert(
          t('common.error', {defaultValue: 'பிழை'}),
          t('farmer.fillMaterial', {
            defaultValue: 'பயன்படுத்தப்பட்ட பொருளின் பெயரை உள்ளிடவும்!',
          }),
        );
        return;
      }
      if (!craftingTime.trim()) {
        Alert.alert(
          t('common.error', {defaultValue: 'பிழை'}),
          t('farmer.fillCraftingTime', {
            defaultValue: 'தயாரிப்பு காலத்தை உள்ளிடவும்',
          }),
        );
        return;
      }
    }

    if (!imageUrlRef.current) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('farmer.addPhoto', {
          defaultValue: 'தயாரிப்பு புகைப்படம் சேர்க்கவும்!',
        }),
      );
      return;
    }
    setIsSaving(true);
    try {
      const {addProduct} = require('../../services/firebase');

      const productPayload = {
        name: name.trim(),
        nameTa: nameTa.trim() || name.trim(),
        price: parseFloat(price),
        unit,
        stock: parseInt(stock, 10),
        category,
        descriptionTa: descriptionTa.trim(),
        description: descriptionTa.trim(),
        image: imageUrlRef.current,
        images: [imageUrlRef.current],
        farmerId: user?.id || user?.uid || '',
        farmerName: user?.name || '',
        farmerNameTa: user?.name || '',
        location: user?.location || '',
        coordinates:
          latitude && longitude ? {lat: latitude, lng: longitude} : null,
        isOrganic: category === 'organic',
        isFeatured: false,
        rating: 0,
        reviews: 0,
        originalPrice: parseFloat(price),
      };

      if (isPerishable) {
        productPayload.freshHours = parseInt(freshHours, 10) || 24;
        productPayload.harvestTime = new Date().toISOString();
      } else if (isNonPerishable) {
        productPayload.shelfLife = parseInt(shelfLife, 10) || 6;
        productPayload.harvestTime = null;
      } else if (isHandicraft) {
        productPayload.material = material.trim();
        productPayload.craftingTime = parseInt(craftingTime, 10) || 1;
        productPayload.harvestTime = null;
      }

      const r = await addProduct(productPayload);
      setIsSaving(false);
      if (r.success) {
        Alert.alert(
          '✅',
          t('farmer.productAdded', {
            defaultValue: 'தயாரிப்பு சேர்க்கப்பட்டது!',
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
          r.error || 'Save failed',
        );
      }
    } catch (e) {
      setIsSaving(false);
      Alert.alert(t('common.error', {defaultValue: 'பிழை'}), e.message);
    }
  };

  const isUploaded = imageUri && imageUrlRef.current;

  return (
    <View style={[S.container, {backgroundColor: themeColors.bg}]}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={S.headerRow}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={S.headerTitle}>
          ➕ {t('farmer.addProduct', {defaultValue: 'தயாரிப்பு சேர்'})}
        </Text>
        <View style={{width: 40}} />
      </LinearGradient>
      <ScrollView
        contentContainerStyle={{padding: SPACING.lg}}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <TouchableOpacity
          style={[
            S.imgUpload,
            {
              backgroundColor: themeColors.cardBg,
              borderColor: themeColors.border,
            },
            imageUri && S.imgUploadFilled,
          ]}
          onPress={handleImagePick}
          disabled={isUploading}>
          {isUploading ? (
            <View style={{alignItems: 'center', paddingVertical: 20}}>
              <ActivityIndicator color={COLORS.primaryGreen} size="large" />
              <Text style={{color: themeColors.textMuted, marginTop: 8}}>
                {t('farmer.uploading', {defaultValue: 'Uploading...'})}
              </Text>
            </View>
          ) : imageUri ? (
            <View style={{alignItems: 'center', width: '100%'}}>
              <FastImage
                source={{uri: imageUri.replace('?uploaded=1', '')}}
                style={S.previewImage}
                resizeMode={FastImage.resizeMode.cover}
              />
              {isUploaded && (
                <View style={S.uploadBadge}>
                  <Text style={S.uploadBadgeTxt}>
                    ✅ {t('farmer.uploaded', {defaultValue: 'Uploaded!'})}
                  </Text>
                </View>
              )}
              <Text
                style={{
                  fontSize: rs(FONTS.xs),
                  color: themeColors.textMuted,
                  marginTop: 4,
                }}>
                {t('farmer.tapToChange', {defaultValue: 'Tap to change photo'})}
              </Text>
            </View>
          ) : (
            <>
              <Text style={S.imgUploadEmoji}>📷</Text>
              <Text style={[S.imgUploadTxt, {color: themeColors.text}]}>
                {t('farmer.addPhotoLabel', {defaultValue: 'படம் சேர்க்கவும்'})}
              </Text>
              <Text style={[S.imgUploadSub, {color: themeColors.textMuted}]}>
                {t('farmer.cameraOrGallery', {
                  defaultValue: 'கேமரா அல்லது கேலரி',
                })}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <FormField
          label={`📦 ${t('farmer.productNameEn', {
            defaultValue: 'Product Name (English)',
          })}`}
          value={name}
          onChangeText={setName}
        />
        <FormField
          label={`📦 ${t('farmer.productNameTa', {
            defaultValue: 'தயாரிப்பு பெயர் (தமிழ்)',
          })}`}
          value={nameTa}
          onChangeText={setNameTa}
        />
        <FormField
          label={`💰 ${t('farmer.price', {defaultValue: 'விலை (₹)'})}`}
          value={price}
          onChangeText={setPrice}
          keyboard="numeric"
        />
        <FormField
          label={`📦 ${t('farmer.stockQty', {defaultValue: 'Stock Quantity'})}`}
          value={stock}
          onChangeText={setStock}
          keyboard="numeric"
        />
        {[
          'vegetables',
          'fruits',
          'greens',
          'dairy',
          'herbs',
          'organic',
        ].includes(category) && (
          <FormField
            label={`⏱️ ${t('farmer.freshHours', {
              defaultValue: 'Freshness Time (Hours)',
            })}`}
            value={freshHours}
            onChangeText={setFreshHours}
            keyboard="numeric"
            placeholder={t('farmer.freshHoursPlaceholder', {
              defaultValue: 'Enter freshness time in hours',
            })}
          />
        )}

        {['grains', 'millets', 'nuts'].includes(category) && (
          <FormField
            label={`📦 ${t('farmer.shelfLife', {
              defaultValue: 'Shelf Life (Months)',
            })}`}
            value={shelfLife}
            onChangeText={setShelfLife}
            keyboard="numeric"
            placeholder={t('farmer.shelfLifePlaceholder', {
              defaultValue: 'Enter shelf life in months (e.g. 6)',
            })}
          />
        )}

        {category === 'handicrafts' && (
          <>
            <FormField
              label={`🧶 ${t('farmer.material', {
                defaultValue: 'Material Used',
              })}`}
              value={material}
              onChangeText={setMaterial}
              placeholder={t('farmer.materialPlaceholder', {
                defaultValue: '',
              })}
            />
            <FormField
              label={`⏳ ${t('farmer.craftingTime', {
                defaultValue: 'Crafting Time (Days)',
              })}`}
              value={craftingTime}
              onChangeText={setCraftingTime}
              keyboard="numeric"
              placeholder={t('farmer.craftingTimePlaceholder', {
                defaultValue: 'Enter crafting time in days (e.g. 3)',
              })}
            />
          </>
        )}

        <Text style={[S.fieldLabel, {color: themeColors.text}]}>
          ⚖️ {t('farmer.unit', {defaultValue: 'அளவு வகை'})}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{marginBottom: SPACING.lg}}>
          {units.map(u => (
            <TouchableOpacity
              key={u}
              style={[
                S.chip,
                {
                  backgroundColor: themeColors.cardBg,
                  borderColor: themeColors.border,
                },
                unit === u && S.chipActive,
              ]}
              onPress={() => setUnit(u)}>
              <Text
                style={[
                  S.chipTxt,
                  {color: themeColors.text},
                  unit === u && S.chipTxtActive,
                ]}>
                {u}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={[S.fieldLabel, {color: themeColors.text}]}>
          📂 {t('farmer.category', {defaultValue: 'வகை'})}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{marginBottom: SPACING.xl}}>
          {categories.map(c => {
            const catObj = CATEGORIES.find(cat => cat.id === c);
            const displayName = catObj ? getCatName(catObj, i18n.language) : c;
            return (
              <TouchableOpacity
                key={c}
                style={[
                  S.chip,
                  {
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.border,
                  },
                  category === c && S.chipActive,
                ]}
                onPress={() => setCategory(c)}>
                <Text
                  style={[
                    S.chipTxt,
                    {color: themeColors.text},
                    category === c && S.chipTxtActive,
                  ]}>
                  {displayName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          onPress={fetchLocation}
          style={{
            marginBottom: SPACING.xl,
            padding: SPACING.md,
            backgroundColor: isDark ? 'rgba(46, 125, 50, 0.2)' : '#E8F5E9',
            borderRadius: RADIUS.md,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          <Text style={{fontSize: 24, marginRight: 10}}>📍</Text>
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

        <TouchableOpacity
          style={S.submitBtn}
          onPress={handleAdd}
          disabled={isSaving || isUploading}>
          <LinearGradient
            colors={isSaving ? ['#9E9E9E', '#757575'] : COLORS.gradientButton}
            style={S.submitGrad}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}>
            <Text style={S.submitTxt}>
              {isSaving
                ? `⏳ ${t('farmer.saving', {defaultValue: 'சேமிக்கிறோம்...'})}`
                : `✅ ${t('farmer.addProduct', {
                    defaultValue: 'தயாரிப்பு சேர்க்கவும்',
                  })}`}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
        <View style={{height: 40}} />
      </ScrollView>
    </View>
  );
};

// ── EDIT PRODUCT ──
export const EditProductScreen = ({route, navigation}) => {
  const {t, i18n} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const {product} = route.params;
  const [price, setPrice] = useState(`${product.price}`);
  const [stock, setStock] = useState(`${product.stock}`);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);

    // Fetch fresh coordinates before saving to confirm live location
    const loc = await new Promise(resolve => {
      try {
        if (Platform.OS === 'android') {
          PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          )
            .then(granted => {
              if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                Geolocation.getCurrentPosition(
                  pos =>
                    resolve({
                      lat: pos.coords.latitude,
                      lng: pos.coords.longitude,
                    }),
                  () => resolve(null),
                  {enableHighAccuracy: true, timeout: 15000, maximumAge: 0},
                );
              } else {
                resolve(null);
              }
            })
            .catch(() => resolve(null));
        } else {
          Geolocation.getCurrentPosition(
            pos =>
              resolve({lat: pos.coords.latitude, lng: pos.coords.longitude}),
            () => resolve(null),
            {enableHighAccuracy: true, timeout: 15000, maximumAge: 0},
          );
        }
      } catch (e) {
        resolve(null);
      }
    });

    if (!loc) {
      Alert.alert(
        t('common.error', {defaultValue: 'பிழை'}),
        t('farmer.locationError', {
          defaultValue: 'இருப்பிடத்தை பெற முடியவில்லை. GPS ஆன் செய்யவும்.',
        }),
      );
      setIsSaving(false);
      return;
    }

    try {
      const {updateProduct} = require('../../services/firebase');
      const r = await updateProduct(product.id, {
        price: parseFloat(price),
        stock: parseInt(stock, 10),
        coordinates: loc,
      });
      setIsSaving(false);
      if (r.success) {
        Alert.alert(
          '✅',
          t('farmer.changesSaved', {
            defaultValue: 'மாற்றங்கள் சேமிக்கப்பட்டன!',
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
    } catch (e) {
      setIsSaving(false);
      Alert.alert(t('common.error', {defaultValue: 'பிழை'}), e.message);
    }
  };

  return (
    <View style={[S.container, {backgroundColor: themeColors.bg}]}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={S.headerRow}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={S.headerTitle}>
          ✏️ {t('farmer.editProduct', {defaultValue: 'தயாரிப்பு திருத்து'})}
        </Text>
        <View style={{width: 40}} />
      </LinearGradient>
      <ScrollView
        contentContainerStyle={{padding: SPACING.lg}}
        keyboardShouldPersistTaps="handled">
        <FastImage
          source={{uri: product.image}}
          style={S.editImg}
          resizeMode={FastImage.resizeMode.cover}
        />
        <Text style={[S.editProdName, {color: themeColors.text}]}>
          {getLocalProductName(product.name, product.nameTa, i18n.language)}
        </Text>
        <FormField
          label={`💰 ${t('farmer.price', {defaultValue: 'விலை (₹)'})}`}
          value={price}
          onChangeText={setPrice}
          keyboard="numeric"
        />
        <FormField
          label={`📦 ${t('farmer.stock', {defaultValue: 'கையிருப்பு'})}`}
          value={stock}
          onChangeText={setStock}
          keyboard="numeric"
        />
        <TouchableOpacity
          style={S.submitBtn}
          onPress={handleSave}
          disabled={isSaving}>
          <LinearGradient colors={COLORS.gradientButton} style={S.submitGrad}>
            <Text style={S.submitTxt}>
              {isSaving
                ? '⏳...'
                : '💾 ' + t('common.save', {defaultValue: 'சேமிக்கவும்'})}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ── FARMER ORDERS ──
export const FarmerOrdersScreen = ({navigation}) => {
  const {t} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const {user} = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const farmerId = user?.id || user?.uid;
    if (!farmerId) {
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const {getFarmerOrders} = require('../../services/firebase');
        const r = await getFarmerOrders(farmerId);
        setOrders(r.success ? r.data : []);
      } catch (e) {
        setOrders([]);
      }
      setIsLoading(false);
    })();
  }, [user]);

  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingOrderId, setRejectingOrderId] = useState(null);

  const handleUpdateStatus = async (orderId, newStatus, extraFields = {}) => {
    try {
      const {updateOrderStatus} = require('../../services/firebase');
      const r = await updateOrderStatus(orderId, newStatus, extraFields);
      if (r.success) {
        setOrders(prev =>
          prev.map(o =>
            o.id === orderId ? {...o, status: newStatus, ...extraFields} : o,
          ),
        );
        Alert.alert('✅', `Status: ${newStatus}`);
      }
    } catch (e) {
      Alert.alert(t('common.error', {defaultValue: 'பிழை'}), e.message);
    }
  };

  const handleRejectOrder = reason => {
    if (rejectingOrderId) {
      handleUpdateStatus(rejectingOrderId, 'Cancelled', {rejectReason: reason});
      setRejectModalVisible(false);
      setRejectingOrderId(null);
    }
  };

  return (
    <View style={[S.container, {backgroundColor: themeColors.bg}]}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={S.headerRow}>
        <Text style={S.headerTitle}>
          📦 {t('farmer.receivedOrders', {defaultValue: 'வந்த ஆர்டர்கள்'})}
        </Text>
      </LinearGradient>
      {isLoading ? (
        <ActivityIndicator
          color={COLORS.primaryGreen}
          size="large"
          style={{marginTop: 40}}
        />
      ) : (
        <ScrollView contentContainerStyle={{padding: SPACING.lg}}>
          {orders.length === 0 ? (
            <View style={S.emptyBox}>
              <Text style={S.emptyEmoji}>📦</Text>
              <Text style={[S.emptyText, {color: themeColors.textMuted}]}>
                {t('orders.noOrders', {
                  defaultValue: 'இன்னும் தயாரிப்புகள் இல்லை',
                })}
              </Text>
            </View>
          ) : (
            orders.map(order => (
              <View
                key={order.id}
                style={[
                  S.foCard,
                  {
                    backgroundColor: themeColors.cardBg,
                    borderColor: themeColors.border,
                    borderWidth: 1,
                  },
                ]}>
                <View style={S.foTop}>
                  <Text style={[S.foId, {color: themeColors.text}]}>
                    {t('orders.order', {defaultValue: 'ஆர்டர்'})} #
                    {order.orderId || order.id?.slice(-4)}
                  </Text>
                  <Text style={[S.foDate, {color: themeColors.subText}]}>
                    {order.createdAt?.toDate?.()?.toLocaleDateString('ta-IN') ||
                      ''}
                  </Text>
                </View>
                {(order.items || []).map((item, i) => (
                  <Text
                    key={i}
                    style={[S.foItem, {color: themeColors.subText}]}>
                    • {item.nameTa || item.name} x{item.quantity} — ₹
                    {(item.price || 0) * item.quantity}
                  </Text>
                ))}
                <View style={S.foBottom}>
                  <Text
                    style={[
                      S.foTotal,
                      {
                        color: isDark
                          ? COLORS.primaryGreen
                          : COLORS.primaryGreenDark || COLORS.primaryGreen,
                      },
                    ]}>
                    {t('orders.total', {defaultValue: 'மொத்தம்'})}: ₹
                    {order.total}
                  </Text>
                  <View
                    style={[
                      S.foStatus,
                      {
                        backgroundColor:
                          order.status === 'Delivered'
                            ? isDark
                              ? '#1E3A24'
                              : '#E8F5E9'
                            : order.status === 'Shipped'
                            ? isDark
                              ? '#1A334B'
                              : '#E3F2FD'
                            : isDark
                            ? '#4A3B12'
                            : '#FFF9C4',
                      },
                    ]}>
                    <Text
                      style={[
                        S.foStatusTxt,
                        {
                          color:
                            order.status === 'Delivered'
                              ? '#4CAF50'
                              : order.status === 'Shipped'
                              ? '#2196F3'
                              : '#FFC107',
                        },
                      ]}>
                      {t('orders.status' + order.status, {
                        defaultValue: order.status,
                      })}
                    </Text>
                  </View>
                </View>
                {/* Farmer actions & status indicators */}
                {order.status === 'Pending' && (
                  <View style={{flexDirection: 'row', gap: 8, marginTop: 8}}>
                    <TouchableOpacity
                      style={[
                        S.statusBtn,
                        {backgroundColor: isDark ? '#1E3A24' : '#E8F5E9'},
                      ]}
                      onPress={() => handleUpdateStatus(order.id, 'Confirmed')}>
                      <Text
                        style={{
                          color: '#4CAF50',
                          fontSize: rs(FONTS.xs),
                          fontWeight: 'bold',
                        }}>
                        ✅ {t('farmer.accept', {defaultValue: 'Accept'})}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        S.statusBtn,
                        {backgroundColor: isDark ? '#3D1B1E' : '#FFEBEE'},
                      ]}
                      onPress={() => {
                        setRejectingOrderId(order.id);
                        setRejectModalVisible(true);
                      }}>
                      <Text
                        style={{
                          color: '#FF5252',
                          fontSize: rs(FONTS.xs),
                          fontWeight: 'bold',
                        }}>
                        ❌ {t('farmer.reject', {defaultValue: 'Reject'})}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
                {order.status === 'Confirmed' && (
                  <View
                    style={[
                      S.statusBtn,
                      {
                        backgroundColor: isDark ? '#4A2A0A' : '#FFF3E0',
                        marginTop: 8,
                      },
                    ]}>
                    <Text
                      style={{
                        color: '#FF9800',
                        fontSize: rs(FONTS.xs),
                        fontWeight: '600',
                      }}>
                      ⏳{' '}
                      {t('farmer.waitingPickup', {
                        defaultValue: 'Waiting for pickup',
                      })}
                    </Text>
                  </View>
                )}
                {order.status === 'Shipped' && (
                  <View
                    style={[
                      S.statusBtn,
                      {
                        backgroundColor: isDark ? '#1A334B' : '#E3F2FD',
                        marginTop: 8,
                      },
                    ]}>
                    <Text
                      style={{
                        color: '#2196F3',
                        fontSize: rs(FONTS.xs),
                        fontWeight: '600',
                      }}>
                      📦{' '}
                      {t('farmer.itemPurchased', {
                        defaultValue: 'Item has been purchased',
                      })}
                    </Text>
                  </View>
                )}
                {order.status === 'Delivered' && (
                  <View
                    style={[
                      S.statusBtn,
                      {
                        backgroundColor: isDark ? '#1E3A24' : '#E8F5E9',
                        marginTop: 8,
                      },
                    ]}>
                    <Text
                      style={{
                        color: '#4CAF50',
                        fontSize: rs(FONTS.xs),
                        fontWeight: '600',
                      }}>
                      🎉{' '}
                      {t('farmer.itemDelivered', {
                        defaultValue: 'Item has been delivered',
                      })}
                    </Text>
                  </View>
                )}
              </View>
            ))
          )}
          <View style={{height: 90}} />
        </ScrollView>
      )}

      <Modal
        visible={rejectModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setRejectModalVisible(false);
          setRejectingOrderId(null);
        }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          }}>
          <View
            style={{
              width: '85%',
              backgroundColor: themeColors.cardBg,
              borderRadius: RADIUS.xl,
              padding: SPACING.xl,
              borderWidth: isDark ? 1 : 0,
              borderColor: themeColors.border,
              ...SHADOWS.card,
            }}>
            <Text
              style={{
                fontSize: rs(FONTS.md),
                fontWeight: 'bold',
                color: themeColors.text,
                marginBottom: SPACING.md,
                textAlign: 'center',
              }}>
              ❌{' '}
              {t('orders.rejectTitle', {
                defaultValue: 'Select Rejection Reason',
              })}
            </Text>

            {[
              {key: 'out_of_stock', emoji: '📦'},
              {key: 'out_of_service', emoji: '📍'},
              {key: 'quality_issue', emoji: '⚠️'},
              {key: 'unexpected_conditions', emoji: '☁️'},
            ].map(reason => (
              <TouchableOpacity
                key={reason.key}
                style={{
                  paddingVertical: SPACING.md,
                  paddingHorizontal: SPACING.md,
                  backgroundColor: isDark ? '#2D2D2D' : '#F5F5F5',
                  borderRadius: RADIUS.md,
                  marginVertical: 4,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                onPress={() => handleRejectOrder(reason.key)}>
                <Text style={{fontSize: rs(18), marginRight: SPACING.md}}>
                  {reason.emoji}
                </Text>
                <Text
                  style={{
                    fontSize: rs(FONTS.sm),
                    color: themeColors.text,
                    flex: 1,
                  }}>
                  {t('orders.rejectReason_' + reason.key)}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={{
                marginTop: SPACING.lg,
                padding: SPACING.md,
                alignItems: 'center',
                backgroundColor: isDark ? '#3D3D3D' : '#E0E0E0',
                borderRadius: RADIUS.md,
              }}
              onPress={() => {
                setRejectModalVisible(false);
                setRejectingOrderId(null);
              }}>
              <Text
                style={{
                  color: themeColors.text,
                  fontWeight: 'bold',
                  fontSize: rs(FONTS.sm),
                }}>
                {t('orders.close', {defaultValue: 'Close'})}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ── FARMER PROFILE ──
export const FarmerProfileScreen = ({navigation}) => {
  const {t} = useTranslation();
  const {isDark} = useTheme();
  const themeColors = getThemeColors(isDark);
  const {user, logout} = useAuth();
  return (
    <View style={[S.container, {backgroundColor: themeColors.bg}]}>
      <LinearGradient
        colors={['#0D5C32', '#1B8A4E', '#1565C0']}
        style={S.fProfileHeader}>
        <AvatarView
          uri={user?.avatar}
          name={user?.name}
          size={rs(88)}
          style={{borderWidth: 3, borderColor: COLORS.white, marginBottom: 12}}
        />
        <Text style={S.fProfileName}>{user?.name}</Text>
        {user?.isVerified && (
          <Text style={S.verifiedBadge}>
            ✅ {t('farmer.verified', {defaultValue: 'சரிபார்க்கப்பட்டது'})}
          </Text>
        )}
        <Text style={S.fProfileLoc}>
          📍{' '}
          {user?.location ||
            t('farmer.noLocation', {defaultValue: 'இடம் சேர்க்கவில்லை'})}
        </Text>
      </LinearGradient>
      <ScrollView contentContainerStyle={{padding: SPACING.lg}}>
        {[
          {
            icon: '🏷️',
            label: t('farmer.farmName', {defaultValue: 'பண்ணை பெயர்'}),
            val: user?.farmName || '-',
          },
          {
            icon: '📞',
            label: t('farmer.phone', {defaultValue: 'தொலைபேசி'}),
            val: user?.phone || '-',
          },
          {
            icon: '📧',
            label: t('farmer.email', {defaultValue: 'மின்னஞ்சல்'}),
            val: user?.email || '-',
          },
          {
            icon: '⭐',
            label: t('farmer.rating', {defaultValue: 'மதிப்பீடு'}),
            val: `${user?.rating || '0'} / 5.0`,
          },
        ].map((item, i) => (
          <View
            key={i}
            style={[
              S.profileInfoCard,
              {
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border,
                borderWidth: 1,
              },
            ]}>
            <Text style={S.profileInfoIcon}>{item.icon}</Text>
            <View>
              <Text style={[S.profileInfoLabel, {color: themeColors.subText}]}>
                {item.label}
              </Text>
              <Text style={[S.profileInfoVal, {color: themeColors.text}]}>
                {item.val}
              </Text>
            </View>
          </View>
        ))}
        {[
          {
            icon: '📷',
            label: t('farmer.myQrCode', {defaultValue: 'என் QR குறியீடு'}),
            screen: 'FarmerQR',
          },
          {
            icon: '🎬',
            label: t('farmer.myStoryVideo', {defaultValue: 'என் கதை வீடியோ'}),
            screen: 'StoryVideo',
          },
          {
            icon: '⚙️',
            label: t('profile.settings', {defaultValue: 'அமைப்புகள்'}),
            screen: 'Settings',
          },
        ].map((item, i) => (
          <TouchableOpacity
            key={i}
            style={[
              S.menuItemCard,
              {
                backgroundColor: themeColors.cardBg,
                borderColor: themeColors.border,
                borderWidth: 1,
              },
            ]}
            onPress={() => navigation.navigate(item.screen)}>
            <Text style={S.menuItemIcon}>{item.icon}</Text>
            <Text style={[S.menuItemLabel, {color: themeColors.text}]}>
              {item.label}
            </Text>
            <Text style={{fontSize: rs(20), color: themeColors.textMuted}}>
              ›
            </Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={[
            S.logoutCard,
            {
              backgroundColor: isDark ? 'rgba(211, 47, 47, 0.15)' : '#FFEBEE',
              borderColor: isDark ? 'rgba(211, 47, 47, 0.3)' : 'transparent',
              borderWidth: isDark ? 1 : 0,
            },
          ]}
          onPress={() =>
            Alert.alert(t('settings.logout', {defaultValue: 'வெளியேறு'}), '', [
              {
                text: t('common.cancel', {defaultValue: 'இல்லை'}),
                style: 'cancel',
              },
              {
                text: t('profile.logoutYes', {defaultValue: 'ஆமா'}),
                onPress: logout,
                style: 'destructive',
              },
            ])
          }>
          <Text
            style={[
              S.logoutCardTxt,
              {color: isDark ? '#FF8A80' : COLORS.accentRed},
            ]}>
            🚪 {t('settings.logout', {defaultValue: 'வெளியேறு'})}
          </Text>
        </TouchableOpacity>
        <View style={{height: 90}} />
      </ScrollView>
    </View>
  );
};

const S = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  headerRow: {
    paddingTop: rs(50),
    paddingBottom: rs(20),
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: rs(FONTS.xl),
    fontWeight: 'bold',
    color: COLORS.white,
    flex: 1,
    textAlign: 'center',
  },
  backTxt: {
    color: COLORS.white,
    fontSize: rs(22),
    fontWeight: 'bold',
    width: 40,
  },
  dashHeader: {
    paddingTop: rs(50),
    paddingBottom: rs(24),
    paddingHorizontal: SPACING.xl,
  },
  dashHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dashGreeting: {fontSize: rs(FONTS.sm), color: 'rgba(255,255,255,0.75)'},
  dashName: {fontSize: rs(FONTS.xxl), fontWeight: 'bold', color: COLORS.white},
  verifiedBadge: {
    fontSize: rs(FONTS.xs),
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },
  farmName: {
    fontSize: rs(FONTS.sm),
    color: 'rgba(255,255,255,0.7)',
    marginTop: SPACING.sm,
  },
  notifBtn: {
    width: rs(44),
    height: rs(44),
    borderRadius: rs(14),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  statCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderTopWidth: 3,
    ...SHADOWS.small,
  },
  statEmoji: {fontSize: rs(28), marginBottom: SPACING.sm},
  statVal: {fontSize: rs(FONTS.xxl), fontWeight: '800'},
  statLbl: {fontSize: rs(FONTS.xs), color: COLORS.textMuted, marginTop: 2},
  section: {paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  sTitle: {
    fontSize: rs(FONTS.lg),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  seeAll: {
    fontSize: rs(FONTS.sm),
    color: COLORS.primaryBlue,
    fontWeight: '600',
  },
  qaGrid: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md},
  qaCard: {
    width: (width - SPACING.lg * 2 - SPACING.md) / 2,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...SHADOWS.small,
    marginBottom: SPACING.md,
  },
  qaGrad: {
    paddingHorizontal: rs(SPACING.sm),
    paddingVertical: rs(SPACING.lg),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: rs(140),
  },
  qaIcon: {fontSize: rs(36), marginBottom: 8},
  qaLabel: {
    fontSize: rs(FONTS.sm),
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  prodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  prodRowImg: {width: rs(56), height: rs(56), borderRadius: RADIUS.md},
  prodRowInfo: {flex: 1, marginLeft: SPACING.md},
  prodRowName: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  prodRowPrice: {
    fontSize: rs(FONTS.sm),
    color: COLORS.primaryGreen,
    fontWeight: '600',
  },
  stockBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: RADIUS.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stockText: {
    fontSize: rs(FONTS.xs),
    color: COLORS.primaryGreen,
    fontWeight: 'bold',
  },
  addBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  addBtnTxt: {color: COLORS.white, fontWeight: 'bold'},
  mpCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  mpImg: {width: rs(80), height: rs(80), borderRadius: RADIUS.lg},
  mpInfo: {flex: 1, marginLeft: SPACING.md},
  mpName: {
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flexShrink: 1,
  },
  mpPrice: {
    fontSize: rs(FONTS.sm),
    color: COLORS.primaryGreen,
    fontWeight: '600',
  },
  mpStock: {fontSize: rs(FONTS.xs), color: COLORS.textMuted},
  mpActions: {justifyContent: 'space-between', paddingVertical: 4},
  editBtn: {
    backgroundColor: '#E3F2FD',
    padding: 8,
    borderRadius: RADIUS.md,
    marginBottom: 6,
  },
  editBtnTxt: {fontSize: rs(18)},
  delBtn: {backgroundColor: '#FFEBEE', padding: 8, borderRadius: RADIUS.md},
  delBtnTxt: {fontSize: rs(18)},
  fieldWrap: {marginBottom: SPACING.lg},
  fieldLabel: {
    fontSize: rs(FONTS.sm),
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
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
  imgUpload: {
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    borderRadius: RADIUS.xl,
    padding: rs(32),
    alignItems: 'center',
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.white,
  },
  imgUploadFilled: {
    borderStyle: 'solid',
    borderColor: COLORS.primaryGreen,
    padding: SPACING.sm,
  },
  imgUploadEmoji: {fontSize: rs(36), marginBottom: 8},
  imgUploadTxt: {
    fontSize: rs(FONTS.md),
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  imgUploadSub: {fontSize: rs(FONTS.xs), color: COLORS.textMuted},
  previewImage: {width: '100%', height: rs(200), borderRadius: RADIUS.lg},
  uploadBadge: {
    backgroundColor: COLORS.primaryGreen,
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginTop: 8,
  },
  uploadBadgeTxt: {
    color: COLORS.white,
    fontSize: rs(FONTS.sm),
    fontWeight: 'bold',
  },
  chip: {
    borderRadius: RADIUS.full,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: SPACING.sm,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primaryGreen,
    borderColor: COLORS.primaryGreen,
  },
  chipTxt: {fontSize: rs(FONTS.sm), color: COLORS.textSecondary},
  chipTxtActive: {color: COLORS.white, fontWeight: 'bold'},
  submitBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginTop: SPACING.md,
  },
  submitGrad: {paddingVertical: rs(16), alignItems: 'center'},
  submitTxt: {color: COLORS.white, fontSize: rs(FONTS.lg), fontWeight: 'bold'},
  editImg: {
    width: '100%',
    height: rs(200),
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.md,
  },
  editProdName: {
    fontSize: rs(FONTS.xl),
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  foCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  foTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  foId: {fontSize: rs(FONTS.md), fontWeight: 'bold', color: COLORS.textPrimary},
  foDate: {fontSize: rs(FONTS.xs), color: COLORS.textMuted},
  foItem: {
    fontSize: rs(FONTS.sm),
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  foBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  foTotal: {
    fontSize: rs(FONTS.lg),
    fontWeight: 'bold',
    color: COLORS.primaryGreen,
  },
  foStatus: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  foStatusTxt: {fontSize: rs(FONTS.xs), fontWeight: 'bold'},
  statusBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  fProfileHeader: {
    paddingTop: rs(50),
    paddingBottom: rs(30),
    alignItems: 'center',
  },
  fProfileName: {
    fontSize: rs(FONTS.xxl),
    fontWeight: 'bold',
    color: COLORS.white,
  },
  fProfileLoc: {
    fontSize: rs(FONTS.sm),
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  profileInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  profileInfoIcon: {fontSize: rs(28), marginRight: SPACING.md},
  profileInfoLabel: {fontSize: rs(FONTS.xs), color: COLORS.textMuted},
  profileInfoVal: {
    fontSize: rs(FONTS.md),
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  menuItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  menuItemIcon: {fontSize: rs(22), marginRight: SPACING.md},
  menuItemLabel: {
    flex: 1,
    fontSize: rs(FONTS.md),
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  logoutCard: {
    backgroundColor: '#FFEBEE',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  logoutCardTxt: {
    color: COLORS.accentRed,
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
  },
  emptyBox: {alignItems: 'center', paddingVertical: rs(60)},
  emptyEmoji: {fontSize: rs(64), marginBottom: SPACING.md},
  emptyText: {
    fontSize: rs(FONTS.lg),
    color: COLORS.textMuted,
    fontWeight: 'bold',
  },
  emptyAddBtn: {
    backgroundColor: COLORS.primaryGreen,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  emptyAddTxt: {
    color: COLORS.white,
    fontSize: rs(FONTS.md),
    fontWeight: 'bold',
  },
});
