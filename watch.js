document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const mediaType = params.get('type');
    const mediaId = params.get('id');
    
    const iframe = document.getElementById('video-iframe');
    const serverSelector = document.getElementById('server');
    const titleElement = document.getElementById('media-title');

    if (!mediaType || !mediaId) {
        titleElement.textContent = 'Error: Media ID not found.';
        return;
    }

    // You can optionally fetch the media title from TMDB again for a better UX
    // For now, let's just set a generic title
    titleElement.textContent = `Now Playing...`;

    function updateIframeSource() {
        const selectedServer = serverSelector.value;
        let videoUrl = '';

        // Construct the URL based on the selected server
        if (selectedServer === 'vidsrc.me' || selectedServer === 'vidsrc.cc') {
            videoUrl = `https://${selectedServer}/embed/${mediaType}/${mediaId}`;
        } else if (selectedServer === 'player.videasy.net') {
            videoUrl = `https://${selectedServer}/player.php?tmdb=${mediaId}`;
        }
        
        iframe.src = videoUrl;
    }

    // Set the initial IFrame source
    updateIframeSource();

    // Add event listener to update the source when the server changes
    serverSelector.addEventListener('change', updateIframeSource);
});
