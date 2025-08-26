import React from 'react';
import { observer } from 'mobx-react-lite';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileProps {
  onLogout: () => void;
}

const UserProfile: React.FC<UserProfileProps> = observer(({ onLogout }) => {
  const { userInfo } = useAuth();

  return (
    <div className="flex items-center space-x-2 sm:space-x-3">
      {/* Desktop: Log Out Button + Avatar */}
      <div className="hidden md:flex items-center space-x-2">
        <button
          onClick={onLogout}
          className="text-white hover:bg-[#4E97C2] px-3 py-1.5 rounded text-sm font-medium transition duration-200"
        >
          Log Out
        </button>

        <div className="w-8 h-8 bg-[#BAE3FF] rounded-full flex items-center justify-center text-[#0967D2] text-sm font-medium">
          {userInfo?.initials || 'WJ'}
        </div>
      </div>

      {/* Mobile: Just Avatar */}
      <div className="md:hidden flex items-center space-x-1">
        <button
          onClick={onLogout}
          className="text-white hover:bg-[#4E97C2] px-2 py-1 rounded text-[12px] font-medium transition duration-200"
        >
          Log Out
        </button>
        <div className="w-10 h-10 bg-[#BAE3FF] rounded-full flex items-center justify-center text-[#0967D2] text-base font-medium">
          {userInfo?.initials || 'WJ'}
        </div>
      </div>
    </div>
  );
});

export default UserProfile;
