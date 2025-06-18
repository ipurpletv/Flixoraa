const API_KEY = 'ba0e2f64d29bae320cf0bbd091bbdf3f';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/original';
let currentItem;

// ==== FETCH TRENDING DATA ====

async function fetchTrending(type) {
  const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
  const data = await res.json();
  return data.results;
}

async function fetchTrendingAnime() {
  let allResults = [];

  for (let page = 1; page <= 3; page++) {
    const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    const filtered = data.results.filter(item =>
      item.original_language === 'ja' && item.genre_ids.includes(16)
    );
    allResults = allResults.concat(filtered);
  }

  return allResults;
}

// ==== DISPLAY FUNCTIONS ====

function displayBanner(item) {
  document.getElementById('banner').style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
  document.getElementById('banner-title').textContent = item.title || item.name;
}

function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    const img = document.createElement('img');
    img.src = `${IMG_URL}${item.poster_path}`;
    img.alt = item.title || item.name;
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
}

function showDetails(item) {
  currentItem = item;
  document.getElementById('modal-title').textContent = item.title || item.name;
  document.getElementById('modal-description').textContent = item.overview;
  document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
  document.getElementById('modal-rating').innerHTML = '★'.repeat(Math.round(item.vote_average / 2));
  changeServer();
  document.getElementById('modal').style.display = 'flex';

  // Add to watch history
  saveToWatchHistory(item);
}

function changeServer() {
  const server = document.getElementById('server').value;
  const type = currentItem.media_type === "movie" ? "movie" : "tv";
  let embedURL = "";

  if (server === "vidsrc.cc") {
    embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
  } else if (server === "vidsrc.me") {
    embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
  } else if (server === "player.videasy.net") {
    embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
  }

  document.getElementById('modal-video').src = embedURL;
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
  document.getElementById('modal-video').src = '';
}

// ==== INIT ====

async function init() {
  const movies = await fetchTrending('movie');
  const tvShows = await fetchTrending('tv');
  const anime = await fetchTrendingAnime();

  displayBanner(movies[Math.floor(Math.random() * movies.length)]);
  displayList(movies, 'movies-list');
  displayList(tvShows, 'tvshows-list');
  displayList(anime, 'anime-list');
}

init();

// ==== SEARCH MODAL ====

const searchModal = document.getElementById('search-modal');
const searchBtn = document.getElementById('search-btn');
const closeSearchBtn = document.getElementById('close-search');
const searchInput = document.getElementById('search-input');

// Open Search Modal
searchBtn.addEventListener('click', () => {
  searchModal.style.display = 'flex';
  searchInput.focus();
});

// Close Search Modal
closeSearchBtn.addEventListener('click', () => {
  searchModal.style.display = 'none';
  searchInput.value = '';
  document.getElementById('results').innerHTML = '';
});

// Search Functionality
searchInput.addEventListener('input', async () => {
  const query = searchInput.value.trim();
  const resultsContainer = document.getElementById('results');
  resultsContainer.innerHTML = '';

  if (query.length < 2) return;

  try {
    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
    const data = await res.json();

    data.results.forEach(item => {
      if (!item.poster_path) return;
      const div = document.createElement('div');
      div.style.cursor = 'pointer';
      div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem;">
          <img src="https://image.tmdb.org/t/p/w92${item.poster_path}" alt="${item.title || item.name}" />
          <span>${item.title || item.name}</span>
        </div>
      `;
      div.onclick = () => {
        searchModal.style.display = 'none';
        showDetails(item);
      };
      resultsContainer.appendChild(div);
    });
  } catch (err) {
    resultsContainer.innerHTML = `<p style="color:red;">Error loading results.</p>`;
  }
});

// ==== WATCH HISTORY ====

const historyBtn = document.getElementById('history-btn');
const historyModal = document.getElementById('history-modal');
const closeHistoryBtn = document.getElementById('close-history');

// Open
historyBtn.addEventListener('click', () => {
  historyModal.style.display = 'flex';
  loadWatchHistory();
});

// Close
closeHistoryBtn.addEventListener('click', () => {
  historyModal.style.display = 'none';
});

// Save to history in localStorage
function saveToWatchHistory(item) {
  let history = JSON.parse(localStorage.getItem('watchHistory')) || [];
  history = history.filter(h => h.id !== item.id); // remove duplicates
  history.unshift({
    id: item.id,
    title: item.title || item.name,
    poster: `${IMG_URL}${item.poster_path}`
  });
  localStorage.setItem('watchHistory', JSON.stringify(history.slice(0, 20)));
}

function loadWatchHistory() {
  const container = document.getElementById('watch-history-container');
  container.innerHTML = '';

  const history = JSON.parse(localStorage.getItem('watchHistory')) || [];

  if (history.length === 0) {
    container.innerHTML = '<p style="color: #ccc;">No watch history available.</p>';
    return;
  }

  history.forEach(item => {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.gap = '1rem';
    div.style.marginBottom = '1rem';
    div.innerHTML = `
      <img src="${item.poster}" alt="${item.title}" style="width: 60px; border-radius: 5px;" />
      <span>${item.title}</span>
    `;
    container.appendChild(div);
  });
}

// ==== ESC KEY TO CLOSE MODALS ====
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modal-video').src = '';
    searchModal.style.display = 'none';
    historyModal.style.display = 'none';
  }
});
