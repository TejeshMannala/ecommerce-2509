# Fresh Market E-commerce Frontend

A modern, responsive e-commerce frontend built with React, Redux, and Tailwind CSS for a fresh produce and grocery store.

## Features

- **Modern UI**: Built with React and Tailwind CSS
- **Responsive Design**: Mobile-first approach with responsive layouts
- **State Management**: Redux Toolkit with RTK Query for data fetching
- **Authentication**: JWT-based authentication system
- **Shopping Cart**: Full-featured shopping cart with persistence
- **Product Catalog**: Browse, search, and filter products
- **Order Management**: Track and manage orders
- **User Profile**: Complete user profile management

## Tech Stack

- **Frontend**: React 18, Vite
- **Styling**: Tailwind CSS
- **State Management**: Redux Toolkit, Redux Persist
- **Routing**: React Router DOM
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common components (Button, Input, etc.)
│   ├── layout/         # Layout components (Navbar, Footer)
│   ├── product/        # Product-related components
│   ├── cart/          # Cart components
│   └── order/         # Order components
├── pages/             # Page components
├── routes/            # Route definitions
├── redux/             # Redux store and slices
│   ├── slices/        # Redux slices
│   └── asyncThunks/   # Async thunks
├── api/               # API endpoints and axios instance
├── hooks/             # Custom React hooks
├── utils/             # Utility functions and constants
├── assets/            # Images, icons, styles
└── App.jsx           # Main application component
```

## Installation

1. Clone the repository
2. Navigate to the frontend directory
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the frontend root directory:

```env
VITE_API_URL=http://localhost:5000/api
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## API Integration

The frontend is designed to work with a backend API. The API endpoints are defined in `src/api/` and include:

- Authentication endpoints
- Product catalog
- Shopping cart
- Order management
- User profile management

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License