import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lesson Tracker',
    short_name: 'Lessons',
    description: 'Трекінг уроків, учнів та оплат',
    start_url: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#6366f1',
    orientation: 'portrait-primary',
    lang: 'uk',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
