# Mappa Struttura Colori e Stili - dout.dev

## 1. File SCSS/CSS

### In `src/styles/`

- **[index.css](../src/styles/index.css)** — Entry point degli stili
  - Importa tutti i layer CSS nell'ordine corretto
  - Costituisce il singolo punto di ingresso per Vite e i template HTML
- **[layers/](../src/styles/layers/)** — Struttura modulare degli stili
  - `tokens.css` definisce custom properties, tema, type scale, spacing scale e radii
  - `reset.css`, `base.css`, `layout.css`, `components.css`, `utilities.css`, `overrides.css` separano i layer visivi

### In `scripts/`

- Nessun file SCSS/CSS nei script

---

## 2. Variabili CSS Definite in `:root`

### **layers/tokens.css - Tokens Layer**

#### **Colori Accent (variabili HSL)**

```css
--dout--accent-h: 16 /* Orange default */ --dout--accent-s: 95% --dout--accent-l: 58%
  --dout--accent: hsl(var(--dout--accent-h) var(--dout--accent-s) var(--dout--accent-l))
  --dout--accent-soft: hsl(var(--dout--accent-h) 100% 92%)
  --dout--accent-strong: hsl(var(--dout--accent-h) 96% 48%);
```

#### **Tema Light (Default)**

```css
--bg: #f5efe6 /* Beige chiaro */ --bg-elevated: rgba(255, 250, 244, 0.82) --surface: rgba(255, 255, 255, 0.74)
  /* Superficie principale */ --surface-strong: rgba(255, 255, 255, 0.92) --surface-muted: rgba(246, 238, 229, 0.82)
  --text: #131117 /* Nero profondo */ --text-muted: #625c67 /* Grigio */ --border: rgba(26, 17, 23, 0.08)
  /* Bordi sottili */ --shadow: 0 18px 48px rgba(32, 20, 9, 0.12) --shadow-strong: 0 28px 80px rgba(32, 20, 9, 0.18);
```

#### **Tema Dark** (media query `prefers-color-scheme: dark`)

```css
--bg: #0f0e13 /* Nero profondo */ --bg-elevated: rgba(19, 17, 24, 0.84) --surface: rgba(27, 24, 33, 0.72)
  --surface-strong: rgba(29, 25, 36, 0.92) --surface-muted: rgba(21, 19, 26, 0.88) --text: #f7f1eb /* Bianco caldo */
  --text-muted: #b9aebd /* Grigio chiaro */ --border: rgba(255, 245, 238, 0.08) --shadow: 0 18px 48px
  rgba(0, 0, 0, 0.28) --shadow-strong: 0 28px 80px rgba(0, 0, 0, 0.36) --accent-soft: hsl(var(--accent-h) 80% 18%);
```

#### **Font Stack**

```css
--font-display:
  'Iowan Old Style', 'Palatino Linotype', 'Book Antiqua', Palatino, Georgia, serif --font-sans: 'Avenir Next',
  'Segoe UI Variable Text', 'Helvetica Neue', sans-serif --font-mono: 'IBM Plex Mono', 'SFMono-Regular',
  'Cascadia Code', Consolas, monospace;
```

#### **Spacing Scale**

```css
--space-1: 0.25rem --space-2: 0.5rem --space-3: 0.75rem --space-4: 1rem --space-5: 1.5rem --space-6: 2rem
  --space-7: 3rem --space-8: 4rem --space-9: 6rem;
```

#### **Border Radius**

```css
--radius-sm: 0.875rem --radius-md: 1.375rem --radius-lg: 2rem --radius-pill: 999px;
```

#### **Typography Scale (Fluid)**

```css
--step--1: clamp(0.88rem, 0.84rem + 0.18vw, 0.98rem) --step-0: clamp(1rem, 0.92rem + 0.28vw, 1.14rem)
  --step-1: clamp(1.18rem, 1rem + 0.7vw, 1.5rem) --step-2: clamp(1.45rem, 1.16rem + 1.25vw, 2rem)
  --step-3: clamp(1.9rem, 1.4rem + 2vw, 2.85rem) --step-4: clamp(2.6rem, 1.85rem + 3vw, 4.2rem);
```

#### **Layout**

```css
--container: min(76rem, calc(100% - 2rem)) --reading-width: min(46rem, 100%);
```

---

## 3. Selettori di Tema

### **Override Tema Light Esplicito**

```css
:root[data-theme='light'] {
  /* Same as default light theme */
}
```

### **Override Tema Dark Esplicito**

```css
:root[data-theme='dark'] {
  /* Same as prefers-color-scheme: dark */
}
```

### **Accenti Alternativi (su `body`)**

```css
body[data-accent='violet'] {
  --accent-h: 322; /* Tonalità violetto */
}

body[data-accent='green'] {
  --accent-h: 145; /* Tonalità verde */
}
```

---

## 4. Gradienti CSS

