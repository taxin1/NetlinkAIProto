# Visual Effects Reference Guide

## 🎨 Color Palette & Gradients

### Gradient Combinations Used:

```
Header & Titles:
- from-blue-600 to-purple-600 (primary brand gradient)

Background Orbs:
- bg-blue-400/20 (top-left floating orb)
- bg-purple-400/20 (bottom-right floating orb)

Save Button:
- from-blue-600 to-purple-600 → from-blue-700 to-purple-700 (hover)

Status Active:
- from-green-500 to-emerald-600 (success state)

Status Pending:
- from-yellow-500 to-orange-600 (warning state)

Input Field Glows (on hover):
- Email Provider: from-blue-500/10 to-purple-500/10
- Email Address: from-purple-500/10 to-pink-500/10
- Password: from-green-500/10 to-emerald-500/10
- From Name: from-yellow-500/10 to-orange-500/10
- SMTP Background: from-indigo-50/50 to-purple-50/50

Status Card Background:
- from-green-400/10 via-blue-400/10 to-purple-400/10
```

## 🎬 Animation Timeline

### On Page Load (Sequential):
```
1. Background fade-in (0s)
   ├─ Gradient background appears
   └─ Floating orbs start pulsing

2. Header animation (0s)
   ├─ Fade in with backdrop blur
   ├─ Icon starts gentle bounce
   └─ Title gradient text appears

3. Notification (if present) (0s)
   └─ Slides down from top

4. Main form card (0s)
   └─ Fades in and slides up

5. Status card (0.2s delay)
   └─ Fades in and slides up
```

### Continuous Animations:
```
Background:
├─ Gradient shifts left-right (15s loop)
├─ Top orb pulses (4s loop)
└─ Bottom orb pulses (4s loop, 1s delay)

Header Icon:
└─ Gentle bounce (3s loop)

Status Badge (when active):
└─ Slow pulse (4s loop)

Status Card:
└─ Horizontal gradient flow (15s loop)
```

### Interaction Animations:
```
Input Fields:
├─ On Hover:
│   ├─ Border color shifts (300ms)
│   └─ Gradient glow fades in (500ms)
└─ On Focus:
    ├─ Border color changes (300ms)
    ├─ Ring appears (300ms)
    └─ Gradient glow visible

Buttons:
├─ On Hover:
│   ├─ Shadow increases (300ms)
│   ├─ Background darkens (300ms)
│   └─ Icon scales to 110% (300ms)
└─ On Click:
    └─ Loading spinner rotates

Select Dropdown:
├─ On Hover:
│   └─ Border color changes (300ms)
└─ On Focus:
    ├─ Blue ring appears (300ms)
    └─ Border highlights
```

## 📐 Spacing & Sizing Standards

### Input Fields:
```
Height: h-12 (48px)
Padding: px-4 (16px horizontal)
Border: border-2 (2px)
Radius: rounded-xl (12px)
```

### Buttons:
```
Height: h-12 (48px)
Padding: px-4 py-2
Radius: rounded-xl (12px)
Shadow: shadow-lg → shadow-xl (hover)
```

### Icons:
```
Small: h-4 w-4 (16px) - in labels
Medium: h-5 w-5 (20px) - in buttons
Large: h-6 w-6 (24px) - in cards
XLarge: h-8 w-8 (32px) - in header
```

### Cards:
```
Padding: p-8 (32px)
Gap: space-y-6 (24px between sections)
Radius: rounded-2xl (16px)
Shadow: shadow-2xl
```

## 🎭 State Indicators

### Email Configuration Status:

#### Not Configured:
```
Badge: Yellow → Orange gradient
Icon: AlertCircle (warning)
Background: Yellow tint
Message: Setup Required
Animation: Static
```

#### Configured & Active:
```
Badge: Green → Emerald gradient
Icon: CheckCircle (success)
Background: Green tint
Message: Active & Ready
Animation: Slow pulse
Status Grid: Shows 3 badges (Active, Secure, Ready)
```

### Form Validation:
```
Error State:
- Border: Red
- Background: Red tinted
- Message: Red text with alert icon

Success State:
- Border: Green
- Background: Green tinted
- Message: Green text with check icon
```

## 🌈 Icon Color Coding

