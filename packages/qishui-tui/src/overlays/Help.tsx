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
      ['1–6', '侧边栏第 1–6 项（搜索/发现/听歌/我的/本地/设置）'],
      ['0 / S', '「我的」页（登录、切号） / 设置与缓存'],
      ['/ / Tab', '到搜索 / 焦点在侧边栏↔内容 之间切换'],
      ['Esc', '关弹层 / 返回上一层；一级页再按 → 焦点回侧边栏'],
      ['f / ? / q', '播放页 / 帮助 / 退出（Ctrl+C 随时退出）'],
      ['Q', '播放队列书架：推荐 / 我喜欢 / 每张歌单 / 临时，Enter 切过去'],
      ['听歌页', 'Enter = 设为该模式并立刻起播（只能有一个当前模式）'],
      ['启动', '开程序就落在「听歌」并按记住的模式自动起播一批（QISHUI_TUI_AUTOPLAY=0 关）'],
    ],
  },
  {
    title: '播放',
    items: [
      ['Space', '播放 / 暂停'],
      ['n / p', '下一首 / 上一首'],
      ['s / r', '随机 / 循环模式'],
      ['< / >', '后退 / 前进 10 秒（播放页里也是这两个键，方向键留给列表）'],
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
    title: '播放页（f）',
    items: [
      ['f', '任意页压栈打开；再按 f（或 Esc）退回原页'],
      ['左右两栏', '左边曲目信息 + 歌词，右边播放队列，两边同时可见'],
      ['窄终端', '单栏 + 顶部 [歌词] [队列] tab（方括号 = 当前栏），队列不会被藏掉'],
      ['t', '焦点在「歌词」↔「队列」之间切换（窄终端等于换 tab）'],
      ['歌词窗口', '固定 7 行、当前句居中，整块在剩余高度里垂直居中（不铺满）'],
      ['↑↓ / jk', '焦点在歌词时翻词；在队列时挪游标（g 回到跟随播放头）'],
      ['Enter', '焦点在哪边就开哪边的操作菜单（详情 / 喜欢 / 评论 / 加入歌单 / 相似歌曲…）'],
      ['队列行', '菜单比当前曲目多两项：立即播放这首 / 从队列移除'],
      ['鼠标', '点歌词跳那句、点队列行播它；点 [操作] 开当前曲目的菜单'],
      ['播放键', 'Space n p s r < > + - 在播放页照旧生效（不占页内键）'],
    ],
  },
  {
    title: '播放队列（Q）',
    items: [
      ['一份一份的', '队列按来源分，各自记着播到第几首：推荐 / 我喜欢 / 每张歌单 / 临时'],
      ['Q 或右栏 [队列]', '列出所有还活着的队列，Enter 切过去（切走再切回来接着上次那一首）'],
      ['推荐队列', '听歌模式（场景/推荐/熟悉/新鲜）：顺序播不随机，每前进一首把「上上个」踢掉'],
      ['续批', '后面剩 2 首就补一批（一批 6 首，窗口钳在 2~8 首），连着听不断流'],
      ['歌单队列', '每张歌单一份（本地歌单也算）：整张顺序播，不随机'],
      ['我喜欢队列', '「我喜欢的音乐」/ 本地喜欢：随机'],
      ['临时队列', '搜索 / 榜单 / 专辑 / 艺人 / 首页推荐块：每次点播整队替换上一批，不留旧账'],
      ['队列行菜单', '播放页右栏 Enter：和列表页同一份条目（详情/喜欢/评论…）另加立即播放 / 从队列移除'],
    ],
  },
  {
    title: '本地（不出网）',
    items: [
      ['1–6 里的「本地」', '本地喜欢 / 本地历史 / 本地歌单 / 音乐文件夹 一页收齐'],
      ['N / A', '新建本地歌单 / 添加音乐文件夹（`~/Music` 写法也认）'],
      ['本地喜欢', '曲目菜单里「本地喜欢（切换）」；匿名也能用，只在本机'],
      ['本地歌单', '每行 Enter：打开 / 播放整张 / 改名 / 删歌单（磁盘文件不动）'],
      ['文件夹', '每行 Enter：打开（扫这个目录）/ 播放这个文件夹 / 重新扫描 / 移出列表'],
      ['本地历史', '这台机器放过什么（journal）；云端「最近播放」是另一张表'],
      ['本地曲目', '磁盘文件：菜单只给本地动作，没有评论/详情/举报这些上游项'],
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
            <Text key={line.key} underline={selected} wrap="truncate-end">
              <Text color={COLOR.warning}>{line.text.slice(0, 9)}</Text>
              <Text dimColor>{line.text.slice(9)}</Text>
            </Text>
          )
        })}
      </Box>
    </Modal>
  )
}
