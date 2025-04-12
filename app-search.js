const API_URL = 'https://graphql.anilist.co';

let currentPage = 1;
let isLoading = false;
let hasMoreResults = true;

function searchAnime(query, genres = [], page = 1, append = false) {
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
    search: query.trim() !== '' ? query : undefined,
    genre: genres.length > 0 ? genres : undefined,
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
      const media = data.data.Page.media;
      hasMoreResults = data.data.Page.pageInfo.hasNextPage;
      currentPage = data.data.Page.pageInfo.currentPage + 1;

      const filteredMedia = genres.length > 0
        ? media.filter(anime =>
            genres.every(g => anime.genres.includes(g))
          )
        : media;

      if (!filteredMedia.length && !append) {
        results.innerHTML = '<p class="col-span-full text-center text-gray-400">No results found.</p>';
        return;
      }

      const cardsHTML = filteredMedia.map(anime => {
        const title = anime.title?.romaji || 'Untitled';
        const image = anime.coverImage?.large || 'assets/fallback.jpg';
        return `
          <a href="anime.html?id=${anime.id}" class="bg-gray-100 dark:bg-[#222] rounded shadow hover:scale-105 transition transform duration-200 overflow-hidden" data-aos="fade-up">
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

function fetchGenres() {
  const query = `query { GenreCollection }`;

  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  })
    .then(res => res.json())
    .then(data => {
      const genreOptions = document.getElementById('genreOptions');
      if (!genreOptions) return;

      genreOptions.innerHTML = data.data.GenreCollection.map(genre => `
        <label class="flex items-center space-x-2 text-sm text-white">
          <input type="checkbox" value="${genre}" class="genre-checkbox" />
          <span>${genre}</span>
        </label>
      `).join('');
    })
    .catch(err => {
      console.error('Failed to load genres:', err);
    });
}

function setupThemeToggle() {
  const toggle = document.getElementById('toggleTheme');
  if (toggle) {
    toggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
  }

  const savedTheme = localStorage.getItem('theme');
  if (!savedTheme || savedTheme === 'dark') {
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

  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q') || '';
  let currentQuery = query;
  let selectedGenres = [];

  fetchGenres();

  const genreDropdownBtn = document.getElementById('genreDropdownBtn');
  const genreDropdown = document.getElementById('genreDropdown');

  if (genreDropdownBtn && genreDropdown) {
    genreDropdownBtn.addEventListener('click', () => {
      genreDropdown.classList.toggle('hidden');
    });

    document.addEventListener('click', (e) => {
      if (!genreDropdown.contains(e.target) && e.target !== genreDropdownBtn) {
        genreDropdown.classList.add('hidden');
      }
    });
  }

  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('genre-checkbox')) {
      selectedGenres = Array.from(document.querySelectorAll('.genre-checkbox:checked')).map(cb => cb.value);
      const selectedGenresText = selectedGenres.length > 0 ? selectedGenres.join(', ') : 'Select Genres';
      genreDropdownBtn.textContent = selectedGenresText;
      currentPage = 1;
      hasMoreResults = true;
      searchAnime(currentQuery, selectedGenres, 1, false);
    }
  });

  searchAnime(currentQuery, selectedGenres, 1, false);

  window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
      searchAnime(currentQuery, selectedGenres, currentPage, true);
    }
  });
});
