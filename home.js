/* ------------- CONFIG ------------- */
const API_KEY  = 'ba0e2f64d29bae320cf0bbd091bbdf3f';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL  = 'https://image.tmdb.org/t/p/w500';

/* Banner rotation */
let trendingBanners = [];
let bannerIndex = 0;

/* Cached DOM refs */
let searchInput, inlineResults;

/* ------------- ON LOAD ------------- */
document.addEventListener('DOMContentLoaded', () => {
  searchInput   = document.getElementById('search-input');
  inlineResults = document.getElementById('inline-search-results');

  createScrollButtons();

  /* initial content */
  fetchTrendingMovies();
  fetchMovies();
  fetchTVShows();
  fetchAnime();
  fetchVivamax();            /* ➜ NEW */

  /* sidebar genre links */
  document.querySelectorAll('#sidebar ul li').forEach(li =>
    li.addEventListener('click', () => { fetchByGenre(li.dataset.genre); toggleSidebar(); })
  );
});

/* ----------- SCROLL BUTTONS ------------ */
function createScrollButtons() {
  document.querySelectorAll('.row').forEach(row => {
    const list = row.querySelector('.list');
    if (!list?.id) return;
    const mk = dir => {
      const b = document.createElement('button');
      b.className = `scroll-btn ${dir}`;
      b.dataset.target = list.id;
      b.innerHTML = `<i class="fas fa-chevron-${dir}"></i>`;
      return b;
    };
    row.insertBefore(mk('left'), list);
    row.appendChild(mk('right'));
  });
  document.querySelectorAll('.scroll-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      const list = document.getElementById(btn.dataset.target);
      const off  = list.clientWidth * 0.9 * (btn.classList.contains('left') ? -1 : 1);
      list.scrollBy({ left: off, behavior: 'smooth' });
    })
  );
}

/* ----------- FETCHERS ------------ */
async function fetchTrendingMovies() {
  const r = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
  const { results } = await r.json();
  trendingBanners = results.filter(r => r.backdrop_path);
  if (trendingBanners.length) {
    displayBanner(trendingBanners[0]);
    setInterval(() => {
      bannerIndex = (bannerIndex + 1) % trendingBanners.length;
      displayBanner(trendingBanners[bannerIndex]);
    }, 10000);
  }
}
const fetchMovies  = () => fetchAndDisplay('movie/popular', 'movies-list');
const fetchTVShows = () => fetchAndDisplay('tv/popular',    'tvshows-list');

async function fetchAndDisplay(endpoint, target) {
  const r = await fetch(`${BASE_URL}/${endpoint}?api_key=${API_KEY}`);
  const { results } = await r.json();
  displayList(results, target);
}

/* Anime = JA language + animation genre */
async function fetchAnime() {
  let all = [];
  for (let p = 1; p <= 3; p++) {
    const r = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${p}`);
    const { results } = await r.json();
    all = all.concat(results.filter(it => it.original_language === 'ja' && it.genre_ids.includes(16)));
  }
  displayList(all, 'anime-list');
}

/* ➜ NEW: Vivamax (popular Filipino‑language movies) */
async function fetchVivamax() {
  const url = `${BASE_URL}/discover/movie?api_key=${API_KEY}` +
              `&with_original_language=tl&sort_by=popularity.desc&page=1`;
  try {
    const r = await fetch(url);
    const { results } = await r.json();
    displayList(results, 'vivamax-list');
  } catch (err) {
    console.error('Vivamax fetch error:', err);
  }
}

async function fetchByGenre(gid) {
  const r = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${gid}`);
  const { results } = await r.json();
  displayList(results, 'movies-list');
  if (results[0]) displayBanner(results[0]);
}

/* ----------- DISPLAY LIST ------------ */
function displayList(items, targetId) {
  const wrap = document.getElementById(targetId);
  if (!wrap) return;
  wrap.innerHTML = '';

  items.forEach(media => {
    if (!media.poster_path) return;

    const card  = document.createElement('div'); card.className = 'media-card';
    const img   = document.createElement('img');
    img.src = IMG_URL + media.poster_path;
    img.alt = media.title || media.name;
    img.onclick = () => showDetails(media);

    const title = document.createElement('p');
    title.className = 'media-title';
    title.textContent = media.title || media.name;

    card.append(img, title);
    wrap.appendChild(card);
  });
}

