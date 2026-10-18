/** 极简异步取数：loading / ready / error + 重试。`key` 变了就重取（等价于依赖数组）。 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { describeError } from './useList.js'

export interface Async<T> {
  status: 'loading' | 'ready' | 'error'
  data?: T
  error?: string
  reload: () => void
}

export function useAsync<T>(fn: (() => Promise<T>) | undefined, key: string): Async<T> {
  const [state, setState] = useState<{ status: Async<T>['status']; data?: T; error?: string }>({ status: 'loading' })
  const generation = useRef(0)
  const fnRef = useRef(fn)
  fnRef.current = fn

  const load = useCallback(async () => {
    const run = fnRef.current
    if (!run) return
    const my = ++generation.current
    // key 只用来决定「何时重建这个回调」，取数本身永远拿 ref 里的最新函数
    void key
    setState((prev) => ({ status: prev.data ? 'ready' : 'loading', data: prev.data }))
    try {
      const data = await run()
      if (my === generation.current) setState({ status: 'ready', data })
    } catch (err) {
      if (my === generation.current) setState({ status: 'error', error: describeError(err) })
    }
  }, [key])

  useEffect(() => {
    void load()
  }, [load])

  return { ...state, reload: () => void load() }
}
