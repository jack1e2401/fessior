# FE Design System — OCJ (Online Code Judge)

> Phiên bản 1.1 — áp dụng cho toàn bộ web refactor

---

## 0. QUY TẮC VÀNG: THẰNG CHA PHẢI CÓ PADDING, THẰNG CON PHẢI CÓ MARGIN

> **Đây là rule bất di bất dịch, áp dụng cho TOÀN BỘ FE.**

### Nguyên lý

```
┌── <div class="p-6">          ← THẰNG CHA: luôn có padding
│  ┌── <div class="mb-4">      ← THẰNG CON: luôn có margin-bottom
│  └── <div class="mb-4">
│  └── <div>                    ← THẰNG CON CUỐI CÙNG: margin = 0
└──────────────────────────
```

### Luật cụ thể

| Vị trí | Luật |
|--------|------|
| **Block container** (card, panel, section) | Phải có `padding` (`p-*`). Không block nào được để `p-0`. |
| **Con bên trong block** | Phải có `margin-bottom` (`mb-*`). Không con nào được đứng sát con tiếp theo. |
| **Con cuối cùng trong block** | `margin-bottom: 0` (dùng `last:mb-0` hoặc `[&>:last-child]:mb-0`) |
| **Inline elements** (badge, pill, tag) | Phải có `gap-*` hoặc `space-x-*` / `space-y-*` trên cha, hoặc `margin-right` trên mỗi con. |
| **Form items** | `<Form.Item>` mặc định có margin-bottom của Ant Design. Nếu cần ghi đè, dùng `className="mb-5"`. |
| **Page sections** | Mỗi section cách nhau ít nhất `space-y-8` hoặc `gap-8`. |
| **Text block** (heading, paragraph) | Heading + paragraph kề nhau: paragraph phải có `mt-2` hoặc cha có `space-y-2`. |

### Mẫu chuẩn

```tsx
// ✅ ĐÚNG — cha có padding, con có margin
<div className="p-6">
  <h2 className="mb-3">Title</h2>
  <p className="mb-4">Description</p>
  <Button className="mb-0">Action</Button>
</div>

// ✅ ĐÚNG — dùng space-y trên cha thay vì gán mb từng con
<div className="p-6 space-y-4">
  <h2>Title</h2>
  <p>Description</p>
  <Button>Action</Button>
</div>

// ❌ SAI — cha không có padding, con không có margin
<div>
  <h2>Title</h2>
  <p>Description</p>
</div>
```

### Spacing mặc định theo ngữ cảnh

| Ngữ cảnh | Cha padding | Con margin | Ghi chú |
|----------|------------|------------|---------|
| Card | `p-6` | `mb-4` | Tăng lên `p-8` cho form |
| Form card | `p-8 lg:p-10` | `mb-5` (Form.Item) | |
| Section | `space-y-8` | — | Dùng space-y thay vì mb |
| Stat row | `gap-3` | — | Grid container |
| Button group | `gap-2` | — | Flex container |
| Inline pills | `gap-2` | — | Flex wrap |
| Page container | `space-y-10` | — | |

---

## 1. Spacing Scale

Toàn bộ spacing trong dự án dùng scale của Tailwind CSS. Không dùng giá trị tùy ý ngoài scale này.

| Token | px  | rem  | Dùng cho |
|-------|-----|------|----------|
| `0.5` | 2px | —    | Gap siêu nhỏ giữa icon-text |
| `1`   | 4px | 0.25 | Gap giữa các pill/badge inline |
| `1.5` | 6px | 0.375 | Gap giữa label và value |
| `2`   | 8px | 0.5  | Gap giữa các item trong list ngắn |
| `2.5` | 10px| 0.625 | Padding trong pill nhỏ |
| `3`   | 12px| 0.75 | Gap card grid, padding input |
| `3.5` | 14px| 0.875 | Padding trong stat card |
| `4`   | 16px| 1    | Padding card mặc định |
| `5`   | 20px| 1.25 | Gap giữa sections trong page |
| `6`   | 24px| 1.5  | Padding form, gap form items |
| `7`   | 28px| 1.75 | Padding modal/panel |
| `8`   | 32px| 2    | Padding lớn của layout card |
| `10`  | 40px| 2.5  | Gap giữa các section lớn |
| `12`  | 48px| 3    | Padding page top/bottom |
| `14`  | 56px| 3.5  | Gap giữa sidebar và content |
| `16`  | 64px| 4    | Padding page dày |
| `20`  | 80px| 5    | Padding landing page |

### Nguyên tắc

- **Page padding (container ngoài cùng)**: `px-6 sm:px-10 lg:px-14` (mobile → tablet → desktop)
- **Card padding**: `p-6` mặc định, `p-7` hoặc `p-8` cho form/modal
- **Gap giữa các section**: `space-y-8` cho chính, `space-y-5` cho phụ
- **Gap giữa form items**: dùng `size="large"` của Ant Design Form (tự động 24px)

