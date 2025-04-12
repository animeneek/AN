// search.js
const API_URL = 'https://graphql.anilist.co';

function searchAnime(query, genre = '') {
  const gql = `
    query ($search: String, $genre: String) {
      Page(perPage: 30) {
        media(search: $search, genre_in: $genre, type: ANIME) {
          id
          title { romaji }
          coverImage { large }
        }
      }
    }
  `;

  const variables = {
    search: query,
    genre: genre ? [genre] : null
  };

  const results = document.getElementById('results');
  results.innerHTML = '<p class="col-span-full text-center text-gray-500">Loading...</p>';

  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: gql, variables })
  })
    .then(res => res.json())
    .then(data => {
      if (!data?.data?.Page?.media?.length) {
        results.innerHTML = '<p class="col-span-full text-center text-gray-400">No results found.</p>';
        return;
      }

      results.innerHTML = data.data.Page.media.map(anime => {
        const title = anime.title?.romaji || 'Untitled';
        const image = anime.coverImage?.large || 'assets/fallback.jpg';
        return `
          <a href="anime.html?id=${anime.id}" class="bg-gray-100 dark:bg-[#222] rounded shadow hover:scale-105 transition transform duration-200 overflow-hidden" data-aos="fade-up">
            <img src="${image}" alt="${title}" class="w-full h-52 object-cover" />
            <div class="p-2 text-sm text-center font-semibold">${title}</div>
          </a>
        `;
      }).join('');
    })
    .catch(err => {
      console.error(err);
      results.innerHTML = '<p class="text-red-500 col-span-full">Failed to load results.</p>';
    });
}

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q') || '';

  const genreSelect = document.getElementById('genre');
  genreSelect.addEventListener('change', () => {
    searchAnime(query, genreSelect.value);
  });

  searchAnime(query);

  const searchBox = document.getElementById('searchBox');
  searchBox.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      window.location.href = `search.html?q=${searchBox.value}`;
    }
  });

  // Theme toggle
  const toggle = document.getElementById('toggleTheme');
  toggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  });

  // Load theme from localStorage
  if (localStorage.getItem('theme') === 'dark') {
  const savedTheme = localStorage.getItem('theme');
  if (!savedTheme || savedTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

});
