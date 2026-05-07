import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { FeatureFlagClient } from '../client/FeatureFlagClient';
import { SDKConfig, FlagOptions } from '../types';

// Create context
interface FeatureFlagContextValue {
  client: FeatureFlagClient;
  config: SDKConfig;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

// Provider component
interface FeatureFlagProviderProps {
  children: ReactNode;
  config: SDKConfig;
}

export function FeatureFlagProvider({ children, config }: FeatureFlagProviderProps) {
  const client = useMemo(() => new FeatureFlagClient(config), [config.apiUrl]);
  
  const value = useMemo(() => ({ client, config }), [client, config]);
  
  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

// Hook to use the client
function useFeatureFlagClient(): FeatureFlagClient {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlagClient must be used within FeatureFlagProvider');
  }
  return context.client;
}

/**
 * Hook for checking a single feature flag
 * 
 * EXAMPLE:
 * const { isEnabled, isLoading } = useFeatureFlag('dark_mode', {
 *   userId: 'user123'
 * });
 */
export function useFeatureFlag(flagKey: string, options?: FlagOptions) {
  const client = useFeatureFlagClient();
  
  // Use React's use hook (React 19) or useState
  const [isEnabled, setIsEnabled] = React.useState<boolean>(options?.fallback || false);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    let isMounted = true;
    
    const evaluate = async () => {
      try {
        setIsLoading(true);
        const result = await client.isEnabled(flagKey, options);
        if (isMounted) {
          setIsEnabled(result);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsEnabled(options?.fallback || false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    evaluate();
    
    return () => {
      isMounted = false;
    };
  }, [flagKey, options?.userId, options?.environment]);
  
  return { isEnabled, isLoading, error };
}

/**
 * Hook for multiple feature flags
 * 
 * EXAMPLE:
 * const flags = useFeatureFlags(['dark_mode', 'new_dashboard'], {
 *   userId: 'user123'
 * });
 */
export function useFeatureFlags(flagKeys: string[], options?: FlagOptions) {
  const client = useFeatureFlagClient();
  
  const [flags, setFlags] = React.useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<Error | null>(null);
  
  React.useEffect(() => {
    let isMounted = true;
    
    const evaluate = async () => {
      try {
        setIsLoading(true);
        const results = await client.getFlags(flagKeys, options);
        if (isMounted) {
          setFlags(results);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
          // Set fallbacks
          const fallbacks: Record<string, boolean> = {};
          for (const key of flagKeys) {
            fallbacks[key] = options?.fallback || false;
          }
          setFlags(fallbacks);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    evaluate();
  }, [flagKeys.join(','), options?.userId, options?.environment]);
  
  return { flags, isLoading, error };
}