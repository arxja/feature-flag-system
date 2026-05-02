import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 10000,
});

export const flagsApi = {
    getAll: (params?: {
        search?: string;
        tags?: string[];
        enabled?: boolean;
        page?: number;
        limit?: number;
    }) => apiClient.get('/api/admin/flags', { params }),
    
    getOne: (key: string) => apiClient.get(`/api/admin/flags/${key}`),
    
    create: (data: any) => apiClient.post('/api/admin/flags', data),
    
    update: (key: string, data: any) => apiClient.patch(`/api/admin/flags/${key}`, data),
    
    toggle: (key: string) => apiClient.patch(`/api/admin/flags/${key}`, { toggle: true }),
    
    delete: (key: string) => apiClient.delete(`/api/admin/flags/${key}`),
    
    getTags: () => apiClient.get('/api/admin/flags/tags'),
};