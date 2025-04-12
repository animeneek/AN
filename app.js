const API_URL = 'https://graphql.anilist.co';

const tabButtons = document.querySelectorAll('.tab-btn');
const animeSection = document.getElementById('animeSection');

function loadAnime(type = 'TRENDING') {
  animeSection.innerHTML = '<p class="col-span-full text-center text-gray-400">Loading...</p>';

  const query = `
    query ($type: MediaType, $sort: [MediaSort]) {
      Page(perPage: 30) {
        media(type: $type, sort: $sort) {
          id
          title { romaji }
          coverImage { large }
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
        const image = anime.coverImage?.large || 'assets/fallback.jpg';
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

  loadAnime('TRENDING');
  loadHeroSlider();

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

// Hero Anime Slider
function loadHeroSlider() {
  const heroWrapper = document.getElementById('heroSwiperWrapper');

  const query = `
    query {
      Page(perPage: 5) {
        media(type: ANIME, sort: [POPULARITY_DESC]) {
          title { romaji }
          coverImage { extraLarge }
          genres
          description(asHtml: false)
          averageScore
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
      const animeList = data.data.Page.media;

      heroWrapper.innerHTML = animeList.map(anime => `
        <div class="swiper-slide relative">
          <img src="${anime.coverImage.extraLarge}" alt="${anime.title.romaji}" class="absolute inset-0 w-full h-full object-cover" />
        </div>
      `).join('');

      const titleEl = document.getElementById('sliderTitle');
      const genresEl = document.getElementById('sliderGenres');
      const infoEl = document.getElementById('sliderInfo');

      const swiper = new Swiper(".mySwiper", {
        loop: true,
        effect: 'fade',
        autoplay: {
          delay: 4000,
          disableOnInteraction: false,
        },
        fadeEffect: {
          crossFade: true
        },
        on: {
          slideChangeTransitionStart: function () {
            const idx = swiper.realIndex;
            const anime = animeList[idx];
            titleEl.textContent = anime.title.romaji;
            genresEl.textContent = anime.genres.slice(0, 3).join(', ');
            infoEl.textContent = `Score: ${anime.averageScore} — ${anime.description?.replace(/<[^>]*>?/gm, '').slice(0, 150)}...`;
          }
        }
      });

      // Set first slide info initially
      const firstAnime = animeList[0];
      titleEl.textContent = firstAnime.title.romaji;
      genresEl.textContent = firstAnime.genres.slice(0, 3).join(', ');
      infoEl.textContent = `Score: ${firstAnime.averageScore} — ${firstAnime.description?.replace(/<[^>]*>?/gm, '').slice(0, 150)}...`;
    });
}
