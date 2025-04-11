// watch.js

const urlParams = new URLSearchParams(window.location.search);
const anilistId = parseInt(urlParams.get('id'));
const type = (urlParams.get('type') || 'sub').toLowerCase();
const selectedEpisode = parseInt(urlParams.get('ep'));

const player = document.getElementById('videoPlayer');
const animeTitleElement = document.getElementById('animeTitle');
const sourceButtonsContainer = document.getElementById('sourceButtons');
const episodeSelect = document.getElementById('episodeSelect');
const playButton = document.getElementById('playEpisode');

let malId = null;
let embedData = null;
let animeTitle = '';
let currentEpisodeData = null;

// Helper to capitalize
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Generate embed links based on source
function getEmbedLinks(source, videoId) {
  if (source === "anime") {
    return [
      `https://s3taku.one/watch?play=${videoId}`,
      `https://s3taku.one/watch?play=${videoId}&sv=1`
    ];
  } else if (source === "streamtape") {
    return [`https://streamtape.com/e/${videoId}`];
  } else if (source === "mp4upload") {
    return [`https://mp4upload.com/v/${videoId}`];
  }
  return [];
}

// Update iframe and source buttons
function updatePlayer(episodeData) {
  sourceButtonsContainer.innerHTML = '';
  currentEpisodeData = episodeData;

  const links = getEmbedLinks(episodeData['data-src'], episodeData['data-video-id']);
  if (links.length > 0) {
    player.src = links[0]; // Default to first source
  }

  links.forEach((link, index) => {
    const btn = document.createElement('button');
    btn.textContent = `Source ${index + 1}`;
    btn.className = 'source-btn px-3 py-1 bg-gray-800 text-white rounded-lg mx-1 hover:bg-gray-600';
    btn.addEventListener('click', () => {
      player.src = link;
    });
    sourceButtonsContainer.appendChild(btn);
  });
}

// Fetch MyAnimeList ID using AniList ID
function fetchMalId() {
  return fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
        query ($id: Int) {
          Media(id: $id, type: ANIME) {
            title {
              romaji
              english
            }
            idMal
          }
        }
      `,
      variables: { id: anilistId }
    })
  })
    .then(res => res.json())
    .then(data => {
      malId = data.data.Media.idMal;
      animeTitle = data.data.Media.title.english || data.data.Media.title.romaji;
    });
}

// Load episode data from JSON
function fetchEpisodeData() {
  return fetch('https://raw.githubusercontent.com/animeneek/anineek/main/animeneek.json')
    .then(res => res.json())
    .then(data => {
      const match = data.find(anime => anime['data-mal-id'] === malId);
      embedData = match ? match.episodes : [];
    });
}

// Populate dropdown and set selected value if exists
function populateEpisodeDropdown() {
  episodeSelect.innerHTML = '';

  const filteredEpisodes = embedData.filter(ep => ep['data-ep-lan'].toLowerCase() === type);
  filteredEpisodes.forEach(ep => {
    const option = document.createElement('option');
    option.value = ep['data-ep-num'];
    option.textContent = `Episode ${ep['data-ep-num']}`;
    if (ep['data-ep-num'] === selectedEpisode) {
      option.selected = true;
    }
    episodeSelect.appendChild(option);
  });

  // Show episode if one is selected
  if (selectedEpisode) {
    const episodeToPlay = filteredEpisodes.find(ep => ep['data-ep-num'] === selectedEpisode);
    if (episodeToPlay) {
      updatePlayer(episodeToPlay);
      animeTitleElement.textContent = `${animeTitle} [${type.toUpperCase()}] - Episode ${selectedEpisode}`;
    }
  } else {
    animeTitleElement.textContent = `${animeTitle} [${type.toUpperCase()}]`;
    player.src = ""; // Show default poster or keep iframe blank
  }
}

// Handle Play button
playButton.addEventListener('click', () => {
  const epNum = parseInt(episodeSelect.value);
  if (epNum) {
    window.location.href = `watch.html?id=${anilistId}&type=${type}&ep=${epNum}`;
  }
});

// Search input behavior
document.getElementById('searchBox').addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    window.location.href = `search.html?q=${e.target.value}`;
  }
});

// Main execution
document.addEventListener('DOMContentLoaded', async () => {
  await fetchMalId();
  await fetchEpisodeData();
  populateEpisodeDropdown();
});
