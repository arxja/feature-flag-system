import axios, { AxiosInstance } from 'axios';
import { SDKConfig, EvaluationContext, EvaluationResult, FlagOptions } from '../types';

/**
 * Core SDK Client
 *
 * WHAT: Makes API calls to your feature flag server
 * WHY: Other apps use this instead of writing fetch() manually
 * HOW: Wraps HTTP calls with caching, retries, error handling
 *
 * EXAMPLE:
 * const client = new FeatureFlagClient({ apiUrl: 'http://localhost:3001' });
 * const enabled = await client.isEnabled('dark_mode', { userId: '123' });
 */
export class FeatureFlagClient {
  private client: AxiosInstance;
  private cache: Map<string, { result: boolean; expiresAt: number }>;
  private defaultTtl: number;
  private onError?: (error: Error) => void;

  constructor(config: SDKConfig) {
    this.cache = new Map();
    this.defaultTtl = (config.cacheTtl || 30) * 1000; // Convert to milliseconds
    this.onError = config.onError;

    // Create HTTP client
    this.client = axios.create({
      baseURL: config.apiUrl,
      timeout: config.timeout || 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Check if a feature flag is enabled for a user
   *
   * @param flagKey - The feature flag key (e.g., "dark_mode")
   * @param options - User context (userId, attributes, environment)
   * @returns boolean - true if feature is enabled
   *
   * EXAMPLE:
   * const showNewUI = await client.isEnabled('new_dashboard', {
   *   userId: 'user123',
   *   userAttributes: { tier: 'premium' }
   * });
   */
  async isEnabled(flagKey: string, options: FlagOptions = {}): Promise<boolean> {
    try {
      // Check cache first
      const cached = this.getFromCache(flagKey, options);
      if (cached !== null) {
        return cached;
      }

      // Make API call
      const context: EvaluationContext = {
        userId: options.userId,
        userAttributes: options.userAttributes,
        environment: options.environment,
      };

      const response = await this.client.get<EvaluationResult>(`/api/evaluate/${flagKey}`, {
        params: this.buildQueryParams(context),
      });

      const result = response.data.enabled;

      // Store in cache
      this.storeInCache(flagKey, options, result);

      return result;
    } catch (error) {
      // Handle errors gracefully
      if (this.onError) {
        this.onError(error instanceof Error ? error : new Error(String(error)));
      }

      console.error(`[FeatureFlagSDK] Failed to evaluate ${flagKey}:`, error);

      // Return fallback value or false
      return options.fallback !== undefined ? options.fallback : false;
    }
  }

  /**
   * Get multiple flags at once (batch evaluation)
   *
   * @param flagKeys - Array of flag keys
   * @param options - User context
   * @returns Record of flag key to boolean
   *
   * EXAMPLE:
   * const flags = await client.getFlags(['dark_mode', 'new_dashboard'], {
   *   userId: 'user123'
   * });
   * // { dark_mode: true, new_dashboard: false }
   */
  async getFlags(flagKeys: string[], options: FlagOptions = {}): Promise<Record<string, boolean>> {
    try {
      const context: EvaluationContext = {
        userId: options.userId,
        userAttributes: options.userAttributes,
        environment: options.environment,
      };

      const response = await this.client.post('/api/evaluate/batch', {
        flagKeys,
        ...context,
      });

      const results: Record<string, boolean> = {};
      for (const [key, evaluation] of Object.entries(response.data.flags || {})) {
        results[key] = (evaluation as EvaluationResult).enabled;
      }

      return results;
    } catch (error) {
      if (this.onError) {
        this.onError(error instanceof Error ? error : new Error(String(error)));
      }

      // Return fallback values
      const fallbacks: Record<string, boolean> = {};
      for (const key of flagKeys) {
        fallbacks[key] = options.fallback !== undefined ? options.fallback : false;
      }
      return fallbacks;
    }
  }

  /**
   * Clear the cache for a specific flag or all flags
   */
  clearCache(flagKey?: string): void {
    if (flagKey) {
      // Clear specific flag
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${flagKey}:`)) {
          this.cache.delete(key);
        }
      }
    } else {
      // Clear all cache
      this.cache.clear();
    }
  }

  /**
   * Get cache key for a flag + user
   */
  private getCacheKey(flagKey: string, options: FlagOptions): string {
    const userId = options.userId || 'anonymous';
    const environment = options.environment || 'production';
    const attrs = options.userAttributes
      ? JSON.stringify(
          Object.keys(options.userAttributes)
            .sort()
            .reduce(
              (acc, key) => {
                acc[key] = options.userAttributes![key];
                return acc;
              },
              {} as Record<string, unknown>
            )
        )
      : '{}';
    return `${flagKey}:${userId}:${environment}:${attrs}`;
  }

  /**
   * Get from cache if not expired
   */
  private getFromCache(flagKey: string, options: FlagOptions): boolean | null {
    const key = this.getCacheKey(flagKey, options);
    const cached = this.cache.get(key);

    if (cached && Date.now() < cached.expiresAt) {
      return cached.result;
    }
    if (cached) this.cache.delete(key)

    return null;
  }

  /**
   * Store result in cache
   */
  private storeInCache(flagKey: string, options: FlagOptions, result: boolean): void {
    const key = this.getCacheKey(flagKey, options);
    this.cache.set(key, {
      result,
      expiresAt: Date.now() + this.defaultTtl,
    });
  }

  /**
   * Build query params from context
   */
  private buildQueryParams(context: EvaluationContext): Record<string, any> {
    const params: Record<string, any> = {};

    if (context.userId) {
      params.userId = context.userId;
    }

    if (context.environment) {
      params.environment = context.environment;
    }

    if (context.userAttributes) {
      Object.assign(params, context.userAttributes);
    }

    return params;
  }
}
