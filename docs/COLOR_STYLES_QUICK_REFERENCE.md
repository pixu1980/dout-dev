# Mappa Veloce - Colori e Stili dout-dev

## 📁 File Principali

| File                                                        | Tipo | Contenuto                                   |
| ----------------------------------------------------------- | ---- | ------------------------------------------- |
| [src/styles/main.css](../src/styles/main.css)               | CSS  | ⭐ TUTTO (variabili, componenti, gradienti) |
| [src/styles/index.css](../src/styles/index.css)             | CSS  | Minimal bootstrap                           |
| [src/components/header.html](../src/components/header.html) | HTML | Header + theme/accent picker                |
| [src/scripts/main.js](../src/scripts/main.js)               | JS   | Theme switcher + accent picker logic        |

---

## 🎨 Accessi Rapidi ai Colori

### Definizione Variabili CSS

📍 **[src/styles/main.css:1-110](../src/styles/main.css#L1-L110)**

- Tutti i `--accent-*`, `--bg`, `--text`, `--surface`, `--shadow`, `--border`
- Font stack e spacing scale

### Tema Light

📍 **[src/styles/main.css:1-50](../src/styles/main.css#L1-L50)**

- Background: `#f5efe6` (beige)
- Text: `#131117` (nero)

### Tema Dark

📍 **[src/styles/main.css:70-100](../src/styles/main.css#L70-L100)** (`@media prefers-color-scheme: dark`)

- Background: `#0f0e13` (nero profondo)
- Text: `#f7f1eb` (bianco caldo)

### Accenti Alternativi

📍 **[src/styles/main.css:101-110](../src/styles/main.css#L101-L110)** (`body[data-accent='violet|green']`)

- Violet: HSL 322°
- Green: HSL 145°

---

## 🌊 Gradienti

| Gradiente           | Ubicazione                                                      | Uso                                                         |
| ------------------- | --------------------------------------------------------------- | ----------------------------------------------------------- |
| **Body Background** | [src/styles/main.css:189-191](../src/styles/main.css#L189-L191) | 2x radiale + 1x lineare verticale nel background principale |
| **Feature Card**    | [src/styles/main.css:622-626](../src/styles/main.css#L622-L626) | `linear-gradient(160deg, ...)` per `.feature-card`          |

---

## 🧩 Componenti → Colori

### Uso Variabili CSS

```
.button--primary           → var(--accent) + #0f0b0a
.text-link                 → var(--accent-strong)
.tag                       → color-mix(accent-soft 66%, surface 34%)
.feature-card              → linear-gradient con accent-soft
.prose blockquote          → border: 3px solid var(--accent)
.prose a                   → var(--accent-strong)
.post-card, .card          → var(--surface), var(--border)
.eyebrow::before           → var(--accent)
.accent-picker buttons     → color-mix per l'accent selected
```

### Colori Hardcoded (Minimal)

```
#111014                     → Pre code block background (dark)
#f5f2ee                     → Pre code block text (light)
#0f0b0a                     → Primary button text (sempre scuro)
```

---

## 🎛️ Sistema di Tema

### JavaScript (main.js)

**Theme Switcher** [righe 28-57](../src/scripts/main.js#L28-L57)

```
Ciclo: auto → dark → light → auto
Salva in localStorage['theme']
Imposta document.documentElement.dataset.theme
```

**Accent Picker** [righe 58-75](../src/scripts/main.js#L58-L75)

```
Opzioni: default (remove attr), violet, green
Salva in localStorage['accent']
Imposta body[data-accent='...']
```

---

## 🧭 Layout Header

### HTML Structure

[src/components/header.html](../src/components/header.html)

```
<header class="site-header">
  ├── Brand (dout.dev)
  ├── Menu Toggle (mobile)
  ├── Nav Menu
  │   ├── Links (Home, Archive, Search, About)
  │   └── Actions
  │       ├── Theme Switcher Button
  │       └── Accent Picker (3 dots)
```

### CSS Layout

[src/styles/main.css:249-290](../src/styles/main.css#L249-L290)

```
.site-header           → sticky, blur backdrop, border-bottom
.header-bar            → grid 1fr auto, gap space-4
.main-nav              → flex, gap space-5
.main-links            → flex wrap, gap space-2
.header-actions        → flex, gap space-2
```

### Responsive

- Desktop: Tutti elementi visibili
- Mobile (max-width: 860px): Menu nascosto, toggle visibile
  - `.main-nav` → display: none
  - `.main-nav[data-open='true']` → display: flex (quando attivo)
  - `.brand__tag` → display: none

---

## 🎯 Checklist per Modifiche

Quando modifichi colori/stili:

- [ ] Usa custom properties `var(--*)` sempre
- [ ] Per colori dinamici, aggiungi a `:root` in [main.css:1-110](../src/styles/main.css#L1-L110)
- [ ] Supporta light E dark in `@media (prefers-color-scheme: dark)`
- [ ] Se accent-sensitive, testa con `body[data-accent='violet']` e `body[data-accent='green']`
- [ ] Test tema switcher [main.js:28-57](../src/scripts/main.js#L28-L57)
- [ ] Test accent picker [main.js:58-75](../src/scripts/main.js#L58-L75)
- [ ] Evita hardcoding colori (sono solo 3 eccezioni per code blocks)

---

## 📊 Tabella Variabili + Valori

```
ACCENT (default, violet, green)
  --accent-h: 16 (default) | 322 (violet) | 145 (green)
  --accent-s: 95%
  --accent-l: 58%
  --accent: hsl(var(--accent-h) var(--accent-s) var(--accent-l))
  --accent-soft: varies by theme
  --accent-strong: varies by theme

LIGHT THEME (default + explicit :root[data-theme='light'])
  --bg: #f5efe6
  --text: #131117
  --text-muted: #625c67
  --surface: rgba(255, 255, 255, 0.74)
  --border: rgba(26, 17, 23, 0.08)
  --shadow: 0 18px 48px rgba(32, 20, 9, 0.12)
  --shadow-strong: 0 28px 80px rgba(32, 20, 9, 0.18)

DARK THEME (@media prefers-color-scheme: dark + :root[data-theme='dark'])
  --bg: #0f0e13
  --text: #f7f1eb
  --text-muted: #b9aebd
  --surface: rgba(27, 24, 33, 0.72)
  --border: rgba(255, 245, 238, 0.08)
  --shadow: 0 18px 48px rgba(0, 0, 0, 0.28)
  --shadow-strong: 0 28px 80px rgba(0, 0, 0, 0.36)

SPACING
  --space-1: 0.25rem ... --space-9: 6rem

RADIUS
  --radius-sm: 0.875rem ... --radius-pill: 999px

TYPOGRAPHY (Fluid scales)
  --step--1: clamp(0.88rem, 0.84rem + 0.18vw, 0.98rem)
  --step-0: clamp(1rem, 0.92rem + 0.28vw, 1.14rem)
  ... up to --step-4

FONTS
  --font-display: Iowan Old Style, Palatino, ...
  --font-sans: Avenir Next, Segoe UI, ...
  --font-mono: IBM Plex Mono, SFMono, ...
```

---

## 🔗 Link Diretti ai Componenti Colorati

| Componente     | Link                                                  | Tema-aware             |
| -------------- | ----------------------------------------------------- | ---------------------- |
| Button Primary | [.button--primary](../src/styles/main.css#L609-L612)  | ✅ accent colore       |
| Text Link      | [.text-link](../src/styles/main.css#L618-L623)        | ✅ accent-strong       |
| Tag            | [.tag](../src/styles/main.css#L742-L751)              | ✅ accent-soft mixer   |
| Feature Card   | [.feature-card](../src/styles/main.css#L622-L626)     | ✅ linear-gradient     |
| Post Card      | [.post-card](../src/styles/main.css#L728-L742)        | ✅ surface, border     |
| Eyebrow        | [.eyebrow](../src/styles/main.js#L579-L591)           | ✅ accent glow         |
| Code Block     | [.prose pre](../src/styles/main.css#L860-L865)        | ❌ hardcoded (#111014) |
| Copy Button    | [.copy-button](../src/styles/main.css#L866-L874)      | ❌ hardcoded rgba()    |
| Blockquote     | [.prose blockquote](../src/styles/main.css#L841-L844) | ✅ accent border       |
