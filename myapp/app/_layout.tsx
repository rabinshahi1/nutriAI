import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if a userId exists in storage
      const userId = await AsyncStorage.getItem('userId');
      
      if (userId) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      // Logic finished, stop showing the loading spinner
      setIsLoading(false);
    }
  };

  // Prevent UI flickering: Show a spinner while checking AsyncStorage
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#020617' }}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {!isAuthenticated ? (
        // No ID found? Show login
        <Stack.Screen name="(auth)/login" options={{ animation: 'fade' }} />
      ) : (
        // ID found? Show the main app
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      )}
    </Stack>
  );
}