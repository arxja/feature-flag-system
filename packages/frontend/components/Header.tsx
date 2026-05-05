"use client"

import { HeaderProps } from '@/types/type';
import { Plus, Settings } from 'lucide-react';

const Header = ({ onCreateClick }: HeaderProps) => {
  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-linear-to-br from-primary-500 to-primary-600 rounded-xl shadow-lg">
              <Settings className="w-6 h-6 text-black" />
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
          <button
            type="button"
            onClick={onCreateClick}
            className="inline-flex items-center px-5 py-2.5 bg-linear-to-r from-primary-600 to-primary-700 rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] text-black"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Feature Flag
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header