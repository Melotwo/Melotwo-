import { Component, signal, ChangeDetectionStrategy, computed } from '@angular/core';

// NOTE: Tailwind CSS classes are assumed to be available globally in the HTML template.

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <div class="min-h-screen bg-gray-50 font-sans antialiased text-gray-800">
      
      <!-- Header / Navigation -->
      <header class="fixed top-0 left-0 right-0 z-40 bg-white shadow-md">
        <nav class="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div class="flex items-center space-x-2 cursor-pointer" (click)="scrollToSection('home')">
            <span class="text-3xl font-extrabold text-red-600">M</span>
            <span class="text-xl font-bold tracking-widest text-gray-800 hidden sm:block">MELOTWO</span>
          </div>
          <div class="flex space-x-6">
            @for (section of ['home', 'services', 'partnership', 'contact']; track section) {
              <button
                (click)="scrollToSection(section)"
                class="text-sm font-medium uppercase transition duration-150 ease-in-out pb-1 
                       {{ activeSection() === section ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-600 hover:text-red-600 hover:border-b-2 hover:border-red-300' }}"
              >
                {{ section | titlecase }}
              </button>
            }
          </div>
        </nav>
      </header>

      <main class="pt-20">
        <!-- 1. Hero Section - FASTEST LOADING BACKGROUND -->
        <section id="home" class="relative h-screen flex items-center overflow-hidden bg-gray-100/50">
          <!-- Background: Simple, fast-loading, pure Tailwind gradient/color -->
          <div class="absolute inset-0 z-0 bg-gradient-to-br from-red-50/70 to-white/70">
            <div class="absolute inset-0 bg-red-100 opacity-20"></div>
          </div>
          
          <div class="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-16">
            <div class="max-w-3xl">
              <h1 class="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight text-gray-900 drop-shadow-md">
                Safety is not a cost. <span class="text-red-600">It is an investment.</span>
              </h1>
              <p class="mt-6 text-xl text-gray-600 max-w-lg">
                **Melotwo** specializes in the procurement of SABS and ISO-certified personal protective equipment (PPE) for the African mining sector.
              </p>
              <button 
                (click)="scrollToSection('partnership')"
                class="mt-8 px-8 py-3 bg-red-600 text-white text-lg font-semibold rounded-lg shadow-xl hover:bg-red-700 transition duration-300 transform hover:scale-105"
              >
                View Our Certified Catalog
              </button>
            </div>
          </div>
        </section>

        <!-- 2. Services Section -->
        <section id="services" class="py-20 bg-white">
          <div class="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 class="text-4xl font-bold text-center text-gray-900 mb-4">Our Core Value Proposition</h2>
            <p class="text-xl text-center text-gray-500 max-w-3xl mx-auto mb-16">
              We solve the complex challenge of securing high-quality, fully compliant safety gear for high-risk industrial operations.
            </p>
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-10">
              @for (service of services(); track service.title) {
                <div class="bg-gray-50 p-8 rounded-xl shadow-lg border-t-4 border-red-500 hover:shadow-xl transition duration-300">
                  <div class="text-red-600 mb-4 h-12 w-12 flex items-center justify-center rounded-full bg-red-100">
                    <!-- Icon is rendered as safe HTML content -->
                    <div [innerHTML]="service.icon"></div>
                  </div>
                  <h3 class="text-2xl font-semibold text-gray-900 mb-3">{{ service.title }}</h3>
                  <p class="text-gray-600">{{ service.description }}</p>
                </div>
              }
            </div>
          </div>
        </section>

        <!-- 3. Partnership Section (Lead Capture) -->
        <section id="partnership" class="py-20 bg-gray-900 text-white">
          <div class="container mx-auto px-4 sm:px-6 lg:px-8">
            <div class="text-center max-w-4xl mx-auto">
              <h2 class="text-4xl font-bold mb-4 text-red-400">Strategic Partnership: Mine Africa Safety Solutions</h2>
              <p class="text-xl mb-10 text-gray-300">
                We are proud to announce our exclusive partnership with **Mine Africa Safety Solutions**. This alliance ensures direct access to their entire compliant catalog, backed by our streamlined logistics.
              </p>

              <div class="bg-white p-8 md:p-12 rounded-xl shadow-2xl text-gray-800">
                <h3 class="text-3xl font-bold mb-4">Ready to Level Up Your Compliance?</h3>
                <p class="mb-6 text-gray-600">
                  Get instant access to the full Mine Africa catalog and a specialized B2B pricing sheet by joining our Safety Procurement Newsletter.
                </p>
                <form (ngSubmit)="handleKlaviyoSubmit($event)" class="max-w-lg mx-auto space-y-4">
                  <input 
                    type="email" 
                    placeholder="Enter your Work Email" 
                    required 
                    [ngModel]="email()"
                    (ngModelChange)="setEmail($event)"
                    name="email"
                    class="w-full px-5 py-3 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-gray-900"
                    [disabled]="isSubmitting() || submissionStatus() === 'success' || submissionStatus() === 'loading'"
                  />
                  <button 
                    type="submit" 
                    [disabled]="isSubmitting() || submissionStatus() === 'success' || submissionStatus() === 'loading'"
                    class="w-full px-5 py-3 bg-red-600 text-white text-lg font-semibold rounded-lg shadow-md hover:bg-red-700 transition duration-300 disabled:opacity-50"
                  >
                    @if (submissionStatus() === 'loading') {
                      Processing...
                    } @else if (submissionStatus() === 'success') {
                      Success! Check Email
                    } @else {
                      Access Catalog & Pricing Now
                    }
                  </button>
                </form>
                @if (submissionStatus() === 'success') {
                  <p class="mt-4 text-md font-semibold text-green-600">
                    You're in! Check your email for the catalog link and pricing sheet.
                  </p>
                }
                @if (submissionStatus() === 'error') {
                  <p class="mt-4 text-md font-semibold text-red-600">
                    Submission failed. Please try again or contact procurement. (Are the Klaviyo IDs set?)
                  </p>
                }
                <p class="mt-4 text-sm text-gray-500">
                  Your data is safe. We only send relevant safety compliance and pricing updates.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        <!-- 4. Contact Section -->
        <section id="contact" class="py-20 bg-white">
          <div class="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
            <h2 class="text-4xl font-bold text-center text-gray-900 mb-4">Get In Touch for Bulk Orders</h2>
            <p class="text-xl text-center text-gray-500 mb-12">
              For customized quotes, large-volume procurement, or technical safety questions, reach out directly.
            </p>
            
            <div class="bg-gray-50 p-8 rounded-xl shadow-lg">
              <div class="space-y-4 text-lg">
                <p class="flex items-center space-x-3 text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-red-600 w-6 h-6"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="m22 6-10 7L2 6"/></svg>
                  <span>info@melotwo.com</span>
                </p>
                <p class="flex items-center space-x-3 text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-red-600 w-6 h-6"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6.86-6.86 19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 3.08 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  <span>+27 67 946 1487 (SA Procurement)</span>
                </p>
                <p class="flex items-center space-x-3 text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="text-red-600 w-6 h-6"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span>Johannesburg, South Africa</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <!-- Footer -->
      <footer class="bg-gray-800 text-white py-8">
        <div class="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p class="text-sm">
            &copy; {{ currentYear() }} Melotwo Safety Solutions. All rights reserved. | Strategic Partner of Mine Africa Safety Solutions.
          </p>
        </div>
      </footer>

      <!-- --- FLOATING CHAT BUTTON --- -->
      <button
        (click)="openChat()"
        aria-label="Open AI Chatbot"
        class="fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300
                    bg-red-600 hover:bg-red-700 text-white transform hover:scale-105 active:scale-95
                    flex items-center justify-center space-x-2 w-16 h-16 sm:w-20 sm:h-20"
      >
        <!-- Chat Bubble Icon (Inline SVG) -->
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" class="lucide lucide-message-square">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
      <!-- ---------------------------------- -->
    </div>
  `,
  // Required to use directives like ngModel
  imports: [], 
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  // --- Signals for State Management ---
  activeSection = signal('home');
  email = signal('');
  isSubmitting = signal(false);
  submissionStatus = signal<'idle' | 'loading' | 'success' | 'error'>('idle');
  currentYear = computed(() => new Date().getFullYear());

  // --- Constants ---
  KLAVYO_LIST_ID = 'YOUR_KLAVIVO_LIST_ID'; 
  KLAVYO_ACCOUNT_ID = 'KLAVIVO_ACCOUNT_ID'; 

  // Mock data for services (now using simple strings for Angular's innerHTML)
  services = signal([
    { title: 'SABS/ISO Certified Gear', description: 'Access quality personal protective equipment (PPE) that meets stringent South African and international standards, ensuring legal compliance and maximum worker safety.', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>` },
    { title: 'Tailored Bulk Procurement', description: 'Streamlined purchasing process for high-volume orders. We handle logistics, quality checks, and delivery, reducing procurement time and cost.', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.72a2 2 0 0 0 2-1.58L23 6H6"/></svg>` },
    { title: 'Consultative Safety Audits', description: 'Expert advice to identify gaps in your current safety protocols and equipment usage, ensuring proactive risk mitigation specific to African mining environments.', icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 10a4 4 0 0 0-3.23 1.5c-1-.36-1.93-.82-2.77-1.5-1.57-1.33-2.61-3.2-2.3-4.59a4 4 0 0 0-4-4"/><path d="M12 2v20"/><path d="M16.5 10a4 4 0 0 1 3.23 1.5c1-.36 1.93-.82 2.77-1.5 1.57-1.33 2.61-3.2 2.3-4.59a4 4 0 0 1-4-4"/></svg>` },
  ]);

  // --- Methods ---
  
  // Setter for the email signal, necessary for two-way binding with input
  setEmail(value: string) {
    this.email.set(value);
  }

  // Smooth scroll and update active link state
  scrollToSection(sectionId: string) {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      this.activeSection.set(sectionId);
    }
  }

  // Function to open the AI chat window (placeholder)
  openChat() {
    const url = 'ai_chatbot_app.html';
    const name = 'MelotwoAIChatbot';
    const specs = 'width=400,height=600,resizable=yes,scrollbars=yes,status=yes';
    window.open(url, name, specs);
  }

  // Klaviyo form submission with exponential backoff
  async handleKlaviyoSubmit(e: Event) {
    e.preventDefault();
    
    if (!this.email() || this.isSubmitting()) return;
    
    if (this.KLAVYO_LIST_ID === 'YOUR_KLAVIVO_LIST_ID' || this.KLAVYO_ACCOUNT_ID === 'KLAVIVO_ACCOUNT_ID') {
         console.error('ERROR: Klaviyo IDs are not set. Cannot submit form.');
         this.submissionStatus.set('error');
         setTimeout(() => this.submissionStatus.set('idle'), 5000);
         return;
    }

    this.isSubmitting.set(true);
    this.submissionStatus.set('loading');

    const klaviyoEndpoint = `https://a.klaviyo.com/api/v1/list/${this.KLAVYO_LIST_ID}/subscribe`;
    
    const data = {
        a: this.KLAVYO_ACCOUNT_ID, 
        email: this.email(),
        $fields: ['$source'],
        $source: 'Melotwo Website B2B Catalog CTA',
    };

    const queryString = new URLSearchParams(data as unknown as Record<string, string>).toString();
    
    const maxRetries = 3;
    let currentRetry = 0;
    
    // Exponential backoff retry loop
    while (currentRetry < maxRetries) {
        const delay = Math.pow(2, currentRetry) * 1000; 
        
        if (currentRetry > 0) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }

        try {
            const response = await fetch(`${klaviyoEndpoint}?${queryString}`, {
                method: 'GET', 
                headers: { 'Content-Type': 'application/json' },
            });

            if (response.ok) {
                this.submissionStatus.set('success');
                this.email.set('');
                break; // Success
            } else {
                currentRetry++;
                if (currentRetry >= maxRetries) {
                     this.submissionStatus.set('error');
                }
            }
        } catch (error) {
            currentRetry++;
            if (currentRetry >= maxRetries) {
                this.submissionStatus.set('error');
            }
        }
    }
    
    this.isSubmitting.set(false);
    setTimeout(() => this.submissionStatus.set('idle'), 5000);
  }
}
