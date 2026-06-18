import { fetchInstagramPosts, saveCachedPosts } from '../lib/instagram-client.js';
import { loadEnvFile } from './load-env.mjs';

loadEnvFile();

try {
  const posts = await fetchInstagramPosts();
  await saveCachedPosts(posts);
  console.log(`Saved ${posts.length} posts to src/data/instagram-posts.json`);
} catch (error) {
  console.error(error.message);
  console.error('Configurá INSTAGRAM_ACCESS_TOKEN e INSTAGRAM_USER_ID para la API oficial de Meta.');
  process.exit(1);
}
