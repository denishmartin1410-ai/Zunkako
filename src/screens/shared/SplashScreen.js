import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated, Dimensions} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS, FONTS} from '../../utils/theme';

const {width, height} = Dimensions.get('window');

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.7)).current;
  const leafAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(leafAnim, {
        toValue: 1,
        duration: 1200,
        delay: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim, leafAnim]);

  return (
    <LinearGradient colors={COLORS.gradientHero} style={styles.container}>
      {/* Decorative circles */}
      <View style={styles.circleTop} />
      <View style={styles.circleBottom} />

      <Animated.View
        style={[
          styles.content,
          {opacity: fadeAnim, transform: [{scale: scaleAnim}]},
        ]}>
        {/* Logo */}
        <View style={styles.logoBox}>
          <Text style={styles.logoEmoji}>🌿</Text>
          <View style={styles.logoTextRow}>
            <Text style={styles.logoF}>F</Text>
            <Text style={styles.logoSeparator}>2</Text>
            <Text style={styles.logoC}>C</Text>
          </View>
        </View>

        <Animated.View style={{opacity: leafAnim}}>
          <Text style={styles.tagline}>விவசாயியிடமிருந்து நேரடியாக</Text>
          <Text style={styles.taglineEn}>Farm to Consumer</Text>
        </Animated.View>
      </Animated.View>

      {/* Bottom decorative dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2, 3, 4].map(i => (
          <View key={i} style={[styles.dot, i === 2 && styles.dotActive]} />
        ))}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  circleTop: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  circleBottom: {
    position: 'absolute',
    bottom: -100,
    left: -60,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  content: {alignItems: 'center'},
  logoBox: {alignItems: 'center', marginBottom: 24},
  logoEmoji: {fontSize: 64, marginBottom: 8},
  logoTextRow: {flexDirection: 'row', alignItems: 'center'},
  logoF: {fontSize: 52, fontWeight: '900', color: '#AAFFBB', letterSpacing: 2},
  logoSeparator: {
    fontSize: 40,
    fontWeight: '300',
    color: 'rgba(255,255,255,0.6)',
    marginHorizontal: 4,
  },
  logoC: {fontSize: 52, fontWeight: '900', color: '#AAD4FF', letterSpacing: 2},
  tagline: {
    fontSize: FONTS.lg,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    fontWeight: FONTS.medium,
    marginBottom: 6,
  },
  taglineEn: {
    fontSize: FONTS.sm,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 50,
    flexDirection: 'row',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dotActive: {width: 20, backgroundColor: 'rgba(255,255,255,0.8)'},
});

export default SplashScreen;
