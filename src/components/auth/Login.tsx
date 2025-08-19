import React from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../../stores/AuthStore';
import { buildTrelloAuthURL, extractTokenFromFragment, cleanupOAuthURL } from '../../utils/trelloAuth';

const Login: React.FC = observer(() => {
  const handleTrelloLogin = () => {
    const clientId = authStore.clientId;
    
    if (!clientId) {
      alert('Trello Client ID not found. Please check your environment configuration.');
      return;
    }

    // Use the proper OAuth URL builder with clientId
    const trelloAuthUrl = buildTrelloAuthURL(clientId);
    
    // Open Trello OAuth in the same window
    window.location.href = trelloAuthUrl;
  };

  // Check for token in URL fragment when component mounts
  React.useEffect(() => {
    const fragment = window.location.hash;
    const token = extractTokenFromFragment(fragment);
    
    if (token) {
      authStore.login(token);
      // Clean up URL to remove sensitive token information
      cleanupOAuthURL();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0079BF] flex flex-col items-center justify-center p-4">
      <div className="flex items-center justify-center mb-6">
        <img src="/Icon.png" alt="Task Manager Icon" className="w-10 h-10" />
        <h1 className="text-[48px] font-pacifico text-white">Task Manager</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          
          <div className="mb-6">
            <div className="flex justify-center mb-4">
              <img src="/taskManager.png" alt="Task Manager Illustration" className="w-64 h-48 object-contain" />
            </div>
            <p className="text-gray-600 text-lg">Task tracking for your everyday needs</p>
          </div>
        </div>

        <button
          onClick={handleTrelloLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 16V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM10.5 18H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5.5v15zM20 17a1 1 0 0 1-1 1h-7.5V3H19a1 1 0 0 1 1 1v13z"/>
          </svg>
          <span>LOG IN WITH TRELLO</span>
        </button>
      </div>
    </div>
  );
});

export default Login;