---

## 2. Container & Responsive

### Breakpoints

| Breakpoint | Min-width | Áp dụng |
|------------|-----------|---------|
| `sm` | 640px  | Tablet nhỏ |
| `md` | 768px  | Tablet |
| `lg` | 1024px | Laptop / Desktop nhỏ |
| `xl` | 1280px | Desktop |
| `2xl`| 1536px | Desktop lớn |

### Container Width

| Loại trang | Container | Giải thích |
|------------|-----------|------------|
| **Landing page** (`/auth`) | `max-w-5xl` (1024px) | Trang không sidebar, cần tập trung |
| **Dashboard** | `max-w-7xl` (1280px) | Trong AppShellLayout, có sidebar |
| **Admin** | `max-w-none` (full width) | Cần bảng rộng, nhiều cột |
| **Editor (code)** | `max-w-none` (full width) | Monaco Editor cần tối đa không gian |

### Grid Layouts

| Layout | Tailwind | Dùng |
|--------|----------|------|
| 2 cột (form) | `lg:grid-cols-[1fr_380px]` | Form đăng nhập |
| 2 cột (content) | `lg:grid-cols-[2fr_1fr]` | Dashboard 2 cột |
| 2 cột (editor) | `lg:grid-cols-[1fr_1fr]` | Code editor + description |
| 3 cột stats | `grid-cols-3` | Stat cards |
| 4 cột grid | `grid-cols-2 md:grid-cols-4` | Problem cards |

### Padding Container

```css
/* Mặc định cho mọi page container */
.container-page {
  @apply w-full max-w-7xl mx-auto px-6 sm:px-8 lg:px-10 py-6;
}
```

> **Quy tắc**: Container padding theo cặp: mobile 24px, tablet 32px, desktop 40px.

---

## 3. Color Palette

### Bảng màu đầy đủ

| Token | Mã màu | Vai trò |
|-------|--------|--------|
| **Navy 950** | `#020617` | Background tối nhất |
| **Navy 900** | `#0A0F1F` | Background landing page, auth form bg |
| **Navy 850** | `#0F172A` | Sidebar background |
| **Navy 800** | `#16233D` | Card bg trong dark theme |
| **Navy 750** | `#1E293B` | Border trong dark theme |
| **Surface 50** | `#F8FAFC` | Background trang sáng (dashboard) |
| **Surface 100**| `#F1F5F9` | Background page sáng, hover row |
| **Surface 200**| `#E2E8F0` | Border sáng |
| **Surface 300**| `#CBD5E1` | Border đậm, text placeholder |
| **Surface 400**| `#94A3B8` | Text phụ (icon, label) |
| **Surface 500**| `#64748B` | Text phụ quan trọng, metadata |
| **Emerald 300**| `#6EE7B7` | Accent text trên dark bg (đã giảm độ gắt) |
| **Emerald 400**| `#34D399` | Icon active, hover state |
| **Emerald 500**| `#10B981` | Primary button, active tab, primary |
| **Emerald 600**| `#059669` | Primary hover |
| **Amber 400** | `#FBBF24` | Icon cảnh báo, highlight |
| **Amber 500** | `#F59E0B` | Progress bar, rank highlight |
| **Danger 500**| `#EF4444` | Error, WA, TLE status |

### Quy tắc contrast

- **Dark bg + text**: `text-surface-300` tối thiểu cho body, `text-slate-100` cho heading
- **Light bg + text**: `text-navy-850` cho heading, `text-surface-600` cho body
- **Không dùng text-surface-400 trên dark bg** cho nội dung chính — quá tối, vi phạm WCAG AA
- Accent color (emerald) trên dark bg: dùng opacity `90%` hoặc `80%` để giảm độ gắt
- Không dùng `text-emerald-400` full opacity cho text dài — chỉ dùng cho icon và badge

---

## 4. Typography

### Font stack

| Vai trò | Font | Fallback |
|---------|------|----------|
| **Heading / Display** | Clash Display | system-ui, sans-serif |
| **Body / UI** | Satoshi | system-ui, sans-serif |
| **Code / Terminal** | JetBrains Mono | ui-monospace, monospace |

### Font size scale

| Token | Size | Line-height | Dùng cho |
|-------|------|-------------|----------|
| `xs` | 10-11px | 1.5 | Badge label, metadata, caption |
| `sm` | 12-13px | 1.5 | Form label, table cell, description |
| `base` | 14px | 1.6 | Body text, paragraph |
| `lg` | 16px | 1.6 | Sub-heading, card title |
| `xl` | 18-20px | 1.4 | Section heading, stat value |
| `2xl` | 24-26px | 1.3 | Modal title, form heading |
| `3xl` | 28-32px | 1.2 | Page title |
| `4xl` | 40-54px | 1.12 | Hero headline (landing page) |
| `5xl` | 56-64px | 1.08 | Super headline |

