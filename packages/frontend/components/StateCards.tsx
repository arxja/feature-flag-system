'use client';

import { StatsCardsProps } from '@/types/type';
import { Settings, CheckCircle2, TrendingUp } from 'lucide-react';

const StateCards = ({ total, active, avgRollout }: StatsCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Total Flags</p>
            <p className="text-2xl font-bold text-gray-900">{total}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <Settings className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Active Flags</p>
            <p className="text-2xl font-bold text-green-600">{active}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Avg. Rollout</p>
            <p className="text-2xl font-bold text-primary-600">{avgRollout}%</p>
          </div>
          <div className="p-3 bg-primary-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-primary-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StateCards;
