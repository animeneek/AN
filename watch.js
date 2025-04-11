const urlParams = new URLSearchParams(window.location.search);
const anilistId = parseInt(urlParams.get('id'));
const type = (urlParams.get('type') || 'sub').toLowerCase();

const videoPlayer = document.getElementById('videoPlayer');
const episodeDropdown = document.getElementById('episodeDropdown');
const playBtn = document.getElementById('playButton');
const sourceContainer = document.getElementById('sourceButtons');
const episodeListContainer = document.getElementById('episodeList');
const episodeTitle = document.getElementById('animeTitle');

let currentEpisode = null;
let episodes = [];

async function fetchMalId(anilistId) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
        title {
          english
          romaji
        }
      }
    }
  `;
  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables: { id: anilistId } }),
  });
  const data = await response.json();
  return {
    malId: data.data.Media.idMal,
    title: data.data.Media.title.english || data.data.Media.title.romaji,
  };
}

function getSources(ep) {
  if (ep['data-src'] === 'anime') {
    return [
      `https://s3taku.one/watch?play=${ep['data-video-id']}`,
      `https://s3taku.one/watch?play=${ep['data-video-id']}&sv=1`,
    ];
  } else if (ep['data-src'] === 'streamtape') {
    return [`https://streamtape.com/e/${ep['data-video-id']}`];
  } else if (ep['data-src'] === 'mp4upload') {
    return [`https://mp4upload.com/v/${ep['data-video-id']}`];
  }
  return [];
}

function renderSources(ep) {
  sourceContainer.innerHTML = '';
  const sources = getSources(ep);
  sources.forEach((src, idx) => {
    const btn = document.createElement('button');
    btn.textContent = `Source ${idx + 1}`;
    btn.className = 'bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-1 rounded mr-2 mb-2';
    btn.onclick = () => {
      videoPlayer.src = src;
    };
    sourceContainer.appendChild(btn);
  });
}

function renderDropdown(episodes) {
  episodeDropdown.innerHTML = '';
  episodes.forEach(ep => {
    const option = document.createElement('option');
    option.value = ep['data-ep-num'];
    option.textContent = `Episode ${ep['data-ep-num']}`;
    episodeDropdown.appendChild(option);
  });
}

function setVideo(ep, title) {
  const sources = getSources(ep);
  videoPlayer.src = sources[0];
  episodeTitle.textContent = `${title} - Episode ${ep['data-ep-num']} - ${ep['data-ep-lan']}`;
  renderSources(ep);
  currentEpisode = ep;
}

async function init() {
  const { malId, title } = await fetchMalId(anilistId);
  const response = await fetch('https://raw.githubusercontent.com/animeneek/AnimeNeek/main/animeneek.json');
  const data = await response.json();
  const animeEntry = data.find(entry => entry['data-mal-id'] === malId);

  if (!animeEntry) {
    episodeTitle.textContent = `No data found for MAL ID: ${malId}`;
    return;
  }

  episodes = animeEntry.episodes.filter(ep => ep['data-ep-lan'].toLowerCase() === type);
  if (!episodes.length) {
    episodeTitle.textContent = `No ${type.toUpperCase()} episodes available.`;
    return;
  }

  renderDropdown(episodes);
  setVideo(episodes[0], title);

  playBtn.addEventListener('click', () => {
    const selectedEpNum = parseInt(episodeDropdown.value);
    const ep = episodes.find(e => e['data-ep-num'] === selectedEpNum);
    if (ep) {
      setVideo(ep, title);
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
