import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface OHLCVBar {
  timestamp_ms: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MktDataResult {
  id: string
  user_id: string
  symbol: string
  market_type: string
  timeframe: string
  ohlcv: any
  data_sources: any
  confidence_score: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export const useMktData = () => {
  const [data, setData] = useState<MktDataResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedSymbol, setLastUpdatedSymbol] = useState<string | null>(null)

  useEffect(() => {
    let channel: RealtimeChannel

    const fetchData = async () => {
      try {
        setIsLoading(true)
        const { data: results, error: fetchError } = await supabase
          .from('mkt_data_results')
          .select('*')
          .order('updated_at', { ascending: false })

        if (fetchError) throw fetchError

        setData(results || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching mkt data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch data')
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchData()

    // Subscribe to real-time updates
    channel = supabase
      .channel('mkt-data-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mkt_data_results'
        },
        (payload) => {
          console.log('Real-time update:', payload)
          
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setData(prevData => {
              const newRecord = payload.new as MktDataResult
              
              // Set the last updated symbol for live indicator
              setLastUpdatedSymbol(newRecord.symbol)
              setTimeout(() => setLastUpdatedSymbol(null), 5000) // Clear after 5 seconds
              
              const existingIndex = prevData.findIndex(
                item => item.id === newRecord.id
              )
              
              if (existingIndex >= 0) {
                // Update existing
                const updated = [...prevData]
                updated[existingIndex] = newRecord
                return updated
              } else {
                // Add new
                return [newRecord, ...prevData]
              }
            })
          } else if (payload.eventType === 'DELETE') {
            setData(prevData => 
              prevData.filter(item => item.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [])

  const initializeConfig = async () => {
    try {
      const { data: existingConfig } = await supabase
        .from('mkt_data_config')
        .select('*')
        .single()

      if (!existingConfig) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('mkt_data_config')
            .insert({
              user_id: user.id,
              symbols: [],
              timeframes: ['1h', '4h', '1d'],
              lookback_bars: 100,
              market_types: ['spot', 'futures'],
              enabled: true
            })
        }
      }
    } catch (error) {
      console.error('Error initializing config:', error)
    }
  }

  return {
    data,
    isLoading,
    error,
    initializeConfig,
    lastUpdatedSymbol
  }
}
