// Shared Navigation Component
class NavigationManager {
    constructor() {
        this.navItems = [
            { text: 'Welcome', url: '/static/', active: false },
            /*{ text: 'Ghost Musician', url: '/', active: false },*/
            { text: 'Creator Studio', url: '/static/aimusic-media.html', active: false },
            { text: 'Playlists', url: '/static/playlists.html', active: false }
        ];
    }

    generateNavigation() {
        const currentPath = window.location.pathname;

        // Mark the active page
        this.navItems.forEach(item => {
            // Handle root path differently
            if (currentPath === '/' && item.url === '/') {
                item.active = true;
            } else if (currentPath !== '/' && currentPath.startsWith(item.url) && item.url !== '/') {
                item.active = true;
            } else {
                item.active = false;
            }
        });

        return `
            <header class="site-header">
                <nav class="main-nav">
                    <div class="nav-brand">
                        <a href="/" class="brand-link">AetherWave Studio</a>
                    </div>
                    <ul class="nav-list">
                        ${this.navItems.map(item => this.generateNavItem(item)).join('')}
                    </ul>
                    <button class="nav-toggle" aria-label="Toggle navigation">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </nav>
            </header>
        `;
    }

    generateNavItem(item) {
        const activeClass = item.active ? 'active' : '';
        return `
            <li class="nav-item">
                <a href="${item.url}" class="nav-link ${activeClass}" ${item.active ? 'aria-current="page"' : ''}>
                    ${item.text}
                </a>
            </li>
        `;
    }

    injectNavigation() {
        try {
            const navContainer = document.getElementById('navigation-container');
            if (navContainer) {
                navContainer.innerHTML = this.generateNavigation();
                this.setupMobileMenu();
                console.log('Navigation injected successfully');
            } else {
                console.warn('Navigation container not found');
            }
        } catch (error) {
            console.error('Error injecting navigation:', error);
        }
    }

    setupMobileMenu() {
        try {
            const toggle = document.querySelector('.nav-toggle');
            const navList = document.querySelector('.nav-list');

            if (toggle && navList) {
                toggle.addEventListener('click', () => {
                    navList.classList.toggle('nav-open');
                    toggle.classList.toggle('nav-open');
                });

                // Close menu when clicking outside
                document.addEventListener('click', (e) => {
                    if (!e.target.closest('.main-nav') && navList.classList.contains('nav-open')) {
                        navList.classList.remove('nav-open');
                        toggle.classList.remove('nav-open');
                    }
                });
                console.log('Mobile menu setup completed');
            } else {
                console.warn('Mobile menu elements not found');
            }
        } catch (error) {
            console.error('Error setting up mobile menu:', error);
        }
    }

    // Utility method to update navigation items
    updateNavItems(newItems) {
        this.navItems = newItems;
        this.injectNavigation();
    }
}

// Initialize navigation when DOM is ready
const navigationManager = new NavigationManager();

// Auto-inject navigation
document.addEventListener('DOMContentLoaded', () => {
    navigationManager.injectNavigation();
});

// Make it globally available
window.NavigationManager = NavigationManager;
window.navigationManager = navigationManager;