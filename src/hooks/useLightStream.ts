'use client'
import { useEffect, useRef } from 'react'
import { useHomeStore } from '@/lib/store'
import type { Light } from '@/lib/types'

export function useLightStream() {
  const setLights = useHomeStore(s => s.setLights)
  const retryRef = useRef<ReturnType<typeof setTimeout>>()
  const esRef = useRef<EventSource>()

  useEffect(() => {
    function connect() {
      const es = new EventSource('/api/sse')
      esRef.current = es

      es.addEventListener('lights', (e) => {
        try {
          const lights: Light[] = JSON.parse(e.data)
          setLights(lights)
        } catch {}
      })

      es.onerror = () => {
        es.close()
        retryRef.current = setTimeout(connect, 5000)
      }
    }

    connect()
    return () => {
      esRef.current?.close()
      if (retryRef.current) clearTimeout(retryRef.current)
    }
  }, [setLights])
}
