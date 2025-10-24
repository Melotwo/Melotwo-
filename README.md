Melotwo Official Website
Official website repository for Melotwo, featuring certified safety solutions for the African mining industry. This site was migrated from a no-code platform to a modern, maintainable React/TypeScript architecture to enable long-term development and scalability.
🛠️ Technology Stack
This project is a single-page application built with modern web standards:
 * Framework: React
 * Language: TypeScript
 * Styling: Tailwind CSS (loaded via CDN in index.html)
🚀 Deployment (Netlify)
This project is configured for continuous deployment via Netlify.
Build Command: Netlify will automatically detect this as a React project and use the following command for building:
npm run build

Publish Directory: The build output will be located in the standard directory:
dist

Deployment Setup:
 * Connect this GitHub repository to a new Netlify site.
 * Netlify will automatically deploy a new version on every push to the main branch.
💻 Local Development
To run this site locally for testing or development, you would typically use a development server setup like Vite or Webpack. Since the provided files are just the core React components, here are the steps you would take if you were to fully initialize this as a new React project:
 * Clone the repository:
   git clone [your-repo-url]
cd [your-repo-name]

 * Install dependencies (requires Node.js):
   In a real React environment, you would run:
   npm install

 * Start the development server:
   In a real React environment, you would run:
   npm run dev

   The site would then be available at http://localhost:5173 (or similar port).
📂 File Structure
The key files for content are located within the src directory:
| File | Purpose |
|---|---|
| index.html | The main entry point, loads Tailwind CSS and the React script. |
| src/main.tsx | The React entry file that renders the main application component. |
| src/App.tsx | The main component containing all website content and UI logic. |
