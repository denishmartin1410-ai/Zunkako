import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Product upload
export const addProduct = async (farmerId, productData, imageUri) => {
    try {
        // Step 1: Image upload
        const filename = `products/${farmerId}_${Date.now()}.jpg`;
        const storageRef = storage().ref(filename);
        await storageRef.putFile(imageUri);
        const imageURL = await storageRef.getDownloadURL();

        // Step 2: Database save
        await firestore().collection('products').add({
            ...productData,
            farmerId,
            image: imageURL,
            createdAt: firestore.FieldValue.serverTimestamp(),
        });

        return { success: true };
    } catch (error) {
        return { success: false, error };
    }
};

// Farmer orders fetch
export const getFarmerOrders = async (farmerId) => {
    const snapshot = await firestore()
        .collection('orders')
        .where('farmerId', '==', farmerId)
        .orderBy('createdAt', 'desc')
        .get();

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    }));
};

// Dashboard stats
export const getFarmerStats = async (farmerId) => {
    const ordersSnap = await firestore()
        .collection('orders')
        .where('farmerId', '==', farmerId)
        .where('status', '==', 'Delivered')
        .get();

    const totalSales = ordersSnap.docs.reduce(
        (sum, doc) => sum + doc.data().total, 0
    );

    const productsSnap = await firestore()
        .collection('products')
        .where('farmerId', '==', farmerId)
        .get();

    return {
        totalSales,
        totalOrders: ordersSnap.size,
        totalProducts: productsSnap.size,
    };
};