import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

type ColorTuple = [string, string] | [string, string, string];

export interface GradientOption {
  name: string;
  colors: ColorTuple;
  icon: string;
}

interface GradientSelectorProps {
  gradients: GradientOption[];
  selectedGradient: GradientOption;
  onGradientSelect: (gradient: GradientOption) => void;
  label?: string;
  cardView?: boolean;
}

export default function GradientSelector({ 
  gradients, 
  selectedGradient, 
  onGradientSelect, 
  label,
  cardView = false 
}: GradientSelectorProps) {
  const { theme } = useTheme();

  if (cardView) {
    return (
      <View style={styles.container}>
        {label && (
          <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        )}
        <View style={styles.cardList}>
          {gradients.map((gradient, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => onGradientSelect(gradient)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={[...gradient.colors]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.gradientCard,
                  selectedGradient.name === gradient.name && styles.gradientCardSelected,
                ]}
              >
                <MaterialCommunityIcons name={gradient.icon as any} size={32} color="#fff" />
                <Text style={styles.gradientName}>{gradient.name}</Text>
                {selectedGradient.name === gradient.name && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.circleList}>
          {gradients.map((gradient, index) => (
            <View key={index} style={styles.circleWrapper}>
              <TouchableOpacity
                onPress={() => onGradientSelect(gradient)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={[...gradient.colors]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.gradientCircle,
                    selectedGradient.name === gradient.name && styles.gradientCircleSelected,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={gradient.icon as any}
                    size={24}
                    color="rgba(255,255,255,0.9)"
                  />
                </LinearGradient>
              </TouchableOpacity>
              {selectedGradient.name === gradient.name && (
                <View style={styles.checkmark}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>
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
  circleList: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 8,
  },
  circleWrapper: {
    position: 'relative',
  },
  gradientCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientCircleSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  checkmark: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#fff',
    borderRadius: 10,
  },
  cardList: {
    gap: 12,
  },
  gradientCard: {
    height: 100,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  gradientCardSelected: {
    borderWidth: 3,
    borderColor: '#fff',
  },
  gradientName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
});
