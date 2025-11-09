import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface DateSeparatorProps {
  date: Date;
  customDateColor?: string;
  hasGradientBackground?: boolean;
}

const DateSeparator: React.FC<DateSeparatorProps> = ({ date, customDateColor, hasGradientBackground }) => {
  const { theme } = useTheme();

  const formatDate = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Use black text for gradient backgrounds, otherwise use custom or theme color
  const textColor = hasGradientBackground ? '#000000' : (customDateColor || theme.textSecondary);
  const backgroundColor = hasGradientBackground ? '#FFFFFF' : theme.surface;

  return (
    <View style={styles.container}>
      <View style={[styles.badge, { backgroundColor }]}>
        <Text style={[styles.text, { color: textColor }]}>
          {formatDate(date)}
        </Text>
      </View>
    </View>
  );
};

export default memo(DateSeparator);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 16,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
