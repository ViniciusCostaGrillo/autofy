import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  children: React.ReactNode;
}

export function Card({ children, className = '', ...props }: CardProps) {
  return (
    <View 
      className={`bg-surface rounded-3xl p-5 border border-surfaceLight ${className}`}
      {...props}
    >
      {children}
    </View>
  );
}
