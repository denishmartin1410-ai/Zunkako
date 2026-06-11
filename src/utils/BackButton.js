// ============================================================
// src/utils/BackButton.js
// ✅ Premium back button component - used across all screens
// ============================================================

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {COLORS} from './theme';

const {width} = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

const BackButton = ({onPress, style}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[styles.backBtn, style]}
    activeOpacity={0.7}>
    <View style={styles.backIconWrap}>
      <Text style={styles.backIcon}>‹</Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  backBtn: {width: rs(40), height: rs(40), justifyContent: 'center'},
  backIconWrap: {
    width: rs(34),
    height: rs(34),
    borderRadius: rs(11),
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: COLORS.white,
    fontSize: rs(24),
    fontWeight: 'bold',
    marginTop: -2,
  },
});

export default BackButton;
