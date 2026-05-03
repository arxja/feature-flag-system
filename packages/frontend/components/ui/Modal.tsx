'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
};

export function Modal({ isOpen, onClose, title, children, maxWidth = 'lg' }: ModalProps) {
    useEffect(() => {
        if (isOpen) {
        document.body.style.overflow = 'hidden';
        } else {
        document.body.style.overflow = 'unset';
        }
        return () => {
        document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto animate-fade-in">
        {/* Backdrop */}
        <div
            className="fixed inset-0 backdrop-blur-[2px] bg-opacity-50 transition-opacity"
            onClick={onClose}
        />
        
        {/* Modal Panel */}
        <div className="flex min-h-full items-center justify-center p-4">
            <div className={`relative w-full ${maxWidthClasses[maxWidth]} bg-white rounded-lg shadow-xl animate-slide-in`}>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                <button
                onClick={onClose}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 transition-colors"
                >
                <X />
                </button>
            </div>
            
            {/* Content */}
            <div className="px-6 py-4">
                {children}
            </div>
            </div>
        </div>
        </div>
    );
}