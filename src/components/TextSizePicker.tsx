import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface TextSizePickerProps {
  sizes: number[];
  selectedSize: number;
  onSizeSelect: (size: number) => void;
  label?: string;
}

export default function TextSizePicker({ sizes, selectedSize, onSizeSelect, label }: TextSizePickerProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      )}
      <View style={styles.sizeList}>
        {sizes.map((size) => (
          <TouchableOpacity
            key={size}
            style={[
              styles.sizeButton,
              { borderColor: theme.border },
              selectedSize === size && { 
                backgroundColor: theme.primary, 
                borderColor: theme.primary 
              },
            ]}
            onPress={() => onSizeSelect(size)}
            activeOpacity={0.7}
          >
            <Text 
              style={[
                styles.sizeButtonText, 
                { color: selectedSize === size ? '#fff' : theme.text }
              ]}
            >
              {size}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  sizeList: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  sizeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