/* ----------- BANNER ------------ */
function displayBanner(m) {
  document.getElementById('banner').style.backgroundImage = `url(${IMG_URL + m.backdrop_path})`;
  document.getElementById('banner-title').textContent = m.title;
  document.getElementById('banner-description').textContent = m.overview || '';
  document.getElementById('banner-watch-btn').href =
    `watch.html?id=${m.id}&type=movie&title=${encodeURIComponent(m.title)}`;
}

/* ----------- MODAL --------------- */
function showDetails(item) {
  const modal = document.getElementById('detail-modal');
  document.getElementById('detail-title').textContent       = item.title || item.name;
  document.getElementById('detail-description').textContent = item.overview || '';
  document.getElementById('detail-poster').src              = IMG_URL + item.poster_path;

  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  document.getElementById('watch-now-btn').href =
    `watch.html?id=${item.id}&type=${mediaType}&title=${encodeURIComponent(item.title || item.name)}`;

  const dlBtn = document.getElementById('download-btn');
  dlBtn.classList.add('watch-now-btn');
  dlBtn.href = `download.html?id=${item.id}&type=${mediaType}&title=${encodeURIComponent(item.title || item.name)}`;
  dlBtn.style.display = 'inline-block';

  modal.style.display = 'flex';
  saveToWatchHistory({ id: item.id, title: item.title || item.name, poster: IMG_URL + item.poster_path });
}

function closeModal() {
  document.getElementById('detail-modal').style.display = 'none';
  inlineResults.style.display = 'none';
}

/* ----------- SEARCH -------------- */
async function searchTMDB() {
  const q = searchInput.value.trim();
  if (q.length < 2) { inlineResults.style.display = 'none'; return; }

  inlineResults.style.display = 'block';
  inlineResults.innerHTML = '<p style="color:#888;">Loading…</p>';

  try {
    const r = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(q)}`);
    const { results } = await r.json();

    inlineResults.innerHTML = results.length ? '' : '<p style="color:#888;">No results.</p>';
    results.forEach(it => {
      if (!it.poster_path) return;
      const row = document.createElement('div'); row.className = 'search-item';
      row.innerHTML = `<img src="https://image.tmdb.org/t/p/w200${it.poster_path}" alt=""><span>${it.title || it.name}</span>`;
      row.onclick = () => { inlineResults.style.display = 'none'; showDetails(it); };
      inlineResults.appendChild(row);
    });
  } catch {
    inlineResults.innerHTML = '<p style="color:red;">Error fetching data.</p>';
  }
}

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrapper') && !e.target.closest('#inline-search-results'))
    inlineResults.style.display = 'none';
});

/* -------- WATCH HISTORY ---------- */
function saveToWatchHistory(item) {
  const hist = JSON.parse(localStorage.getItem('watchHistory')) || [];
  if (!hist.some(h => h.id === item.id)) {
    hist.unshift(item);
    localStorage.setItem('watchHistory', JSON.stringify(hist.slice(0, 20)));
  }
}

function loadWatchHistory() {
  const box = document.getElementById('history-results');
  box.innerHTML = '';
  const hist = JSON.parse(localStorage.getItem('watchHistory')) || [];
  if (!hist.length) {
    box.innerHTML = '<p style="color:#ccc;">No history yet.</p>';
    return;
  }
  const ul = document.createElement('ul'); ul.className = 'history-list';
  hist.forEach(h => {
    const li = document.createElement('li');
    li.textContent = h.title;
    li.onclick = () => showDetails(h);
    ul.appendChild(li);
  });
  box.appendChild(ul);
}

function toggleHistory() {
  loadWatchHistory();
  document.getElementById('history-sidebar').classList.toggle('active');
}

/* -------- SIDEBAR / ESC --------- */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('active');
}
window.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
