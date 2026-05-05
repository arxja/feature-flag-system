'use client';

import { Search, Filter, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchAndFiltersProps } from '@/types/type';

const SearchAndFilters = ({
  search,
  onSearchChange,
  filterStatus,
  onFilterStatusChange,
  sortBy,
  onSortByChange,
  showFilters,
  onShowFiltersChange,
}: SearchAndFiltersProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            aria-label="Search feature flags"
            type="text"
            placeholder="Search flags by name, key, or description..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
        </div>

        <button
          onClick={() => onShowFiltersChange(!showFilters)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Filter className="w-4 h-4" />
          Filters
          <ChevronDown
            className={cn('w-4 h-4 transition-transform', showFilters && 'rotate-180')}
          />
        </button>
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 animate-in slide-in-from-top-2 duration-200">
          <select
          aria-label="Filter by status"
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <select
          aria-label="Sort feature flags"
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="updated">Recently Updated</option>
            <option value="name">Name (A-Z)</option>
            <option value="rollout">Rollout Percentage</option>
          </select>
        </div>
      )}
    </div>
  );
};

export default SearchAndFilters;
