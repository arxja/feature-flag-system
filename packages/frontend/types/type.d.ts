export interface FeatureFlag {
  _id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  rolloutPercentage: number;
  tags: string[];
  targetingRules: any[];
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface FlagStats {
  total: number;
  active: number;
  avgRollout: number;
}

export interface UseFlagsOptions {
  search?: string;
  filterStatus?: 'all' | 'active' | 'inactive';
  sortBy?: 'name' | 'updated' | 'rollout';
}

export interface StatsCardsProps {
  total: number;
  active: number;
  avgRollout: number;
}