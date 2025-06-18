const API_KEY = 'ba0e2f64d29bae320cf0bbd091bbdf3f'; // Replace with your TMDB API key
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';

document.addEventListener('DOMContentLoaded', () => {
  fetchTrendingMovies();
  fetchGenres();
  fetchMovies('popular');
  fetchMovies('top_rated');
  fetchMovies('upcoming');
});

// ========== FETCHING MOVIES ==========
async function fetchMovies(type) {
  const res = await fetch(`${BASE_URL}/movie/${type}?api_key=${API_KEY}`);
  const data = await res.json();
  displayMovies(data.results, type);
}

async function fetchTrendingMovies() {
  const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
  const data = await res.json();
  displayBanner(data.results[0]);
}

function displayMovies(movies, category) {
  const container = document.getElementById(`${category}-movies`);
  container.innerHTML = '';

  movies.forEach(movie => {
    if (!movie.poster_path) return;

    const img = document.createElement('img');
    img.src = IMG_URL + movie.poster_path;
    img.alt = movie.title;
    img.title = movie.title;
    img.onclick = () => showDetails(movie);
    container.appendChild(img);
  });
}

function displayBanner(movie) {
  const banner = document.getElementById('banner');
  banner.style.backgroundImage = `url(${IMG_URL + movie.backdrop_path})`;
  banner.innerHTML = `
    <div class="banner-content">
      <h1>${movie.title}</h1>
      <p>${movie.overview}</p>
      <button onclick="showDetails(${JSON.stringify(movie).replace(/"/g, '&quot;')})">More Info</button>
    </div>
  `;
}

// ========== MOVIE DETAILS ==========
function showDetails(movie) {
  const modal = document.getElementById('detail-modal');
  modal.innerHTML = `
    <div class="modal-content">
      <span class="close" onclick="modal.style.display='none'">&times;</span>
      <img src="${IMG_URL + movie.poster_path}" alt="${movie.title}" />
      <h2>${movie.title || movie.name}</h2>
      <p>${movie.overview}</p>
    </div>
  `;
  modal.style.display = 'block';
  saveToHistory(movie);
}

// ========== GENRE SIDEBAR ==========
async function fetchGenres() {
  const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}`);
  const data = await res.json();
  const sidebar = document.getElementById('sidebar');
  sidebar.innerHTML += data.genres.map(g =>
    `<button onclick="fetchByGenre(${g.id})">${g.name}</button>`
  ).join('');
}

async function fetchByGenre(genreId) {
  const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}`);
  const data = await res.json();
  const container = document.getElementById('popular-movies');
  container.innerHTML = '';
  displayMovies(data.results, 'popular');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

// ========== SEARCH ==========
async function searchTMDB() {
  const query = document.getElementById('search-input').value.trim();
  const container = document.getElementById('search-results');
  container.innerHTML = '';

  if (query.length < 2) return;

  const res = await fetch(
    `${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`
  );
  const data = await res.json();

  if (!data.results.length) {
    container.innerHTML = '<p style="color:#777;">No results.</p>';
    return;
  }

  data.results.forEach(item => {
    if (!item.poster_path) return;
    const img = document.createElement('img');
    img.src = IMG_URL + item.poster_path;
    img.alt = item.title || item.name;
    img.title = item.title || item.name;
    img.onclick = () => {
      openSearchModal();
      showDetails(item);
    };
    container.appendChild(img);
  });
}

function openSearchModal() {
  document.getElementById('search-modal').style.display = 'block';
}

// ========== WATCH HISTORY ==========
function saveToHistory(movie) {
  let history = JSON.parse(localStorage.getItem('watchHistory')) || [];

  // prevent duplicates
  if (!history.find(m => m.id === movie.id)) {
    history.unshift({
      id: movie.id,
      title: movie.title || movie.name,
      poster: IMG_URL + movie.poster_path,
    });
    localStorage.setItem('watchHistory', JSON.stringify(history.slice(0, 20)));
  }
}

function toggleHistory() {
  document.getElementById('history-sidebar').classList.toggle('open');
}

function openHistory() {
  loadWatchHistory();
  toggleHistory();
}

function loadWatchHistory() {
  const container = document.getElementById('history-results');
  container.innerHTML = '';

  const history = JSON.parse(localStorage.getItem('watchHistory')) || [];
  if (history.length === 0) {
    container.innerHTML = '<p style="color:#777;">No watch history yet.</p>';
    return;
  }

  history.forEach(item => {
    const img = document.createElement('img');
    img.src = item.poster;
    img.alt = item.title;
    img.title = item.title;
    img.onclick = () => {
      toggleHistory();
      showDetails({ ...item, poster_path: item.poster.replace(IMG_URL, '') });
    };
    container.appendChild(img);
  });
}

// ========== ESCAPE closes modals/sidebars ==========
window.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('history-sidebar').classList.remove('open');
    document.getElementById('search-modal').style.display = 'none';
    document.getElementById('detail-modal').style.display = 'none';
  }
});
