# Deploying Super Student to Vercel

## Prerequisites

- GitHub account
- Vercel account (sign up at <https://vercel.com>)
- Repository pushed to GitHub

## Deployment Methods

### Method 1: Vercel Dashboard (Recommended for First Deployment)

1. **Go to Vercel Dashboard**
   - Visit <https://vercel.com/dashboard>
   - Click "Add New Project"

2. **Import Repository**
   - Select "Import Git Repository"
   - Choose your GitHub repository: `TeacherEvan/SuperstudentHTML`
   - Click "Import"

3. **Configure Project**
   - **Framework Preset:** Other (detected automatically)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Environment Variables** (if needed)
   - Currently no environment variables required
   - Add any future API keys here

5. **Deploy**
   - Click "Deploy"
   - Wait 1-2 minutes for build to complete
   - Your app will be live at `https://your-project-name.vercel.app`

### Method 2: Vercel CLI

1. **Install Vercel CLI**

   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**

   ```bash
   vercel login
   ```

3. **Deploy from Project Root**

   ```bash
   # For preview deployment
   npm run deploy:preview
   
   # For production deployment
   npm run deploy
   ```

4. **Follow Prompts**
   - Link to existing project or create new
   - Confirm settings
   - Deployment URL will be displayed

## Automatic Deployments

Once connected to GitHub:

- **Production**: Every push to `main` branch auto-deploys to production
- **Preview**: Every pull request gets a preview deployment
- **Rollback**: Easy rollback in Vercel dashboard

## Build Optimization

The project is already optimized for Vercel:

- ✅ Webpack production build with minification
- ✅ CSS extraction and optimization
- ✅ Asset hashing for cache busting
- ✅ Gzip compression
- ✅ Code splitting
- ✅ Tree shaking

## Custom Domain (Optional)

1. Go to Project Settings in Vercel Dashboard
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Monitoring

- **Analytics**: Enable in Project Settings
- **Logs**: View real-time logs in Vercel Dashboard
- **Performance**: Built-in Web Vitals monitoring

## Troubleshooting

### Build Fails

Check build logs in Vercel dashboard:

- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility
- Check for TypeScript/linting errors

### Assets Not Loading

- Verify `publicPath: '/'` in webpack.config.js
- Check network tab in browser DevTools
- Ensure assets are in `dist/` after build

### Performance Issues

- Run `npm run build:analyze` locally
- Check bundle size in Vercel dashboard
- Review Web Vitals metrics

## Post-Deployment Checklist

- [ ] Test all game levels
- [ ] Verify mobile responsiveness
- [ ] Check audio playback
- [ ] Test on different browsers
- [ ] Verify HTTPS is working
- [ ] Check loading performance
- [ ] Test all interactive elements

## Support

For Vercel-specific issues:

- Documentation: <https://vercel.com/docs>
- Support: <https://vercel.com/support>

For game issues:

- GitHub Issues: <https://github.com/TeacherEvan/SuperstudentHTML/issues>
