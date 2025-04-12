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
    query ($search: String, $genre: [String], $tag: [String], $page: Int) {
      Page(page: $page, perPage: 30) {
        media(search: $search, genre_in: $genre, tag_in: $tag, type: ANIME) {
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
    genre: genres.length > 0 ? genres : undefined,
    tag: tags.length > 0 ? tags : undefined,
    page
  };

  const results = document.getElementById('results');
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
        (tags.length === 0 || tags.every(t => anime.tags.some(tag => tag.name === t)))
      );

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

function fetchGenresAndTags() {
  const query = `query {
    GenreCollection
    MediaTagCollection {
      name
      isGeneralSpoiler
      isMediaSpoiler
      isAdult
    }
  }`;

  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  })
    .then(res => res.json())
    .then(data => {
      const genreOptions = document.getElementById('genreOptions');
      const tagOptions = document.getElementById('tagOptions');

      genreOptions.innerHTML = data.data.GenreCollection.map(genre => `
        <label class="flex items-center space-x-2 text-sm text-white">
          <input type="checkbox" value="${genre}" class="genre-checkbox" />
          <span>${genre}</span>
        </label>
      `).join('');

      const tags = data.data.MediaTagCollection
        .filter(tag => !tag.isAdult && !tag.isGeneralSpoiler && !tag.isMediaSpoiler);

      tagOptions.innerHTML = tags.map(tag => `
        <label class="flex items-center space-x-2 text-sm text-white">
          <input type="checkbox" value="${tag.name}" class="tag-checkbox" />
          <span>${tag.name}</span>
        </label>
      `).join('');
    })
    .catch(err => {
      console.error('Failed to load genres and tags:', err);
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
        window.location.href = `search.html?q=${encodeURIComponent(searchBox.value)}`;
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
  currentQuery = urlParams.get('q') || '';

  fetchGenresAndTags();

  const genreDropdownBtn = document.getElementById('genreDropdownBtn');
  const genreDropdown = document.getElementById('genreDropdown');
  genreDropdownBtn.addEventListener('click', () => genreDropdown.classList.toggle('hidden'));
  document.addEventListener('click', e => {
    if (!genreDropdown.contains(e.target) && e.target !== genreDropdownBtn) genreDropdown.classList.add('hidden');
  });

  const tagDropdownBtn = document.getElementById('tagDropdownBtn');
  const tagDropdown = document.getElementById('tagDropdown');
  tagDropdownBtn.addEventListener('click', () => tagDropdown.classList.toggle('hidden'));
  document.addEventListener('click', e => {
    if (!tagDropdown.contains(e.target) && e.target !== tagDropdownBtn) tagDropdown.classList.add('hidden');
  });

  document.addEventListener('change', e => {
    if (e.target.classList.contains('genre-checkbox') || e.target.classList.contains('tag-checkbox')) {
      selectedGenres = Array.from(document.querySelectorAll('.genre-checkbox:checked')).map(cb => cb.value);
      selectedTags = Array.from(document.querySelectorAll('.tag-checkbox:checked')).map(cb => cb.value);
      genreDropdownBtn.textContent = selectedGenres.length ? selectedGenres.join(', ') : 'Select Genres';
      tagDropdownBtn.textContent = selectedTags.length ? selectedTags.join(', ') : 'Select Tags';
      currentPage = 1;
      hasMoreResults = true;
      searchAnime(currentQuery, selectedGenres, selectedTags, 1, false);
    }
  });

  searchAnime(currentQuery, selectedGenres, selectedTags, 1, false);

  window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight - 200) {
      searchAnime(currentQuery, selectedGenres, selectedTags, currentPage, true);
    }
  });
});
