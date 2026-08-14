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
        <Tab.Screen name="Dashboard" component={TransporterDashboardScreen}
          options={{ tabBarLabel: 'My Cargo', tabBarIcon: () => <Text>🚛</Text> }} />
      ) : (
        <Tab.Screen name="Book" component={MerchantBookingScreen}
          options={{ tabBarLabel: 'Book', tabBarIcon: () => <Text>📦</Text> }} />
      )}
      <Tab.Screen name="Tracking" component={TrackingScreen}
        options={{ tabBarLabel: 'Shipments', tabBarIcon: () => <Text>🔍</Text> }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarLabel: 'Profile', tabBarIcon: () => <Text>👤</Text> }} />
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
