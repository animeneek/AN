// watch.js

document.addEventListener('DOMContentLoaded', () => {
  // Load navigation bar
  fetch('nav.html')
    .then(res => res.text())
    .then(data => {
      document.getElementById('nav-placeholder').innerHTML = data;
      // Attach search functionality
      const searchBox = document.getElementById('searchBox');
      if (searchBox) {
        searchBox.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            window.location.href = `search.html?q=${searchBox.value}`;
          }
        });
      }
    });

  const urlParams = new URLSearchParams(window.location.search);
  const anilistId = parseInt(urlParams.get('id'));
  const type = (urlParams.get('type') || 'sub').toLowerCase();
  const epNum = parseInt(urlParams.get('ep'));

  const videoPlayer = document.getElementById('videoPlayer');
  const animeTitleEl = document.getElementById('animeTitle');
  const sourceButtonsContainer = document.getElementById('sourceButtons');
  const episodeSelect = document.getElementById('episodeSelect');
  const playButton = document.getElementById('playButton');
  const posterOverlay = document.getElementById('posterOverlay');
  const posterImage = document.getElementById('posterImage');

  let episodeData = [];
  let currentTitle = '';
  let currentPoster = '';
  let malId = null;

  // Fetch MAL ID and anime details from Anilist
  fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `
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
      `,
      variables: { id: anilistId }
    })
  })
    .then(res => res.json())
    .then(data => {
      const media = data.data.Media;
      malId = media.idMal;
      currentTitle = media.title.english || media.title.romaji;
      currentPoster = media.coverImage.large;

      animeTitleEl.textContent = currentTitle + (epNum ? ` [${type.toUpperCase()}] - Episode ${epNum}` : ` [${type.toUpperCase()}]`);
      posterImage.src = currentPoster;

      // Fetch episode data from JSON
      return fetch('https://raw.githubusercontent.com/animeneek/AnimeNeek/main/animeneek.json');
    })
    .then(res => res.json())
    .then(json => {
      const animeEntry = json.find(entry => entry['data-mal-id'] === malId);
      if (!animeEntry) {
        animeTitleEl.textContent = 'No episodes found.';
        return;
      }

      episodeData = animeEntry.episodes.filter(ep => ep['data-ep-lan'].toLowerCase() === type);

      // Populate episode dropdown
      episodeSelect.innerHTML = '<option value="">Select Episode</option>';
      episodeData.forEach(ep => {
        const option = document.createElement('option');
        option.value = ep['data-ep-num'];
        option.textContent = `Episode ${ep['data-ep-num']}`;
        episodeSelect.appendChild(option);
      });

      // Set selected episode if epNum is present
      if (epNum) {
        episodeSelect.value = epNum;
        loadEpisode(epNum);
      }

      // Enable play button when an episode is selected
      episodeSelect.addEventListener('change', () => {
        playButton.disabled = !episodeSelect.value;
      });

      // Handle play button click
      playButton.addEventListener('click', () => {
        const selectedEp = parseInt(episodeSelect.value);
        if (!selectedEp) return;
        const newUrl = `watch.html?id=${anilistId}&type=${type}&ep=${selectedEp}`;
        history.pushState(null, '', newUrl);
        loadEpisode(selectedEp);
      });
    });

  function loadEpisode(epNumber) {
    const episode = episodeData.find(ep => ep['data-ep-num'] === epNumber);
    if (!episode) return;

    // Update title
    animeTitleEl.textContent = `${currentTitle} [${type.toUpperCase()}] - Episode ${epNumber}`;

    // Hide poster overlay
    posterOverlay.style.display = 'none';

    // Determine embed URLs based on data-src
    const videoId = episode['data-video-id'];
    const dataSrc = episode['data-src'];
    let sources = [];

    if (dataSrc === 'anime') {
      sources = [
        `https://s3taku.one/watch?play=${videoId}`,
        `https://s3taku.one/watch?play=${videoId}&sv=1`
      ];
    } else if (dataSrc === 'streamtape') {
      sources = [`https://streamtape.com/e/${videoId}`];
    } else if (dataSrc === 'mp4upload') {
      sources = [`https://mp4upload.com/v/${videoId}`];
    }

    // Set default video source
    videoPlayer.src = sources[0];

    // Create source buttons
    sourceButtonsContainer.innerHTML = '';
    sources.forEach((src, index) => {
      const btn = document.createElement('button');
      btn.textContent = `Source ${index + 1}`;
      btn.className = 'px-3 py-1 rounded bg-gray-300 dark:bg-gray-700 text-sm mr-2';
      btn.addEventListener('click', () => {
        videoPlayer.src = src;
      });
      sourceButtonsContainer.appendChild(btn);
    });
  }
});
