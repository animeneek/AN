// watch.js
const urlParams = new URLSearchParams(window.location.search);
const malId = parseInt(urlParams.get("id"));
const type = urlParams.get("type") || "sub";
let currentEpisode = parseInt(urlParams.get("ep")) || 1;

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function createEmbedUrl(source, videoId, primary = true) {
  if (source === "anime") {
    return `https://s3taku.one/watch?play=${videoId}${primary ? "" : "&sv=1"}`;
  } else if (source === "streamtape") {
    return `https://streamtape.com/e/${videoId}`;
  } else if (source === "mp4upload") {
    return `https://mp4upload.com/v/${videoId}`;
  }
  return "";
}

document.addEventListener("DOMContentLoaded", async () => {
  const player = document.getElementById("videoPlayer");
  const titleEl = document.getElementById("animeTitle");
  const epListEl = document.getElementById("episodeList");
  const sourcesEl = document.getElementById("sourceButtons");
  const infoEl = document.getElementById("animeInfo");

  const [anilistRes, episodesRes] = await Promise.all([
    fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query ($idMal: Int) {
          Media(idMal: $idMal, type: ANIME) {
            id
            title {
              romaji
              english
            }
            description
            episodes
          }
        }`,
        variables: { idMal: malId }
      })
    }),
    fetch("https://animeneek.github.io/db/animeneek.json")
  ]);

  const { data } = await anilistRes.json();
  const anime = data.Media;
  const allAnimeEpisodes = await episodesRes.json();
  const thisAnime = allAnimeEpisodes.find((entry) => entry["data-mal-id"] === malId);
  if (!thisAnime) {
    titleEl.textContent = "Anime not found";
    return;
  }

  const episodes = thisAnime.episodes.filter((ep) => ep["data-ep-lan"].toLowerCase() === type);
  const currentEp = episodes.find((ep) => ep["data-ep-num"] === currentEpisode) || episodes[0];
  currentEpisode = currentEp["data-ep-num"];

  const episodeTitle = `${anime.title.english || anime.title.romaji} - Episode ${currentEp["data-ep-num"]} - ${capitalize(type)}`;
  titleEl.textContent = episodeTitle;
  document.title = episodeTitle;

  const src = currentEp["data-src"];
  const vid = currentEp["data-video-id"];
  player.src = createEmbedUrl(src, vid);

  // Render source buttons
  sourcesEl.innerHTML = "";
  if (src === "anime") {
    [true, false].forEach((primary, idx) => {
      const btn = document.createElement("button");
      btn.textContent = `Source ${idx + 1}`;
      btn.className =
        "bg-primary text-white px-4 py-2 rounded-lg mr-2 hover:bg-blue-700 transition-colors";
      btn.onclick = () => {
        player.src = createEmbedUrl(src, vid, primary);
      };
      sourcesEl.appendChild(btn);
    });
  } else {
    const btn = document.createElement("button");
    btn.textContent = "Source";
    btn.className =
      "bg-primary text-white px-4 py-2 rounded-lg mr-2 hover:bg-blue-700 transition-colors";
    btn.onclick = () => {
      player.src = createEmbedUrl(src, vid);
    };
    sourcesEl.appendChild(btn);
  }

  // Render episodes list
  epListEl.innerHTML = "";
  episodes.forEach((ep) => {
    const epBtn = document.createElement("button");
    epBtn.textContent = `Ep ${ep["data-ep-num"]}`;
    epBtn.className =
      "w-full text-left px-4 py-2 hover:bg-blue-700 hover:text-white transition-colors " +
      (ep["data-ep-num"] === currentEpisode ? "bg-blue-700 text-white font-semibold" : "bg-gray-800 text-gray-300");
    epBtn.onclick = () => {
      window.location.href = `watch.html?id=${malId}&type=${type}&ep=${ep["data-ep-num"]}`;
    };
    epListEl.appendChild(epBtn);
  });

  // Anime info
  infoEl.innerHTML = `
    <h2 class="text-xl font-bold mb-2">About This Anime</h2>
    <p class="text-sm text-gray-400 max-w-xl">${anime.description?.replace(/<[^>]+>/g, "") || "No info available."}</p>
  `;
});
