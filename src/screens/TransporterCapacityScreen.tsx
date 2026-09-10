import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { api } from '../api/client';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';

const ROUTES = [
  { code: 'KLA_NBO', label: 'Kampala → Nairobi' },
  { code: 'DAR_NBO', label: 'Dar es Salaam → Nairobi' },
  { code: 'MBA_KLA', label: 'Mombasa → Kampala' },
  { code: 'NBO_KLA', label: 'Nairobi → Kampala' },
  { code: 'NBO_DAR', label: 'Nairobi → Dar es Salaam' },
  { code: 'KLA_DAR', label: 'Kampala → Dar es Salaam' },
  { code: 'DAR_KLA', label: 'Dar es Salaam → Kampala' },
];

const HUBS: Record<string, { origin: string; destination: string }> = {
  KLA_NBO: { origin: 'Kikuubo Commercial Complex, Kampala', destination: 'Eastleigh Section 4, Nairobi' },
  DAR_NBO: { origin: 'Kariakoo Market, Dar es Salaam', destination: 'Eastleigh Section 4, Nairobi' },
  MBA_KLA: { origin: 'Kongowea Market, Mombasa', destination: 'Kikuubo Commercial Complex, Kampala' },
  NBO_KLA: { origin: 'Eastleigh Section 4, Nairobi', destination: 'Kikuubo Commercial Complex, Kampala' },
  NBO_DAR: { origin: 'Eastleigh Section 4, Nairobi', destination: 'Kariakoo Market, Dar es Salaam' },
  KLA_DAR: { origin: 'Kikuubo Commercial Complex, Kampala', destination: 'Kariakoo Market, Dar es Salaam' },
  DAR_KLA: { origin: 'Kariakoo Market, Dar es Salaam', destination: 'Kikuubo Commercial Complex, Kampala' },
};

