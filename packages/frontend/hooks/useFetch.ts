import { useState, useEffect, useRef } from 'react';
import { flagsApi } from '@/lib/api/client';
import { FeatureFlag, UseFlagsOptions } from '@/types/type';



export function useFlags({
  search = '',
  filterStatus = 'all',
  sortBy = 'updated',
}: UseFlagsOptions = {}) {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const latestFetchId = useRef(0);

  const fetchFlags = async () => {
    const fetchId = ++latestFetchId.current;

    try {
      setLoading(true);
      setError(null);
      const response = await flagsApi.getAll({ search });

      if (fetchId !== latestFetchId.current) return;

      let filteredFlags = response.data.data || [];

      if (filterStatus === 'active') {
        filteredFlags = filteredFlags.filter((f: FeatureFlag) => f.enabled);
      } else if (filterStatus === 'inactive') {
        filteredFlags = filteredFlags.filter((f: FeatureFlag) => !f.enabled);
      }

      filteredFlags.sort((a: FeatureFlag, b: FeatureFlag) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'rollout') return b.rolloutPercentage - a.rolloutPercentage;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      if (fetchId !== latestFetchId.current) return;

      setFlags(filteredFlags);
    } catch (err) {
      if (fetchId !== latestFetchId.current) return;
      setError(err instanceof Error ? err.message : 'Failed to fetch flags');
      console.error('Failed to fetch flags:', err);
    } finally {
      if (fetchId === latestFetchId.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchFlags();
  }, [search, filterStatus, sortBy]);

  const refetch = () => {
    fetchFlags();
  };

  return { flags, loading, error, refetch };
}
