import React from 'react';
import { Tabs } from 'expo-router';
import { Home, MapPin, Droplets, Car } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1DB954',
        tabBarInactiveTintColor: '#B3B3B3',
        tabBarHideOnKeyboard: true,
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
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Viagens',
          tabBarIcon: ({ color }) => <MapPin size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="refuels"
        options={{
          title: 'Historico',
          tabBarIcon: ({ color }) => <Droplets size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="vehicles"
        options={{
          title: 'Frota',
          tabBarIcon: ({ color }) => <Car size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
