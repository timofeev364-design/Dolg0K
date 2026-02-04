# Babki Design System - Handoff Spec

## 01. Foundations

### Colors (Obsidian FinTech)
**Principles:** Matte, No Neon, Living Backgrounds.

| Token | Value | Role |
|-------|-------|------|
| **Backgrounds** | | |
| `BG/0` | `#05070B` | Deepest background (body) |
| `BG/1` | `#070B10` | Subtle gradient end / global nav |
| **Surfaces** | | |
| `Surface/1` | `#0C121B` | Main Cards |
| `Surface/2` | `#101A26` | Hover / Panels / Inputs |
| `Surface/3` | `#142235` | Active / Sidebar Hover |
| **Strokes** | | |
| `Stroke/1` | `rgba(255,255,255,0.06)` | Default Borders |
| `Stroke/2` | `rgba(255,255,255,0.10)` | Hover/Active Borders |
| `Divider` | `rgba(255,255,255,0.05)` | List separators |
| **Text** | | |
| `Text/Primary` | `#EAF0F7` | Headings, Primary actions |
| `Text/Secondary`| `#A7B3C2` | Body text |
| `Text/Tertiary` | `#748196` | Meta, labels |
| `Text/Disabled` | `#4A5568` | Disabled states |
| `Text/OnAccent` | `#001018` | Text on Primary Accent |
| **Accent (Cyan)**| | |
| `Accent/Primary`| `#6EE7FF` | Small elements only (buttons, icons) |
| `Accent/Hover` | `#3DDCFF` | Interaction state |
| `Accent/Soft` | `rgba(110,231,255,0.12)`| Selected backgrounds |
| `Accent/Line` | `rgba(110,231,255,0.65)`| Selection indicators |
| **Status** | | |
| `Success` | `#2AE8A7` | Positive trends |
| `Warning` | `#F7C97B` | Risks, attention |
| `Danger` | `#FF5A6B` | Critical, errors |

### Typography (Inter)
| Style | Size/Weight | LH | Usage |
|-------|-------------|----|-------|
| `H1` | 32px / 600 | 38 | Page Titles |
| `H2` | 22px / 600 | 28 | Section Headers |
| `H3` | 18px / 600 | 24 | Card Headers |
| `Amount/L`| 28px / 600 | 32 | Main KPIs |
| `Amount/M`| 20px / 600 | 24 | List Amounts |
| `Amount/S`| 16px / 600 | 20 | Secondary Amounts |
| `Body` | 16px / 400 | 24 | Default text |
| `Body/M`| 16px / 500 | 24 | Interactive text |
| `Caption`| 13px / 500 | 18 | Secondary descriptions |
| `Micro` | 12px / 500 | 16 | Badges, tiny meta |

### Spacing & Radius
- **Base Unit**: 4px
- **Radius**:
  - Card: 14px
  - UI Input/Button: 12px
  - Small: 10px

### Effects (Depth)
- **Shadow/1**: `y=8, blur=24, #000 35%` (Card Lift)
- **Shadow/2**: `y=12, blur=32, #000 45%` (Panel Lift)
- **Inner Edge**: `inset 0 1 0 rgba(255,255,255,0.04)` (Glass edge)

---

## 02. Components Rules
1. **Buttons**:
   - Primary: Accent BG + OnAccent Text.
   - Secondary: Surface 2 BG + Stroke 1 + Text Primary.
   - Danger: Danger Soft BG + Danger Text.
2. **Cards**:
   - Surface 1 Default.
   - Stroke 1 Always.
   - Shadow 1 Default.
3. **Inputs**:
   - Height 44-48px.
   - Surface 2 BG.
   - Focus: Ring 2px Accent/Soft.

---

## 03. Layout Rules
- **Desktop (1440px)**:
  - Sidebar: 240px Fixed Left.
  - Content: Max width 1120px.
  - Sidebar Items: Dashboard, Payments, Plan, Templates, Settings.
- **Mobile (390px)**:
  - Bottom Navigation.
  - Stacked Layout.
- **Visuals**:
  - NO GLOW.
  - NO 3D ELEMENTS.
  - Matte finishes only.

---

## 04. Assets
- Icons: Lucide / Feather (Stroke 1.75-2px).
