import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const rootDir = join(__dirname, '..');
export const cachePath = join(rootDir, 'src', 'data', 'instagram-posts.json');
export const INSTAGRAM_USERNAME = 'borattisanatorio';
const IG_APP_ID = '936619743392459';

export function normalizePosts(items) {
  return items.map((item) => ({
    id: item.id,
    permalink: item.permalink,
    media_url: item.media_url || item.thumbnail_url,
    thumbnail_url: item.thumbnail_url || item.media_url,
    media_type: item.media_type || 'IMAGE',
    caption: item.caption || '',
  }));
}

export async function loadCachedPosts() {
  try {
    const raw = await readFile(cachePath, 'utf8');
    const payload = JSON.parse(raw);
    return Array.isArray(payload.posts) ? normalizePosts(payload.posts) : [];
  } catch {
    return [];
  }
}

export async function saveCachedPosts(posts) {
  const payload = {
    username: INSTAGRAM_USERNAME,
    updatedAt: new Date().toISOString(),
    posts: normalizePosts(posts),
  };

  await mkdir(dirname(cachePath), { recursive: true });
  await writeFile(cachePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  return payload;
}

async function fetchFromGraphApi(token, userId) {
  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_type}';
  const url = `https://graph.instagram.com/v21.0/${userId}/media?fields=${fields}&limit=24&access_token=${token}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Graph API error: ${response.status}`);
  }

  const payload = await response.json();
  return normalizePosts(payload.data || []);
}

async function fetchFromWebProfile(username) {
  const profileResponse = await fetch(`https://www.instagram.com/${username}/`, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'es-AR,es;q=0.9',
    },
  });

  const cookies = profileResponse.headers.getSetCookie?.() || [];
  const cookieHeader = cookies.map((entry) => entry.split(';')[0]).join('; ');

  const response = await fetch(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'X-IG-App-ID': IG_APP_ID,
        Accept: '*/*',
        Referer: `https://www.instagram.com/${username}/`,
        'X-Requested-With': 'XMLHttpRequest',
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
    }
  );

  if (response.status === 429) {
    throw new Error('Instagram limitó las consultas (429). Configurá INSTAGRAM_ACCESS_TOKEN o esperá unos minutos.');
  }

  if (!response.ok) {
    throw new Error(`Instagram web API error: ${response.status}`);
  }

  const payload = await response.json();
  const edges = payload?.data?.user?.edge_owner_to_timeline_media?.edges || [];

  return edges.map(({ node }) => ({
    id: node.id,
    permalink: `https://www.instagram.com/p/${node.shortcode}/`,
    media_url: node.display_url,
    thumbnail_url: node.thumbnail_src || node.display_url,
    media_type: node.is_video
      ? 'VIDEO'
      : node.__typename === 'GraphSidecar'
        ? 'CAROUSEL_ALBUM'
        : 'IMAGE',
    caption: '',
  }));
}

export async function fetchInstagramPosts() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = process.env.INSTAGRAM_USER_ID;

  if (token && userId) {
    return fetchFromGraphApi(token, userId);
  }

  return fetchFromWebProfile(INSTAGRAM_USERNAME);
}

export async function getInstagramFeed() {
  try {
    const posts = await fetchInstagramPosts();
    if (posts.length > 0) {
      await saveCachedPosts(posts);
    }
    return { posts, source: 'live', error: null };
  } catch (error) {
    const cachedPosts = await loadCachedPosts();
    if (cachedPosts.length > 0) {
      return { posts: cachedPosts, source: 'cache', error: error.message };
    }

    return { posts: [], source: 'none', error: error.message };
  }
}
