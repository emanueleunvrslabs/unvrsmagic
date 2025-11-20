import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'

export const useTriggerMktData = () => {
  const [isTriggering, setIsTriggering] = useState(false)

  const triggerDataCollection = async () => {
    setIsTriggering(true)
    
    try {
      toast.info('Avvio raccolta dati storici...', {
        description: 'Sto raccogliendo 500 candele per ogni simbolo'
      })

      const { data, error } = await supabase.functions.invoke('mkt-data-scheduler', {
        body: {}
      })

      if (error) throw error

      toast.success('Raccolta dati completata!', {
        description: 'Il grafico verrà aggiornato automaticamente'
      })

      return data
    } catch (error) {
      console.error('Error triggering MKT.DATA:', error)
      toast.error('Errore durante la raccolta dati', {
        description: error instanceof Error ? error.message : 'Errore sconosciuto'
      })
      throw error
    } finally {
      setIsTriggering(false)
    }
  }

  return {
    triggerDataCollection,
    isTriggering
  }
}
