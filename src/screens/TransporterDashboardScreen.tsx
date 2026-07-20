// =============================================================================
// NjiaBox Mobile – TransporterDashboardScreen.tsx
// Milestone 5: Transporter cargo load optimization dashboard
//
// Features:
//   - Live Navy Blue (#0A192F) progress bars for weight and volume fill
//   - Per-consignment cargo manifest with goods descriptions
//   - Transit Safety Orange (#FF6B00) manifest download CTA
//   - Mobile Money Green (#10B981) escrow status indicators
//   - Offline-first: last known state cached locally, refresh on reconnect
//   - Status lifecycle visualization across the entire trip
// =============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ConsignmentSummary {
  id: string;
  trackingCode: string;
  traderName: string;
  goodsDescription: string;
  chargeableWeightKg: number;
  volumeM3: number;
  status: string;
  escrowState: 'Funds_Held' | 'Payout_Dispatched' | 'Refunded' | 'Disputed' | null;
}

interface CapacityData {
  id: string;
  vehiclePlateNumber: string;
  routeCode: string;
  routeLabel: string;
  originHub: string;
  destinationHub: string;
  departureDate: string;
  status: string;
  maxWeightKg: number;
  maxVolumeM3: number;
  allocatedWeightKg: number;
  allocatedVolumeM3: number;
  consignments: ConsignmentSummary[];
  borderCrossing: string;
}

// ── Mock data for the UI shell ────────────────────────────────────────────────
// In production these values arrive from GET /api/v1/transporter-capacities
// and GET /api/v1/transporter-capacities/:id/consignments.

