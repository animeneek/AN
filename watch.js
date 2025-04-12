const API_URL = 'https://graphql.anilist.co';
const JSON_URL = 'https://raw.githubusercontent.com/animeneek/AnimeNeek/main/animeneek.json';

document.addEventListener('DOMContentLoaded', async () => {
  const navRes = await fetch('nav.html');
  const navHTML = await navRes.text();
  document.getElementById('nav-placeholder').innerHTML = navHTML;
  setupThemeToggle();
  setupSearchHandler();

  const params = new URLSearchParams(window.location.search);
  const anilistID = params.get('id');
  const type = params.get('type')?.toUpperCase() || 'SUB';

  const { malID, title, coverImage } = await getMalDetails(anilistID);
  const titleEl = document.getElementById('animeTitle');
  titleEl.textContent = `${title} [${type}]`;

  const jsonData = await (await fetch(JSON_URL)).json();
  const animeEntry = jsonData.find(entry => entry['data-mal-id'] === malID);

  const episodeList = animeEntry?.episodes?.filter(ep => ep['data-ep-lan'].toUpperCase() === type) || [];
  episodeList.sort((a, b) => a['data-ep-num'] - b['data-ep-num']);

  const select = document.getElementById('episodeSelect');
  const playButton = document.getElementById('playButton');
  const video = document.getElementById('videoPlayer');
  const sourceButtons = document.getElementById('sourceButtons');
  const overlay = document.getElementById('placeholderOverlay');

  if (coverImage) {
    overlay.style.backgroundImage = `url('${coverImage}')`;
    overlay.style.backgroundSize = 'cover';
    overlay.style.backgroundPosition = 'center';
  }

  episodeList.forEach(ep => {
    const option = document.createElement('option');
    option.value = ep['data-ep-num'];
    option.textContent = `Episode ${ep['data-ep-num']}`;
    select.appendChild(option);
  });

  select.addEventListener('change', () => {
    playButton.disabled = !select.value;
  });

  playButton.addEventListener('click', () => {
    const selectedEp = episodeList.find(ep => ep['data-ep-num'] == select.value);
    if (!selectedEp) return;

    const videoId = selectedEp['data-video-id'];
    const src = selectedEp['data-src'];
    sourceButtons.innerHTML = '';

    let urls = [];

    if (src === 'anime') {
      urls = [
        `https://s3taku.one/watch?play=${videoId}`,
        `https://s3taku.one/watch?play=${videoId}&sv=1`
      ];
    } else if (src === 'streamtape') {
      urls = [`https://streamtape.com/e/${videoId}`];
    } else if (src === 'mp4upload') {
      urls = [`https://mp4upload.com/v/${videoId}`];
    } else if (src === 'URL') {
      video.src = "https://github.com/animeneek/movneek/blob/main/Assets/Images/BG_002.jpg";
      return;
    } else {
      video.src = "";
      return;
    }

    video.src = urls[0];

    urls.forEach((url, i) => {
      const btn = document.createElement('button');
      btn.textContent = `Source ${i + 1}`;
      btn.className = 'px-3 py-1 rounded bg-red-600 text-white font-medium';
      btn.addEventListener('click', () => video.src = url);
      sourceButtons.appendChild(btn);
    });

    if (overlay) {
      overlay.style.display = 'none';
    }

    document.getElementById('animeTitle').textContent = `${title} [${type}] - Episode ${selectedEp['data-ep-num']}`;
  });
});

async function getMalDetails(anilistID) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        title { romaji }
        idMal
        coverImage { extraLarge }
      }
    }
  `;
  const variables = { id: parseInt(anilistID) };

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  });

  const data = await res.json();
  return {
    malID: data?.data?.Media?.idMal,
    title: data?.data?.Media?.title?.romaji || "Unknown Title",
    coverImage: data?.data?.Media?.coverImage?.extraLarge || ''
  };
}

function setupThemeToggle() {
  const toggle = document.getElementById('toggleTheme');
  const html = document.documentElement;
  const storedTheme = localStorage.getItem('theme');

  if (!storedTheme || storedTheme === 'dark') {
    html.classList.add('dark');
  } else {
    html.classList.remove('dark');
  }


  if (toggle) {
    toggle.addEventListener('click', () => {
      html.classList.toggle('dark');
      localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
    });
  }
}

function setupSearchHandler() {
  const searchBox = document.getElementById('searchBox');
  if (searchBox) {
    searchBox.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        window.location.href = `search.html?q=${searchBox.value}`;
      }
    });
  }
}
