// Dashboard Main Controller
// Initializes and coordinates all dashboard components

class Dashboard {
    constructor() {
        this.dataManager = null;
        this.projectManager = null;
        this.isInitialized = false;
        
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    // Initialize dashboard
    async initialize() {
        try {
            console.log('Initializing Multi-Project Dashboard...');
            
            // Show loading state
            this.showInitialLoading();
            
            // Initialize data manager
            this.dataManager = new DataManager();
            
            // Initialize project manager
            this.projectManager = new ProjectManager(this.dataManager);
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Initialize UI components
            this.initializeUI();
            
            // Update last modified timestamp
            this.updateLastModified();
            
            // Mark as initialized
            this.isInitialized = true;
            
            // Hide loading state
            this.hideInitialLoading();
            
            console.log('Dashboard initialized successfully');
            
        } catch (error) {
            console.error('Error initializing dashboard:', error);
            this.showInitializationError(error);
        }
    }

    // Setup global event listeners
    setupGlobalEventListeners() {
        // Window resize handler
        window.addEventListener('resize', Utils.throttle(() => {
            this.handleResize();
        }, 250));
        
        // Visibility change handler
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
        
        // Online/offline handlers
        window.addEventListener('online', () => {
            this.handleOnlineStatus(true);
        });
        
        window.addEventListener('offline', () => {
            this.handleOnlineStatus(false);
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyboard(e);
        });
        
        // Data change listener
        document.addEventListener('dataChanged', (e) => {
            this.handleDataChange(e.detail);
        });
        
        // Error handler
        window.addEventListener('error', (e) => {
            this.handleGlobalError(e);
        });
        
        // Unhandled promise rejection
        window.addEventListener('unhandledrejection', (e) => {
            this.handleUnhandledRejection(e);
        });
    }

    // Initialize UI components
    initializeUI() {
        // Initialize sync indicator
        this.initializeSyncIndicator();
        
        // Initialize tooltips
        this.initializeTooltips();
        
        // Initialize responsive behavior
        this.initializeResponsive();
        
        // Initialize theme
        this.initializeTheme();
        
        // Initialize accessibility features
        this.initializeAccessibility();
    }

    // Initialize sync indicator
    initializeSyncIndicator() {
        const syncIndicator = document.getElementById('syncIndicator');
        if (syncIndicator) {
            // Set initial state
            syncIndicator.classList.add('active');
            syncIndicator.title = 'System Active - Real-time sync enabled';
            
            // Update periodically
            setInterval(() => {
                this.updateSyncIndicator();
            }, 5000);
        }
    }

    // Update sync indicator
    updateSyncIndicator() {
        const syncIndicator = document.getElementById('syncIndicator');
        if (!syncIndicator) return;
        
        try {
            // Check if data manager is working
            const isWorking = this.dataManager && this.isInitialized;
            
            if (isWorking) {
                syncIndicator.classList.remove('error', 'syncing');
                syncIndicator.classList.add('active');
                syncIndicator.title = 'System Active - Real-time sync enabled';
            } else {
                syncIndicator.classList.remove('active', 'syncing');
                syncIndicator.classList.add('error');
                syncIndicator.title = 'System Error - Please refresh the page';
            }
        } catch (error) {
            console.error('Error updating sync indicator:', error);
        }
    }

    // Initialize tooltips
    initializeTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        tooltipElements.forEach(element => {
            element.classList.add('tooltip');
        });
    }

    // Initialize responsive behavior
    initializeResponsive() {
        this.handleResize();
    }

    // Initialize theme
    initializeTheme() {
        // Check for saved theme preference
        const savedTheme = Utils.getLocalStorage('theme', 'light');
        this.setTheme(savedTheme);
    }

    // Initialize accessibility features
    initializeAccessibility() {
        // Add skip link
        this.addSkipLink();
        
        // Enhance keyboard navigation
        this.enhanceKeyboardNavigation();
        
        // Add ARIA labels where needed
        this.addAriaLabels();
    }

