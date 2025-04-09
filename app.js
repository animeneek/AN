// app.js
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
            <img src="${image}" alt="${title}" class="w-full h-52 object-cover" />
            <div class="p-2 text-sm text-center font-semibold">${title}</div>
          </a>
        `;
      }).join('');
    });
}

document.addEventListener('DOMContentLoaded', () => {
  loadAnime('TRENDING');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('bg-gray-200', 'dark:bg-gray-700'));
      btn.classList.add('bg-gray-200', 'dark:bg-gray-700');
      loadAnime(btn.dataset.type);
    });
  });

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

  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
});
