document.addEventListener('DOMContentLoaded', () => {
  // Load nav.html into #nav-placeholder
  fetch("nav.html")
    .then(response => response.text())
    .then(navData => {
      document.getElementById("nav-placeholder").innerHTML = navData;
      setupThemeToggle();
      setupSearchHandler();
    });

  // Fetch URL params
  const urlParams = new URLSearchParams(window.location.search);
  const animeId = urlParams.get('id');
  const type = urlParams.get('type') || 'sub';  // default to 'sub' if no type is provided

  // Function to fetch the anime title from AniList using the animeId
  fetchAnimeTitle(animeId, type);

  // Fetch episode data for the given animeId from the JSON
  fetchEpisodeData(animeId, type);
});

// Function to fetch the anime title from AniList API
function fetchAnimeTitle(animeId, type) {
  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        title {
          romaji
          english
        }
      }
    }
  `;
  const variables = {
    id: parseInt(animeId)
  };

  fetch('https://graphql.anilist.co', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  })
    .then(res => res.json())
    .then(data => {
      const title = data.data.Media.title.english || data.data.Media.title.romaji;
      // Set the title and type (e.g., "Horimiya [DUB]") in the <h1> tag
      document.getElementById('animeTitle').textContent = `${title} [${type.toUpperCase()}]`;
    })
    .catch(err => console.error('Error fetching anime title:', err));
}

// Fetch episode data from the JSON file and populate the episode list dropdown
function fetchEpisodeData(animeId, type) {
  fetch('https://raw.githubusercontent.com/animeneek/AnimeNeek/main/animeneek.json')  // Fetch the JSON data from GitHub
    .then(response => response.json())
    .then(data => {
      // Find the anime data based on the given animeId (MyAnimeList ID)
      const animeData = data.find(item => item['data-mal-id'] === parseInt(animeId));

      if (animeData) {
        // Filter the episodes based on the selected type (Sub, Dub, Raw)
        const filteredEpisodes = animeData.episodes.filter(ep => ep['data-ep-lan'].toLowerCase() === type.toLowerCase());

        // Populate the dropdown with the filtered episodes
        const episodeSelect = document.getElementById('episodeSelect');
        episodeSelect.innerHTML = '<option value="">Select Episode</option>';  // Clear previous options

        filteredEpisodes.forEach(episode => {
          const option = document.createElement('option');
          option.value = episode['data-video-id'];
          option.textContent = `Episode ${episode['data-ep-num']}`;
          episodeSelect.appendChild(option);
        });

        // Enable play button if episodes are available
        if (filteredEpisodes.length > 0) {
          document.getElementById('playButton').disabled = false;
        }

        // Add source buttons (e.g., "Source 1", "Source 2")
        addSourceButtons(filteredEpisodes);
      } else {
        console.error('No anime data found for the given MyAnimeList ID');
      }
    })
    .catch(err => console.error('Error fetching episode data:', err));
}

// Add source buttons based on the episode's source type (e.g., Anime, StreamTape)
function addSourceButtons(episodes) {
  const sourceButtons = document.getElementById('sourceButtons');
  sourceButtons.innerHTML = '';  // Clear previous buttons

  episodes.forEach(episode => {
    const sourceButton = document.createElement('button');
    sourceButton.classList.add('px-4', 'py-2', 'bg-gray-300', 'rounded', 'text-black');
    sourceButton.textContent = `Source ${episode['data-src'] === 'anime' ? '1' : episode['data-src'] === 'streamtape' ? '2' : '3'}`;

    // Define the source link
    let sourceLink;
    if (episode['data-src'] === 'anime') {
      sourceLink = `//s3taku.one/watch?play=${episode['data-video-id']}`;
    } else if (episode['data-src'] === 'streamtape') {
      sourceLink = `//streamtape.com/e/${episode['data-video-id']}`;
    } else if (episode['data-src'] === 'mp4upload') {
      sourceLink = `//mp4upload.com/v/${episode['data-video-id']}`;
    }

    // Add event listener to play video on click
    sourceButton.addEventListener('click', () => {
      document.getElementById('videoPlayer').src = sourceLink;
    });

    sourceButtons.appendChild(sourceButton);
  });
}

function setupThemeToggle() {
  const toggle = document.getElementById('toggleTheme');
  if (toggle) {
    toggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
  }

  // Set theme on first load
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
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
