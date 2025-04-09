// anime.js

const API_URL = 'https://graphql.anilist.co';
const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get('id');

// Function to fetch the anime details
function fetchAnimeDetails(id) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        title {
          romaji
          english
        }
        coverImage {
          extraLarge
        }
        description(asHtml: false)
        genres
        episodes
        format
        status
        relations {
          edges {
            relationType
            node {
              id
              title {
                romaji
              }
              coverImage {
                large
              }
            }
          }
        }
      }
    }
  `;

  const variables = { id: parseInt(id) };

  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  })
    .then(res => res.json())
    .then(({ data }) => {
      const anime = data.Media;

      // Anime Info Section
      document.getElementById('animeDetails').innerHTML = `
        <img src="${anime.coverImage.extraLarge}" alt="${anime.title.romaji}" class="rounded shadow max-w-full">
        <div class="md:col-span-2">
          <h1 class="text-3xl font-bold mb-2">${anime.title.english || anime.title.romaji}</h1>
          <p class="text-sm mb-4">${anime.description || 'No description available.'}</p>
          <p><strong>Genres:</strong> ${anime.genres.join(', ')}</p>
          <p><strong>Format:</strong> ${anime.format}</p>
          <p><strong>Status:</strong> ${anime.status}</p>
          <p><strong>Episodes:</strong> ${anime.episodes || 'Unknown'}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <a href="watch.html?id=${anime.id}&type=sub" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Watch Sub</a>
            <a href="watch.html?id=${anime.id}&type=dub" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Watch Dub</a>
            <a href="watch.html?id=${anime.id}&type=raw" class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded">Watch Raw</a>
          </div>
        </div>
      `;

      // Related Anime Section
      const related = anime.relations.edges;
      if (related.length > 0) {
        document.getElementById('relatedAnime').innerHTML = related.map(rel => `
          <a href="anime.html?id=${rel.node.id}" class="bg-gray-200 dark:bg-gray-700 rounded overflow-hidden shadow hover:scale-105 transition">
            <img src="${rel.node.coverImage.large}" alt="${rel.node.title.romaji}" class="w-full h-40 object-cover">
            <div class="p-2 text-sm text-center">${rel.node.title.romaji}</div>
          </a>
        `).join('');
      } else {
        document.getElementById('relatedAnime').innerHTML = `<p class="text-sm text-gray-400">No related anime found.</p>`;
      }
    });
}

// Function to load nav.html into the page
function loadNav() {
  fetch("nav.html")
    .then(response => response.text())
    .then(navData => {
      document.getElementById("nav-placeholder").innerHTML = navData;
      setupThemeToggle();
      setupSearchHandler();
    });
}

// Set up theme toggle functionality
function setupThemeToggle() {
  const toggle = document.getElementById('toggleTheme');
  if (toggle) {
    toggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
  }

  // Set theme on first load
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Set up search functionality
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

// Wait until the page content is loaded
document.addEventListener('DOMContentLoaded', () => {
  // Load navigation bar first
  loadNav();

  // Once nav is loaded, fetch and display anime details
  if (animeId) {
    fetchAnimeDetails(animeId);
  }
});
