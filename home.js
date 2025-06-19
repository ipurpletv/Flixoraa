/* ------------- CONFIG ------------- */
const API_KEY  = 'ba0e2f64d29bae320cf0bbd091bbdf3f';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL  = 'https://image.tmdb.org/t/p/w500';

/* --------- MANUAL DOWNLOAD LINKS --------- */
const manualDownloads = {
  // Format: [TMDB_ID]: 'YOUR_CUSTOM_DOWNLOAD_LINK'
  550: 'https://example.com/download/fight-club.mp4',
  12345: 'https://example.com/download/my-custom-movie.mp4'
};

/* banner rotation state */
let trendingBanners = [];
let bannerIndex = 0;

/* cached DOM refs that need to exist after DOMContentLoaded */
let searchInput, inlineResults;

/* ------------- ON LOAD ------------- */
document.addEventListener('DOMContentLoaded', () => {
  searchInput    = document.getElementById('search-input');
  inlineResults  = document.getElementById('inline-search-results');

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

/* ----------- FETCHERS ------------ */
async function fetchTrendingMovies() {
  const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
  const data = await res.json();
  trendingBanners = data.results.filter(m => m.backdrop_path);

  if (trendingBanners.length) {
    displayBanner(trendingBanners[0]);
    setInterval(() => {
      bannerIndex = (bannerIndex + 1) % trendingBanners.length;
      displayBanner(trendingBanners[bannerIndex]);
    }, 10000);
  }
}

async function fetchMovies() {
  const res = await fetch(`${BASE_URL}/movie/popular?api_key=${API_KEY}`);
  displayList((await res.json()).results, 'movies-list');
}

async function fetchTVShows() {
  const res = await fetch(`${BASE_URL}/tv/popular?api_key=${API_KEY}`);
  displayList((await res.json()).results, 'tvshows-list');
}

async function fetchAnime() {
  let all = [];
  for (let p = 1; p <= 3; p++) {
    const r  = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${p}`);
    const d  = await r.json();
    all = all.concat(d.results.filter(it =>
      it.original_language === 'ja' && it.genre_ids.includes(16)
    ));
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

    const card = document.createElement('div');
    card.className = 'media-card';

    const img = document.createElement('img');
    img.src = IMG_URL + it.poster_path;
    img.alt = it.title || it.name;
    img.onclick = () => showDetails(it);

    const title = document.createElement('p');
    title.className = 'media-title';
    title.textContent = it.title || it.name;

    const download = document.createElement('a');
    download.textContent = 'Download';
    download.className = 'download-btn';
    download.style.display = 'none';
    download.target = '_blank';

    const type = it.first_air_date ? 'tv' : 'movie';
    const manualLink = manualDownloads[it.id];
    if (manualLink) {
      download.href = manualLink;
      download.style.display = 'inline-block';
    } else {
      fetch(`https://apimocine.vercel.app/${type}/${it.id}`)
        .then(res => res.json())
        .then(data => {
          const dl = data?.media?.sources?.[0]?.url;
          if (dl) {
            download.href = dl;
            download.style.display = 'inline-block';
          }
        })
        .catch(() => {});
    }

    card.appendChild(img);
    card.appendChild(title);
    card.appendChild(download);
    wrap.appendChild(card);
  });
}

/* ----------- BANNER ------------- */
function displayBanner(movie) {
  document.getElementById('banner').style.backgroundImage =
    `url(${IMG_URL + movie.backdrop_path})`;
  document.getElementById('banner-title').textContent       = movie.title;
  document.getElementById('banner-description').textContent = movie.overview || '';
  const watchUrl = `watch.html?id=${movie.id}&type=movie&title=${encodeURIComponent(movie.title)}`;
  document.getElementById('banner-watch-btn').href = watchUrl;
}

/* ----------- MODAL --------------- */
async function showDetails(item) {
  const modal = document.getElementById('detail-modal');
  document.getElementById('detail-title').textContent       = item.title || item.name;
  document.getElementById('detail-description').textContent = item.overview || '';
  document.getElementById('detail-poster').src              = IMG_URL + item.poster_path;

  const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const watchURL = `watch.html?id=${item.id}&type=${type}&title=${encodeURIComponent(item.title || item.name)}`;
  document.getElementById('watch-now-btn').href = watchURL;

  const downloadBtn = document.getElementById('download-btn');
  if (downloadBtn) {
    let dl = manualDownloads[item.id];
    if (dl) {
      downloadBtn.href = dl;
      downloadBtn.style.display = 'inline-block';
    } else {
      try {
        const res = await fetch(`https://apimocine.vercel.app/${type}/${item.id}`);
        const data = await res.json();
        dl = data?.media?.sources?.[0]?.url;
        if (dl) {
          downloadBtn.href = dl;
          downloadBtn.style.display = 'inline-block';
        } else {
          downloadBtn.style.display = 'none';
        }
      } catch (err) {
        console.error('Download link fetch error:', err);
        downloadBtn.style.display = 'none';
      }
    }
  }

  modal.style.display = 'flex';
  saveToWatchHistory({ id: item.id, title: item.title || item.name, poster: IMG_URL + item.poster_path });
}

function closeModal() {
  document.getElementById('detail-modal').style.display = 'none';
  if (inlineResults) inlineResults.style.display = 'none';
}

/* ----------- SEARCH -------------- */
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
  if (!searchInput) return;
  searchInput.value = '';
  inlineResults.style.display = 'none';
  inlineResults.innerHTML = '';
}

document.addEventListener('click', e => {
  if (
    !e.target.closest('.search-wrapper') &&
    !e.target.closest('#inline-search-results')
  ) {
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

window.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
});
