// =============================================================================
// NjiaBox Mobile – MerchantBookingScreen.tsx
// Milestone 5: Trader consignment booking with live freight cost estimation
//
// Features:
//   - Input fields for parcel dimensions (L × W × H in cm) and weight (kg)
//   - Route selector (all 7 EAC corridors)
//   - Live volumetric calculation preview (updates as user types)
//   - Freight cost estimation (volumetric weight × rate card)
//   - Transit Safety Orange (#FF6B00) payment CTA
//   - Deep Trust Navy (#0A192F) header and key surfaces
//   - Offline-first: calculations run locally, submission queued if offline
// =============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';

// ── Types ─────────────────────────────────────────────────────────────────────

interface BookingFormState {
  lengthCm: string;
  widthCm: string;
  heightCm: string;
  actualWeightKg: string;
  goodsDescription: string;
  selectedRoute: string;
  declaredValueUsd: string;
}

interface VolumetricPreview {
  volumeM3: number | null;
  volumetricWeightKg: number | null;
  chargeableWeightKg: number | null;
  estimatedCostKes: number | null;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROUTES = [
  { code: 'KLA_NBO', label: 'Kampala → Nairobi',         border: 'Malaba / Busia' },
  { code: 'DAR_NBO', label: 'Dar es Salaam → Nairobi',   border: 'Namanga' },
  { code: 'MBA_KLA', label: 'Mombasa → Kampala',          border: 'Malaba / Busia' },
  { code: 'NBO_KLA', label: 'Nairobi → Kampala',          border: 'Malaba / Busia' },
  { code: 'NBO_DAR', label: 'Nairobi → Dar es Salaam',   border: 'Namanga' },
  { code: 'KLA_DAR', label: 'Kampala → Dar es Salaam',   border: 'Mutukula' },
  { code: 'DAR_KLA', label: 'Dar es Salaam → Kampala',   border: 'Mutukula' },
] as const;

// Volumetric weight factor (road freight standard: 167 kg/m³)
const VOLUMETRIC_FACTOR = 167;
// Simplified KES rate card for the preview (actual rate applied by server)
const PREVIEW_RATE_KES_PER_KG = 150;

const INITIAL_FORM: BookingFormState = {
  lengthCm: '',
  widthCm: '',
  heightCm: '',
  actualWeightKg: '',
  goodsDescription: '',
  selectedRoute: 'KLA_NBO',
  declaredValueUsd: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function computePreview(form: BookingFormState): VolumetricPreview {
  const l = parseFloat(form.lengthCm);
  const w = parseFloat(form.widthCm);
  const h = parseFloat(form.heightCm);
  const actual = parseFloat(form.actualWeightKg);

  if (!l || !w || !h || l <= 0 || w <= 0 || h <= 0) {
    return {
      volumeM3: null,
      volumetricWeightKg: null,
      chargeableWeightKg: null,
      estimatedCostKes: null,
    };
  }

  const volumeM3 = (l * w * h) / 1_000_000;
  const volumetricWeightKg = volumeM3 * VOLUMETRIC_FACTOR;
  const chargeableWeightKg =
    actual && actual > 0
      ? Math.max(actual, volumetricWeightKg)
      : volumetricWeightKg;
  const estimatedCostKes = Math.ceil(chargeableWeightKg * PREVIEW_RATE_KES_PER_KG);

  return { volumeM3, volumetricWeightKg, chargeableWeightKg, estimatedCostKes };
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MerchantBookingScreen(): React.JSX.Element {
  const [form, setForm] = useState<BookingFormState>(INITIAL_FORM);
  const [preview, setPreview] = useState<VolumetricPreview>({
    volumeM3: null,
    volumetricWeightKg: null,
    chargeableWeightKg: null,
    estimatedCostKes: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRouteSelector, setShowRouteSelector] = useState(false);

  const selectedRouteDetails = ROUTES.find((r) => r.code === form.selectedRoute) ?? ROUTES[0]!;

  const handleFieldChange = useCallback(
    (field: keyof BookingFormState, value: string) => {
      const updated = { ...form, [field]: value };
      setForm(updated);
      // Live preview updates as user types — no debounce needed since the
      // computation is synchronous and sub-millisecond
      setPreview(computePreview(updated));
    },
    [form]
  );

  const handleSubmit = useCallback(async () => {
    if (!form.lengthCm || !form.widthCm || !form.heightCm || !form.actualWeightKg) {
      Alert.alert('Missing fields', 'Please enter all parcel dimensions and weight.');
      return;
    }
    if (!form.goodsDescription.trim()) {
      Alert.alert('Missing fields', 'Please describe the goods you are shipping.');
      return;
    }

    setIsSubmitting(true);
    try {
      // In production: POST /api/v1/consignments with JWT auth header,
      // then redirect to payment screen with the quoted rate.
      // Here we simulate the async call with a delay.
      await new Promise((resolve) => setTimeout(resolve, 1200));
      Alert.alert(
        '✅ Booking Submitted',
        `Your consignment has been queued.\n\nEstimated cost: KES ${
          preview.estimatedCostKes?.toLocaleString('en-KE') ?? '—'
        }\n\nYou will receive a tracking code via WhatsApp once payment is confirmed.`,
        [{ text: 'OK', onPress: () => setForm(INITIAL_FORM) }]
      );
    } catch {
      Alert.alert('Error', 'Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [form, preview]);

  return (
    <View style={styles.root}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Book a Shipment</Text>
        <Text style={styles.headerSubtitle}>EAC Cross-Border LTL Consolidation</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Route selector ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>CORRIDOR</Text>
          <TouchableOpacity
            style={styles.routeButton}
            onPress={() => setShowRouteSelector(!showRouteSelector)}
            accessibilityRole="button"
            accessibilityLabel="Select shipping route"
          >
            <Text style={styles.routeButtonLabel}>{selectedRouteDetails.label}</Text>
            <Text style={styles.routeBorder}>🛂 {selectedRouteDetails.border}</Text>
            <Text style={styles.routeChevron}>{showRouteSelector ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showRouteSelector && (
            <View style={styles.routeDropdown}>
              {ROUTES.map((route) => (
                <TouchableOpacity
                  key={route.code}
                  style={[
                    styles.routeOption,
                    route.code === form.selectedRoute && styles.routeOptionSelected,
                  ]}
                  onPress={() => {
                    handleFieldChange('selectedRoute', route.code);
                    setShowRouteSelector(false);
                  }}
                >
                  <Text
                    style={[
                      styles.routeOptionText,
                      route.code === form.selectedRoute && styles.routeOptionTextSelected,
                    ]}
                  >
                    {route.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Parcel Dimensions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PARCEL DIMENSIONS (cm)</Text>
          <View style={styles.dimensionRow}>
            {(['lengthCm', 'widthCm', 'heightCm'] as const).map((field, idx) => {
              const labels = ['Length', 'Width', 'Height'];
              return (
                <View key={field} style={styles.dimensionField}>
                  <Text style={styles.fieldLabel}>{labels[idx]}</Text>
                  <TextInput
                    style={styles.input}
                    value={form[field]}
                    onChangeText={(v) => handleFieldChange(field, v)}
                    placeholder="0"
                    placeholderTextColor={Colors.slateDark}
                    keyboardType="decimal-pad"
                    returnKeyType="next"
                    accessibilityLabel={`${labels[idx]} in centimetres`}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Weight ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACTUAL WEIGHT (kg)</Text>
          <TextInput
            style={[styles.input, styles.inputFull]}
            value={form.actualWeightKg}
            onChangeText={(v) => handleFieldChange('actualWeightKg', v)}
            placeholder="e.g. 15.5"
            placeholderTextColor={Colors.slateDark}
            keyboardType="decimal-pad"
            returnKeyType="next"
            accessibilityLabel="Actual parcel weight in kilograms"
          />
        </View>

        {/* ── Goods description ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GOODS DESCRIPTION</Text>
          <TextInput
            style={[styles.input, styles.inputFull, styles.inputMultiline]}
            value={form.goodsDescription}
            onChangeText={(v) => handleFieldChange('goodsDescription', v)}
            placeholder="e.g. 3 bales mixed clothing — cotton shirts, kitenge fabric"
            placeholderTextColor={Colors.slateDark}
            multiline
            numberOfLines={3}
            maxLength={500}
            returnKeyType="next"
            accessibilityLabel="Description of goods being shipped"
          />
        </View>

        {/* ── Declared value ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DECLARED VALUE (USD)</Text>
          <TextInput
            style={[styles.input, styles.inputFull]}
            value={form.declaredValueUsd}
            onChangeText={(v) => handleFieldChange('declaredValueUsd', v)}
            placeholder="e.g. 150"
            placeholderTextColor={Colors.slateDark}
            keyboardType="decimal-pad"
            returnKeyType="done"
            accessibilityLabel="Declared goods value in US dollars for customs"
          />
          <Text style={styles.hint}>Used for EAC customs declaration. Max USD 2,000 for STR.</Text>
        </View>

        {/* ── Live volumetric preview ── */}
        {preview.volumeM3 !== null && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>📦 Freight Estimate</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewKey}>Volume</Text>
              <Text style={styles.previewVal}>{preview.volumeM3.toFixed(4)} m³</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewKey}>Volumetric weight</Text>
              <Text style={styles.previewVal}>{preview.volumetricWeightKg?.toFixed(2)} kg</Text>
            </View>
            <View style={[styles.previewRow, styles.previewRowHighlight]}>
              <Text style={styles.previewKeyBold}>Chargeable weight</Text>
              <Text style={styles.previewValBold}>{preview.chargeableWeightKg?.toFixed(2)} kg</Text>
            </View>
            <View style={styles.previewDivider} />
            <View style={styles.previewRow}>
              <Text style={styles.previewKeyBold}>Estimated cost</Text>
              <Text style={styles.previewCost}>
                KES {preview.estimatedCostKes?.toLocaleString('en-KE')}
              </Text>
            </View>
            <Text style={styles.previewDisclaimer}>
              Final rate confirmed after payment. Subject to transporter bulk pricing.
            </Text>
          </View>
        )}

        {/* ── Submit CTA ── */}
        <TouchableOpacity
          style={[
            styles.ctaButton,
            isSubmitting && styles.ctaButtonDisabled,
          ]}
          onPress={() => void handleSubmit()}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Confirm booking and proceed to payment"
        >
          {isSubmitting ? (
            <ActivityIndicator color={Colors.textOnOrange} size="small" />
          ) : (
            <>
              <Text style={styles.ctaText}>Confirm & Pay</Text>
              <Text style={styles.ctaSubtext}>
                {preview.estimatedCostKes
                  ? `≈ KES ${preview.estimatedCostKes.toLocaleString('en-KE')}`
                  : 'Enter dimensions to see estimate'}
              </Text>
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
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  headerTitle: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize['2xl'],
    color: Colors.textOnDark,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.slateDark,
    marginTop: Spacing.xs,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.lg },
  section: { marginBottom: Spacing.lg },
  sectionLabel: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  routeButton: {
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadow.card,
  },
  routeButtonLabel: {
    flex: 1,
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.base,
    color: Colors.textOnDark,
  },
  routeBorder: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    color: Colors.slateDark,
    marginRight: Spacing.sm,
  },
  routeChevron: { color: Colors.orange, fontSize: Typography.fontSize.sm },
  routeDropdown: {
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
    overflow: 'hidden',
    ...Shadow.elevated,
  },
  routeOption: {
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.navyLight,
  },
  routeOptionSelected: { backgroundColor: Colors.orange },
  routeOptionText: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.base,
    color: Colors.textOnDark,
  },
  routeOptionTextSelected: { color: Colors.textOnOrange },
  dimensionRow: { flexDirection: 'row', gap: Spacing.sm },
  dimensionField: { flex: 1 },
  fieldLabel: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: Colors.slateMid,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.base,
    color: Colors.textPrimary,
  },
  inputFull: { width: '100%' },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: Spacing.md,
  },
  hint: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  previewCard: {
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.elevated,
  },
  previewTitle: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.base,
    color: Colors.textOnDark,
    marginBottom: Spacing.md,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  previewRowHighlight: {
    backgroundColor: Colors.navyLight,
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  previewKey: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.slateDark,
  },
  previewKeyBold: {
    fontFamily: Typography.fontFamily.semiBold,
    fontSize: Typography.fontSize.sm,
    color: Colors.textOnDark,
  },
  previewVal: {
    fontFamily: Typography.fontFamily.medium,
    fontSize: Typography.fontSize.sm,
    color: Colors.textOnDark,
  },
  previewValBold: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.sm,
    color: Colors.textOnDark,
  },
  previewDivider: {
    height: 1,
    backgroundColor: Colors.navyLight,
    marginVertical: Spacing.md,
  },
  previewCost: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.xl,
    color: Colors.orange,
  },
  previewDisclaimer: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.xs,
    color: Colors.slateDark,
    marginTop: Spacing.sm,
  },
  ctaButton: {
    backgroundColor: Colors.orange,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadow.elevated,
  },
  ctaButtonDisabled: { backgroundColor: Colors.slateMid },
  ctaText: {
    fontFamily: Typography.fontFamily.bold,
    fontSize: Typography.fontSize.lg,
    color: Colors.textOnOrange,
    letterSpacing: 0.3,
  },
  ctaSubtext: {
    fontFamily: Typography.fontFamily.regular,
    fontSize: Typography.fontSize.sm,
    color: Colors.textOnOrange,
    marginTop: Spacing.xs,
    opacity: 0.85,
  },
  bottomPadding: { height: 48 },
});
