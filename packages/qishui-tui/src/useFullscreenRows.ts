import { type DOMElement, useStdout } from 'ink'
import { useLayoutEffect } from 'react'

/**
 * 全屏高度归我们管：把当前行数交回给 JSX 画首帧，之后的每次 resize 直接写进 yoga。
 *
 * ink 收到 SIGWINCH 只做 `calculateLayout()` + 重绘，**不重渲染 React 树**。所以行数只写在
 * JSX 里（`height={rows}`）会停在旧值，得 setState 触发第二次重绘——一次 resize 两帧，实测
 * 相差 4～13ms，第一帧还是按旧行数排的版，肉眼就是「闪一下 + 跳一下」。
 *
 * `prependListener` 让我们抢在 ink 的 resize 处理之前把新行数塞进 yoga 节点，ink 那一次重绘
 * 本身就是对的，一次 resize 只剩一帧。JSX 里的 `height` 照旧保留：它管首帧（那时还没有
 * resize 事件），值也始终是当时的真行数，React 之后因别的原因重渲染时重放它也不会写错。
 *
 * 宽度不用管：`width="100%"` 由 ink 自己按新终端宽度重算布局。
 */
export function useFullscreenRows(rootRef: { current: DOMElement | null }): number | undefined {
  const { stdout } = useStdout()
  const rows = stdout.rows

  useLayoutEffect(() => {
    const apply = () => {
      const next = stdout.rows
      // 管道/CI 里没有行数，让帧按内容高度收缩
      if (typeof next !== 'number' || next < 1) {
        return
      }
      // yoga 节点是挂载时建的，resize 事件必然晚于挂载
      rootRef.current?.yogaNode?.setHeight(next)
    }
    stdout.prependListener('resize', apply)
    return () => {
      stdout.off('resize', apply)
    }
  }, [rootRef, stdout])

  return typeof rows === 'number' && rows >= 1 ? rows : undefined
}
