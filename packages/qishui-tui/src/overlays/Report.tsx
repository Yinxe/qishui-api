/**
 * 举报弹层：原因单选。
 *
 * 上游 `Report` 的 `report_type` 是字符串（`'track'`）、原因取 `GetReportReason` 的 `code`，
 * 给错形状直接 HTTP 500 —— 所以理由列表一律从接口取，不写死枚举。
 * 这是写接口，只在用户真的选了原因时才发。
 */
import { Box, type DOMElement, Text } from 'ink'
import type { ReportReason } from 'qishui-core'
import { useRef } from 'react'
import { useCore } from '../core/context.js'
import { useUi } from '../ui/context.js'
import { truncate } from '../ui/format.js'
import { listHeight } from '../ui/layout.js'
import { useRowClick, useWheelScroll } from '../ui/mouse.js'
import { useAsync } from '../ui/useAsync.js'
import { EmptyState, ErrorState, Loading, Modal, Row, useCursor, windowFor } from '../ui/widgets.js'

export function ReportOverlay({ trackId, title }: { trackId: string; title: string }) {
  const { core } = useCore()
  const ui = useUi()
  const reasons = useAsync<ReportReason[]>(
    core ? () => core.feedback.reportReasons('track') : undefined,
    `report-reasons:${core?.session.activeUid ?? 'anon'}`,
  )

  const items = reasons.data ?? []
  function submit(index: number): void {
    const reason = items[index]
    if (!reason || !core) return
    ui.closeOverlay()
    void (async () => {
      try {
        await core.feedback.report({ contentId: trackId, type: 'track', reasonCode: reason.code })
        ui.toast(`已举报：${reason.reason}`, 'success')
      } catch (err) {
        ui.toast(err instanceof Error ? err.message : String(err), 'error')
      }
    })()
  }

  const { cursor, setCursor } = useCursor(items.length, {
    active: true,
    onEnter: (index) => submit(index),
    onKey: (input) => {
      if (input === 'R') {
        reasons.reload()
        return true
      }
      return false
    },
  })

  const height = listHeight(ui.rows, 11, 3)
  const { start, end } = windowFor(items.length, height, cursor)

  // 鼠标：滚轮挪游标；点一行 = 直接按该原因提交举报，顺带把游标落到该行
  const listRef = useRef<DOMElement>(null)
  useWheelScroll(
    listRef,
    (delta) => setCursor(Math.max(0, Math.min(items.length - 1, cursor + delta))),
    items.length > 0,
  )
  useRowClick(
    listRef,
    (row) => {
      const index = start + row
      if (index >= items.length) return
      setCursor(index)
      submit(index)
    },
    items.length > 0,
  )

  return (
    <Modal title={`举报 · ${truncate(title, 40)}`} footer="Enter 提交   R 刷新原因   Esc 取消" width={64}>
      {reasons.status === 'loading' ? <Loading label="读取举报原因" /> : null}
      {reasons.status === 'error' ? <ErrorState error={reasons.error ?? '读取失败'} hint="R 重试" /> : null}
      {reasons.status === 'ready' && items.length === 0 ? <EmptyState message="没有可选的举报原因" /> : null}
      <Box ref={listRef} flexDirection="column">
        {items.slice(start, end).map((reason, offset) => {
          const index = start + offset
          return <Row key={reason.code} selected={index === cursor} label={truncate(reason.reason, 56)} />
        })}
      </Box>
      {items.length > height ? (
        <Text dimColor>
          {Math.min(start + height, items.length)}/{items.length}
        </Text>
      ) : null}
    </Modal>
  )
}
