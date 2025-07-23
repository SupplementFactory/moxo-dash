// Project Manager for Multi-Project Tracker
// Handles project-specific operations and UI interactions

class ProjectManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.currentProject = null;
        this.projects = [];
        this.filteredProjects = [];
        this.searchQuery = '';
        this.statusFilter = '';
        this.viewMode = 'cards'; // 'cards' or 'list'
        
        // Debounced search function
        this.debouncedSearch = Utils.debounce(this.performSearch.bind(this), 300);
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Load initial data
        this.loadProjects();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Create project modal
        const createBtn = document.getElementById('createProjectBtn');
        const modal = document.getElementById('createProjectModal');
        const closeBtn = document.getElementById('closeModal');
        const cancelBtn = document.getElementById('cancelCreate');
        const form = document.getElementById('createProjectForm');

        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateModal());
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideCreateModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideCreateModal());
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideCreateModal();
                }
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => this.handleCreateProject(e));
        }

        // Project name input for slug generation
        const projectNameInput = document.getElementById('projectName');
        if (projectNameInput) {
            projectNameInput.addEventListener('input', (e) => this.updateSlugPreview(e.target.value));
        }

        // Search and filter
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.debouncedSearch();
            });
        }

        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.filterProjects();
            });
        }

        // View toggle
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.viewMode = e.target.dataset.view;
                this.updateViewMode();
                this.renderProjects();
            });
        });

        // Data change listener
        document.addEventListener('dataChanged', (e) => {
            this.handleDataChange(e.detail);
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N for new project
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                this.showCreateModal();
            }
            
            // Escape to close modal
            if (e.key === 'Escape') {
                this.hideCreateModal();
            }
        });
    }

    // Load all projects
    async loadProjects() {
        try {
            this.showLoadingState();
            this.projects = await this.dataManager.getAllProjects();
            this.filteredProjects = [...this.projects];
            
            await this.updateStats();
            this.renderProjects();
            this.hideLoadingState();
        } catch (error) {
            console.error('Error loading projects:', error);
            this.showErrorState('Failed to load projects');
        }
    }

    // Show create project modal
    showCreateModal() {
        const modal = document.getElementById('createProjectModal');
        const form = document.getElementById('createProjectForm');
        
        if (modal && form) {
            // Reset form
            form.reset();
            
            // Set default start date to today
            const startDateInput = document.getElementById('startDate');
            if (startDateInput) {
                startDateInput.value = new Date().toISOString().split('T')[0];
            }
            
            // Clear slug preview
            this.updateSlugPreview('');
            
            // Show modal
            modal.style.display = 'flex';
            Utils.fadeIn(modal, 200);
            
            // Focus on project name input
            const projectNameInput = document.getElementById('projectName');
            if (projectNameInput) {
                setTimeout(() => projectNameInput.focus(), 100);
            }
        }
    }

    // Hide create project modal
    hideCreateModal() {
        const modal = document.getElementById('createProjectModal');
        if (modal) {
            Utils.fadeOut(modal, 200);
            setTimeout(() => {
                modal.style.display = 'none';
            }, 200);
        }
    }

    // Update slug preview
    updateSlugPreview(projectName) {
        const slugPreview = document.getElementById('urlSlugPreview');
        if (slugPreview) {
            const slug = Utils.generateSlug(projectName) || 'project-name';
            slugPreview.textContent = slug;
        }
    }

    // Handle create project form submission
    async handleCreateProject(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        try {
            // Show loading state
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnLoading.style.display = 'inline';
            
            // Get form data
            const formData = new FormData(form);
            const projectData = {
                name: formData.get('projectName').trim(),
                startDate: formData.get('startDate'),
                description: formData.get('projectDescription').trim(),
                stage: 1,
                status: 'In Progress',
                automationStatus: 'Running'
            };
            
            // Create project
            const newProject = await this.dataManager.createProject(projectData);
            
            // Hide modal
            this.hideCreateModal();
            
            // Reload projects
            await this.loadProjects();
            
            // Show success message
            this.showSuccessMessage(`Project "${newProject.name}" created successfully!`);
            
        } catch (error) {
            console.error('Error creating project:', error);
            this.showErrorMessage(error.message || 'Failed to create project');
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        }
    }

    // Perform search
    async performSearch() {
        try {
            const filters = {
                status: this.statusFilter
            };
            
            this.filteredProjects = await this.dataManager.searchProjects(this.searchQuery, filters);
            this.renderProjects();
        } catch (error) {
            console.error('Error searching projects:', error);
        }
    }

    // Filter projects
    filterProjects() {
        this.performSearch();
    }

    // Update view mode
    updateViewMode() {
        const viewButtons = document.querySelectorAll('.view-btn');
        const projectsGrid = document.getElementById('projectsGrid');
        
        viewButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === this.viewMode);
        });
        
        if (projectsGrid) {
            projectsGrid.classList.toggle('list-view', this.viewMode === 'list');
        }
    }

    // Render projects
    renderProjects() {
        const projectsGrid = document.getElementById('projectsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (!projectsGrid) return;
        
        if (this.filteredProjects.length === 0) {
            projectsGrid.innerHTML = '';
            if (emptyState) {
                emptyState.style.display = 'block';
            }
            return;
        }
        
        if (emptyState) {
            emptyState.style.display = 'none';
        }
        
        const projectsHtml = this.filteredProjects.map(project => 
            this.createProjectCard(project)
        ).join('');
        
        projectsGrid.innerHTML = projectsHtml;
        
        // Add event listeners to project cards
        this.attachProjectCardListeners();
    }

    // Create project card HTML
    createProjectCard(project) {
        const statusClass = project.status.toLowerCase().replace(' ', '-');
        const progressPercentage = Math.round(project.progress);
        const daysElapsed = project.daysElapsed || 0;
        
        return `
            <div class="project-card" data-project-id="${project.id}">
                <div class="project-card-header">
                    <h3 class="project-title">${Utils.sanitizeHtml(project.name)}</h3>
                    <div class="project-slug">connect.supplementfactoryuk.com/projects/${project.slug}</div>
                    <div class="project-meta">
                        <div class="project-date">
                            📅 Started ${Utils.formatDate(project.startDate)}
                        </div>
                        <div class="project-stage">
                            🔬 Stage ${project.currentStage}/10
                        </div>
                    </div>
                </div>
                
                <div class="project-card-body">
                    <div class="project-status ${statusClass}">
                        <span class="status-dot ${statusClass}"></span>
                        ${project.status}
                    </div>
                    
                    <div class="project-progress">
                        <div class="progress-label">
                            <span class="progress-text">Progress</span>
                            <span class="progress-percentage">${progressPercentage}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${progressPercentage}%"></div>
                        </div>
                    </div>
                    
                    ${project.description ? `
                        <div class="project-description">
                            ${Utils.sanitizeHtml(project.description)}
                        </div>
                    ` : ''}
                </div>
                
                <div class="project-card-footer">
                    <div class="project-updated">
                        Updated ${Utils.formatDate(project.updatedAt)}
                    </div>
                    <div class="project-actions">
                        <button class="btn btn-outline btn-sm view-project-btn" 
                                data-project-slug="${project.slug}">
                            View Dashboard
                        </button>
                        <button class="btn btn-primary btn-sm edit-project-btn" 
                                data-project-id="${project.id}">
                            Edit Project
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    // Attach event listeners to project cards
    attachProjectCardListeners() {
        // View project buttons
        const viewButtons = document.querySelectorAll('.view-project-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const slug = btn.dataset.projectSlug;
                this.viewProject(slug);
            });
        });
        
        // Edit project buttons
        const editButtons = document.querySelectorAll('.edit-project-btn');
        editButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const projectId = btn.dataset.projectId;
                this.editProject(projectId);
            });
        });
        
        // Project card click (view project)
        const projectCards = document.querySelectorAll('.project-card');
        projectCards.forEach(card => {
            card.addEventListener('click', (e) => {
                // Don't trigger if clicking on buttons
                if (e.target.closest('button')) return;
                
                const projectId = card.dataset.projectId;
                const project = this.projects.find(p => p.id === projectId);
                if (project) {
                    this.viewProject(project.slug);
                }
            });
        });
    }

    // View project dashboard
    viewProject(slug) {
        // Navigate to project dashboard
        window.location.href = `projects/${slug}`;
    }

    // Edit project
    editProject(projectId) {
        // Navigate to project edit form
        const project = this.projects.find(p => p.id === projectId);
        if (project) {
            window.location.href = `projects/${project.slug}/edit`;
        }
    }

    // Delete project
    async deleteProject(projectId) {
        const project = this.projects.find(p => p.id === projectId);
        if (!project) return;
        
        const confirmed = confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`);
        if (!confirmed) return;
        
        try {
            await this.dataManager.deleteProject(projectId);
            await this.loadProjects();
            this.showSuccessMessage(`Project "${project.name}" deleted successfully`);
        } catch (error) {
            console.error('Error deleting project:', error);
            this.showErrorMessage('Failed to delete project');
        }
    }

    // Update statistics
    async updateStats() {
        try {
            const stats = await this.dataManager.getProjectStats();
            
            // Update stat cards
            const totalElement = document.getElementById('totalProjects');
            const activeElement = document.getElementById('activeProjects');
            const completedElement = document.getElementById('completedProjects');
            const delayedElement = document.getElementById('delayedProjects');
            
            if (totalElement) totalElement.textContent = stats.total;
            if (activeElement) activeElement.textContent = stats.active;
            if (completedElement) completedElement.textContent = stats.completed;
            if (delayedElement) delayedElement.textContent = stats.delayed;
            
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    // Handle data changes
    async handleDataChange(detail) {
        console.log('Data changed:', detail);
        
        // Reload projects if needed
        if (['create', 'update', 'delete', 'import', 'clear'].includes(detail.action)) {
            await this.loadProjects();
        }
    }

    // Show loading state
    showLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const projectsGrid = document.getElementById('projectsGrid');
        const emptyState = document.getElementById('emptyState');
        
        if (loadingState) loadingState.style.display = 'block';
        if (projectsGrid) projectsGrid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'none';
    }

    // Hide loading state
    hideLoadingState() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) loadingState.style.display = 'none';
    }

    // Show error state
    showErrorState(message) {
        const projectsGrid = document.getElementById('projectsGrid');
        const loadingState = document.getElementById('loadingState');
        
        if (loadingState) loadingState.style.display = 'none';
        
        if (projectsGrid) {
            projectsGrid.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h3>Error Loading Projects</h3>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="window.location.reload()">
                        Retry
                    </button>
                </div>
            `;
        }
    }

    // Show success message
    showSuccessMessage(message) {
        this.showNotification(message, 'success');
    }

    // Show error message
    showErrorMessage(message) {
        this.showNotification(message, 'error');
    }

    // Show notification
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${Utils.sanitizeHtml(message)}</span>
            <button class="notification-close">&times;</button>
        `;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--error-color)' : 'var(--info-color)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 1rem;
            max-width: 400px;
            animation: slideIn 0.3s ease;
        `;
        
        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
        
        document.body.appendChild(notification);
    }

    // Export projects data
    async exportProjects() {
        try {
            const exportData = await this.dataManager.exportData();
            
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `supplement-projects-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showSuccessMessage('Projects exported successfully');
        } catch (error) {
            console.error('Error exporting projects:', error);
            this.showErrorMessage('Failed to export projects');
        }
    }

    // Get current projects
    getProjects() {
        return this.projects;
    }

    // Get filtered projects
    getFilteredProjects() {
        return this.filteredProjects;
    }

    // Refresh projects
    async refresh() {
        await this.loadProjects();
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.ProjectManager = ProjectManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectManager;
}

