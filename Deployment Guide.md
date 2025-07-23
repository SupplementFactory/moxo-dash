# Deployment Guide
## Supplement Factory Multi-Project Tracker

This guide covers deploying the multi-project tracker to `connect.supplementfactoryuk.com` with proper URL routing and cloud-ready architecture.

## 🚀 Quick Deployment

### Option 1: Static Hosting (Recommended)
Deploy to any static hosting service that supports client-side routing:

**Netlify:**
1. Upload the entire project folder
2. Set build command: `echo "No build required"`
3. Set publish directory: `.` (root)
4. Add `_redirects` file: `/* /index.html 200`

**Vercel:**
1. Upload project folder
2. Add `vercel.json` with rewrites configuration
3. Deploy with zero configuration

**AWS S3 + CloudFront:**
1. Upload to S3 bucket
2. Configure CloudFront for SPA routing
3. Set error pages to redirect to index.html

### Option 2: Server Deployment
For server-based deployment with proper URL routing:

**Apache (.htaccess):**
```apache
RewriteEngine On
RewriteBase /

# Handle project URLs
RewriteRule ^projects/([^/]+)/?$ projects/index.html [L]
RewriteRule ^projects/([^/]+)/edit/?$ projects/edit.html [L]

# Handle main dashboard
RewriteRule ^/?$ index.html [L]

# Handle 404s
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . index.html [L]
```

**Nginx:**
```nginx
server {
    listen 80;
    server_name connect.supplementfactoryuk.com;
    root /var/www/supplement-tracker;
    index index.html;

    # Handle project URLs
    location ~ ^/projects/([^/]+)/?$ {
        try_files /projects/index.html =404;
    }
    
    location ~ ^/projects/([^/]+)/edit/?$ {
        try_files /projects/edit.html =404;
    }

    # Handle all other routes
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 🗄️ Database Integration (Cloud Ready)

### MySQL Setup
The application is prepared for MySQL integration. To enable:

1. **Database Schema:**
```sql
CREATE DATABASE supplement_tracker;

CREATE TABLE projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    current_stage INT DEFAULT 1,
    status ENUM('In Progress', 'Delayed', 'On Hold', 'Cancelled', 'Completed') DEFAULT 'In Progress',
    automation_status ENUM('Running', 'Paused') DEFAULT 'Running',
    delay_notes TEXT,
    progress DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE project_stages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id INT,
    stage_number INT,
    title VARCHAR(255),
    description TEXT,
    start_date DATE,
    end_date DATE,
    progress DECIMAL(5,2) DEFAULT 0.00,
    status ENUM('pending', 'active', 'completed') DEFAULT 'pending',
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);
```

2. **API Endpoints:**
Create these endpoints for full functionality:
- `GET /api/projects` - List all projects
- `GET /api/projects/:slug` - Get project by slug
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

3. **Update Data Manager:**
Replace localStorage calls in `js/data-manager.js` with API calls.

### AWS Integration
For AWS deployment with RDS MySQL:

1. **RDS Setup:**
   - Create MySQL RDS instance
   - Configure security groups
   - Set up database schema

2. **Lambda Functions:**
   - Create serverless API endpoints
   - Handle CORS for frontend requests
   - Implement authentication if needed

3. **CloudFront + S3:**
   - Deploy frontend to S3
   - Configure CloudFront for global CDN
   - Set up custom domain

## 🔧 Configuration

### Environment Variables
For production deployment, configure:

```bash
# Database
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=supplement_tracker

# Domain
DOMAIN=connect.supplementfactoryuk.com
API_BASE_URL=https://api.supplementfactoryuk.com

# Features
ENABLE_ANALYTICS=true
ENABLE_NOTIFICATIONS=true
```

### URL Structure
The application supports these URL patterns:

- `/` - Main dashboard
- `/projects/:slug` - Individual project dashboard
- `/projects/:slug/edit` - Project edit form
- `/api/projects` - API endpoints (if using server)

## 📱 Mobile Optimization

The application is fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🔒 Security Considerations

### Production Checklist:
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Implement rate limiting
- [ ] Add authentication if needed
- [ ] Sanitize all user inputs
- [ ] Enable security headers
- [ ] Regular security updates

### Content Security Policy:
```html
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'unsafe-inline';
    style-src 'self' 'unsafe-inline' fonts.googleapis.com;
    font-src 'self' fonts.gstatic.com;
    img-src 'self' data:;
    connect-src 'self' api.supplementfactoryuk.com;
">
```

## 📊 Analytics & Monitoring

### Google Analytics Setup:
Add to `<head>` section:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Performance Monitoring:
- Monitor page load times
- Track user interactions
- Monitor API response times
- Set up error logging

## 🚀 Deployment Commands

### Local Development:
```bash
# Start local server
npm start
# or
python3 -m http.server 8000

# Access at: http://localhost:8000
```

### Production Build:
```bash
# No build process required for static files
# Simply upload all files to your hosting service

# For server deployment:
# 1. Upload files to server
# 2. Configure web server (Apache/Nginx)
# 3. Set up database (if using MySQL)
# 4. Configure domain and SSL
```

## 🔄 Updates & Maintenance

### Regular Tasks:
- Monitor project data integrity
- Update browser compatibility
- Review security patches
- Backup project data
- Monitor performance metrics

### Version Control:
- Tag releases with semantic versioning
- Maintain changelog
- Test before deployment
- Use staging environment

## 📞 Support

For deployment assistance:
- Technical Documentation: See README.md
- Issue Tracking: GitHub Issues
- Contact: support@supplementfactoryuk.com

---

**Note:** This deployment guide assumes you have basic knowledge of web hosting and server administration. For complex deployments, consider consulting with a DevOps specialist.

