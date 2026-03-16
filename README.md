# AraRM Frontend Client

React frontend for the AraRM Restaurant Management System.

## Features

- Modern React 19 application
- Responsive design with Tailwind CSS
- Multi-language support (Arabic RTL / English LTR)
- Role-based UI rendering
- Real-time QR code display and scanning
- PDF export functionality
- Protected routes with authentication
- Dynamic form rendering

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file (optional, defaults to localhost):

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Start Development Server

```bash
npm start
```

Application will run on `http://localhost:3000`

### 4. Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` directory.

## Available Scripts

- `npm start` - Start development server
- `npm run build` - Create production build
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App (one-way operation)

## Project Structure

```
client/
├── public/
│   ├── index.html
│   └── ...
├── src/
│   ├── components/
│   │   ├── Common/         # Reusable components
│   │   │   ├── Button.js
│   │   │   ├── Card.js
│   │   │   ├── Input.js
│   │   │   ├── Select.js
│   │   │   ├── Modal.js
│   │   │   └── Loading.js
│   │   ├── Layout/         # Layout components
│   │   │   ├── Layout.js
│   │   │   └── Navbar.js
│   │   └── ProtectedRoute.js
│   ├── context/
│   │   └── AuthContext.js  # Authentication context
│   ├── i18n/
│   │   ├── config.js       # i18n configuration
│   │   └── locales/
│   │       ├── en.json     # English translations
│   │       └── ar.json     # Arabic translations
│   ├── pages/
│   │   ├── Login.js
│   │   ├── Dashboard.js
│   │   ├── Attendance/
│   │   │   └── AttendancePage.js
│   │   ├── Forms/
│   │   │   └── FormsList.js
│   │   └── Leaves/
│   │       ├── LeavesList.js
│   │       └── NewLeave.js
│   ├── utils/
│   │   └── api.js          # Axios configuration
│   ├── App.js              # Main app component
│   ├── index.js            # Entry point
│   └── index.css           # Global styles
├── .env.example
├── .gitignore
├── package.json
├── postcss.config.js
├── tailwind.config.js
└── README.md
```

## Styling

The application uses Tailwind CSS for styling with a custom configuration:

- Primary color: `#d4b900` (AraRM brand color)
- Responsive breakpoints: sm, md, lg, xl
- RTL support for Arabic language

### Customizing Colors

Edit `tailwind.config.js`:

```javascript
colors: {
  primary: {
    DEFAULT: '#d4b900',
    light: '#e84e53',
    dark: '#b51c20',
  },
}
```

## Multi-Language Support

The application supports English and Arabic with automatic RTL/LTR switching:

### Adding New Translations

1. Add translation keys to `src/i18n/locales/en.json` and `ar.json`
2. Use in components:

```javascript
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t("myKey")}</h1>;
}
```

### Adding a New Language

1. Create a new locale file: `src/i18n/locales/fr.json`
2. Import and add to `src/i18n/config.js`:

```javascript
import translationFR from "./locales/fr.json";

const resources = {
  en: { translation: translationEN },
  ar: { translation: translationAR },
  fr: { translation: translationFR },
};
```

## Authentication

The app uses JWT-based authentication with automatic token refresh:

- Access tokens stored in localStorage
- Refresh tokens for seamless re-authentication
- Protected routes require authentication
- Role-based route access control

### Using Auth Context

```javascript
import { useAuth } from "./context/AuthContext";

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();

  // user object contains: id, name, email, role, department, etc.
}
```

## API Integration

API calls are made through the configured Axios instance:

```javascript
import api from "./utils/api";

// GET request
const response = await api.get("/endpoint");

// POST request
const response = await api.post("/endpoint", data);

// Automatic token refresh on 401 errors
// Automatic authorization header injection
```

## Component Guidelines

### Button Component

```javascript
<Button
  onClick={handleClick}
  variant="primary" // primary, secondary, danger, success, outline
  disabled={loading}
  fullWidth={true}
>
  Click Me
</Button>
```

### Input Component

```javascript
<Input
  label="Email"
  type="email"
  name="email"
  value={value}
  onChange={handleChange}
  required={true}
  error={errorMessage}
/>
```

### Card Component

```javascript
<Card title="My Card">
  <p>Content goes here</p>
</Card>
```

## Responsive Design

The application is fully responsive with mobile-first approach:

- Mobile: Single column layout, hamburger menu
- Tablet: Two column layout, responsive tables
- Desktop: Full layout with sidebar navigation

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Optimization

- Code splitting with React.lazy (can be implemented)
- Image optimization
- Memoization with React.memo (where appropriate)
- Efficient re-renders with proper dependency arrays

## Deployment

### Netlify

1. Build the project: `npm run build`
2. Deploy the `build/` directory
3. Set environment variable: `REACT_APP_API_URL`
4. Configure redirects for SPA routing

### Vercel

1. Connect your repository
2. Set build command: `npm run build`
3. Set output directory: `build`
4. Add environment variables

### Manual Deployment

1. Build: `npm run build`
2. Serve the `build/` directory with any static file server
3. Ensure all routes redirect to `index.html` for SPA routing

## Troubleshooting

### Cannot connect to backend

- Check `REACT_APP_API_URL` in .env
- Ensure backend server is running
- Check CORS settings on backend

### Login not working

- Clear localStorage and cookies
- Check network tab for API errors
- Verify credentials

### RTL issues with Arabic

- Clear browser cache
- Check `document.documentElement.dir` is set correctly
- Verify Tailwind RTL classes

## Best Practices

- Keep components small and focused
- Use custom hooks for shared logic
- Implement error boundaries
- Add loading states
- Handle errors gracefully
- Use TypeScript for better type safety (optional migration)

## Contributing

1. Follow the existing code style
2. Write meaningful commit messages
3. Test thoroughly before submitting
4. Update documentation for new features

## License

ISC
