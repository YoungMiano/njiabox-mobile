import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { api } from '../api/client';
import { Colors, Typography, Spacing, BorderRadius, Shadow } from '../theme';

interface Props {
  consignmentId: string;
  trackingCode: string;
  amountKes: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentScreen({ consignmentId, trackingCode, amountKes, onSuccess, onCancel }: Props) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'waiting' | 'done'>('input');

  const handlePay = async () => {
    if (!phoneNumber.match(/^\+?254\d{9}$|^07\d{8}$|^01\d{8}$/)) {
      Alert.alert('Invalid number', 'Enter a valid Safaricom M-Pesa number\ne.g. 0712345678 or +254712345678');
      return;
    }

    const normalizedPhone = phoneNumber.startsWith('0')
      ? '+254' + phoneNumber.slice(1)
      : phoneNumber.startsWith('254')
      ? '+' + phoneNumber
      : phoneNumber;

    setLoading(true);
    setStep('waiting');

    try {
      await api.initiatePayment({
        consignmentId,
        phoneNumber: normalizedPhone,
        amountKes,
      });

      setStep('done');
      Alert.alert(
        '📱 Check Your Phone',
        `An M-Pesa STK push has been sent to ${normalizedPhone}.\n\nEnter your M-Pesa PIN to complete payment of KES ${amountKes.toLocaleString()}.\n\nTracking: ${trackingCode}`,
        [
          { text: 'Done', onPress: onSuccess },
        ]
      );
    } catch (e) {
      setStep('input');
      Alert.alert(
        'Payment Failed',
        e instanceof Error ? e.message : 'Could not initiate M-Pesa payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.root}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Pay via M-Pesa</Text>
        <Text style={s.headerSubtitle}>{trackingCode}</Text>
      </View>

      <ScrollView contentContainerStyle={s.content}>
        {/* Amount summary */}
        <View style={s.summaryCard}>
          <Text style={s.summaryLabel}>AMOUNT DUE</Text>
          <Text style={s.summaryAmount}>KES {amountKes.toLocaleString()}</Text>
          <Text style={s.summaryNote}>Freight consolidation fee — EAC cross-border LTL</Text>
        </View>

        {/* M-Pesa logo area */}
        <View style={s.mpesaCard}>
          <Text style={s.mpesaIcon}>📱</Text>
          <Text style={s.mpesaTitle}>Lipa na M-Pesa</Text>
          <Text style={s.mpesaSubtitle}>You will receive an STK push on your phone</Text>
        </View>

        {/* Phone input */}
        <Text style={s.label}>M-PESA PHONE NUMBER</Text>
        <TextInput
          style={s.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="0712 345 678"
          placeholderTextColor={Colors.slateDark}
          keyboardType="phone-pad"
          maxLength={13}
          editable={step === 'input'}
        />
        <Text style={s.hint}>Enter the Safaricom number registered for M-Pesa</Text>

        {step === 'waiting' && (
          <View style={s.waitingCard}>
            <ActivityIndicator color={Colors.orange} size="large" />
            <Text style={s.waitingText}>Sending STK push to your phone...</Text>
            <Text style={s.waitingSubtext}>Check your phone and enter your M-Pesa PIN</Text>
          </View>
        )}

        <TouchableOpacity
          style={[s.payBtn, (loading || step === 'waiting') && s.payBtnDisabled]}
          onPress={() => void handlePay()}
          disabled={loading || step === 'waiting'}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.payBtnText}>Pay KES {amountKes.toLocaleString()} via M-Pesa</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.cancelBtn} onPress={onCancel}>
          <Text style={s.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>

        <View style={s.securityNote}>
          <Text style={s.securityText}>
            🔒 Payments are held in escrow and released to the transporter only after confirmed delivery with OTP verification.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.slateLight },
  header: { backgroundColor: Colors.navy, paddingTop: 48, paddingBottom: Spacing.lg, paddingHorizontal: Spacing.xl },
  headerTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['2xl'], color: Colors.textOnDark },
  headerSubtitle: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.orange, marginTop: 4 },
  content: { padding: Spacing.lg },
  summaryCard: { backgroundColor: Colors.navy, borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md, ...Shadow.elevated },
  summaryLabel: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs, color: Colors.slateDark, letterSpacing: 0.8 },
  summaryAmount: { fontFamily: Typography.fontFamily.bold, fontSize: 36, color: Colors.orange, marginVertical: Spacing.sm },
  summaryNote: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.slateDark, textAlign: 'center' },
  mpesaCard: { backgroundColor: '#00A651', borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.lg },
  mpesaIcon: { fontSize: 32, marginBottom: Spacing.sm },
  mpesaTitle: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.lg, color: '#fff' },
  mpesaSubtitle: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: '#fff', opacity: 0.9, marginTop: 4 },
  label: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs, color: Colors.textSecondary, letterSpacing: 0.8, marginBottom: Spacing.xs },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: Colors.slateMid, borderRadius: BorderRadius.md, padding: Spacing.md, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.lg, color: Colors.textPrimary, marginBottom: Spacing.xs },
  hint: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textSecondary, marginBottom: Spacing.lg },
  waitingCard: { backgroundColor: Colors.navyLight, borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg },
  waitingText: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.base, color: Colors.textOnDark, marginTop: Spacing.md },
  waitingSubtext: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.slateDark, marginTop: Spacing.sm, textAlign: 'center' },
  payBtn: { backgroundColor: '#00A651', borderRadius: BorderRadius.lg, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.md, ...Shadow.elevated },
  payBtnDisabled: { backgroundColor: Colors.slateDark },
  payBtnText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.base, color: '#fff' },
  cancelBtn: { padding: Spacing.lg, alignItems: 'center' },
  cancelBtnText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.base, color: Colors.textSecondary },
  securityNote: { backgroundColor: Colors.slateLight, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.slateMid, marginTop: Spacing.md },
  securityText: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
});
