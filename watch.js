const urlParams = new URLSearchParams(window.location.search);
const anilistId = parseInt(urlParams.get('id'));
const type = urlParams.get('type') || 'sub';
const selectedEp = parseInt(urlParams.get('ep') || 0);
const jsonURL = 'https://raw.githubusercontent.com/animeneek/AnimeNeek/main/animeneek.json';

const titleEl = document.getElementById('animeTitle');
const videoPlayer = document.getElementById('videoPlayer');
const posterImage = document.getElementById('posterImage');
const videoContainer = document.getElementById('videoContainer');
const episodeSelect = document.getElementById('episodeSelect');
const playButton = document.getElementById('playButton');
const sourceButtons = document.getElementById('sourceButtons');

let currentAnimeData = null;
let selectedEpisodeData = null;

async function loadNav() {
  const navHtml = await fetch('nav.html').then(res => res.text());
  document.getElementById('nav-placeholder').innerHTML = navHtml;

  const searchBox = document.getElementById('searchBox');
  if (searchBox) {
    searchBox.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        window.location.href = `search.html?q=${searchBox.value}`;
      }
    });
  }

  document.getElementById('toggleTheme')?.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
  });
}

async function getMalIdFromAnilist(anilistId) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        idMal
        title {
          romaji
          english
        }
        coverImage {
          large
        }
      }
    }
  `;
  const variables = { id: anilistId };
  const response = await fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });

  const data = await response.json();
  const media = data.data.Media;
  const title = media.title.english || media.title.romaji;
  titleEl.textContent = `Watch ${title} [${type.toUpperCase()}]${selectedEp ? ' - Episode ' + selectedEp : ''}`;
  posterImage.src = media.coverImage.large;
  return media.idMal;
}

function generateEmbedUrls(data) {
  const urls = [];
  if (data['data-src'] === 'anime') {
    urls.push(`//s3taku.one/watch?play=${data['data-video-id']}`);
    urls.push(`//s3taku.one/watch?play=${data['data-video-id']}&sv=1`);
  } else if (data['data-src'] === 'streamtape') {
    urls.push(`//streamtape.com/e/${data['data-video-id']}`);
  } else if (data['data-src'] === 'mp4upload') {
    urls.push(`//mp4upload.com/v/${data['data-video-id']}`);
  }
  return urls;
}

function updateSources(urls) {
  sourceButtons.innerHTML = '';
  urls.forEach((url, i) => {
    const btn = document.createElement('button');
    btn.textContent = `Source ${i + 1}`;
    btn.className = 'bg-primary text-white px-3 py-1 rounded shadow hover:bg-blue-700';
    btn.addEventListener('click', () => {
      videoPlayer.src = url;
    });
    sourceButtons.appendChild(btn);
  });
  sourceButtons.classList.remove('hidden');
}

function showVideo(embedUrl) {
  posterImage.classList.add('hidden');
  videoPlayer.classList.remove('hidden');
  videoPlayer.src = embedUrl;
}

async function init() {
  await loadNav();
  const malId = await getMalIdFromAnilist(anilistId);

  const jsonData = await fetch(jsonURL).then(res => res.json());
  currentAnimeData = jsonData.find(entry => entry['data-mal-id'] === malId);

  if (!currentAnimeData) return;

  const episodes = currentAnimeData.episodes.filter(e => e['data-ep-lan'].toLowerCase() === type.toLowerCase());

  episodes.forEach(ep => {
    const option = document.createElement('option');
    option.value = ep['data-ep-num'];
    option.textContent = `Episode ${ep['data-ep-num']}`;
    episodeSelect.appendChild(option);
  });

  episodeSelect.addEventListener('change', () => {
    const selectedVal = episodeSelect.value;
    if (!selectedVal) {
      playButton.disabled = true;
      playButton.classList.add('bg-gray-400', 'cursor-not-allowed');
      playButton.classList.remove('bg-blue-600', 'hover:bg-blue-700');
      return;
    }

    playButton.disabled = false;
    playButton.classList.remove('bg-gray-400', 'cursor-not-allowed');
    playButton.classList.add('bg-blue-600', 'hover:bg-blue-700');
  });

  playButton.addEventListener('click', () => {
    const epNum = parseInt(episodeSelect.value);
    if (!epNum) return;

    const epData = episodes.find(e => e['data-ep-num'] === epNum);
    if (!epData) return;

    selectedEpisodeData = epData;

    const embedUrls = generateEmbedUrls(epData);
    updateSources(embedUrls);
    showVideo(embedUrls[0]);

    const newUrl = `${window.location.pathname}?id=${anilistId}&type=${type}&ep=${epNum}`;
    window.history.replaceState(null, '', newUrl);
    titleEl.textContent += ` - Episode ${epNum}`;
    episodeSelect.value = epNum;
  });

  if (selectedEp) {
    episodeSelect.value = selectedEp;
    playButton.click();
  }
}

document.addEventListener('DOMContentLoaded', init);
