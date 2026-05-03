'use client';

import { useState, useEffect, useRef } from 'react';
import { flagsApi } from '@/lib/api/client';
import { formatDate, getStatusColor, getRolloutColor } from '@/lib/utils';
import { Switch } from '@/components/ui/Switch';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/Dialog';
import CreateFlagForm from '@/components/CreateFlagForm';
import EditFlagForm from '@/components/EditFlagForm';
import { 
  Plus, 
  Search, 
  Tag, 
  Clock, 
  Users, 
  ChevronRight, 
  Trash2, 
  Edit2,
  Filter,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FeatureFlag {
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
}

// Todo (it's one of those big ones): break current page to smaller components

export default function DashboardPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedFlag, setSelectedFlag] = useState<FeatureFlag | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'rollout'>('updated');
  const [showFilters, setShowFilters] = useState(false);
  
  const latestFetchId = useRef(0);

  const fetchFlags = async () => {
    const fetchId = ++latestFetchId.current;
    
    try {
      setLoading(true);
      const response = await flagsApi.getAll({ search });
      
      if (fetchId !== latestFetchId.current) {
        return;
      }
      
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
      
      if (fetchId !== latestFetchId.current) {
        return;
      }
      
      setFlags(filteredFlags);
    } catch (error) {
      if (fetchId !== latestFetchId.current) {
        return;
      }
      console.error('Failed to fetch flags:', error);
    } finally {
      if (fetchId === latestFetchId.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchFlags();
  }, [search, filterStatus, sortBy]);

  const handleToggle = async (flag: FeatureFlag) => {
    try {
      await flagsApi.toggle(flag.key);
      await fetchFlags();
    } catch (error) {
      console.error('Failed to toggle flag:', error);
    }
  };

  const handleDelete = async (key: string) => {
    if (!confirm('Are you sure you want to delete this flag? This action cannot be undone.'))
      return;
    try {
      await flagsApi.delete(key);
      await fetchFlags();
    } catch (error) {
      console.error('Failed to delete flag:', error);
      alert('Failed to delete flag');
    }
  };

  const getStats = () => {
    const total = flags.length;
    const active = flags.filter(f => f.enabled).length;
    const avgRollout = Math.round(flags.reduce((acc, f) => acc + f.rolloutPercentage, 0) / total || 0);
    return { total, active, avgRollout };
  };

  const stats = getStats();

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-linear-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
                <Settings className="w-6 h-6 text-blue-black" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-linear-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                  Feature Flags
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Control feature rollouts with precision and confidence
                </p>
              </div>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <button className="inline-flex items-center px-5 py-2.5 bg-linear-to-r from-primary-600 to-primary-700 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] text-black">
                  <Plus className="w-4 h-4 mr-2" />
                  New Feature Flag
                </button>
              </DialogTrigger>
              <DialogContent title="Create New Feature Flag">
                <CreateFlagForm
                  onSuccess={() => {
                    setIsCreateModalOpen(false);
                    fetchFlags();
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Flags</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
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
                <p className="text-2xl font-bold text-primary-600">{stats.avgRollout}%</p>
              </div>
              <div className="p-3 bg-primary-50 rounded-lg">
                <TrendingUp className="w-5 h-5 text-primary-600" />
              </div>
            </div>
          </div>
        </div>
        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search flags by name, key, or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={cn("w-4 h-4 transition-transform", showFilters && "rotate-180")} />
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3 animate-in slide-in-from-top-2 duration-200">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="updated">Recently Updated</option>
                <option value="name">Name (A-Z)</option>
                <option value="rollout">Rollout Percentage</option>
              </select>
            </div>
          )}
        </div>
        {/* Flags Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-600"></div>
            <p className="mt-3 text-gray-500">Loading feature flags...</p>
          </div>
        ) : flags.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900">No flags found</h3>
            <p className="text-gray-500 mt-1 max-w-sm mx-auto">
              {search ? 'Try adjusting your search or filters' : 'Create your first feature flag to start managing rollouts'}
            </p>
            {!search && (
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-6 inline-flex items-center px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Flag
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {flags.map((flag, index) => (
              <div
                key={flag._id}
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
                        <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">Status</div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`w-2.5 h-2.5 rounded-full ${getStatusColor(flag.enabled)} animate-pulse`} />
                          <span className="text-sm font-semibold">
                            {flag.enabled ? (
                              <span className="text-green-600">Active</span>
                            ) : (
                              <span className="text-gray-500">Inactive</span>
                            )}
                          </span>
                        </div>
                      </div>
                      <Switch checked={flag.enabled} onCheckedChange={() => handleToggle(flag)} />
                    </div>
                  </div>
                  {/* Progress Bar */}
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
                  {/* Footer */}
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
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Created {formatDate(flag.createdAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors group/btn">
                            <Edit2 className="w-4 h-4 text-gray-500 group-hover/btn:text-primary-600 transition-colors" />
                          </button>
                        </DialogTrigger>
                        <DialogContent title="Edit Feature Flag">
                          <EditFlagForm
                            flag={flag}
                            onSuccess={() => {
                              fetchFlags();
                            }}
                          />
                        </DialogContent>
                      </Dialog>
                      
                      <button
                        onClick={() => handleDelete(flag.key)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group/btn"
                      >
                        <Trash2 className="w-4 h-4 text-gray-500 group-hover/btn:text-red-600 transition-colors" />
                      </button>
                      
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors group/btn">
                        <ChevronRight className="w-4 h-4 text-gray-500 group-hover/btn:text-gray-700 transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}