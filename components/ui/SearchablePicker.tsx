import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

interface SearchablePickerProps {
  title: string;
  visible: boolean;
  options: string[];
  onClose: () => void;
  onSelect: (value: string) => void;
}

export function SearchablePicker({
  title,
  visible,
  options,
  onClose,
  onSelect,
}: SearchablePickerProps) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) {
      setQuery('');
    }
  }, [visible]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => option.toLowerCase().includes(normalizedQuery));
  }, [options, query]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        setQuery('');
        onClose();
      }}
    >
      <SafeAreaView className="flex-1 bg-black/60 justify-end">
        <Pressable className="flex-1" onPress={onClose} />
        <View className="bg-background rounded-t-[32px] border-t border-surfaceLight max-h-[85%]">
          <View className="px-6 pt-4 pb-3 border-b border-surfaceLight">
            <View className="w-12 h-1.5 bg-surfaceLight rounded-full self-center mb-4" />
            <Text className="text-textMain text-2xl font-black tracking-tight mb-3">{title}</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar..."
              placeholderTextColor="#B3B3B3"
              className="bg-surface border border-surfaceLight rounded-full px-5 py-4 text-textMain font-bold"
              style={{ color: '#FFFFFF' }}
            />
          </View>

          <ScrollView className="px-4 py-4" keyboardShouldPersistTaps="handled">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => {
                    setQuery('');
                    onSelect(option);
                    onClose();
                  }}
                  className="bg-surface border border-surfaceLight rounded-2xl px-5 py-4 mb-3"
                >
                  <Text className="text-textMain font-bold text-base">{option}</Text>
                </Pressable>
              ))
            ) : (
              <View className="bg-surface border border-surfaceLight rounded-2xl px-5 py-6">
                <Text className="text-textMuted font-medium text-center">
                  Nenhuma opcao encontrada.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
