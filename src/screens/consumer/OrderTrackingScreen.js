// OrderTrackingScreen.js
// Google Maps + Firebase Realtime Location
import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import MapView, {Marker, Polyline} from 'react-native-maps';
import database from '@react-native-firebase/database';

const OrderTrackingScreen = ({route}) => {
  const {orderId} = route.params;
  const [deliveryLocation, setDeliveryLocation] = useState(null);
  const [orderStatus, setOrderStatus] = useState('Confirmed');

  useEffect(() => {
    // Firebase Realtime Database - live location listen
    const ref = database().ref(`deliveries/${orderId}/location`);

    const onValueChange = ref.on('value', snapshot => {
      if (snapshot.val()) {
        setDeliveryLocation(snapshot.val());
      }
    });

    // Status listen
    const statusRef = database().ref(`orders/${orderId}/status`);
    statusRef.on('value', snap => {
      if (snap.val()) {
        setOrderStatus(snap.val());
      }
    });

    return () => {
      ref.off('value', onValueChange);
    };
  }, [orderId]);

  return (
    <View style={{flex: 1}}>
      <MapView
        style={{flex: 1}}
        initialRegion={{
          latitude: 11.0168,
          longitude: 76.9558,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}>
        {deliveryLocation && (
          <Marker
            coordinate={deliveryLocation}
            title="Delivery Boy"
            description="உங்கள் ஆர்டர் வருகிறது!"
          />
        )}
      </MapView>
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>Status: {orderStatus}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  statusBar: {
    padding: 20,
    backgroundColor: '#1B8A4E',
  },
  statusText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default OrderTrackingScreen;
