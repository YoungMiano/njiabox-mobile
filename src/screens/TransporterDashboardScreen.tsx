import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { api } from '../api/client';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';

interface Consignment {
  id: string;
  trackingCode: string;
  goodsDescription: string;
  chargeableWeightKg: string;
  currentStatus: string;
  traderId: string;
}

interface Capacity {
  id: string;
  vehiclePlateNumber: string;
  routeCode: string;
  status: string;
  maxWeightKg: string;
  maxVolumeM3: string;
  allocatedWeightKg: string;
  allocatedVolumeM3: string;
  departureDate: string;
  originHub: string;
  destinationHub: string;
  consignments?: Consignment[];
}

function fillPct(allocated: number, max: number): number {
  if (max === 0) return 0;
  return Math.min((allocated / max) * 100, 100);
}

function fillColor(pct: number): string {
  if (pct >= 80) return Colors.success;
  if (pct >= 50) return Colors.orange;
  return Colors.navy;
}

export function TransporterDashboardScreen() {
  const [capacities, setCapacities] = useState<Capacity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [runningBinPack, setRunningBinPack] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.listMyCapacities() as Capacity[];
      setCapacities(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load cargo data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleRunBinPack = async (capacityId: string) => {
    setRunningBinPack(capacityId);
    try {
      await api.runBinPack(capacityId);
      Alert.alert('✅ Done', 'Bin-packing complete. Pull to refresh to see assigned consignments.');
      void load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Bin-packing failed');
    } finally {
      setRunningBinPack(null);
    }
  };

  const handleGenerateManifest = async (capacityId: string) => {
    try {
      await api.generateManifest(capacityId);
      Alert.alert('📄 Manifest Ready', 'EAC customs manifest generated successfully.');
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to generate manifest');
    }
  };

  const statusColor: Record<string, string> = {
    Collecting: Colors.orange,
    Locked: Colors.warning,
    In_Transit: Colors.info,
    Border_Clearing: Colors.warning,
    Arrived: Colors.success,
    Discharged: Colors.slateDark,
  };

  if (loading) {
    return (
      <View style={[s.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={Colors.orange} size="large" />
      </View>
    );
  }

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.headerTitle}>My Cargo</Text>
        <Text style={s.headerCount}>{capacities.length} vehicle{capacities.length !== 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={capacities}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={Colors.orange} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🚛</Text>
            <Text style={s.emptyText}>No vehicles registered</Text>
            <Text style={s.emptySubtext}>Register your vehicle capacity from the Register tab</Text>
          </View>
        }
        renderItem={({ item }) => {
          const weightPct = fillPct(parseFloat(item.allocatedWeightKg), parseFloat(item.maxWeightKg));
          const volPct = fillPct(parseFloat(item.allocatedVolumeM3), parseFloat(item.maxVolumeM3));
          return (
            <View style={s.card}>
              <View style={s.cardHeader}>
                <Text style={s.plate}>{item.vehiclePlateNumber}</Text>
                <View style={[s.statusBadge, { backgroundColor: statusColor[item.status] ?? Colors.slateDark }]}>
                  <Text style={s.statusText}>{item.status}</Text>
                </View>
              </View>
              <Text style={s.route}>{item.routeCode.replace('_', ' → ')}</Text>
              <Text style={s.departure}>🕐 {new Date(item.departureDate).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}</Text>

              {/* Weight bar */}
              <View style={s.barRow}>
                <Text style={s.barLabel}>WEIGHT</Text>
                <Text style={s.barVal}>{parseFloat(item.allocatedWeightKg).toFixed(0)} / {parseFloat(item.maxWeightKg).toFixed(0)} kg</Text>
              </View>
              <View style={s.track}>
                <View style={[s.fill, { width: `${weightPct}%` as `${number}%`, backgroundColor: fillColor(weightPct) }]} />
              </View>

              {/* Volume bar */}
              <View style={s.barRow}>
                <Text style={s.barLabel}>VOLUME</Text>
                <Text style={s.barVal}>{parseFloat(item.allocatedVolumeM3).toFixed(1)} / {parseFloat(item.maxVolumeM3).toFixed(1)} m³</Text>
              </View>
              <View style={s.track}>
                <View style={[s.fill, { width: `${volPct}%` as `${number}%`, backgroundColor: fillColor(volPct) }]} />
              </View>

              {/* Actions */}
              <View style={s.actions}>
                <TouchableOpacity style={s.actionBtn} onPress={() => void handleRunBinPack(item.id)} disabled={runningBinPack === item.id}>
                  {runningBinPack === item.id
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.actionBtnText}>⚙️ Run Bin-Pack</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, s.manifestBtn]} onPress={() => void handleGenerateManifest(item.id)}>
                  <Text style={s.actionBtnText}>📄 Manifest</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.slateLight },
  header: { backgroundColor: Colors.navy, paddingTop: 48, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['2xl'], color: Colors.textOnDark },
  headerCount: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.slateDark },
  list: { padding: Spacing.lg },
  card: { backgroundColor: Colors.navy, borderRadius: BorderRadius.lg, padding: Spacing.lg, marginBottom: Spacing.md, ...Shadow.card },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  plate: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.xl, color: Colors.textOnDark, letterSpacing: 1 },
  statusBadge: { paddingHorizontal: Spacing.md, paddingVertical: 2, borderRadius: BorderRadius.full },
  statusText: { fontFamily: Typography.fontFamily.bold, fontSize: 10, color: '#fff' },
  route: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.base, color: Colors.orange, marginBottom: 2 },
  departure: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.slateDark, marginBottom: Spacing.md },
  barRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  barLabel: { fontFamily: Typography.fontFamily.semiBold, fontSize: 10, color: Colors.slateDark, letterSpacing: 0.6 },
  barVal: { fontFamily: Typography.fontFamily.medium, fontSize: 10, color: Colors.textOnDark },
  track: { height: 8, backgroundColor: Colors.navyLight, borderRadius: BorderRadius.full, overflow: 'hidden', marginBottom: Spacing.md },
  fill: { height: '100%', borderRadius: BorderRadius.full },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  actionBtn: { flex: 1, backgroundColor: Colors.orange, borderRadius: BorderRadius.md, padding: Spacing.sm, alignItems: 'center' },
  manifestBtn: { backgroundColor: Colors.navyLight },
  actionBtnText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.sm, color: '#fff' },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.lg },
  emptyText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: Colors.navy, marginBottom: Spacing.sm },
  emptySubtext: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl },
});
