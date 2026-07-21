import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { MerchantBookingScreen } from './src/screens/MerchantBookingScreen';
import { TransporterDashboardScreen } from './src/screens/TransporterDashboardScreen';
import { Colors, Typography } from './src/theme';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }): React.JSX.Element {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.6 }}>{emoji}</Text>;
}

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: Colors.navy,
              borderTopColor: Colors.navyLight,
              height: 64,
              paddingBottom: 8,
              paddingTop: 8,
            },
            tabBarActiveTintColor: Colors.orange,
            tabBarInactiveTintColor: Colors.slateDark,
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
            },
          }}
        >
          <Tab.Screen
            name="Book"
            component={MerchantBookingScreen}
            options={{
              tabBarLabel: 'Book Shipment',
              tabBarIcon: ({ focused }) => <TabIcon emoji="📦" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Dashboard"
            component={TransporterDashboardScreen}
            options={{
              tabBarLabel: 'My Cargo',
              tabBarIcon: ({ focused }) => <TabIcon emoji="🚛" focused={focused} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
