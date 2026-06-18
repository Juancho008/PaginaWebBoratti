import { getInstagramFeed, INSTAGRAM_USERNAME } from '../lib/instagram-client.js';

export default async function handler(_req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  const { posts, source, error } = await getInstagramFeed();

  res.status(200).json({
    username: INSTAGRAM_USERNAME,
    posts,
    source,
    ...(error ? { error } : {}),
  });
}
