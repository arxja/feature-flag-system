export interface EvaluationContext {
  userId?: string;
  userAttributes?: Record<string, any>;
  environment?: 'development' | 'staging' | 'production';
}

export interface EvaluationResult {
  flagKey: string;
  enabled: boolean;
  reason: string;
  timestamp: number;
  evaluationTimeMs: number;
}

export interface SDKConfig {
  apiUrl: string;
  cacheTtl?: number; // Time to live in seconds (default: 30)
  timeout?: number; // Request timeout in ms (default: 5000)
  onError?: (error: Error) => void;
}

export interface FlagOptions {
  userId?: string;
  userAttributes?: Record<string, any>;
  environment?: 'development' | 'staging' | 'production';
  fallback?: boolean;
}