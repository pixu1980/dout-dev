export function normalizeVirtualPath(pathValue) {
  const input = String(pathValue || '');
  if (!input) return '/';

  const isAbsolute = input.startsWith('/');
  const segments = input.split('/');
  const normalized = [];

  for (const segment of segments) {
    if (!segment || segment === '.') {
      continue;
    }

    if (segment === '..') {
      if (normalized.length > 0 && normalized[normalized.length - 1] !== '..') {
        normalized.pop();
      } else if (!isAbsolute) {
        normalized.push('..');
      }
      continue;
    }

    normalized.push(segment);
  }

  const joined = `${isAbsolute ? '/' : ''}${normalized.join('/')}`;
  return joined || (isAbsolute ? '/' : '.');
}

export function dirnameVirtualPath(filePath) {
  const normalized = normalizeVirtualPath(filePath);
  if (normalized === '/' || normalized === '.') {
    return '/';
  }

  const parts = normalized.split('/');
  parts.pop();
  const joined = parts.join('/');
  return joined || '/';
}

export function resolveVirtualPath(currentDir = '/', sourcePath = '') {
  const target = String(sourcePath || '');
  if (!target) return normalizeVirtualPath(currentDir);

  if (/^[a-z]+:\/\//i.test(target)) {
    return target;
  }

  if (target.startsWith('/')) {
    return normalizeVirtualPath(target);
  }

  return normalizeVirtualPath(
    `${currentDir || '/'}${currentDir?.endsWith('/') ? '' : '/'}${target}`
  );
}
