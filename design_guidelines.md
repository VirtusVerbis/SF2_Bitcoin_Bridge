# Cryptocurrency Trading Signal Dashboard - Street Fighter II Arcade Design Guidelines

## Design Approach
**Reference-Based: Street Fighter II Arcade UI** with functional dashboard requirements. Drawing from classic arcade cabinet aesthetics, CRT monitor effects, and 90s fighting game interfaces. Primary inspiration: SF2 character select screens, fight HUDs, and arcade button layouts.

## Core Design Elements

### Typography
- **Primary**: "Press Start 2P" (Google Fonts) for headers and labels
- **Secondary**: Monospace system font (Courier New) for data/numbers
- **Sizes**: 
  - Dashboard title: text-2xl to text-4xl
  - Section headers: text-lg to text-xl  
  - Data values: text-base to text-lg
  - Labels: text-sm to text-base
- **Treatment**: Text-shadow for neon glow effect, uppercase styling for arcade feel

### Layout System
**Spacing**: Tailwind units of 2, 4, 6, and 8 for consistency (p-4, gap-6, m-8)
**Container**: max-w-7xl with px-4 padding
**Grid**: 2-3 column layouts for trading pairs, single column for special moves config

### Component Library

**Arcade Cabinet Frame**
- Dashboard wrapped in a decorative border mimicking arcade cabinet bezels
- Scanline overlay effect using CSS gradients
- Corner decorations with pixel-art bolts/screws

**Trading Signal Cards**
- Arcade button aesthetic with embossed circular design
- BUY signals: Green neon with "PUNCH" button styling
- SELL signals: Red neon with "KICK" button styling
- Card headers styled as SF2 character name plates with metallic gradient backgrounds
- Real-time price data in digital LED-style numerals

**Special Move Configuration Panel**
- Styled as SF2 move list menu with command inputs (← ↓ ↘ + P format)
- Each configuration row shows: Move name, threshold value, keyboard mapping
- Input fields styled as arcade coin slot displays
- "CONFIGURE" buttons styled as START/SELECT arcade buttons

**Status Indicators**
- Health bar-style threshold meters showing percentage filled
- Round timer aesthetic for countdown/refresh intervals
- "READY/FIGHT" status labels for active monitoring
- Combo counter display for consecutive signals

**Navigation/Header**
- Styled as arcade marquee with glowing border
- Exchange toggles (Binance/Coinbase) as player select buttons
- Settings icon as coin insert slot graphic

**Data Tables**
- SF2 versus screen layout for comparing assets
- Alternating row backgrounds with subtle CRT scan effect
- Highlight active rows with neon pulse animation

### Images
**Hero Section**: Full-width background image featuring Street Fighter II arcade cabinet exterior or character select screen with CRT screen glow effect. Overlay dashboard title with glowing neon text. Use subtle blur/dim on background to ensure text legibility.

**Decorative Elements**: Pixel art cryptocurrency symbols styled as SF2 character portraits (Bitcoin as Ryu, Ethereum as Ken, etc.) used as card icons.

### Visual Effects
- Subtle CRT curvature on main dashboard container
- Scanline animation overlay (very subtle, 5% opacity)
- Neon glow on active elements using box-shadow with green/red/blue/yellow
- Pixel borders (2px solid) with glowing outer shadow
- VHS static effect on loading states

### Accessibility
- Maintain 4.5:1 contrast ratio despite neon effects (use darker backgrounds behind glowing text)
- Clear focus indicators styled as arcade selection highlight boxes
- Keyboard navigation styled as D-pad directional inputs
- Screen reader labels for all arcade-themed controls

### Animation Budget
- Minimal: Only pulsing neon glow on active signals (2s ease-in-out loop)
- Threshold breach triggers brief "HADOUKEN!" flash effect (one-time, non-repeating)
- Avoid constant motion to maintain data readability