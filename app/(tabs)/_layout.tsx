import { Tabs, Redirect, usePathname } from 'expo-router';
import React from 'react';
import { Platform, ActivityIndicator } from 'react-native';
import { HapticTab } from '@/frontend/components/HapticTab';
import { IconSymbol } from '@/frontend/components/ui/IconSymbol';
import TabBarBackground from '@/frontend/components/ui/TabBarBackground';
import { Colors } from '@/frontend/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const { user, isAuthenticated, loading } = useAuth();
  

  if (pathname === '/(tabs)') {
    return <Redirect href="/" />;
  }
    if (loading) {
    return <ActivityIndicator />; // عرض مؤشر تحميل أثناء الانتظار
  }


  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ContactUs"
        options={{
          title: 'Contact Us',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="envelope.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="AboutUs"
        options={{
          title: 'About Us',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="info.circle.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="EmergencyPage"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="map.fill" color={color} />,
        }}
      />

      <Tabs.Screen
        name="local"
        options={{
          title: 'Local',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="map.fill" color={color} />,
          tabBarItemStyle: { display: 'none' },
        }}
      />

      {isAuthenticated && (
        <Tabs.Screen
          name="logout"
          options={{
            title: 'LogOut',
            tabBarIcon: ({ color }) => (
              <Feather name="log-out" size={24} color={color} />
            ),
          }}
        />
      )}
    </Tabs>
  
  );
}