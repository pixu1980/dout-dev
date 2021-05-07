export default (head) => {
  head.meta.push({
    name: 'apple-mobile-web-app-title',
    content: 'dout.dev'
  });

  head.meta.push({
    name: 'application-name',
    content: 'dout.dev'
  });

  head.meta.push({
    name: 'msapplication-TileColor',
    content: '#1c8682'
  });

  head.meta.push({
    name: 'theme-color',
    content: '#1c8682'
  });

  head.meta.push({
    name: 'mobile-web-app-capable',
    content: 'yes'
  });

  head.link.push({
    rel: 'apple-touch-icon',
    sizes: '180x180',
    href: '/apple-touch-icon.png?v=1'
  });

  head.link.push({
    rel: 'icon',
    type: 'image/png',
    sizes: '32x32',
    href: '/favicon-32x32.png?v=1'
  });

  head.link.push({
    rel: 'icon',
    type: 'image/png',
    sizes: '192x192',
    href: '/android-chrome-192x192.png?v=1'
  });

  head.link.push({
    rel: 'icon',
    type: 'image/png',
    sizes: '16x16',
    href: '/favicon-16x16.png?v=1'
  });

  head.link.push({
    rel: 'manifest',
    href: '/site.webmanifest?v=1'
  });

  head.link.push({
    rel: 'mask-icon',
    href: '/safari-pinned-tab.svg?v=1',
    color: '#1c8682'
  });

  head.link.push({
    rel: 'shortcut icon',
    href: '/favicon.ico?v=1'
  });
}
