// Load nav
fetch("nav.html")
  .then((res) => res.text())
  .then((data) => (document.getElementById("nav-placeholder").innerHTML = data));

// Utility: Get query param
function getParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

const anilistId = getParam("id");
const type = getParam("type");
const episodeNum = parseInt(getParam("ep"));

const titleEl = document.getElementById("animeTitle");
const videoPlayer = document.getElementById("videoPlayer");
const posterImage = document.getElementById("posterImage");
const posterOverlay = document.getElementById("posterOverlay");
const episodeSelect = document.getElementById("episodeSelect");
const playButton = document.getElementById("playButton");
const sourceButtons = document.getElementById("sourceButtons");

let selectedEpisode = null;
let animeTitle = "";
let malId = null;
let allEpisodes = [];

// Fetch MyAnimeList ID from AniList ID
async function getMalIdFromAnilistId(id) {
  const query = `
    query ($id: Int) {
      Media(id: $id) {
        idMal
        title {
          romaji
        }
        coverImage {
          large
        }
      }
    }
  `;
  const variables = { id: parseInt(id) };
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const json = await response.json();
  animeTitle = json.data.Media.title.romaji;
  posterImage.src = json.data.Media.coverImage.large;
  return json.data.Media.idMal;
}

// Get embed links based on source type
function getEmbedLinks(srcType, videoId) {
  if (srcType === "anime") {
    return [
      `//s3taku.one/watch?play=${videoId}`,
      `//s3taku.one/watch?play=${videoId}&sv=1`,
    ];
  } else if (srcType === "streamtape") {
    return [`//streamtape.com/e/${videoId}`];
  } else if (srcType === "mp4upload") {
    return [`//mp4upload.com/v/${videoId}`];
  }
  return [];
}

// Update source buttons
function updateSourceButtons(episodeData) {
  sourceButtons.innerHTML = "";
  const links = getEmbedLinks(episodeData["data-src"], episodeData["data-video-id"]);
  links.forEach((link, index) => {
    const btn = document.createElement("button");
    btn.textContent = `Source ${index + 1}`;
    btn.className = "bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700 transition";
    btn.addEventListener("click", () => {
      videoPlayer.src = link;
    });
    sourceButtons.appendChild(btn);
  });
}

// Update title
function updateTitle(epNum) {
  const lang = type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  if (epNum) {
    titleEl.textContent = `${animeTitle} [${lang}] - Episode ${epNum}`;
  } else {
    titleEl.textContent = `${animeTitle} [${lang}]`;
  }
}

// Update video player
function updatePlayer(episodeData) {
  const links = getEmbedLinks(episodeData["data-src"], episodeData["data-video-id"]);
  if (links.length > 0) {
    videoPlayer.src = links[0];
    videoPlayer.classList.remove("hidden");
    posterOverlay.classList.add("hidden");
    updateSourceButtons(episodeData);
  }
}

// Initialize the watch page
async function init() {
  try {
    malId = await getMalIdFromAnilistId(anilistId);
    const jsonRes = await fetch(
      "https://raw.githubusercontent.com/animeneek/AnimeNeek/main/animeneek.json"
    );
    const json = await jsonRes.json();

    const animeEntry = json.find((entry) => entry["data-mal-id"] === malId);
    if (!animeEntry) {
      titleEl.textContent = "No episodes found.";
      return;
    }

    allEpisodes = animeEntry.episodes.filter(
      (ep) => ep["data-ep-lan"].toLowerCase() === type.toLowerCase()
    );
    if (allEpisodes.length === 0) {
      titleEl.textContent = `No ${type} episodes available.`;
      return;
    }

    // Populate episode dropdown
    allEpisodes.forEach((ep) => {
      const option = document.createElement("option");
      option.value = ep["data-ep-num"];
      option.textContent = `Episode ${ep["data-ep-num"]}`;
      episodeSelect.appendChild(option);
    });

    // Preselect episode if exists in URL
    if (!isNaN(episodeNum)) {
      const epData = allEpisodes.find((ep) => ep["data-ep-num"] === episodeNum);
      if (epData) {
        episodeSelect.value = episodeNum;
        updateTitle(episodeNum);
        updatePlayer(epData);
        selectedEpisode = epData;
        playButton.disabled = false;
      }
    } else {
      updateTitle(); // No ep number
    }

    episodeSelect.addEventListener("change", () => {
      const selectedNum = parseInt(episodeSelect.value);
      selectedEpisode = allEpisodes.find((ep) => ep["data-ep-num"] === selectedNum);
      playButton.disabled = !selectedEpisode;
    });

    playButton.addEventListener("click", () => {
      if (!selectedEpisode) return;

      // Update the URL with the selected episode number
      const url = new URL(window.location.href);
      url.searchParams.set("ep", selectedEpisode["data-ep-num"]);
      window.history.pushState({}, "", url);

      // Update title and player
      updateTitle(selectedEpisode["data-ep-num"]);
      updatePlayer(selectedEpisode);
    });
  } catch (err) {
    console.error("Error loading watch page:", err);
    titleEl.textContent = "Something went wrong.";
  }
}

init();
