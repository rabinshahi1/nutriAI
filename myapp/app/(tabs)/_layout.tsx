import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// Ensure these components exist in your constants/components folder
import AnimatedCameraIcon from '@/components/AnimatedCameraIcon';
import TabIcon from '@/components/TabIcon';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          height: 85, // Slightly taller for modern phones
          backgroundColor: '#020617', // Matching your profile theme
          borderTopWidth: 1,
          borderTopColor: '#1E293B',
          paddingBottom: 20,
          paddingTop: 12,
        },
      }}
    >
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <MaterialCommunityIcons
                name={focused ? 'account-circle' : 'account-circle-outline'}
                size={28}
                color={color}
              />
            </TabIcon>
          ),
        }}
      />

      <Tabs.Screen
        name="camera"
        options={{
          tabBarIcon: ({ focused }) => (
            <AnimatedCameraIcon focused={focused} />
          ),
        }}
      />

      <Tabs.Screen
        name="chart"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon focused={focused}>
              <FontAwesome 
                name="history" 
                size={24} 
                color={color} 
              />
            </TabIcon>
          ),
        }}
      />
    </Tabs>
  );
}