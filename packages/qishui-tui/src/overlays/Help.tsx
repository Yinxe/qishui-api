/** 帮助（覆盖层）：全量键位；内容高于终端时按 ↑↓/滚轮滚动（居中弹层会从上方裁掉，不能靠裁） */
import { Box, type DOMElement, Text } from 'ink'
import { useRef } from 'react'
import { useUi } from '../ui/context.js'
import { contentWidth, listHeight } from '../ui/layout.js'
import { useRowClick, useWheelScroll } from '../ui/mouse.js'
import { COLOR } from '../ui/theme.js'
import { Modal, useCursor, windowFor } from '../ui/widgets.js'

const GROUPS: { title: string; items: [string, string][] }[] = [
  {
    title: '导航',
    items: [
      ['1–5', '侧边栏第 1–5 项（搜索/发现/听歌/我的/设置）'],
      ['0 / S', '「我的」页（登录、切号） / 设置与缓存'],
      ['/ / Tab', '到搜索 / 焦点在侧边栏↔内容 之间切换'],
      ['Esc', '关弹层 / 返回上一层；一级页再按 → 焦点回侧边栏'],
      ['f / ? / q', '正在播放 / 帮助 / 退出（Ctrl+C 随时退出）'],
      ['听歌页', 'Enter = 设为该模式并立刻起播（只能有一个当前模式）'],
    ],
  },
  {
    title: '播放',
    items: [
      ['Space', '播放 / 暂停'],
      ['n / p', '下一首 / 上一首'],
      ['s / r', '随机 / 循环模式'],
      ['←/→', '后退 / 前进 10s（正在播放页同样是切歌词/队列）'],
      ['+ / -', '音量'],
    ],
  },
  {
    title: '列表',
    items: [
      ['↑↓/jk', '移动；g/G 到顶/底'],
      ['Enter', '打开这一行的操作菜单；菜单里 Enter / 点击 = 执行'],
      ['菜单项', '播放 / 下一首 / 队尾 / 我的喜欢'],
      ['菜单项', '评论 / 详情 / 加入歌单 / 相似歌曲'],
      ['还有', '不感兴趣 / 举报 / 移出歌单 / 改名 / 删歌单'],
      ['L / R', '加载更多 / 重新加载'],
      ['N', '新建歌单（在「我的」页）'],
      ['[ / ]', '歌单广场切分类'],
    ],
  },
  {
    title: '歌单',
    items: [
      ['行菜单', '歌单页每行另有：移出本歌单 / 改名 / 删歌单'],
      ['删歌单', '执行前都要过一次确认框'],
      ['歌单行', '打开 / 播放整张 / 收藏；自己的另给改名与删除'],
      ['专辑行', '打开 / 播放整张 / 收藏这张专辑'],
      ['我的页', '账号行 Enter：扫码登录 / 换号 / 退出'],
      ['我的歌单', '每行 Enter：打开 / 播放整张 / 收藏 / 改名 / 删除'],
    ],
  },
  {
    title: '鼠标（终端支持时）',
    items: [
      ['滚轮', '挪列表游标 / 翻歌词与队列'],
      ['左键', '点列表行 = 直接开这一行的操作菜单；点弹层条目 = 执行'],
      ['侧边栏', '点哪项去哪项'],
      ['进度条', '点一下定位，滚轮 ±5 秒；音量键滚轮 ±5%'],
      ['歌词 / 队列', '点一句跳到那句，点一行播那首'],
      ['面包屑 / tab', '点顶栏面包屑回跳、点分类 tab、点搜索输入行'],
      ['QISHUI_TUI_MOUSE=0', '启动时关掉鼠标（想用终端原生拖选复制时）'],
    ],
  },
]

interface Line {
  key: string
  text: string
  head: boolean
}

function flatten(): Line[] {
  const lines: Line[] = []
  GROUPS.forEach((group, groupIndex) => {
    lines.push({ key: `h:${group.title}`, text: group.title, head: true })
    for (const [index, [key, label]] of group.items.entries())
      lines.push({ key: `i:${groupIndex}:${index}:${key}`, text: `${key} ${label}`, head: false })
  })
  return lines
}

export function HelpOverlay() {
  const ui = useUi()
  const lines = flatten()
  // 去掉边框/标题/footer，剩下的才是能画的正文行
  const height = listHeight(ui.rows, 7, 4)
  const { cursor, setCursor } = useCursor(lines.length, { active: true })
  const { start, end } = windowFor(lines.length, height, cursor)
  const visible = lines.slice(start, end)

  // 滚轮/点击：指针在正文里时挪游标（窗口跟着游标走）
  const boxRef = useRef<DOMElement>(null)
  useWheelScroll(boxRef, (delta) => setCursor(Math.max(0, Math.min(lines.length - 1, cursor + delta))))
  useRowClick(boxRef, (row) => {
    const index = start + row
    if (index < lines.length) setCursor(index)
  })

  return (
    <Modal
      title="帮助"
      footer={`↑↓ / 滚轮 滚动   Esc / ? 关闭   ${Math.min(start + height, lines.length)}/${lines.length}`}
      width={contentWidth(ui.columns, ui.sidebarWidth, 8, 50)}
    >
      <Box ref={boxRef} flexDirection="column">
        {visible.map((line, offset) => {
          const index = start + offset
          const selected = index === cursor && cursor < lines.length
          return line.head ? (
            <Text key={line.key} bold color={COLOR.accent} wrap="truncate-end">
              {line.text}
            </Text>
          ) : (
            <Text key={line.key} inverse={selected} wrap="truncate-end">
              <Text color={COLOR.warning}>{line.text.slice(0, 9)}</Text>
              <Text dimColor>{line.text.slice(9)}</Text>
            </Text>
          )
        })}
      </Box>
    </Modal>
  )
}
