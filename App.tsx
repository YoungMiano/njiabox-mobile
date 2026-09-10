import React, { useState } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { RegisterScreen } from './src/screens/RegisterScreen';
import { MerchantBookingScreen } from './src/screens/MerchantBookingScreen';
import { TransporterDashboardScreen } from './src/screens/TransporterDashboardScreen';
import { TransporterCapacityScreen } from './src/screens/TransporterCapacityScreen';
import { TrackingScreen } from './src/screens/TrackingScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { Colors } from './src/theme';

const Tab = createBottomTabNavigator();

function AppNavigator() {
  const { user, isLoading } = useAuth();
  const [showRegister, setShowRegister] = useState(false);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.navy }}>
        <ActivityIndicator color={Colors.orange} size="large" />
      </View>
    );
  }

  if (!user) {
    return showRegister
      ? <RegisterScreen onNavigateToLogin={() => setShowRegister(false)} />
      : <LoginScreen onNavigateToRegister={() => setShowRegister(true)} />;
  }

  const isTransporter = user.role === 'Transporter';

  const tabOpts = (label: string, emoji: string) => ({
    tabBarLabel: label,
    tabBarIcon: () => <Text>{emoji}</Text>,
  });

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: Colors.navy, borderTopColor: Colors.navyLight, height: 64, paddingBottom: 8, paddingTop: 8 },
        tabBarActiveTintColor: Colors.orange,
        tabBarInactiveTintColor: Colors.slateDark,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {isTransporter ? (
        <>
          <Tab.Screen name="MyCargo" component={TransporterDashboardScreen} options={tabOpts('My Cargo', '🚛')} />
          <Tab.Screen name="Register" component={TransporterCapacityScreen} options={tabOpts('Register', '➕')} />
        </>
      ) : (
        <Tab.Screen name="Book" component={MerchantBookingScreen} options={tabOpts('Book', '📦')} />
      )}
      <Tab.Screen name="Shipments" component={TrackingScreen} options={tabOpts('Shipments', '🔍')} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={tabOpts('Profile', '👤')} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
