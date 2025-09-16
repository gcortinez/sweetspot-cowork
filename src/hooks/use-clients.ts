'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useApi } from '@/hooks/use-api'
import { Client } from '@/lib/validations/clients'

export function useClients() {
  const api = useApi()

  return useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const response = await api.get('/api/clients')
      if (!response.ok) {
        throw new Error('Failed to fetch clients')
      }
      const data = await response.json()
      return data.data || []
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useCreateClient() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (clientData: any) => {
      const response = await api.post('/api/clients', clientData)
      if (!response.ok) {
        throw new Error('Failed to create client')
      }
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch clients
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })
}

export function useLeads() {
  const api = useApi()

  return useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      const response = await api.get('/api/leads')
      if (!response.ok) {
        throw new Error('Failed to fetch leads')
      }
      const data = await response.json()
      return data.data || data || []
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (leads change more frequently)
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useCreateLead() {
  const api = useApi()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (leadData: any) => {
      const response = await api.post('/api/leads', leadData)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create lead')
      }
      return response.json()
    },
    onSuccess: () => {
      // Invalidate and refetch leads
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
    onError: (error: any) => {
      console.error('Error creating lead:', error)
    },
  })
}

export function useDashboardStats() {
  const api = useApi()

  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/api/dashboard/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats')
      }
      return response.json()
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 6 * 60 * 1000, // 6 minutes
  })
}