# Documentazione Colori e Stili - dout-dev

## 📑 Indice della Documentazione

Questa documentazione fornisce una mappa completa della struttura dei colori, dei gradienti e degli stili del progetto dout.dev.

---

## 📚 File di Documentazione

### 1. **[COLOR_STYLES_MAP.md](COLOR_STYLES_MAP.md)** - Mappa Completa e Dettagliata

**Migliore per:** Ricerca approfondita, comprensione completa dell'architettura

**Contenuti:**

- ✅ Tutti i file SCSS/CSS in src/styles/ e scripts/
- ✅ Identificazione completa di colori, variabili CSS, custom properties
- ✅ Tutti i gradienti con posizione e codice esatto
- ✅ Struttura delle componenti con esempi di colori hardcoded e dinamici
- ✅ Sistema di tema light/dark e accenti (default, violet, green)
- ✅ Layout dettagliato dell'header con HTML e CSS
- ✅ 12 sezioni complete + tabelle riassuntive

**Sezioni:**

1. File SCSS/CSS
2. Variabili CSS in :root
3. Selettori di tema
4. Gradienti CSS
5. Sistemi di tema hardcoded
6. Componenti e colori
7. Header layout
8. Sistema di temi JavaScript
9. Tabella colori per tema
10. Guida color mixing
11. Note per sviluppatori
12. Appendici

**Link diretto:** [COLOR_STYLES_MAP.md](COLOR_STYLES_MAP.md)

---

### 2. **[COLOR_STYLES_QUICK_REFERENCE.md](COLOR_STYLES_QUICK_REFERENCE.md)** - Guida di Riferimento Veloce

**Migliore per:** Consultazione rapida durante lo sviluppo, link diretti

**Contenuti:**

- 📍 Link diretto ai file con numero di righe
- 🎨 Accessi rapidi ai colori per tema
- 🌊 Tabella gradienti con ubicazione
- 🧩 Mappa componenti → colori
- 🎛️ Sistema di tema JavaScript
- 🎯 Checklist per modifiche
- 📊 Tabella veloce variabili
- 🔗 Link diretti ai componenti colorati

**Link diretto:** [COLOR_STYLES_QUICK_REFERENCE.md](COLOR_STYLES_QUICK_REFERENCE.md)

---

### 3. **[COLOR_PALETTE_VISUAL.html](COLOR_PALETTE_VISUAL.html)** - Visualizzazione Interattiva

**Migliore per:** Visualizzazione dei colori, preview gradienti, sviluppatori visual

**Contenuti (in HTML interattivo):**

- 🎨 Swatches di tutti i colori principali
- 🌟 Accenti (orange/violet/green) con hover effects
- ☀️ Tema light completo
- 🌙 Tema dark completo
- 🌊 Anteprima gradienti in tempo reale
- 🧩 Componenti sample (button, tag, link)
- 📋 Tabelle di riferimento colori

**Come aprire:**

```bash
# Nel progetto, apri nel browser
open docs/COLOR_PALETTE_VISUAL.html

# Oppure utilizza il server VS Code:
# Tasto destro → "Open with Live Server"
```

**Link diretto:** [COLOR_PALETTE_VISUAL.html](COLOR_PALETTE_VISUAL.html)

---

## 🚀 Come Usare Questa Documentazione

### **Scenario 1: "Devo modificare il colore dei pulsanti"**

