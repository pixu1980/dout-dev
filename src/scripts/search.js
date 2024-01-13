window.addEventListener('DOMContentLoaded', () => {
  const search = document.querySelector('[list="autocomplete-data"]');

  search.addEventListener('change', (e) => {
    window.location.href = e.currentTarget.value;
  });
});
