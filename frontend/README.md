# Digital Persona Platform - Frontend

A modern React frontend for the Digital Persona Platform, providing a complete user interface for managing AI personas, conversations, and file uploads.

## Features

- 🔐 **Authentication**: Login and registration with JWT tokens
- 👥 **Persona Management**: Create, edit, and manage AI personas with different personality types
- 💬 **Real-time Chat**: Interactive conversations with AI personas powered by OpenAI
- 📁 **File Upload**: Drag-and-drop file upload with progress tracking
- 📊 **Dashboard**: Overview of personas, conversations, and usage statistics
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- 🔄 **Real-time Updates**: Live updates for messages and file uploads

## Tech Stack

- **React 18** with TypeScript
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Axios** for API communication
- **React Dropzone** for file uploads
- **React Hot Toast** for notifications
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Backend server running on `http://localhost:8000`

### Installation

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
```

## Project Structure

```
src/
├── components/          # React components
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard layout components
│   ├── personas/       # Persona management components
│   ├── chat/           # Chat interface components
│   ├── upload/         # File upload components
│   ├── stats/          # Statistics components
│   └── settings/       # Settings components
├── contexts/           # React contexts (Auth, etc.)
├── services/           # API service layer
├── types/              # TypeScript type definitions
├── App.tsx             # Main app component
└── index.tsx           # App entry point
```

## API Integration

The frontend connects to the FastAPI backend with the following endpoints:

- **Authentication**: `/auth/login`, `/auth/register`, `/auth/me`
- **Personas**: `/personas` (CRUD operations)
- **Conversations**: `/chat/conversations` (CRUD operations)
- **Messages**: `/chat/conversations/{id}/send`, `/chat/conversations/{id}/messages`
- **File Upload**: `/upload/file`, `/upload/files`
- **Statistics**: `/chat/stats`

## Key Components

### Authentication

- `LoginForm`: User login with email/password
- `RegisterForm`: User registration with validation
- `AuthContext`: Global authentication state management

### Dashboard

- `Dashboard`: Main layout with sidebar navigation
- `HomePage`: Overview with stats and quick actions
- `Header`: Top navigation with user menu
- `Sidebar`: Navigation menu with icons

### Personas

- `PersonasPage`: Grid view of all personas
- `CreatePersonaModal`: Modal for creating/editing personas
- Color-coded relation types (parent, spouse, friend, etc.)

### Chat

- `ChatPage`: Real-time chat interface
- Message history with timestamps and token usage
- Auto-scroll to latest messages
- Loading states and error handling

### File Upload

- `UploadPage`: Drag-and-drop file upload
- Progress tracking for multiple files
- File type validation and preview
- Support for images, videos, audio, and documents

## Styling

The app uses Tailwind CSS with custom components:

- `.btn-primary`: Primary action buttons
- `.btn-secondary`: Secondary action buttons
- `.btn-danger`: Destructive action buttons
- `.input-field`: Form input styling
- `.card`: Card container styling
- `.chat-message`: Chat message styling

## Environment Variables

Create a `.env` file in the frontend directory:

```env
REACT_APP_API_URL=http://localhost:8000
```

## Development

### Available Scripts

- `npm start`: Start development server
- `npm build`: Build for production
- `npm test`: Run tests
- `npm eject`: Eject from Create React App

### Code Style

- TypeScript for type safety
- Functional components with hooks
- Consistent naming conventions
- Error boundaries and loading states
- Responsive design principles

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Include error handling and loading states
4. Test on different screen sizes
5. Update documentation as needed

## License

This project is part of the Digital Persona Platform.
