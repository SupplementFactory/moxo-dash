// Data Manager for Multi-Project Tracker
// Handles all data operations with cloud-ready architecture

class DataManager {
    constructor() {
        this.storageKey = 'supplementFactory_projects';
        this.metaKey = 'supplementFactory_meta';
        this.apiEndpoint = '/api'; // For future cloud integration
        this.isCloudMode = false; // Will be true when connected to backend
        
        // Initialize storage
        this.initializeStorage();
        
        // Event listeners for storage changes
        this.setupStorageListeners();
    }

    // Initialize storage structure
    initializeStorage() {
        const existingProjects = Utils.getLocalStorage(this.storageKey, []);
        const existingMeta = Utils.getLocalStorage(this.metaKey, {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            totalProjects: 0
        });

        // Ensure storage is properly initialized
        if (!Array.isArray(existingProjects)) {
            Utils.setLocalStorage(this.storageKey, []);
        }

        if (!existingMeta.version) {
            Utils.setLocalStorage(this.metaKey, {
                version: '1.0.0',
                lastUpdated: new Date().toISOString(),
                totalProjects: existingProjects.length || 0
            });
        }
    }

    // Setup storage event listeners for cross-tab sync
    setupStorageListeners() {
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey || e.key === this.metaKey) {
                this.notifyDataChange();
            }
        });
    }

    // Get all projects
    async getAllProjects() {
        try {
            if (this.isCloudMode) {
                return await this.fetchFromCloud('/projects');
            }
            
            const projects = Utils.getLocalStorage(this.storageKey, []);
            return this.processProjectsData(projects);
        } catch (error) {
            console.error('Error fetching projects:', error);
            return [];
        }
    }

    // Get project by ID
    async getProject(projectId) {
        try {
            if (this.isCloudMode) {
                return await this.fetchFromCloud(`/projects/${projectId}`);
            }
            
            const projects = Utils.getLocalStorage(this.storageKey, []);
            const project = projects.find(p => p.id === projectId);
            
            return project ? this.processProjectData(project) : null;
        } catch (error) {
            console.error('Error fetching project:', error);
            return null;
        }
    }

    // Get project by slug
    async getProjectBySlug(slug) {
        try {
            if (this.isCloudMode) {
                return await this.fetchFromCloud(`/projects/slug/${slug}`);
            }
            
            const projects = Utils.getLocalStorage(this.storageKey, []);
            const project = projects.find(p => p.slug === slug);
            
            return project ? this.processProjectData(project) : null;
        } catch (error) {
            console.error('Error fetching project by slug:', error);
            return null;
        }
    }

    // Create new project
    async createProject(projectData) {
        try {
            // Validate project data
            const errors = Utils.validateProject(projectData);
            if (errors.length > 0) {
                throw new Error(errors.join(', '));
            }

            // Prepare project object
            const project = this.prepareProjectData(projectData);

            if (this.isCloudMode) {
                return await this.postToCloud('/projects', project);
            }

            // Local storage implementation
            const projects = Utils.getLocalStorage(this.storageKey, []);
            
            // Ensure unique slug
            project.slug = Utils.generateUniqueSlug(project.name, projects);
            
            projects.push(project);
            Utils.setLocalStorage(this.storageKey, projects);
            
            // Update metadata
            this.updateMetadata();
            
            // Notify listeners
            this.notifyDataChange('create', project);
            
            return project;
        } catch (error) {
            console.error('Error creating project:', error);
            throw error;
        }
    }

    // Update existing project
    async updateProject(projectId, updateData) {
        try {
            if (this.isCloudMode) {
                return await this.putToCloud(`/projects/${projectId}`, updateData);
            }

            const projects = Utils.getLocalStorage(this.storageKey, []);
            const projectIndex = projects.findIndex(p => p.id === projectId);
            
            if (projectIndex === -1) {
                throw new Error('Project not found');
            }

            // Validate update data
            const mergedData = { ...projects[projectIndex], ...updateData };
            const errors = Utils.validateProject(mergedData);
            if (errors.length > 0) {
                throw new Error(errors.join(', '));
            }

            // Update project
            projects[projectIndex] = {
                ...projects[projectIndex],
                ...updateData,
                updatedAt: new Date().toISOString()
            };

            // If name changed, update slug
            if (updateData.name && updateData.name !== projects[projectIndex].name) {
                projects[projectIndex].slug = Utils.generateUniqueSlug(
                    updateData.name, 
                    projects, 
                    projectId
                );
            }

            Utils.setLocalStorage(this.storageKey, projects);
            
            // Update metadata
            this.updateMetadata();
            
            // Notify listeners
            this.notifyDataChange('update', projects[projectIndex]);
            
            return projects[projectIndex];
        } catch (error) {
            console.error('Error updating project:', error);
            throw error;
        }
    }

    // Delete project
    async deleteProject(projectId) {
        try {
            if (this.isCloudMode) {
                return await this.deleteFromCloud(`/projects/${projectId}`);
            }

            const projects = Utils.getLocalStorage(this.storageKey, []);
            const projectIndex = projects.findIndex(p => p.id === projectId);
            
            if (projectIndex === -1) {
                throw new Error('Project not found');
            }

            const deletedProject = projects[projectIndex];
            projects.splice(projectIndex, 1);
            
            Utils.setLocalStorage(this.storageKey, projects);
            
            // Update metadata
            this.updateMetadata();
            
            // Notify listeners
            this.notifyDataChange('delete', deletedProject);
            
            return true;
        } catch (error) {
            console.error('Error deleting project:', error);
            throw error;
        }
    }

    // Search and filter projects
    async searchProjects(query, filters = {}) {
        try {
            const projects = await this.getAllProjects();
            
            let filteredProjects = projects;

            // Apply text search
            if (query && query.trim()) {
                const searchTerm = query.toLowerCase().trim();
                filteredProjects = filteredProjects.filter(project =>
                    project.name.toLowerCase().includes(searchTerm) ||
                    project.description.toLowerCase().includes(searchTerm) ||
                    project.slug.toLowerCase().includes(searchTerm)
                );
            }

            // Apply status filter
            if (filters.status) {
                filteredProjects = filteredProjects.filter(project =>
                    project.status === filters.status
                );
            }

            // Apply date range filter
            if (filters.startDate || filters.endDate) {
                filteredProjects = filteredProjects.filter(project => {
                    const projectDate = new Date(project.startDate);
                    const start = filters.startDate ? new Date(filters.startDate) : null;
                    const end = filters.endDate ? new Date(filters.endDate) : null;
                    
                    if (start && projectDate < start) return false;
                    if (end && projectDate > end) return false;
                    
                    return true;
                });
            }

            // Apply sorting
            if (filters.sortBy) {
                filteredProjects.sort((a, b) => {
                    const aVal = a[filters.sortBy];
                    const bVal = b[filters.sortBy];
                    
                    if (filters.sortOrder === 'desc') {
                        return bVal > aVal ? 1 : -1;
                    }
                    return aVal > bVal ? 1 : -1;
                });
            }

            return filteredProjects;
        } catch (error) {
            console.error('Error searching projects:', error);
            return [];
        }
    }

    // Get project statistics
    async getProjectStats() {
        try {
            const projects = await this.getAllProjects();
            
            const stats = {
                total: projects.length,
                active: 0,
                completed: 0,
                delayed: 0,
                onHold: 0,
                cancelled: 0,
                averageProgress: 0,
                recentActivity: []
            };

            let totalProgress = 0;

            projects.forEach(project => {
                // Count by status
                switch (project.status) {
                    case 'In Progress':
                        stats.active++;
                        break;
                    case 'Completed':
                        stats.completed++;
                        break;
                    case 'Delayed':
                        stats.delayed++;
                        break;
                    case 'On Hold':
                        stats.onHold++;
                        break;
                    case 'Cancelled':
                        stats.cancelled++;
                        break;
                }

                totalProgress += project.progress || 0;
            });

            // Calculate average progress
            stats.averageProgress = projects.length > 0 ? 
                Math.round(totalProgress / projects.length) : 0;

            // Get recent activity (last 5 updated projects)
            stats.recentActivity = projects
                .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                .slice(0, 5)
                .map(project => ({
                    id: project.id,
                    name: project.name,
                    action: 'updated',
                    timestamp: project.updatedAt
                }));

            return stats;
        } catch (error) {
            console.error('Error getting project stats:', error);
            return {
                total: 0,
                active: 0,
                completed: 0,
                delayed: 0,
                onHold: 0,
                cancelled: 0,
                averageProgress: 0,
                recentActivity: []
            };
        }
    }

    // Export all data
    async exportData() {
        try {
            const projects = await this.getAllProjects();
            const meta = Utils.getLocalStorage(this.metaKey, {});
            
            const exportData = {
                version: '1.0.0',
                exportDate: new Date().toISOString(),
                projects: projects,
                metadata: meta
            };

            return exportData;
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    // Import data
    async importData(importData) {
        try {
            if (!importData.projects || !Array.isArray(importData.projects)) {
                throw new Error('Invalid import data format');
            }

            // Validate all projects
            for (const project of importData.projects) {
                const errors = Utils.validateProject(project);
                if (errors.length > 0) {
                    throw new Error(`Invalid project "${project.name}": ${errors.join(', ')}`);
                }
            }

            if (this.isCloudMode) {
                return await this.postToCloud('/import', importData);
            }

            // Local storage implementation
            const existingProjects = Utils.getLocalStorage(this.storageKey, []);
            const mergedProjects = [...existingProjects];

            // Process imported projects
            importData.projects.forEach(importProject => {
                // Check if project already exists
                const existingIndex = mergedProjects.findIndex(p => p.id === importProject.id);
                
                if (existingIndex >= 0) {
                    // Update existing project
                    mergedProjects[existingIndex] = {
                        ...mergedProjects[existingIndex],
                        ...importProject,
                        updatedAt: new Date().toISOString()
                    };
                } else {
                    // Add new project
                    const newProject = this.prepareProjectData(importProject);
                    newProject.slug = Utils.generateUniqueSlug(newProject.name, mergedProjects);
                    mergedProjects.push(newProject);
                }
            });

            Utils.setLocalStorage(this.storageKey, mergedProjects);
            this.updateMetadata();
            this.notifyDataChange('import', importData);

            return {
                imported: importData.projects.length,
                total: mergedProjects.length
            };
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }

    // Clear all data
    async clearAllData() {
        try {
            if (this.isCloudMode) {
                return await this.deleteFromCloud('/projects/all');
            }

            Utils.removeLocalStorage(this.storageKey);
            Utils.removeLocalStorage(this.metaKey);
            
            this.initializeStorage();
            this.notifyDataChange('clear', null);
            
            return true;
        } catch (error) {
            console.error('Error clearing data:', error);
            throw error;
        }
    }

    // Helper: Prepare project data for storage
    prepareProjectData(projectData) {
        const now = new Date().toISOString();
        
        return {
            id: projectData.id || Utils.generateProjectId(),
            name: projectData.name.trim(),
            slug: projectData.slug || Utils.generateSlug(projectData.name),
            description: projectData.description || '',
            startDate: projectData.startDate,
            stage: projectData.stage || 1,
            status: projectData.status || 'In Progress',
            automationStatus: projectData.automationStatus || 'Running',
            delayNotes: projectData.delayNotes || '',
            progress: Utils.calculateProgress(
                projectData.startDate,
                projectData.stage || 1,
                projectData.automationStatus || 'Running'
            ),
            createdAt: projectData.createdAt || now,
            updatedAt: now
        };
    }

    // Helper: Process project data after retrieval
    processProjectData(project) {
        // Calculate current progress and stage
        const currentStage = Utils.getCurrentStage(
            project.startDate,
            project.automationStatus,
            project.stage
        );
        
        const progress = Utils.calculateProgress(
            project.startDate,
            currentStage,
            project.automationStatus
        );

        return {
            ...project,
            currentStage,
            progress,
            stageDates: Utils.getStageDates(project.startDate, currentStage),
            daysElapsed: Utils.daysBetween(project.startDate),
            projectColor: Utils.generateProjectColor(project.name),
            projectInitials: Utils.getProjectInitials(project.name)
        };
    }

    // Helper: Process multiple projects
    processProjectsData(projects) {
        return projects.map(project => this.processProjectData(project));
    }

    // Helper: Update metadata
    updateMetadata() {
        const projects = Utils.getLocalStorage(this.storageKey, []);
        const meta = {
            version: '1.0.0',
            lastUpdated: new Date().toISOString(),
            totalProjects: projects.length
        };
        
        Utils.setLocalStorage(this.metaKey, meta);
    }

    // Helper: Notify data change listeners
    notifyDataChange(action = 'update', data = null) {
        const event = new CustomEvent('dataChanged', {
            detail: { action, data, timestamp: new Date().toISOString() }
        });
        
        document.dispatchEvent(event);
    }

    // Cloud API helpers (for future implementation)
    async fetchFromCloud(endpoint) {
        const response = await fetch(this.apiEndpoint + endpoint, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        
        return await response.json();
    }

    async postToCloud(endpoint, data) {
        const response = await fetch(this.apiEndpoint + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        
        return await response.json();
    }

    async putToCloud(endpoint, data) {
        const response = await fetch(this.apiEndpoint + endpoint, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.getAuthToken()}`
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        
        return await response.json();
    }

    async deleteFromCloud(endpoint) {
        const response = await fetch(this.apiEndpoint + endpoint, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${this.getAuthToken()}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }
        
        return true;
    }

    // Get authentication token (placeholder for future implementation)
    getAuthToken() {
        return Utils.getLocalStorage('authToken', '');
    }

    // Enable cloud mode
    enableCloudMode(apiEndpoint, authToken) {
        this.isCloudMode = true;
        this.apiEndpoint = apiEndpoint;
        Utils.setLocalStorage('authToken', authToken);
    }

    // Disable cloud mode
    disableCloudMode() {
        this.isCloudMode = false;
        Utils.removeLocalStorage('authToken');
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.DataManager = DataManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}

