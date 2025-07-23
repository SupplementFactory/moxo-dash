// Project Dashboard Controller
// Handles individual project dashboard functionality

class ProjectDashboard {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.currentProject = null;
        this.stages = [];
        this.updateInterval = null;
        
        // Initialize stages data
        this.initializeStages();
        
        // Initialize event listeners
        this.initializeEventListeners();
        
        // Auto-load project from URL
        this.autoLoadProject();
    }

    // Initialize stages data
    initializeStages() {
        this.stages = [
            {
                id: 1,
                title: "Molecular Composition Analysis",
                description: "Advanced analytical characterization using HPLC-MS/MS, NMR spectroscopy, and FTIR analysis to determine precise molecular structures and purity profiles.",
                days: [1, 2, 3]
            },
            {
                id: 2,
                title: "Thermodynamic Stability Assessment",
                description: "Comprehensive thermal analysis using DSC/TGA, accelerated stability testing, and dynamic vapor sorption (DVS) studies to evaluate formulation stability.",
                days: [4, 5, 6]
            },
            {
                id: 3,
                title: "Synergistic Interaction Modeling",
                description: "Computational molecular dynamics simulations and in-vitro interaction studies to optimize ingredient synergies and prevent antagonistic effects.",
                days: [7, 8, 9]
            },
            {
                id: 4,
                title: "Bioavailability Enhancement",
                description: "ADME profiling, dissolution optimization, and bioenhancement strategies using advanced delivery systems and absorption modulators.",
                days: [10, 11, 12]
            },
            {
                id: 5,
                title: "Regulatory Compliance Validation",
                description: "NOAEL calculations, safety margin assessments, and ICP-MS heavy metals analysis to ensure full regulatory compliance and safety standards.",
                days: [13, 14, 15]
            },
            {
                id: 6,
                title: "Microencapsulation Engineering",
                description: "Advanced particle engineering using spray-drying, fluid bed coating, and coacervation techniques with comprehensive particle size analysis.",
                days: [16, 17, 18]
            },
            {
                id: 7,
                title: "Analytical Method Development",
                description: "ICH Q2(R1) compliant method validation, HPLC method development, and stability-indicating assay protocols for quality control.",
                days: [19, 20, 21]
            },
            {
                id: 8,
                title: "Manufacturing Process Optimization",
                description: "Design of Experiments (DoE) approach with Process Analytical Technology (PAT) integration for scalable manufacturing protocols.",
                days: [22, 23, 24]
            },
            {
                id: 9,
                title: "Quality Control Implementation",
                description: "Statistical process control implementation, critical quality attributes definition, and comprehensive testing protocol establishment.",
                days: [25, 26]
            },
            {
                id: 10,
                title: "Final Product Characterization",
                description: "Complete product profiling using Arrhenius kinetics modeling, shelf-life prediction, and final specification documentation.",
                days: [27, 28]
            }
        ];
    }

    // Initialize event listeners
    initializeEventListeners() {
        // Edit project button
        const editBtn = document.getElementById('editProjectBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => this.editProject());
        }

        // Data change listener
        document.addEventListener('dataChanged', (e) => {
            this.handleDataChange(e.detail);
        });

        // Visibility change for auto-refresh
        document.addEventListener('visibilitychange', () => {
            this.handleVisibilityChange();
        });
    }

    // Auto-load project from URL
    autoLoadProject() {
        const pathParts = window.location.pathname.split('/');
        const slug = pathParts[pathParts.length - 1];
        
        if (slug && slug !== 'index.html') {
            this.loadProjectBySlug(slug);
        }
    }

    // Load project by slug
    async loadProjectBySlug(slug) {
        try {
            this.showLoading();
            
            const project = await this.dataManager.getProjectBySlug(slug);
            
            if (!project) {
                throw new Error('Project not found');
            }
            
            await this.loadProject(project);
            
        } catch (error) {
            console.error('Error loading project by slug:', error);
            this.showError(error.message);
        }
    }

    // Load project data
    async loadProject(project) {
        try {
            this.currentProject = project;
            
            // Update page title
            document.title = `${project.name} - Supplement Factory`;
            
            // Render project data
            this.renderProjectHeader();
            this.renderProjectOverview();
            this.renderRoadmap();
            this.renderProjectDetails();
            
            // Apply status theme
            this.applyStatusTheme();
            
            // Start auto-refresh if automation is running
            this.setupAutoRefresh();
            
            // Hide loading state
            this.hideLoading();
            
            console.log('Project loaded successfully:', project.name);
            
        } catch (error) {
            console.error('Error loading project:', error);
            this.showError('Failed to load project data');
        }
    }

    // Render project header
    renderProjectHeader() {
        const project = this.currentProject;
        
        // Update project title
        const titleElement = document.getElementById('projectTitle');
        if (titleElement) {
            titleElement.textContent = project.name;
        }
        
        // Update project URL
        const urlElement = document.getElementById('projectUrl');
        if (urlElement) {
            urlElement.textContent = `connect.supplementfactoryuk.com/projects/${project.slug}`;
        }
        
        // Update status badge
        const statusBadge = document.getElementById('projectStatusBadge');
        if (statusBadge) {
            const statusClass = project.status.toLowerCase().replace(' ', '-');
            statusBadge.className = `project-status-badge ${statusClass}`;
            
            const statusText = statusBadge.querySelector('.status-text');
            if (statusText) {
                statusText.textContent = project.status;
            }
        }
    }

    // Render project overview
    renderProjectOverview() {
        const project = this.currentProject;
        
        // Timeline info
        const startDateElement = document.getElementById('startDate');
        if (startDateElement) {
            startDateElement.textContent = Utils.formatDate(project.startDate);
        }
        
        const daysElapsedElement = document.getElementById('daysElapsed');
        if (daysElapsedElement) {
            daysElapsedElement.textContent = project.daysElapsed || 0;
        }
        
        const currentStageElement = document.getElementById('currentStage');
        if (currentStageElement) {
            currentStageElement.textContent = `${project.currentStage}/10`;
        }
        
        const overallProgressElement = document.getElementById('overallProgress');
        if (overallProgressElement) {
            overallProgressElement.textContent = `${Math.round(project.progress)}%`;
        }
        
        // Automation status
        const automationStatus = document.getElementById('automationStatus');
        if (automationStatus) {
            const statusClass = project.automationStatus.toLowerCase();
            automationStatus.className = `automation-status ${statusClass}`;
            
            const automationText = automationStatus.querySelector('.automation-text');
            if (automationText) {
                automationText.textContent = project.automationStatus;
            }
        }
        
        // Progress circle
        this.updateProgressCircle(project.progress);
        
        // Show notes if there are delay notes
        if (project.delayNotes && project.delayNotes.trim()) {
            this.showDelayNotes(project.delayNotes);
        }
    }

    // Update progress circle
    updateProgressCircle(progress) {
        const progressFill = document.getElementById('progressFill');
        const progressPercentage = document.getElementById('progressPercentage');
        
        if (progressFill && progressPercentage) {
            const circumference = 283; // 2 * π * 45
            const offset = circumference - (progress / 100) * circumference;
            
            progressFill.style.strokeDashoffset = offset;
            progressPercentage.textContent = `${Math.round(progress)}%`;
        }
    }

    // Show delay notes
    showDelayNotes(notes) {
        const notesCard = document.getElementById('notesCard');
        const notesContent = document.getElementById('delayNotes');
        
        if (notesCard && notesContent) {
            notesContent.textContent = notes;
            notesCard.style.display = 'block';
        }
    }

    // Render roadmap
    renderRoadmap() {
        const project = this.currentProject;
        const roadmapTimeline = document.getElementById('roadmapTimeline');
        
        if (!roadmapTimeline) return;
        
        const stagesHtml = this.stages.map(stage => {
            const isCompleted = stage.id < project.currentStage;
            const isActive = stage.id === project.currentStage;
            const stageProgress = this.calculateStageProgress(stage, project);
            
            let stageClass = '';
            if (isCompleted) stageClass = 'completed';
            else if (isActive) stageClass = 'active';
            
            const stageDates = Utils.getStageDates(project.startDate, stage.id);
            
            return `
                <div class="stage-item ${stageClass}">
                    <div class="stage-number">${stage.id}</div>
                    <div class="stage-content">
                        <h4 class="stage-title">${stage.title}</h4>
                        <div class="stage-dates">📅 ${stageDates}</div>
                        <p class="stage-description">${stage.description}</p>
                        <div class="stage-progress">
                            <div class="stage-progress-bar">
                                <div class="stage-progress-fill" style="width: ${stageProgress}%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        roadmapTimeline.innerHTML = stagesHtml;
    }

    // Calculate stage progress
    calculateStageProgress(stage, project) {
        if (stage.id < project.currentStage) {
            return 100; // Completed stages
        } else if (stage.id === project.currentStage) {
            // Current stage - calculate based on days elapsed within stage
            const daysPassed = project.daysElapsed || 0;
            const stageStartDay = stage.days[0];
            const stageEndDay = stage.days[stage.days.length - 1];
            const stageDuration = stageEndDay - stageStartDay + 1;
            
            if (daysPassed < stageStartDay) {
                return 0;
            } else if (daysPassed > stageEndDay) {
                return 100;
            } else {
                const daysIntoStage = daysPassed - stageStartDay + 1;
                return Math.min((daysIntoStage / stageDuration) * 100, 100);
            }
        } else {
            return 0; // Future stages
        }
    }

    // Render project details
    renderProjectDetails() {
        const project = this.currentProject;
        
        // Show details section if there's additional info
        if (project.description || project.createdAt || project.updatedAt) {
            const detailsSection = document.getElementById('projectDetails');
            if (detailsSection) {
                detailsSection.style.display = 'block';
            }
            
            // Update description
            const descriptionElement = document.getElementById('projectDescription');
            if (descriptionElement) {
                descriptionElement.textContent = project.description || 'No description available';
            }
            
            // Update created date
            const createdElement = document.getElementById('projectCreated');
            if (createdElement) {
                createdElement.textContent = Utils.formatDate(project.createdAt, 'long');
            }
            
            // Update last updated
            const updatedElement = document.getElementById('projectUpdated');
            if (updatedElement) {
                updatedElement.textContent = Utils.formatDate(project.updatedAt, 'long');
            }
        }
    }

    // Apply status theme
    applyStatusTheme() {
        const project = this.currentProject;
        const body = document.body;
        
        // Remove existing status classes
        body.classList.remove('in-progress', 'delayed', 'on-hold', 'cancelled', 'completed');
        
        // Add current status class
        const statusClass = project.status.toLowerCase().replace(' ', '-');
        body.classList.add(statusClass);
    }

    // Setup auto-refresh
    setupAutoRefresh() {
        // Clear existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Only auto-refresh if automation is running
        if (this.currentProject.automationStatus === 'Running') {
            this.updateInterval = setInterval(() => {
                this.refreshProject();
            }, 30000); // Refresh every 30 seconds
        }
    }

    // Refresh project data
    async refreshProject() {
        try {
            if (!this.currentProject) return;
            
            const updatedProject = await this.dataManager.getProject(this.currentProject.id);
            
            if (updatedProject) {
                await this.loadProject(updatedProject);
            }
            
        } catch (error) {
            console.error('Error refreshing project:', error);
        }
    }

    // Edit project
    editProject() {
        if (this.currentProject) {
            window.location.href = `${this.currentProject.slug}/edit`;
        }
    }

    // Handle data changes
    async handleDataChange(detail) {
        if (detail.action === 'update' && detail.data && detail.data.id === this.currentProject?.id) {
            // Reload project if it was updated
            await this.refreshProject();
        }
    }

    // Handle visibility change
    handleVisibilityChange() {
        if (document.hidden) {
            // Page is hidden - pause auto-refresh
            if (this.updateInterval) {
                clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
        } else {
            // Page is visible - resume auto-refresh
            this.setupAutoRefresh();
        }
    }

    // Show loading state
    showLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        
        document.body.classList.add('loading');
    }

    // Hide loading state
    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        
        document.body.classList.remove('loading');
    }

    // Show error state
    showError(message) {
        const errorOverlay = document.getElementById('errorOverlay');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorOverlay && errorMessage) {
            errorMessage.textContent = message;
            errorOverlay.style.display = 'flex';
        }
        
        this.hideLoading();
    }

    // Get current project
    getCurrentProject() {
        return this.currentProject;
    }

    // Cleanup
    cleanup() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Auto-initialize if on project page
let projectDashboard;

if (typeof window !== 'undefined') {
    // Check if we're on a project page
    const isProjectPage = window.location.pathname.includes('/projects/') && 
                         !window.location.pathname.includes('/edit');
    
    if (isProjectPage) {
        // Initialize when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                if (typeof DataManager !== 'undefined') {
                    const dataManager = new DataManager();
                    projectDashboard = new ProjectDashboard(dataManager);
                    window.projectDashboard = projectDashboard;
                }
            });
        } else {
            if (typeof DataManager !== 'undefined') {
                const dataManager = new DataManager();
                projectDashboard = new ProjectDashboard(dataManager);
                window.projectDashboard = projectDashboard;
            }
        }
    }
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (projectDashboard) {
            projectDashboard.cleanup();
        }
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProjectDashboard;
}

