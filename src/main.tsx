import { Component, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <script>
      // Load Tailwind CSS from CDN for styling
      const script = document.createElement('script');
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);

      // Load Klaviyo's API script for tracking and forms
      (function(a, b) {
        a.klaviyo = a.klaviyo || [];
        a.klaviyo.init = function(a, b) {
          klaviyo.init.list = b;
          klaviyo.init.publicToken = a;
        };
        a.klaviyo.load = function(a) {
          var b = document.createElement("script");
          b.type = "text/javascript";
          b.src = "https://static.klaviyo.com/js/api/klaviyo.js";
          b.async = !0;
          b.onload = function() {
            klaviyo.init(a, klaviyo.init.list);
          };
          document.getElementsByTagName("head")[0].appendChild(b);
        };
      })(window, document);

      // Ensure the font is Inter (Tailwind default)
      document.documentElement.classList.add('font-sans');
    </script>
    
    <div class="min-h-screen bg-gray-50 flex flex-col font-sans antialiased">
      <!-- Floating Chat Button -->
      <button 
        (click)="openChat()" 
        class="fixed bottom-6 right-6 z-50 p-4 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-red-300"
        title="Melotwo AI Assistant"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.805A9.73 9.73 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      <!-- Header/Navigation -->
      <header class="bg-white shadow-md sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 class="text-3xl font-extrabold text-red-600">Melotwo</h1>
          <nav class="hidden md:flex space-x-8">
            <a href="#compliance" class="text-gray-600 hover:text-red-600 transition duration-150">Compliance</a>
            <a href="#partnership" class="text-gray-600 hover:text-red-600 transition duration-150">Partnership</a>
            <a href="#contact" class="text-gray-600 hover:text-red-600 transition duration-150">Contact</a>
            <a [href]="AFFILIATE_LINK" target="_blank" class="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition duration-150 shadow-md">
              Explore Catalog
            </a>
          </nav>
          <button class="md:hidden text-gray-600 hover:text-red-600">
             <!-- Icon omitted for brevity -->
          </button>
        </div>
      </header>

      <main class="flex-grow">
        
        <!-- Hero Section -->
        <section class="bg-gray-900 text-white py-20 md:py-32">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p class="text-red-400 font-semibold uppercase tracking-widest mb-3">SABS/ISO Certified PPE</p>
            <h2 class="text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              The Only Supply Chain Built for <span class="text-red-600">African Mining Compliance</span>.
            </h2>
            <p class="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
              Melotwo partners with the best in the industry to ensure your site is 100% compliant, reduces risk, and cuts replacement costs with superior, certified equipment.
            </p>
            <a [href]="AFFILIATE_LINK" target="_blank" class="inline-block px-10 py-4 text-lg font-bold text-gray-900 bg-amber-400 rounded-xl hover:bg-amber-300 transition duration-300 transform hover:scale-105 shadow-xl">
              View Certified Catalog Now
            </a>
          </div>
        </section>

        <!-- Compliance & Risk Section -->
        <section id="compliance" class="py-20 bg-white">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 class="text-3xl font-bold text-center text-gray-800 mb-12">Stop Risk. Guarantee Compliance.</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
              <!-- Feature Card 1 -->
              <div class="bg-white p-6 rounded-xl shadow-lg border-t-4 border-red-600">
                <div class="text-red-600 mb-4">
                  <!-- Icon omitted -->
                </div>
                <h4 class="text-xl font-semibold mb-3 text-gray-900">SABS/ISO Guarantee</h4>
                <p class="text-gray-600">We only source equipment with verifiable SABS and international ISO certifications, removing guesswork and liability from your procurement team.</p>
              </div>
              
              <!-- Feature Card 2 -->
              <div class="bg-white p-6 rounded-xl shadow-lg border-t-4 border-red-600">
                <div class="text-red-600 mb-4">
                  <!-- Icon omitted -->
                </div>
                <h4 class="text-xl font-semibold mb-3 text-gray-900">Durability = Savings</h4>
                <p class="text-gray-600">Higher quality gear lasts longer in harsh African mine conditions, significantly reducing your annual replacement frequency and associated costs.</p>
              </div>
              
              <!-- Feature Card 3 -->
              <div class="bg-white p-6 rounded-xl shadow-lg border-t-4 border-red-600">
                <div class="text-red-600 mb-4">
                  <!-- Icon omitted -->
                </div>
                <h4 class="text-xl font-semibold mb-3 text-gray-900">Streamlined Logistics</h4>
                <p class="text-gray-600">Access consolidated bulk quotes and rapid fulfillment from a single source, drastically cutting administrative time and supply chain complexity.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Partnership Section -->
        <section id="partnership" class="bg-gray-100 py-20">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 class="text-3xl font-bold text-gray-800 mb-4">Official Affiliate Partner of Mine Africa Safety Solutions</h3>
            <p class="text-xl text-gray-600 max-w-4xl mx-auto mb-10">
              We have integrated the full, certified catalog of Mine Africa Safety Solutions directly into our supply chain—giving you unparalleled access to the best mine-grade PPE.
            </p>
            
            <a [href]="AFFILIATE_LINK" target="_blank" class="inline-block px-8 py-3 text-lg font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 transition duration-300 shadow-lg">
              Browse Partner Catalog
            </a>
          </div>
        </section>

        <!-- Contact/Sign-up Section -->
        <section id="contact" class="py-20 bg-red-600">
          <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h3 class="text-3xl md:text-4xl font-extrabold text-white mb-4">Secure Your B2B Pricing and Compliance Checklist</h3>
            <p class="text-xl text-red-100 mb-8">
              Enter your professional email to receive the full certified product catalog and our essential Mine Safety Compliance Checklist.
            </p>
            
            <form (submit)="submitForm($event)" class="space-y-4">
              <div>
                <input 
                  type="email" 
                  placeholder="Your Professional Email Address" 
                  required
                  (input)="email.set($any($event.target).value)"
                  class="w-full px-6 py-3 rounded-xl focus:ring-amber-400 focus:border-amber-400 border-gray-300 text-gray-900"
                >
              </div>
              <div>
                <button 
                  type="submit" 
                  [disabled]="!email()"
                  class="w-full px-6 py-3 text-lg font-bold text-gray-900 bg-amber-400 rounded-xl hover:bg-amber-300 transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  Get Catalog & Checklist
                </button>
              </div>
              <p *ngIf="message()" [class]="'text-sm font-semibold ' + (isSuccess() ? 'text-white' : 'text-red-200')">{{ message() }}</p>
            </form>
          </div>
        </section>

      </main>

      <!-- Footer -->
      <footer class="bg-gray-900 text-gray-400 py-8">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p>&copy; {{ currentYear }} Melotwo. All rights reserved. | Official Affiliate Partner of Mine Africa Safety Solutions.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    /* Custom utility to simplify font smoothing */
    .font-sans {
      font-family: 'Inter', sans-serif;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  currentYear = new Date().getFullYear();
  email = signal('');
  message = signal('');
  isSuccess = signal(false);

  // --- Constants ---
  // FINAL KLAVIYO LIST ID:
  KLAVYO_LIST_ID = 'UpjtAE'; 
  
  // FINAL KLAVIYO ACCOUNT ID:
  KLAVYO_ACCOUNT_ID = 'U3wcsH'; 

  // This is the correct, hardcoded affiliate link based on your documents.
  AFFILIATE_LINK = 'https://www.mineafricasafetysolutions.com/catalog?affiliate_id=pPuyfECz9SHZrRc3w6zFwfW2f5yYo8LiN2hys3dTZKlSJrY2ypA72w21manqCKOA';

  // Function to open the AI chat window
  openChat() {
    // This assumes ai_chatbot_app.html is deployed to the root of your Netlify site.
    const url = 'ai_chatbot_app.html';
    const name = 'MelotwoAIChatbot';
    const specs = 'width=400,height=600,resizable=yes,scrollbars=yes,status=yes';
    window.open(url, name, specs);
  }

  // Handle form submission to Klaviyo
  submitForm(event: Event) {
    event.preventDefault();
    this.message.set('Submitting...');
    this.isSuccess.set(false);

    // Basic client-side validation
    if (!this.email()) {
      this.message.set('Please provide a valid email.');
      return;
    }

    const emailValue = this.email();
    const listId = this.KLAVYO_LIST_ID;
    const accountId = this.KLAVYO_ACCOUNT_ID;

    // Use a small utility function for exponential backoff on fetch
    const fetchWithRetry = async (url: string, options: RequestInit, retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          const response = await fetch(url, options);
          if (response.ok) return response;
          // Retry on non-OK but recoverable status codes (e.g., 5xx errors)
          if (response.status >= 500) throw new Error(`Server error: ${response.status}`);
          return response; // Return non-retryable errors like 4xx immediately
        } catch (error) {
          if (i < retries - 1) {
            const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            throw error;
          }
        }
      }
      throw new Error('Fetch failed after multiple retries.');
    };

    const apiKey = ""; 
    const apiUrl = `https://a.klaviyo.com/api/v1/list/${listId}/subscribe?api_key=${accountId}`;

    const payload = {
      a: accountId,
      email: emailValue,
      'g': listId,
      'g$id': listId, // For older Klaviyo forms
      'g$email': emailValue,
      '$fields': {
          '$email': emailValue,
      },
    };

    fetchWithRetry(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded' // Klaviyo legacy endpoint expects form-urlencoded
        },
        body: new URLSearchParams(payload as Record<string, string>).toString()
    })
    .then(response => {
        if (response.ok) {
            this.message.set('Success! Your catalog and checklist are on the way.');
            this.isSuccess.set(true);
            this.email.set(''); // Clear email field on success
        } else {
            // Try to read error body if available
            response.json().then(errorData => {
                const errorMessage = errorData.detail || 'Subscription failed. Please try again.';
                this.message.set(errorMessage);
                this.isSuccess.set(false);
            }).catch(() => {
                this.message.set('Subscription failed due to an unknown error.');
                this.isSuccess.set(false);
            });
        }
    })
    .catch(error => {
        console.error('Klaviyo API Error:', error);
        this.message.set('Network error. Check your connection or try again later.');
        this.isSuccess.set(false);
    });
  }
}
