document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const malId = urlParams.get("id");
    const episodeNum = urlParams.get("ep") || "1";
    const type = urlParams.get("type")?.toLowerCase() || "sub";

    if (!malId || !type) {
        document.body.innerHTML = "<h1>Invalid watch link.</h1>";
        return;
    }

    const player = document.getElementById("video-player");
    const titleEl = document.getElementById("anime-title");
    const episodeTitleEl = document.getElementById("episode-title");
    const sourceButtons = document.getElementById("source-buttons");

    // 1. Fetch anime details from Jikan
    fetch(`https://api.jikan.moe/v4/anime/${malId}`)
        .then(res => res.json())
        .then(data => {
            titleEl.textContent = data.data.title;
        });

    // 2. Load episode data from JSON
    fetch("https://raw.githubusercontent.com/animeneek/AnimeNeek/main/animeneek.json")
        .then(res => res.json())
        .then(allAnime => {
            const anime = allAnime.find(item => item["data-mal-id"] == malId);
            if (!anime) return (document.body.innerHTML = "<h1>Anime not found.</h1>");

            const ep = anime.episodes.find(e => 
                e["data-ep-num"].toString() === episodeNum && 
                e["data-ep-lan"].toLowerCase() === type
            );

            if (!ep) return (document.body.innerHTML = "<h1>Episode not found.</h1>");

            episodeTitleEl.textContent = `Episode ${episodeNum} - ${type.toUpperCase()}`;

            // Set player
            let embedBase = "";
            switch (ep["data-src"]) {
                case "anime":
                    embedBase = `//s3taku.one/watch?play=${ep["data-video-id"]}`;
                    break;
                case "streamtape":
                    embedBase = `//streamtape.com/e/${ep["data-video-id"]}`;
                    break;
                case "mp4upload":
                    embedBase = `//mp4upload.com/v/${ep["data-video-id"]}`;
                    break;
            }
            player.src = embedBase;

            // Generate source buttons
            sourceButtons.innerHTML = "";
            if (ep["data-src"] === "anime") {
                createSourceButton("Source 1", `//s3taku.one/watch?play=${ep["data-video-id"]}`, true);
                createSourceButton("Source 2", `//s3taku.one/watch?play=${ep["data-video-id"]}&sv=1`);
            } else {
                createSourceButton("Source 1", embedBase, true);
            }

            // Highlight current episode
            highlightEpisode(type, episodeNum);

            // Fill episode sections
            ["Sub", "Dub", "Raw"].forEach(fillEpisodeSection);

            function fillEpisodeSection(lang) {
                const list = anime.episodes.filter(e => e["data-ep-lan"].toLowerCase() === lang.toLowerCase());
                const container = document.getElementById(`${lang.toLowerCase()}EpisodeButtons`);
                container.innerHTML = "";

                if (!list.length) {
                    container.innerHTML = `<p>No ${lang} episodes</p>`;
                    return;
                }

                list.forEach(e => {
                    const btn = document.createElement("button");
                    btn.textContent = e["data-ep-num"];
                    btn.onclick = () => {
                        window.location.href = `watch.html?id=${malId}&ep=${e["data-ep-num"]}&type=${lang.toLowerCase()}`;
                    };
                    container.appendChild(btn);
                });
            }

            function highlightEpisode(lang, epNum) {
                const container = document.getElementById(`${lang.toLowerCase()}EpisodeButtons`);
                if (!container) return;
                [...container.querySelectorAll("button")].forEach(btn => {
                    if (btn.textContent === epNum) btn.classList.add("selected");
                });
            }

            function createSourceButton(label, url, active = false) {
                const btn = document.createElement("button");
                btn.innerText = label;
                btn.className = active ? "selected" : "";
                btn.onclick = () => {
                    player.src = url;
                    [...sourceButtons.children].forEach(b => b.classList.remove("selected"));
                    btn.classList.add("selected");
                };
                sourceButtons.appendChild(btn);
            }
        })
        .catch(err => {
            console.error("JSON Fetch Error:", err);
            document.body.innerHTML = "<h1>Failed to load episode data.</h1>";
        });
});
