const API_URL = 'https://graphql.anilist.co';

// ========== INDEX PAGE: TRENDING/POPULAR/TOP ANIME LOADER ==========

const tabButtons = document.querySelectorAll('.tab-btn');
const animeSection = document.getElementById('animeSection');

function loadAnime(type = 'TRENDING') {
  if (!animeSection) return;

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
            <div class="w-full aspect-[2/3] overflow-hidden">
              <img src="${image}" alt="${title}" class="w-full h-full object-cover" />
            </div>
            <div class="p-2 text-sm text-center font-semibold">${title}</div>
          </a>
        `;
      }).join('');
    });
}

// ========== SEARCH PAGE: ANIME SEARCH + GENRE FILTER + INFINITE SCROLL ==========

let currentPage = 1;
let isLoading = false;
let hasMoreResults = true;

function searchAnime(query = '', genres = [], page = 1, append = false) {
  if (isLoading || !hasMoreResults) return;
  isLoading = true;

  const gql = `
    query ($search: String, $genre: [String], $page: Int) {
      Page(page: $page, perPage: 30) {
        media(search: $search, genre_in: $genre, type: ANIME) {
          id
          title { romaji }
          coverImage { large }
          genres
        }
        pageInfo {
          currentPage
          hasNextPage
        }
      }
    }
  `;

  const variables = {
    search: query || undefined,
    genre: genres.length ? genres : undefined,
    page
  };

  const results = document.getElementById('results');
  if (!results) return;

  if (!append) {
    results.innerHTML = '<p class="col-span-full text-center text-gray-500">Loading...</p>';
  }

  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: gql, variables })
  })
    .then(res => res.json())
    .then(data => {
      let media = data.data.Page.media;
      hasMoreResults = data.data.Page.pageInfo.hasNextPage;
      currentPage = data.data.Page.pageInfo.currentPage + 1;

      if (!media?.length && !append) {
        results.innerHTML = '<p class="col-span-full text-center text-gray-400">No results found.</p>';
        return;
      }

      if (genres.length) {
        media = media.filter(anime => genres.every(g => anime.genres.includes(g)));
      }

      const cardsHTML = media.map(anime => {
        const title = anime.title?.romaji || 'Untitled';
        const image = anime.coverImage?.large || 'assets/fallback.jpg';
        return `
          <a href="anime.html?id=${anime.id}" class="bg-gray-100 dark:bg-gray-800 rounded shadow hover:scale-105 transition transform duration-200 overflow-hidden" data-aos="fade-up">
            <div class="w-full aspect-[2/3] overflow-hidden">
              <img src="${image}" alt="${title}" class="w-full h-full object-cover" />
            </div>
            <div class="p-2 text-sm text-center font-semibold">${title}</div>
          </a>
        `;
      }).join('');

      if (append) {
        results.insertAdjacentHTML('beforeend', cardsHTML);
      } else {
        results.innerHTML = cardsHTML;
      }
    })
    .catch(err => {
      console.error(err);
      results.innerHTML = '<p class="text-red-500 col-span-full">Failed to load results.</p>';
    })
    .finally(() => {
      isLoading = false;
    });
}

// ========== DYNAMIC GENRE FETCHER ==========

function fetchGenres() {
  const query = `query { GenreCollection }`;

  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  })
    .then(res => res.json())
    .then(data => {
      const genreSelect = document.getElementById('genre');
      if (!genreSelect) return;

      genreSelect.innerHTML = '';
      data.data.GenreCollection.forEach(genre => {
        const option = document.createElement('option');
        option.value = genre;
        option.textContent = genre;
        genreSelect.appendChild(option);
      });
    })
    .catch(err => {
      console.error('Failed to load genres:', err);
    });
}

// ========== SHARED FUNCTIONS ==========

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

// ========== DOM READY ==========

document.addEventListener('DOMContentLoaded', () => {
  const navPlaceholder = document.getElementById("nav-placeholder");
  if (navPlaceholder) {
    fetch("nav.html")
      .then(response => response.text())
      .then(navData => {
        navPlaceholder.innerHTML = navData;
        setupThemeToggle();
        setupSearchHandler();
      });
  } else {
    setupThemeToggle();
    setupSearchHandler();
  }

  if (tabButtons.length && animeSection) {
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
  }

  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q') || '';
  const genreSelect = document.getElementById('genre');

  let currentQuery = query;
  let selectedGenres = [];

  if (genreSelect) {
    fetchGenres();

    genreSelect.addEventListener('change', () => {
      selectedGenres = Array.from(genreSelect.selectedOptions).map(opt => opt.value);
      currentPage = 1;
      hasMoreResults = true;
      searchAnime(currentQuery, selectedGenres, 1, false);
    });
  }

  if (query || selectedGenres.length) {
    searchAnime(currentQuery, selectedGenres, 1, false);

    window.addEventListener('scroll', () => {
      if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
        searchAnime(currentQuery, selectedGenres, currentPage, true);
      }
    });
  }
});
