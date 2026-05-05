'use client';

import { EmptyStateProps } from '@/types/type';
import { Plus } from 'lucide-react';

const EmptyState = ({ search, onCreateClick }: EmptyStateProps) => {
  return (
    <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900">No flags found</h3>
      <p className="text-gray-500 mt-1 max-w-sm mx-auto">
        {search
          ? 'Try adjusting your search or filters'
          : 'Create your first feature flag to start managing rollouts'}
      </p>
      {!search && (
        <button
        type='button'
          onClick={onCreateClick}
          className="mt-6 inline-flex items-center px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Your First Flag
        </button>
      )}
    </div>
  );
};

export default EmptyState;
