// watch.js

document.addEventListener('DOMContentLoaded', () => {
  // Load nav
  fetch('nav.html')
    .then(res => res.text())
    .then(nav => {
      document.getElementById('nav-placeholder').innerHTML = nav;
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
  const selectedEp = parseInt(urlParams.get('ep'));

  const titleEl = document.getElementById('animeTitle');
  const posterImage = document.getElementById('posterImage');
  const posterOverlay = document.getElementById('posterOverlay');
  const episodeSelect = document.getElementById('episodeSelect');
  const playButton = document.getElementById('playButton');
  const videoPlayer = document.getElementById('videoPlayer');
  const sourceButtons = document.getElementById('sourceButtons');

  let episodeData = [];
  let currentTitle = '';
  let currentPoster = '';
  let malId = null;

  // Get AniList info and MAL id
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

      titleEl.textContent = selectedEp
        ? `${currentTitle} [${type.toUpperCase()}] - Episode ${selectedEp}`
        : `${currentTitle} [${type.toUpperCase()}]`;

      posterImage.src = currentPoster;

      return fetch('https://raw.githubusercontent.com/animeneek/AnimeNeek/main/animeneek.json');
    })
    .then(res => res.json())
    .then(json => {
      const animeEntry = json.find(entry => entry['data-mal-id'] === malId);
      if (!animeEntry) return;

      episodeData = animeEntry.episodes.filter(ep => ep['data-ep-lan'].toLowerCase() === type);

      // Populate episode dropdown
      episodeSelect.innerHTML = '<option value="">Select Episode</option>';
      episodeData.forEach(ep => {
        const opt = document.createElement('option');
        opt.value = ep['data-ep-num'];
        opt.textContent = `Episode ${ep['data-ep-num']}`;
        episodeSelect.appendChild(opt);
      });

      // If ep is in URL, set and play
      if (selectedEp) {
        episodeSelect.value = selectedEp;
        playEpisode(selectedEp);
      }

      // Enable play button when dropdown changes
      episodeSelect.addEventListener('change', () => {
        playButton.disabled = episodeSelect.value === "";
      });

      // On Play click
      playButton.addEventListener('click', () => {
        const ep = parseInt(episodeSelect.value);
        if (!ep) return;
        history.pushState(null, '', `watch.html?id=${anilistId}&type=${type}&ep=${ep}`);
        playEpisode(ep);
      });
    });

  function playEpisode(epNum) {
    const ep = episodeData.find(e => e['data-ep-num'] === epNum);
    if (!ep) return;

    // Hide poster, show iframe
    posterOverlay.style.display = 'none';
    videoPlayer.style.display = 'block';

    // Set title
    titleEl.textContent = `${currentTitle} [${type.toUpperCase()}] - Episode ${epNum}`;

    // Load embed links
    const srcType = ep['data-src'];
    const vid = ep['data-video-id'];
    let sources = [];

    if (srcType === 'anime') {
      sources = [
        `https://s3taku.one/watch?play=${vid}`,
        `https://s3taku.one/watch?play=${vid}&sv=1`
      ];
    } else if (srcType === 'streamtape') {
      sources = [`https://streamtape.com/e/${vid}`];
    } else if (srcType === 'mp4upload') {
      sources = [`https://mp4upload.com/v/${vid}`];
    }

    // Load default video
    videoPlayer.src = sources[0];

    // Create source buttons
    sourceButtons.innerHTML = '';
    sources.forEach((link, i) => {
      const btn = document.createElement('button');
      btn.className = 'px-3 py-1 rounded bg-gray-300 dark:bg-gray-700 text-sm mr-2';
      btn.textContent = `Source ${i + 1}`;
      btn.onclick = () => {
        videoPlayer.src = link;
      };
      sourceButtons.appendChild(btn);
    });
  }
});
