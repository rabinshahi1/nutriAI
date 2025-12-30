import React, { useState } from 'react';
import { router } from 'expo-router';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Form States
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async () => {
    const endpoint = isLogin ? '/auth/login' : '/auth/signup';
    const payload = isLogin 
      ? { email, password } 
      : { username, email, password };

    try {
      const response = await fetch(`https://santalaceous-devout-ryder.ngrok-free.dev${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok) {
        
        await AsyncStorage.setItem('userId', result.user.id);
        await AsyncStorage.setItem('userEmail', result.user.email);
        await AsyncStorage.setItem('username', result.user.username);
        await AsyncStorage.setItem('isLoggedIn', 'true');
        
    
    
        router.replace('/(tabs)/profile');
      } else {
        const errorMessage = result.detail 
          ? (typeof result.detail === 'string' ? result.detail : result.detail[0].msg)
          : "Something went wrong";
        alert(errorMessage);
      }
    } catch (error) {
      console.error('Auth error:', error);
      alert("Network error. Is your server running?");
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* BRAND SECTION */}
        <View style={styles.brandContainer}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            style={styles.logoCircle}
          >
            <MaterialCommunityIcons name="nutrition" size={50} color="white" />
          </LinearGradient>
          <Text style={styles.brandName}>NUTRI<Text style={{color: '#10B981'}}>AI</Text></Text>
          <Text style={styles.brandTagline}>Your Industry-Grade Diet Partner</Text>
        </View>

        {/* AUTH FORM */}
        <View style={styles.formContainer}>
          <Text style={styles.formTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
          <Text style={styles.formSubtitle}>
            {isLogin ? 'Enter your details to track your progress' : 'Join thousands of users optimizing their health'}
          </Text>

          {!isLogin && (
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
              <TextInput
                placeholder="Username"
                placeholderTextColor="#64748b"
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
            </View>
          )}

          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              placeholder="Email Address"
              placeholderTextColor="#64748b"
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#64748b"
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color="#64748b" 
              />
            </TouchableOpacity>
          </View>

          {isLogin && (
            <TouchableOpacity style={styles.forgotBtn}>
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.mainBtn} onPress={handleAuth}>
            <LinearGradient
              colors={['#10B981', '#059669']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.btnGradient}
            >
              <Text style={styles.btnText}>{isLogin ? 'Log In' : 'Sign Up'}</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.switchBtn} 
            onPress={() => setIsLogin(!isLogin)}
          >
            <Text style={styles.switchText}>
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <Text style={styles.switchAction}>{isLogin ? 'Sign Up' : 'Log In'}</Text>
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 25 },
  
  brandContainer: { alignItems: 'center', marginBottom: 50 },
  logoCircle: { width: 90, height: 90, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 20, transform: [{ rotate: '15deg' }] },
  brandName: { color: '#fff', fontSize: 32, fontWeight: '900', letterSpacing: 2 },
  brandTagline: { color: '#64748b', fontSize: 14, fontWeight: '600', marginTop: 5 },

  formContainer: { width: '100%' },
  formTitle: { color: '#fff', fontSize: 28, fontWeight: '800', marginBottom: 8 },
  formSubtitle: { color: '#64748b', fontSize: 15, marginBottom: 30, lineHeight: 22 },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 60,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600' },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 25 },
  forgotText: { color: '#10B981', fontWeight: '700', fontSize: 14 },

  mainBtn: { height: 60, borderRadius: 16, overflow: 'hidden', marginTop: 10 },
  btnGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontSize: 18, fontWeight: '800', marginRight: 10 },

  switchBtn: { marginTop: 25, alignItems: 'center' },
  switchText: { color: '#64748b', fontSize: 14, fontWeight: '600' },
  switchAction: { color: '#10B981', fontWeight: '800' },
});