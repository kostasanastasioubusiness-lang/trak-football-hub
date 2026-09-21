import { describe, expect, it } from 'vitest'
import { ellipsizeOverflowingText } from '@/lib/card-export'

// html2canvas 1.4.1 does not implement text-overflow: ellipsis. The screen
// shows "Abdulrahman Al-Maktoum Fer…"; the shared PNG showed "…Maktoum Fer"
// cut mid-letter. For a UAE academy long names are ordinary, not an edge case.
// The capture clone is laid out, so it can measure and truncate the text
// itself. jsdom has no layout, so each element gets a width model here:
// 10px per character, in a box `box` px wide.

function el(text: string, box: number, style = 'overflow:hidden;white-space:nowrap;text-overflow:ellipsis') {
  const node = document.createElement('div')
  node.setAttribute('style', style)
  node.textContent = text
  Object.defineProperty(node, 'clientWidth', { configurable: true, get: () => box })
  Object.defineProperty(node, 'scrollWidth', { configurable: true, get: () => (node.textContent ?? '').length * 10 })
  document.body.append(node)
  return node
}

describe('ellipsizeOverflowingText', () => {
  it('cuts overflowing text to the widest prefix that fits, ending in an ellipsis', () => {
    const name = el('Abdulrahman Al-Maktoum Fernandes', 200) // 20 chars fit
    ellipsizeOverflowingText(document.body, window)
    expect(name.textContent).toBe('Abdulrahman Al-Makt…')
    expect(name.scrollWidth).toBeLessThanOrEqual(name.clientWidth)
    name.remove()
  })

  it('leaves text that already fits alone', () => {
    const name = el('Omar Ali', 200)
    ellipsizeOverflowingText(document.body, window)
    expect(name.textContent).toBe('Omar Ali')
    name.remove()
  })

  // Only where the screen itself shows an ellipsis: an overflow:hidden box
  // without text-overflow is clipped on screen too, and must match it.
  it('does not touch overflowing text that is not styled for an ellipsis', () => {
    const clipped = el('Abdulrahman Al-Maktoum Fernandes', 200, 'overflow:hidden;white-space:nowrap')
    ellipsizeOverflowingText(document.body, window)
    expect(clipped.textContent).toBe('Abdulrahman Al-Maktoum Fernandes')
    clipped.remove()
  })

  it('does not rewrite elements that contain markup', () => {
    const mixed = el('', 50)
    mixed.innerHTML = '<span>Synthetic Academy</span> · U15'
    ellipsizeOverflowingText(document.body, window)
    expect(mixed.innerHTML).toBe('<span>Synthetic Academy</span> · U15')
    mixed.remove()
  })

  it('trims trailing spaces before the ellipsis', () => {
    const name = el('Mohammed Al Mansoori Junior', 100) // "Mohammed A" fits 10
    ellipsizeOverflowingText(document.body, window)
    expect(name.textContent).toBe('Mohammed…')
    name.remove()
  })
})
