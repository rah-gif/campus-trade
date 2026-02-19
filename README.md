# 🎓 CampusTrade

**A Secure, Student-Only Marketplace for LNBTI**

![License](https://img.shields.io/badge/License-MIT-green.svg) ![React](https://img.shields.io/badge/React-18-blue) ![Supabase](https://img.shields.io/badge/Supabase-Backend-green) ![Vercel](https://img.shields.io/badge/Deployed-Vercel-black) ![Tailwind CSS](https://img.shields.io/badge/Styles-Tailwind%20CSS-38B2AC)

## 🚀 Live Application

**[https://campus-trade-jet.vercel.app](https://campus-trade-jet.vercel.app)**

---

## 📖 Introduction

**CampusTrade** is a centralized platform designed to replace chaotic WhatsApp groups and physical notice boards for student trading. It provides a secure, verified environment where students can buy and sell textbooks, electronics, and dorm essentials.

**Why CampusTrade?**

- **Trust**: Authentication is restricted to **@student.lnbti.lk** emails only.
- **Convenience**: Searchable database instead of scrolling through chat history.
- **Speed**: Real-time messaging to negotiate deals instantly.

---

## ✨ Key Features

### 🔒 Secure Authentication

- **Domain-Locked Sign Up**: Only students with valid university emails can register.
- **OTP Verification**: Passwordless, secure login via Email Magic Links/OTP.

### 🛒 Marketplace

- **Dynamic Feed**: Browse items with infinite scroll.
- **Advanced Filtering**: Filter by Category (Textbooks, Electronics, etc.), Price, or Recency.
- **Search**: Instant search for specific items.

### 💬 Real-Time Communication

- **Instant Chat**: Integrated messaging system powered by WebSockets.
- **Unread Indicators**: Real-time badges for new messages.
- **Safety Prompts**: "Etiquette reminders" before starting new chats to ensure respectful communication.

### 👤 User Dashboard

- **Manage Listings**: Create, Edit, Delete, or Mark items as "Sold".
- **Profile Customization**: Update avatars and personal details.
- **Dark Mode**: Fully responsive UI with toggleable Dark/Light themes.

---

## 🛠️ Technology Stack

| Component    | Technology        | Description                                                     |
| :----------- | :---------------- | :-------------------------------------------------------------- |
| **Frontend** | React.js (Vite)   | Fast, component-based UI library.                               |
| **Styling**  | Tailwind CSS      | Utility-first CSS framework for responsive design.              |
| **Backend**  | Supabase          | Open Source Firebase alternative (PostgreSQL + Auth + Storage). |
| **Database** | PostgreSQL        | Relational database for structured data (Items, Users, Chats).  |
| **Realtime** | Supabase Realtime | WebSocket subscriptions for chat and notifications.             |
| **Hosting**  | Vercel            | Global CDN for fast frontend delivery.                          |

---

## 📂 Project Structure

A high-level overview of the application's file structure:

```
campus-trade/
├── public/              # Static assets (Favicons, Robots.txt)
├── src/
│   ├── components/      # Reusable UI components (Navbar, ItemCard, Modals)
│   ├── hooks/           # Custom React hooks (useAuth, useItems)
│   ├── pages/           # Main application routes (Marketplace, Login, Profile)
│   ├── services/        # API configuration (Supabase client)
│   ├── App.jsx          # Main application entry point with routing
│   └── main.jsx         # React DOM rendering
├── .env                 # Environment variables (Supabase keys)
├── index.html           # HTML entry point
├── tailwind.config.js   # Tailwind CSS configuration
└── vite.config.js       # Vite build configuration
```

---

## 🏗️ System Architecture

CampusTrade is a **Single Page Application (SPA)** that interacts directly with cloud services, eliminating the need for a traditional middle-tier server.

<img width="3460" height="2463" alt="Student Authentication Flow-2026-02-18-071357" src="https://github.com/user-attachments/assets/99f65499-bbb2-4c3f-ae9a-50386e279f5f" />

---

## 🔒 Security Measures

Security is a core priority of this architecture:

1.  **Row Level Security (RLS)**: Database policies enforce data access at the engine level.
    - _Public_: Anyone can view "Available" items.
    - _Private_: Only the item owner can "Delete" or "Update" their item.
    - _Private_: Chat messages are strictly visible only to the Sender and Receiver.
2.  **Input Sanitization**: React automatically creates safe HTML to prevent XSS attacks.
3.  **Strict Content Security Policy (CSP)**: Configured to allow only trusted sources.

---

## 🧠 Design Decisions

- **Why Supabase?**
  Chosen for its built-in Auth and PostgreSQL capabilities, allowing for rapid development without the overhead of managing a separate backend server. The RLS policies provide enterprise-grade security out of the box.

- **Why Tailwind CSS?**
  Utility-first CSS ensures a consistent design system, dark mode support, and significantly reduces the final CSS bundle size compared to traditional stylesheets.

- **SPA Architecture**
  Built as a Single Page Application to provide a seamless, app-like user experience with instant page transitions and state persistence.

---

## 🗺️ Roadmap & Future Enhancements

- [ ] **Reputation System**: Allow buyers to rate sellers after a transaction.
- [ ] **Payment Gateway**: Integrate Stripe for secure in-app payments.
- [ ] **Push Notifications**: Mobile alerts for new messages even when the app is closed.
- [ ] **Admin Dashboard**: Moderation tools for reporting inappropriate listings.

---

## 💻 Installation & Setup

To run this project locally:

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Supabase Project (Free Tier)

### Steps

1.  **Clone the repository**

    ```bash
    git clone https://github.com/rah-gif/campus-trade.git
    cd campus-trade
    ```

2.  **Install Dependencies**

    ```bash
    npm install
    ```

3.  **Environment Variables**
    Create a `.env` file in the root directory and add your Supabase credentials:

    ```env
    VITE_SUPABASE_URL=your_supabase_url
    VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
    ```

4.  **Database Setup**
    This project uses Supabase as the backend/database.
    - Go to your Supabase Dashboard -> **SQL Editor**.
    - Copy the contents of `schema.sql` from this repository.
    - Run the script to generate all Tables, RLS Policies, and Triggers.

5.  **Run Development Server**

    ```bash
    npm run dev
    ```

6.  **Build for Production**
    ```bash
    npm run build
    ```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

Developed by **Chethana Rahul** for the Student Community.
