const urlParams = new URLSearchParams(window.location.search);
const anilistId = urlParams.get('id');
const type = (urlParams.get('type') || 'sub').toLowerCase();
const selectedEpisode = parseInt(urlParams.get('ep'), 10);

const API_URL = 'https://graphql.anilist.co';
const JSON_URL = 'https://raw.githubusercontent.com/animeneek/anineek/main/animeneek.json';

const animeTitleEl = document.getElementById('animeTitle');
const player = document.getElementById('videoPlayer');
const sourceButtons = document.getElementById('sourceButtons');
const episodeSelect = document.getElementById('episodeSelect');
const playButton = document.getElementById('playButton');

let episodeList = [];
let selectedEpData = null;

async function getMalId(anilistId) {
  const query = `
    query ($id: Int) {
      Media(id: $id) {
        title { romaji }
        idMal
      }
    }
  `;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { id: parseInt(anilistId) } })
  });

  const data = await res.json();
  const title = data.data.Media.title.romaji;
  const malId = data.data.Media.idMal;
  animeTitleEl.textContent = `Watch ${title} [${type.toUpperCase()}]${selectedEpisode ? ` - Episode ${selectedEpisode}` : ''}`;
  return malId;
}

function generateEmbedLinks(ep) {
  const { 'data-video-id': vid, 'data-src': src } = ep;
  let links = [];

  if (src === 'anime') {
    links.push(`https://s3taku.one/watch?play=${vid}`);
    links.push(`https://s3taku.one/watch?play=${vid}&sv=1`);
  } else if (src === 'streamtape') {
    links.push(`https://streamtape.com/e/${vid}`);
  } else if (src === 'mp4upload') {
    links.push(`https://mp4upload.com/v/${vid}`);
  }

  return links;
}

function populateEpisodes(episodes) {
  episodeList = episodes;
  episodeSelect.innerHTML = `<option value="">Select Episode</option>`;
  episodes.forEach(ep => {
    const option = document.createElement('option');
    option.value = ep['data-ep-num'];
    option.textContent = `Episode ${ep['data-ep-num']}`;
    episodeSelect.appendChild(option);
  });

  if (selectedEpisode) {
    episodeSelect.value = selectedEpisode;
    playButton.disabled = false;
    loadEpisode(selectedEpisode);
  }
}

function loadEpisode(epNum) {
  const ep = episodeList.find(e => parseInt(e['data-ep-num']) === parseInt(epNum));
  if (!ep) return;

  selectedEpData = ep;
  const embedLinks = generateEmbedLinks(ep);

  player.src = embedLinks[0];
  player.classList.remove('hidden');

  // Populate sources
  sourceButtons.innerHTML = '';
  embedLinks.forEach((link, idx) => {
    const btn = document.createElement('button');
    btn.textContent = `Source ${idx + 1}`;
    btn.className = 'px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-sm font-semibold hover:bg-gray-300 dark:hover:bg-gray-600';
    btn.onclick = () => {
      player.src = link;
    };
    sourceButtons.appendChild(btn);
  });
  sourceButtons.classList.remove('hidden');
}

playButton.addEventListener('click', () => {
  const epNum = parseInt(episodeSelect.value);
  if (epNum) {
    const queryParams = new URLSearchParams({ id: anilistId, type, ep: epNum });
    window.location.href = `watch.html?${queryParams.toString()}`;
  }
});

episodeSelect.addEventListener('change', () => {
  playButton.disabled = !episodeSelect.value;
});

document.addEventListener('DOMContentLoaded', async () => {
  // Load nav
  fetch("nav.html")
    .then(res => res.text())
    .then(nav => document.getElementById('nav-placeholder').innerHTML = nav);

  try {
    const malId = await getMalId(anilistId);
    const jsonData = await fetch(JSON_URL).then(res => res.json());
    const animeEntry = jsonData.find(entry => entry['data-mal-id'] === malId);
    if (!animeEntry) {
      animeTitleEl.textContent += ' (No episodes found)';
      return;
    }

    const filteredEpisodes = animeEntry.episodes.filter(ep => ep['data-ep-lan'].toLowerCase() === type);
    populateEpisodes(filteredEpisodes);
  } catch (err) {
    console.error(err);
    animeTitleEl.textContent = 'Failed to load data.';
  }
});
