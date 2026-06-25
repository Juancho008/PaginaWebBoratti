import { INSTAGRAM_POST_URLS } from '../src/data/instagram-post-urls.js';
import { saveCachedPosts } from '../lib/instagram-client.js';

async function fetchPostFromOembed(permalink) {
  const response = await fetch(
    `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(permalink)}`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`oEmbed error ${response.status} for ${permalink}`);
  }

  const payload = await response.json();
  const shortcode = permalink.split('/p/')[1]?.replace('/', '') || permalink;
  const isVideo = payload.html?.includes('/reel/') || payload.html?.includes('video');

  return {
    id: shortcode,
    permalink,
    media_url: payload.thumbnail_url,
    thumbnail_url: payload.thumbnail_url,
    media_type: isVideo ? 'VIDEO' : 'IMAGE',
    caption: payload.title || '',
  };
}

const posts = [];

for (const url of INSTAGRAM_POST_URLS) {
  posts.push(await fetchPostFromOembed(url));
}

await saveCachedPosts(posts);
console.log(`Saved ${posts.length} posts to src/data/instagram-posts.json and src/data/instagram-posts.js`);
