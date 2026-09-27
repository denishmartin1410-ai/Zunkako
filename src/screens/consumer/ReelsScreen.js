// src/screens/consumer/ReelsScreen.js
// ✅ Reels Feed Screen - Flipkart/Instagram style!
// ✅ Vertically swipable, autoplay, loop, mute toggle
// ✅ Like, Share, Viewer count options

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Platform,
  StatusBar,
} from 'react-native';
import Video from 'react-native-video';
import firestore from '@react-native-firebase/firestore';
import {useIsFocused} from '@react-navigation/native';
import {useTranslation} from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import FastImage from 'react-native-fast-image';
import {COLORS, FONTS, SPACING, RADIUS, SHADOWS} from '../../utils/theme';

const {width, height} = Dimensions.get('window');
// Standard Tab Bar Height is 70, StatusBar is ~40 on Android
const SCREEN_HEIGHT = height - 70;

const AvatarView = ({uri, name, size = 44, style}) => {
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

const ReelItem = ({
  item,
  index,
  activeIndex,
  isMuted,
  toggleMute,
  isScreenFocused,
}) => {
  const {t} = useTranslation();
  const isPlay = isScreenFocused && activeIndex === index;
  const [isUserPaused, setIsUserPaused] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(
    item.storyLikes || item.likes || 0,
  );
  const [viewCount, setViewCount] = useState(
    item.storyViews || item.views || 0,
  );
  const videoRef = useRef(null);
  const hasViewedRef = useRef(false);

  useEffect(() => {
    if (isPlay && !hasViewedRef.current) {
      hasViewedRef.current = true;
      setViewCount(prev => prev + 1);
      if (item.id) {
        firestore()
          .collection('farm_stories')
          .doc(item.id)
          .update({
            storyViews: firestore.FieldValue.increment(1),
          })
          .catch(() => {});
      }
    }
  }, [isPlay, item.id]);

  const toggleUserPause = () => {
    setIsUserPaused(prev => !prev);
  };

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikeCount(prev => prev - 1);
      if (item.id) {
        firestore()
          .collection('farm_stories')
          .doc(item.id)
          .update({
            storyLikes: firestore.FieldValue.increment(-1),
          })
          .catch(() => {});
      }
    } else {
      setLiked(true);
      setLikeCount(prev => prev + 1);
      if (item.id) {
        firestore()
          .collection('farm_stories')
          .doc(item.id)
          .update({
            storyLikes: firestore.FieldValue.increment(1),
          })
          .catch(() => {});
      }
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${t('reels.shareMsg', {
          defaultValue: 'உழவர் கதையை பாருங்கள்! / Watch this farmer story!',
        })}\n🎥 ${item.storyVideo || item.videoUrl}`,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const fName = item.nameTa || item.name || 'Farmer';
  const videoUri = item.storyVideo || item.videoUrl || item.url;

  return (
    <View style={styles.reelContainer}>
      {/* Video Component with Instagram style Tap to Pause/Play */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={toggleUserPause}
        style={StyleSheet.absoluteFillObject}>
        {videoUri ? (
          <Video
            ref={videoRef}
            source={{uri: videoUri}}
            style={StyleSheet.absoluteFillObject}
            resizeMode="cover"
            repeat={true}
            paused={!isPlay || isUserPaused}
            muted={isMuted}
            playInBackground={false}
            playWhenInactive={false}
            ignoreSilentSwitch="ignore"
          />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.errorVideo]}>
            <Text style={{fontSize: 48}}>📹</Text>
            <Text style={{color: COLORS.white, marginTop: 10}}>
              Video unavailable
            </Text>
          </View>
        )}
        {isUserPaused && (
          <View
            style={{
              position: 'absolute',
              top: '45%',
              left: '42%',
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: 40,
              width: 70,
              height: 70,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Text style={{fontSize: 34, color: '#FFF'}}>⏸️</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Dark Gradients for Text visibility */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.6)']}
        style={styles.bottomGradient}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'transparent']}
        style={styles.topGradient}
      />

      {/* Top Header info (Category/Views) */}
      <View style={styles.topHeader}>
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>
            {t('reels.popular', {defaultValue: 'Popular'})}
          </Text>
        </View>
        <View style={styles.viewsBadge}>
          <Text style={styles.viewsText}>
            👁️ {viewCount} {t('reels.views', {defaultValue: 'பார்வைகள்'})}
          </Text>
        </View>
      </View>

      {/* Right side Overlay (Like, Share) */}
      <View style={styles.rightActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleLike}>
          <View style={styles.iconCircle}>
            <Text style={{fontSize: 26}}>{liked ? '❤️' : '🤍'}</Text>
          </View>
          <Text style={styles.actionText}>{likeCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <View style={styles.iconCircle}>
            <Text style={{fontSize: 24}}>➡️</Text>
          </View>
          <Text style={styles.actionText}>
            {t('common.share', {defaultValue: 'பகிர்'})}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom overlay (Farmer Name, Location, Description, Mute Toggle) */}
      <View style={styles.bottomOverlay}>
        <View style={styles.farmerDetailContainer}>
          <View style={styles.farmerProfileRow}>
            <AvatarView
              uri={item.avatar || item.photoURL}
              name={fName}
              size={42}
              style={styles.avatarBorder}
            />
            <View style={styles.farmerTextCol}>
              <Text style={styles.farmerName}>{fName} ✅</Text>
              <Text style={styles.farmerLoc}>
                📍 {item.location || 'Tamil Nadu'}
              </Text>
            </View>
          </View>
          <Text style={styles.reelDesc} numberOfLines={2}>
            {item.farmName ? `${item.farmName} - ` : ''}
            {t('reels.slogan', {
              defaultValue: 'Fresh from our farm straight to your table!',
            })}
          </Text>
        </View>

        {/* Sound toggle button */}
        <TouchableOpacity style={styles.muteBtn} onPress={toggleMute}>
          <Text style={{fontSize: 22}}>{isMuted ? '🔇' : '🔊'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ReelsScreen = () => {
  const {t} = useTranslation();
  const [farmers, setFarmers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const isScreenFocused = useIsFocused();

  const fetchReels = async () => {
    try {
      const {getAllFarmStories} = require('../../services/firebase');
      const res = await getAllFarmStories();
      if (res.success && res.data) {
        setFarmers(res.data);
      }
    } catch (e) {
      console.log('Error fetching reels:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isScreenFocused) {
      fetchReels();
    }
  }, [isScreenFocused]);

  const handleViewableItemsChanged = useRef(({viewableItems}) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 80, // Video counts as active when 80% visible
  }).current;

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
        <Text style={{marginTop: 10, color: COLORS.textSecondary}}>
          {t('common.loading', {defaultValue: 'Loading Reels...'})}
        </Text>
      </View>
    );
  }

  if (farmers.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={{fontSize: 56, marginBottom: 15}}>🎬</Text>
        <Text style={styles.emptyTitle}>
          {t('reels.noReelsTitle', {defaultValue: 'ரீல்ஸ் இன்னும் இல்லை'})}
        </Text>
        <Text style={styles.emptySub}>
          {t('reels.noReelsSub', {
            defaultValue:
              'விவசாயிகள் விரைவில் தங்கள் பண்ணை வீடியோக்களை பதிவேற்றுவர்!',
          })}
        </Text>
        <TouchableOpacity style={styles.refreshBtn} onPress={fetchReels}>
          <Text style={styles.refreshTxt}>
            🔄 {t('common.refresh', {defaultValue: 'புதுப்பி'})}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <FlatList
        data={farmers}
        keyExtractor={item => item.id}
        renderItem={({item, index}) => (
          <ReelItem
            item={item}
            index={index}
            activeIndex={activeIndex}
            isMuted={isMuted}
            toggleMute={toggleMute}
            isScreenFocused={isScreenFocused}
          />
        )}
        pagingEnabled={true}
        snapToInterval={SCREEN_HEIGHT}
        snapToAlignment="start"
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONTS.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  emptySub: {
    fontSize: FONTS.sm,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  refreshBtn: {
    backgroundColor: COLORS.primaryGreen,
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    paddingHorizontal: 24,
    ...SHADOWS.small,
  },
  refreshTxt: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: FONTS.md,
  },
  reelContainer: {
    width: width,
    height: SCREEN_HEIGHT,
    position: 'relative',
    backgroundColor: '#000',
  },
  errorVideo: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 250,
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  topHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 55 : 45,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  popularBadge: {
    backgroundColor: '#E65100',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  popularText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 11,
  },
  viewsBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  viewsText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '600',
  },
  rightActions: {
    position: 'absolute',
    right: SPACING.md,
    bottom: 120,
    alignItems: 'center',
    zIndex: 10,
  },
  actionBtn: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  actionText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: SPACING.md,
    left: SPACING.lg,
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  farmerDetailContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  farmerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  avatarBorder: {
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  farmerTextCol: {
    marginLeft: SPACING.sm,
  },
  farmerName: {
    color: COLORS.white,
    fontSize: FONTS.md,
    fontWeight: 'bold',
  },
  farmerLoc: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  reelDesc: {
    color: COLORS.white,
    fontSize: FONTS.sm,
    lineHeight: 20,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: {width: 1, height: 1},
    textShadowRadius: 3,
  },
  muteBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    marginBottom: 4,
  },
});

export default ReelsScreen;
