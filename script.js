// --------------  INSERT YOUR KEY BELOW  --------------
const apiKey = 'b139bc417606842811f1526ae92572bc';
// -----------------------------------------------------

document.getElementById('loadBtn').addEventListener('click', loadMovies);

const movieList = document.getElementById('movieList');
const modal      = document.getElementById('modal');
const modalBody  = document.getElementById('modalBody');
document.getElementById('closeModal').onclick = () => modal.style.display = 'none';
window.onclick = e => (e.target === modal) && (modal.style.display = 'none');

async function loadMovies() {
  const inputText = document.getElementById('input').value.trim();
  if (!inputText) return alert('Please paste at least one IMDb URL.');
  movieList.innerHTML = '';

  for (const line of inputText.split('\n')) {
    if (!line.trim()) continue;

    const [imdbUrl, streamUrl] = line.split('|').map(s => s.trim());
    const imdbMatch = imdbUrl.match(/tt\d{7,}/);
    if (!imdbMatch) continue;
    const imdbId = imdbMatch[0];

    try {
      const findData = await fetchJSON(
        `https://api.themoviedb.org/3/find/${imdbId}?api_key=${apiKey}&external_source=imdb_id`
      );
      const movie = findData.movie_results?.[0];
      if (!movie) continue;

      const detail = await fetchJSON(
        `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${apiKey}&language=en-US`
      );

      renderCard({ ...movie, ...detail }, streamUrl);
    } catch (err) { console.error(err); }
  }
}

function renderCard(movie, streamUrl) {
  const poster = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Image';

  const card = document.createElement('div');
  card.className = 'card';
  card.innerHTML = `
    <img src="${poster}" alt="${movie.title}">
    <div class="card-overlay">
      <h4>${movie.title}</h4>
      <div class="rating"><i class="fa-solid fa-star"></i> ${movie.vote_average?.toFixed(1) || 'N/A'}</div>
    </div>`;
  card.onclick = () => openModal(movie, streamUrl, poster);
  movieList.appendChild(card);
}

function openModal(movie, streamUrl, poster) {
  modalBody.innerHTML = `
    <div class="modal-poster"><img src="${poster}" alt="${movie.title}" style="width:100%;border-radius:var(--radius)"></div>
    <div class="modal-body">
      <h2>${movie.title} (${movie.release_date?.slice(0,4) || ''})</h2>
      <p><strong>Rating:</strong> ${movie.vote_average?.toFixed(1) || 'N/A'} / 10</p>
      <p><strong>Runtime:</strong> ${movie.runtime || '—'} min</p>
      <p><strong>Genres:</strong> ${movie.genres?.map(g=>g.name).join(', ') || '—'}</p>
      <p>${movie.overview}</p>
      <a class="watch-btn" href="watch.html?title=${encodeURIComponent(movie.title)}&src=${encodeURIComponent(streamUrl)}" target="_blank">
        <i class="fa-solid fa-circle-play"></i>  Watch
      </a>
    </div>`;
  modal.style.display = 'flex';
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}
