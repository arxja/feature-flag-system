import crypto from 'crypto';

export interface EvaluationContext {
    userId?: string;
    userAttributes?: Record<string, any>;
    environment?: 'development' | 'staging' | 'production';
    timestamp?: Date;
}

export interface EvaluationResult {
    flagKey: string;
    enabled: boolean;
    reason: string;
    timestamp: number;
    evaluationTimeMs: number;
}

export class FeatureFlagEvaluator {
  private static instance: FeatureFlagEvaluator;
  
  private constructor() {}
  
  static getInstance(): FeatureFlagEvaluator {
    if (!FeatureFlagEvaluator.instance) {
      FeatureFlagEvaluator.instance = new FeatureFlagEvaluator();
    }
    return FeatureFlagEvaluator.instance;
  }
  
  async evaluate(
    flag: any,
    context: EvaluationContext
  ): Promise<EvaluationResult> {
    const startTime = Date.now();
    
    if (!flag?.enabled) {
        return this.createResult(flag?.key, false, 'globally_disabled', startTime);
    }
    
    if (flag.schedule?.enabled) {
        const now = new Date();
        if (flag.schedule.startDate && now < new Date(flag.schedule.startDate)) {
            return this.createResult(flag.key, false, 'scheduled_not_started', startTime);
        }
        if (flag.schedule.endDate && now > new Date(flag.schedule.endDate)) {
            return this.createResult(flag.key, false, 'schedule_expired', startTime);
        }
    }
    
    if (context.environment) {
        const envConfig = flag.environments?.find(
            (e: any) => e.name === context.environment
        );
        if (envConfig && !envConfig.enabled) {
            return this.createResult(
            flag.key,
            false,
            `disabled_in_${context.environment}`,
            startTime
            );
        }
    }
    
    if (flag.targetingRules && flag.targetingRules.length > 0) {
        const targetingResult = this.evaluateTargetingRules(flag, context);
        if (targetingResult.matched) {
            return this.createResult(
                flag.key,
                true,
                targetingResult.reason,
                startTime
            );
        }
    }
    
    const rolloutPercentage = this.getEffectiveRollout(flag, context.environment);
    if (rolloutPercentage > 0 && context.userId) {
        const isInRollout = this.isUserInRollout(context.userId, flag.key, rolloutPercentage);
        if (isInRollout) {
            return this.createResult(flag.key, true, 'percentage_rollout', startTime);
        }
    }
    
    return this.createResult(flag.key, false, 'no_rules_matched', startTime);
  }
  private evaluateTargetingRules(
    flag: any,
    context: EvaluationContext
  ): { matched: boolean; reason: string } {
    
    for (const rule of flag.targetingRules) {
      switch (rule.type) {
        case 'whitelist':
          if (context.userId && rule.value.includes(context.userId)) {
            return { matched: true, reason: 'whitelisted_user' };
          }
          break;
          
        case 'user_ids':
          // Specific user IDs
          if (context.userId && rule.value.includes(context.userId)) {
            return { matched: true, reason: 'specific_user_match' };
          }
          break;
          
        case 'user_attribute':
          if (context.userAttributes) {
            const [key, expectedValue] = Object.entries(rule.value)[0] ?? [];
            if (key && context.userAttributes[key] === expectedValue) {
              return { matched: true, reason: `user_attribute_${key}_match` };
            }
          }
          break;
          
        case 'percentage':
          if (context.userId) {
            const isInRule = this.isUserInRollout(
              context.userId,
              `${flag.key}_rule_${rule.type}`,
              rule.value
            );
            if (isInRule) {
              return { matched: true, reason: 'rule_percentage_match' };
            }
          }
          break;
      }
    }
    
    return { matched: false, reason: 'no_targeting_match' };
  }
  
  private isUserInRollout(userId: string, flagKey: string, percentage: number): boolean {
    if (percentage >= 100) return true;
    if (percentage <= 0) return false;
    
    const hash = this.deterministicHash(`${userId}:${flagKey}`);
    const percentile = hash % 100;
    
    return percentile < percentage;
  }
  
  private deterministicHash(input: string): number {
    const hash = crypto.createHash('md5').update(input).digest('hex');
    return parseInt(hash.substring(0, 8), 16);
  }
  
  private getEffectiveRollout(flag: any, environment?: string): number {
    if (environment) {
      const envConfig = flag.environments?.find((e: any) => e.name === environment);
      if (envConfig?.rolloutPercentage !== undefined) {
        return envConfig.rolloutPercentage;
      }
    }
    return flag.rolloutPercentage || 0;
  }
  
  private createResult(
    flagKey: string,
    enabled: boolean,
    reason: string,
    startTime: number
  ): EvaluationResult {
    return {
      flagKey,
      enabled,
      reason,
      timestamp: Date.now(),
      evaluationTimeMs: Date.now() - startTime,
    };
  }
  
  async evaluateBulk(
    flags: any[],
    context: EvaluationContext
  ): Promise<Record<string, EvaluationResult>> {
    const results: Record<string, EvaluationResult> = {};
    
    for (const flag of flags) {
      results[flag.key] = await this.evaluate(flag, context);
    }
    
    return results;
  }
}

export const evaluator = FeatureFlagEvaluator.getInstance();