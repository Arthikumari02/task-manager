import React from 'react';
import { observer } from 'mobx-react-lite';
import { useAuthStore, useOrganizationsStore } from '../../contexts';
import { buildTrelloAuthURL, extractTokenFromFragment, cleanupOAuthURL } from '../../utils/trelloAuth';

const Login: React.FC = observer(() => {
  const { login, clientId, fetchUserInfo } = useAuthStore();

  const handleTrelloLogin = () => {

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
      login(token);
      fetchUserInfo();
      cleanupOAuthURL();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0079BF] flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="flex items-center justify-center mb-6 sm:mb-8">
        <img src="/Icon.png" alt="Task Manager Icon" className="w-8 h-8 sm:w-10 sm:h-10" />
        <h1 className="text-2xl sm:text-3xl md:text-[48px] font-pacifico text-white ml-2">Task Manager</h1>
      </div>

      <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 max-w-sm sm:max-w-md w-full mx-4">
        <div className="text-center mb-6 sm:mb-8">
          <div className="mb-4 sm:mb-6">
            <div className="flex justify-center mb-4">
              <img src="/taskManager.png" alt="Task Manager Illustration" className="w-48 h-36 sm:w-64 sm:h-48 object-contain" />
            </div>
            <p className="text-gray-600 text-base sm:text-lg">Task tracking for your everyday needs</p>
          </div>
        </div>

        <button
          onClick={handleTrelloLogin}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 sm:px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
        >LOG IN WITH TRELLO</button>
      </div>
    </div>
  );
});

export default Login;
