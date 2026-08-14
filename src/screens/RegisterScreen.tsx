import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';

interface Props {
  onNavigateToLogin: () => void;
}

export function RegisterScreen({ onNavigateToLogin }: Props) {
  const { register } = useAuth();
  const [form, setForm] = useState({
    fullName: '', phoneNumber: '', password: '', confirmPassword: '',
    businessName: '', role: 'Trader',
  });
  const [loading, setLoading] = useState(false);

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    if (!form.fullName || !form.phoneNumber || !form.password) {
      Alert.alert('Error', 'Please fill in all required fields.'); return;
    }
    if (form.password !== form.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.'); return;
    }
    setLoading(true);
    try {
      await register({
        fullName: form.fullName, phoneNumber: form.phoneNumber,
        password: form.password, role: form.role,
        businessName: form.businessName || undefined,
      });
    } catch (e) {
      Alert.alert('Registration Failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roles = ['Trader', 'Transporter', 'Destination_Agent'];

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <Text style={s.logo}>🌍 NjiaBox</Text>
        <Text style={s.title}>Create Account</Text>
      </View>

      <View style={s.form}>
        {[
          { label: 'FULL NAME *', key: 'fullName', placeholder: 'Amina Wanjiku' },
          { label: 'BUSINESS NAME', key: 'businessName', placeholder: 'Wanjiku Textiles (optional)' },
          { label: 'PHONE NUMBER *', key: 'phoneNumber', placeholder: '+254712345678', type: 'phone-pad' },
          { label: 'PASSWORD *', key: 'password', placeholder: 'Min 8 characters', secure: true },
          { label: 'CONFIRM PASSWORD *', key: 'confirmPassword', placeholder: 'Repeat password', secure: true },
        ].map(f => (
          <View key={f.key}>
            <Text style={s.label}>{f.label}</Text>
            <TextInput
              style={s.input}
              value={form[f.key as keyof typeof form]}
              onChangeText={v => update(f.key, v)}
              placeholder={f.placeholder}
              placeholderTextColor={Colors.slateDark}
              keyboardType={(f.type as 'phone-pad') ?? 'default'}
              secureTextEntry={f.secure}
              autoCapitalize="none"
            />
          </View>
        ))}

        <Text style={s.label}>I AM A *</Text>
        <View style={s.roleRow}>
          {roles.map(r => (
            <TouchableOpacity
              key={r}
              style={[s.roleBtn, form.role === r && s.roleBtnActive]}
              onPress={() => update('role', r)}
            >
              <Text style={[s.roleBtnText, form.role === r && s.roleBtnTextActive]}>
                {r.replace('_', ' ')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.btn} onPress={() => void handleRegister()} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Create Account</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.link} onPress={onNavigateToLogin}>
          <Text style={s.linkText}>Already have an account? <Text style={s.linkBold}>Login</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.navy },
  content: { flexGrow: 1, padding: Spacing.xl, paddingTop: 60 },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  logo: { fontSize: 32, marginBottom: Spacing.xs },
  title: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize['2xl'], color: Colors.textOnDark },
  form: { backgroundColor: Colors.navyLight, borderRadius: BorderRadius.xl, padding: Spacing.xl },
  label: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs, color: Colors.slateDark, letterSpacing: 0.8, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: { backgroundColor: Colors.darkSurface, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.textOnDark, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.base },
  roleRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  roleBtn: { flex: 1, padding: Spacing.sm, borderRadius: BorderRadius.md, backgroundColor: Colors.darkSurface, alignItems: 'center' },
  roleBtnActive: { backgroundColor: Colors.orange },
  roleBtnText: { fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.xs, color: Colors.slateDark },
  roleBtnTextActive: { color: '#fff' },
  btn: { backgroundColor: Colors.orange, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.lg },
  btnText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.base, color: '#fff' },
  link: { alignItems: 'center', marginTop: Spacing.lg },
  linkText: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.slateDark },
  linkBold: { fontFamily: Typography.fontFamily.bold, color: Colors.orange },
});
