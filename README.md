# Melotwo PPE Procurement Hub

Melotwo Official Website repository for Melotwo, featuring certified safety solutions for the African mining industry. This site was migrated from a no-code platform to a modern, maintainable React/TypeScript architecture to enable long-term development and scalability.

## 🛠 Technology Stack
This project is a single-page application built with modern web standards:
- Framework: React
- Language: TypeScript
- Styling: Tailwind CSS (loaded via CDN in index.html)

## 🚀 Deployment Status (Firebase Only)

This project is configured to deploy automatically to Firebase Hosting.

### Prerequisites for GitHub Actions:

1. Go to **Settings > Secrets and variables > Actions** in this repository.
2. Add the following Repository Secrets:
   - `API_KEY`: Your Google Gemini API Key.
   - `FIREBASE_SERVICE_ACCOUNT`: The content of your Firebase Service Account JSON file.

### How to Trigger a Deploy:

Simply **push any change** to this repository. The "Deploy to Firebase Hosting" workflow will run automatically.

## 💻 Local Development

To run this site locally:

1. Clone the repository.
2. Install dependencies: `npm install`
3. Create a `.env` file with `API_KEY=your_key_here`.
4. Start the server: `npm run dev`
