import React, { ReactNode } from 'react';
import { View, Text } from 'react-native';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <View className="items-center justify-center py-12 px-4 border-2 border-dashed border-surfaceLight rounded-[32px] mt-4">
      <View className="mb-5 bg-surface p-5 rounded-full">
        {icon}
      </View>
      <Text className="text-2xl font-black text-textMain mb-2 text-center tracking-tight">
        {title}
      </Text>
      {description && (
        <Text className="text-textMuted text-center px-4 font-medium leading-relaxed">
          {description}
        </Text>
      )}
    </View>
  );
}
