import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, ScrollView, Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Colors, Typography, Spacing, BorderRadius } from '../theme';

interface Props {
  onNavigateToRegister: () => void;
}

export function LoginScreen({ onNavigateToRegister }: Props) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Error', 'Please enter phone number and password.');
      return;
    }
    setLoading(true);
    try {
      await login(phone, password);
    } catch (e) {
      Alert.alert('Login Failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <View style={s.header}>
        <Text style={s.logo}>🌍 NjiaBox</Text>
        <Text style={s.tagline}>EAC Cross-Border Logistics</Text>
      </View>

      <View style={s.form}>
        <Text style={s.label}>PHONE NUMBER</Text>
        <TextInput
          style={s.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+254712345678"
          placeholderTextColor={Colors.slateDark}
          keyboardType="phone-pad"
          autoCapitalize="none"
        />

        <Text style={s.label}>PASSWORD</Text>
        <TextInput
          style={s.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Your password"
          placeholderTextColor={Colors.slateDark}
          secureTextEntry
        />

        <TouchableOpacity style={s.btn} onPress={() => void handleLogin()} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.btnText}>Login</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={s.link} onPress={onNavigateToRegister}>
          <Text style={s.linkText}>Don't have an account? <Text style={s.linkBold}>Register</Text></Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.navy },
  content: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl },
  header: { alignItems: 'center', marginBottom: Spacing['3xl'] },
  logo: { fontSize: 40, marginBottom: Spacing.sm },
  tagline: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.base, color: Colors.slateDark },
  form: { backgroundColor: Colors.navyLight, borderRadius: BorderRadius.xl, padding: Spacing.xl },
  label: { fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.xs, color: Colors.slateDark, letterSpacing: 0.8, marginBottom: Spacing.xs, marginTop: Spacing.md },
  input: { backgroundColor: Colors.darkSurface, borderRadius: BorderRadius.md, padding: Spacing.md, color: Colors.textOnDark, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.base, marginBottom: Spacing.sm },
  btn: { backgroundColor: Colors.orange, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', marginTop: Spacing.lg },
  btnText: { fontFamily: Typography.fontFamily.bold, fontSize: Typography.fontSize.base, color: '#fff' },
  link: { alignItems: 'center', marginTop: Spacing.lg },
  linkText: { fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm, color: Colors.slateDark },
  linkBold: { fontFamily: Typography.fontFamily.bold, color: Colors.orange },
});
