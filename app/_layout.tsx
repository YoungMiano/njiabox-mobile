import { Tabs } from 'expo-router';
import { Colors } from '../src/theme';

export default function Layout() {
  return (
    <Tabs
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
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarLabel: 'Book Shipment', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{ tabBarLabel: 'My Cargo', tabBarIcon: () => null }}
      />
    </Tabs>
  );
}
