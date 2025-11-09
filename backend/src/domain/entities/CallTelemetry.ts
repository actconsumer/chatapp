export interface ICallQualityMetrics {
  networkQuality: 'excellent' | 'good' | 'fair' | 'poor';
  bandwidth: number;
  latency: number;
  packetLoss: number;
  jitter: number;
}

export interface ICallTelemetry {
  id: string;
  callId: string;
  userId: string;
  durationSeconds: number;
  quality: ICallQualityMetrics;
  issues: string[];
  timestamp: string;
  createdAt: string;
}
