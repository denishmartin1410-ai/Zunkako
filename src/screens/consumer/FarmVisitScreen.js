// ============================================================
// 🗺️ FARM VISIT SCREEN
// "நேரில் பண்ணைக்கு வந்து வாங்கலாம்!"
// Consumer can visit farmer's farm directly
// எந்த Delivery App-லயும் இல்லாத UNIQUE Feature!
// ============================================================

import React, {useState} from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import {useTranslation} from 'react-i18next';
import {COLORS, FONTS, SPACING, RADIUS, SHADOWS} from '../../utils/theme';
import {useAuth} from '../../context/AuthContext';
import { getAllFarmers } from '../../services/firebase';
import BackButton from '../../utils/BackButton';

// Data loaded from Firestore

const FarmVisitScreen = ({navigation}) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [visitors, setVisitors] = useState('1');
  const [showBooking, setShowBooking] = useState(false);
  const [farms, setFarms] = useState([]);
  const [loading, setLoading] = useState(true);

  const getFarmLocation = (farm) => {
    if (i18n.language === 'ta') {
      return farm.locationTa || farm.location;
    }
    if (i18n.language === 'ml') {
      if (farm.location === 'Tamil Nadu' || farm.location === 'tamilnadu') return 'തമിഴ്‌നാട്';
      if (farm.location === 'Coimbatore' || farm.location === 'coimbatore') return 'കോയമ്പത്തൂർ';
      return farm.location;
    }
    return farm.location;
  };

  const getFarmDays = (farm) => {
    if (i18n.language === 'ta') {
      return farm.availableDaysTa || ['சனி', 'ஞாயிறு'];
    }
    if (i18n.language === 'ml') {
      return ['ശനി', 'ഞായർ'];
    }
    return farm.availableDays || ['Saturday', 'Sunday'];
  };

  const getFarmActivities = (farm) => {
    if (i18n.language === 'ta') {
      return farm.activities || [];
    }
    if (i18n.language === 'ml') {
      return [
        '✅ നേരിട്ട് വിളവെടുക്കാം', 
        '✅ കൃഷിയിടം സന്ദർശിക്കാം', 
        '✅ ജൈവ കൃഷി രീതികൾ പഠിക്കാം'
      ];
    }
    return farm.activitiesEn || farm.activities || [];
  };

  const getVisitorsLabel = (count) => {
    if (i18n.language === 'ta') {
      return 'பேர்';
    }
    if (i18n.language === 'ml') {
      return 'പേർ';
    }
    return count === 1 ? 'Member' : 'Members';
  };

  React.useEffect(() => {
    const fetchFarmers = async () => {
      const res = await getAllFarmers();
      if (res.success && res.data) {
        // Map farmers to Farm Visit format
        const mappedFarms = res.data.map(farmer => ({
          id: farmer.id,
          farmerId: farmer.id,
          farmName: farmer.farmName || `${farmer.nameTa || farmer.name}'s Farm`,
          farmerName: farmer.nameTa || farmer.name,
          farmerNameEn: farmer.name,
          location: farmer.location || 'Tamil Nadu',
          locationTa: farmer.locationTa || 'தமிழ்நாடு',
          avatar: farmer.photoURL || farmer.avatar || 'https://via.placeholder.com/150',
          coverImage: farmer.coverImage || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=500&q=80',
          distance: '2-5 km',
          rating: farmer.rating || 0,
          totalVisitors: farmer.visitorsCount || 0,
          visitSlots: ['07:00 AM / 08:00 AM', '10:00 AM / 11:00 AM', '04:00 PM / 05:00 PM'],
          maxVisitorsPerSlot: 10,
          highlights: ['Organic', 'Fresh', 'Direct Farm'],
          availableDaysTa: ['சனி', 'ஞாயிறு'],
          availableDays: ['Saturday', 'Sunday'],
          activities: ['✅ நேரடி அறுவடை செய்யலாம்', '✅ விளைநிலங்களை சுற்றிப்பார்க்கலாம்', '✅ இயற்கை விவசாய முறைகளை அறியலாம்'],
          activitiesEn: ['✅ Harvest directly', '✅ Farm tour', '✅ Learn organic farming'],
        }));
        setFarms(mappedFarms);
      }
      setLoading(false);
    };
    fetchFarmers();
  }, []);

  const handleBookVisit = async () => {
    if (!user) {
      Alert.alert('Login Required', 'Please login to book a farm visit.');
      return;
    }
    if (!selectedSlot || !selectedDate || !visitors) {
      Alert.alert('பிழை / Error', 'அனைத்து தகவல்களும் நிரப்பவும்\nFill all details');
      return;
    }

    // Parse date DD/MM/YYYY
    const formattedDate = selectedDate.replace(/-/g, '/');
    const parts = formattedDate.split('/');
    if (parts.length !== 3) {
      Alert.alert(t('farmVisit.errorTitle', { defaultValue: 'பிழை' }), t('farmVisit.errorDateFormat', { defaultValue: 'தேதி வடிவம் DD/MM/YYYY ஆக இருக்க வேண்டும் (எ.கா: 12/05/2026).' }));
      return;
    }
    const visitDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
    if (isNaN(visitDate.getTime())) {
      Alert.alert(t('farmVisit.errorTitle', { defaultValue: 'பிழை' }), t('farmVisit.errorInvalidDate', { defaultValue: 'சரியான தேதியை உள்ளிடவும்.' }));
      return;
    }
    const dayOfWeek = visitDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      Alert.alert(
        t('farmVisit.weekendOnlyTitle', { defaultValue: 'சனி/ஞாயிறு மட்டுமே' }), 
        t('farmVisit.weekendOnlyDesc', { defaultValue: 'பண்ணை வருகைக்கு சனி மற்றும் ஞாயிறு மட்டுமே அனுமதிக்கப்படும். விவசாயியின் வேலைப்பளு காரணமாக வார நாட்களில் அனுமதி இல்லை. தயவுசெய்து சனி அல்லது ஞாயிறு தேதியைத் தேர்ந்தெடுக்கவும்.' })
      );
      return;
    }

    let formattedMessage = '';
    if (i18n.language === 'ta') {
      formattedMessage = `👋 வணக்கம்! தங்கள் பண்ணைக்கு நேரில் வர அனுமதி கேட்கிறேன்.\n📅 தேதி: ${formattedDate}\n⏰ நேரம்: ${selectedSlot}\n👥 உறுப்பினர்கள்: ${visitors} பேர்\nநாங்கள் வரலாமா?`;
    } else if (i18n.language === 'ml') {
      formattedMessage = `👋 നമസ്കാരം! നിങ്ങളുടെ ഫാം സന്ദർശിക്കാൻ ഞാൻ അനുവാദം ചോദിക്കുന്നു.\n📅 തിയ്യതി: ${formattedDate}\n⏰ സമയം: ${selectedSlot}\n👥 സന്ദർശകർ: ${visitors} പേർ\nഞങ്ങൾ വന്നോട്ടെ?`;
    } else {
      formattedMessage = `👋 Hello! I would like to request permission to visit your farm.\n📅 Date: ${formattedDate}\n⏰ Time: ${selectedSlot}\n👥 Visitors: ${visitors} ${getVisitorsLabel(parseInt(visitors))}\nCan we visit?`;
    }
    
    setShowBooking(false);
    setSelectedFarm(null);
    
    navigation.navigate('FarmerChatRoom', {
      farmer: {
        id: selectedFarm.farmerId,
        name: selectedFarm.farmerNameEn,
        nameTa: selectedFarm.farmerName,
        avatar: selectedFarm.avatar
      },
      initialMessage: formattedMessage
    });
  };

  const FarmCard = ({farm}) => (
    <View style={styles.farmCard}>
      <FastImage
        source={{uri: farm.coverImage, priority: FastImage.priority.normal}}
        style={styles.farmCover}
        resizeMode={FastImage.resizeMode.cover}
      />
      <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.coverOverlay} />

      {/* Distance badge */}
      <View style={styles.distanceBadge}>
        <Text style={styles.distanceTxt}>📍 {farm.distance}</Text>
      </View>

      {/* FREE badge */}
      <View style={styles.freeBadge}>
        <Text style={styles.freeTxt}>{t('farmVisit.freeVisit', { defaultValue: 'இலவசம் / FREE Visit!' })}</Text>
      </View>

      {/* Farmer info on image */}
      <View style={styles.farmerOnImage}>
        <FastImage source={{uri: farm.avatar}} style={styles.farmAvatar} />
        <View>
          <Text style={styles.farmerNameOnImg}>{farm.farmerName}</Text>
          <Text style={styles.farmerNameEnOnImg}>{farm.farmerNameEn}</Text>
        </View>
      </View>

      <View style={styles.farmCardBody}>
        {/* Farm name & location */}
        <Text style={styles.farmName}>{farm.farmName}</Text>
        <Text style={styles.farmLocation}>📍 {getFarmLocation(farm)}</Text>

        {/* Rating & visitors */}
        <View style={styles.farmMetaRow}>
          <Text style={styles.farmRating}>⭐ {farm.rating}</Text>
          <Text style={styles.farmVisitors}>👥 {t('farmVisit.visitorsCount', { count: farm.totalVisitors, defaultValue: `${farm.totalVisitors} பேர் வருகை தந்துள்ளனர்` })}</Text>
        </View>

        {/* Highlights */}
        <View style={styles.highlightsRow}>
          {(farm.highlights || []).map((h, i) => (
            <View key={i} style={styles.highlightChip}>
              <Text style={styles.highlightTxt}>{h}</Text>
            </View>
          ))}
        </View>

        {/* Available days */}
        <Text style={styles.subTitle}>📅 {t('farmVisit.visitDays', { defaultValue: 'வருகை நாட்கள் / Visit Days' })}:</Text>
        <View style={styles.daysRow}>
          {getFarmDays(farm).map((day, i) => (
            <View key={i} style={styles.dayChip}>
              <Text style={styles.dayTxt}>{day}</Text>
            </View>
          ))}
        </View>

        {/* Activities */}
        <Text style={styles.subTitle}>🌟 {t('farmVisit.activities', { defaultValue: 'செய்யலாம் / Activities' })}:</Text>
        {getFarmActivities(farm).map((act, i) => (
          <Text key={i} style={styles.activityTxt}>{act}</Text>
        ))}

        {/* Book button */}
        <TouchableOpacity
          style={styles.bookBtn}
          onPress={() => {setSelectedFarm(farm); setShowBooking(true);}}>
          <LinearGradient colors={COLORS.gradientButton} style={styles.bookBtnGrad}
            start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
            <Text style={styles.bookBtnTxt}>
              📅 {t('farmVisit.bookBtn', { defaultValue: 'பண்ணை வருகை பதிவு செய்' })}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0D5C32', '#1B8A4E', '#1565C0']} style={styles.headerRow}>
        <View style={styles.headerTop}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>🗺️</Text>
          <Text style={styles.headerTitle}>{t('farmVisit.title', { defaultValue: 'பண்ணை வருகை' })}</Text>
          <Text style={styles.headerDesc}>
            {t('farmVisit.desc', { defaultValue: 'விவசாயியின் பண்ணைக்கு நேரில் சென்று\nநேரடியாக வாங்கலாம்! 100% நம்பகம்!' })}
          </Text>
        </View>
      </LinearGradient>

      {/* Booking Modal */}
      {showBooking && selectedFarm && (
        <View style={styles.bookingOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardAvoidingView}
          >
            <View style={styles.bookingModal}>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={styles.bookingTitle}>
                  📅 {selectedFarm.farmName} - {t('farmVisit.attendance', { defaultValue: 'வருகை பதிவு' })}
                </Text>
                <Text style={styles.bookingSubtitle}>Book your farm visit</Text>

                {/* Date input */}
                <Text style={styles.bookingLabel}>📅 {t('farmVisit.dateLabel', { defaultValue: 'தேதி (DD/MM/YYYY) சனி/ஞாயிறு மட்டும்' })}:</Text>
                <TextInput
                  style={styles.bookingInput}
                  value={selectedDate}
                  onChangeText={setSelectedDate}
                  placeholder="01/02/2024"
                  placeholderTextColor={COLORS.textGray}
                  keyboardType="default"
                />

                {/* Slot selector */}
                <Text style={styles.bookingLabel}>⏰ {t('farmVisit.timeLabel', { defaultValue: 'நேரம்' })}:</Text>
                {(selectedFarm.visitSlots || []).map((slot, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.slotChip, selectedSlot === slot && styles.slotChipActive]}
                    onPress={() => setSelectedSlot(slot)}>
                    <Text style={[styles.slotTxt, selectedSlot === slot && styles.slotTxtActive]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}

                {/* Visitors count */}
                <Text style={styles.bookingLabel}>👥 {t('farmVisit.visitorsLabel', { defaultValue: 'உறுப்பினர்கள் எண்ணிக்கை' })}:</Text>
                <View style={styles.visitorsRow}>
                  <TouchableOpacity
                    style={styles.visitorBtn}
                    onPress={() => setVisitors(v => String(Math.max(1, parseInt(v) - 1)))}>
                    <Text style={styles.visitorBtnTxt}>−</Text>
                  </TouchableOpacity>
                  <Text style={styles.visitorsNum}>{visitors} {getVisitorsLabel(parseInt(visitors))}</Text>
                  <TouchableOpacity
                    style={[styles.visitorBtn, styles.visitorBtnPlus]}
                    onPress={() => setVisitors(v => String(Math.min(selectedFarm.maxVisitorsPerSlot, parseInt(v) + 1)))}>
                    <Text style={[styles.visitorBtnTxt, {color: COLORS.white}]}>+</Text>
                  </TouchableOpacity>
                </View>

                {/* Confirm & Cancel */}
                <View style={styles.bookingBtnsRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {setShowBooking(false); setSelectedFarm(null);}}>
                    <Text style={styles.cancelBtnTxt}>{t('common.cancel', { defaultValue: 'No' })}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmBtn} onPress={handleBookVisit}>
                    <LinearGradient colors={COLORS.gradientButton} style={styles.confirmGrad}>
                      <Text style={styles.confirmTxt}>✅ {t('farmVisit.confirmBtn', { defaultValue: 'Confirm' })}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false}
        contentContainerStyle={{padding: SPACING.lg, paddingBottom: 100}}>
        {/* Info box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoTxt}>
            🌿 {t('farmVisit.infoTxt', { defaultValue: 'நம்மால் நேரில் பண்ணைக்கு சென்று பொருட்களை வாங்கலாம். 100% fresh + 100% நம்பகம்!' })}
          </Text>
        </View>

        {loading ? (
          <Text style={{ textAlign: 'center', marginTop: 40 }}>{t('common.loading', { defaultValue: 'Loading...' })}</Text>
        ) : farms.length === 0 ? (
          <Text style={{ textAlign: 'center', marginTop: 40, color: COLORS.textGray }}>{t('farmVisit.noFarms', { defaultValue: 'தற்போது எந்த பண்ணைகளும் இல்லை.' })}</Text>
        ) : (
          farms.map(farm => (
            <FarmCard key={farm.id} farm={farm} />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: COLORS.background},
  headerRow: { paddingTop: 50, paddingBottom: 24, paddingHorizontal: SPACING.xl },
  headerTop: { marginBottom: SPACING.md, alignSelf: 'flex-start' },
  headerContent: { alignItems: 'center' },
  headerEmoji: { fontSize: 44, marginBottom: 6 },
  headerTitle: { fontSize: FONTS.xxl, fontWeight: FONTS.bold, color: COLORS.white, marginBottom: SPACING.sm },
  headerDesc: { fontSize: FONTS.sm, color: 'rgba(255,255,255,0.9)', textAlign: 'center', lineHeight: 22, paddingHorizontal: SPACING.md },

  infoBox: {
    backgroundColor: '#E8F5E9', borderRadius: RADIUS.xl,
    padding: SPACING.lg, marginBottom: SPACING.lg,
    borderLeftWidth: 4, borderLeftColor: COLORS.primaryGreen,
  },
  infoTxt: {fontSize: FONTS.md, color: COLORS.primaryGreenDark, lineHeight: 22},

  farmCard: {backgroundColor: COLORS.white, borderRadius: RADIUS.xl, marginBottom: SPACING.xl, overflow: 'hidden', ...SHADOWS.large},
  farmCover: {width: '100%', height: 200},
  coverOverlay: {position: 'absolute', top: 0, left: 0, right: 0, height: 200},
  distanceBadge: {
    position: 'absolute', top: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  distanceTxt: {color: COLORS.white, fontSize: FONTS.sm, fontWeight: FONTS.bold},
  freeBadge: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: COLORS.primaryGreen, borderRadius: RADIUS.full,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  freeTxt: {color: COLORS.white, fontSize: FONTS.sm, fontWeight: FONTS.bold},
  farmerOnImage: {
    position: 'absolute', bottom: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
  },
  farmAvatar: {width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: COLORS.white},
  farmerNameOnImg: {fontSize: FONTS.md, fontWeight: FONTS.bold, color: COLORS.white},
  farmerNameEnOnImg: {fontSize: FONTS.xs, color: 'rgba(255,255,255,0.8)'},
  farmCardBody: {padding: SPACING.xl},
  farmName: {fontSize: FONTS.xl, fontWeight: FONTS.bold, color: COLORS.textPrimary, marginBottom: 4},
  farmLocation: {fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: SPACING.sm},
  farmMetaRow: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md},
  farmRating: {fontSize: FONTS.md, fontWeight: FONTS.bold, color: COLORS.textPrimary},
  farmVisitors: {fontSize: FONTS.sm, color: COLORS.textSecondary},
  highlightsRow: {flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md},
  highlightChip: {backgroundColor: '#E3F2FD', borderRadius: RADIUS.full, paddingHorizontal: 12, paddingVertical: 4},
  highlightTxt: {fontSize: FONTS.xs, color: COLORS.primaryBlue, fontWeight: FONTS.semiBold},
  subTitle: {fontSize: FONTS.md, fontWeight: FONTS.bold, color: COLORS.textPrimary, marginBottom: SPACING.sm, marginTop: SPACING.sm},
  daysRow: {flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md},
  dayChip: {backgroundColor: '#E8F5E9', borderRadius: RADIUS.full, paddingHorizontal: 14, paddingVertical: 6},
  dayTxt: {fontSize: FONTS.sm, color: COLORS.primaryGreen, fontWeight: FONTS.semiBold},
  activityTxt: {fontSize: FONTS.md, color: COLORS.textSecondary, lineHeight: 24},
  bookBtn: {borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: SPACING.lg},
  bookBtnGrad: {paddingVertical: 14, alignItems: 'center'},
  bookBtnTxt: {color: COLORS.white, fontSize: FONTS.md, fontWeight: FONTS.bold},

  // Booking modal
  bookingOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 999,
    justifyContent: 'center', alignItems: 'center',
  },
  keyboardAvoidingView: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingModal: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: SPACING.xxl, width: '90%', maxHeight: '85%',
    ...SHADOWS.large,
  },
  bookingTitle: {fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.textPrimary, marginBottom: 4},
  bookingSubtitle: {fontSize: FONTS.sm, color: COLORS.textMuted, marginBottom: SPACING.lg},
  bookingLabel: {fontSize: FONTS.sm, fontWeight: FONTS.semiBold, color: COLORS.textSecondary, marginBottom: 6, marginTop: SPACING.sm, lineHeight: 18},
  bookingInput: {
    backgroundColor: COLORS.background, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.lg, height: 50, fontSize: FONTS.md,
    color: COLORS.textPrimary, borderWidth: 1.5, borderColor: COLORS.borderLight,
    marginBottom: SPACING.sm,
  },
  slotChip: {
    borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm,
    backgroundColor: COLORS.background, borderWidth: 1.5, borderColor: COLORS.borderLight,
  },
  slotChipActive: {borderColor: COLORS.primaryGreen, backgroundColor: '#E8F5E9'},
  slotTxt: {fontSize: FONTS.sm, color: COLORS.textSecondary},
  slotTxtActive: {color: COLORS.primaryGreen, fontWeight: FONTS.bold},
  visitorsRow: {flexDirection: 'row', alignItems: 'center', gap: SPACING.lg, marginBottom: SPACING.lg},
  visitorBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.background, borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  visitorBtnPlus: {backgroundColor: COLORS.primaryGreen, borderColor: COLORS.primaryGreen},
  visitorBtnTxt: {fontSize: FONTS.xl, fontWeight: FONTS.bold, color: COLORS.textPrimary},
  visitorsNum: {fontSize: FONTS.lg, fontWeight: FONTS.bold, color: COLORS.textPrimary},
  bookingBtnsRow: {flexDirection: 'row', gap: SPACING.md},
  cancelBtn: {
    flex: 1, borderWidth: 2, borderColor: COLORS.border,
    borderRadius: RADIUS.lg, paddingVertical: 12, alignItems: 'center', justifyContent: 'center'
  },
  cancelBtnTxt: {fontSize: FONTS.sm, color: COLORS.textSecondary, fontWeight: FONTS.semiBold, textAlign: 'center'},
  confirmBtn: {flex: 1, borderRadius: RADIUS.lg, overflow: 'hidden'},
  confirmGrad: {paddingVertical: 12, alignItems: 'center', justifyContent: 'center'},
  confirmTxt: {color: COLORS.white, fontSize: FONTS.sm, fontWeight: FONTS.bold, textAlign: 'center'},
});

export default FarmVisitScreen;
