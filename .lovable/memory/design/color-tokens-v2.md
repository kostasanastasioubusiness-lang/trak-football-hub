---
name: Design System v2
description: Navy/blue color scheme matching prototype v3
type: design
---
## Colors (HSL values for CSS vars)
- Background: #080d1a → 222 47% 6%
- Card: #0d1425 → 222 40% 10%
- Primary: #2563EB → 224 85% 53%
- Primary dark: #0d3d8a → 224 85% 35%
- Coach orange: #E8803A → 24 78% 57%
- Training blue: #4A90D9 → 214 60% 57%
- Gold: #E8B84B → 40 78% 60%
- Red: #E05555 → 0 65% 55%
- Foreground: #f0f4ff → 220 30% 94%
- Muted foreground: #7a8fb0 → 220 20% 50%
- Border: rgba(255,255,255,0.05) → 222 25% 15%

## Typography
- Headings: Barlow Condensed (700-900, uppercase, tracking 0.04em)
- Body: Barlow (300-600)
- Semi-condensed for buttons: Barlow Semi Condensed (500-700)

## Component patterns
- Cards: bg-card, border border-white/5, rounded-2xl
- Select cards: border-white/5, bg-[hsl(222,40%,8%)], when selected: border-primary bg-primary/15 text-primary
- Buttons: gradient from primary-dark to primary
- Bottom nav: bg-card/95 backdrop-blur, inactive items opacity-35 grayscale
- Hero card: gradient from card to slightly lighter, rounded-2xl
- Rating preview: gradient bg with primary/gold, border primary/25
