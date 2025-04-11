const API_URL = 'https://graphql.anilist.co';
const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get('id');
const episodeDataURL = 'https://raw.githubusercontent.com/animeneek/AnimeNeek/main/animeneek.json';

async function fetchAnimeDetails(id) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
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
              type
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

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables })
    });

    const { data } = await response.json();
    const anime = data.Media;
    const malId = anime.idMal;

    const availableLangs = await getAvailableLanguages(malId);

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
          ${createWatchButton(anime.id, 'sub', availableLangs)}
          ${createWatchButton(anime.id, 'dub', availableLangs)}
          ${createWatchButton(anime.id, 'raw', availableLangs)}
        </div>
      </div>
    `;

    const related = anime.relations.edges.filter(rel => rel.node.type === 'ANIME');
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

  } catch (error) {
    console.error('Error fetching anime:', error);
  }
}

async function getAvailableLanguages(malId) {
  try {
    const res = await fetch(episodeDataURL);
    const data = await res.json();

    const animeEntry = data.find(entry => entry["data-mal-id"] === malId);
    if (!animeEntry) return [];

    const langs = new Set();
    animeEntry.episodes.forEach(ep => {
      const lang = ep["data-ep-lan"]?.toLowerCase();
      if (lang === "sub" || lang === "dub" || lang === "raw") {
        langs.add(lang);
      }
    });

    return Array.from(langs);
  } catch (e) {
    console.error('Error fetching episode data:', e);
    return [];
  }
}

function createWatchButton(animeId, type, availableLangs) {
  const langMap = {
    sub: { color: 'blue', label: 'Sub' },
    dub: { color: 'green', label: 'Dub' },
    raw: { color: 'red', label: 'Raw' }
  };

  const isAvailable = availableLangs.includes(type);
  return `<a href="${isAvailable ? `watch.html?id=${animeId}&type=${type}` : '#'}" 
    class="px-4 py-2 rounded text-white bg-${langMap[type].color}-${isAvailable ? '500' : '300'} 
    ${isAvailable ? `hover:bg-${langMap[type].color}-600` : 'cursor-not-allowed'} pointer-events-${isAvailable ? 'auto' : 'none'}">
    Watch ${langMap[type].label}
  </a>`;
}

function loadNav() {
  fetch("nav.html")
    .then(response => response.text())
    .then(navData => {
      document.getElementById("nav-placeholder").innerHTML = navData;
      setupThemeToggle();
      setupSearchHandler();
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

document.addEventListener('DOMContentLoaded', () => {
  loadNav();
  if (animeId) fetchAnimeDetails(animeId);
});
