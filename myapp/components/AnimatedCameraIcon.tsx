import { Animated, View } from 'react-native';
import { useEffect, useRef } from 'react';
import { FontAwesome } from '@expo/vector-icons';

export default function AnimatedCameraIcon({ focused }) {
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: focused ? 1.1 : 1,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(glowOpacity, {
        toValue: focused ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused]);

  return (
    <View style={{ 
      alignItems: 'center', 
      justifyContent: 'center',
      flex: 1,
    }}>
      {/* Glow effect - only visible when focused */}
      {focused && (
        <Animated.View
          style={{
            position: 'absolute',
            width: 60,
            height: 60,
            borderRadius: 30,
            backgroundColor: '#FFFFFF',
            opacity: 0.2,
          }}
        />
      )}
      
      {/* Camera button */}
      <Animated.View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: focused ? '#FFFFFF' : '#1E1E1E',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale }],
          borderWidth: focused ? 0 : 1,
          borderColor: '#333333',
        }}
      >
        <FontAwesome name="camera" size={26} color={focused ? '#000000' : '#FFFFFF'} />
      </Animated.View>
    </View>
  );
}