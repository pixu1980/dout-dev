#!/usr/bin/env node

/**
 * Color Reference - dout.dev
 *
 * This file can be used as a reference for color definitions
 * Run with: node docs/COLOR_REFERENCE.js (shows visual output)
 */

const colors = {
  accents: {
    default: {
      name: 'Orange Default',
      hsl: 'hsl(16 95% 58%)',
      hex: '#ff6b3d (approx)',
      hslaValues: { h: 16, s: 95, l: 58 },
      usage: ['Primary buttons', 'Links', 'Highlights', 'Accents'],
      cssVar: '--accent',
      application: 'root + body (default)',
    },
    violet: {
      name: 'Violet',
      hsl: 'hsl(322 72% 62%)',
      hex: '#d14b9e (approx)',
      hslaValues: { h: 322, s: 72, l: 62 },
      usage: ['Alternative accent', 'Special highlights'],
      cssVar: 'body[data-accent="violet"]',
      application: 'body attribute',
    },
    green: {
      name: 'Green',
      hsl: 'hsl(145 64% 48%)',
      hex: '#22b84b (approx)',
      hslaValues: { h: 145, s: 64, l: 48 },
      usage: ['Alternative accent', 'Special highlights'],
      cssVar: 'body[data-accent="green"]',
      application: 'body attribute',
    },
  },

  lightTheme: {
    bg: {
      name: 'Background',
      value: '#f5efe6',
      hsl: 'hsl(39 30% 94%)',
      rgba: 'N/A',
      usage: ['Page background', 'Primary surface'],
    },
    bgElevated: {
      name: 'Background Elevated',
      value: 'rgba(255, 250, 244, 0.82)',
      hsl: 'N/A',
      rgba: '[255, 250, 244, 0.82]',
      usage: ['Elevated panels', 'Modals'],
    },
    text: {
      name: 'Text Primary',
      value: '#131117',
      hsl: 'hsl(283 15% 7%)',
      rgba: 'N/A',
      usage: ['Body text', 'Headlines', 'Default foreground'],
    },
    textMuted: {
      name: 'Text Muted',
      value: '#625c67',
      hsl: 'hsl(283 7% 41%)',
      rgba: 'N/A',
      usage: ['Secondary text', 'Dates', 'Metadata'],
    },
    surface: {
      name: 'Surface',
      value: 'rgba(255, 255, 255, 0.74)',
      hsl: 'N/A',
      rgba: '[255, 255, 255, 0.74]',
      usage: ['Card backgrounds', 'Panel backgrounds'],
    },
    surfaceStrong: {
      name: 'Surface Strong',
      value: 'rgba(255, 255, 255, 0.92)',
      hsl: 'N/A',
      rgba: '[255, 255, 255, 0.92]',
      usage: ['Strong surface', 'Buttons', 'Form elements'],
    },
    surfaceMuted: {
      name: 'Surface Muted',
      value: 'rgba(246, 238, 229, 0.82)',
      hsl: 'N/A',
      rgba: '[246, 238, 229, 0.82]',
      usage: ['Muted backgrounds', 'Faded surfaces'],
    },
    border: {
      name: 'Border',
      value: 'rgba(26, 17, 23, 0.08)',
      hsl: 'N/A',
      rgba: '[26, 17, 23, 0.08]',
      usage: ['Borders', 'Dividers', 'Subtle lines'],
    },
    accentSoft: {
      name: 'Accent Soft',
      value: 'hsl(16 100% 92%)',
      hsl: 'hsl(16 100% 92%)',
      rgba: 'N/A (light orange background)',
      usage: ['Soft highlights', 'Tags', 'Feature cards'],
    },
  },

  darkTheme: {
    bg: {
      name: 'Background',
      value: '#0f0e13',
      hsl: 'hsl(283 13% 6%)',
      rgba: 'N/A',
      usage: ['Page background', 'Primary surface'],
    },
    bgElevated: {
      name: 'Background Elevated',
      value: 'rgba(19, 17, 24, 0.84)',
      hsl: 'N/A',
      rgba: '[19, 17, 24, 0.84]',
      usage: ['Elevated panels', 'Modals'],
    },
    text: {
      name: 'Text Primary',
      value: '#f7f1eb',
      hsl: 'hsl(39 48% 96%)',
      rgba: 'N/A',
      usage: ['Body text', 'Headlines', 'Default foreground'],
    },
    textMuted: {
      name: 'Text Muted',
      value: '#b9aebd',
      hsl: 'hsl(283 10% 72%)',
      rgba: 'N/A',
      usage: ['Secondary text', 'Dates', 'Metadata'],
    },
    surface: {
      name: 'Surface',
      value: 'rgba(27, 24, 33, 0.72)',
      hsl: 'N/A',
      rgba: '[27, 24, 33, 0.72]',
      usage: ['Card backgrounds', 'Panel backgrounds'],
    },
    surfaceStrong: {
      name: 'Surface Strong',
      value: 'rgba(29, 25, 36, 0.92)',
      hsl: 'N/A',
      rgba: '[29, 25, 36, 0.92]',
      usage: ['Strong surface', 'Buttons', 'Form elements'],
    },
    surfaceMuted: {
      name: 'Surface Muted',
      value: 'rgba(21, 19, 26, 0.88)',
      hsl: 'N/A',
      rgba: '[21, 19, 26, 0.88]',
      usage: ['Muted backgrounds', 'Faded surfaces'],
    },
    border: {
      name: 'Border',
      value: 'rgba(255, 245, 238, 0.08)',
      hsl: 'N/A',
      rgba: '[255, 245, 238, 0.08]',
      usage: ['Borders', 'Dividers', 'Subtle lines'],
    },
    accentSoft: {
      name: 'Accent Soft',
      value: 'hsl(16 80% 18%)',
      hsl: 'hsl(16 80% 18%)',
      rgba: 'N/A (dark orange background)',
      usage: ['Soft highlights', 'Tags', 'Feature cards'],
    },
  },

  gradients: {
    bodyBackground: {
      name: 'Body Background (Light)',
      code: `
radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 24%, transparent) 0, transparent 36%),
radial-gradient(circle at 90% 12%, rgba(255, 255, 255, 0.34) 0, transparent 24%),
linear-gradient(180deg, var(--bg) 0%, color-mix(in srgb, var(--bg) 86%, #ffffff 14%) 100%)
      `,
      location: 'src/styles/main.css:189-191',
      selector: 'body',
      description:
        '2 radial gradients + 1 linear vertical gradient. Creates depth with accent glow at top-left.',
    },
    featureCard: {
      name: 'Feature Card',
      code: `
linear-gradient(
  160deg,
  color-mix(in srgb, var(--accent-soft) 64%, var(--surface-strong) 36%) 0%,
  var(--surface-strong) 100%
)
      `,
      location: 'src/styles/main.css:622-626',
      selector: '.feature-card',
      description: 'Diagonal 160° gradient from soft accent to surface strong.',
    },
  },

  components: {
    buttonPrimary: {
      name: 'Button Primary',
      selector: '.button--primary',
      colors: {
        background: 'var(--accent)',
        color: '#0f0b0a (hardcoded)',
        shadow: 'var(--accent) 34% opacity shadow',
      },
      location: 'src/styles/main.css:609-612',
    },
    textLink: {
      name: 'Text Link',
      selector: '.text-link',
      colors: {
        color: 'var(--accent-strong)',
        after: '"->"',
      },
      location: 'src/styles/main.css:618-623',
    },
    tag: {
      name: 'Tag',
      selector: '.tag',
      colors: {
        background: 'color-mix(in srgb, var(--accent-soft) 66%, var(--surface-strong) 34%)',
        border: 'color-mix(in srgb, var(--accent) 28%, transparent)',
        color: 'var(--text)',
      },
      location: 'src/styles/main.css:742-751',
    },
    card: {
      name: 'Card (Post, Feature, Archive)',
      selector: '.post-card, .feature-card, .card',
      colors: {
        background: 'var(--surface)',
        border: 'var(--border)',
        boxShadow: 'var(--shadow)',
      },
      location: 'src/styles/main.css:280-290',
    },
    blockquote: {
      name: 'Blockquote',
      selector: '.prose blockquote',
      colors: {
        borderLeft: '3px solid var(--accent)',
        color: 'var(--text-muted)',
      },
      location: 'src/styles/main.css:841-844',
    },
  },

  hardcodedColors: {
    codeBlockBg: {
      value: '#111014',
      usage: 'Pre code block background (always dark)',
      location: 'src/styles/main.css:860-865',
      reason: 'Intentionally always dark for readability',
    },
    codeBlockText: {
      value: '#f5f2ee',
      usage: 'Pre code block text (always light)',
      location: 'src/styles/main.css:860-865',
      reason: 'Intentionally always light for readability',
    },
    buttonText: {
      value: '#0f0b0a',
      usage: 'Primary button text (always dark)',
      location: 'src/styles/main.css:609-612',
      reason: 'Ensures contrast on colored background',
    },
  },

  fontStack: {
    display: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif',
    sans: '"Avenir Next", "Segoe UI Variable Text", "Helvetica Neue", sans-serif',
    mono: '"IBM Plex Mono", "SFMono-Regular", "Cascadia Code", Consolas, monospace',
  },

  spacing: {
    spaces: [
      { name: '--space-1', value: '0.25rem', pixels: '4px' },
      { name: '--space-2', value: '0.5rem', pixels: '8px' },
      { name: '--space-3', value: '0.75rem', pixels: '12px' },
      { name: '--space-4', value: '1rem', pixels: '16px' },
      { name: '--space-5', value: '1.5rem', pixels: '24px' },
      { name: '--space-6', value: '2rem', pixels: '32px' },
      { name: '--space-7', value: '3rem', pixels: '48px' },
      { name: '--space-8', value: '4rem', pixels: '64px' },
      { name: '--space-9', value: '6rem', pixels: '96px' },
    ],
  },

  radius: {
    radiuses: [
      { name: '--radius-sm', value: '0.875rem', pixels: '14px' },
      { name: '--radius-md', value: '1.375rem', pixels: '22px' },
      { name: '--radius-lg', value: '2rem', pixels: '32px' },
      { name: '--radius-pill', value: '999px', description: 'Fully rounded' },
    ],
  },
};

