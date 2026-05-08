// ============================================================
// src/screens/consumer/QRScanScreen.js
// ✅ FIX: Camera permission crash - uses PermissionsAndroid
// ✅ FIX: QR code lookup improved for Farmer matching
// ============================================================

import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity,
    Alert, Dimensions, ActivityIndicator, Platform,
    PermissionsAndroid,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTranslation } from 'react-i18next';
import firestore from '@react-native-firebase/firestore';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../utils/theme';

const { width, height } = Dimensions.get('window');
const scale = width / 375;
const rs = size => Math.round(size * scale);

// ✅ Safe dynamic import for Camera
let CameraComponent = null;

const QRScanScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [isSearching, setIsSearching] = useState(false);
    const [scanned, setScanned] = useState(false);
    const [hasPermission, setHasPermission] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);

    useEffect(() => {
        const initCamera = async () => {
            try {
                // ✅ FIX: Use PermissionsAndroid instead of Camera.checkDeviceCameraAuthorizationStatus
                if (Platform.OS === 'android') {
                    const granted = await PermissionsAndroid.request(
                        PermissionsAndroid.PERMISSIONS.CAMERA,
                        {
                            title: t('qr.cameraPermTitle', { defaultValue: 'கேமரா அனுமதி தேவை' }),
                            message: t('qr.cameraPermMsg', { defaultValue: 'QR குறியீட்டை ஸ்கேன் செய்ய கேமரா அனுமதி தேவை' }),
                            buttonNeutral: 'Ask Later',
                            buttonNegative: 'Cancel',
                            buttonPositive: 'OK',
                        },
                    );
                    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                        setHasPermission(true);
                    } else {
                        setPermissionDenied(true);
                        return;
                    }
                } else {
                    // iOS - try Camera kit's method safely
                    setHasPermission(true);
                }

                // ✅ Safe load Camera component
                try {
                    const cameraKit = require('react-native-camera-kit');
                    CameraComponent = cameraKit.Camera || cameraKit.default;
                    setCameraReady(true);
                } catch (e) {
                    console.log('Camera kit load error:', e.message);
                    setCameraReady(false);
                }
            } catch (e) {
                console.log('Camera init error:', e.message);
                setPermissionDenied(true);
            }
        };
        initCamera();
    }, []);

    const onReadCode = async (event) => {
        if (scanned || isSearching) return;
        
        const code = event.nativeEvent.codeStringValue;
        if (!code) return;

        setScanned(true);
        setIsSearching(true);
        await verifyQRCode(code);
    };

    const verifyQRCode = async code => {
        try {
            const trimmed = code.trim().toUpperCase();

            // Strategy 1: Search by qrCode field in farmers
            let snap = await firestore()
                .collection('farmers')
                .where('qrCode', '==', trimmed)
                .get();

            // Strategy 2: Search by qrCode in users collection
            if (snap.empty) {
                snap = await firestore()
                    .collection('users')
                    .where('qrCode', '==', trimmed)
                    .get();
            }

            // Strategy 3: Direct doc lookup by extracted ID
            let farmerResult = null;
            if (snap.empty && trimmed.startsWith('F2C-FARMER-')) {
                const farmerId = trimmed.replace('F2C-FARMER-', '');
                
                // Try full ID first
                const docRef = await firestore().collection('farmers').doc(farmerId).get();
                if (docRef.exists) {
                    farmerResult = { id: docRef.id, ...docRef.data() };
                } else {
                    const userRef = await firestore().collection('users').doc(farmerId).get();
                    if (userRef.exists) {
                        farmerResult = { id: userRef.id, ...userRef.data() };
                    }
                }

                // Try matching partial IDs - farmers might have longer UIDs
                if (!farmerResult) {
                    const farmersSnap = await firestore().collection('farmers').get();
                    for (const doc of farmersSnap.docs) {
                        const docQr = doc.data().qrCode || '';
                        if (docQr === trimmed || doc.id.toUpperCase().startsWith(farmerId)) {
                            farmerResult = { id: doc.id, ...doc.data() };
                            break;
                        }
                    }
                }
            }

            // Strategy 4: Try as raw document ID
            if (snap.empty && !farmerResult) {
                const docRef = await firestore().collection('farmers').doc(trimmed).get();
                if (docRef.exists) {
                    farmerResult = { id: docRef.id, ...docRef.data() };
                }
            }

            // Strategy 5: Also try case-insensitive qrCode match
            if (snap.empty && !farmerResult) {
                const allFarmers = await firestore().collection('farmers').get();
                for (const doc of allFarmers.docs) {
                    const qr = (doc.data().qrCode || '').toUpperCase();
                    if (qr === trimmed) {
                        farmerResult = { id: doc.id, ...doc.data() };
                        break;
                    }
                }
            }

            if (!snap.empty && !farmerResult) {
                const doc = snap.docs[0];
                farmerResult = { id: doc.id, ...doc.data() };
            }

            setIsSearching(false);

            if (farmerResult) {
                // ✅ Navigate to Farmer Details screen with full farmer data
                navigation.replace('FarmerProfile', { farmer: farmerResult });
            } else {
                Alert.alert(
                    '❌ ' + t('qr.notFound', { defaultValue: 'Not Found' }),
                    t('qr.notFoundMsg', { defaultValue: 'This QR Code is not registered in F2C. Please verify with the farmer.' }),
                    [{ text: 'OK', onPress: () => setScanned(false) }]
                );
            }
        } catch (e) {
            setIsSearching(false);
            Alert.alert(t('common.error', { defaultValue: 'Error' }), e.message, [{ text: 'OK', onPress: () => setScanned(false) }]);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#0D5C32', '#1B8A4E']} style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <View style={styles.backIconWrap}>
                        <Text style={styles.backIcon}>‹</Text>
                    </View>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>📷 {t('qr.title', { defaultValue: 'QR Scan' })}</Text>
                <View style={{ width: 40 }} />
            </LinearGradient>

            <View style={styles.cameraContainer}>
                {isSearching ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
                        <Text style={styles.loadingText}>
                            {t('qr.verifying', { defaultValue: 'Verifying...' })}
                        </Text>
                    </View>
                ) : permissionDenied ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.permDeniedIcon}>📷</Text>
                        <Text style={styles.permDeniedTitle}>
                            {t('qr.permissionDenied', { defaultValue: 'Camera Permission Required' })}
                        </Text>
                        <Text style={styles.permDeniedMsg}>
                            {t('qr.permissionDeniedMsg', { defaultValue: 'Please grant camera permission in Settings to scan QR codes.' })}
                        </Text>
                    </View>
                ) : !hasPermission ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
                        <Text style={styles.loadingText}>
                            {t('qr.requestPermission', { defaultValue: 'Requesting camera permission...' })}
                        </Text>
                    </View>
                ) : cameraReady && CameraComponent ? (
                    <CameraComponent
                        style={styles.camera}
                        cameraType={'back'}
                        scanBarcode={true}
                        onReadCode={onReadCode}
                        showFrame={true}
                        laserColor={COLORS.primaryGreen}
                        frameColor={COLORS.white}
                    />
                ) : (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primaryGreen} />
                        <Text style={styles.loadingText}>
                            {t('qr.loadingCamera', { defaultValue: 'Loading camera...' })}
                        </Text>
                    </View>
                )}
                
                {!isSearching && hasPermission && cameraReady && (
                    <View style={styles.overlay}>
                        <Text style={styles.overlayText}>
                            {t('qr.scanHint', { defaultValue: 'Scan the farmer\'s QR code' })}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { paddingTop: rs(50), paddingBottom: rs(16), paddingHorizontal: SPACING.xl, flexDirection: 'row', alignItems: 'center' },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    backIconWrap: {
        width: rs(32), height: rs(32), borderRadius: rs(10),
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center', justifyContent: 'center',
    },
    backIcon: { color: COLORS.white, fontSize: rs(22), fontWeight: 'bold', marginTop: -2 },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: rs(FONTS.xl), fontWeight: 'bold', color: COLORS.white },
    cameraContainer: { flex: 1, backgroundColor: COLORS.black, position: 'relative' },
    camera: { flex: 1 },
    overlay: {
        position: 'absolute',
        bottom: 50,
        left: 0,
        right: 0,
        alignItems: 'center'
    },
    overlayText: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: COLORS.white,
        paddingHorizontal: SPACING.xl,
        paddingVertical: SPACING.md,
        borderRadius: RADIUS.full,
        fontSize: rs(FONTS.md),
        overflow: 'hidden'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.white
    },
    loadingText: {
        marginTop: SPACING.md,
        fontSize: rs(FONTS.md),
        color: COLORS.primaryGreen,
        fontWeight: 'bold'
    },
    permDeniedIcon: { fontSize: rs(64), marginBottom: SPACING.lg },
    permDeniedTitle: {
        fontSize: rs(FONTS.lg), fontWeight: 'bold',
        color: COLORS.textPrimary, marginBottom: SPACING.sm,
    },
    permDeniedMsg: {
        fontSize: rs(FONTS.sm), color: COLORS.textMuted,
        textAlign: 'center', paddingHorizontal: SPACING.xxl,
        lineHeight: rs(22),
    },
});

export default QRScanScreen;
