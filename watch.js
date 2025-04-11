const API_URL = 'https://graphql.anilist.co';
const JSON_URL = 'https://raw.githubusercontent.com/animeneek/anineek/main/animeneek.json';

const animeTitle = document.getElementById('animeTitle');
const episodeSelect = document.getElementById('episodeSelect');
const playButton = document.getElementById('playButton');
const videoPlayer = document.getElementById('videoPlayer');
const sourceButtons = document.getElementById('sourceButtons');

// Load nav
fetch("nav.html")
  .then(res => res.text())
  .then(nav => {
    document.getElementById("nav-placeholder").innerHTML = nav;
    setupThemeToggle();
    setupSearchHandler();
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
  }
}

function setupSearchHandler() {
  const searchBox = document.getElementById('searchBox');
  if (searchBox) {
    searchBox.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        window.location.href = `search.html?q=${searchBox.value}`;
      }
    });
  }
}

// Fetch AniList → MAL ID mapping
async function getMalId(anilistId) {
  const query = `
    query ($id: Int) {
      Media(id: $id) {
        id
        title { romaji }
        idMal
      }
    }
  `;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { id: anilistId } })
  });
  const data = await res.json();
  const media = data.data?.Media;
  if (!media) throw new Error('Anime not found');
  animeTitle.textContent = `${media.title.romaji} [${type.toUpperCase()}]`;
  return media.idMal;
}

// Get episode list from JSON
async function getEpisodes(malId, langType) {
  const res = await fetch(JSON_URL);
  const json = await res.json();
  const entry = json.find(item => item['data-mal-id'] === malId);
  if (!entry) return [];

  const episodes = entry.episodes
    .filter(ep => ep['data-ep-lan'].toLowerCase() === langType.toLowerCase())
    .sort((a, b) => a['data-ep-num'] - b['data-ep-num']);

  const unique = new Map();
  episodes.forEach(ep => {
    unique.set(ep['data-ep-num'], ep); // dedupe by episode number
  });

  return Array.from(unique.values());
}

function generateSources(ep) {
  const sources = [];
  const id = ep['data-video-id'];
  const src = ep['data-src'];
  if (src === 'anime') {
    sources.push(`https://s3taku.one/watch?play=${id}`);
    sources.push(`https://s3taku.one/watch?play=${id}&sv=1`);
  } else if (src === 'streamtape') {
    sources.push(`https://streamtape.com/e/${id}`);
  } else if (src === 'mp4upload') {
    sources.push(`https://mp4upload.com/v/${id}`);
  }
  return sources;
}

function populateSources(sources) {
  sourceButtons.innerHTML = '';
  sources.forEach((src, i) => {
    const btn = document.createElement('button');
    btn.textContent = `Source ${i + 1}`;
    btn.className = 'bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition';
    btn.onclick = () => videoPlayer.src = src;
    sourceButtons.appendChild(btn);
  });
}

function populateDropdown(episodes) {
  episodeSelect.innerHTML = '<option value="">Select Episode</option>';
  episodes.forEach(ep => {
    const option = document.createElement('option');
    option.value = ep['data-ep-num'];
    option.textContent = `Episode ${ep['data-ep-num']}`;
    episodeSelect.appendChild(option);
  });
  playButton.disabled = episodes.length === 0;
}

const urlParams = new URLSearchParams(window.location.search);
const anilistId = parseInt(urlParams.get('id'));
const type = urlParams.get('type') || 'sub';

let allEpisodes = [];

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const malId = await getMalId(anilistId);
    allEpisodes = await getEpisodes(malId, type);
    populateDropdown(allEpisodes);
  } catch (e) {
    animeTitle.textContent = 'Anime Not Found';
    console.error(e);
  }
});

playButton.addEventListener('click', () => {
  const epNum = parseInt(episodeSelect.value);
  const selected = allEpisodes.find(ep => ep['data-ep-num'] === epNum);
  if (!selected) return;
  const sources = generateSources(selected);
  videoPlayer.src = sources[0] || '';
  populateSources(sources);
});
