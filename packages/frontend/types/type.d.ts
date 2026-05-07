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

export interface SearchAndFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterStatus: 'all' | 'active' | 'inactive';
  onFilterStatusChange: (value: 'all' | 'active' | 'inactive') => void;
  sortBy: 'name' | 'updated' | 'rollout';
  onSortByChange: (value: 'name' | 'updated' | 'rollout') => void;
  showFilters: boolean;
  onShowFiltersChange: (value: boolean) => void;
}

export interface FlagCardProps {
  flag: FeatureFlag;
  index: number;
  onToggle: (flag: FeatureFlag) => Promise<void>;
  onDelete: (key: string) => Promise<void>;
  onRefresh: () => void;
}

export interface EmptyStateProps {
  search: string;
  onCreateClick: () => void;
}

export interface HeaderProps {
  onCreateClick: () => void;
}

export interface FlagUpdateEvent {
  type: 'flag_update';
  flagKey: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'TOGGLE';
  timestamp: number;
  version?: number;
  flag?: {
    key: string;
    name: string;
    enabled: boolean;
    rolloutPercentage: number;
    tags: string[];
    version: number;
  };
}

export interface BulkUpdateEvent {
  type: 'bulk_update';
  flagKeys: string[];
  action: 'BULK_UPDATE';
  timestamp: number;
}

export type SSEEvent = FlagUpdateEvent | BulkUpdateEvent;