import React from 'react';
import { Pressable, Text, PressableProps, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
  className?: string;
}

export function Button({ label, variant = 'primary', isLoading, className = '', onPress, ...props }: ButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 10, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 400 });
  };

  const handlePress = (e: any) => {
    if (!isLoading && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress(e);
    }
  };

  const baseClasses = 'py-3.5 px-6 rounded-xl flex-row justify-center items-center';
  
  const variantClasses = {
    primary: 'bg-accent',
    secondary: 'bg-secondary',
    danger: 'bg-danger',
    ghost: 'bg-transparent',
  };

  const textClasses = {
    primary: 'text-white font-semibold text-base',
    secondary: 'text-white font-semibold text-base',
    danger: 'text-white font-semibold text-base',
    ghost: 'text-slate-700 dark:text-slate-300 font-semibold text-base',
  };

  return (
    <AnimatedPressable 
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      className={`${baseClasses} ${variantClasses[variant]} ${props.disabled ? 'opacity-50' : ''} ${className}`}
      disabled={isLoading || props.disabled}
      style={[animatedStyle, props.style as any]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'ghost' ? '#334155' : '#ffffff'} />
      ) : (
        <Text className={textClasses[variant]}>{label}</Text>
      )}
    </AnimatedPressable>
  );
}
