/* ------------- CONFIG ------------- */
const API_KEY  = 'ba0e2f64d29bae320cf0bbd091bbdf3f';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL  = 'https://image.tmdb.org/t/p/w500';

/* Manual download overrides by TMDB ID (used only to decide if we show a button) */
const manualDownloads = {
  609681: 'https://dl.example.com/The_Marvels_2023.mp4',
  // 603692: 'https://example.com/john_wick_4.mp4'
};

/* Banner rotation */
let trendingBanners = [];
let bannerIndex = 0;

/* Cached DOM refs */
let searchInput, inlineResults;

/* ------------- ON LOAD ------------- */
document.addEventListener('DOMContentLoaded', () => {
  searchInput   = document.getElementById('search-input');
  inlineResults = document.getElementById('inline-search-results');

  createScrollButtons();
  fetchTrendingMovies();
  fetchMovies();
  fetchTVShows();
  fetchAnime();

  /* sidebar genre filter */
  document.querySelectorAll('#sidebar ul li').forEach(li =>
    li.addEventListener('click', () => {
      fetchByGenre(li.dataset.genre);
      toggleSidebar();
    })
  );
});

/* ----------- ARROW SCROLL ------------ */
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
  const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
  const { results } = await res.json();
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
  const res = await fetch(`${BASE_URL}/${endpoint}?api_key=${API_KEY}`);
  const { results } = await res.json();
  displayList(results, target);
}

async function buildAnimeList() {
  let all = [];
  for (let p = 1; p <= 3; p++) {
    const r  = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${p}`);
    const { results } = await r.json();
    all = all.concat(results.filter(it =>
      it.original_language === 'ja' && it.genre_ids.includes(16)
    ));
  }
  displayList(all, 'anime-list');
}
const fetchAnime = buildAnimeList;

async function fetchByGenre(gid) {
  const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${gid}`);
  const { results } = await res.json();
  displayList(results, 'movies-list');
  if (results[0]) displayBanner(results[0]);
}

/* ----------- DISPLAY LIST ------------ */
function displayList(items, targetId) {
  const wrap = document.getElementById(targetId);
  wrap.innerHTML = '';

  items.forEach(async movie => {
    if (!movie.poster_path) return;

    const card  = document.createElement('div'); card.className = 'media-card';
    const img   = document.createElement('img'); img.src = IMG_URL + movie.poster_path;
    img.alt = movie.title || movie.name;
    img.onclick = () => showDetails(movie);

    const title = document.createElement('p'); title.className = 'media-title';
    title.textContent = movie.title || movie.name;

    const dl = document.createElement('a');
    dl.textContent = 'Download';
    dl.className   = 'watch-now-btn download-btn';
    dl.style.display = 'none';
    dl.target = '_blank';

    const id   = movie.id;
    const type = movie.first_air_date ? 'tv' : 'movie';

    /* Decide if we should show the button */
    let hasLink = !!manualDownloads[id];
    if (!hasLink) {
      try {
        const r = await fetch(`https://apimocine.vercel.app/${type}/${id}`);
        const { media } = await r.json();
        hasLink = !!media?.sources?.[0]?.url;
      } catch {}
    }

    if (hasLink) {
      dl.href = `download.html?id=${id}&type=${type}&title=${encodeURIComponent(movie.title || movie.name)}`;
      dl.style.display = 'inline-block';
    }

    card.append(img, title, dl);
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
async function showDetails(item) {
  const modal = document.getElementById('detail-modal');
  document.getElementById('detail-title').textContent = item.title || item.name;
  document.getElementById('detail-description').textContent = item.overview || '';
  document.getElementById('detail-poster').src = IMG_URL + item.poster_path;

  const mediaType = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  document.getElementById('watch-now-btn').href =
    `watch.html?id=${item.id}&type=${mediaType}&title=${encodeURIComponent(item.title || item.name)}`;

  const dlBtn = document.getElementById('download-btn');
  dlBtn.classList.add('watch-now-btn');

  /* Only show if a link exists somewhere */
  let showBtn = !!manualDownloads[item.id];
  if (!showBtn) {
    try {
      const r = await fetch(`https://apimocine.vercel.app/${mediaType}/${item.id}`);
      const { media } = await r.json();
      showBtn = !!media?.sources?.[0]?.url;
    } catch {}
  }

  if (showBtn) {
    dlBtn.href = `download.html?id=${item.id}&type=${mediaType}&title=${encodeURIComponent(item.title || item.name)}`;
    dlBtn.style.display = 'inline-block';
  } else {
    dlBtn.style.display = 'none';
  }

  modal.style.display = 'flex';
  saveToWatchHistory({
    id: item.id,
    title: item.title || item.name,
    poster: IMG_URL + item.poster_path
  });
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
    const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(q)}`);
    const { results } = await res.json();

    inlineResults.innerHTML = results.length ? '' : '<p style="color:#888;">No results.</p>';
    results.forEach(r => {
      if (!r.poster_path) return;
      const div = document.createElement('div');
      div.className = 'search-item';
      div.innerHTML = `<img src="https://image.tmdb.org/t/p/w200${r.poster_path}" alt=""><span>${r.title || r.name}</span>`;
      div.onclick = () => { inlineResults.style.display = 'none'; showDetails(r); };
      inlineResults.appendChild(div);
    });
  } catch {
    inlineResults.innerHTML = '<p style="color:red;">Error fetching data.</p>';
  }
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
