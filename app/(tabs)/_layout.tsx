import React from 'react';
import { Tabs } from 'expo-router';
import { Home, MapPin, Droplets, Car, Wrench, Settings } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePreferences } from '@/lib/PreferencesContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { t } = usePreferences();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1DB954',
        tabBarInactiveTintColor: '#B3B3B3',
        tabBarHideOnKeyboard: true,
        lazy: true,
        headerShown: true,
        sceneStyle: {
          backgroundColor: '#121212',
        },
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopColor: '#282828',
          elevation: 0,
          shadowOpacity: 0,
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 58 + Math.max(insets.bottom, 8),
        },
        headerStyle: {
          backgroundColor: '#1E1E1E',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontFamily: 'system-ui',
          fontWeight: '800',
          color: '#FFFFFF',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: t('tabs.trips'),
          tabBarIcon: ({ color }) => <MapPin size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="refuels"
        options={{
          title: t('tabs.refuels'),
          tabBarIcon: ({ color }) => <Droplets size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="oil"
        options={{
          title: t('tabs.oil'),
          tabBarIcon: ({ color }) => <Wrench size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: t('tabs.vehicles'),
          tabBarIcon: ({ color }) => <Car size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t('tabs.settings'),
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