### Quy tắc typography

1. **Line-height cho heading**: Không bao giờ dưới `1.08` và không trên `1.15` cho display text
2. **Line-height cho body**: Luôn `leading-relaxed` (1.625) để đọc thoải mái
3. **Font weight**: Heading `font-semibold` (600) hoặc `font-bold` (700), body `font-normal` (400)
4. **Letter-spacing**: Heading to `tracking-[-0.02em]`, label uppercase `tracking-wider` hoặc `tracking-[0.15em]`
5. **Không dùng quá 3 kích cỡ chữ trong cùng 1 section**

### Cặp màu text chuẩn

| Ngữ cảnh | Heading | Body | Metadata |
|----------|---------|------|----------|
| Dark bg page | `text-slate-100` | `text-surface-300` | `text-surface-500` |
| Light card | `text-navy-850` | `text-surface-600` | `text-surface-400` |
| Glass card (dark) | `text-slate-100` | `text-surface-400` | `text-surface-500` |
| Terminal | `text-slate-300` | `text-slate-300` | `text-surface-500` |

---

## 5. Component Style Rules

### Cards

```css
/* Light card (dashboard) */
.card-light {
  @apply bg-white rounded-2xl border border-surface-200 shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-6;
}

/* Dark card (landing) */
.card-dark {
  @apply bg-white/[0.025] rounded-xl border border-white/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.15)] p-4;
}

/* Glass card (auth form) */
.card-glass {
  @apply bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/[0.07] shadow-[0_8px_32px_rgba(0,0,0,0.3)];
}
```

**Quy tắc**:
- Card luôn có `border` — không dùng card không viền
- Card luôn có `shadow` nhẹ — tạo depth, không phẳng
- Card có `rounded-xl` hoặc `rounded-2xl` — không dùng `rounded-lg` cho card chính
- Card không nên là container mặc định — ưu tiên layout sections trước

### Buttons

- **Primary**: `bg-emerald-500 hover:bg-emerald-400` với `shadow-[0_4px_14px_rgba(16,185,129,0.25)]`
- **Danger**: `bg-danger-500` với shadow đỏ
- **Ghost/Text**: Không background, chỉ border hoặc text màu
- **Size**: `h-[44px]` cho standard, `h-[38px]` cho compact, `h-[52px]` cho hero CTA
- **Radius**: `rounded-lg` mặc định

### Form Inputs

- **Height**: `h-[44px]` tiêu chuẩn
- **Radius**: `rounded-lg`
- **Border**: `border-surface-200` (light) hoặc `border-white/[0.08]` (dark)
- **Label**: `text-[11px] font-semibold uppercase tracking-wider text-surface-400`
- **Placeholder**: `text-surface-400`

### Tabs

Không dùng `Segmented` của Ant Design trên dark theme — thay bằng custom pill buttons:

```tsx
<div className="flex bg-white/[0.04] rounded-lg p-1 border border-white/[0.05]">
  {items.map(item => (
    <button className={`flex-1 py-2 rounded-md transition-all
      ${active ? 'bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.3)]'
               : 'text-surface-400 hover:text-surface-200'}`}>
      {item.label}
    </button>
  ))}
</div>
```

---

## 6. Motion & Animation

### Timing

| Loại | Duration | Easing |
|------|----------|--------|
| Page entrance | 0.4-0.5s | `ease-out` |
| Hover transition | 0.2s | `ease` |
| Modal/Dialog | 0.3s | `ease-out` |
| Stagger delay | 0.05s mỗi item | — |

### Stagger pattern

```css
.stagger-1 { animation-delay: 0.05s; }
.stagger-2 { animation-delay: 0.10s; }
.stagger-3 { animation-delay: 0.15s; }
.stagger-4 { animation-delay: 0.20s; }
.stagger-5 { animation-delay: 0.25s; }
```

### Entrance animations

| Class | Effect |
|-------|--------|
| `animate-fade-in-up` | Fade + slide up 12px |
| `animate-fade-in` | Fade only |
| `animate-slide-in-left` | Slide from left 24px |
| `animate-scale-in` | Scale from 0.95 |

### Quy tắc

- Chỉ animate lúc **page load** và **hover** — không animate scroll
- Không dùng animation lặp vô tận (trừ cursor blink và subtle glow)
- Stagger chỉ dùng cho hero section — không áp dụng cho dashboard

---

## 7. Iconography

- Dùng `@ant-design/icons` cho toàn bộ icon UI
- Kích cỡ icon: `text-xs` (12px) trong stat, `text-base` (16px) trong nav, `text-lg` (20px) trong hero
- Icon trong sidebar: `text-lg`
- Icon trong form input: `text-surface-400`
- Icon trạng thái (Accepted/Error): `text-emerald-400` / `text-danger-500`
- **Không dùng icon làm decoration thuần** — mỗi icon phải có semantic purpose

