/** 通用弹层：确认框 + 加入歌单 + 单行输入 + 新建歌单 + 举报 */
import { Box, type DOMElement, Text, useInput } from 'ink'
import type { Playlist } from 'qishui-core'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useCore } from '../core/context.js'
import { useUi } from '../ui/context.js'
import { truncate } from '../ui/format.js'
import { useKeys } from '../ui/keys.js'
import { listHeight } from '../ui/layout.js'
import { isMouseInput, Pressable, stripMouse, useRowClick, useWheelScroll } from '../ui/mouse.js'
import { COLOR } from '../ui/theme.js'
import { EmptyState, ErrorState, Loading, Modal, Row, useCursor, windowFor } from '../ui/widgets.js'

export function ConfirmOverlay({
  message,
  hint,
  onConfirm,
}: {
  message: string
  hint?: string
  onConfirm: () => void
}) {
  const ui = useUi()
  const confirm = (): void => {
    onConfirm()
    ui.closeOverlay()
  }
  useKeys(
    (input, key) => {
      if (isMouseInput(input)) return
      if (input === 'y' || key.return) {
        confirm()
      } else if (input === 'n') {
        ui.closeOverlay()
      }
    },
    { isActive: true },
  )
  return (
    <Modal title="确认" footer="y / Enter 确认   n / Esc 取消" width={60}>
      <Text wrap="truncate-end">{message}</Text>
      {hint ? <Text dimColor>{hint}</Text> : null}
      {/* 只给两个按钮，不做「整块可点」：误触会直接删歌单/移出收藏 */}
      <Box marginTop={1} gap={1}>
        <Pressable onPress={confirm}>
          <Text color={COLOR.success}>[确认]</Text>
        </Pressable>
        <Pressable onPress={() => ui.closeOverlay()}>
          <Text dimColor>[取消]</Text>
        </Pressable>
      </Box>
    </Modal>
  )
}

export function AddToPlaylistOverlay({ trackIds }: { trackIds: string[] }) {
  const { core } = useCore()
  const ui = useUi()
  const [playlists, setPlaylists] = useState<Playlist[] | undefined>()
  const [error, setError] = useState<string>()

  const load = useCallback(() => {
    if (!core?.loggedIn) {
      setError('加入歌单需要登录')
      setPlaylists([])
      return
    }
    let alive = true
    core.library
      .playlists()
      .then((list) => {
        if (alive) setPlaylists(list.filter((p) => !p.isLikedList))
      })
      .catch((err: unknown) => {
        if (!alive) return
        setError(err instanceof Error ? err.message : String(err))
        setPlaylists([])
      })
    return () => {
      alive = false
    }
  }, [core])

  useEffect(() => load(), [load])

  function choose(index: number): void {
    const playlist = playlists?.[index]
    if (!playlist || !core) return
    void (async () => {
      try {
        await core.library.addToPlaylist(playlist.id, trackIds)
        ui.toast(`已加入《${playlist.title}》${trackIds.length} 首`, 'success')
        ui.closeOverlay()
      } catch (err) {
        ui.toast(err instanceof Error ? err.message : String(err), 'error')
      }
    })()
  }

  const { cursor, setCursor } = useCursor(playlists?.length ?? 0, {
    active: true,
    onEnter: (index) => choose(index),
    onKey: (input) => {
      if (input === 'N') {
        ui.openOverlay({ kind: 'new-playlist', trackIds })
        return true
      }
      if (input === 'R') {
        setPlaylists(undefined)
        setError(undefined)
        load()
        return true
      }
      return false
    },
  })

  const height = listHeight(ui.rows, 11, 3)
  const { start, end } = windowFor(playlists?.length ?? 0, height, cursor)

  // 鼠标：滚轮挪游标；点一行 = 直接加入该歌单（和 Enter 同一条路），顺带把游标落到该行
  const listRef = useRef<DOMElement>(null)
  const count = playlists?.length ?? 0
  useWheelScroll(listRef, (delta) => setCursor(Math.max(0, Math.min(count - 1, cursor + delta))), count > 0)
  useRowClick(
    listRef,
    (row) => {
      const index = start + row
      if (index >= count) return
      setCursor(index)
      choose(index)
    },
    count > 0,
  )

  return (
    <Modal title={`加入歌单（${trackIds.length} 首）`} footer="Enter 选择   N 新建歌单   R 刷新   Esc 取消" width={64}>
      {playlists === undefined ? <Loading label="读取我的歌单" /> : null}
      {error ? <ErrorState error={error} /> : null}
      {playlists?.length === 0 && !error ? <EmptyState message="没有可加入的歌单" hint="按 N 新建一张" /> : null}
      <Box ref={listRef} flexDirection="column">
        {(playlists ?? []).slice(start, end).map((playlist, offset) => {
          const index = start + offset
          return (
            <Row
              key={playlist.id}
              selected={index === cursor}
              label={truncate(playlist.title, 50)}
              note={playlist.countTracks !== undefined ? `${playlist.countTracks} 首` : undefined}
            />
          )
        })}
      </Box>
      {(playlists?.length ?? 0) > height ? (
        <Text dimColor>
          {Math.min(start + height, playlists?.length ?? 0)}/{playlists?.length}
        </Text>
      ) : null}
    </Modal>
  )
}

