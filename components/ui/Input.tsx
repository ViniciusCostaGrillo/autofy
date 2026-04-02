import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export function Input({ label, error, leftIcon, className = '', ...props }: InputProps) {
  return (
    <View className="mb-4">
      {label && <Text className="text-slate-700 dark:text-slate-300 font-medium mb-1.5 ml-1">{label}</Text>}
      <View className={`flex-row items-center bg-slate-50 dark:bg-slate-900 border ${error ? 'border-danger' : 'border-slate-200 dark:border-slate-700'} rounded-xl px-4 py-3 h-14 ${className}`}>
        {leftIcon && <View className="mr-3">{leftIcon}</View>}
        <TextInput
          className="flex-1 text-slate-900 dark:text-slate-100 text-base"
          placeholderTextColor="#94a3b8"
          {...props}
        />
      </View>
      {error && <Text className="text-danger text-sm mt-1.5 ml-1">{error}</Text>}
    </View>
  );
}
