import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { callService, CallQuality } from '../services/call.service';

interface CallQualityIndicatorProps {
  callId: string;
  visible?: boolean;
}

export const CallQualityIndicator: React.FC<CallQualityIndicatorProps> = ({
  callId,
  visible = true,
}) => {
  const { theme } = useTheme();
  const [quality, setQuality] = useState<CallQuality | null>(null);

  useEffect(() => {
    if (!visible) return;

    const fetchQuality = async () => {
      try {
        // TODO: Connect to Firebase backend
        const mockData: CallQuality = {
          networkQuality: 'good',
          bandwidth: 0,
          latency: 0,
          packetLoss: 0,
          jitter: 0
        };
        setQuality(mockData);
      } catch (error) {
        console.error('Failed to fetch call quality:', error);
      }
    };

    // Initial fetch
    fetchQuality();

    // Poll every 5 seconds
    const interval = setInterval(fetchQuality, 5000);

    return () => clearInterval(interval);
  }, [callId, visible]);

  if (!visible || !quality) return null;

  const getQualityColor = () => {
    switch (quality.networkQuality) {
      case 'excellent':
        return '#34C759';
      case 'good':
        return '#32D74B';
      case 'fair':
        return '#FF9500';
      case 'poor':
        return '#FF3B30';
      default:
        return theme.textSecondary;
    }
  };

  const getQualityIcon = () => {
    switch (quality.networkQuality) {
      case 'excellent':
        return 'wifi';
      case 'good':
        return 'wifi';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'warning';
      default:
        return 'alert-circle';
    }
  };

  const getSignalBars = () => {
    switch (quality.networkQuality) {
      case 'excellent':
        return 4;
      case 'good':
        return 3;
      case 'fair':
        return 2;
      case 'poor':
        return 1;
      default:
        return 0;
    }
  };

  const signalBars = getSignalBars();

  return (
    <View
      style={[styles.container, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}
    >
      <View style={styles.signalBars}>
        {[1, 2, 3, 4].map((bar) => (
          <View
            key={bar}
            style={[
              styles.bar,
              {
                height: bar * 3 + 4,
                backgroundColor: bar <= signalBars ? getQualityColor() : 'rgba(255, 255, 255, 0.3)',
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.qualityText, { color: getQualityColor() }]}>
        {quality.networkQuality.charAt(0).toUpperCase() + quality.networkQuality.slice(1)}
      </Text>
      {quality.latency > 0 && (
        <Text style={[styles.latencyText, { color: '#fff' }]}>
          {quality.latency}ms
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  signalBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
    height: 16,
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
  },
  qualityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  latencyText: {
    fontSize: 10,
    fontWeight: '500',
    opacity: 0.8,
  },
});

export default CallQualityIndicator;
