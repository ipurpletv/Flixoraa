/* ------------- CONFIG ------------- */
const API_KEY  = 'ba0e2f64d29bae320cf0bbd091bbdf3f';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL  = 'https://image.tmdb.org/t/p/w500';

/* banner rotation state */
let trendingBanners = [];
let bannerIndex = 0;

/* ------------- ON LOAD ------------- */
document.addEventListener('DOMContentLoaded', () => {
  fetchTrendingMovies();   // now sets rotating banner
  fetchMovies();
  fetchTVShows();
  fetchAnime();

  // genre clicks
  document.querySelectorAll('#sidebar ul li').forEach(li =>
    li.addEventListener('click', () => {
      fetchByGenre(li.dataset.genre);
      toggleSidebar();
    })
  );
});

/* ----------- FETCHERS ------------ */
async function fetchTrendingMovies() {
  const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
  const data = await res.json();

  trendingBanners = data.results.filter(m => m.backdrop_path); // keep only movies with backdrop

  if (trendingBanners.length) {
    displayBanner(trendingBanners[0]);

    // rotate every 10 s
    setInterval(() => {
      bannerIndex = (bannerIndex + 1) % trendingBanners.length;
      displayBanner(trendingBanners[bannerIndex]);
    }, 10000);
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
  let all = [];
  for (let p = 1; p <= 3; p++) {
    const r  = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${p}`);
    const d  = await r.json();
    const ja = d.results.filter(it => it.original_language === 'ja' && it.genre_ids.includes(16));
    all = all.concat(ja);
  }
  displayList(all, 'anime-list');
}

async function fetchByGenre(gid) {
  const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${gid}`);
  const data = await res.json();
  displayList(data.results, 'movies-list');
  if (data.results[0]) displayBanner(data.results[0]);
}

/* ----------- DISPLAY LIST ------------- */
function displayList(items, targetId) {
  const wrap = document.getElementById(targetId);
  wrap.innerHTML = '';
  items.forEach(it => {
    if (!it.poster_path) return;
    const img = document.createElement('img');
    img.src   = IMG_URL + it.poster_path;
    img.alt   = it.title || it.name;
    img.onclick = () => showDetails(it);
    wrap.appendChild(img);
  });
}

/* ----------- BANNER ------------- */
function displayBanner(movie) {
  const banner = document.getElementById('banner');
  banner.style.backgroundImage = `url(${IMG_URL + movie.backdrop_path})`;

  document.getElementById('banner-title').textContent       = movie.title;
  document.getElementById('banner-description').textContent = movie.overview || '';

  const watchUrl = `watch.html?id=${movie.id}&type=movie&title=${encodeURIComponent(movie.title)}`;
  document.getElementById('banner-watch-btn').href = watchUrl;
}

/* ----------- MODAL --------------- */
function showDetails(item) {
  const modal = document.getElementById('detail-modal');
  document.getElementById('detail-title').textContent       = item.title || item.name;
  document.getElementById('detail-description').textContent = item.overview || '';
  document.getElementById('detail-poster').src              = IMG_URL + item.poster_path;

  /* build Watch‑Now link */
  const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const url  = `watch.html?id=${item.id}&type=${type}&title=${encodeURIComponent(item.title || item.name)}`;
  document.getElementById('watch-now-btn').href = url;

  // Fetch download link from Mocine API
  const downloadBtn = document.getElementById('download-btn');
  try {
    const mocineUrl = `https://apimocine.vercel.app/${type}/${item.id}`;
    const res = await fetch(mocineUrl);
    const data = await res.json();
    if (data?.media?.sources?.[0]?.url) {
      downloadBtn.href = data.media.sources[0].url;
      downloadBtn.style.display = 'inline-block';
    } else {
      downloadBtn.style.display = 'none';
    }
  } catch (err) {
    console.error("Download link fetch error:", err);
    downloadBtn.style.display = 'none';
  }

  // open modal
  modal.style.display = 'flex';

  // save history
  saveToWatchHistory({ id: item.id, title: item.title || item.name, poster: IMG_URL + item.poster_path });
}

function closeModal() {
  document.getElementById('detail-modal').style.display = 'none';
  inlineResults.style.display = 'none';
}

/* ----------- SEARCH -------------- */
const searchInput   = document.getElementById('search-input');
const inlineResults = document.getElementById('inline-search-results');

async function searchTMDB() {
  const q = searchInput.value.trim();
  if (q.length < 2) {
    inlineResults.style.display = 'none';
    inlineResults.innerHTML = '';
    return;
  }

  inlineResults.style.display = 'block';
  inlineResults.innerHTML = '<p style="color:#888;">Loading…</p>';

  try {
    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(q)}`);
    const data = await res.json();
    inlineResults.innerHTML = '';

    if (!data.results.length) {
      inlineResults.innerHTML = '<p style="color:#888;">No results.</p>';
      return;
    }

    data.results.forEach(it => {
      if (!it.poster_path) return;
      const div = document.createElement('div');
      div.className = 'search-item';
      div.innerHTML = `
        <img src="https://image.tmdb.org/t/p/w200${it.poster_path}" alt="${it.title || it.name}" />
        <span>${it.title || it.name}</span>`;
      div.onclick = () => { inlineResults.style.display = 'none'; showDetails(it); };
      inlineResults.appendChild(div);
    });
  } catch (err) {
    console.error(err);
    inlineResults.innerHTML = '<p style="color:red;">Error fetching data.</p>';
  }
}

function clearSearch() {
  searchInput.value = '';
  inlineResults.style.display = 'none';
  inlineResults.innerHTML = '';
}

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrapper') && !e.target.closest('#inline-search-results')) {
    inlineResults.style.display = 'none';
  }
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
  const ul = document.createElement('ul');
  ul.className = 'history-list';
  hist.forEach(it => {
    const li = document.createElement('li');
    li.textContent = it.title;
    li.onclick = () => showDetails(it);
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
