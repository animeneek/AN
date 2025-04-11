const urlParams = new URLSearchParams(window.location.search);
const anilistId = parseInt(urlParams.get('id'));
const type = urlParams.get('type') || 'sub';
const episodeNum = parseInt(urlParams.get('ep')) || null;

const videoPlayer = document.getElementById('videoPlayer');
const animeTitleEl = document.getElementById('animeTitle');
const episodeDropdown = document.getElementById('episodeDropdown');
const playButton = document.getElementById('playButton');
const sourceButtonsContainer = document.getElementById('sourceButtons');
const posterImage = document.getElementById('posterImage');
const posterOverlay = document.getElementById('posterOverlay');

let currentData = null;
let selectedEpisode = episodeNum;

// Fetch MyAnimeList ID
async function fetchMalId(anilistId) {
  const res = await fetch('https://graphql.anilist.co', {
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
            coverImage {
              extraLarge
            }
            idMal
          }
        }
      `,
      variables: { id: anilistId }
    })
  });
  const data = await res.json();
  const media = data.data.Media;
  const title = media.title.english || media.title.romaji;
  animeTitleEl.textContent = selectedEpisode
    ? `${title} [${type.toUpperCase()}] - Episode ${selectedEpisode}`
    : `${title} [${type.toUpperCase()}]`;

  // Set blurred poster
  posterOverlay.style.backgroundImage = `url(${media.coverImage.extraLarge})`;
  posterImage.src = media.coverImage.extraLarge;

  return media.idMal;
}

// Load JSON from raw GitHub
async function fetchJsonData() {
  const res = await fetch("https://raw.githubusercontent.com/animeneek/AnimeNeek/main/animeneek.json");
  return await res.json();
}

// Create video source URLs based on data-src
function getVideoSources(ep) {
  const id = ep["data-video-id"];
  const src = ep["data-src"];
  if (src === "anime") {
    return [
      `https://s3taku.one/watch?play=${id}`,
      `https://s3taku.one/watch?play=${id}&sv=1`
    ];
  } else if (src === "streamtape") {
    return [`https://streamtape.com/e/${id}`];
  } else if (src === "mp4upload") {
    return [`https://mp4upload.com/v/${id}`];
  } else {
    return [];
  }
}

// Render source buttons
function renderSourceButtons(episode) {
  sourceButtonsContainer.innerHTML = "";
  const urls = getVideoSources(episode);
  urls.forEach((url, i) => {
    const btn = document.createElement("button");
    btn.textContent = `Source ${i + 1}`;
    btn.className = "px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600";
    btn.onclick = () => {
      videoPlayer.src = url;
    };
    sourceButtonsContainer.appendChild(btn);
  });
}

// Populate episode dropdown
function populateDropdown(episodes) {
  episodeDropdown.innerHTML = `<option value="">Select Episode</option>`;
  episodes.forEach((ep) => {
    const opt = document.createElement("option");
    opt.value = ep["data-ep-num"];
    opt.textContent = `Episode ${ep["data-ep-num"]}`;
    if (ep["data-ep-num"] === selectedEpisode) {
      opt.selected = true;
    }
    episodeDropdown.appendChild(opt);
  });
}

// Setup play button
playButton.addEventListener("click", () => {
  const ep = parseInt(episodeDropdown.value);
  if (ep) {
    const newUrl = `${location.pathname}?id=${anilistId}&type=${type}&ep=${ep}`;
    window.location.href = newUrl;
  }
});

// Initialize
(async function init() {
  const malId = await fetchMalId(anilistId);
  const allData = await fetchJsonData();
  const animeEntry = allData.find((entry) => entry["data-mal-id"] === malId);

  if (!animeEntry) {
    animeTitleEl.textContent = "Episodes not available for this anime.";
    return;
  }

  const filteredEpisodes = animeEntry.episodes.filter(
    (ep) => ep["data-ep-lan"].toLowerCase() === type.toLowerCase()
  );

  populateDropdown(filteredEpisodes);

  if (!selectedEpisode && filteredEpisodes.length > 0) {
    selectedEpisode = filteredEpisodes[0]["data-ep-num"];
  }

  const currentEpisode = filteredEpisodes.find((ep) => ep["data-ep-num"] === selectedEpisode);
  if (currentEpisode) {
    const urls = getVideoSources(currentEpisode);
    videoPlayer.src = urls[0] || "";
    renderSourceButtons(currentEpisode);
  }
})();