const MOCK_CAPACITY: CapacityData = {
  id: 'cap-demo-001',
  vehiclePlateNumber: 'UAR 123T',
  routeCode: 'KLA_NBO',
  routeLabel: 'Kampala → Nairobi',
  originHub: 'Kikuubo Commercial Complex, Kampala',
  destinationHub: 'Eastleigh Section 4, Nairobi',
  departureDate: '2025-01-15T06:00:00Z',
  status: 'Collecting',
  maxWeightKg: 3500,
  maxVolumeM3: 28,
  allocatedWeightKg: 2240,
  allocatedVolumeM3: 18.4,
  borderCrossing: 'Malaba / Busia',
  consignments: [
    {
      id: 'c1',
      trackingCode: 'NJB-20250115-AB3K9',
      traderName: 'Amina Wanjiku – Wanjiku Textiles',
      goodsDescription: '3 bales mixed clothing — cotton shirts, kitenge fabric',
      chargeableWeightKg: 120,
      volumeM3: 0.84,
      status: 'Assigned_To_Virtual_Container',
      escrowState: 'Funds_Held',
    },
    {
      id: 'c2',
      trackingCode: 'NJB-20250115-XY9P2',
      traderName: 'Moses Ssebugwawo – Electronics',
      goodsDescription: '5 boxes mobile phone accessories — chargers, cases',
      chargeableWeightKg: 85,
      volumeM3: 0.42,
      status: 'Assigned_To_Virtual_Container',
      escrowState: 'Funds_Held',
    },
    {
      id: 'c3',
      trackingCode: 'NJB-20250115-MK7R1',
      traderName: 'Grace Kamau – Cosmetics Hub',
      goodsDescription: '12 cartons body lotion, skin cream — cosmetics',
      chargeableWeightKg: 210,
      volumeM3: 1.26,
      status: 'Assigned_To_Virtual_Container',
      escrowState: 'Funds_Held',
    },
  ],
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fillPct(allocated: number, max: number): number {
  if (max === 0) return 0;
  return Math.min((allocated / max) * 100, 100);
}

function fillColor(pct: number): string {
  if (pct >= 90) return Colors.success;
  if (pct >= 60) return Colors.orange;
  return Colors.navy;
}

function escrowBadgeStyle(state: ConsignmentSummary['escrowState']) {
  switch (state) {
    case 'Funds_Held': return { bg: Colors.success, label: '💰 Escrow Held' };
    case 'Payout_Dispatched': return { bg: Colors.info, label: '✅ Paid Out' };
    case 'Disputed': return { bg: Colors.error, label: '⚠️ Disputed' };
    case 'Refunded': return { bg: Colors.slateDark, label: '↩️ Refunded' };
    default: return { bg: Colors.slateDark, label: '— No Payment' };
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-KE', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ── CapacityBar component ─────────────────────────────────────────────────────

interface CapacityBarProps {
  label: string;
  allocated: number;
  max: number;
  unit: string;
}

function CapacityBar({ label, allocated, max, unit }: CapacityBarProps): React.JSX.Element {
  const pct = fillPct(allocated, max);
  const color = fillColor(pct);
  return (
    <View style={barStyles.container}>
      <View style={barStyles.header}>
        <Text style={barStyles.label}>{label}</Text>
        <Text style={barStyles.values}>
          {allocated.toFixed(1)} / {max.toFixed(1)} {unit}
        </Text>
      </View>
      <View style={barStyles.track}>
        <View
          style={[
            barStyles.fill,
            { width: `${pct}%` as `${number}%`, backgroundColor: color },
          ]}
        />
      </View>
      <Text style={[barStyles.pct, { color }]}>{pct.toFixed(1)}% full</Text>
    </View>
  );
}

const barStyles = StyleSheet.create({
  container: { marginBottom: Spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  label: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.xs,
    color: Colors.slateDark,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  values: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.textOnDark,
  },
  track: {
    height: 12,
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  pct: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.xs,
    textAlign: 'right',
  },
});

// ── Main Component ────────────────────────────────────────────────────────────

export function TransporterDashboardScreen(): React.JSX.Element {
  const [capacity] = useState<CapacityData>(MOCK_CAPACITY);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGeneratingManifest, setIsGeneratingManifest] = useState(false);
  const [expandedConsignment, setExpandedConsignment] = useState<string | null>(null);

  const weightPct = fillPct(capacity.allocatedWeightKg, capacity.maxWeightKg);
  const volumePct = fillPct(capacity.allocatedVolumeM3, capacity.maxVolumeM3);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    // In production: re-fetch GET /api/v1/transporter-capacities
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  }, []);

  const handleGenerateManifest = useCallback(async () => {
    setIsGeneratingManifest(true);
    try {
      // In production: POST /api/v1/transporter-capacities/:id/generate-manifest
      await new Promise((resolve) => setTimeout(resolve, 1500));
      Alert.alert(
        '📄 EAC Manifest Ready',
        'Your customs manifest has been generated and is ready for download.\n\nDocument number: NJB-MAN-20250115-AB3K9\n\nPresent this to the TIDO officer at Malaba / Busia.',
        [
          { text: 'Download PDF', onPress: () => Alert.alert('PDF', 'Opening PDF…') },
          { text: 'Share via WhatsApp', onPress: () => Alert.alert('WhatsApp', 'Opening…') },
          { text: 'Done', style: 'cancel' },
        ]
      );
    } catch {
      Alert.alert('Error', 'Failed to generate manifest. Please try again.');
    } finally {
      setIsGeneratingManifest(false);
    }
  }, []);

  const statusColor: Record<string, string> = {
    Collecting: Colors.orange,
    Locked: Colors.warning,
    In_Transit: Colors.info,
    Border_Clearing: Colors.warning,
    Arrived: Colors.success,
    Discharged: Colors.slateDark,
  };

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerPlate}>{capacity.vehiclePlateNumber}</Text>
            <Text style={styles.headerRoute}>{capacity.routeLabel}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor[capacity.status] ?? Colors.slateDark },
            ]}
          >
            <Text style={styles.statusBadgeText}>{capacity.status}</Text>
          </View>
        </View>

        <View style={styles.headerMeta}>
          <Text style={styles.headerMetaText}>
            🕐 Departure: {formatDate(capacity.departureDate)}
          </Text>
          <Text style={styles.headerMetaText}>
            🛂 Border: {capacity.borderCrossing}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => void handleRefresh()}
            tintColor={Colors.orange}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* ── Capacity fill bars ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cargo Load Status</Text>
          <CapacityBar
            label="Weight"
            allocated={capacity.allocatedWeightKg}
            max={capacity.maxWeightKg}
            unit="kg"
          />
          <CapacityBar
            label="Volume"
            allocated={capacity.allocatedVolumeM3}
            max={capacity.maxVolumeM3}
            unit="m³"
          />

          <View style={styles.fillSummary}>
            <View style={styles.fillSummaryItem}>
              <Text style={styles.fillSummaryNum}>{capacity.consignments.length}</Text>
              <Text style={styles.fillSummaryLabel}>Consignments</Text>
            </View>
            <View style={styles.fillSummaryItem}>
              <Text style={[styles.fillSummaryNum, { color: fillColor(weightPct) }]}>
                {weightPct.toFixed(0)}%
              </Text>
              <Text style={styles.fillSummaryLabel}>Weight Fill</Text>
            </View>
            <View style={styles.fillSummaryItem}>
              <Text style={[styles.fillSummaryNum, { color: fillColor(volumePct) }]}>
                {volumePct.toFixed(0)}%
              </Text>
              <Text style={styles.fillSummaryLabel}>Volume Fill</Text>
            </View>
          </View>
        </View>

        {/* ── Route detail ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Trip Details</Text>
          <View style={styles.routeDetail}>
            <View style={styles.routeDetailPoint}>
              <View style={[styles.routeDot, { backgroundColor: Colors.orange }]} />
              <View>
                <Text style={styles.routeDetailLabel}>ORIGIN</Text>
                <Text style={styles.routeDetailValue}>{capacity.originHub}</Text>
              </View>
            </View>
            <View style={styles.routeDetailLine} />
            <View style={styles.routeDetailPoint}>
              <View style={[styles.routeDot, { backgroundColor: Colors.success }]} />
              <View>
                <Text style={styles.routeDetailLabel}>DESTINATION</Text>
                <Text style={styles.routeDetailValue}>{capacity.destinationHub}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Consignment list ── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            Manifest ({capacity.consignments.length} items)
          </Text>
          {capacity.consignments.map((c) => {
            const escrow = escrowBadgeStyle(c.escrowState);
            const isExpanded = expandedConsignment === c.id;
            return (
              <TouchableOpacity
                key={c.id}
                style={styles.consignmentItem}
                onPress={() => setExpandedConsignment(isExpanded ? null : c.id)}
                accessibilityRole="button"
                accessibilityLabel={`Toggle details for ${c.trackingCode}`}
              >
                <View style={styles.consignmentHeader}>
                  <Text style={styles.trackingCode}>{c.trackingCode}</Text>
                  <View style={[styles.escrowBadge, { backgroundColor: escrow.bg }]}>
                    <Text style={styles.escrowBadgeText}>{escrow.label}</Text>
                  </View>
                </View>
                <Text style={styles.traderName}>{c.traderName}</Text>
                {isExpanded && (
                  <View style={styles.consignmentDetail}>
                    <Text style={styles.consignmentDetailText}>
                      📦 {c.goodsDescription}
                    </Text>
                    <View style={styles.consignmentMetaRow}>
                      <Text style={styles.consignmentMeta}>
                        ⚖️ {c.chargeableWeightKg} kg
                      </Text>
                      <Text style={styles.consignmentMeta}>
                        📐 {c.volumeM3.toFixed(3)} m³
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── EAC Manifest download CTA ── */}
        <TouchableOpacity
          style={[styles.manifestCta, isGeneratingManifest && styles.ctaDisabled]}
          onPress={() => void handleGenerateManifest()}
          disabled={isGeneratingManifest}
          accessibilityRole="button"
          accessibilityLabel="Generate and download EAC customs manifest"
        >
          {isGeneratingManifest ? (
            <ActivityIndicator color={Colors.textOnOrange} size="small" />
          ) : (
            <>
              <Text style={styles.manifestCtaIcon}>📄</Text>
              <View style={styles.manifestCtaText}>
                <Text style={styles.manifestCtaTitle}>Download EAC Manifest</Text>
                <Text style={styles.manifestCtaSubtitle}>
                  Simplified Certificate of Origin • Malaba / Busia
                </Text>
              </View>
              <Text style={styles.manifestCtaArrow}>→</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.slateLight,
  },
  header: {
    backgroundColor: Colors.navy,
    paddingTop: Platform.OS === 'ios' ? 56 : 32,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  headerPlate: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize['2xl'],
    color: Colors.textOnDark,
    letterSpacing: 1.2,
  },
  headerRoute: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.base,
    color: Colors.slateDark,
    marginTop: Spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  statusBadgeText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xs,
    color: Colors.textOnOrange,
    letterSpacing: 0.5,
  },
  headerMeta: { gap: Spacing.xs },
  headerMetaText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.slateDark,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg },
  card: {
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  cardTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.base,
    color: Colors.textOnDark,
    marginBottom: Spacing.lg,
    letterSpacing: 0.2,
  },
  fillSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    marginTop: Spacing.md,
  },
  fillSummaryItem: { alignItems: 'center' },
  fillSummaryNum: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize['2xl'],
    color: Colors.textOnDark,
  },
  fillSummaryLabel: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    color: Colors.slateDark,
    marginTop: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  routeDetail: { gap: Spacing.md },
  routeDetailPoint: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: BorderRadius.full,
    marginTop: 4,
    flexShrink: 0,
  },
  routeDetailLine: {
    width: 2,
    height: 24,
    backgroundColor: Colors.navyLight,
    marginLeft: 4,
  },
  routeDetailLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.xs,
    color: Colors.slateDark,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  routeDetailValue: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.textOnDark,
    marginTop: 2,
  },
  consignmentItem: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyLight,
  },
  consignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  trackingCode: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    color: Colors.orange,
    letterSpacing: 0.5,
  },
  escrowBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  escrowBadgeText: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.xs,
    color: Colors.textOnOrange,
  },
  traderName: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.slateDark,
  },
  consignmentDetail: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
  },
  consignmentDetailText: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.textOnDark,
    marginBottom: Spacing.sm,
  },
  consignmentMetaRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  consignmentMeta: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.xs,
    color: Colors.slateDark,
  },
  manifestCta: {
    backgroundColor: Colors.orange,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadow.elevated,
  },
  ctaDisabled: { backgroundColor: Colors.slateDark },
  manifestCtaIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
  },
  manifestCtaText: { flex: 1 },
  manifestCtaTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.base,
    color: Colors.textOnOrange,
  },
  manifestCtaSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    color: Colors.textOnOrange,
    opacity: 0.85,
    marginTop: 2,
  },
  manifestCtaArrow: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xl,
    color: Colors.textOnOrange,
  },
  bottomPadding: { height: 48 },
});
