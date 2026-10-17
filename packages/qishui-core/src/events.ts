/* eslint-disable @typescript-eslint/no-explicit-any */
export type EventMap = Record<string, any>

type Handler<T> = (payload: T) => void

/**
 * 极简类型化事件器。返回的 `off()` 即取消订阅，所以 `const off = x.on(...)` 就够了。
 * 不引 EventEmitter 是为了让 `on('track', e => …)` 的 payload 有类型。
 */
export class Emitter<M extends EventMap> {
  private handlers = new Map<keyof M, Set<Handler<any>>>()

  on<K extends keyof M>(event: K, handler: Handler<M[K]>): () => void {
    let set = this.handlers.get(event)
    if (!set) {
      set = new Set()
      this.handlers.set(event, set)
    }
    set.add(handler)
    return () => this.off(event, handler)
  }

  once<K extends keyof M>(event: K, handler: Handler<M[K]>): () => void {
    const off = this.on(event, (payload) => {
      off()
      handler(payload)
    })
    return off
  }

  off<K extends keyof M>(event: K, handler: Handler<M[K]>): void {
    this.handlers.get(event)?.delete(handler)
  }

  emit<K extends keyof M>(event: K, payload: M[K]): void {
    for (const handler of [...(this.handlers.get(event) ?? [])]) {
      try {
        handler(payload)
      } catch {
        // 订阅者的异常不打断 core 的主流程（事件是旁路）
      }
    }
  }

  listenerCount<K extends keyof M>(event: K): number {
    return this.handlers.get(event)?.size ?? 0
  }

  removeAll(): void {
    this.handlers.clear()
  }
}
