// URL Router for Multi-Project Tracker
// Handles client-side routing and URL management

class URLRouter {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.basePath = '';
        
        // Initialize router
        this.initialize();
    }

    // Initialize router
    initialize() {
        // Set up route patterns
        this.setupRoutes();
        
        // Handle initial page load
        this.handleInitialLoad();
        
        // Set up event listeners
        this.setupEventListeners();
    }

    // Setup route patterns
    setupRoutes() {
        // Dashboard route
        this.addRoute('/', {
            name: 'dashboard',
            title: 'Project Dashboard',
            handler: this.handleDashboard.bind(this)
        });

        // Project dashboard route
        this.addRoute('/projects/:slug', {
            name: 'project',
            title: 'Project Dashboard',
            handler: this.handleProject.bind(this)
        });

        // Project edit route
        this.addRoute('/projects/:slug/edit', {
            name: 'project-edit',
            title: 'Edit Project',
            handler: this.handleProjectEdit.bind(this)
        });

        // 404 route
        this.addRoute('*', {
            name: '404',
            title: 'Page Not Found',
            handler: this.handle404.bind(this)
        });
    }

    // Add route
    addRoute(pattern, config) {
        this.routes.set(pattern, {
            pattern: this.patternToRegex(pattern),
            config: config
        });
    }

    // Convert route pattern to regex
    patternToRegex(pattern) {
        if (pattern === '*') {
            return /.*/;
        }

        // Escape special regex characters except for our parameter syntax
        const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
        
        // Replace parameter placeholders with regex groups
        const withParams = escaped.replace(/:(\w+)/g, '(?<$1>[^/]+)');
        
        // Ensure exact match
        return new RegExp(`^${withParams}$`);
    }

    // Setup event listeners
    setupEventListeners() {
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            this.handlePopState(e);
        });

        // Handle link clicks
        document.addEventListener('click', (e) => {
            this.handleLinkClick(e);
        });
    }

    // Handle initial page load
    handleInitialLoad() {
        const path = this.getCurrentPath();
        this.navigate(path, { replace: true });
    }

    // Get current path
    getCurrentPath() {
        const path = window.location.pathname;
        
        // Remove base path if set
        if (this.basePath && path.startsWith(this.basePath)) {
            return path.slice(this.basePath.length);
        }
        
        return path || '/';
    }

    // Navigate to path
    navigate(path, options = {}) {
        const { replace = false, state = null } = options;
        
        // Find matching route
        const match = this.matchRoute(path);
        
        if (!match) {
            console.warn(`No route found for path: ${path}`);
            this.navigate('/404', { replace: true });
            return;
        }

        // Update browser history
        const fullPath = this.basePath + path;
        if (replace) {
            window.history.replaceState(state, '', fullPath);
        } else {
            window.history.pushState(state, '', fullPath);
        }

        // Execute route handler
        this.executeRoute(match, path);
    }

    // Match route pattern
    matchRoute(path) {
        for (const [pattern, route] of this.routes) {
            const match = path.match(route.pattern);
            if (match) {
                return {
                    route: route.config,
                    params: match.groups || {},
                    path: path
                };
            }
        }
        return null;
    }

    // Execute route handler
    async executeRoute(match, path) {
        try {
            // Update current route
            this.currentRoute = match;
            
            // Update page title
            document.title = `${match.route.title} - Supplement Factory`;
            
            // Execute handler
            if (match.route.handler) {
                await match.route.handler(match.params, path);
            }
            
            // Dispatch route change event
            this.dispatchRouteChange(match);
            
        } catch (error) {
            console.error('Error executing route:', error);
            this.handleRouteError(error, match);
        }
    }

    // Handle popstate (back/forward)
    handlePopState(e) {
        const path = this.getCurrentPath();
        const match = this.matchRoute(path);
        
        if (match) {
            this.executeRoute(match, path);
        }
    }

    // Handle link clicks
    handleLinkClick(e) {
        // Only handle left clicks
        if (e.button !== 0) return;
        
        // Don't handle if modifier keys are pressed
        if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
        
        // Find the link element
        const link = e.target.closest('a');
        if (!link) return;
        
        // Only handle internal links
        const href = link.getAttribute('href');
        if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            return;
        }
        
        // Prevent default navigation
        e.preventDefault();
        
        // Navigate using router
        this.navigate(href);
    }

    // Route handlers
    async handleDashboard(params, path) {
        console.log('Navigating to dashboard');
        
        // If we're not on the dashboard page, redirect
        if (!window.location.pathname.endsWith('/') && !window.location.pathname.endsWith('/index.html')) {
            window.location.href = '/';
            return;
        }
        
        // Initialize dashboard if needed
        if (typeof Dashboard !== 'undefined' && !window.dashboard) {
            window.dashboard = new Dashboard();
        }
    }

    async handleProject(params, path) {
        console.log('Navigating to project:', params.slug);
        
        // Check if we're on the project page
        const isProjectPage = window.location.pathname.includes('/projects/');
        
        if (!isProjectPage) {
            // Redirect to project page
            window.location.href = `/projects/${params.slug}`;
            return;
        }
        
        // Load project data
        await this.loadProjectData(params.slug);
    }

    async handleProjectEdit(params, path) {
        console.log('Navigating to project edit:', params.slug);
        
        // Check if we're on the edit page
        const isEditPage = window.location.pathname.includes('/edit');
        
        if (!isEditPage) {
            // Redirect to edit page
            window.location.href = `/projects/${params.slug}/edit`;
            return;
        }
        
        // Load project edit form
        await this.loadProjectEditForm(params.slug);
    }

    handle404(params, path) {
        console.log('404 - Page not found:', path);
        
        // Show 404 error
        this.show404Error(path);
    }

    // Load project data
    async loadProjectData(slug) {
        try {
            // Initialize data manager if needed
            if (!window.dataManager) {
                window.dataManager = new DataManager();
            }
            
            // Get project by slug
            const project = await window.dataManager.getProjectBySlug(slug);
            
            if (!project) {
                throw new Error('Project not found');
            }
            
            // Initialize project dashboard if needed
            if (typeof ProjectDashboard !== 'undefined') {
                if (!window.projectDashboard) {
                    window.projectDashboard = new ProjectDashboard(window.dataManager);
                }
                await window.projectDashboard.loadProject(project);
            }
            
        } catch (error) {
            console.error('Error loading project:', error);
            this.showProjectError(error.message);
        }
    }

    // Load project edit form
    async loadProjectEditForm(slug) {
        try {
            // Initialize data manager if needed
            if (!window.dataManager) {
                window.dataManager = new DataManager();
            }
            
            // Get project by slug
            const project = await window.dataManager.getProjectBySlug(slug);
            
            if (!project) {
                throw new Error('Project not found');
            }
            
            // Initialize project edit form if needed
            if (typeof ProjectEditForm !== 'undefined') {
                if (!window.projectEditForm) {
                    window.projectEditForm = new ProjectEditForm(window.dataManager);
                }
                await window.projectEditForm.loadProject(project);
            }
            
        } catch (error) {
            console.error('Error loading project edit form:', error);
            this.showProjectError(error.message);
        }
    }

    // Show project error
    showProjectError(message) {
        const errorOverlay = document.getElementById('errorOverlay');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorOverlay && errorMessage) {
            errorMessage.textContent = message;
            errorOverlay.style.display = 'flex';
        }
        
        // Hide loading overlay
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    // Show 404 error
    show404Error(path) {
        const errorOverlay = document.getElementById('errorOverlay');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorOverlay && errorMessage) {
            errorMessage.textContent = `The page "${path}" could not be found.`;
            errorOverlay.style.display = 'flex';
        }
    }

    // Handle route errors
    handleRouteError(error, match) {
        console.error('Route error:', error);
        
        // Show error message
        this.showProjectError('An error occurred while loading the page.');
    }

    // Dispatch route change event
    dispatchRouteChange(match) {
        const event = new CustomEvent('routeChanged', {
            detail: {
                route: match.route,
                params: match.params,
                path: match.path,
                timestamp: new Date().toISOString()
            }
        });
        
        document.dispatchEvent(event);
    }

    // Get current route
    getCurrentRoute() {
        return this.currentRoute;
    }

    // Get route parameters
    getRouteParams() {
        return this.currentRoute ? this.currentRoute.params : {};
    }

    // Check if current route matches pattern
    isCurrentRoute(pattern) {
        if (!this.currentRoute) return false;
        return this.currentRoute.route.name === pattern;
    }

    // Generate URL for route
    generateUrl(routeName, params = {}) {
        // Find route by name
        for (const [pattern, route] of this.routes) {
            if (route.config.name === routeName) {
                let url = pattern;
                
                // Replace parameters
                Object.keys(params).forEach(key => {
                    url = url.replace(`:${key}`, params[key]);
                });
                
                return url;
            }
        }
        
        return '/';
    }

    // Set base path
    setBasePath(basePath) {
        this.basePath = basePath.replace(/\/$/, ''); // Remove trailing slash
    }

    // Redirect to route
    redirect(path, options = {}) {
        this.navigate(path, { ...options, replace: true });
    }

    // Go back in history
    goBack() {
        window.history.back();
    }

    // Go forward in history
    goForward() {
        window.history.forward();
    }

    // Reload current route
    reload() {
        const path = this.getCurrentPath();
        this.navigate(path, { replace: true });
    }
}

// Create global router instance
let router;

// Auto-initialize router
if (typeof window !== 'undefined') {
    router = new URLRouter();
    window.router = router;
    
    // Add route change listener for debugging
    document.addEventListener('routeChanged', (e) => {
        console.log('Route changed:', e.detail);
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = URLRouter;
}

