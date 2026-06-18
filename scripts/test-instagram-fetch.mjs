const username = 'borattisanatorio';

async function testWebProfile() {
  const response = await fetch(
    `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`,
    {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'X-IG-App-ID': '936619743392459',
        Accept: '*/*',
        Referer: 'https://www.instagram.com/',
      },
    }
  );
  console.log('web_profile status:', response.status);
  if (response.ok) {
    const data = await response.json();
    const count = data?.data?.user?.edge_owner_to_timeline_media?.edges?.length ?? 0;
    console.log('web_profile posts:', count);
  }
}

async function testHtmlScrape() {
  const response = await fetch(`https://www.instagram.com/${username}/`, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'es-AR,es;q=0.9',
    },
  });
  console.log('html status:', response.status);
  const html = await response.text();
  console.log('html length:', html.length);

  const shortcodes = [...html.matchAll(/"shortcode":"([A-Za-z0-9_-]+)"/g)].map((match) => match[1]);
  const uniqueShortcodes = [...new Set(shortcodes)];
  console.log('unique shortcodes:', uniqueShortcodes.slice(0, 8));

  const displayUrls = [...html.matchAll(/"display_url":"([^"]+)"/g)].map((match) =>
    match[1].replace(/\\u0026/g, '&').replace(/\\\//g, '/')
  );
  console.log('display urls:', displayUrls.slice(0, 3));
}

await testWebProfile();
await testHtmlScrape();
