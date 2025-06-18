const API_KEY = 'ba0e2f64d29bae320cf0bbd091bbdf3f';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

const movieListEl = document.getElementById('movies-list');
const tvListEl = document.getElementById('tvshows-list');
const animeListEl = document.getElementById('anime-list');

// ========== Fetch Popular Movies ==========
async function fetchMovies() {
  const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`);
  const data = await res.json();
  displayList(data.results, 'movies-list');
  displayBanner(data.results[0]);
}

// ========== Fetch Popular TV Shows ==========
async function fetchTVShows() {
  const res = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}`);
  const data = await res.json();
  displayList(data.results, 'tvshows-list');
}

// ========== Fetch Anime (Japanese animation) ==========
async function fetchAnime() {
  const res = await fetch(
    `${BASE_URL}/discover/tv?api_key=${API_KEY}&with_original_language=ja`
  );
  const data = await res.json();
  displayList(data.results, 'anime-list');
}

// ========== Display List ==========
function displayList(items, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  items.forEach(item => {
    const img = document.createElement('img');
    img.src = IMG_URL + item.poster_path;
    img.alt = item.title || item.name;
    img.title = item.title || item.name;
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
}

// ========== Display Banner ==========
function displayBanner(movie) {
  const banner = document.querySelector('.banner');
  banner.style.backgroundImage = `url(${IMG_URL + movie.backdrop_path})`;
}

// ========== Show Details Modal ==========
function showDetails(item) {
  const modal = document.getElementById('detail-modal');
  const title = item.title || item.name;
  const overview = item.overview;
  const poster = IMG_URL + item.poster_path;

  document.getElementById('detail-title').textContent = title;
  document.getElementById('detail-description').textContent = overview;
  document.getElementById('detail-poster').src = poster;

  modal.style.display = 'flex';

  saveToWatchHistory({
    id: item.id,
    title,
    overview,
    poster,
  });
}

// ========== Save to Watch History ==========
function saveToWatchHistory(item) {
  const history = JSON.parse(localStorage.getItem('watchHistory')) || [];
  const exists = history.find(i => i.id === item.id);
  if (!exists) {
    history.push(item);
    localStorage.setItem('watchHistory', JSON.stringify(history));
  }
}

// ========== Close Modal ==========
function closeModal() {
  document.getElementById('detail-modal').style.display = 'none';
  document.getElementById('search-modal').style.display = 'none';
  document.getElementById('history-modal').style.display = 'none';
}

// ========== Open Search Modal ==========
function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
  document.getElementById('search-input').focus();
}

// ========== Search ==========
async function searchTMDB() {
  const query = document.getElementById('search-input').value.trim();
  const container = document.getElementById('search-results');

  if (query.length < 2) {
    container.innerHTML = '';
    return;
  }

  const res = await fetch(
    `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
  );
  const data = await res.json();
  container.innerHTML = '';

  if (data.results.length === 0) {
    container.innerHTML = '<p style="color:#ccc;">No results found.</p>';
    return;
  }

  data.results.forEach(item => {
    if (!item.poster_path) return;

    const img = document.createElement('img');
    img.src = IMG_URL + item.poster_path;
    img.alt = item.title || item.name;
    img.title = item.title || item.name;
    img.onclick = () => showDetails(item);
    container.appendChild(img);
  });
}

// ========== Clear Search ==========
function clearSearch() {
  document.getElementById('search-input').value = '';
  document.getElementById('search-results').innerHTML = '';
}

// ========== Load Watch History ==========
function loadWatchHistory() {
  const container = document.getElementById('history-results');
  container.innerHTML = '';

  const history = JSON.parse(localStorage.getItem('watchHistory')) || [];
  if (history.length === 0) {
    container.innerHTML = '<p style="color:#ccc;">No watch history available.</p>';
    return;
  }

  history.forEach(item => {
    const img = document.createElement('img');
    img.src = item.poster;
    img.alt = item.title;
    img.title = item.title;
    img.onclick = () => showDetails({ ...item, poster_path: item.poster.replace(IMG_URL, '') });
    container.appendChild(img);
  });
}

// ========== Open & Close History ==========
function openHistory() {
  loadWatchHistory();
  document.getElementById('history-modal').style.display = 'flex';
}

function closeHistoryModal() {
  document.getElementById('history-modal').style.display = 'none';
}

// ========== Sidebar Toggle ==========
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ========== Fetch Movies by Genre ==========
async function fetchByGenre(genreId) {
  const res = await fetch(
    `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}`
  );
  const data = await res.json();
  displayList(data.results, 'movies-list');
  displayBanner(data.results[0]);
}

// ========== Event Listeners ==========
document.addEventListener('DOMContentLoaded', () => {
  fetchMovies();
  fetchTVShows();
  fetchAnime();

  // genre clicks
  document.querySelectorAll('#sidebar li').forEach(li =>
    li.addEventListener('click', () => {
      fetchByGenre(li.dataset.genre);
      toggleSidebar();
    })
  );

  // modal close on outside click
  window.addEventListener('click', event => {
    const modals = ['detail-modal', 'search-modal', 'history-modal'];
    modals.forEach(id => {
      const modal = document.getElementById(id);
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  });
});
