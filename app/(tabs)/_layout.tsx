import { Tabs, Redirect, usePathname } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, ActivityIndicator, View } from 'react-native';
import { IconSymbol } from '@/frontend/components/ui/IconSymbol';
import TabBarBackground from '@/frontend/components/ui/TabBarBackground';
import { Colors } from '@/frontend/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '../AuthContext';
import { useTranslations } from '@/frontend/constants/locales';
import { useLanguage } from '@/frontend/context/LanguageProvider';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();
  const { isAuthenticated, loading } = useAuth();
  const { t } = useTranslations();
  const { isRTL } = useLanguage();

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
          title: t('tabs.home'), // استخدام الترجمة من نظامك
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="ContactUs"
        options={{
          title: t('tabs.contact'), // استخدام الترجمة من نظامك
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="envelope.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="AboutUs"
        options={{
          title: t('tabs.about'), // استخدام الترجمة من نظامك
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="info.circle.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="EmergencyPage"
        options={{
          title: t('tabs.map'), // استخدام الترجمة من نظامك
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="map.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="local"
        options={{
          title: t('common.local'), // استخدام الترجمة من نظامك
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="map.fill" color={color} />
          ),
          tabBarItemStyle: { display: 'none' },
        }}
      />
    </Tabs>
  );
}