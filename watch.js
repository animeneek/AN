// watch.js

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const malId = parseInt(urlParams.get('id'));
  const type = urlParams.get('type') || 'sub';
  const epNum = parseInt(urlParams.get('ep')) || 1;

  const animeSection = document.getElementById('animeSection');
  const iframe = document.getElementById('videoIframe');
  const titleElement = document.getElementById('animeTitle');
  const episodeSelect = document.getElementById('episodeSelect');
  const playButton = document.getElementById('playButton');
  const sourceButtonsContainer = document.getElementById('sourceButtons');

  // Fetch MAL to AniList ID mapping
  const idMapping = await fetch('https://raw.githubusercontent.com/anime-and-manga/lists/main/anime.json')
    .then(res => res.json())
    .catch(() => []);

  const mapping = idMapping.find(entry => entry.idMal === malId);
  const anilistId = mapping ? mapping.idAL : null;

  // Fetch episode data
  const episodeData = await fetch('https://raw.githubusercontent.com/animeneek/AnimeNeek/main/animeneek.json')
    .then(res => res.json())
    .catch(() => []);

  const animeData = episodeData.find(entry => entry['data-mal-id'] === malId);
  if (!animeData) {
    titleElement.textContent = 'Anime not found';
    return;
  }

  // Update title
  titleElement.textContent = `Episode ${epNum}`;

  // Populate episode dropdown
  episodeSelect.innerHTML = '';
  animeData.episodes.forEach(ep => {
    if (ep['data-ep-lan'].toLowerCase() === type.toLowerCase()) {
      const option = document.createElement('option');
      option.value = ep['data-ep-num'];
      option.textContent = `Episode ${ep['data-ep-num']}`;
      if (ep['data-ep-num'] === epNum) option.selected = true;
      episodeSelect.appendChild(option);
    }
  });

  // Function to construct embed URLs
  const constructEmbedUrls = (src, videoId) => {
    switch (src) {
      case 'anime':
        return [
          `//s3taku.one/watch?play=${videoId}`,
          `//s3taku.one/watch?play=${videoId}&sv=1`
        ];
      case 'streamtape':
        return [`//streamtape.com/e/${videoId}`];
      case 'mp4upload':
        return [`//mp4upload.com/v/${videoId}`];
      default:
        return [];
    }
  };

  // Update iframe and source buttons
  const updateVideo = (selectedEpNum) => {
    const selectedEp = animeData.episodes.find(ep =>
      ep['data-ep-num'] === selectedEpNum && ep['data-ep-lan'].toLowerCase() === type.toLowerCase()
    );
    if (!selectedEp) return;

    const embedUrls = constructEmbedUrls(selectedEp['data-src'], selectedEp['data-video-id']);
    if (embedUrls.length > 0) {
      iframe.src = embedUrls[0];
      sourceButtonsContainer.innerHTML = '';
      embedUrls.forEach((url, index) => {
        const btn = document.createElement('button');
        btn.textContent = `Source ${index + 1}`;
        btn.addEventListener('click', () => {
          iframe.src = url;
        });
        sourceButtonsContainer.appendChild(btn);
      });
    }
  };

  // Initial video load
  updateVideo(epNum);

  // Play button event
  playButton.addEventListener('click', () => {
    const selectedEpNum = parseInt(episodeSelect.value);
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('ep', selectedEpNum);
    window.history.pushState({}, '', newUrl);
    updateVideo(selectedEpNum);
  });

  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
  });

  // Search functionality
  const searchInput = document.getElementById('searchInput');
  const searchButton = document.getElementById('searchButton');
  searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      window.location.href = `search.html?q=${encodeURIComponent(query)}`;
    }
  });
});
