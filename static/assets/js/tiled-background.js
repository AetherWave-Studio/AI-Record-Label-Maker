// Randomly Tiled Background System for Welcome Page
class TiledBackground {
    constructor() {
        this.tiles = [];
        this.container = null;
        this.tileConfigs = this.generateTileConfigs();
        this.init();
    }

    generateTileConfigs() {
        return [
            // Image tiles
            {
                type: 'image',
                src: 'https://firebasestorage.googleapis.com/v0/b/aetherwave-playlists.firebasestorage.app/o/global-assets%2FLogo-SilverAlloy-Loop-1_1761279396703.gif?alt=media&token=57eb7fe9-fcd8-42fe-a845-b80a0347e2ad',
                sizes: [80, 120, 160],
                animationDuration: [15, 20, 25],
                opacityRange: [0.1, 0.3]
            },
            {
                type: 'image',
                src: 'https://firebasestorage.googleapis.com/v0/b/aetherwave-playlists.firebasestorage.app/o/Media%20to%20Showcase%2Faetherwave-backstage%20(2).png?alt=media&token=a975bc23-a23c-4174-8295-aed5e4d59ab0',
                sizes: [100, 150, 200],
                animationDuration: [20, 30, 40],
                opacityRange: [0.05, 0.2]
            },
            // Video tiles (if you have videos)
            {
                type: 'video',
                src: 'https://firebasestorage.googleapis.com/v0/b/aetherwave-playlists.firebasestorage.app/o/Media%20to%20Showcase%2FCornell_guy-2.mp4?alt=media&token=e7ab0795-a0d8-4b9c-a421-09b62a4c5f79', // Your video file
                sizes: [120, 180, 240],
                animationDuration: [10, 15, 20],
                opacityRange: [0.15, 0.35]
            },
            // Gradient tiles
            {
                type: 'gradient',
                gradients: [
                    'linear-gradient(135deg, #ff2ea6 0%, #8b5cf6 100%)',
                    'linear-gradient(45deg, #667eea 0%, #764ba2 100%)',
                    'radial-gradient(circle, #ff2ea6 0%, transparent 70%)',
                    'radial-gradient(circle, #8b5cf6 0%, transparent 70%)'
                ],
                sizes: [60, 100, 140, 180],
                animationDuration: [25, 35, 45],
                opacityRange: [0.08, 0.25]
            },
            // Shape tiles
            {
                type: 'shape',
                shapes: ['circle', 'triangle', 'hexagon', 'square'],
                colors: ['#ff2ea6', '#8b5cf6', '#667eea', '#764ba2'],
                sizes: [40, 80, 120],
                animationDuration: [20, 30, 40],
                opacityRange: [0.1, 0.3]
            }
        ];
    }

    init() {
        this.createContainer();
        this.generateTiles();
        this.startAnimations();
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
        switch (config.type) {
            case 'image':
                const img = document.createElement('img');
                img.src = config.src;
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
                video.src = config.src;
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
                const gradient = config.gradients[Math.floor(Math.random() * config.gradients.length)];
                tile.style.background = gradient;
                tile.style.borderRadius = '20px';
                break;

            case 'shape':
                const shape = config.shapes[Math.floor(Math.random() * config.shapes.length)];
                const color = config.colors[Math.floor(Math.random() * config.colors.length)];
                this.createShape(tile, shape, color, size);
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

    // Public method to add custom tiles
    addCustomTile(config) {
        this.tileConfigs.push(config);
        this.regenerateTiles();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.tiledBackground = new TiledBackground();
});

// Make it globally available
window.TiledBackground = TiledBackground;