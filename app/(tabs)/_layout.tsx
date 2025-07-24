import { Tabs, Redirect, usePathname } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, ActivityIndicator, View } from 'react-native';
import { IconSymbol } from '@/frontend/components/ui/IconSymbol';
import TabBarBackground from '@/frontend/components/ui/TabBarBackground';
import { Colors } from '@/frontend/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    console.log('Authentication status:', isAuthenticated);
  }, [isAuthenticated]);

  if (pathname === '/(tabs)') {
    return <Redirect href="/" />;
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6d4c41" />
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
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
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ContactUs"
        options={{
          title: 'Contact Us',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="envelope.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="AboutUs"
        options={{
          title: 'About Us',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="info.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="EmergencyPage"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="map.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="local"
        options={{
          title: 'Local',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="map.fill" color={color} />
          ),
          tabBarItemStyle: { display: 'none' },
        }}
      />
      
      {/* شاشة تسجيل الخروج - تظهر فقط للمستخدمين المسجلين */}
      <Tabs.Screen
        name="logout"
        options={{
          title: 'LogOut',
          tabBarIcon: ({ color }) => (
            <Feather name="log-out" size={24} color={color} />
          ),
          tabBarItemStyle: {
            display: isAuthenticated ? 'flex' : 'none'
          }
        }}
      />
    </Tabs>
  );
}