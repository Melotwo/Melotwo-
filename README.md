# Melotwo PPE Procurement Hub

Melotwo Official Website repository for Melotwo, featuring certified safety solutions for the African mining industry. This site features an AI assistant powered by Gemini to answer safety questions and find SABS-certified products.

## 🛠 Technology Stack
- **Framework:** React (Vite)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (CDN)
- **AI:** Google Gemini API
- **Hosting:** Firebase Hosting

## 🚀 Deployment (Firebase)

This project is configured for **Firebase Hosting** via GitHub Actions.

### 1. Prerequisites
- A Firebase project created at [console.firebase.google.com](https://console.firebase.google.com).
- The Firebase CLI installed locally (`npm install -g firebase-tools`).

### 2. Setup GitHub Secrets
For the automated deployment to work, you must set up secrets in your GitHub repository settings:

1. Go to your GitHub Repository -> **Settings** -> **Secrets and variables** -> **Actions**.
2. Add the following **Repository secrets**:
   - `API_KEY`: Your Google Gemini API Key. (Required for the build process).
   - `FIREBASE_SERVICE_ACCOUNT`: The service account JSON content.
     - *Note: You can generate this by running `firebase init hosting:github` locally, or by creating a Service Account in Google Cloud Console with "Firebase Hosting Admin" permissions and downloading the JSON key.*

### 3. Manual Deployment (Optional)
If you want to deploy manually from your computer:

1. Login: `firebase login`
2. Build the app: `npm run build` (Make sure you have a `.env` file with `API_KEY` for this to work locally).
3. Deploy: `firebase deploy`

## 💻 Local Development

1. Clone the repository.
2. Install dependencies: `npm install`
3. Create a `.env` file in the root directory:
   ```
   API_KEY=your_actual_api_key_here
   ```
4. Start the dev server: `npm run dev`
