const API_URL = 'https://graphql.anilist.co';

let currentPage = 1;
let isLoading = false;
let hasMoreResults = true;
let currentQuery = '';
let selectedGenres = [];
let selectedTags = [];

function searchAnime(query, genres = [], tags = [], page = 1, append = false) {
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
          tags { name }
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
      const media = data.data.Page.media;
      hasMoreResults = data.data.Page.pageInfo.hasNextPage;
      currentPage = data.data.Page.pageInfo.currentPage + 1;

      const filteredMedia = media.filter(anime =>
        (genres.length === 0 || genres.every(g => anime.genres.includes(g))) &&
        (tags.length === 0 || tags.every(t => anime.tags.map(tag => tag.name).includes(t)))
      );

      if (!filteredMedia.length && !append) {
        results.innerHTML = '<p class="col-span-full text-center text-gray-400">No results found.</p>';
        return;
      }

      const cardsHTML = filteredMedia.map(anime => `
        <a href="anime.html?id=${anime.id}" class="bg-gray-100 dark:bg-[#222] rounded shadow hover:scale-105 transition transform duration-200 overflow-hidden" data-aos="fade-up">
          <div class="w-full aspect-[2/3] overflow-hidden">
            <img src="${anime.coverImage?.large || 'assets/fallback.jpg'}" alt="${anime.title.romaji}" class="w-full h-full object-cover" />
          </div>
          <div class="p-2 text-sm text-center font-semibold">${anime.title.romaji}</div>
        </a>
      `).join('');

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
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `query { GenreCollection }` })
  })
    .then(res => res.json())
    .then(data => {
      const genreOptions = document.getElementById('genreOptions');
      genreOptions.innerHTML = data.data.GenreCollection.map(genre => `
        <label class="flex items-center space-x-2 text-sm text-white">
          <input type="checkbox" value="${genre}" class="genre-checkbox" />
          <span>${genre}</span>
        </label>
      `).join('');
    });
}

function fetchTags() {
  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: `query { MediaTagCollection { name isAdult } }` })
  })
    .then(res => res.json())
    .then(data => {
      const tags = data.data.MediaTagCollection.filter(tag => !tag.isAdult);
      const tagOptions = document.getElementById('tagOptions');
      tagOptions.innerHTML = tags.map(tag => `
        <label class="flex items-center space-x-2 text-sm text-white">
          <input type="checkbox" value="${tag.name}" class="tag-checkbox" />
          <span>${tag.name}</span>
        </label>
      `).join('');
    });
}

function setupDropdowns() {
  const genreBtn = document.getElementById('genreDropdownBtn');
  const genreDropdown = document.getElementById('genreDropdown');
  const tagBtn = document.getElementById('tagDropdownBtn');
  const tagDropdown = document.getElementById('tagDropdown');

  genreBtn.addEventListener('click', () => genreDropdown.classList.toggle('hidden'));
  tagBtn.addEventListener('click', () => tagDropdown.classList.toggle('hidden'));

  document.addEventListener('click', (e) => {
    if (!genreDropdown.contains(e.target) && e.target !== genreBtn) genreDropdown.classList.add('hidden');
    if (!tagDropdown.contains(e.target) && e.target !== tagBtn) tagDropdown.classList.add('hidden');
  });
}

function setupFilters() {
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('genre-checkbox')) {
      selectedGenres = Array.from(document.querySelectorAll('.genre-checkbox:checked')).map(cb => cb.value);
      document.getElementById('genreDropdownBtn').textContent = selectedGenres.length ? selectedGenres.join(', ') : 'Select Genres';
    }
    if (e.target.classList.contains('tag-checkbox')) {
      selectedTags = Array.from(document.querySelectorAll('.tag-checkbox:checked')).map(cb => cb.value);
      document.getElementById('tagDropdownBtn').textContent = selectedTags.length ? selectedTags.join(', ') : 'Select Tags';
    }
    currentPage = 1;
    hasMoreResults = true;
    searchAnime(currentQuery, selectedGenres, selectedTags, 1, false);
  });
}

function setupSearchHandler() {
  const searchBox = document.getElementById('searchBox');
  if (searchBox) {
    searchBox.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        const newQuery = searchBox.value.trim();
        if (newQuery) {
          currentQuery = newQuery;
          currentPage = 1;
          hasMoreResults = true;
          searchAnime(currentQuery, selectedGenres, selectedTags, 1, false);
        }
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchGenres();
  fetchTags();
  setupDropdowns();
  setupFilters();
  setupSearchHandler();

  const navPlaceholder = document.getElementById("nav-placeholder");
  if (navPlaceholder) {
    fetch("nav.html")
      .then(res => res.text())
      .then(html => {
        navPlaceholder.innerHTML = html;
        setupSearchHandler();
      });
  }

  const params = new URLSearchParams(window.location.search);
  currentQuery = params.get('q') || '';
  searchAnime(currentQuery, selectedGenres, selectedTags, 1, false);

  window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
      searchAnime(currentQuery, selectedGenres, selectedTags, currentPage, true);
    }
  });
});
