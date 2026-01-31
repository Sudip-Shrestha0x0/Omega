# Omega AI

Omega is a sophisticated unbiased and uncensored AI chat application engineered to demonstrate advanced frontend development capabilities. Built with React 18 and TypeScript, it features a robust multi-provider AI architecture, secure authentication with role-based access control, and a polished, responsive user interface.

[View Live Demo](YOUR_LIVE_SITE_URL_HERE)

## Project Overview

This project was developed to simulate a production-grade SaaS application, focusing on scalability, security, and user experience. It goes beyond basic UI rendering to implement complex features such as multi-provider AI failover strategies, real-time reasoning visualization, and secure session management.

Key architectural highlights include:
*   **Resilient API Integration:** Implemented a failover system that automatically switches between AI providers to ensure service continuity.
*   **Advanced State Management:** Utilized React Query for server state and React Context for global application state, ensuring efficient data synchronization.
*   **Security Best Practices:** Developed a custom authentication flow with SHA-256 hashing, two-factor authentication (2FA), and secure session management.

## Features

### AI & Chat Capabilities
*   **Multi-Model Support:** Seamless integration with xAI (Grok), Groq (Llama 3), HuggingFace, and OpenRouter.
*   **Intelligent Failover:** Automatic provider switching if a service becomes unavailable.
*   **Reasoning Visualization:** Real-time display of the AI's thought process (Chain of Thought).
*   **Multimodal Analysis:** Support for image analysis and file processing (text, code, documents).
*   **Code Intelligence:** Syntax highlighting with language detection.

### Authentication & Security
*   **Secure Identity Management:** Custom implementation of login/signup flows with password hashing.
*   **Two-Factor Authentication:** Support for Email and SMS-based 2FA.
*   **Role-Based Access Control (RBAC):** Distinct permission levels for Administrators and Standard Users.
*   **Session Persistence:** Secure local and session storage strategies with automatic restoration.
*   **Third-Party Login:** Google OAuth 2.0 integration.

### User Management & Dashboard
*   **Admin Interface:** Comprehensive dashboard for managing users, viewing statistics, and handling CRUD operations.
*   **Profile Management:** User settings for avatars, usernames, and subscription tiers (Free, Pro, Unlimited).
*   **GitHub Integration:** Ability to connect and display GitHub profile data.

### UI/UX Engineering
*   **Responsive Design:** Mobile-first layout optimized for all device sizes.
*   **Accessibility:** Built using Radix UI primitives to ensure compliance with accessibility standards.
*   **Animations:** Smooth, non-intrusive interactions using Framer Motion.
*   **Dark Mode:** Native dark theme support.

## Tech Stack

### Core Technologies
*   **Framework:** React 18
*   **Language:** TypeScript
*   **Build Tool:** Vite
*   **Routing:** React Router v7

### State & Data
*   **Server State:** React Query
*   **Local State:** React Hooks & Context API

### Styling & UI
*   **CSS Framework:** Tailwind CSS
*   **Component Primitives:** Radix UI
*   **Animations:** Framer Motion
*   **Icons:** Lucide React

### APIs & Services
*   **AI Providers:** xAI API (Puter.js), Groq API, HuggingFace Inference API, OpenRouter API
*   **Auth:** Google OAuth 2.0
*   **External:** GitHub API

## Screenshots

![Dashboard Preview](LINK_TO_DASHBOARD_SCREENSHOT)
*Admin interface displaying real-time statistics and user management.*

## Running Locally

1.  **Clone the Repository** 
   ```
   git clone https://github.com/Sudip-Shrestha0x0/omega.git
  ```
2.  **Install Dependencies**
   ```bash
   npm install
   ```

3.  **Run Development Server**
   ```bash
   npm run dev
   ```

4.  **Build for Production**
   ```bash
   npm run build
   ```