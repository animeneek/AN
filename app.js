const API_URL = 'https://graphql.anilist.co';
const tabButtons = document.querySelectorAll('.tab-btn');
const animeSection = document.getElementById('animeSection');
const heroContent = document.getElementById('heroContent');

// Load featured anime into hero
function loadHeroSlider() {
  const query = `
    query {
      Page(perPage: 1) {
        media(type: ANIME, sort: TRENDING_DESC) {
          id
          title { romaji }
          coverImage { extraLarge }
          bannerImage
          description(asHtml: false)
          genres
        }
      }
    }
  `;

  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  })
    .then(res => res.json())
    .then(data => {
      const anime = data.data.Page.media[0];
      const bgImage = anime.bannerImage || anime.coverImage.extraLarge;
      const genres = anime.genres?.slice(0, 3).join(', ') || '';
      const title = anime.title.romaji || 'Untitled';
      const description = anime.description || 'No description.';

      heroContent.innerHTML = `
        <div class="absolute inset-0">
          <img src="${bgImage}" alt="${title}" class="w-full h-full object-cover object-center" />
        </div>
        <div class="absolute inset-0 bg-black bg-opacity-50 flex flex-col justify-end p-6 md:p-12">
          <h1 class="text-3xl md:text-5xl font-bold text-white mb-3">${title}</h1>
          <p class="text-sm text-white mb-2 italic">${genres}</p>
          <p class="text-white text-sm max-w-3xl line-clamp-none">${description}</p>
        </div>
      `;
    });
}

function loadAnime(type = 'TRENDING') {
  animeSection.innerHTML = '<p class="col-span-full text-center text-gray-400">Loading...</p>';

  const query = `
    query ($type: MediaType, $sort: [MediaSort]) {
      Page(perPage: 30) {
        media(type: $type, sort: $sort) {
          id
          title { romaji }
          coverImage { extraLarge }
        }
      }
    }
  `;

  const variables = {
    type: 'ANIME',
    sort: type === 'POPULAR' ? ['POPULARITY_DESC'] :
          type === 'TOP' ? ['SCORE_DESC'] :
          ['TRENDING_DESC']
  };

  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  })
    .then(res => res.json())
    .then(data => {
      animeSection.innerHTML = data.data.Page.media.map(anime => {
        const title = anime.title?.romaji || 'Untitled';
        const image = anime.coverImage?.extraLarge || 'assets/fallback.jpg';
        return `
          <a href="anime.html?id=${anime.id}" class="bg-gray-100 dark:bg-gray-800 rounded shadow hover:scale-105 transition overflow-hidden" data-aos="fade-up">
            <img src="${image}" alt="${title}" class="w-full h-90 object-cover" />
            <div class="p-2 text-sm text-center font-semibold">${title}</div>
          </a>
        `;
      }).join('');
    });
}

document.addEventListener('DOMContentLoaded', () => {
  fetch("nav.html")
    .then(response => response.text())
    .then(navData => {
      document.getElementById("nav-placeholder").innerHTML = navData;
      setupThemeToggle();
      setupSearchHandler();
    });

  loadHeroSlider();
  loadAnime('TRENDING');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => {
        b.classList.remove('bg-[#ff4444]', 'text-white');
        b.classList.add('bg-transparent', 'text-black', 'dark:text-white');
      });

      btn.classList.remove('bg-transparent', 'text-black', 'dark:text-white');
      btn.classList.add('bg-[#ff4444]', 'text-white');

      loadAnime(btn.dataset.type);
    });
  });
});

function setupThemeToggle() {
  const toggle = document.getElementById('toggleTheme');
  if (toggle) {
    toggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
  }

  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

function setupSearchHandler() {
  const searchBox = document.getElementById('searchBox');
  if (searchBox) {
    searchBox.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        window.location.href = `search.html?q=${searchBox.value}`;
      }
    });
  }
}
