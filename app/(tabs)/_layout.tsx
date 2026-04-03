import React from 'react';
import { Tabs } from 'expo-router';
import { Home, MapPin, Droplets, Car } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1DB954', // Spotify neon green
        tabBarInactiveTintColor: '#B3B3B3', // Spotify muted gray
        headerShown: true,
        tabBarStyle: {
          backgroundColor: '#121212', // Pure Spotify Dark
          borderTopColor: '#282828', // surfaceLight
          elevation: 0,
          shadowOpacity: 0,
          paddingBottom: 4,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#1E1E1E', // Dark surface for header
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontFamily: 'system-ui',
          fontWeight: '800', // Heavy bold like Spotify
          color: '#FFFFFF',
        }
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
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
          title: 'Histórico',
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
