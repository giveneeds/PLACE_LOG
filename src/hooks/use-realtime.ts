import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function useRealtimeUpdates(
  channel: string,
  event: string,
  callback: (payload: any) => void
) {
  useEffect(() => {
    const supabase = createClient()
    
    const subscription = supabase
      .channel(channel)
      .on('broadcast', { event }, callback)
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [channel, event, callback])
}