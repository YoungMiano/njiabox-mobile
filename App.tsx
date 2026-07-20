// =============================================================================
// NjiaBox Mobile – App.tsx
// Root navigation shell — tab navigator with Merchant Booking and
// Transporter Dashboard. Loads Inter font and handles splash screen.
// =============================================================================

import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

import { MerchantBookingScreen } from './src/screens/MerchantBookingScreen';
import { TransporterDashboardScreen } from './src/screens/TransporterDashboardScreen';
import { Colors, Typography } from './src/theme';

// ── Keep splash screen visible until fonts are loaded ────────────────────────
SplashScreen.preventAutoHideAsync().catch(() => {
  // suppressWarning: may already be hidden in some environments
});

const Tab = createBottomTabNavigator();

// ── Tab icon component — simple text emoji, no external icon dependency ───────
function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }): React.JSX.Element {
  return (
    <Text style={[tabIconStyles.icon, focused && tabIconStyles.focused]}>
      {emoji}
    </Text>
  );
}

const tabIconStyles = StyleSheet.create({
  icon: { fontSize: 22, opacity: 0.6 },
  focused: { opacity: 1 },
});

// ── Root App component ────────────────────────────────────────────────────────

export default function App(): React.JSX.Element | null {
  const [appReady, setAppReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      setAppReady(true);
    }
  }, [fontsLoaded, fontError]);

  const onLayoutRootView = useCallback(async () => {
    if (appReady) {
      await SplashScreen.hideAsync();
    }
  }, [appReady]);

  // Return null keeps the splash screen visible while fonts load
  if (!appReady) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: Colors.navy,
              borderTopColor: Colors.navyLight,
              borderTopWidth: 1,
              height: 64,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarActiveTintColor: Colors.orange,
            tabBarInactiveTintColor: Colors.slateDark,
            tabBarLabelStyle: {
              fontFamily: Typography.fontFamily.semiBold,
              fontSize: Typography.fontSize.xs,
              letterSpacing: 0.3,
            },
          }}
        >
          <Tab.Screen
            name="Book"
            component={MerchantBookingScreen}
            options={{
              tabBarLabel: 'Book Shipment',
              tabBarIcon: ({ focused }) => (
                <TabIcon emoji="📦" focused={focused} />
              ),
            }}
          />
          <Tab.Screen
            name="Dashboard"
            component={TransporterDashboardScreen}
            options={{
              tabBarLabel: 'My Cargo',
              tabBarIcon: ({ focused }) => (
                <TabIcon emoji="🚛" focused={focused} />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
