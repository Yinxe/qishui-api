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

  // core 是异步建起来的（`createQishui()` 才出得来），各屏传的是 `core ? fn : undefined`。
  // 就绪位不进依赖的话：冷启动时按数字键进到这一页，`key` 之后再也不变，就一直转圈。
  const ready = fn !== undefined
  const load = useCallback(async () => {
    const run = fnRef.current
    if (!run) {
      // 作废在途请求，否则「清空搜索框」之后上一个词的结果还会落回来
      generation.current++
      setState({ status: 'loading' })
      return
    }
    const my = ++generation.current
    setState((prev) => ({ status: prev.data ? 'ready' : 'loading', data: prev.data }))
    try {
      const data = await run()
      if (my === generation.current) setState({ status: 'ready', data })
    } catch (err) {
      if (my === generation.current) setState({ status: 'error', error: describeError(err) })
    }
  }, [])

  // 「什么时候重取」挂在 effect 上（`load` 自身稳定）：`key` 变了，或 `fn` 从无到有（就绪位翻转）。
  // 这两个值是触发器、effect 体不读它们，所以按仓库惯例显式豁免（Listen/Queues 那几处同口径）。
  // biome-ignore lint/correctness/useExhaustiveDependencies: key/ready 只是「何时再取一次」的触发器
  useEffect(() => {
    void load()
  }, [load, key, ready])

  return { ...state, reload: () => void load() }
}
