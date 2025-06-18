const API_KEY = 'ba0e2f64d29bae320cf0bbd091bbdf3f';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

document.addEventListener('DOMContentLoaded', () => {
  fetchTrendingMovies();
  fetchMovies();
  fetchTVShows();
  fetchAnime();

  document
    .querySelectorAll('#sidebar ul li')
    .forEach(li =>
      li.addEventListener('click', () => {
        fetchByGenre(li.dataset.genre);
        toggleSidebar();
      })
    );
});

// ── FETCH FUNCTIONS ──
async function fetchTrendingMovies() {
  const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
  const data = await res.json();
  if (data.results[0]) {
    displayBanner(data.results[0]);
  }
}

async function fetchMovies() {
  const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`);
  const data = await res.json();
  displayList(data.results, 'movies-list');
}

async function fetchTVShows() {
  const res = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}`);
  const data = await res.json();
  displayList(data.results, 'tvshows-list');
}

async function fetchAnime() {
  const res = await fetch(
    `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_original_language=ja`
  );
  const data = await res.json();
  displayList(data.results, 'anime-list');
}

async function fetchByGenre(genreId) {
  const res = await fetch(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}`
  );
  const data = await res.json();
  displayList(data.results, 'movies-list');
  if (data.results[0]) displayBanner(data.results[0]);
}

// ── DISPLAY FUNCTIONS ──
function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';
  items.forEach(item => {
    if (!item.poster_path) return;
    const img = document.createElement('img');
    img.src = IMG_URL + item.poster_path;
    img.alt = item.title || item.name;
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
}

function displayBanner(movie) {
  const banner = document.getElementById('banner');
  banner.style.backgroundImage = `url(${IMG_URL + movie.backdrop_path})`;
}

// ── DETAILS MODAL ──
function showDetails(item) {
  const modal = document.getElementById('detail-modal');
  const titleEl = document.getElementById('detail-title');
  const descEl = document.getElementById('detail-description');

  titleEl.textContent = item.title || item.name;
  descEl.textContent = item.overview || '';
  modal.style.display = 'flex';

  saveToWatchHistory({
    id: item.id,
    title: item.title || item.name,
    poster: IMG_URL + item.poster_path,
  });
}

function closeModal() {
  document.getElementById('detail-modal').style.display = 'none';
  document.getElementById('search-modal').style.display = 'none';
}

// ── SEARCH ──
function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
}

async function searchTMDB() {
  const query = document.getElementById('search-input').value.trim();
  const container = document.getElementById('search-results');
  container.innerHTML = '';

  if (query.length < 2) return;

  const res = await fetch(
    `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
  );
  const data = await res.json();
  data.results.forEach(item => {
    if (!item.poster_path) return;
    const img = document.createElement('img');
    img.src = IMG_URL + item.poster_path;
    img.alt = item.title || item.name;
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
}

function clearSearch() {
  document.getElementById('search-input').value = '';
  document.getElementById('search-results').innerHTML = '';
}

// ── WATCH HISTORY ──
function saveToWatchHistory(item) {
  const history = JSON.parse(localStorage.getItem('watchHistory')) || [];
  if (!history.some(h => h.id === item.id)) {
    history.unshift(item);
    localStorage.setItem(
      'watchHistory',
      JSON.stringify(history.slice(0, 20))
    );
  }
}

function loadWatchHistory() {
  const container = document.getElementById('history-results');
  container.innerHTML = '';
  const history = JSON.parse(localStorage.getItem('watchHistory')) || [];
  if (history.length === 0) {
    container.innerHTML = '<p style="color:#ccc;">No history yet.</p>';
    return;
  }
  history.forEach(item => {
    const img = document.createElement('img');
    img.src = item.poster;
    img.alt = item.title;
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
}

function toggleHistory() {
  loadWatchHistory();
  document.getElementById('history-sidebar').classList.toggle('active');
}

// ── SIDEBAR TOGGLE ──
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
}

// ── CLOSE ON ESCAPE ──
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
