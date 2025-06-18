// ==== SEARCH MODAL ====
const searchModal = document.getElementById('search-modal');
const searchBtn = document.getElementById('search-btn');
const closeSearchBtn = document.getElementById('close-search');
const searchInput = document.getElementById('search-input');

// Open Search Modal
searchBtn.addEventListener('click', () => {
  searchModal.style.display = 'flex';
  searchInput.focus();
});

// Close Search Modal
closeSearchBtn.addEventListener('click', () => {
  searchModal.style.display = 'none';
  searchInput.value = '';
  document.getElementById('results').innerHTML = '';
});

// Search Functionality (sample logic)
searchInput.addEventListener('input', async () => {
  const query = searchInput.value.trim();
  const resultsContainer = document.getElementById('results');
  resultsContainer.innerHTML = '';

  if (query.length < 2) return;

  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=YOUR_API_KEY&query=${query}`);
    const data = await res.json();

    data.results.forEach(movie => {
      const div = document.createElement('div');
      div.innerHTML = `
        <div style="display: flex; align-items: center; gap: 1rem;">
          <img src="https://image.tmdb.org/t/p/w92${movie.poster_path}" alt="${movie.title}" />
          <span>${movie.title}</span>
        </div>
      `;
      resultsContainer.appendChild(div);
    });
  } catch (err) {
    resultsContainer.innerHTML = `<p style="color:red;">Error loading results.</p>`;
  }
});

// ==== WATCH HISTORY MODAL ====
const historyBtn = document.getElementById('history-btn');
const historyModal = document.getElementById('history-modal');
const closeHistoryBtn = document.getElementById('close-history');

// Open Watch History Modal
historyBtn.addEventListener('click', () => {
  historyModal.style.display = 'flex';
  loadWatchHistory();
});

// Close Watch History Modal
closeHistoryBtn.addEventListener('click', () => {
  historyModal.style.display = 'none';
});

// Example function to load history (mocked for now)
function loadWatchHistory() {
  const container = document.getElementById('watch-history-container');
  container.innerHTML = '';

  // Simulate some history
  const mockHistory = [
    { title: 'The Batman', image: 'https://image.tmdb.org/t/p/w92/b0PlSFdDwbyK0cf5RxwDpaOJQvQ.jpg' },
    { title: 'Inception', image: 'https://image.tmdb.org/t/p/w92/qmDpIHrmpJINaRKAfWQfftjCdyi.jpg' }
  ];

  mockHistory.forEach(item => {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.gap = '1rem';
    div.style.marginBottom = '1rem';

    div.innerHTML = `
      <img src="${item.image}" alt="${item.title}" />
      <span>${item.title}</span>
    `;
    container.appendChild(div);
  });
}

// ==== ESC KEY TO CLOSE MODALS ====
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    searchModal.style.display = 'none';
    historyModal.style.display = 'none';
  }
});
