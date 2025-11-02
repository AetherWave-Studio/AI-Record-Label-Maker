// Enhanced Randomly Tiled Background System with Dynamic Media Library
class TiledBackground {
    constructor() {
        this.tiles = [];
        this.container = null;
        this.mediaLibrary = this.initMediaLibrary();
        this.tileConfigs = this.generateTileConfigs();
        this.autoRotateEnabled = true; // Enable auto-rotation
        this.rotateInterval = 8000; // Rotate every 8 seconds
        this.rotationTimer = null;
        this.init();
    }

    initMediaLibrary() {
        return {
            // IMAGES - Add your image URLs here - EASY TO UPDATE!
            images: [
                'https://firebasestorage.googleapis.com/v0/b/aetherwave-playlists.firebasestorage.app/o/global-assets%2FLogo-SilverAlloy-Loop-1_1761279396703.gif?alt=media&token=57eb7fe9-fcd8-42fe-a845-b80a0347e2ad',
                'https://firebasestorage.googleapis.com/v0/b/aetherwave-playlists.firebasestorage.app/o/Media%20to%20Showcase%2Faetherwave-backstage%20(2).png?alt=media&token=a975bc23-a23c-4174-8295-aed5e4d59ab0',
                'https://firebasestorage.googleapis.com/v0/b/aetherwave-playlists.firebasestorage.app/o/global-assets%2Faws-banner_1761542850665.png?alt=media&token=fe7db850-1c11-4f93-a04d-2f5ac6678133',
				'https://firebasestorage.googleapis.com/v0/b/aetherwave-playlists.firebasestorage.app/o/Media%20to%20Showcase%2FGhosts_Backstage.png?alt=media&token=77643daa-8844-4c60-9682-7bb2d28f5b7d',
				
                // Add more image URLs here...
            ],

            // VIDEOS - Add your video URLs here - EASY TO UPDATE!
            videos: [
                'https://firebasestorage.googleapis.com/v0/b/aetherwave-playlists.firebasestorage.app/o/Media%20to%20Showcase%2FCornell_guy-2.mp4?alt=media&token=e7ab0795-a0d8-4b9c-a421-09b62a4c5f79',
				'https://firebasestorage.googleapis.com/v0/b/aetherwave-playlists.firebasestorage.app/o/Media%20to%20Showcase%2FBlonde_Ignores.mp4?alt=media&token=30e6a38d-5abe-476f-abf4-b728f2d499b1',
				'https://firebasestorage.googleapis.com/v0/b/aetherwave-playlists.firebasestorage.app/o/Media%20to%20Showcase%2F1e340f9b-dcc8-42a1-8448-cdf770edc5c6.mp4?alt=media&token=58d54ddd-fc26-4ee2-b86a-25ad6dcdaeac',
				'https://firebasestorage.googleapis.com/v0/b/aetherwave-playlists.firebasestorage.app/o/Media%20to%20Showcase%2Fgrok_video_2025-10-31-08-56-36.mp4?alt=media&token=bbf89f13-20e5-4553-9233-f00c78b5839a',
                '2025-11-02T11-52-07_the_ball_spins.mp4',
                // Add more video URLs here...
            ],

            // GRADIENTS - Color schemes for gradient tiles
            gradients: [
                'linear-gradient(135deg, #ff2ea6 0%, #8b5cf6 100%)',
                'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                'linear-gradient(225deg, #ff2ea6 0%, #667eea 100%)',
                'linear-gradient(135deg, #8b5cf6 0%, #764ba2 100%)',
                'radial-gradient(circle, #ff2ea6 0%, transparent 70%)',
                'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
                'radial-gradient(circle, #667eea 0%, transparent 70%)',
                'conic-gradient(from 45deg, #ff2ea6, #8b5cf6, #667eea, #ff2ea6)',
                // Add more gradient patterns here...
            ],

            // SHAPES - Available shapes
            shapes: ['circle', 'triangle', 'hexagon', 'square', 'pentagon', 'star'],

            // COLORS - Brand colors for shapes and accents
            colors: [
                '#ff2ea6', '#8b5cf6', '#667eea', '#764ba2',
                '#f59e0b', '#10b981', '#ef4444', '#3b82f6',
                // Add more colors here...
            ],

            // CONFIGURATIONS - Different tile configurations
            sizeConfigs: {
                tiny: [20, 30, 40],
                small: [40, 60, 80],
                medium: [80, 120, 160],
                large: [120, 180, 240],
                extraLarge: [180, 240, 300]
            },

            animationConfigs: {
                slow: [25, 35, 45],
                medium: [15, 25, 35],
                fast: [10, 15, 20],
                veryFast: [5, 10, 15]
            },

            opacityConfigs: {
                subtle: [0.05, 0.15],
                medium: [0.1, 0.3],
                prominent: [0.2, 0.4]
            }
        };
    }

    generateTileConfigs() {
        return [
            // Dynamic Image tiles - will rotate through all images
            {
                type: 'image',
                getMedia: () => this.getRandomMedia('images'),
                sizes: [...this.mediaLibrary.sizeConfigs.small, ...this.mediaLibrary.sizeConfigs.medium],
                animationDuration: [...this.mediaLibrary.animationConfigs.medium, ...this.mediaLibrary.animationConfigs.slow],
                opacityRange: this.mediaLibrary.opacityConfigs.subtle
            },
            // Dynamic Video tiles - will rotate through all videos
            {
                type: 'video',
                getMedia: () => this.getRandomMedia('videos'),
                sizes: [...this.mediaLibrary.sizeConfigs.medium, ...this.mediaLibrary.sizeConfigs.large],
                animationDuration: [...this.mediaLibrary.animationConfigs.medium],
                opacityRange: this.mediaLibrary.opacityConfigs.medium
            },
            // Dynamic Gradient tiles - will rotate through all gradients
            {
                type: 'gradient',
                getMedia: () => this.getRandomMedia('gradients'),
                sizes: [...this.mediaLibrary.sizeConfigs.small, ...this.mediaLibrary.sizeConfigs.medium, ...this.mediaLibrary.sizeConfigs.large],
                animationDuration: [...this.mediaLibrary.animationConfigs.slow, ...this.mediaLibrary.animationConfigs.medium],
                opacityRange: this.mediaLibrary.opacityConfigs.subtle
            },
            // Dynamic Shape tiles - will rotate through shapes and colors
            {
                type: 'shape',
                getMedia: () => ({
                    shape: this.getRandomMedia('shapes'),
                    color: this.getRandomMedia('colors')
                }),
                sizes: this.mediaLibrary.sizeConfigs.small,
                animationDuration: this.mediaLibrary.animationConfigs.slow,
                opacityRange: this.mediaLibrary.opacityConfigs.medium
            }
        ];
    }

    getRandomMedia(mediaType) {
        const mediaArray = this.mediaLibrary[mediaType];
        if (!mediaArray || mediaArray.length === 0) {
            console.warn(`No media found for type: ${mediaType}`);
            return null;
        }
        return mediaArray[Math.floor(Math.random() * mediaArray.length)];
    }

    // ========== EASY METHODS TO ADD NEW MEDIA ==========

    // Add single image or array of images
    addImages(imageUrls) {
        if (Array.isArray(imageUrls)) {
            this.mediaLibrary.images.push(...imageUrls);
        } else {
            this.mediaLibrary.images.push(imageUrls);
        }
        console.log(`Added ${Array.isArray(imageUrls) ? imageUrls.length : 1} image(s) to background`);
        this.regenerateTiles();
    }

    // Add single video or array of videos
    addVideos(videoUrls) {
        if (Array.isArray(videoUrls)) {
            this.mediaLibrary.videos.push(...videoUrls);
        } else {
            this.mediaLibrary.videos.push(videoUrls);
        }
        console.log(`Added ${Array.isArray(videoUrls) ? videoUrls.length : 1} video(s) to background`);
        this.regenerateTiles();
    }

    // Add single gradient or array of gradients
    addGradients(gradients) {
        if (Array.isArray(gradients)) {
            this.mediaLibrary.gradients.push(...gradients);
        } else {
            this.mediaLibrary.gradients.push(gradients);
        }
        console.log(`Added ${Array.isArray(gradients) ? gradients.length : 1} gradient(s) to background`);
        this.regenerateTiles();
    }

    // Add colors for shapes
    addColors(colors) {
        if (Array.isArray(colors)) {
            this.mediaLibrary.colors.push(...colors);
        } else {
            this.mediaLibrary.colors.push(colors);
        }
        this.regenerateTiles();
    }

    // ========== REST OF THE ORIGINAL CODE ==========

    init() {
        this.createContainer();
        this.generateTiles();
        this.startAnimations();
        this.startAutoRotation();
        this.handleResize();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'tiled-background';
        this.container.id = 'tiled-background';

        // Insert at the beginning of body
        document.body.insertBefore(this.container, document.body.firstChild);
    }

    generateTiles() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const tileSize = 200; // Base tile size
        const cols = Math.ceil(viewportWidth / tileSize) + 2;
        const rows = Math.ceil(viewportHeight / tileSize) + 2;
        const totalTiles = cols * rows;

        // Generate tiles based on viewport size
        const numTiles = Math.min(totalTiles, 30 + Math.floor(totalTiles * 0.3));

        for (let i = 0; i < numTiles; i++) {
            this.createTile(i);
        }
    }

