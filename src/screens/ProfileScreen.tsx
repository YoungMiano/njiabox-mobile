import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Platform } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';

export function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => void logout() },
    ]);
  };

  const roleEmoji: Record<string, string> = {
    Trader: '🛍️', Transporter: '🚛', Destination_Agent: '📦', Admin: '⚙️',
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.card}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{roleEmoji[user?.role ?? ''] ?? '👤'}</Text>
          </View>
          <Text style={s.name}>{user?.fullName}</Text>
          {user?.businessName && <Text style={s.business}>{user.businessName}</Text>}
          <View style={s.roleBadge}>
            <Text style={s.roleText}>{user?.role?.replace('_', ' ')}</Text>
          </View>
        </View>

        <View style={s.infoCard}>
          {[
            { label: 'Phone', value: user?.phoneNumber },
            { label: 'Currency', value: user?.baseCurrency },
            { label: 'Role', value: user?.role?.replace('_', ' ') },
          ].map(item => (
            <View key={item.label} style={s.infoRow}>
              <Text style={s.infoLabel}>{item.label}</Text>
              <Text style={s.infoValue}>{item.value}</Text>
            </View>
          ))}
        </View>

        <View style={s.infoCard}>
          <Text style={s.sectionTitle}>About NjiaBox</Text>
          <Text style={s.about}>
            EAC Cross-Border LTL Virtual Logistics Consolidation for East African Community trade corridors.
            Serving Kampala–Nairobi, Dar–Nairobi, and Mombasa–Kampala routes.
          </Text>
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>🚪 Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.slateLight },
  header: { backgroundColor: Colors.navy, paddingTop: 48, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.xl },
  headerTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['2xl'], color: Colors.textOnDark },
  content: { padding: Spacing.lg },
  card: { backgroundColor: Colors.navy, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md, ...Shadow.card },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.navyLight, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  avatarText: { fontSize: 40 },
  name: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.textOnDark, marginBottom: Spacing.xs },
  business: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.slateDark, marginBottom: Spacing.sm },
  roleBadge: { backgroundColor: Colors.orange, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full },
  roleText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs, color: '#fff', letterSpacing: 0.5 },
  infoCard: { backgroundColor: Colors.navy, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.card },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.navyLight },
  infoLabel: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.slateDark },
  infoValue: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, color: Colors.textOnDark },
  sectionTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.base, color: Colors.textOnDark, marginBottom: Spacing.sm },
  about: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.slateDark, lineHeight: 20 },
  logoutBtn: { backgroundColor: Colors.error, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.sm },
  logoutText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.base, color: '#fff' },
});
