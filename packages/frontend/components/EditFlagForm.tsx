'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { editFlagFormSchema, type EditFlagFormData } from '@/lib/validation/flagSchemas';
import { flagsApi } from '@/lib/api/client';
import { useState } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EditFlagFormProps {
  flag: {
    key: string;
    name: string;
    description?: string;
    enabled: boolean;
    rolloutPercentage: number;
    tags: string[];
  };
  onSuccess: () => void;
}

const EditFlagForm = ({ flag, onSuccess }: EditFlagFormProps) => {
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(flag.tags);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<EditFlagFormData>({
    resolver: zodResolver(editFlagFormSchema),
    defaultValues: {
      name: flag.name,
      description: flag.description || '',
      enabled: flag.enabled,
      rolloutPercentage: flag.rolloutPercentage,
      tags: flag.tags,
    },
  });

  const rolloutPercentage = watch('rolloutPercentage');

  const addTag = () => {
    const trimmedTag = tagInput.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      const newTags = [...tags, trimmedTag];
      setTags(newTags);
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    const newTags = tags.filter(t => t !== tag);
    setTags(newTags);
    setValue('tags', newTags);
  };

  const onSubmit = async (data: EditFlagFormData) => {
    try {
      setServerError(null);
      await flagsApi.update(flag.key, data);
      onSuccess();
    } catch (error: any) {
      console.error('Failed to update flag:', error);
      setServerError(error.response?.data?.error || 'Failed to update flag');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Server Error */}
      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {serverError}
        </div>
      )}

      {/* Display Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Display Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          {...register('name')}
          className={cn(
            "w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500",
            errors.name ? "border-red-500" : "border-gray-300"
          )}
          placeholder="e.g., New Checkout Flow"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          {...register('description')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          rows={3}
          placeholder="What does this feature do? Who is it for?"
        />
        {errors.description && (
          <p className="mt-1 text-xs text-red-500">{errors.description.message}</p>
        )}
      </div>

      {/* Rollout Percentage */}
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Rollout Percentage
          </label>
          <span className="text-sm font-bold text-primary-600">
            {rolloutPercentage}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          {...register('rolloutPercentage', { valueAsNumber: true })}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0% (No one)</span>
          <span>50% (Half of users)</span>
          <span>100% (Everyone)</span>
        </div>
        {errors.rolloutPercentage && (
          <p className="mt-1 text-xs text-red-500">{errors.rolloutPercentage.message}</p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            placeholder="e.g., frontend, payment, experimental"
          />
          <button
            type="button"
            onClick={addTag}
            className="inline-flex items-center gap-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-50 text-primary-700 text-xs font-medium rounded-full"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-0.5 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        {errors.tags && (
          <p className="mt-1 text-xs text-red-500">{errors.tags.message}</p>
        )}
      </div>

      {/* Enabled Toggle */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            {...register('enabled')}
            className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700">Flag is enabled</span>
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
    </form>
  );
};

export default EditFlagForm;