    // Add skip link for accessibility
    addSkipLink() {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.className = 'skip-link';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: var(--primary-color);
            color: white;
            padding: 8px;
            text-decoration: none;
            border-radius: 4px;
            z-index: 10000;
            transition: top 0.3s;
        `;
        
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    // Enhance keyboard navigation
    enhanceKeyboardNavigation() {
        // Add focus indicators
        const style = document.createElement('style');
        style.textContent = `
            .focus-visible {
                outline: 2px solid var(--primary-color);
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    // Add ARIA labels
    addAriaLabels() {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.setAttribute('id', 'main-content');
            mainContent.setAttribute('role', 'main');
        }
        
        const header = document.querySelector('.header');
        if (header) {
            header.setAttribute('role', 'banner');
        }
        
        const footer = document.querySelector('.footer');
        if (footer) {
            footer.setAttribute('role', 'contentinfo');
        }
    }

    // Handle window resize
    handleResize() {
        const width = window.innerWidth;
        
        // Update CSS custom property for JavaScript access
        document.documentElement.style.setProperty('--viewport-width', `${width}px`);
        
        // Handle mobile/desktop specific logic
        if (width < 768) {
            document.body.classList.add('mobile');
            document.body.classList.remove('desktop');
        } else {
            document.body.classList.add('desktop');
            document.body.classList.remove('mobile');
        }
    }

    // Handle visibility change
    handleVisibilityChange() {
        if (document.hidden) {
            console.log('Dashboard hidden - reducing activity');
            // Reduce update frequency when hidden
        } else {
            console.log('Dashboard visible - resuming normal activity');
            // Resume normal activity
            if (this.projectManager) {
                this.projectManager.refresh();
            }
        }
    }

    // Handle online/offline status
    handleOnlineStatus(isOnline) {
        const syncIndicator = document.getElementById('syncIndicator');
        const dataSource = document.getElementById('dataSource');
        
        if (isOnline) {
            console.log('Dashboard online');
            if (syncIndicator) {
                syncIndicator.classList.remove('error');
                syncIndicator.title = 'Online - System Active';
            }
            if (dataSource) {
                dataSource.textContent = 'Cloud Ready';
            }
        } else {
            console.log('Dashboard offline');
            if (syncIndicator) {
                syncIndicator.classList.add('error');
                syncIndicator.title = 'Offline - Local storage only';
            }
            if (dataSource) {
                dataSource.textContent = 'Offline Mode';
            }
        }
    }

    // Handle global keyboard shortcuts
    handleGlobalKeyboard(e) {
        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }
        
        // Ctrl/Cmd + R for refresh (prevent default and use our refresh)
        if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
            e.preventDefault();
            this.refresh();
        }
        
        // F5 for refresh
        if (e.key === 'F5') {
            e.preventDefault();
            this.refresh();
        }
    }

    // Handle data changes
    handleDataChange(detail) {
        console.log('Dashboard handling data change:', detail);
        
        // Update last modified timestamp
        this.updateLastModified();
        
        // Update sync indicator
        const syncIndicator = document.getElementById('syncIndicator');
        if (syncIndicator) {
            syncIndicator.classList.add('syncing');
            setTimeout(() => {
                syncIndicator.classList.remove('syncing');
            }, 1000);
        }
    }

    // Handle global errors
    handleGlobalError(e) {
        console.error('Global error:', e.error);
        
        // Update sync indicator to show error
        const syncIndicator = document.getElementById('syncIndicator');
        if (syncIndicator) {
            syncIndicator.classList.add('error');
            syncIndicator.title = 'System Error - Check console for details';
        }
        
        // Show user-friendly error message
        this.showErrorNotification('An unexpected error occurred. Please refresh the page if problems persist.');
    }

    // Handle unhandled promise rejections
    handleUnhandledRejection(e) {
        console.error('Unhandled promise rejection:', e.reason);
        
        // Prevent default browser error handling
        e.preventDefault();
        
        // Show user-friendly error message
        this.showErrorNotification('A background operation failed. The application should continue to work normally.');
    }

    // Show initial loading
    showInitialLoading() {
        document.body.classList.add('loading');
    }

    // Hide initial loading
    hideInitialLoading() {
        document.body.classList.remove('loading');
    }

    // Show initialization error
    showInitializationError(error) {
        document.body.classList.remove('loading');
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="initialization-error">
                    <div class="error-icon">⚠️</div>
                    <h2>Failed to Initialize Dashboard</h2>
                    <p>There was an error loading the project management dashboard.</p>
                    <details>
                        <summary>Error Details</summary>
                        <pre>${error.message}</pre>
                    </details>
                    <div class="error-actions">
                        <button class="btn btn-primary" onclick="window.location.reload()">
                            Reload Page
                        </button>
                        <button class="btn btn-secondary" onclick="localStorage.clear(); window.location.reload()">
                            Clear Data & Reload
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // Update last modified timestamp
    updateLastModified() {
        const lastUpdatedElement = document.getElementById('lastUpdated');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = new Date().toLocaleString();
        }
    }

    // Set theme
    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        Utils.setLocalStorage('theme', theme);
    }

    // Show error notification
    showErrorNotification(message) {
        if (this.projectManager && this.projectManager.showErrorMessage) {
            this.projectManager.showErrorMessage(message);
        } else {
            console.error(message);
        }
    }

    // Refresh dashboard
    async refresh() {
        try {
            console.log('Refreshing dashboard...');
            
            if (this.projectManager) {
                await this.projectManager.refresh();
            }
            
            this.updateLastModified();
            
            console.log('Dashboard refreshed successfully');
        } catch (error) {
            console.error('Error refreshing dashboard:', error);
            this.showErrorNotification('Failed to refresh dashboard');
        }
    }

    // Get dashboard status
    getStatus() {
        return {
            initialized: this.isInitialized,
            dataManager: !!this.dataManager,
            projectManager: !!this.projectManager,
            online: navigator.onLine,
            timestamp: new Date().toISOString()
        };
    }

    // Cleanup (for page unload)
    cleanup() {
        console.log('Cleaning up dashboard...');
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        
        // Clear intervals/timeouts if any
        // (Add specific cleanup code here if needed)
    }
}

// Initialize dashboard when script loads
let dashboard;

// Auto-initialize
if (typeof window !== 'undefined') {
    dashboard = new Dashboard();
    window.dashboard = dashboard;
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (dashboard) {
            dashboard.cleanup();
        }
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dashboard;
}