    createTile(index) {
        const config = this.tileConfigs[Math.floor(Math.random() * this.tileConfigs.length)];
        const tile = document.createElement('div');
        tile.className = `tile tile-${config.type}`;
        tile.dataset.index = index;

        // Random size
        const size = config.sizes[Math.floor(Math.random() * config.sizes.length)];
        tile.style.width = `${size}px`;
        tile.style.height = `${size}px`;

        // Random position
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        tile.style.left = `${x}px`;
        tile.style.top = `${y}px`;

        // Random opacity
        const opacity = this.randomBetween(config.opacityRange[0], config.opacityRange[1]);
        tile.style.opacity = opacity;

        // Random animation duration
        const animDuration = config.animationDuration[Math.floor(Math.random() * config.animationDuration.length)];
        tile.style.animationDuration = `${animDuration}s`;

        // Apply content based on type
        this.applyTileContent(tile, config, size);

        // Random rotation
        const rotation = Math.random() * 360;
        tile.style.transform = `rotate(${rotation}deg)`;

        // Add hover effect
        tile.addEventListener('mouseenter', () => this.onTileHover(tile));
        tile.addEventListener('mouseleave', () => this.onTileLeave(tile));

        this.container.appendChild(tile);
        this.tiles.push(tile);
    }

    applyTileContent(tile, config, size) {
        const media = config.getMedia();
        if (!media) return;

        switch (config.type) {
            case 'image':
                const img = document.createElement('img');
                img.src = media;
                img.alt = 'Background tile';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                img.style.borderRadius = 'inherit';
                img.loading = 'lazy';
                tile.appendChild(img);
                tile.style.borderRadius = '12px';
                break;

            case 'video':
                const video = document.createElement('video');
                video.src = media;
                video.autoplay = true;
                video.loop = true;
                video.muted = true;
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.objectFit = 'cover';
                video.style.borderRadius = 'inherit';
                tile.appendChild(video);
                tile.style.borderRadius = '12px';
                break;

            case 'gradient':
                tile.style.background = media;
                tile.style.borderRadius = '20px';
                break;

            case 'shape':
                this.createShape(tile, media.shape, media.color, size);
                break;
        }
    }

