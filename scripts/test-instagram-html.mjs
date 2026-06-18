const username = 'borattisanatorio';

const profileResponse = await fetch(`https://www.instagram.com/${username}/`, {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept-Language': 'es-AR,es;q=0.9,en;q=0.8',
  },
});

const setCookie = profileResponse.headers.getSetCookie?.() || [];
const cookieHeader = setCookie.map((entry) => entry.split(';')[0]).join('; ');
console.log('cookies', cookieHeader.slice(0, 120));

const apiResponse = await fetch(
  `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
  {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'X-IG-App-ID': '936619743392459',
      Accept: '*/*',
      Referer: `https://www.instagram.com/${username}/`,
      'X-Requested-With': 'XMLHttpRequest',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
  }
);

console.log('api status', apiResponse.status);
if (apiResponse.ok) {
  const data = await apiResponse.json();
  const edges = data?.data?.user?.edge_owner_to_timeline_media?.edges || [];
  console.log('posts', edges.length);
  if (edges[0]) {
    console.log('first', edges[0].node.shortcode, edges[0].node.display_url.slice(0, 80));
  }
} else {
  console.log('body', (await apiResponse.text()).slice(0, 200));
}
