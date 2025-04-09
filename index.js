const API_URL = 'https://graphql.anilist.co';

// Initialize Swiper
const swiper = new Swiper('.swiper-container', {
  loop: true,
  autoplay: {
    delay: 5000,
  },
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
});

function fetchNeekPicks() {
  const query = `
    query {
      Page(perPage: 6) {
        media(type: ANIME, sort: POPULARITY_DESC) {
          id
          title {
            romaji
          }
          coverImage {
            large
          }
        }
      }
    }
  `;

  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
    .then((res) => res.json())
    .then(({ data }) => {
      const neekPicks = data.Page.media;
      const neekPicksContainer = document.getElementById('neekPicks');
      neekPicksContainer.innerHTML = neekPicks
        .map(
          (anime) => `
        <a href="anime.html?id=${anime.id}" class="bg-gray-200 dark:bg-gray-700 rounded overflow-hidden shadow hover:scale-105 transition">
          <img src="${anime.coverImage.large}" alt="${anime.title.romaji}" class="w-full h-40 object-cover">
          <div class="p-2 text-sm text-center">${anime.title.romaji}</div>
        </a>
      `
        )
        .join('');
    });
}

function fetchSliderContent() {
  const query = `
    query {
      Page(perPage: 5) {
        media(type: ANIME, sort: TRENDING_DESC) {
          id
          title {
            romaji
          }
          coverImage {
            extraLarge
          }
        }
      }
    }
  `;

  fetch(API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query }),
})
  .then((res) => res.json())
  .then(({ data }) => {
    const sliderContent = data.Page.media;
    const swiperWrapper = document.querySelector('.swiper-wrapper');
    swiperWrapper.innerHTML = sliderContent
      .map(
        (anime) => `
        <div class="swiper-slide">
          <a href="anime.html?id=${anime.id}" class="relative block">
            <img src="${anime.coverImage.extraLarge}" alt="${anime.title.romaji}" class="w-full h-[300px] object-cover rounded" />
            <div class="absolute inset-0 bg-black bg-opacity-50 flex items-end p-4">
              <h3 class="text-white text-lg font-semibold">${anime.title.romaji}</h3>
            </div>
          </a>
        </div>
      `
      )
      .join('');

    swiper.update(); // Refresh Swiper to account for new slides
  });
}

// Event: Search box Enter key
document.addEventListener('DOMContentLoaded', () => {
  fetchNeekPicks();
  fetchSliderContent();

  const searchBox = document.getElementById('searchBox');
  searchBox.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      window.location.href = `search.html?q=${searchBox.value}`;
    }
  });
});