/** 单行文本输入：歌单改名等 */
export function InputOverlay({
  title,
  label,
  initial,
  hint,
  onSubmit,
}: {
  title: string
  label: string
  initial?: string
  hint?: string
  onSubmit: (text: string) => void
}) {
  const ui = useUi()
  const [value, setValue] = useState(initial ?? '')

  useInput(
    (input, key) => {
      if (key.return) {
        const text = value.trim()
        if (!text) return
        onSubmit(text)
        ui.closeOverlay()
        return
      }
      if (key.backspace || key.delete) {
        setValue((current) => [...current].slice(0, -1).join(''))
        return
      }
      // 一次 read 可能带回多个字符（粘贴/快速输入），逐个收下；控制字符丢掉
      const printable = [...stripMouse(input)].filter((ch) => ch >= ' ' && ch !== '\u007f').join('')
      if (printable && !key.ctrl && !key.meta) setValue((current) => current + printable)
    },
    { isActive: true },
  )

  return (
    <Modal title={title} footer="Enter 确定   Esc 取消" width={60}>
      <Text dimColor>{label}</Text>
      <Box marginY={1}>
        <Text inverse color={COLOR.accent}>
          {value || ' '}
        </Text>
      </Box>
      {hint ? <Text dimColor>{hint}</Text> : null}
    </Modal>
  )
}

/** 新建歌单：名字 + 是否私密（Tab 切换）；带 trackIds 时顺手把歌加进去 */
export function NewPlaylistOverlay({ trackIds }: { trackIds?: string[] }) {
  const { core } = useCore()
  const ui = useUi()
  const [name, setName] = useState('')
  const [isPrivate, setPrivate] = useState(false)

  const submit = (): void => {
    const title = name.trim()
    if (!title || !core) return
    ui.closeOverlay()
    void (async () => {
      try {
        const playlist = await core.library.createPlaylist(title, { isPrivate })
        if (trackIds?.length) await core.library.addToPlaylist(playlist.id, trackIds)
        ui.toast(`已新建《${playlist.title}》${trackIds?.length ? ` 并加入 ${trackIds.length} 首` : ''}`, 'success')
        ui.bump()
      } catch (err) {
        ui.toast(err instanceof Error ? err.message : String(err), 'error')
      }
    })()
  }

  useInput(
    (input, key) => {
      if (key.return) {
        submit()
        return
      }
      if (key.tab) {
        setPrivate((v) => !v)
        return
      }
      if (key.backspace || key.delete) {
        setName((current) => [...current].slice(0, -1).join(''))
        return
      }
      const printable = [...stripMouse(input)].filter((ch) => ch >= ' ' && ch !== '\u007f').join('')
      if (printable && !key.ctrl && !key.meta) setName((current) => current + printable)
    },
    { isActive: true },
  )

  return (
    <Modal title="新建歌单" footer="Enter 创建   Tab / 点击 切换私密   Esc 取消" width={60}>
      <Text dimColor>歌单名</Text>
      <Box marginY={1}>
        <Text inverse color={COLOR.accent}>
          {name || ' '}
        </Text>
      </Box>
      <Pressable onPress={() => setPrivate((v) => !v)}>
        <Text>{`${isPrivate ? '[x]' : '[ ]'} 私密歌单（只有自己可见）`}</Text>
      </Pressable>
      {trackIds?.length ? <Text dimColor>创建后自动加入 {trackIds.length} 首</Text> : null}
      {!core ? <ErrorState error="core 尚未就绪" /> : null}
    </Modal>
  )
}
