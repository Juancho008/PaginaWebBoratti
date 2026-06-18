(() => {
  const INSTAGRAM_USERNAME = 'borattisanatorio';
  const INSTAGRAM_PROFILE_URL = 'https://www.instagram.com/borattisanatorio/';
  const FEED_SOURCES = ['./data/instagram-posts.json', '/api/instagram-feed'];

  const carousel = document.getElementById('instagram-carousel');
  const track = document.getElementById('instagram-carousel-track');
  const prevButton = document.querySelector('.instagram-carousel__nav--prev');
  const nextButton = document.querySelector('.instagram-carousel__nav--next');

  if (!carousel || !track || !prevButton || !nextButton) return;

  let posts = [];
  let pageIndex = 0;
  let pageCount = 0;

  const getPostsPerPage = () => (window.matchMedia('(min-width: 768px)').matches ? 8 : 4);

  const getGridColumns = () => (window.matchMedia('(min-width: 768px)').matches ? 4 : 2);

  const chunkPosts = (items, size) => {
    const pages = [];

    for (let index = 0; index < items.length; index += size) {
      pages.push(items.slice(index, index + size));
    }

    return pages;
  };

  const getBadgeMarkup = (mediaType) => {
    if (mediaType === 'VIDEO') {
      return `
        <span class="instagram-post__badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z"></path>
          </svg>
        </span>
      `;
    }

    if (mediaType === 'CAROUSEL_ALBUM') {
      return `
        <span class="instagram-post__badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75">
            <rect x="4" y="4" width="16" height="16" rx="2"></rect>
            <rect x="7" y="7" width="16" height="16" rx="2"></rect>
          </svg>
        </span>
      `;
    }

    return '';
  };

  const renderSkeleton = () => {
    const count = getPostsPerPage();
    track.innerHTML = `
      <div class="instagram-carousel__page">
        ${Array.from({ length: count }, () => '<div class="instagram-post instagram-post--skeleton" aria-hidden="true"></div>').join('')}
      </div>
    `;
  };

  const renderEmpty = () => {
    track.innerHTML = `
      <div class="instagram-carousel__empty">
        <p>
          Seguinos en
          <a href="${INSTAGRAM_PROFILE_URL}" target="_blank" rel="noopener noreferrer">@${INSTAGRAM_USERNAME}</a>
          para ver las publicaciones.
        </p>
      </div>
    `;
    prevButton.hidden = true;
    nextButton.hidden = true;
  };

  const renderPages = () => {
    const postsPerPage = getPostsPerPage();
    const columns = getGridColumns();
    const pages = chunkPosts(posts, postsPerPage);
    pageCount = pages.length;
    pageIndex = Math.min(pageIndex, Math.max(pageCount - 1, 0));

    if (pageCount === 0) {
      renderEmpty();
      return;
    }

    track.innerHTML = pages
      .map((pagePosts) => {
        const cells = pagePosts
          .map((post) => {
            const imageUrl = post.thumbnail_url || post.media_url;
            const alt = post.caption ? post.caption.slice(0, 120) : 'Publicación de Instagram';

            return `
              <a
                class="instagram-post"
                href="${post.permalink}"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ver publicación en Instagram"
              >
                <img src="${imageUrl}" alt="${alt.replace(/"/g, '&quot;')}" loading="lazy" />
                ${getBadgeMarkup(post.media_type)}
              </a>
            `;
          })
          .join('');

        const placeholders = Array.from(
          { length: Math.max(postsPerPage - pagePosts.length, 0) },
          () => '<div class="instagram-post instagram-post--placeholder" aria-hidden="true"></div>'
        ).join('');

        return `
          <div class="instagram-carousel__page" style="--instagram-grid-cols: ${columns}">
            ${cells}${placeholders}
          </div>
        `;
      })
      .join('');

    updateCarousel();
  };

  const updateCarousel = () => {
    track.style.transform = `translateX(-${pageIndex * 100}%)`;
    prevButton.hidden = pageCount <= 1 || pageIndex === 0;
    nextButton.hidden = pageCount <= 1 || pageIndex >= pageCount - 1;
  };

  const showPage = (direction) => {
    pageIndex = Math.min(Math.max(pageIndex + direction, 0), Math.max(pageCount - 1, 0));
    updateCarousel();
  };

  const fetchFeed = async () => {
    for (const source of FEED_SOURCES) {
      try {
        const response = await fetch(source, { cache: 'no-store' });
        if (!response.ok) continue;

        const payload = await response.json();
        if (Array.isArray(payload.posts) && payload.posts.length > 0) {
          return payload.posts;
        }
      } catch {
        // Try next source.
      }
    }

    return [];
  };

  prevButton.addEventListener('click', () => showPage(-1));
  nextButton.addEventListener('click', () => showPage(1));

  let resizeTimer;
  window.addEventListener('resize', () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (posts.length > 0) renderPages();
    }, 150);
  });

  renderSkeleton();

  fetchFeed().then((items) => {
    posts = items;
    renderPages();
  });
})();
