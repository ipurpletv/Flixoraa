const API_KEY = 'ba0e2f64d29bae320cf0bbd091bbdf3f';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
let currentItem;

document.addEventListener('DOMContentLoaded', () => {
  fetchTrendingMovies();
  fetchMovies();
  fetchTVShows();
  fetchAnime();

  document.querySelectorAll('#sidebar ul li').forEach(li =>
    li.addEventListener('click', () => {
      fetchByGenre(li.dataset.genre);
      toggleSidebar();
    })
  );

  // Listen to server change
  const serverSelect = document.getElementById('server');
  if (serverSelect) {
    serverSelect.addEventListener('change', changeServer);
  }
});

// ── FETCH FUNCTIONS ──
async function fetchTrendingMovies() {
  const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
  const data = await res.json();
  if (data.results[0]) displayBanner(data.results[0]);
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
  let allResults = [];

  for (let page = 1; page <= 3; page++) {
    const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
    const data = await res.json();
    const filtered = data.results.filter(item =>
      item.original_language === 'ja' && item.genre_ids.includes(16)
    );
    allResults = allResults.concat(filtered);
  }

  displayList(allResults, 'anime-list');
}

async function fetchByGenre(genreId) {
  const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}`);
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

// ── DETAILS MODAL WITH STREAMING ──
function showDetails(item) {
  const modal = document.getElementById('detail-modal');
  document.getElementById('detail-title').textContent = item.title || item.name;
  document.getElementById('detail-description').textContent = item.overview || '';
  document.getElementById('detail-poster').src = IMG_URL + item.poster_path;

  const watchBtn = document.getElementById('watch-now-btn');
  const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const url = `watch.html?id=${item.id}&type=${type}&title=${encodeURIComponent(item.title || item.name)}`;
  watchBtn.href = url;

  modal.style.display = 'flex';

  saveToWatchHistory({
    id: item.id,
    title: item.title || item.name,
    poster: IMG_URL + item.poster_path,
  });
}

function changeServer() {
  if (!currentItem) return;

  const server = document.getElementById('server')?.value || 'vidsrc.cc';
  const type = currentItem.media_type || (currentItem.first_air_date ? 'tv' : 'movie');
  let embedURL = '';

  if (server === 'vidsrc.cc') {
    embedURL = `https://vidsrc.cc/v2/embed/${type}/${currentItem.id}`;
  } else if (server === 'vidsrc.me') {
    embedURL = `https://vidsrc.net/embed/${type}/?tmdb=${currentItem.id}`;
  } else if (server === 'player.videasy.net') {
    embedURL = `https://player.videasy.net/${type}/${currentItem.id}`;
  }

  const iframe = document.getElementById('modal-video');
  if (iframe) iframe.src = embedURL;
}

function closeModal() {
  document.getElementById('detail-modal').style.display = 'none';
  document.getElementById('modal-video').src = ''; // Stop video
  inlineResults.style.display = 'none';
}

// ── SEARCH ──
const searchInput = document.getElementById('search-input');
const inlineResults = document.getElementById('inline-search-results');

async function searchTMDB() {
  const query = searchInput.value.trim();
  if (query.length < 2) {
    inlineResults.innerHTML = '';
    inlineResults.style.display = 'none';
    return;
  }

  inlineResults.innerHTML = '<p style="color:#888;">Loading…</p>';
  inlineResults.style.display = 'block';

  try {
    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
    const data = await res.json();
    inlineResults.innerHTML = '';

    if (!data.results || data.results.length === 0) {
      inlineResults.innerHTML = '<p style="color:#888;">No results.</p>';
      return;
    }

    data.results.forEach(item => {
      if (!item.poster_path) return;
      const ele = document.createElement('div');
      ele.className = 'search-item';
      ele.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w200${item.poster_path}" alt="${item.title || item.name}" />
        <span>${item.title || item.name}</span>`;
      ele.onclick = () => {
        inlineResults.style.display = 'none';
        showDetails(item);
      };
      inlineResults.appendChild(ele);
    });
  } catch (err) {
    console.error(err);
    inlineResults.innerHTML = '<p style="color:red;">Error fetching data.</p>';
  }
}

function clearSearch() {
  searchInput.value = '';
  inlineResults.innerHTML = '';
  inlineResults.style.display = 'none';
}

document.addEventListener('click', e => {
  if (
    !e.target.closest('.search-wrapper') &&
    !e.target.closest('#inline-search-results')
  ) {
    inlineResults.style.display = 'none';
  }
});

// ── WATCH HISTORY ──
function saveToWatchHistory(item) {
  const history = JSON.parse(localStorage.getItem('watchHistory')) || [];
  if (!history.some(h => h.id === item.id)) {
    history.unshift(item);
    localStorage.setItem('watchHistory', JSON.stringify(history.slice(0, 20)));
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

  const list = document.createElement('ul');
  list.className = 'history-list';

  history.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item.title;
    li.onclick = () => showDetails(item);
    list.appendChild(li);
  });

  container.appendChild(list);
}

function toggleHistory() {
  loadWatchHistory();
  document.getElementById('history-sidebar').classList.toggle('active');
}

// ── SIDEBAR ──
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
}

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