```
🔵 Server Icon (Email Provider): text-blue-600
🟣 Mail Icon (Email Address): text-purple-600
🟢 Shield Icon (Password): text-green-600
🟡 Sparkles Icon (From Name): text-yellow-600
🔷 Server Icon (SMTP): text-indigo-600
```

## 💫 Glass Morphism Effects

### Applied To:
```
Header Card:
- backdrop-blur-sm
- bg-white/50 dark:bg-gray-900/50
- border border-white/60

Main Form Card:
- backdrop-blur-md
- bg-white/70 dark:bg-gray-900/70
- border-white/60

Status Card:
- backdrop-blur-md
- bg-white/70 dark:bg-gray-900/70
- border-white/60
```

## 🎯 Shadow Hierarchy

```
Level 1 (Buttons):
- shadow-md → shadow-lg (hover)

Level 2 (Cards):
- shadow-2xl (always)
- hover:shadow-3xl (main form card)

Level 3 (Header):
- shadow-2xl (glass card)
- blur-2xl opacity-20 (gradient background)

Glows (Behind Elements):
- blur-xl (input field glows)
- blur-2xl (header glow)
- blur-3xl (background orbs)
```

## 📱 Responsive Breakpoints

```
Container:
- max-w-5xl (1024px max)
- p-6 (padding on all sides)

Status Grid (when configured):
- grid-cols-3 (desktop)
- Adapts to single column on mobile

Button Layout:
- flex gap-3
- Save button: flex-1 (takes remaining space)
- Test & Delete: Fixed width
```

## 🔧 Custom Properties

### Border Styles:
```
Input Default: border-2 border-input
Input Hover: border-blue-400
Input Focus: border-blue-500 + ring-2 ring-blue-500/20
```

### Background Patterns:
```
Animated Background:
- bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50
- Dark: from-gray-900 via-blue-950 to-indigo-950
- background-size: 200% 200%
- Animation: 15s ease infinite
```

### Transition Timing:
```
Standard: duration-300 (300ms)
Slow: duration-500 (500ms)
Glow Effects: duration-500
Easing: cubic-bezier(0.4, 0, 0.2, 1)
```

## ✨ Special Effects

### Floating Orbs:
```css
Position: Fixed absolute
Size: 96 x 96 (384px)
Blur: blur-3xl
Opacity: 20% light, 10% dark
Animation: pulse-slow 4s infinite
Colors: Blue (top), Purple (bottom)
```

### Provider Info Box:
```
Background: bg-blue-50/50 (light), bg-blue-950/30 (dark)
Border: border-blue-200/50
Padding: p-3
Radius: rounded-lg
Icon: Emoji (🔐, ✅, ⚙️)
```

### Password Toggle Button:
```
Position: Absolute right-1 top-1/2
Transform: -translate-y-1/2
Size: h-10 w-10
Hover: bg-green-500/10
Icon: Eye / EyeOff
```

## 🎨 Dark Mode Adaptations

```
Backgrounds:
- Light: white/50-70 with backdrop-blur
- Dark: gray-900/50-70 with backdrop-blur

Borders:
- Light: white/60, gray-200/50
- Dark: gray-800/60, gray-800/50

Text:
- Light: Darker shades
- Dark: Lighter shades with proper contrast

Gradients:
- Maintain same hue progression
- Adjust saturation for readability
- Reduce opacity for orbs in dark mode
```

## 🚀 Performance Optimizations

```
GPU Accelerated Properties:
- transform
- opacity
- backdrop-filter

Efficient Animations:
- Use transform over position
- Opacity changes over display
- Will-change hints (automatic)

Minimal Reflows:
- Fixed dimensions where possible
- Absolute positioning for overlays
- Transform for movements
```

## 📋 Quick Reference

### When to use each animation:
```
fade-in: Initial page load
fade-in-up: Card appearances
slide-down: Notifications/Alerts
pulse-slow: Status indicators
bounce-slow: Important icons
gradient-shift: Background ambiance
gradient-x: Moving highlights
```

### Button States Priority:
```
1. Disabled: 50% opacity, no pointer
2. Loading: Spinner, disabled interactions
3. Hover: Enhanced shadow, color shift, icon scale
4. Active: Pressed state
5. Default: Ready for interaction
```

---

**Pro Tip**: All animations use CSS for maximum performance. JavaScript only handles state changes, not visual animations!

