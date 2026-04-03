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
    // Heavier, squishier bounce for Waze feel
    scale.value = withSpring(0.92, { damping: 12, stiffness: 350 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 10, stiffness: 400 });
  };

  const handlePress = (e: any) => {
    if (!isLoading && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); // Heavier haptic
      onPress(e);
    }
  };

  const baseClasses = 'py-4 px-6 rounded-full flex-row justify-center items-center border-b-4';
  
  const variantClasses = {
    primary: 'bg-primary border-[#14833b]', // Spotify Neon Green with darker green 3D border
    secondary: 'bg-surfaceLight border-[#1a1a1a]', 
    danger: 'bg-danger border-[#a30e1d]',
    ghost: 'bg-transparent border-transparent',
  };

  const textClasses = {
    primary: 'text-background font-black text-base uppercase tracking-widest', // High contrast inverted
    secondary: 'text-textMain font-bold text-base uppercase tracking-wider',
    danger: 'text-white font-black text-base uppercase tracking-widest',
    ghost: 'text-textMuted font-bold text-base uppercase tracking-wider',
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
        <ActivityIndicator color={variant === 'primary' ? '#121212' : '#ffffff'} />
      ) : (
        <Text className={textClasses[variant]}>{label}</Text>
      )}
    </AnimatedPressable>
  );
}