// ============================================
// Display Functions (for console output)
// ============================================

function displayColors() {
  console.clear();
  console.log('\n🎨 DOUT.DEV COLOR REFERENCE\n');
  console.log('========================================\n');

  console.log('📌 ACCENTS (3 options)\n');
  Object.entries(colors.accents).forEach(([_key, accent]) => {
    console.log(`  ${accent.name}`);
    console.log(`    HSL: ${accent.hsl}`);
    console.log(`    CSS: ${accent.cssVar}`);
    console.log(`    Usage: ${accent.usage.join(', ')}\n`);
  });

  console.log('========================================\n');
  console.log('☀️  LIGHT THEME\n');
  Object.entries(colors.lightTheme).forEach(([_key, color]) => {
    console.log(`  ${color.name}`);
    console.log(`    Value: ${color.value}`);
    console.log(`    Usage: ${color.usage.join(', ')}\n`);
  });

  console.log('========================================\n');
  console.log('🌙 DARK THEME\n');
  Object.entries(colors.darkTheme).forEach(([_key, color]) => {
    console.log(`  ${color.name}`);
    console.log(`    Value: ${color.value}`);
    console.log(`    Usage: ${color.usage.join(', ')}\n`);
  });

  console.log('========================================\n');
  console.log('🌊 GRADIENTS\n');
  Object.entries(colors.gradients).forEach(([_key, gradient]) => {
    console.log(`  ${gradient.name}`);
    console.log(`    Selector: ${gradient.selector}`);
    console.log(`    Location: ${gradient.location}`);
    console.log(`    Description: ${gradient.description}\n`);
  });

  console.log('========================================\n');
  console.log('ℹ️  For more details, see:');
  console.log('   - COLOR_STYLES_MAP.md (complete reference)');
  console.log('   - COLOR_STYLES_QUICK_REFERENCE.md (quick links)');
  console.log('   - COLOR_PALETTE_VISUAL.html (visual preview)');
  console.log('\n');
}

// Export for use in other Node scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = colors;
}

// Run display if executed directly
if (require.main === module) {
  displayColors();
}
