import React from 'react';
import { Tabs } from 'expo-router';
import { Home, MapPin, Droplets, Car } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3B82F6', // accent
        tabBarInactiveTintColor: '#94A3B8', // slate-400
        headerShown: true,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f1f5f9',
          elevation: 0,
          shadowOpacity: 0,
          paddingBottom: 4,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          fontFamily: 'system-ui',
          fontWeight: '600',
          color: '#0f172a',
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
