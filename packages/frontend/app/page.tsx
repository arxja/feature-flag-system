"use client"

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import CreateFlagForm from '@/components/CreateFlagForm';
import  Header  from '@/components//Header';
import  SearchAndFilters  from '@/components//SearchAndFilters';
import  FlagCard  from '@/components//FlagCard';
import  EmptyState  from '@/components//EmptyState';
import  LoadingSpinner  from '@/components/ui/LoadingSpinner';
import { flagsApi } from '@/lib/api/client';
import { useFlags } from '@/hooks/useFetch';
import StateCards from '@/components/StateCards';

export default function DashboardPage() {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'rollout'>('updated');
  const [showFilters, setShowFilters] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { flags, loading, refetch } = useFlags({
    search,
    filterStatus,
    sortBy,
  });

  const handleToggle = async (flag: any) => {
    try {
      await flagsApi.toggle(flag.key);
      await refetch();
    } catch (error) {
      console.error('Failed to toggle flag:', error);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm('Are you sure you want to delete this flag? This action cannot be undone.'))
      return;
    try {
      await flagsApi.delete(key);
      await refetch();
    } catch (error) {
      console.error('Failed to delete flag:', error);
      alert('Failed to delete flag');
    }
  };

  const stats = {
    total: flags.length,
    active: flags.filter((f) => f.enabled).length,
    avgRollout: Math.round(
      flags.reduce((acc, f) => acc + f.rolloutPercentage, 0) / (flags.length || 1)
    ),
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      <Header onCreateClick={() => setIsCreateModalOpen(true)} />

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent title="Create New Feature Flag">
          <CreateFlagForm
            onSuccess={() => {
              setIsCreateModalOpen(false);
              refetch();
            }}
          />
        </DialogContent>
      </Dialog>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <StateCards total={stats.total} active={stats.active} avgRollout={stats.avgRollout} />

        <SearchAndFilters
          search={search}
          onSearchChange={setSearch}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          showFilters={showFilters}
          onShowFiltersChange={setShowFilters}
        />

        {loading ? (
          <LoadingSpinner />
        ) : flags.length === 0 ? (
          <EmptyState search={search} onCreateClick={() => setIsCreateModalOpen(true)} />
        ) : (
          <div className="space-y-4">
            {flags.map((flag, index) => (
              <FlagCard
                key={flag._id}
                flag={flag}
                index={index}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onRefresh={refetch}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