→ [COLOR_STYLES_QUICK_REFERENCE.md - Sezione Componenti](COLOR_STYLES_QUICK_REFERENCE.md#-componenti--colori)

### **Scenario 2: "Dove sono esattamente le variabili CSS di colore?"**

→ [COLOR_STYLES_MAP.md - Sezione 2 "Variabili CSS Definite in :root"](COLOR_STYLES_MAP.md#2-variabili-css-definite-in-root)

### **Scenario 3: "Come funziona il theme switcher?"**

→ [COLOR_STYLES_QUICK_REFERENCE.md - Sezione Sistema di Tema](COLOR_STYLES_QUICK_REFERENCE.md#-sistema-di-tema)

### **Scenario 4: "Voglio visualizzare tutti i colori"**

→ [COLOR_PALETTE_VISUAL.html](COLOR_PALETTE_VISUAL.html) ← Apri in browser

### **Scenario 5: "Devo aggiungere un nuovo accento colore"**

→ [COLOR_STYLES_MAP.md - Sezione 8 "Selettori di Tema"](COLOR_STYLES_MAP.md#3-selettori-di-tema)

---

## 🎯 Sommario Veloce dei Colori

### **Accenti** (3 opzioni)

| Nome             | HSL          | Uso                |
| ---------------- | ------------ | ------------------ |
| Default (Orange) | 16° 95% 58%  | Primary color      |
| Violet           | 322° 72% 62% | Accent alternativo |
| Green            | 145° 64% 48% | Accent alternativo |

### **Tema Light** (default)

| Elemento   | Colore                 |
| ---------- | ---------------------- |
| Background | #f5efe6 (beige)        |
| Text       | #131117 (nero scuro)   |
| Surface    | rgba(255,255,255,0.74) |

### **Tema Dark** (@media prefers-color-scheme: dark)

| Elemento   | Colore                  |
| ---------- | ----------------------- |
| Background | #0f0e13 (nero profondo) |
| Text       | #f7f1eb (bianco caldo)  |
| Surface    | rgba(27,24,33,0.72)     |

---

## 🔧 Punti di Ingresso Principali nel Codice

| File                                                        | Scopo                      | Riga                                |
| ----------------------------------------------------------- | -------------------------- | ----------------------------------- |
| [src/styles/index.css](../src/styles/index.css)               | Variabili CSS + Componenti | 1-110 (tokens), 189-191 (gradienti) |
| [src/components/header.html](../src/components/header.html) | Header layout              | 1-40                                |
| [src/scripts/main.js](../src/scripts/main.js)               | Theme/Accent logic         | 28-75                               |

---

## 📊 Statistiche Progetto

- **CSS Entry Point:** 1 (index.css)
- **CSS Layer Files:** 7
- **Custom Properties CSS:** 30+
- **Temi:** 2 (light + dark)
- **Accenti:** 3 (default, violet, green)
- **Gradienti:** 2 (body background + feature cards)
- **Componenti Colorate:** 10+
- **Hardcoded Colors:** 3 (pre code block, button text, copy button)

---

## ⚡ Azioni Comuni

### Aggiungere un nuovo accento

1. Modifica [src/styles/index.css](../src/styles/index.css#L101-L110) → aggiungi `body[data-accent='new'] { --accent-h: XXX; }`
2. Modifica [src/components/header.html](../src/components/header.html#L20-L22) → aggiungi nuovo button `.accent-dot`
3. Modifica [src/scripts/main.js](../src/scripts/main.js#L58-L75) → aggiungi opzione nel picker

### Modificare colore tema light

1. Apri [src/styles/index.css](../src/styles/index.css#L1-L50)
2. Modifica il colore desiderato in `:root`
3. Sincronizza con `@media (prefers-color-scheme: dark)` se necessario

### Cambiar gradiente body

1. Vai a [src/styles/index.css](../src/styles/index.css#L189-L191)
2. Modifica la `background:` nel selettore `body`

---

## 📝 Note Importanti

✅ **Best Practice:** Usa sempre custom properties `var(--*)` per i colori
✅ **Supporto Temi:** Definisci colori sia in light che in dark
✅ **Accenti:** Usa il sistema HSL per facilitare variazioni
⚠️ **Hardcoding:** Evita colori hardcoded; attualmente solo 3 eccezioni minori

---

## 🔗 Reference

- **CSS Custom Properties (MDN):** https://developer.mozilla.org/en-US/docs/Web/CSS/--*
- **Color Mixing (CSS spec):** https://www.w3.org/TR/css-color-5/#color-mix
- **prefers-color-scheme:** https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme
- **HSL Colors:** https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/hsl

---

## 📌 Ultimo Aggiornamento

- **Data:** Aprile 2026
- **Versione Progetto:** dout.dev (ramo principale)
- **Browser Support:** Tutte le versioni moderne (CSS Grid, CSS Custom Properties, color-mix)

---

## ❓ Domande Frequenti

**D: Come cambio tema da light a dark a runtime?**
A: Il JavaScript in [src/scripts/main.js](../src/scripts/main.js#L28-L57) gestisce questo. Guarda la funzione `initThemeSwitcher()` → imposta `document.documentElement.dataset.theme`.

**D: Come aggiungo un nuovo accento?**
A: Segui la sezione "Azioni Comuni" → "Aggiungere un nuovo accento" di questo file.

**D: Quali colori sono hardcoded?**
A: Solo 3:

- `#111014` e `#f5f2ee` nel pre code block
- `#0f0b0a` nel pulsante primario text

**D: Posso vedere l'anteprima di tutti i colori?**
A: Sì! Apri [COLOR_PALETTE_VISUAL.html](COLOR_PALETTE_VISUAL.html) nel browser.

**D: Come sincronizzare i commenti Giscus col tema?**
A: Vedi [src/scripts/main.js](../src/scripts/main.js#L8-L24) → funzione `syncGiscusTheme()`.

---

**Buona documentazione! 🚀**