---

## 8. Layout Pattern: Dashboard

```
┌──────────────────────────────────────────────────┐
│ Sidebar 260px │ TopBar (h-16, white)             │
│ (Navy 850)    ├───────────────────────────────────│
│               │ Content (p-6, max-w-7xl, mx-auto) │
│  [Logo]       │                                   │
│               │  ┌─ PageHeader ───────────────┐   │
│  MAIN         │  │ Title + Subtitle + Actions  │   │
│  • Lobby      │  └────────────────────────────┘   │
│  • Editor     │                                   │
│  • Problems   │  ┌─ Content Grid ─────────────┐   │
│  • Rankings   │  │ [Section ...]               │   │
│               │  └────────────────────────────┘   │
│  • Submissions│                                   │
│               │                                   │
│  TOOLS        │                                   │
│  • Settings   │                                   │
├───────────────┤                                   │
│  [User Avatar]│                                   │
└──────────────────────────────────────────────────┘

## 8.1 Layout Pattern: Admin Panel

Giao diện Admin được tách biệt hoàn toàn khỏi AppShellLayout của người dùng, sử dụng toàn màn hình (`h-screen w-full`).
Sidebar của Admin hiện có Problems, Submissions và Matches. Trang `/admin/*` này chỉ dành cho người dùng có role `ADMIN`.
```

---

## 11. Landing Page Template (Auth)

### Outer Wrapper

```html
<div class="relative min-h-screen w-full flex items-center justify-center p-4 lg:p-8 bg-black/90 overflow-hidden">
  <DotGrid />
  <div class="relative z-10 w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
    <!-- LEFT: Hero -->
    <!-- RIGHT: Form -->
  </div>
</div>
```

### Cột Trái (Hero)

```html
<div class="flex flex-col gap-6 justify-center">
  <!-- Logo → Heading → Stats → Terminal → Trust Badges -->
</div>
```

### Cột Phải (Form Card)

```html
<div class="w-full max-w-md mx-auto lg:mr-auto lg:ml-0">
  <div class="bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl p-8 lg:p-10">
    <!-- MEMBER ACCESS → Mode Tabs → Form → Footer -->
  </div>
</div>
```

### Form Input Rules (Native HTML)

| Element | Classes |
|---------|---------|
| `<form>` | `flex flex-col gap-5 mt-8` |
| `<label>` | `block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider` |
| `<input>` | `w-full bg-[#0B1120] border border-slate-700/60 rounded-lg px-4 py-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all` |
| Submit `<button>` | `mt-2 w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex justify-center items-center gap-2` |

### Mode Tabs

```html
<div class="flex bg-white/[0.04] rounded-lg p-1 mb-6 border border-white/[0.05]">
  <!-- active: bg-emerald-500 text-white shadow-[0_2px_8px_rgba(16,185,129,0.3)] -->
  <!-- inactive: text-surface-400 hover:text-surface-200 -->
</div>
```

### Trust Badges (Footer cột trái)

```html
<div class="mt-8 flex flex-wrap gap-3">
```

### Card Depth Standard

Tất cả card trên dark bg dùng chung:
```
border border-white/10 bg-white/5 backdrop-blur-md shadow-2xl shadow-black/40
```

### MEMBER ACCESS Label

```html
<div class="text-xs font-bold tracking-widest text-emerald-400">MEMBER ACCESS</div>
```

---

## 9. Trạng thái (States)

Mọi page phải xử lý đủ 4 trạng thái:

| State | Component |
|-------|-----------|
| **Loading** | `Spin` hoặc skeleton cards |
| **Empty** | `EmptyState` từ `apps/web/src/components/shared` |
| **Error** | `Alert type="error"` với message cụ thể |
| **Success** | Nội dung data |

> Không hiển thị màn hình trắng trong bất kỳ trạng thái nào.

---

## 10. Code Standards (bắt buộc)

1. **TypeScript strict**: không `any`, luôn khai báo interface/type
2. **Import order**: React → thư viện ngoài → packages nội bộ (`@ocj/*`) → components nội bộ
3. **Component pattern**: `function Component() {}` (không arrow function cho component)
4. **File naming**: PascalCase cho component, camelCase cho hooks/utils
5. **CSS**: Chỉ dùng Tailwind classes — không tạo file `.css` mới (trừ `index.css` global)
6. **Mỗi component một file** — không gộp nhiều component trong 1 file
7. **DRY**: Extract logic dùng chung vào `apps/web/src/lib/utils.ts` hoặc `apps/web/src/components/shared`
8. **Commit**: Theo conventional commits (`feat:`, `fix:`, `refactor:`, `docs:`)
