import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export function Input({ label, error, leftIcon, className = '', ...props }: InputProps) {
  return (
    <View className="mb-5">
      {label && <Text className="text-textMuted font-bold text-sm tracking-wide mb-2 ml-2 uppercase">{label}</Text>}
      <View 
        className={`flex-row items-center bg-surface border-2 ${error ? 'border-danger' : 'border-surfaceLight focus:border-primary'} rounded-full px-5 py-3 h-16 ${className}`}
      >
        {leftIcon && <View className="mr-3 opacity-70">{leftIcon}</View>}
        <TextInput
          className="flex-1 text-textMain text-base font-bold"
          placeholderTextColor="#B3B3B3"
          style={{ color: '#FFFFFF' }} // Explicit fallback for React Native input color bugs
          {...props}
        />
      </View>
      {error && <Text className="text-danger font-bold text-sm mt-2 ml-2">{error}</Text>}
    </View>
  );
}
