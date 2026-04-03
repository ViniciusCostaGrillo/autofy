import React from 'react';
import { View, Text, TextInput, TextInputProps, Platform } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export function Input({ label, error, leftIcon, className = '', style, ...props }: InputProps) {
  return (
    <View className="mb-5">
      {label ? (
        <Text className="text-textMuted font-bold text-sm tracking-wide mb-2 ml-2 uppercase">
          {label}
        </Text>
      ) : null}
      <View
        className={`flex-row items-center bg-surface border-2 ${
          error ? 'border-danger' : 'border-surfaceLight'
        } rounded-full px-5 min-h-16 ${className}`}
      >
        {leftIcon ? <View className="mr-3 opacity-70">{leftIcon}</View> : null}
        <TextInput
          className="flex-1 text-textMain text-base font-bold"
          placeholderTextColor="#B3B3B3"
          style={[
            {
              color: '#FFFFFF',
              minHeight: 56,
              paddingVertical: 0,
              textAlignVertical: 'center',
            },
            Platform.OS === 'android'
              ? {
                  includeFontPadding: false,
                }
              : null,
            style,
          ]}
          {...props}
        />
      </View>
      {error ? <Text className="text-danger font-bold text-sm mt-2 ml-2">{error}</Text> : null}
    </View>
  );
}