### **Nel `body` - Background principale (righe 189-191)**

```css
background:
  radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 24%, transparent) 0, transparent 36%),
  radial-gradient(circle at 90% 12%, rgba(255, 255, 255, 0.34) 0, transparent 24%),
  linear-gradient(180deg, var(--bg) 0%, color-mix(in srgb, var(--bg) 86%, #ffffff 14%) 100%);
```

**Composizione:**

- Gradiente radiale top-left con accent (24% opacità)
- Gradiente radiale top-right bianco (luminosità nella parte superiore)
- Gradiente lineare verticale dal background base a bianco sfumato

### **Feature Cards (righe 622-626)**

```css
background: linear-gradient(
  160deg,
  color-mix(in srgb, var(--accent-soft) 64%, var(--surface-strong) 36%) 0%,
  var(--surface-strong) 100%
);
```

**Uso:** `.feature-card` — Componente card con sfondo sfumato 160°

---

## 5. Sistemi di Tema Hardcoded

### **Meta Tag Theme Color**

- File: `src/404.html`, `src/archive.html`, etc.
- Valore: `<meta name="theme-color" content="#ff6b3d">` (Orange default)

### **Giscus Comments Theme Sync**

- File: [src/scripts/main.js](../src/scripts/main.js) righe 8-24
- Sincronizza il tema dei commenti con il tema della pagina
- Mapping: `dark` → Giscus dark theme, `light` → Giscus light theme

---

## 6. Componenti e Colori Hardcoded

### **Componenti con Colori Dinamici (CSS Custom Properties)**

Tutte le seguenti componenti usano variabili CSS, NON hardcoding:

| Componente         | Selettore                                | Proprietà Colore                                                                    |
| ------------------ | ---------------------------------------- | ----------------------------------------------------------------------------------- |
| Pulsanti primari   | `.button--primary`                       | `background: var(--accent)`, `color: #0f0b0a`                                       |
| Link di testo      | `.text-link`                             | `color: var(--accent-strong)`                                                       |
| Tags               | `.tag`                                   | `background: color-mix(in srgb, var(--accent-soft) 66%, var(--surface-strong) 34%)` |
| Eyebrow decorativo | `.eyebrow::before`                       | `background: var(--accent)`, bordo con accent                                       |
| Cards varie        | `.post-card`, `.feature-card`, `.card`   | `background: var(--surface)`, `border: var(--border)`                               |
| Links hover        | `a:hover`                                | `color: var(--accent-strong)`                                                       |
| Blockquote         | `.prose blockquote`                      | `border-left: 3px solid var(--accent)`                                              |
| Code inline        | `.prose :not(pre) > code`                | `background: color-mix(in srgb, var(--accent-soft) 50%, var(--surface-strong) 50%)` |
| Pagination attiva  | `.pagination__link[aria-current='page']` | `background: var(--accent)`, `color: #0f0b0a`                                       |

### **Colori Hardcoded (Minimal)**

- **Skip link focus**: `background: var(--accent)`, `color: #0f0b0a` (sempre scuro)
- **Pagination page corrente**: `color: #0f0b0a` (sempre scuro)
- **Pre code block**: `background: #111014`, `color: #f5f2ee` (sempre dark mode)
- **Copy button**: Border/background con `rgba(255, 255, 255, 0.16|0.08)` (per dark tema pre)

---

## 7. Header Layout

### **Struttura HTML**

File: [src/components/header.html](../src/components/header.html)

```html
<header role="banner" class="site-header">
  <div class="container header-bar">
    <!-- Logo / Brand -->
    <a class="brand" href="/">
      <span class="brand--mark">dout.dev</span>
      <span class="brand--tag">Frontend notes, design systems, and the sharp edges of shipping.</span>
    </a>

    <!-- Menu Toggle (mobile) -->
    <button class="menu-toggle" aria-controls="mainmenu" aria-expanded="false">☰</button>

    <!-- Navigation Menu -->
    <nav id="mainmenu" class="main-nav">
      <ul class="main-links" role="list">
        <li><a href="/">Home</a></li>
        <li><a href="/archive.html">Archive</a></li>
        <li><a href="/search.html">Search</a></li>
        <li><a href="/about.html">About</a></li>
      </ul>

      <!-- Actions (Theme + Accent Picker) -->
      <div class="header-actions">
        <button class="theme-switcher" aria-label="Toggle theme"></button>
        <div class="accent-picker" role="group">
          <button class="accent-dot" data-accent="default" title="Default"></button>
          <button class="accent-dot" data-accent="violet" title="Violet"></button>
          <button class="accent-dot" data-accent="green" title="Green"></button>
        </div>
      </div>
    </nav>
  </div>
</header>
```

### **CSS Header**

