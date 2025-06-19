/* ------------- CONFIG ------------- */
const API_KEY  = 'ba0e2f64d29bae320cf0bbd091bbdf3f';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL  = 'https://image.tmdb.org/t/p/w500';

/* Manual download overrides by TMDB ID */
const manualDownloads = {
  // 872585: 'https://dl2.vid1.site/https%3A%2F%2Fmacdn.hakunaymatata.com%2Fresource%2F37897e3f839b6f45541103327929d6fa.mp4%3FExpires%3D1750789239%26Signature%3DDMWz6cL2rLDtFXOx09-bJy6FKs3AU-Tfb~0zdpIV3yzr2ngUQ0qUALb0c82ITLIWmTfBDZX-gBeCfKUPb33Zf7d6CXC~dmJ5tYfykMDJyacLzvtFHrd8CFZyP9q78CTs7rIjc2-icvbsJ-pPyZb7lkC6a-WTyZ-qc8~7VGGWbWxZFg~wnqkOPLjyyi3w6AcYE9Bth1VrB5RdL2rNDRebNK7kaeRsW1MKptvCgmCYe-aOchOmYwqftNMRSAV6~GdUlNq4JdfAYlzhswP4f~KoDepCFPFQPxGH7~~k0qR~rg4yZUFrpL~plBWj0-msZWO9XKNzGgFvYDbDTk-VcVV8Sw__%26Key-Pair-Id%3DKMHN1LQ1HEUPL?n=The+Marvels+%282023%29',
  // 603692: 'https://example.com/john_wick_4.mp4'
};

/* Banner rotation state */
let trendingBanners = [];
let bannerIndex = 0;

/* Cached DOM refs */
let searchInput, inlineResults;

/* ------------- ON LOAD ------------- */
document.addEventListener('DOMContentLoaded', () => {
  searchInput   = document.getElementById('search-input');
  inlineResults = document.getElementById('inline-search-results');

  createScrollButtons();

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
});

/* ----------- ARROW‑SCROLL LOGIC ------------ */
function createScrollButtons() {
  document.querySelectorAll('.row').forEach(row => {
    const list = row.querySelector('.list');
    if (!list?.id) return;

    const makeBtn = dir => {
      const btn = document.createElement('button');
      btn.className = `scroll-btn ${dir}`;
      btn.dataset.target = list.id;
      btn.setAttribute('aria-label', `Scroll ${dir}`);
      btn.innerHTML = `<i class="fas fa-chevron-${dir}"></i>`;
      return btn;
    };

    row.insertBefore(makeBtn('left'), list);
    row.appendChild(makeBtn('right'));
  });

  document.querySelectorAll('.scroll-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      const list = document.getElementById(btn.dataset.target);
      if (!list) return;
      const offset = list.clientWidth * 0.9 *
                     (btn.classList.contains('left') ? -1 : 1);
      list.scrollBy({ left: offset, behavior: 'smooth' });
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
const fetchTVShows = () => fetchAndDisplay('tv/popular', 'tvshows-list');

async function fetchAndDisplay(endpoint, target) {
  const res = await fetch(`${BASE_URL}/${endpoint}?api_key=${API_KEY}`);
  const { results } = await res.json();
  displayList(results, target);
}

async function buildAnimeList() {
  let all = [];
  for (let p = 1; p <= 3; p++) {
    const r = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${p}`);
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

/* ----------- DISPLAY LIST ------------- */
function displayList(items, targetId) {
  const wrap = document.getElementById(targetId);
  wrap.innerHTML = '';

  items.forEach(it => {
    if (!it.poster_path) return;

    const card  = document.createElement('div'); card.className = 'media-card';
    const img   = document.createElement('img');
    img.src = IMG_URL + it.poster_path;
    img.alt = it.title || it.name;
    img.onclick = () => showDetails(it);

    const title = document.createElement('p');
    title.className = 'media-title';
    title.textContent = it.title || it.name;

    const dlBtn = document.createElement('a');
    dlBtn.textContent = 'Download';
    dlBtn.className   = 'watch-now-btn download-btn';
    dlBtn.style.display = 'none';
    dlBtn.target = '_blank';

    const id   = it.id;
    const type = it.first_air_date ? 'tv' : 'movie';

    if (manualDownloads[id]) {
      dlBtn.href = manualDownloads[id];
      dlBtn.style.display = 'inline-block';
    } else {
      fetch(`https://apimocine.vercel.app/${type}/${id}`)
        .then(r => r.json())
        .then(d => {
          const url = d?.media?.sources?.[0]?.url;
          if (url) { dlBtn.href = url; dlBtn.style.display = 'inline-block'; }
        })
        .catch(() => {/* ignore */});
    }

    card.append(img, title, dlBtn);
    wrap.appendChild(card);
  });
}

/* ----------- BANNER ------------- */
function displayBanner(movie) {
  document.getElementById('banner').style.backgroundImage =
    `url(${IMG_URL + movie.backdrop_path})`;
  document.getElementById('banner-title').textContent = movie.title;
  document.getElementById('banner-description').textContent = movie.overview || '';
  document.getElementById('banner-watch-btn').href =
    `watch.html?id=${movie.id}&type=movie&title=${encodeURIComponent(movie.title)}`;
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
  dlBtn.classList.add('watch-now-btn');  // ensure same size

  if (manualDownloads[item.id]) {
    dlBtn.href = manualDownloads[item.id];
    dlBtn.style.display = 'inline-block';
  } else {
    try {
      const res = await fetch(`https://apimocine.vercel.app/${mediaType}/${item.id}`);
      const { media } = await res.json();
      const url = media?.sources?.[0]?.url;
      if (url) {
        dlBtn.href = url;
        dlBtn.style.display = 'inline-block';
      } else {
        dlBtn.style.display = 'none';
      }
    } catch {
      dlBtn.style.display = 'none';
    }
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
    results.forEach(it => {
      if (!it.poster_path) return;
      const row = document.createElement('div');
      row.className = 'search-item';
      row.innerHTML = `<img src="https://image.tmdb.org/t/p/w200${it.poster_path}" alt="">
                       <span>${it.title || it.name}</span>`;
      row.onclick = () => { inlineResults.style.display = 'none'; showDetails(it); };
      inlineResults.appendChild(row);
    });
  } catch {
    inlineResults.innerHTML = '<p style="color:red;">Error fetching data.</p>';
  }
}

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrapper') &&
      !e.target.closest('#inline-search-results')) {
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

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
