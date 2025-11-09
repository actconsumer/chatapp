import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export interface FilterOption {
  name: string;
  value: string | null;
  icon: string;
}

interface FilterSelectorProps {
  filters: FilterOption[];
  selectedFilter: string | null;
  onFilterSelect: (filter: string | null) => void;
  label?: string;
}

export default function FilterSelector({ 
  filters, 
  selectedFilter, 
  onFilterSelect, 
  label 
}: FilterSelectorProps) {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      )}
      <View style={styles.filterList}>
        {filters.map((filter, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.filterCard,
              { backgroundColor: theme.card, borderColor: theme.border },
              selectedFilter === filter.value && styles.filterCardSelected,
            ]}
            onPress={() => onFilterSelect(filter.value)}
            activeOpacity={0.7}
          >
            <FontAwesome5 
              name={filter.icon} 
              size={28} 
              color={selectedFilter === filter.value ? theme.primary : theme.textSecondary} 
            />
            <Text 
              style={[
                styles.filterName,
                { color: selectedFilter === filter.value ? theme.primary : theme.text }
              ]}
            >
              {filter.name}
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
    fontSize: 16,
    fontWeight: '600',
  },
  filterList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  filterCardSelected: {
    borderWidth: 3,
  },
  filterName: {
    fontSize: 13,
    fontWeight: '600',
  },
});
