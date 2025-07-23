// Utility Functions for Multi-Project Tracker
// Common helper functions used throughout the application

class Utils {
    // Generate URL-friendly slug from text
    static generateSlug(text) {
        if (!text) return '';
        
        return text
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '') // Remove special characters
            .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    }

    // Generate unique project ID
    static generateProjectId() {
        return 'proj_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Format date for display
    static formatDate(date, format = 'short') {
        if (!date) return 'Not set';
        
        const d = new Date(date);
        if (isNaN(d.getTime())) return 'Invalid date';
        
        const options = {
            short: { month: 'short', day: 'numeric', year: 'numeric' },
            long: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
            relative: { month: 'short', day: 'numeric' }
        };
        
        return d.toLocaleDateString('en-US', options[format] || options.short);
    }

    // Calculate days between dates
    static daysBetween(startDate, endDate = new Date()) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    // Calculate project progress based on timeline
    static calculateProgress(startDate, currentStage, automationStatus) {
        if (!startDate) return 0;
        
        const start = new Date(startDate);
        const now = new Date();
        const daysPassed = this.daysBetween(start, now);
        
        // If automation is paused, use manual stage
        if (automationStatus === 'Paused') {
            return Math.min((currentStage / 10) * 100, 100);
        }
        
        // Calculate based on 28-day timeline
        const timelineProgress = Math.min((daysPassed / 28) * 100, 100);
        
        // Ensure we don't go below the current stage
        const stageProgress = (currentStage / 10) * 100;
        
        return Math.max(timelineProgress, stageProgress);
    }

    // Get current stage based on timeline
    static getCurrentStage(startDate, automationStatus, manualStage) {
        if (!startDate) return 1;
        
        // If automation is paused, use manual stage
        if (automationStatus === 'Paused') {
            return manualStage || 1;
        }
        
        const daysPassed = this.daysBetween(startDate);
        
        // Stage timeline (28 days total, ~2.8 days per stage)
        const stageTimeline = [
            { stage: 1, days: [1, 2, 3] },
            { stage: 2, days: [4, 5, 6] },
            { stage: 3, days: [7, 8, 9] },
            { stage: 4, days: [10, 11, 12] },
            { stage: 5, days: [13, 14, 15] },
            { stage: 6, days: [16, 17, 18] },
            { stage: 7, days: [19, 20, 21] },
            { stage: 8, days: [22, 23, 24] },
            { stage: 9, days: [25, 26] },
            { stage: 10, days: [27, 28] }
        ];
        
        for (const timeline of stageTimeline) {
            if (timeline.days.includes(daysPassed)) {
                return timeline.stage;
            }
        }
        
        // If beyond 28 days, project is complete
        return daysPassed > 28 ? 10 : Math.min(Math.ceil(daysPassed / 2.8), 10);
    }

    // Get stage dates based on start date
    static getStageDates(startDate, stage) {
        if (!startDate) return 'Not set';
        
        const start = new Date(startDate);
        const stageTimeline = [
            { stage: 1, days: [1, 2, 3] },
            { stage: 2, days: [4, 5, 6] },
            { stage: 3, days: [7, 8, 9] },
            { stage: 4, days: [10, 11, 12] },
            { stage: 5, days: [13, 14, 15] },
            { stage: 6, days: [16, 17, 18] },
            { stage: 7, days: [19, 20, 21] },
            { stage: 8, days: [22, 23, 24] },
            { stage: 9, days: [25, 26] },
            { stage: 10, days: [27, 28] }
        ];
        
        const timeline = stageTimeline.find(t => t.stage === stage);
        if (!timeline) return 'Invalid stage';
        
        const startDay = timeline.days[0];
        const endDay = timeline.days[timeline.days.length - 1];
        
        const startStageDate = new Date(start);
        startStageDate.setDate(start.getDate() + startDay - 1);
        
        const endStageDate = new Date(start);
        endStageDate.setDate(start.getDate() + endDay - 1);
        
        if (startDay === endDay) {
            return this.formatDate(startStageDate, 'relative');
        }
        
        return `${this.formatDate(startStageDate, 'relative')} - ${this.formatDate(endStageDate, 'relative')}`;
    }

    // Validate project data
    static validateProject(projectData) {
        const errors = [];
        
        if (!projectData.name || projectData.name.trim().length < 2) {
            errors.push('Project name must be at least 2 characters long');
        }
        
        if (!projectData.startDate) {
            errors.push('Start date is required');
        } else {
            const startDate = new Date(projectData.startDate);
            if (isNaN(startDate.getTime())) {
                errors.push('Start date must be a valid date');
            }
        }
        
        if (projectData.stage && (projectData.stage < 1 || projectData.stage > 10)) {
            errors.push('Stage must be between 1 and 10');
        }
        
        const validStatuses = ['In Progress', 'Delayed', 'On Hold', 'Cancelled', 'Completed'];
        if (projectData.status && !validStatuses.includes(projectData.status)) {
            errors.push('Invalid project status');
        }
        
        const validAutomation = ['Running', 'Paused'];
        if (projectData.automationStatus && !validAutomation.includes(projectData.automationStatus)) {
            errors.push('Invalid automation status');
        }
        
        return errors;
    }

    // Sanitize HTML to prevent XSS
    static sanitizeHtml(str) {
        if (!str) return '';
        
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // Debounce function for search/filter
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Throttle function for scroll events
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // Deep clone object
    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (typeof obj === 'object') {
            const clonedObj = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    clonedObj[key] = this.deepClone(obj[key]);
                }
            }
            return clonedObj;
        }
    }

    // Format file size
    static formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Generate random color for project avatars
    static generateProjectColor(projectName) {
        const colors = [
            '#DA1829', '#10b981', '#3b82f6', '#f59e0b', 
            '#8b5cf6', '#ef4444', '#06b6d4', '#84cc16',
            '#f97316', '#ec4899', '#6366f1', '#14b8a6'
        ];
        
        let hash = 0;
        for (let i = 0; i < projectName.length; i++) {
            hash = projectName.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        return colors[Math.abs(hash) % colors.length];
    }

    // Get project initials for avatar
    static getProjectInitials(projectName) {
        if (!projectName) return 'P';
        
        return projectName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');
    }

    // Check if slug is unique
    static isSlugUnique(slug, existingProjects, excludeId = null) {
        return !existingProjects.some(project => 
            project.slug === slug && project.id !== excludeId
        );
    }

    // Generate unique slug
    static generateUniqueSlug(baseName, existingProjects, excludeId = null) {
        let slug = this.generateSlug(baseName);
        let counter = 1;
        
        while (!this.isSlugUnique(slug, existingProjects, excludeId)) {
            slug = this.generateSlug(baseName) + '-' + counter;
            counter++;
        }
        
        return slug;
    }

    // Local storage helpers with error handling
    static setLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    static getLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    static removeLocalStorage(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    // URL helpers
    static getUrlParams() {
        const params = new URLSearchParams(window.location.search);
        const result = {};
        for (const [key, value] of params) {
            result[key] = value;
        }
        return result;
    }

    static updateUrlParams(params) {
        const url = new URL(window.location);
        Object.keys(params).forEach(key => {
            if (params[key] !== null && params[key] !== undefined) {
                url.searchParams.set(key, params[key]);
            } else {
                url.searchParams.delete(key);
            }
        });
        window.history.replaceState({}, '', url);
    }

    // Animation helpers
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.display = 'block';
        
        let start = null;
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.min(progress / duration, 1);
            
            element.style.opacity = opacity;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            }
        }
        
        requestAnimationFrame(animate);
    }

    static fadeOut(element, duration = 300) {
        let start = null;
        const initialOpacity = parseFloat(getComputedStyle(element).opacity);
        
        function animate(timestamp) {
            if (!start) start = timestamp;
            const progress = timestamp - start;
            const opacity = Math.max(initialOpacity - (progress / duration), 0);
            
            element.style.opacity = opacity;
            
            if (progress < duration) {
                requestAnimationFrame(animate);
            } else {
                element.style.display = 'none';
            }
        }
        
        requestAnimationFrame(animate);
    }

    // Error handling
    static handleError(error, context = 'Application') {
        console.error(`${context} Error:`, error);
        
        // You could integrate with error reporting service here
        // e.g., Sentry, LogRocket, etc.
        
        return {
            message: error.message || 'An unexpected error occurred',
            context: context,
            timestamp: new Date().toISOString()
        };
    }

    // Performance helpers
    static measurePerformance(name, fn) {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        
        console.log(`${name} took ${end - start} milliseconds`);
        return result;
    }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
    window.Utils = Utils;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}

