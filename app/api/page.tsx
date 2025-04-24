// app/test/page.tsx
'use client'

import { supabase } from '@/lib/supabaseClient'
import { useEffect } from 'react'

export default function TestPage() {
  useEffect(() => {
    const fetchData = async () => {
      const { data } = await supabase.from('test').select('*')
      console.log(data)
    }
    fetchData()
  }, [])

  return <div>Check console for Supabase data</div>
}