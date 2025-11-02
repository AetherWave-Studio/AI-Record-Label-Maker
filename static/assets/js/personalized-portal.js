// Personalized Portal System - Integrates User's Media from Ghost Musician
class PersonalizedPortal {
    constructor() {
        this.userMedia = [];
        this.init();
    }

    init() {
        this.loadUserMedia();
        this.createPersonalizedPortal();
    }

    // Load user's media from Ghost Musician API
    async loadUserMedia() {
        try {
            // Get user's artist cards (bands)
            const bandsResponse = await fetch('/api/user/bands');
            if (bandsResponse.ok) {
                const bands = await bandsResponse.json();
                this.userMedia = bands.map(band => ({
                    type: 'band',
                    id: band.id,
                    name: band.bandName || 'Unknown Artist',
                    image: band.cardImageUrl || null,
                    streams: band.totalStreams || 0,
                    fame: band.fame || 0,
                    genre: band.genre || 'Electronic'
                }));
            }

            // Get user's music releases
            const releasesResponse = await fetch('/api/user/releases');
            if (releasesResponse.ok) {
                const releases = await releasesResponse.json();
                releases.forEach(release => {
                    this.userMedia.push({
                        type: 'release',
                        id: release.id,
                        name: release.releaseTitle || release.fileName || 'Untitled Track',
                        image: release.coverImageUrl || null,
                        artist: release.artistName || 'Unknown Artist',
                        duration: release.duration || '0:00'
                    });
                });
            }

            console.log(`Loaded ${this.userMedia.length} user media items for portal`);
        } catch (error) {
            console.log('Could not load user media, using fallback:', error);
            this.loadFallbackMedia();
        }
    }

    // Fallback media when API is not available
    loadFallbackMedia() {
        this.userMedia = [
            {
                type: 'band',
                id: 'demo-1',
                name: 'Your Artist',
                image: 'https://firebasestorage.googleapis.com/v0/b/aetherwave-playlists.firebasestorage.app/o/global-assets%2FLogo-SilverAlloy-Loop-1_1761279396703.gif?alt=media&token=57eb7fe9-fcd8-42fe-a845-b80a0347e2ad',
                streams: Math.floor(Math.random() * 100000),
                fame: Math.floor(Math.random() * 1000),
                genre: 'Electronic'
            },
            {
                type: 'release',
                id: 'demo-2',
                name: 'Your Latest Track',
                image: 'https://firebasestorage.googleapis.com/v0/b/aetherwave-playlists.firebasestorage.app/o/Media%20to%20Showcase%2Faetherwave-backstage%20(2).png?alt=media&token=a975bc23-a23c-4174-8295-aed5e4d59ab0',
                artist: 'Your Artist',
                duration: '3:24'
            }
        ];
    }

    createPersonalizedPortal() {
        const portalSection = document.querySelector('.portal-welcome-content');
        if (!portalSection) return;

        // Add personalized media showcase after the portal text
        const mediaShowcase = this.createMediaShowcase();
        portalSection.insertBefore(mediaShowcase, portalSection.querySelector('.portal-actions'));

        // Animate media items
        this.animateMediaItems();
    }

    createMediaShowcase() {
        const showcase = document.createElement('div');
        showcase.className = 'portal-media-showcase';

        // Take up to 4 most recent/popular items
        const featuredMedia = this.userMedia.slice(0, 4);

        showcase.innerHTML = `
            <h3 class="media-showcase-title">Your Creative Portfolio</h3>
            <div class="media-grid">
                ${featuredMedia.map((item, index) => this.createMediaCard(item, index)).join('')}
            </div>
            <div class="media-more">
                <a href="/gallery" class="view-all-link">
                    View All Your Work →
                </a>
            </div>
        `;

        return showcase;
    }

