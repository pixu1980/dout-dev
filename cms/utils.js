const slugify = (s) => s.toLowerCase()
  .trim()
  .replace(/[^\w\s-]/g, '')
  .replace(/[\s_-]+/g, '-')
  .replace(/^-+|-+$/g, '');

const dateToMonthLabel = (d) => d.toLocaleDateString('en-US', {
  month: 'long',
  year: 'numeric'
});

const dateToMonthKey = (d) => d.toLocaleDateString('fr-CA', {
  year: 'numeric',
  month: '2-digit',
});

const dateToFilterFormat = (d) => d.toLocaleDateString('fr-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

module.exports = {
  slugify,
  dateToMonthLabel,
  dateToMonthKey,
  dateToFilterFormat
}