    createShape(tile, shape, color, size) {
        tile.style.background = color;

        switch (shape) {
            case 'circle':
                tile.style.borderRadius = '50%';
                break;
            case 'triangle':
                tile.style.width = '0';
                tile.style.height = '0';
                tile.style.borderLeft = `${size/2}px solid transparent`;
                tile.style.borderRight = `${size/2}px solid transparent`;
                tile.style.borderBottom = `${size}px solid ${color}`;
                tile.style.background = 'transparent';
                break;
            case 'hexagon':
                tile.style.clipPath = 'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)';
                break;
            case 'square':
                tile.style.borderRadius = '8px';
                break;
            case 'pentagon':
                tile.style.clipPath = 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
                break;
            case 'star':
                tile.style.clipPath = 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)';
                break;
        }
    }

    onTileHover(tile) {
        tile.style.transform = `${tile.style.transform} scale(1.1)`;
        tile.style.transition = 'transform 0.3s ease, opacity 0.3s ease';
        tile.style.opacity = Math.min(parseFloat(tile.style.opacity) + 0.2, 0.8);
        tile.style.zIndex = '100';
    }

    onTileLeave(tile) {
        tile.style.transform = tile.style.transform.replace(' scale(1.1)', '');
        tile.style.opacity = tile.dataset.originalOpacity || tile.style.opacity;
        tile.style.zIndex = '';
    }

    startAnimations() {
        // Add floating animation to tiles
        this.tiles.forEach((tile, index) => {
            setTimeout(() => {
                tile.classList.add('tile-animate');
            }, index * 100); // Stagger the animations
        });
    }

    handleResize() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.regenerateTiles();
            }, 250);
        });
    }

    regenerateTiles() {
        // Clear existing tiles
        this.tiles.forEach(tile => tile.remove());
        this.tiles = [];

        // Generate new tiles
        this.generateTiles();
        setTimeout(() => this.startAnimations(), 100);
    }

    randomBetween(min, max) {
        return Math.random() * (max - min) + min;
    }

    // Add a custom tile configuration
    addTileConfig(config) {
        this.tileConfigs.push(config);
        this.regenerateTiles();
    }

    // ========== AUTO-ROTATION FEATURES ==========

  startAutoRotation() {
        if (!this.autoRotateEnabled) return;

        this.rotationTimer = setInterval(() => {
            this.rotateRandomTiles();
        }, this.rotateInterval);

        console.log(`Auto-rotation started: Changing tiles every ${this.rotateInterval/1000} seconds`);
    }

  stopAutoRotation() {
        if (this.rotationTimer) {
            clearInterval(this.rotationTimer);
            this.rotationTimer = null;
            console.log('Auto-rotation stopped');
        }
    }

  rotateRandomTiles() {
        // Rotate 20-40% of tiles each rotation
        const numTilesToRotate = Math.ceil(this.tiles.length * (0.2 + Math.random() * 0.2));
        const tilesToRotate = this.getRandomTiles(numTilesToRotate);

        tilesToRotate.forEach((tile, index) => {
            setTimeout(() => {
                this.rotateSingleTile(tile);
            }, index * 200); // Stagger the rotations
        });
    }

  getRandomTiles(count) {
        const shuffled = [...this.tiles].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

  rotateSingleTile(tile) {
        // Add fade out effect
        tile.style.transition = 'opacity 0.5s ease';
        tile.style.opacity = '0';

        setTimeout(() => {
            // Get new configuration and update tile
            const config = this.tileConfigs[Math.floor(Math.random() * this.tileConfigs.length)];
            this.updateTileContent(tile, config);

            // Fade back in
            tile.style.opacity = tile.dataset.originalOpacity || '0.2';
        }, 500);
    }

  updateTileContent(tile, config) {
        // Clear existing content
        tile.innerHTML = '';
        tile.className = `tile tile-${config.type}`;

        // Get new size and properties
        const size = config.sizes[Math.floor(Math.random() * config.sizes.length)];
        const opacity = this.randomBetween(config.opacityRange[0], config.opacityRange[1]);
        const animDuration = config.animationDuration[Math.floor(Math.random() * config.animationDuration.length)];
        const rotation = Math.random() * 360;

        // Update tile properties
        tile.style.width = `${size}px`;
        tile.style.height = `${size}px`;
        tile.style.opacity = opacity;
        tile.dataset.originalOpacity = opacity;
        tile.style.animationDuration = `${animDuration}s`;
        tile.style.transform = `rotate(${rotation}deg)`;

        // Apply new content
        this.applyTileContent(tile, config, size);
    }

  // Control methods for auto-rotation
  enableAutoRotation(interval = 8000) {
        this.autoRotateEnabled = true;
        this.rotateInterval = interval;
        this.stopAutoRotation(); // Stop existing timer
        this.startAutoRotation();
    }

  disableAutoRotation() {
        this.autoRotateEnabled = false;
        this.stopAutoRotation();
  }

  setRotationInterval(interval) {
        this.rotateInterval = interval;
        if (this.autoRotateEnabled) {
            this.stopAutoRotation();
            this.startAutoRotation();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.tiledBackground = new TiledBackground();
    console.log('Tiled background initialized with dynamic media library');

    // Add exit portal to AetherWave pages
    addExitPortal();
});

// Make it globally available
window.TiledBackground = TiledBackground;

// Add exit portal to return to Ghost Musician profile
function addExitPortal() {
    // Check if we're on an AetherWave page (not Ghost Musician)
    const isAetherWavePage = window.location.pathname.startsWith('/static/') ||
                            window.location.pathname === '/static/' ||
                            window.location.pathname.includes('virtual-artists') ||
                            window.location.pathname.includes('creators-lounge') ||
                            window.location.pathname.includes('video-generation') ||
                            window.location.pathname.includes('seamless-loop-creator');

    if (!isAetherwavePage) return;

    // Create exit portal
    const exitPortal = document.createElement('div');
    exitPortal.className = 'exit-portal';
    exitPortal.innerHTML = `
        <div class="exit-portal-container">
            <a href="/user/profile" class="exit-portal-button">
                <div class="exit-portal-ring">
                    <div class="exit-portal-core">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                            <polyline points="9,22 9,12 15,12 15,22"/>
                        </svg>
                    </div>
                </div>
                <div class="exit-portal-label">Return to Profile</div>
            </a>
        </div>
    `;

    // Add styles for exit portal
    const style = document.createElement('style');
    style.textContent = `
        .exit-portal {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            z-index: 1000;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        }

        .exit-portal-container {
            position: relative;
        }

        .exit-portal-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-decoration: none;
            color: #fff;
            transition: all 0.3s ease;
        }

        .exit-portal-button:hover {
            transform: scale(1.1);
        }

        .exit-portal-ring {
            width: 60px;
            height: 60px;
            position: relative;
            margin-bottom: 0.5rem;
        }

        .exit-portal-ring::before {
            content: '';
            position: absolute;
            inset: -8px;
            background: linear-gradient(45deg, #ff2ea6, #8b5cf6, #667eea, #764ba2);
            border-radius: 50%;
            animation: exitPortalGlow 3s ease-in-out infinite;
            filter: blur(10px);
            opacity: 0.6;
        }

        .exit-portal-core {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
            border: 2px solid #ff2ea6;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            z-index: 1;
            box-shadow: 0 4px 20px rgba(255, 46, 166, 0.3);
            animation: exitPortalRotate 4s linear infinite;
        }

        .exit-portal-core svg {
            color: #ff2ea6;
            width: 24px;
            height: 24px;
        }

        .exit-portal-label {
            background: rgba(30, 30, 46, 0.9);
            border: 1px solid rgba(255, 46, 166, 0.3);
            border-radius: 20px;
            padding: 0.5rem 1rem;
            font-size: 0.75rem;
            font-weight: 600;
            white-space: nowrap;
            backdrop-filter: blur(10px);
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            color: #e9e8ff;
        }

        .exit-portal-button:hover .exit-portal-label {
            background: rgba(255, 46, 166, 0.2);
            border-color: #ff2ea6;
            color: #fff;
        }

        /* Portal particles */
        .exit-portal-ring::after {
            content: '';
            position: absolute;
            width: 4px;
            height: 4px;
            background: #ff2ea6;
            border-radius: 50%;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            box-shadow:
                20px 0 0 #8b5cf6,
                -20px 0 0 #667eea,
                0 20px 0 #764ba2,
                0 -20px 0 #ff2ea6;
            animation: exitPortalParticles 2s linear infinite;
        }

        @keyframes exitPortalGlow {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.1); }
        }

        @keyframes exitPortalRotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        @keyframes exitPortalParticles {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        /* Mobile responsive */
        @media (max-width: 768px) {
            .exit-portal {
                bottom: 1rem;
                right: 1rem;
            }

            .exit-portal-ring {
                width: 50px;
                height: 50px;
            }

            .exit-portal-core svg {
                width: 20px;
                height: 20px;
            }

            .exit-portal-label {
                font-size: 0.7rem;
                padding: 0.4rem 0.8rem;
            }
        }
    `;

    document.head.appendChild(style);
    document.body.appendChild(exitPortal);

    console.log('Exit portal added to AetherWave page');
}