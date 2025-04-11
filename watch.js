const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get("id");
const type = (urlParams.get("type") || "sub").toLowerCase();
let malId = null;
let currentEpisode = parseInt(urlParams.get("ep")) || 1;
const jsonUrl = "https://raw.githubusercontent.com/animeneek/AnimeNeek/main/animeneek.json";

async function fetchMalId(anilistId) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        idMal
        title {
          english
          romaji
        }
      }
    }
  `;
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { id: parseInt(animeId) } }),
  });
  const data = await response.json();
  const media = data.data.Media;
  malId = media.idMal;
  document.getElementById("animeTitle").textContent =
    `Watch ${media.title.english || media.title.romaji} [${type.toUpperCase()}]`;
}

function getVideoUrl(source, videoId) {
  if (source === "anime") {
    return `https://s3taku.one/watch?play=${videoId}`;
  } else if (source === "streamtape") {
    return `https://streamtape.com/e/${videoId}`;
  } else if (source === "mp4upload") {
    return `https://mp4upload.com/v/${videoId}`;
  }
  return "";
}

function renderEpisodeList(episodes) {
  const listContainer = document.createElement("div");
  listContainer.className = "mt-4 flex flex-wrap gap-2";

  episodes.forEach((ep) => {
    const epButton = document.createElement("button");
    epButton.textContent = `EP ${ep["data-ep-num"]}`;
    epButton.className =
      "px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-600";
    epButton.addEventListener("click", () => {
      loadEpisode(ep);
    });
    listContainer.appendChild(epButton);
  });

  document.querySelector("main").appendChild(listContainer);
}

function renderSourceButtons(ep) {
  const sources = ["anime", "streamtape", "mp4upload"];
  const container = document.createElement("div");
  container.className = "flex gap-2 mb-4";

  sources.forEach((src) => {
    const btn = document.createElement("button");
    btn.textContent = src;
    btn.className =
      "px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700";
    btn.addEventListener("click", () => {
      const videoUrl = getVideoUrl(src, ep["data-video-id"]);
      document.getElementById("videoPlayer").src = videoUrl;
    });
    container.appendChild(btn);
  });

  document.querySelector("main").insertBefore(container, document.querySelector(".aspect-video"));
}

function loadEpisode(ep) {
  const videoUrl = getVideoUrl(ep["data-src"], ep["data-video-id"]);
  const player = document.getElementById("videoPlayer");
  player.src = videoUrl;

  const epInfo = document.createElement("p");
  epInfo.className = "text-sm text-gray-400 mt-2";
  epInfo.textContent = `Episode ${ep["data-ep-num"]} • Language: ${ep["data-ep-lan"]}`;
  const main = document.querySelector("main");
  const existing = main.querySelector(".ep-info");
  if (existing) existing.remove();
  epInfo.classList.add("ep-info");
  main.appendChild(epInfo);

  const existingSources = main.querySelector(".source-buttons");
  if (existingSources) existingSources.remove();
  renderSourceButtons(ep).classList.add("source-buttons");
}

async function fetchAndRenderEpisodes() {
  const res = await fetch(jsonUrl);
  const jsonData = await res.json();

  const animeData = jsonData.find((entry) => entry["data-mal-id"] === malId);
  if (!animeData) {
    document.getElementById("animeTitle").textContent += " — No episode data found.";
    return;
  }

  const filteredEpisodes = animeData.episodes.filter(
    (ep) => ep["data-ep-lan"].toLowerCase() === type
  );

  if (filteredEpisodes.length === 0) {
    document.getElementById("animeTitle").textContent += ` — No ${type.toUpperCase()} episodes found.`;
    return;
  }

  const firstEp = filteredEpisodes.find(
    (ep) => ep["data-ep-num"] === currentEpisode
  ) || filteredEpisodes[0];

  loadEpisode(firstEp);
  renderEpisodeList(filteredEpisodes);
}

document.addEventListener("DOMContentLoaded", async () => {
  await fetchMalId(animeId);
  await fetchAndRenderEpisodes();
});
