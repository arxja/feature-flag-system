'use client';

import { useState } from 'react';
import {
  Tag,
  Clock,
  Users,
  ChevronRight,
  Trash2,
  Edit2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Switch } from '@/components/ui/Switch';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/Dialog';
import EditFlagForm from '@/components/EditFlagForm';
import { formatDate, getStatusColor, getRolloutColor } from '@/lib/utils';
import { FlagCardProps } from '@/types/type';

const FlagCard = ({ flag, index, onToggle, onDelete, onRefresh }: FlagCardProps) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <div
      className="group bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                {flag.name}
              </h3>
              <code className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-mono">
                {flag.key}
              </code>
              {flag.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-linear-to-r from-gray-100 to-gray-50 text-gray-700 border border-gray-200"
                >
                  <Tag className="w-3 h-3 mr-1" />
                  {tag}
                </span>
              ))}
            </div>
            {flag.description && (
              <p className="text-sm text-gray-500 line-clamp-2">{flag.description}</p>
            )}
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="text-right min-w-20">
              <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">
                Status
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${getStatusColor(flag.enabled)} animate-pulse`}
                />
                <span className="text-sm font-semibold">
                  {flag.enabled ? (
                    <span className="text-green-600">Active</span>
                  ) : (
                    <span className="text-gray-500">Inactive</span>
                  )}
                </span>
              </div>
            </div>
            <Switch checked={flag.enabled} onCheckedChange={() => onToggle(flag)} />
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-gray-600 font-medium">Rollout Progress</span>
              {flag.rolloutPercentage === 100 && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Full Rollout
                </span>
              )}
              {flag.rolloutPercentage === 0 && flag.enabled && (
                <span className="inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                  <AlertCircle className="w-3 h-3" />
                  Draft Mode
                </span>
              )}
            </div>
            <span className="font-bold text-primary-600">{flag.rolloutPercentage}%</span>
          </div>
          <div className="relative w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`${getRolloutColor(flag.rolloutPercentage)} h-2.5 rounded-full transition-all duration-500 ease-out relative`}
              style={{ width: `${flag.rolloutPercentage}%` }}
            >
              <div className="absolute inset-0 bg-linear-to-r from-transparent to-white/20 animate-shimmer" />
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs border-t border-gray-100">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Updated {formatDate(flag.updatedAt)}</span>
            </div>
            {flag.targetingRules.length > 0 && (
              <div className="flex items-center gap-1.5 text-gray-500">
                <Users className="w-3.5 h-3.5" />
                <span>{flag.targetingRules.length} targeting rule(s)</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
              <DialogTrigger asChild>
                <button type='button' aria-label='Edit feature flag' className="p-2 hover:bg-gray-100 rounded-lg transition-colors group/btn">
                  <Edit2 className="w-4 h-4 text-gray-500 group-hover/btn:text-primary-600 transition-colors" />
                </button>
              </DialogTrigger>
              <DialogContent title="Edit Feature Flag">
                <EditFlagForm
                  flag={flag}
                  onSuccess={() => {
                    setIsEditModalOpen(false);
                    onRefresh();
                  }}
                />
              </DialogContent>
            </Dialog>

            <button
            type='button' 
            aria-label='Delete feature flag'
              onClick={() => onDelete(flag.key)}
              className="p-2 hover:bg-red-50 rounded-lg transition-colors group/btn"
            >
              <Trash2 className="w-4 h-4 text-gray-500 group-hover/btn:text-red-600 transition-colors" />
            </button>

            <button type='button' aria-label='View feature flag details' className="p-2 hover:bg-gray-100 rounded-lg transition-colors group/btn">
              <ChevronRight className="w-4 h-4 text-gray-500 group-hover/btn:text-gray-700 transition-colors" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlagCard;
