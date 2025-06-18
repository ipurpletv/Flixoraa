document.addEventListener('DOMContentLoaded', () => {
    // --- API and Core Variables ---
    const API_KEY = 'ba0e2f64d29bae320cf0bbd091bbdf3f';
    const BASE_URL = 'https://api.themoviedb.org/3';
    const IMG_URL = 'https://image.tmdb.org/t/p/original';
    let currentItem;

    // --- Element Selectors ---
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const sidebar = document.getElementById('sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const overlay = document.getElementById('overlay');
    const watchNowBtn = document.getElementById('watch-now-btn');

    // --- Fetching Functions ---
    async function fetchTrending(type) {
        try {
            const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            const data = await res.json();
            return data.results;
        } catch (error) {
            console.error(`Error fetching trending ${type}:`, error);
            return []; // Return an empty array on error to prevent crashing
        }
    }

    async function fetchTrendingAnime() {
        try {
            let allResults = [];
            for (let page = 1; page <= 3; page++) {
                const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
                if (!res.ok) break; // Stop if a page fetch fails
                const data = await res.json();
                const filtered = data.results.filter(item =>
                    item.original_language === 'ja' && item.genre_ids.includes(16)
                );
                allResults = allResults.concat(filtered);
            }
            return allResults;
        } catch (error) {
            console.error('Error fetching trending anime:', error);
            return []; // Return an empty array on error
        }
    }

    // --- Display Functions ---
    function displayBanner(item) {
        if (!item || !item.backdrop_path) {
             console.warn("Could not display banner: invalid item provided.");
             return;
        }
        document.getElementById('banner').style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
        document.getElementById('banner-title').textContent = item.title || item.name;
    }

    function displayList(items, containerId, mediaType) {
        const container = document.getElementById(containerId);
        if (!container) return; // Safety check
        container.innerHTML = '';
        items.forEach(item => {
            if (!item.poster_path) return; // Skip items without a poster
            const img = document.createElement('img');
            img.src = `https://image.tmdb.org/t/p/w500${item.poster_path}`; // Use w500 for faster loading
            img.alt = item.title || item.name;
            img.onclick = () => showDetails(item, mediaType);
            container.appendChild(img);
        });
    }

    // --- Modal and Details Logic ---
    function showDetails(item, mediaType) {
        currentItem = item;
        currentItem.media_type = item.media_type || mediaType;

        document.getElementById('modal-title').textContent = item.title || item.name;
        document.getElementById('modal-description').textContent = item.overview;
        document.getElementById('modal-image').src = `https://image.tmdb.org/t/p/w500${item.poster_path}`;
        
        const rating = Math.round(item.vote_average / 2);
        document.getElementById('modal-rating').innerHTML = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        
        document.getElementById('modal').style.display = 'flex';
    }

    // Making functions globally available for HTML onclick attributes
    window.closeModal = function() {
        document.getElementById('modal').style.display = 'none';
    }

    window.openSearchModal = function() {
        document.getElementById('search-modal').style.display = 'flex';
        document.getElementById('search-input').focus();
    }

    window.closeSearchModal = function() {
        document.getElementById('search-modal').style.display = 'none';
        document.getElementById('search-results').innerHTML = '';
    }

    window.searchTMDB = async function() {
        const query = document.getElementById('search-input').value;
        if (!query.trim()) {
            document.getElementById('search-results').innerHTML = '';
            return;
        }

        try {
            const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
            const data = await res.json();
            const container = document.getElementById('search-results');
            container.innerHTML = '';
            data.results.forEach(item => {
                if (!item.poster_path || (item.media_type !== "movie" && item.media_type !== "tv")) return;
                const img = document.createElement('img');
                img.src = `https://image.tmdb.org/t/p/w200${item.poster_path}`;
                img.alt = item.title || item.name;
                img.onclick = () => {
                    closeSearchModal();
                    showDetails(item, item.media_type);
                };
                container.appendChild(img);
            });
        } catch (error) {
            console.error('Error during search:', error);
        }
    }

    // --- NEW Feature Logic ---

    // Hamburger Menu
    function closeMenu() {
        sidebar.style.left = '-250px';
        overlay.style.display = 'none';
    }
    hamburgerMenu.addEventListener('click', () => {
        sidebar.style.left = '0';
        overlay.style.display = 'block';
    });
    closeSidebarBtn.addEventListener('click', closeMenu);
    overlay.addEventListener('click', closeMenu);

    // "Watch Now" Button
    watchNowBtn.addEventListener('click', () => {
        if (currentItem && currentItem.id && currentItem.media_type) {
            window.location.href = `watch.html?type=${currentItem.media_type}&id=${currentItem.id}`;
        } else {
            console.error("Cannot watch: Media details are missing.", currentItem);
        }
    });

    // Carousel Arrows
    function setupCarousel(listId, leftArrowId, rightArrowId) {
        const list = document.getElementById(listId);
        const leftArrow = document.getElementById(leftArrowId);
        const rightArrow = document.getElementById(rightArrowId);
        if (list && leftArrow && rightArrow) {
            const scrollAmount = list.clientWidth * 0.8;
            leftArrow.addEventListener('click', () => list.scrollBy({ left: -scrollAmount, behavior: 'smooth' }));
            rightArrow.addEventListener('click', () => list.scrollBy({ left: scrollAmount, behavior: 'smooth' }));
        }
    }

    // --- Initialization Function ---
    async function init() {
        const [movies, tvShows, anime] = await Promise.all([
            fetchTrending('movie'),
            fetchTrending('tv'),
            fetchTrendingAnime()
        ]);
        
        // **FIXED:** Only display banner if movies were successfully fetched
        if (movies && movies.length > 0) {
            displayBanner(movies[Math.floor(Math.random() * movies.length)]);
        }

        displayList(movies, 'movies-list', 'movie');
        displayList(tvShows, 'tvshows-list', 'tv');
        displayList(anime, 'anime-list', 'tv');

        setupCarousel('movies-list', 'movies-left-arrow', 'movies-right-arrow');
        setupCarousel('tvshows-list', 'tv-left-arrow', 'tv-right-arrow');
        setupCarousel('anime-list', 'anime-left-arrow', 'anime-right-arrow');
    }

    init();
});
