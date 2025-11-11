# 🚀 Attio CRM Plugin for Front

A Front sidebar plugin that integrates Attio CRM, allowing you to view and update contact details, company information, and deals directly from Front conversations.

---

## ✨ Features

- 📧 **Automatic Contact Matching**: Matches contacts by "from" email address
- 👤 **Contact Management**: View and edit person details (name, email, phone, job title, organization)
- 🏢 **Company Management**: View and edit company information (domain)
- 💼 **Deal Tracking**: View all deals and create new ones
- ➕ **Contact Creation**: Create new Attio contacts when not found
- 🌓 **Dark Mode**: Automatic dark/light mode support
- 🐛 **Debug Mode**: Comprehensive debugging tools for development

---

## 📋 Prerequisites

Before you start, make sure you have:

- ✅ **Node.js installed** (v18 or higher) - [Download here](https://nodejs.org/)
- ✅ **Front account** with admin/developer access
- ✅ **Attio account** with API access
- ✅ **Attio API key** (you have this!)
- ✅ **Git installed** (for deployment) - [Download here](https://git-scm.com/)

---

## 🛠️ Part 1: Local Development Setup

Follow these steps to run the plugin locally for testing.

### Step 1: Download the Plugin Files

1. Open Terminal (Mac) or Command Prompt (Windows)
2. Navigate to where you want to save the plugin:
   ```bash
   cd Desktop
   ```
3. If you have the files in a folder, navigate into it:
   ```bash
   cd attio-front-plugin
   ```

### Step 2: Install Dependencies

Run this command to install all required packages:

```bash
npm install
```

⏳ This may take 1-2 minutes. You'll see a progress bar.

### Step 3: Start the Development Server

Run this command to start the plugin:

```bash
npm run dev
```

✅ You should see output like:
```
  VITE v5.0.8  ready in 234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.1.x:3000/
```

🎉 **The plugin is now running!** Keep this terminal window open.

### Step 4: Configure Front to Use Your Plugin

1. **Open Front**: Go to https://app.frontapp.com
2. **Go to Settings**: Click your profile → Company settings
3. **Open Developers Tab**: Click "Developers" in the left sidebar
4. **Create New App**:
   - Click "+ New app"
   - Name: "Attio CRM Plugin"
   - Description: "View and update Attio CRM data from Front"
   - Click "Create"

5. **Add Plugin Feature**:
   - In your new app, click "+ Add feature"
   - Select "Plugin"
   - Choose "Sidebar" as the plugin type
   - Plugin URL: `http://localhost:3000`
   - Name: "Attio CRM"
   - Click "Create"

6. **Enable the Plugin**:
   - Toggle the plugin to "Enabled"
   - Click "Install app" in your workspace

### Step 5: Test the Plugin

1. Open Front in your browser
2. Select any conversation with an email
3. Look for "Attio CRM" in the right sidebar
4. Click it to see the plugin in action! 🎉

### Step 6: Debug Mode (Optional)

To see detailed debugging information:

1. In your Front app settings, edit your plugin URL to:
   ```
   http://localhost:3000?debug=true
   ```
2. Reload Front
3. Open the plugin - you'll see a "Debug Console" section with detailed information

---

## 🌐 Part 2: Production Deployment (Vercel)

Once you've tested locally, deploy the plugin permanently so it works 24/7.

### Step 1: Create a GitHub Account

If you don't have one:

1. Go to https://github.com/signup
2. Enter your email, create a password
3. Verify your email address
4. Choose the free plan

### Step 2: Install GitHub Desktop (Easier Option)

**Option A: GitHub Desktop (Recommended for Beginners)**

1. Download GitHub Desktop: https://desktop.github.com/
2. Install and open it
3. Sign in with your GitHub account
4. Click "File" → "Add Local Repository"
5. Select your `attio-front-plugin` folder
6. Click "Publish repository"
   - Name: `attio-front-plugin`
   - Description: "Attio CRM plugin for Front"
   - ✅ Keep "Keep this code private" checked (unless you want it public)
7. Click "Publish repository"

**Option B: Command Line (Advanced)**

```bash
# Navigate to your plugin folder
cd attio-front-plugin

# Initialize git repository
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit"

# Create repository on GitHub (follow prompts)
gh repo create attio-front-plugin --private --source=. --push
```

### Step 3: Create a Vercel Account

1. Go to https://vercel.com/signup
2. Click "Continue with GitHub"
3. Authorize Vercel to access your GitHub account
4. You're now signed in!

### Step 4: Deploy to Vercel

1. **Import Project**:
   - On Vercel dashboard, click "Add New" → "Project"
   - Click "Import" next to your `attio-front-plugin` repository
   
2. **Configure Project**:
   - Framework Preset: Vite
   - Root Directory: `./` (leave as default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   
3. **Deploy**:
   - Click "Deploy"
   - Wait 1-2 minutes for build to complete
   - ✅ You'll see "Congratulations!" when done

4. **Get Your URL**:
   - Copy your deployment URL (something like `https://attio-front-plugin.vercel.app`)

### Step 5: Update Front Plugin Settings

1. Go back to Front → Settings → Developers
2. Find your "Attio CRM Plugin" app
3. Click "Edit" on your plugin feature
4. Update the Plugin URL to your Vercel URL:
   ```
   https://attio-front-plugin.vercel.app
   ```
   Or for debug mode:
   ```
   https://attio-front-plugin.vercel.app?debug=true
   ```
5. Click "Save"

### Step 6: Test Production Plugin

1. Refresh Front in your browser
2. Open any conversation
3. Open the Attio CRM plugin
4. It now works from your permanent URL! 🎉

---

## 🔄 Making Updates

When you need to change the plugin:

### Local Changes

1. Stop the dev server (Ctrl+C in terminal)
2. Edit your files
3. Restart: `npm run dev`
4. Test changes

### Deploy Changes to Production

**Using GitHub Desktop:**
1. Open GitHub Desktop
2. You'll see your changes listed
3. Add a commit message (e.g., "Fixed bug in deal creation")
4. Click "Commit to main"
5. Click "Push origin"
6. Vercel automatically redeploys! ⚡

**Using Command Line:**
```bash
git add .
git commit -m "Description of changes"
git push
```

Vercel will automatically rebuild and deploy your changes in ~2 minutes.

---

## 🐛 Troubleshooting

### Plugin Won't Load in Front

**Problem**: Blank screen or "Failed to load" error

**Solutions**:
1. Check that your dev server is running (`npm run dev`)
2. Verify the URL in Front matches exactly
3. Try hard refresh in browser (Ctrl+Shift+R or Cmd+Shift+R)
4. Check browser console for errors (F12 → Console tab)

### "npm install" Fails

**Problem**: Errors during package installation

**Solutions**:
1. Make sure Node.js is installed: `node --version`
2. Try deleting `node_modules` folder and `package-lock.json`:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```
3. Update npm: `npm install -g npm@latest`

### Attio API Errors

**Problem**: "Attio API Error" messages in plugin

**Solutions**:
1. Verify your API key is correct in `src/attioApi.ts`
2. Check API key has necessary permissions in Attio
3. Verify object IDs are correct for your Attio workspace
4. Check Attio API status: https://status.attio.com/

### No Contact Found

**Problem**: Plugin says "Contact Not Found" for valid emails

**Solutions**:
1. Verify the email exists in Attio
2. Check the email spelling matches exactly
3. Use the "Create New Contact" button to add them
4. Try debug mode to see what email was extracted

### Vercel Deployment Fails

**Problem**: Build fails on Vercel

**Solutions**:
1. Check that `npm run build` works locally
2. Review build logs in Vercel dashboard
3. Verify all files are committed to GitHub
4. Check that TypeScript has no errors: `npm run type-check`

### Debug Mode Not Working

**Problem**: Debug panel doesn't appear

**Solutions**:
1. Make sure URL has `?debug=true` at the end
2. Hard refresh the browser
3. Check that you updated the URL in Front settings

---

## 📝 Customization

### Changing the API Key

If you need to update your Attio API key:

1. Open `src/attioApi.ts`
2. Find this line:
   ```typescript
   apiKey: 'your-api-key-here',
   ```
3. Replace with your new API key
4. Save and redeploy

### Changing Object IDs

If your Attio object IDs are different:

1. Open `src/attioApi.ts`
2. Update these constants:
   ```typescript
   const PEOPLE_OBJECT_ID = 'your-people-id';
   const COMPANY_OBJECT_ID = 'your-company-id';
   const DEAL_OBJECT_ID = 'your-deal-id';
   ```
3. Save and redeploy

### Customizing Colors

To change the plugin colors:

1. Open `src/index.css`
2. Edit the CSS variables:
   ```css
   --accent-color: #2563eb;  /* Main blue color */
   --success-color: #22c55e;  /* Green for success */
   --error-color: #ef4444;    /* Red for errors */
   ```
3. Save and see changes immediately in dev mode

---

## 📚 File Structure

```
attio-front-plugin/
├── src/
│   ├── components/           # UI components
│   │   ├── PersonCard.tsx    # Contact details card
│   │   ├── CompanyCard.tsx   # Company details card
│   │   ├── DealsSection.tsx  # Deals list and creation
│   │   ├── CreatePersonCard.tsx  # New contact form
│   │   └── DebugPanel.tsx    # Debug console
│   ├── providers/
│   │   └── FrontContext.tsx  # Front SDK context provider
│   ├── App.tsx               # Main application component
│   ├── App.css               # Styles and animations
│   ├── main.tsx              # Application entry point
│   ├── index.css             # Global styles
│   ├── types.ts              # TypeScript type definitions
│   └── attioApi.ts           # Attio API integration
├── index.html                # HTML entry point
├── package.json              # Dependencies and scripts
├── tsconfig.json             # TypeScript configuration
├── vite.config.ts            # Vite build configuration
├── plugin-plan.md            # Implementation roadmap
└── README.md                 # This file!
```

---

## 🎓 Learning Resources

### Front Plugin Development
- [Front Plugin SDK Overview](https://dev.frontapp.com/docs/plugin-overview)
- [Front Plugin SDK Reference](https://dev.frontapp.com/reference/plugin-sdk-objects)
- [Front Plugin Examples](https://github.com/frontapp/plugin-getting-started)

### Attio API
- [Attio API Documentation](https://attio.com/docs/standard-objects)
- [Attio API Reference](https://attio.com/docs/api-reference)

### React & TypeScript
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

### Vercel Deployment
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Git Integration](https://vercel.com/docs/git)

---

## ❓ Getting Help

If you're stuck:

1. **Check the plugin-plan.md file** for detailed implementation notes
2. **Enable debug mode** to see what's happening
3. **Check browser console** (F12) for error messages
4. **Review Vercel build logs** if deployment fails
5. **Check Attio API status** at https://status.attio.com/
6. **Verify Front plugin status** at https://status.front.com/

---

## 🎉 Success!

You now have a fully functional Attio CRM plugin for Front!

**What you can do:**
- ✅ View contact details from emails
- ✅ Update contact and company information
- ✅ Track all deals for contacts
- ✅ Create new contacts and deals
- ✅ Work seamlessly without leaving Front

**Next steps:**
- Share the plugin with your team
- Customize it to fit your workflow
- Track how much time you save!

---

## 📄 License

This plugin is provided as-is for use with Front and Attio.

---

**Built with ❤️ for Front and Attio users**

*Last updated: November 9, 2025*
