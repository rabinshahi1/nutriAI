import { Animated, View } from 'react-native';
import { useEffect, useRef } from 'react';

export default function TabIcon({ children, focused }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.05 : 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return (
    <View style={{ 
      alignItems: 'center', 
      justifyContent: 'center',
      flex: 1,
    }}>
      <Animated.View
        style={{
          transform: [{ scale }],
        }}
      >
        {children}
      </Animated.View>
    </View>
  );
}