    createMediaCard(media, index) {
        const hasImage = media.image && media.image.trim() !== '';
        const mediaType = media.type === 'band' ? 'Artist' : 'Release';

        return `
            <div class="media-card" data-index="${index}">
                <div class="media-image">
                    ${hasImage ?
                        `<img src="${media.image}" alt="${media.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                        <div class="media-placeholder">
                            ${media.type === 'band' ?
                                `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 18V5l12-2v13"></path>
                                    <circle cx="6" cy="18" r="3"></circle>
                                    <circle cx="18" cy="16" r="3"></circle>
                                </svg>` :
                                `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                    <path d="M22 9l-7-7-7 7"></path>
                                </svg>`
                            }
                        </div>` :
                        `<div class="media-placeholder">
                            ${media.type === 'band' ?
                                `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M9 18V5l12-2v13"></path>
                                    <circle cx="6" cy="18" r="3"></circle>
                                    <circle cx="18" cy="16" r="3"></circle>
                                </svg>` :
                                `<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                    <path d="M22 9l-7-7-7 7"></path>
                                </svg>`
                            }
                        </div>`
                    }
                </div>
                <div class="media-info">
                    <div class="media-type">${mediaType}</div>
                    <h4 class="media-name">${media.name}</h4>
                    ${media.type === 'band' ?
                        `<div class="media-stats">
                            <span class="stat">${this.formatNumber(media.streams)} streams</span>
                            <span class="stat">${media.fame} fame</span>
                        </div>` :
                        `<div class="media-meta">
                            <span class="meta">${media.artist}</span>
                            <span class="meta">${media.duration}</span>
                        </div>`
                    }
                </div>
            </div>
        `;
    }

    formatNumber(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toString();
    }

    animateMediaItems() {
        const cards = document.querySelectorAll('.media-card');
        cards.forEach((card, index) => {
            // Staggered entrance animation
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';

            setTimeout(() => {
                card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 100 + (index * 150));

            // Add hover effects
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-5px) scale(1.02)';
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });
    }

    // Public method to refresh media
    async refreshMedia() {
        await this.loadUserMedia();
        const existingShowcase = document.querySelector('.portal-media-showcase');
        if (existingShowcase) {
            existingShowcase.remove();
        }
        this.createPersonalizedPortal();
    }
}

// Add styles for personalized portal
const portalStyles = `
    <style>
    .portal-media-showcase {
        width: 100%;
        max-width: 800px;
        margin: 2rem 0;
    }

    .media-showcase-title {
        font-size: 1.5rem;
        font-weight: 600;
        color: #e9e8ff;
        margin-bottom: 1.5rem;
        text-align: center;
    }

    .media-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }

    .media-card {
        background: rgba(30, 30, 46, 0.6);
        border: 1px solid rgba(255, 46, 166, 0.2);
        border-radius: 12px;
        overflow: hidden;
        transition: all 0.3s ease;
        cursor: pointer;
        backdrop-filter: blur(10px);
    }

    .media-card:hover {
        border-color: rgba(255, 46, 166, 0.5);
        box-shadow: 0 8px 25px rgba(255, 46, 166, 0.2);
    }

    .media-image {
        width: 100%;
        height: 120px;
        position: relative;
        overflow: hidden;
        background: linear-gradient(135deg, #ff2ea6 0%, #8b5cf6 100%);
    }

    .media-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
    }

    .media-card:hover .media-image img {
        transform: scale(1.1);
    }

    .media-placeholder {
        width: 100%;
        height: 100%;
        display: none;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.7);
        background: linear-gradient(135deg, #ff2ea6 0%, #8b5cf6 100%);
    }

    .media-info {
        padding: 1rem;
    }

    .media-type {
        font-size: 0.75rem;
        color: #ff2ea6;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 0.5rem;
        font-weight: 600;
    }

    .media-name {
        font-size: 0.9rem;
        font-weight: 600;
        color: #e9e8ff;
        margin-bottom: 0.5rem;
        line-height: 1.3;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .media-stats {
        display: flex;
        justify-content: space-between;
        gap: 0.5rem;
    }

    .stat {
        font-size: 0.75rem;
        color: #b7b3d9;
    }

    .media-meta {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .meta {
        font-size: 0.75rem;
        color: #b7b3d9;
    }

    .media-more {
        text-align: center;
    }

    .view-all-link {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        color: #ff2ea6;
        text-decoration: none;
        font-weight: 500;
        transition: color 0.3s ease;
    }

    .view-all-link:hover {
        color: #8b5cf6;
    }

    @media (max-width: 768px) {
        .media-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
        }

        .media-image {
            height: 100px;
        }

        .media-name {
            font-size: 0.8rem;
        }
    }
    </style>
`;

// Inject styles into the document head
document.head.insertAdjacentHTML('beforeend', portalStyles);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.personalizedPortal = new PersonalizedPortal();
});

// Make it globally available
window.PersonalizedPortal = PersonalizedPortal;