File: [src/styles/index.css](../src/styles/index.css#L249-L290)

```css
.site-header {
  position: sticky;
  top: 0;
  z-index: 10;
  backdrop-filter: blur(18px);
  background: color-mix(in srgb, var(--bg-elevated) 92%, transparent);
  border-bottom: 1px solid var(--border);
}

.header-bar {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-4);
  padding: 1rem 0;
}

.main-nav {
  display: flex;
  align-items: center;
  gap: var(--space-5);
}

.main-links {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
```

**Features:**

- Sticky positioning con blur backdrop
- Grid layout: brand + toggle (mobile)
- Flex navigation con links responsive
- Accent picker a 3 opzioni (default, violet, green)
- Theme switcher (auto/light/dark ciclo)
- Responsive: menu nascosto su mobile, toggle visibile

---

## 8. Sistema di Temi - JavaScript

### **Theme Switcher**

File: [src/scripts/main.js](../src/scripts/main.js#L28-L57)

**Ciclo:** auto → dark → light → auto

- **auto:** Segue `prefers-color-scheme` del sistema
- **dark:** Forza tema scuro
- **light:** Forza tema chiaro

**Persistenza:** localStorage key = `theme`

### **Accent Picker**

File: [src/scripts/main.js](../src/scripts/main.js#L58-L75)

3 opzioni:

- **default:** Orange (HSL 16°, 95%, 58%)
- **violet:** HSL 322° (magenta)
- **green:** HSL 145° (verde)

**Implementazione:**

- Remove attribute: `body.removeAttribute('data-accent')` per default
- Set attribute: `body.setAttribute('data-accent', accent)` per altri
- Persist: localStorage key = `accent`

---

## 9. Riepilogo Struttura File

```
src/
├── styles/                          ← Stili CSS
│   ├── index.css                    ← Entry point degli stili
│   └── layers/                      ← Split per @layer (tokens, reset, base, layout, components, utilities, overrides)
├── components/                      ← Componenti HTML
│   ├── header.html                  ← Header con theme/accent picker
│   ├── footer.html                  ← Footer
│   └── pagination.html              ← Pagination
├── scripts/                         ← JavaScript
│   ├── main.js                      ← Theme switcher + accent picker
│   ├── lazy-images.js               ← Lazy loading immagini
│   └── search.js                    ← Ricerca
├── templates/                       ← Template HTML
│   ├── post.html                    ← Post article (sincronizza tema Giscus)
│   ├── home.html, archive.html, ...
└── layouts/
    └── base.html                    ← Layout principale
```

---

## 10. Tabella Riassuntiva: Colori per Tema

| Elemento             | Light                     | Dark                      |
| -------------------- | ------------------------- | ------------------------- |
| **Background**       | #f5efe6 (beige)           | #0f0e13 (nero profondo)   |
| **Text**             | #131117 (nero profondo)   | #f7f1eb (bianco caldo)    |
| **Text Muted**       | #625c67 (grigio)          | #b9aebd (grigio chiaro)   |
| **Surface**          | rgba(255,255,255,0.74)    | rgba(27,24,33,0.72)       |
| **Border**           | rgba(26,17,23,0.08)       | rgba(255,245,238,0.08)    |
| **Accent (default)** | HSL 16° 95% 58% (arancio) | HSL 16° 95% 58% (arancio) |
| **Accent Soft**      | HSL 16° 100% 92%          | HSL 16° 80% 18%           |
| **Shadow**           | rgba(32,20,9,0.12)        | rgba(0,0,0,0.28)          |

---

## 11. Guida Color Mixing

Il progetto usa `color-mix(in srgb, ...)` per creare varianti di colore:

```css
/* Feature card background */
color-mix(in srgb, var(--accent-soft) 64%, var(--surface-strong) 36%)

/* Tag background */
color-mix(in srgb, var(--accent-soft) 66%, var(--surface-strong) 34%)

/* Inline code background */
color-mix(in srgb, var(--accent-soft) 50%, var(--surface-strong) 50%)

/* Main nav link hover */
color-mix(in srgb, var(--accent) 14%, transparent)

/* Button hover */
color-mix(in srgb, var(--accent) 36%, var(--border))
```

Questo approccio mantiene la coerenza di colore attraverso i calcoli percentuali, non con hardcoding.

---

## 12. Note per Sviluppatori

✅ **Punti di forza:**

- Centralizzazione completa delle variabili CSS in `:root`
- Supporto nativo light/dark con `prefers-color-scheme`
- Sistema accent a 3 colori facilmente estensibile
- Typography scale fluid con clamp()
- Layer CSS per organizzazione gerarchica
- Persistence via localStorage

⚠️ **Considerazioni:**

- Pre code block ha colori hardcoded (#111014, #f5f2ee) — considerare la variabilizzazione se serve più flessibilità
- Copy button ha rgba hardcoded — potrebbe beneficiare da custom property
- Nessun SCSS — il progetto usa CSS puro per mantenere dipendenze minime (vanilla JS/CSS/HTML per il sito)
