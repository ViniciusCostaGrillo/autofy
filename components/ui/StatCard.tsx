import React from 'react';
import { View, Text } from 'react-native';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({ title, value, subtitle, icon, className = '' }: StatCardProps) {
  return (
    <Card className={`flex-1 ${className}`}>
      <View className="flex-row justify-between items-start mb-2">
        <Text className="text-textMuted text-xs font-bold uppercase tracking-wider">{title}</Text>
        {icon && <View className="bg-surfaceLight p-2 rounded-full">{icon}</View>}
      </View>
      <Text className="text-3xl font-black text-textMain mb-1 tracking-tighter">{value}</Text>
      {subtitle && <Text className="text-xs text-textMuted font-medium">{subtitle}</Text>}
    </Card>
  );
}
