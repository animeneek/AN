<!-- Updated watch.js -->
const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get('id');
const type = urlParams.get('type') || 'sub';
const currentEpisode = parseInt(urlParams.get('episode')) || 1;

function getEmbedUrl(animeId, episode, type) {
  return `https://vidstreaming.io/load?id=${animeId}&episode=${episode}&type=${type}`;
}

function loadEpisode(animeId, episode, type) {
  const embedUrl = getEmbedUrl(animeId, episode, type);
  const player = document.getElementById('videoPlayer');
  player.src = embedUrl;
  highlightCurrentEpisode(episode);
  displayEpisodeInfo(episode);
}

function highlightCurrentEpisode(episode) {
  const items = document.querySelectorAll('#episodeList li');
  items.forEach(li => {
    li.classList.toggle('bg-primary text-white', parseInt(li.dataset.episode) === episode);
  });
}

function displayEpisodeInfo(episode) {
  const infoDiv = document.getElementById('episodeInfo');
  infoDiv.textContent = `Episode ${episode}: Description placeholder.`;
}

document.addEventListener('DOMContentLoaded', () => {
  loadEpisode(animeId, currentEpisode, type);

  fetch('https://graphql.anilist.co', {
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
            episodes
          }
        }
      `,
      variables: { id: parseInt(animeId) }
    })
  })
    .then(res => res.json())
    .then(data => {
      const title = data.data.Media.title.english || data.data.Media.title.romaji;
      const episodeCount = data.data.Media.episodes || 12;
      document.getElementById('animeTitle').textContent = `Watch ${title} [${type.toUpperCase()}]`;
      generateEpisodeList(animeId, episodeCount, type);
      generateSourceButtons(animeId, currentEpisode);
    });
});

function generateEpisodeList(animeId, episodeCount, type) {
  const episodeList = document.getElementById('episodeList');
  for (let i = 1; i <= episodeCount; i++) {
    const li = document.createElement('li');
    li.textContent = `Episode ${i}`;
    li.className = 'cursor-pointer px-3 py-2 rounded hover:bg-gray-200 dark:hover:bg-gray-800';
    li.dataset.episode = i;
    li.addEventListener('click', () => {
      window.location.href = `watch.html?id=${animeId}&type=${type}&episode=${i}`;
    });
    episodeList.appendChild(li);
  }
}

function generateSourceButtons(animeId, episode) {
  const container = document.getElementById('sourceButtons');
  ['sub', 'dub', 'raw'].forEach(lang => {
    const btn = document.createElement('button');
    btn.textContent = lang.toUpperCase();
    btn.className = `px-3 py-1 rounded border ${lang === type ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'} cursor-pointer`;
    btn.disabled = lang === type;
    btn.classList.toggle('opacity-50', lang === type);
    btn.addEventListener('click', () => {
      window.location.href = `watch.html?id=${animeId}&type=${lang}&episode=${episode}`;
    });
    container.appendChild(btn);
  });
}
