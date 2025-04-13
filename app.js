const API_URL = 'https://graphql.anilist.co';
const tabButtons = document.querySelectorAll('.tab-btn');
const animeSection = document.getElementById('animeSection');
const heroContent = document.getElementById('heroContent');

// Load featured anime into hero
function loadHeroSlider() {
  const query = `
    query {
      Page(perPage: 5) {
        media(type: ANIME, sort: TRENDING_DESC) {
          id
          title { romaji }
          coverImage { extraLarge }
          bannerImage
          description(asHtml: false)
          genres
        }
      }
    }
  `;

  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  })
    .then(res => res.json())
    .then(data => {
      const animeList = data.data.Page.media;
      const sliderWrapper = document.getElementById('sliderWrapper');

      sliderWrapper.innerHTML = animeList.map((anime, index) => {
        const bgImage = anime.bannerImage || anime.coverImage.extraLarge;
        const genres = anime.genres?.slice(0, 3).join(', ') || '';
        const title = anime.title.romaji || 'Untitled';
        const description = anime.description || 'No description.';

        return `
          <div class="slide absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === 0 ? 'opacity-100 z-30' : 'opacity-0 z-10'}">
            <img src="${bgImage}" alt="${title}" class="w-full h-full object-cover object-center absolute inset-0" />
    
            <!-- Full dark gradient overlay -->
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent backdrop-blur-sm">

              <!-- Content at bottom -->
              <div class="absolute bottom-0 left-0 w-full p-6 md:p-12">
                <div class="p-4 md:p-6 max-h-[60vh] text-white">
                  <h1 class="text-2xl md:text-4xl font-bold mb-3">${title}</h1>
                  <p class="text-sm mb-2 italic">${genres}</p>
                  <div class="text-sm max-h-[140px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-transparent">
                    ${description}
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;

      }).join('');

      startSlider();
    });
}

function startSlider() {
  const slides = document.querySelectorAll('.slide');
  let currentIndex = 0;

  setInterval(() => {
    slides[currentIndex].classList.remove('opacity-100', 'z-30');
    slides[currentIndex].classList.add('opacity-0', 'z-10');

    currentIndex = (currentIndex + 1) % slides.length;

    slides[currentIndex].classList.remove('opacity-0', 'z-10');
    slides[currentIndex].classList.add('opacity-100', 'z-30');
  }, 6000); // Slide every 6 seconds
}


function loadAnime(type = 'TRENDING') {
  animeSection.innerHTML = '<p class="col-span-full text-center text-gray-400">Loading...</p>';

  const query = `
    query ($type: MediaType, $sort: [MediaSort]) {
      Page(perPage: 30) {
        media(type: $type, sort: $sort) {
          id
          title { romaji }
          coverImage { extraLarge }
        }
      }
    }
  `;

  const variables = {
    type: 'ANIME',
    sort: type === 'POPULAR' ? ['POPULARITY_DESC'] :
          type === 'TOP' ? ['SCORE_DESC'] :
          ['TRENDING_DESC']
  };

  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables })
  })
    .then(res => res.json())
    .then(data => {
      animeSection.innerHTML = data.data.Page.media.map(anime => {
        const title = anime.title?.romaji || 'Untitled';
        const image = anime.coverImage?.extraLarge || 'assets/fallback.jpg';
        return `
          <a href="anime.html?id=${anime.id}" class="bg-gray-100 dark:bg-[#222] rounded shadow hover:scale-105 transition overflow-hidden" data-aos="fade-up">
            <img src="${image}" alt="${title}" class="w-full h-[240px] object-cover rounded-t" />
            <div class="p-2 text-sm text-center font-semibold">${title}</div>
          </a>
        `;
      }).join('');
    });
}

document.addEventListener('DOMContentLoaded', () => {
  fetch("nav.html")
    .then(response => response.text())
    .then(navData => {
      document.getElementById("nav-placeholder").innerHTML = navData;
      setupThemeToggle();
      setupSearchHandler();
    });

  loadHeroSlider();
  loadAnime('TRENDING');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => {
        b.classList.remove('bg-[#ff4444]', 'text-white');
        b.classList.add('bg-transparent', 'text-black', 'dark:text-white');
      });

      btn.classList.remove('bg-transparent', 'text-black', 'dark:text-white');
      btn.classList.add('bg-[#ff4444]', 'text-white');

      loadAnime(btn.dataset.type);
    });
  });
});

function setupThemeToggle() {
  const toggle = document.getElementById('toggleTheme');
  if (toggle) {
    toggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
  }

  const savedTheme = localStorage.getItem('theme');
  if (!savedTheme || savedTheme === 'dark') {
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
