import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { api } from '../api/client';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';

const STATUS_EMOJI: Record<string, string> = {
  Pending_In_Queue: '⏳',
  Assigned_To_Virtual_Container: '📦',
  Loaded_In_Transit: '🚛',
  At_Border: '🛂',
  Ready_For_Collection: '✅',
  Completed_Delivered: '🎉',
  Cancelled_Refunded: '❌',
};

const STATUS_COLOR: Record<string, string> = {
  Pending_In_Queue: Colors.warning,
  Assigned_To_Virtual_Container: Colors.info,
  Loaded_In_Transit: Colors.orange,
  At_Border: Colors.warning,
  Ready_For_Collection: Colors.success,
  Completed_Delivered: Colors.success,
  Cancelled_Refunded: Colors.error,
};

interface Consignment {
  id: string;
  trackingCode: string;
  routeCode: string;
  currentStatus: string;
  goodsDescription: string;
  chargeableWeightKg: string;
  quotedRateCents: number;
  quotedCurrency: string;
  createdAt: string;
  deliveredAt: string | null;
}

export function TrackingScreen() {
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const result = await api.listConsignments({ limit: 50 });
      setConsignments(result.items as Consignment[]);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to load shipments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { void load(); }, []);

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
        <Text style={s.headerTitle}>My Shipments</Text>
        <Text style={s.headerCount}>{consignments.length} total</Text>
      </View>

      <FlatList
        data={consignments}
        keyExtractor={item => item.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={Colors.orange} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📭</Text>
            <Text style={s.emptyText}>No shipments yet</Text>
            <Text style={s.emptySubtext}>Book your first shipment from the Book tab</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.trackingCode}>{item.trackingCode}</Text>
              <View style={[s.badge, { backgroundColor: STATUS_COLOR[item.currentStatus] ?? Colors.slateDark }]}>
                <Text style={s.badgeText}>
                  {STATUS_EMOJI[item.currentStatus]} {item.currentStatus.replace(/_/g, ' ')}
                </Text>
              </View>
            </View>
            <Text style={s.route}>{item.routeCode.replace('_', ' → ')}</Text>
            <Text style={s.goods} numberOfLines={1}>{item.goodsDescription}</Text>
            <View style={s.cardFooter}>
              <Text style={s.meta}>⚖️ {item.chargeableWeightKg} kg</Text>
              <Text style={s.cost}>
                {item.quotedCurrency} {(item.quotedRateCents / 100).toLocaleString()}
              </Text>
            </View>
          </View>
        )}
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  trackingCode: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.sm, color: Colors.orange },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.full },
  badgeText: { fontFamily: Typography.fontFamily.semiBold, fontSize: 10, color: '#fff' },
  route: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.base, color: Colors.textOnDark, marginBottom: Spacing.xs },
  goods: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.slateDark, marginBottom: Spacing.sm },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.slateDark },
  cost: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.base, color: Colors.orange },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.lg },
  emptyText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: Colors.navy, marginBottom: Spacing.sm },
  emptySubtext: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
});
