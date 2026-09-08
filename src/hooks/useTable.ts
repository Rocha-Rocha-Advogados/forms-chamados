import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, supabaseConfigured } from '../lib/supabase'
import type { TableName, TableInsert, TableRow } from '../lib/types'

type Row<T extends TableName> = TableRow<T>
type Insert<T extends TableName> = TableInsert<T>

type Options = {
  /** Coluna de ordenação e direção. */
  orderBy?: string
  ascending?: boolean
  /** Recebe alterações de outros usuários em tempo real. */
  realtime?: boolean
}

type ComId = { id: string } & Record<string, unknown>

/**
 * CRUD de uma tabela do Supabase com atualização otimista.
 *
 * A tela nunca é remontada por causa de atualização: só a primeira carga
 * mostra "carregando". Depois disso tudo entra por cima do que já está na
 * tela — evento de tempo real aplica o próprio registro que veio no evento
 * (sem buscar a tabela de novo), e a busca manual/ao voltar para a aba roda
 * em segundo plano, sinalizada só pelo `refreshing`.
 */
export function useTable<T extends TableName>(table: T, options: Options = {}) {
  const { orderBy = 'created_at', ascending = false, realtime = true } = options

  const [rows, setRows] = useState<Array<Row<T>>>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const montado = useRef(true)
  const jaCarregou = useRef(false)

  useEffect(() => {
    montado.current = true
    return () => {
      montado.current = false
    }
  }, [])

  const ordenar = useCallback(
    (lista: Array<Row<T>>) =>
      [...lista].sort((a, b) => {
        const x = (a as Record<string, unknown>)[orderBy]
        const y = (b as Record<string, unknown>)[orderBy]
        if (x === y) return 0
        // nulos por último, independente da direção
        if (x == null) return 1
        if (y == null) return -1
        return (x < y ? -1 : 1) * (ascending ? 1 : -1)
      }),
    [orderBy, ascending],
  )

  const load = useCallback(async () => {
    if (!supabaseConfigured) {
      setLoading(false)
      setError('Supabase não configurado: preencha VITE_SUPABASE_ANON_KEY no arquivo .env.')
      return
    }
    if (jaCarregou.current) setRefreshing(true)
    const { data, error: err } = await supabase.from(table).select('*').order(orderBy, { ascending })
    if (!montado.current) return
    if (err) setError(err.message)
    else {
      setError(null)
      setRows((data ?? []) as Array<Row<T>>)
    }
    jaCarregou.current = true
    setLoading(false)
    setRefreshing(false)
  }, [table, orderBy, ascending])

  useEffect(() => {
    void load()
  }, [load])

  // tempo real: aplica o registro do evento, sem refazer a consulta
  useEffect(() => {
    if (!realtime || !supabaseConfigured) return
    const canal = supabase
      .channel(`realtime:${table}`)
      .on<ComId>('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        setRows((prev) => {
          const novo = payload.new as Row<T> | undefined
          const antigo = payload.old as { id?: string } | undefined
          if (payload.eventType === 'DELETE') {
            return antigo?.id ? prev.filter((r) => (r as ComId).id !== antigo.id) : prev
          }
          if (!novo) return prev
          const id = (novo as ComId).id
          const existe = prev.some((r) => (r as ComId).id === id)
          return ordenar(existe ? prev.map((r) => ((r as ComId).id === id ? novo : r)) : [novo, ...prev])
        })
      })
      .subscribe()
    return () => {
      void supabase.removeChannel(canal)
    }
  }, [table, realtime, ordenar])

  // ao voltar para a aba, busca em segundo plano (rede de segurança se o
  // tempo real não estiver habilitado na tabela)
  useEffect(() => {
    const aoVoltar = () => {
      if (document.visibilityState === 'visible') void load()
    }
    window.addEventListener('focus', aoVoltar)
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      window.removeEventListener('focus', aoVoltar)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [load])

  const insert = useCallback(
    async (values: Insert<T>) => {
      const { data, error: err } = await supabase.from(table).insert(values).select().single()
      if (err) {
        setError(err.message)
        return { ok: false as const, error: err.message }
      }
      setRows((prev) => ordenar([data as Row<T>, ...prev]))
      return { ok: true as const, row: data as Row<T> }
    },
    [table, ordenar],
  )

  const update = useCallback(
    async (id: string, patch: Partial<Row<T>>) => {
      let anterior: Row<T> | undefined
      setRows((prev) =>
        prev.map((row) => {
          if ((row as ComId).id !== id) return row
          anterior = row
          return { ...row, ...patch }
        }),
      )
      const { data, error: err } = await supabase
        .from(table)
        .update(patch as Row<T>)
        .eq('id', id)
        .select()
        .single()
      if (err) {
        if (anterior) setRows((prev) => prev.map((row) => ((row as ComId).id === id ? anterior! : row)))
        setError(err.message)
        return { ok: false as const, error: err.message }
      }
      setRows((prev) => prev.map((row) => ((row as ComId).id === id ? (data as Row<T>) : row)))
      return { ok: true as const }
    },
    [table],
  )

  const remove = useCallback(
    async (id: string) => {
      let anteriores: Array<Row<T>> = []
      setRows((prev) => {
        anteriores = prev
        return prev.filter((row) => (row as ComId).id !== id)
      })
      const { error: err } = await supabase.from(table).delete().eq('id', id)
      if (err) {
        setRows(anteriores)
        setError(err.message)
        return { ok: false as const, error: err.message }
      }
      return { ok: true as const }
    },
    [table],
  )

  return { rows, loading, refreshing, error, reload: load, insert, update, remove, setError }
}
