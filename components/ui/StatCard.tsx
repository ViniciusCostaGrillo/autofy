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
        <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</Text>
        {icon && <View className="bg-slate-100 dark:bg-slate-700 p-2 rounded-full">{icon}</View>}
      </View>
      <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{value}</Text>
      {subtitle && <Text className="text-xs text-slate-500 dark:text-slate-400">{subtitle}</Text>}
    </Card>
  );
}
