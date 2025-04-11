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
