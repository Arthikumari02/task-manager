# Task Manager - Trello Integration

A modern task management application built with React and TypeScript that integrates with Trello for seamless task tracking.

## Features

- **Trello OAuth Integration**: Secure authentication with Trello
- **Modern UI**: Clean, responsive design with Tailwind CSS
- **Task Management**: Full integration with Trello boards and cards
- **Real-time Sync**: Stay synchronized with your Trello data
- **List Management**: Create, rename, and close lists
- **Board Management**: Edit board names inline
- **Drag & Drop**: Reorder lists and cards with smooth animations
- **Task Modal**: Detailed task view with description editing and comments
- **Search Functionality**: Search tasks across all boards
- **Task Operations**: Delete tasks, update descriptions, add comments

## New Features

### Task Modal Functionality
- **Click any task** to open a detailed modal view
- **Edit task descriptions** inline with save/cancel options
- **Add comments** to tasks with real-time updates
- **Delete tasks** with confirmation via trash icon
- **View task details** including list name and full description

### Search Functionality
- **Real-time search** with debounced input (300ms delay)
- **Search across all boards** using Trello's search API
- **No results view** with helpful messaging when no tasks found
- **Search results dropdown** with task previews
- **Click to navigate** to the board containing the task

### Close List Functionality
- Click the ellipsis (⋮) button on any list header
- Select "Close List" from the context menu
- Lists are permanently closed via Trello API
- UI updates immediately to reflect changes

### Edit Board Name
- Click on the board name in the header to edit inline
- Press Enter to save or Escape to cancel
- Changes are synced with Trello API in real-time

## API Endpoints Used

### Task Management
- `PUT https://api.trello.com/1/cards/{CARD_ID}?key={API_KEY}&token={TOKEN}` - Update card details
- `POST https://api.trello.com/1/cards/{CARD_ID}/actions/comments?key={API_KEY}&token={TOKEN}` - Add comments

### Search
- `GET https://api.trello.com/1/search?key={API_KEY}&token={TOKEN}&query={QUERY}` - Search tasks

### Organization Management
- `GET https://api.trello.com/1/organizations?key={API_KEY}&token={TOKEN}&displayName={NAME}` - Get organizations

## Setup Instructions

### 1. Create Your Trello Application

1. Visit [https://trello.com/app-key](https://trello.com/app-key)
2. Create a new application to get your Client ID
3. Copy your Client ID (this replaces the old API key approach)

### 2. Configure Allowed Origins

1. In your Trello application settings, add the return URL to **Allowed Origins**:
   ```
   http://localhost:3000/auth/callback
   ```
2. For production, add your production domain's callback URL

### 3. Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your Trello Client ID:
   ```
   REACT_APP_TRELLO_CLIENT_ID=your_trello_client_id_here
   ```

### 4. Install Dependencies

```bash
npm install
```

### 5. Start the Development Server

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

## How to Use

### Authentication Flow

1. **Click "LOG IN WITH TRELLO"** - This will redirect you to Trello's authorization page
2. **If not logged in to Trello**: You'll be prompted to enter your Trello credentials
3. **If already logged in**: You'll skip directly to the authorization step
4. **Click "Agree"** on the Terms page to grant access
5. **Automatic redirect**: You'll be redirected back to the Task Manager with your access token

### OAuth URL Format

The application uses the following Trello OAuth URL with proper clientId:
```
https://trello.com/1/OAuthAuthorizeToken?expiration=never&name=TaskManager&scope=read,write,account&key={CLIENT_ID}&callback_method=fragment&return_url={RETURN_URL}
```

**Important**: The `return_url` value is automatically generated using the `getReturnURL()` function and must be added to your Trello application's **Allowed Origins**.

## Project Structure

```
src/
├── components/
│   ├── auth/
│   │   └── Login.tsx          # Login component with Trello OAuth
│   └── Dashboard.tsx          # Main dashboard after authentication
├── stores/
│   └── AuthStore.ts           # MobX authentication store
├── utils/
│   └── trelloAuth.ts          # OAuth utility functions (getReturnURL, etc.)
├── App.tsx                    # Main app component with MobX observer
└── index.css                  # Global styles with Tailwind CSS
```

## Available Scripts

- `npm start` - Runs the development server
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## Technologies Used

- **React 19** with TypeScript
- **MobX** for reactive state management
- **Tailwind CSS** for styling
- **Trello API** for task management

## Security Notes

- API keys are stored in environment variables
- Tokens are stored securely in localStorage
- OAuth flow follows Trello's recommended practices

## Troubleshooting

### "Trello API key not found" Error
- Ensure your `.env` file exists and contains `REACT_APP_TRELLO_API_KEY`
- Restart the development server after adding environment variables

### Authentication Issues
- Check that your API key is valid at [https://trello.com/app-key](https://trello.com/app-key)
- Ensure you clicked "Agree" on the Trello authorization page
- Clear browser localStorage and try again if needed
