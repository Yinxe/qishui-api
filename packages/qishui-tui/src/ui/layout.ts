/**
 * 布局度量 helper：把满地跑的 `Math.max(N, ui.rows - M)` / `ui.columns - ui.sidebarWidth - K`
 * 收成两处口径。**overhead/reserve 仍由各屏按自己的固定占位传入**（页头/播放条/提示行各屏不同），
 * 这里只统一「公式形状 + 下限」，不改任何屏的实际可视高度/宽度（免得 PTY 帧断言跟着漂）。
 */

/** 可视列表高度 = 总行数 − 本页固定占位（页头/播放条/提示行等），不低于 min */
export function listHeight(rows: number, overhead: number, min = 4): number {
  return Math.max(min, rows - overhead)
}

/** 内容区宽度 = 终端列宽 − 侧栏 − 本页左右预留，不低于 min */
export function contentWidth(columns: number, sidebarWidth: number, reserve: number, min = 20): number {
  return Math.max(min, columns - sidebarWidth - reserve)
}
