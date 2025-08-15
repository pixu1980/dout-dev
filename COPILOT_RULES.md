# COPILOT RULES - dout-dev

## Template Engine Syntax Rules

**CRITICAL**: This project uses a CUSTOM template engine with specific syntax. NEVER use Liquid/Jekyll syntax `{% %}`.

### Correct Template Syntax:

**Conditionals:**
```html
<if condition="expression">
  <!-- content -->
</if>

<if condition="expression">
  <!-- content -->
<elseif condition="other_expression">
  <!-- content -->
<else>
  <!-- content -->
</if>
```

**Loops:**
```html
<for each="item in array">
  <!-- content using {{ item.property }} -->
</for>
```

**Includes/Partials:**
```html
<include src="path/to/template.html" data='{ "key": "value" }'>
```

**Template Inheritance:**
```html
<extends layout="layouts/base.html">

<block name="title">Page Title</block>
<block name="content">
  <!-- page content -->
</block>
```

**Variables/Assignment:**
```html
<assign variable="value">
```

### ❌ FORBIDDEN Syntax (Liquid/Jekyll):
- `{% if condition %}`
- `{% for item in array %}`
- `{% include 'template' %}`
- `{% extends 'layout' %}`
- `{% assign var = value %}`
- `{% endif %}`, `{% endfor %}`, etc.

### Code Style & Standards:

1. **No external runtime dependencies** - Keep runtime vanilla JS/CSS/HTML
2. **Accessibility first** - Templates must use semantic HTML and ARIA when appropriate
3. **WCAG 2.2 AAA compliance** - All templates must be accessible
4. **Use configured formatters** - Prettier for HTML/Markdown/JSON, Biome for JS/CSS
5. **Testing** - Add small Node-based tests for template engine changes in `cms/template-engine/tests`
6. **Single entrypoint** - Use `cms/template-engine/index.js` as public entrypoint

### Template Engine Implementation:
- Located in `cms/template-engine/`
- Keep component modules separate but re-export from main index
- Maintain single public entrypoint pattern

### Development Workflow:
1. Always follow these syntax rules when creating/editing templates
2. Test template changes before committing
3. Ensure CI builds and tests pass
4. Validate accessibility compliance

**Remember**: The GitHub Action CI will fail if Liquid/Jekyll syntax `{% %}` is detected in templates!
