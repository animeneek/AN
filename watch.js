const urlParams = new URLSearchParams(window.location.search);
const anilistId = parseInt(urlParams.get("id"));
const type = urlParams.get("type") || "sub";
const episodeNumber = parseInt(urlParams.get("ep")) || null;

const videoPlayer = document.getElementById("videoPlayer");
const posterImg = document.getElementById("animePoster");
const animeTitle = document.getElementById("animeTitle");
const episodeSelect = document.getElementById("episodeSelect");
const playButton = document.getElementById("playButton");
const sourceButtonsContainer = document.getElementById("sourceButtons");
const posterContainer = document.getElementById("posterContainer");
const videoContainer = document.getElementById("videoContainer");

// Fetch MAL ID using AniList API
async function getMalIdFromAnilistId(anilistId) {
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
              extraLarge
            }
          }
        }
      `,
      variables: { id: anilistId },
    }),
  });

  const { data } = await response.json();
  return {
    malId: data.Media.idMal,
    title: data.Media.title.english || data.Media.title.romaji,
    image: data.Media.coverImage.extraLarge,
  };
}

// Load JSON from your GitHub repo
async function getAnimeData() {
  const response = await fetch("https://raw.githubusercontent.com/animeneek/AnimeNeek/main/animeneek.json");
  return response.json();
}

// Map to embed URLs
function getEmbedUrls(source, videoId) {
  switch (source) {
    case "anime":
      return [
        `https://s3taku.one/watch?play=${videoId}`,
        `https://s3taku.one/watch?play=${videoId}&sv=1`,
      ];
    case "streamtape":
      return [`https://streamtape.com/e/${videoId}`];
    case "mp4upload":
      return [`https://mp4upload.com/v/${videoId}`];
    default:
      return [];
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  const { malId, title, image } = await getMalIdFromAnilistId(anilistId);
  animeTitle.textContent = `Watch ${title} [${type.toUpperCase()}]${episodeNumber ? ` - Episode ${episodeNumber}` : ""}`;
  posterImg.src = image;

  const json = await getAnimeData();
  const animeEntry = json.find(item => item["data-mal-id"] === malId);

  if (!animeEntry) return;

  const episodes = animeEntry.episodes.filter(ep => ep["data-ep-lan"].toLowerCase() === type.toLowerCase());

  // Populate dropdown
  episodes.forEach(ep => {
    const option = document.createElement("option");
    option.value = ep["data-ep-num"];
    option.textContent = `Episode ${ep["data-ep-num"]}`;
    episodeSelect.appendChild(option);
  });

  // Enable play button when episode selected
  episodeSelect.addEventListener("change", () => {
    if (episodeSelect.value) {
      playButton.disabled = false;
      playButton.classList.remove("bg-gray-400", "cursor-not-allowed");
      playButton.classList.add("bg-blue-600", "hover:bg-blue-700", "cursor-pointer");
    } else {
      playButton.disabled = true;
      playButton.classList.add("bg-gray-400", "cursor-not-allowed");
      playButton.classList.remove("bg-blue-600", "hover:bg-blue-700", "cursor-pointer");
    }
  });

  // If URL has episode param, auto-play it
  if (episodeNumber) {
    episodeSelect.value = episodeNumber;
    const selected = episodes.find(ep => ep["data-ep-num"] === episodeNumber);
    if (selected) {
      loadVideo(selected);
    }
  }

  playButton.addEventListener("click", () => {
    const selectedEp = parseInt(episodeSelect.value);
    const selected = episodes.find(ep => ep["data-ep-num"] === selectedEp);
    if (!selected) return;

    const newUrl = `watch.html?id=${anilistId}&type=${type}&ep=${selectedEp}`;
    window.history.pushState({}, "", newUrl);
    animeTitle.textContent = `Watch ${title} [${type.toUpperCase()}] - Episode ${selectedEp}`;
    loadVideo(selected);
  });
});

function loadVideo(episodeData) {
  const urls = getEmbedUrls(episodeData["data-src"], episodeData["data-video-id"]);

  sourceButtonsContainer.innerHTML = "";
  urls.forEach((url, idx) => {
    const btn = document.createElement("button");
    btn.textContent = `Source ${idx + 1}`;
    btn.className = "px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm";
    btn.addEventListener("click", () => {
      videoPlayer.src = url;
    });
    sourceButtonsContainer.appendChild(btn);
  });

  // Load first source by default
  videoPlayer.src = urls[0];

  posterContainer.classList.add("hidden");
  videoContainer.classList.remove("hidden");
}
