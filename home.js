document.addEventListener('DOMContentLoaded', () => {
    // --- Your Existing API and Core Variables ---
    const API_KEY = 'ba0e2f64d29bae320cf0bbd091bbdf3f';
    const BASE_URL = 'https://api.themoviedb.org/3';
    const IMG_URL = 'https://image.tmdb.org/t/p/original';
    let currentItem;

    // --- NEW: Element Selectors for New Features ---
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const sidebar = document.getElementById('sidebar');
    const closeSidebarBtn = document.getElementById('close-sidebar');
    const overlay = document.getElementById('overlay');
    const watchNowBtn = document.getElementById('watch-now-btn');

    // --- Your Existing Fetching Functions (Unchanged) ---
    async function fetchTrending(type) {
        const res = await fetch(`${BASE_URL}/trending/${type}/week?api_key=${API_KEY}`);
        const data = await res.json();
        return data.results;
    }

    async function fetchTrendingAnime() {
        let allResults = [];
        // Fetch from multiple pages to get more anime
        for (let page = 1; page <= 3; page++) {
            const res = await fetch(`${BASE_URL}/trending/tv/week?api_key=${API_KEY}&page=${page}`);
            const data = await res.json();
            const filtered = data.results.filter(item =>
                item.original_language === 'ja' && item.genre_ids.includes(16)
            );
            allResults = allResults.concat(filtered);
        }
        return allResults;
    }

    // --- Your Existing Display Functions (Unchanged) ---
    function displayBanner(item) {
        document.getElementById('banner').style.backgroundImage = `url(${IMG_URL}${item.backdrop_path})`;
        document.getElementById('banner-title').textContent = item.title || item.name;
    }

    function displayList(items, containerId, mediaType) {
        const container = document.getElementById(containerId);
        container.innerHTML = '';
        items.forEach(item => {
            const img = document.createElement('img');
            img.src = `${IMG_URL}${item.poster_path}`;
            img.alt = item.title || item.name;
            // Pass the mediaType to showDetails
            img.onclick = () => showDetails(item, mediaType);
            container.appendChild(img);
        });
    }

    // --- UPDATED: showDetails Function ---
    // Now it only populates the modal, it does not handle the video player.
    function showDetails(item, mediaType) {
        currentItem = item;
        // Explicitly set the media type for the "Watch Now" button
        currentItem.media_type = item.media_type || mediaType; 
        
        document.getElementById('modal-title').textContent = item.title || item.name;
        document.getElementById('modal-description').textContent = item.overview;
        document.getElementById('modal-image').src = `${IMG_URL}${item.poster_path}`;
        
        const rating = Math.round(item.vote_average / 2);
        document.getElementById('modal-rating').innerHTML = '★'.repeat(rating) + '☆'.repeat(5 - rating);
        
        document.getElementById('modal').style.display = 'flex';
    }
    
    // --- REMOVED: changeServer Function ---
    // This logic has been moved to watch.js

    // --- UPDATED: closeModal Function ---
    // No longer needs to clear the video src.
    window.closeModal = function() {
        document.getElementById('modal').style.display = 'none';
    }

    // --- Your Existing Search Functions (Slightly modified to pass mediaType) ---
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

        const res = await fetch(`${BASE_URL}/search/multi?api_key=${API_KEY}&query=${query}`);
        const data = await res.json();

        const container = document.getElementById('search-results');
        container.innerHTML = '';
        data.results.forEach(item => {
            if (!item.poster_path || (item.media_type !== "movie" && item.media_type !== "tv")) return;
            const img = document.createElement('img');
            img.src = `${IMG_URL}${item.poster_path}`;
            img.alt = item.title || item.name;
            img.onclick = () => {
                closeSearchModal();
                showDetails(item, item.media_type); // Pass media_type here
            };
            container.appendChild(img);
        });
    }

    // --- NEW: Hamburger Menu Logic ---
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


    // --- NEW: "Watch Now" Button Logic ---
    watchNowBtn.addEventListener('click', () => {
        if (currentItem && currentItem.id && currentItem.media_type) {
            // Redirect to the watch page with type and id
            window.location.href = `watch.html?type=${currentItem.media_type}&id=${currentItem.id}`;
        } else {
            console.error("Cannot watch: Media details are missing.", currentItem);
            alert("Sorry, there was an error. Please try again.");
        }
    });


    // --- NEW: Carousel Arrow Logic ---
    function setupCarousel(listId, leftArrowId, rightArrowId) {
        const list = document.getElementById(listId);
        const leftArrow = document.getElementById(leftArrowId);
        const rightArrow = document.getElementById(rightArrowId);
        // Ensure elements exist before adding listeners
        if (list && leftArrow && rightArrow) {
            const scrollAmount = list.clientWidth * 0.8; // Scroll 80% of the visible width
            leftArrow.addEventListener('click', () => {
                list.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });
            rightArrow.addEventListener('click', () => {
                list.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
        }
    }

    // --- UPDATED: init Function to call new logic ---
    async function init() {
        // Fetch all data
        const movies = await fetchTrending('movie');
        const tvShows = await fetchTrending('tv');
        const anime = await fetchTrendingAnime();

        // Display content
        displayBanner(movies[Math.floor(Math.random() * movies.length)]);
        displayList(movies, 'movies-list', 'movie'); // Pass 'movie' as mediaType
        displayList(tvShows, 'tvshows-list', 'tv'); // Pass 'tv' as mediaType
        displayList(anime, 'anime-list', 'tv');     // Anime is also 'tv'

        // Set up the carousels after content is loaded
        setupCarousel('movies-list', 'movies-left-arrow', 'movies-right-arrow');
        setupCarousel('tvshows-list', 'tv-left-arrow', 'tv-right-arrow');
        setupCarousel('anime-list', 'anime-left-arrow', 'anime-right-arrow');
    }

    // Run the app
    init();
});
