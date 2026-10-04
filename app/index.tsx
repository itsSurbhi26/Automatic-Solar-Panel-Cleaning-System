/**
 * Login screen – mock authentication gate.
 * Only logged-in users can send manual commands.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSolarStore } from '../src/store/useSolarStore';
import { Colors, Radius, Spacing, Typography } from '../src/theme';

const { width } = Dimensions.get('window');

// Demo credentials
const DEMO_USERS: Record<string, string> = {
  admin: 'solar123',
  demo: 'demo',
  guest: 'guest',
};

export default function LoginScreen() {
  const [username, setUsername] = useState('demo');
  const [password, setPassword] = useState('demo');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useSolarStore();

  const btnScale = useSharedValue(1);
  const btnStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter username and password');
      return;
    }
    setLoading(true);
    btnScale.value = withSpring(0.96);

    await new Promise((r) => setTimeout(r, 600)); // mock delay

    const expectedPass = DEMO_USERS[username.toLowerCase()];
    if (!expectedPass || expectedPass !== password) {
      Alert.alert('Login Failed', 'Invalid credentials.\n\nTry: demo / demo');
      setLoading(false);
      btnScale.value = withSpring(1);
      return;
    }

    login(username.toLowerCase());
    btnScale.value = withSpring(1);
    router.replace('/(tabs)/dashboard');
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Background circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <View style={styles.content}>
        {/* Logo */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            {/* Sun icon */}
            <Ionicons name="sunny" size={48} color={Colors.amber} />
          </View>
          <Text style={styles.appName}>SolarClean</Text>
          <Text style={styles.tagline}>Smart Solar Panel Monitoring</Text>
        </Animated.View>

        {/* Form card */}
        <Animated.View entering={FadeInUp.duration(600).delay(200).springify()} style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          <Text style={styles.cardSub}>Demo credentials: demo / demo</Text>

          {/* Username */}
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={18} color={Colors.gray500} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Username"
              placeholderTextColor={Colors.gray500}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          {/* Password */}
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.gray500} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Password"
              placeholderTextColor={Colors.gray500}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)} style={{ padding: 4 }}>
              <Ionicons
                name={showPass ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color={Colors.gray500}
              />
            </TouchableOpacity>
          </View>

          {/* Login button */}
          <Animated.View style={btnStyle}>
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={styles.loginBtn}
              activeOpacity={0.85}
            >
              {loading ? (
                <Text style={styles.loginBtnText}>Signing in…</Text>
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color={Colors.white} style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Guest access */}
          <TouchableOpacity
            onPress={() => {
              login('guest');
              router.replace('/(tabs)/dashboard');
            }}
            style={{ marginTop: 12, alignItems: 'center' }}
          >
            <Text style={{ color: Colors.gray500, fontSize: Typography.sm }}>
              Continue as Guest (view-only)
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.Text
          entering={FadeInUp.duration(400).delay(400)}
          style={styles.footer}
        >
          DEMO MODE · Fully Offline
        </Animated.Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.surface1Dark,
  },
  circle1: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(46,117,182,0.12)',
    top: -100,
    right: -80,
  },
  circle2: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(245,166,35,0.07)',
    bottom: 40,
    left: -60,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing['2xl'],
  },
  logoWrap: {
    alignItems: 'center',
    marginBottom: Spacing['3xl'],
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(245,166,35,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
    borderWidth: 2,
    borderColor: 'rgba(245,166,35,0.3)',
  },
  appName: {
    fontSize: Typography['3xl'],
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: Typography.sm,
    color: Colors.gray400,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.surface2Dark,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(46,117,182,0.25)',
    padding: Spacing.xl,
  },
  cardTitle: {
    fontSize: Typography.xl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  cardSub: {
    fontSize: Typography.xs,
    color: Colors.gray500,
    marginBottom: Spacing.xl,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface3Dark,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(46,117,182,0.2)',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: '500',
  },
  loginBtn: {
    backgroundColor: Colors.skyBlue,
    borderRadius: Radius.md,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  loginBtnText: {
    color: Colors.white,
    fontSize: Typography.md,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  footer: {
    color: Colors.gray600,
    fontSize: Typography.xs,
    textAlign: 'center',
    marginTop: Spacing.xl,
    letterSpacing: 1.5,
  },
});
