addEventListener('DOMContentLoaded', () => {
  const metaColorScheme = document.querySelector('meta[name="color-scheme"]');
  const checkboxSchemeSwitcherLabel = document.querySelector('label[for="color-scheme-switcher"]');
  const checkboxSchemeSwitcher = document.querySelector('input[name="color-scheme-switcher"]');

  const lastColorScheme = localStorage.getItem('dude-color-scheme');
  lastColorScheme && metaColorScheme?.setAttribute('content', lastColorScheme);
  lastColorScheme === 'light dark' && (checkboxSchemeSwitcher.indeterminate = true);
  lastColorScheme === 'light' && (checkboxSchemeSwitcher.checked = true);

  checkboxSchemeSwitcherLabel?.addEventListener('click', (e) => {
    const states = [
      { indeterminate: false, checked: true },
      { indeterminate: false, checked: false },
      { indeterminate: true, checked: false }
    ];

    const nextStateIndex = (states.findIndex(
      state =>
        state.indeterminate === checkboxSchemeSwitcher.indeterminate && state.checked === checkboxSchemeSwitcher.checked
    ) + 1) % states.length;

    checkboxSchemeSwitcher.indeterminate = states[nextStateIndex].indeterminate;
    checkboxSchemeSwitcher.checked = states[nextStateIndex].checked;

    checkboxSchemeSwitcher.dispatchEvent(new Event('change'));

    e.preventDefault();
    return false;
  }, { capture: true });

  checkboxSchemeSwitcher?.addEventListener('change', (e) => {
    const colorScheme = checkboxSchemeSwitcher.indeterminate ? 'light dark' : checkboxSchemeSwitcher.checked ? 'light' : 'dark';
    metaColorScheme?.setAttribute('content', colorScheme);

    localStorage.setItem('dude-color-scheme', colorScheme)
  });
});