export function TransporterCapacityScreen() {
  const [form, setForm] = useState({
    vehiclePlateNumber: '',
    routeCode: 'KLA_NBO',
    maxWeightKg: '',
    maxVolumeM3: '',
    departureDate: '',
    negotiatedRatePerKg: '',
  });
  const [loading, setLoading] = useState(false);
  const [showRouteSelector, setShowRouteSelector] = useState(false);

  const selectedRoute = ROUTES.find(r => r.code === form.routeCode) ?? ROUTES[0]!;
  const hubs = HUBS[form.routeCode] ?? HUBS['KLA_NBO']!;

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.vehiclePlateNumber || !form.maxWeightKg || !form.maxVolumeM3 || !form.departureDate) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(form.departureDate)) {
      Alert.alert('Invalid date', 'Please enter date in YYYY-MM-DD format');
      return;
    }

    setLoading(true);
    try {
      const result = await api.createCapacity({
        vehiclePlateNumber: form.vehiclePlateNumber.toUpperCase(),
        routeCode: form.routeCode,
        maxWeightKg: form.maxWeightKg,
        maxVolumeM3: form.maxVolumeM3,
        departureDate: new Date(form.departureDate + 'T06:00:00Z').toISOString(),
        negotiatedRateCents: Math.round(parseFloat(form.negotiatedRatePerKg || '150') * 100),
        originHub: hubs.origin,
        destinationHub: hubs.destination,
      }) as { vehiclePlateNumber: string; routeCode: string };

      Alert.alert(
        '✅ Capacity Registered!',
        `Vehicle ${result.vehiclePlateNumber} registered for ${selectedRoute.label}.\n\nTraders can now book space on your vehicle. Check My Cargo tab to see assigned consignments.`,
        [{ text: 'OK', onPress: () => setForm({ vehiclePlateNumber: '', routeCode: 'KLA_NBO', maxWeightKg: '', maxVolumeM3: '', departureDate: '', negotiatedRatePerKg: '' }) }]
      );
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to register capacity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Register Vehicle</Text>
        <Text style={s.headerSubtitle}>Add capacity for EAC consolidation</Text>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Text style={s.label}>CORRIDOR *</Text>
        <TouchableOpacity style={s.routeBtn} onPress={() => setShowRouteSelector(!showRouteSelector)}>
          <Text style={s.routeBtnText}>{selectedRoute.label}</Text>
          <Text style={s.chevron}>{showRouteSelector ? '▲' : '▼'}</Text>
        </TouchableOpacity>
        {showRouteSelector && (
          <View style={s.dropdown}>
            {ROUTES.map(r => (
              <TouchableOpacity key={r.code} style={[s.dropdownItem, r.code === form.routeCode && s.dropdownItemActive]}
                onPress={() => { update('routeCode', r.code); setShowRouteSelector(false); }}>
                <Text style={[s.dropdownText, r.code === form.routeCode && s.dropdownTextActive]}>{r.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {[
          { label: 'VEHICLE PLATE NUMBER *', key: 'vehiclePlateNumber', placeholder: 'e.g. UAR 123T', caps: true },
          { label: 'MAX WEIGHT CAPACITY (kg) *', key: 'maxWeightKg', placeholder: 'e.g. 3500', kb: 'decimal-pad' },
          { label: 'MAX VOLUME CAPACITY (m³) *', key: 'maxVolumeM3', placeholder: 'e.g. 28', kb: 'decimal-pad' },
          { label: 'DEPARTURE DATE * (YYYY-MM-DD)', key: 'departureDate', placeholder: '2026-09-15' },
          { label: 'RATE PER KG (KES)', key: 'negotiatedRatePerKg', placeholder: '150', kb: 'decimal-pad' },
        ].map(f => (
          <View key={f.key}>
            <Text style={s.label}>{f.label}</Text>
            <TextInput
              style={s.input}
              value={form[f.key as keyof typeof form]}
              onChangeText={v => update(f.key, f.caps ? v.toUpperCase() : v)}
              placeholder={f.placeholder}
              placeholderTextColor={Colors.slateDark}
              keyboardType={f.kb as any ?? 'default'}
              autoCapitalize={f.caps ? 'characters' : 'none'}
            />
          </View>
        ))}

        <View style={s.hubsCard}>
          <Text style={s.hubsTitle}>🗺️ Route Details</Text>
          <Text style={s.hubLabel}>ORIGIN HUB</Text>
          <Text style={s.hubValue}>{hubs.origin}</Text>
          <Text style={s.hubLabel}>DESTINATION HUB</Text>
          <Text style={s.hubValue}>{hubs.destination}</Text>
        </View>

        <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={() => void handleSubmit()} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Register Vehicle Capacity</Text>}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.slateLight },
  header: { backgroundColor: Colors.navy, paddingTop: 48, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.xl },
  headerTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['2xl'], color: Colors.textOnDark },
  headerSubtitle: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.slateDark, marginTop: 4 },
  scroll: { flex: 1 },
  content: { padding: Spacing.lg },
  label: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs, color: Colors.textSecondary, letterSpacing: 0.8, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.slateMid, borderRadius: BorderRadius.md, padding: Spacing.md, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.base, color: Colors.textPrimary },
  routeBtn: { backgroundColor: Colors.navy, borderRadius: BorderRadius.md, padding: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  routeBtnText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base, color: Colors.textOnDark },
  chevron: { color: Colors.orange },
  dropdown: { backgroundColor: Colors.navy, borderRadius: BorderRadius.md, marginTop: 4, overflow: 'hidden' },
  dropdownItem: { padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.navyLight },
  dropdownItemActive: { backgroundColor: Colors.orange },
  dropdownText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.base, color: Colors.textOnDark },
  dropdownTextActive: { color: '#fff' },
  hubsCard: { backgroundColor: Colors.navy, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginTop: Spacing.lg },
  hubsTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.base, color: Colors.textOnDark, marginBottom: Spacing.md },
  hubLabel: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs, color: Colors.slateDark, letterSpacing: 0.6, marginTop: Spacing.sm },
  hubValue: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textOnDark, marginTop: 2 },
  btn: { backgroundColor: Colors.orange, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.xl },
  btnDisabled: { backgroundColor: Colors.slateDark },
  btnText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.base, color: '#fff' },
});
