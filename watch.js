// watch.js
const urlParams = new URLSearchParams(window.location.search);
const animeId = urlParams.get('id');
const type = urlParams.get('type') || 'sub';

function getEmbedUrl(animeId, type) {
  // 🔧 Placeholder: Replace with your actual embed mapping logic
  return `https://vidstreaming.io/load?id=${animeId}&type=${type}`;
}

document.addEventListener('DOMContentLoaded', () => {
  const embedUrl = getEmbedUrl(animeId, type);
  const player = document.getElementById('videoPlayer');
  player.src = embedUrl;

  const searchBox = document.getElementById('searchBox');
  searchBox.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      window.location.href = `search.html?q=${searchBox.value}`;
    }
  });

  // Optional: fetch anime title for display
  fetch('https://graphql.anilist.co', {
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
          }
        }
      `,
      variables: { id: parseInt(animeId) }
    })
  })
    .then(res => res.json())
    .then(data => {
      const title = data.data.Media.title.english || data.data.Media.title.romaji;
      document.getElementById('animeTitle').textContent = `Watch ${title} [${type.toUpperCase()}]`;
    });
});
