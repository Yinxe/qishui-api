/** 评论（覆盖层）：列表 + 分页 + 发评论 */
import { Box, type DOMElement, Text, useInput } from 'ink'
import type { Comment } from 'qishui-core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useCore } from '../core/context.js'
import { useUi } from '../ui/context.js'
import { truncate } from '../ui/format.js'
import { contentWidth } from '../ui/layout.js'
import { Pressable, stripMouse, useRowClick, useWheelScroll } from '../ui/mouse.js'
import { stripReports } from '../ui/reports.js'
import { COLOR, SELECT_PREFIX } from '../ui/theme.js'
import { EmptyState, ErrorState, Loading, Modal, useCursor } from '../ui/widgets.js'

function timeAgo(seconds?: number): string {
  if (!seconds) return ''
  const diff = Date.now() / 1000 - seconds
  if (diff < 3600) return `${Math.max(1, Math.round(diff / 60))} 分钟前`
  if (diff < 86400) return `${Math.round(diff / 3600)} 小时前`
  return `${Math.round(diff / 86400)} 天前`
}

export function CommentsOverlay({ trackId, title }: { trackId: string; title: string }) {
  const { core } = useCore()
  const ui = useUi()
  const [comments, setComments] = useState<Comment[] | undefined>()
  const [error, setError] = useState<string>()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  /** 上游 `cursor` 是偏移量（实测 0 → '10' 两页零重复），翻页照它回传 */
  const [next, setNext] = useState<{ cursor?: string; hasMore: boolean }>({ hasMore: false })
  const [loadingMore, setLoadingMore] = useState(false)

  const load = (): void => {
    if (!core) return
    core.comments
      .list(trackId, { count: 20 })
      .then((page) => {
        setComments(page.items)
        setNext({ cursor: page.cursor, hasMore: page.hasMore })
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : String(err))
        setComments([])
      })
  }

  /** 接着拉下一页：光标走到已加载的最后一条时自动触发（键盘/滚轮/点击都走这里） */
  const loadMore = useCallback((): void => {
    if (!core || loadingMore || !next.hasMore || !next.cursor) return
    setLoadingMore(true)
    core.comments
      .list(trackId, { count: 20, cursor: Number(next.cursor) })
      .then((page) => {
        setComments((current) => [...(current ?? []), ...page.items])
        setNext({ cursor: page.cursor, hasMore: page.hasMore })
      })
      .catch((err: unknown) => ui.toast(err instanceof Error ? err.message : String(err), 'error'))
      .finally(() => setLoadingMore(false))
  }, [core, trackId, loadingMore, next.hasMore, next.cursor, ui])

  // biome-ignore lint/correctness/useExhaustiveDependencies: load 每次渲染重建，只按 core/trackId 重取
  useEffect(() => {
    load()
  }, [core, trackId])

  useEffect(() => {
    ui.setTextFocus(editing)
    return () => ui.setTextFocus(false)
  }, [editing, ui])

  useInput(
    (input, key) => {
      if (!editing) return
      if (key.escape) {
        setEditing(false)
        return
      }
      if (key.return) {
        if (!draft.trim() || !core) return
        setBusy(true)
        core.comments
          .post(trackId, draft.trim())
          .then(() => {
            ui.toast('已发表评论', 'success')
            setDraft('')
            setEditing(false)
            load()
          })
          .catch((err: unknown) => ui.toast(err instanceof Error ? err.message : String(err), 'error'))
          .finally(() => setBusy(false))
        return
      }
      if (key.backspace || key.delete) {
        setDraft((current) => [...current].slice(0, -1).join(''))
        return
      }
      const printable = [...stripReports(stripMouse(input))].filter((ch) => ch >= ' ').join('')
      if (printable && !key.ctrl && !key.meta) {
        setDraft((current) => current + printable)
      }
    },
    { isActive: editing },
  )

  /** 看这条评论的作者：用户主页在压栈路由里，弹层先关掉再进去 */
  function openAuthor(index: number): void {
    const author = comments?.[index]?.user
    if (!author) {
      ui.toast('这条评论没带作者信息', 'info')
      return
    }
    ui.closeOverlay()
    ui.push({ kind: 'user', id: author.id, nickname: author.nickname || undefined })
  }

  const { cursor, setCursor } = useCursor(comments?.length ?? 0, {
    active: !editing,
    onEnter: (index) => openAuthor(index),
    onKey: (input) => {
      if (input === 'p') {
        startWriting()
        return true
      }
      if (input === 'r') {
        load()
        return true
      }
      return false
    },
  })

  // 光标停在最后一条（且上游说还有）就把下一页接上：不用额外按键，和列表页的 loadMore 一个体感
  useEffect(() => {
    if (comments && comments.length > 0 && cursor >= comments.length - 1 && next.hasMore && !loadingMore) loadMore()
  }, [cursor, comments, next.hasMore, loadingMore, loadMore])

  const windowSize = 12
  const start = Math.max(0, Math.min(cursor - 5, Math.max(0, (comments?.length ?? 0) - windowSize)))
  const visible = (comments ?? []).slice(start, start + windowSize)

  // 鼠标：滚轮挪游标；点一条评论 = 选中它（每条固定 3 行：昵称 + 正文 + 一行间距）
  const listRef = useRef<DOMElement>(null)
  const total = comments?.length ?? 0
  useWheelScroll(listRef, (delta) => setCursor(Math.max(0, Math.min(total - 1, cursor + delta))), total > 0)
  useRowClick(
    listRef,
    (row) => {
      const index = start + Math.floor(row / 3)
      if (index >= total) return
      setCursor(index)
    },
    total > 0,
  )

  /** `p` 与点「写评论」走同一条路：先验登录，再进编辑态 */
  function startWriting(): void {
    if (!core?.loggedIn) {
      ui.toast('发评论需要登录（按 0 进「我的」扫码）', 'error')
      return
    }
    setEditing(true)
  }

  return (
    <Modal
      title={`评论 · ${truncate(title, 40)}`}
      footer={editing ? 'Enter 发送   Esc 取消' : '↑↓ 移动   Enter 看作者主页   p 发评论   r 刷新   Esc 关闭'}
      width={contentWidth(ui.columns, ui.sidebarWidth, 6)}
    >
      {comments === undefined ? <Loading label="读取评论" /> : null}
      {error ? <ErrorState error={error} /> : null}
      {comments && comments.length === 0 && !error ? <EmptyState message="还没有评论" hint="p 来说两句" /> : null}
      <Box ref={listRef} flexDirection="column">
        {visible.map((comment, offset) => {
          const index = start + offset
          const selected = index === cursor
          return (
            <Box key={comment.id} flexDirection="column" marginBottom={1}>
              <Text color={selected ? COLOR.accent : undefined} wrap="truncate-end">
                {`${selected ? SELECT_PREFIX : ' '}${truncate(comment.user?.nickname ?? '匿名', 16)}  ${timeAgo(comment.data.createdAt)}  赞 ${
                  comment.data.countDigged ?? 0
                }`}
              </Text>
              <Text dimColor={!selected} wrap="truncate-end">
                {`  ${truncate(comment.content.replace(/\s+/g, ' '), Math.max(20, ui.columns - ui.sidebarWidth - 12))}`}
              </Text>
            </Box>
          )
        })}
      </Box>
      {!editing && comments?.length ? (
        <Box flexDirection="column">
          <Pressable onPress={startWriting}>
            <Text dimColor>[+ 写评论]</Text>
          </Pressable>
          {loadingMore ? <Text dimColor> 接着拉评论…</Text> : null}
          {!loadingMore && !next.hasMore ? <Text dimColor> 到底了</Text> : null}
        </Box>
      ) : null}
      {editing ? (
        <Box marginTop={1}>
          <Text color={COLOR.accent}>写评论：</Text>
          <Text inverse>{draft || ' '}</Text>
          {busy ? <Text dimColor> 发送中…</Text> : null}
        </Box>
      ) : null}
    </Modal>
  )
}
