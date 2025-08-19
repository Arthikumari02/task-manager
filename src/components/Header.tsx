import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { authStore } from '../stores/AuthStore';
import CreateBoardModal from './CreateBoardModal';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  showNavigation?: boolean;
  currentPage?: 'dashboard' | 'boards' | 'tasks' | 'profile';
}

const Header: React.FC<HeaderProps> = observer(({
  title = 'Task Manager',
  showSearch = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isCreateBoardModalOpen, setIsCreateBoardModalOpen] = useState(false);

  const handleLogout = () => {
    authStore.logout();
  };

  const handleOrganizationChange = (organization: any) => {
    authStore.setCurrentOrganization(organization);
    setIsOrgDropdownOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log('Searching for:', searchQuery);
  };

  return (
    <header className="bg-[#0067A3] shadow-sm sticky top-0 z-50">
      <div className="px-4">
        <div className="flex items-center justify-between h-12">
          {/* Left Section - Home Icon and Organization Dropdown */}
          <div className="flex items-center space-x-2">
            <button className="bg-transparent p-2">
              <img src="/Home.png" alt="Home" className="w-6 h-6" />
            </button>
            
            {/* Organization Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-white bg-[#4E97C2] hover:bg-[#4E97C2] rounded transition-colors duration-200"
              >
                <span>{authStore.currentOrganization?.displayName || 'Organization'}</span>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Organization Dropdown Menu */}
              {isOrgDropdownOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Organizations</p>
                  </div>
                  {authStore.organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleOrganizationChange(org)}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 ${
                        authStore.currentOrganization?.id === org.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <div className={`w-3 h-3 rounded-full ${
                        authStore.currentOrganization?.id === org.id ? 'bg-blue-500' : 'bg-gray-300'
                      }`}></div>
                      <span>{org.displayName}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          
          {/* Center Section - Boards Tab */}
          <div className="flex items-center">
            <button 
              onClick={() => setIsCreateBoardModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-1 text-white bg-[#4E97C2] hover:bg-[#4E97C2] rounded transition-colors duration-200"
            >
              <img src="/boardlogo.png" alt="Boards" className="w-6 h-6" />
              <span className="text-sm font-medium">Boards</span>
            </button>
          </div>
          </div>

          <h1 className="text-lg font-bold text-white hidden sm:block">{title}</h1>

          {/* Right Section - Title, Search, User, Logout */}
          <div className="flex items-center space-x-3">
            {/* Search Bar */}
            {showSearch && (
              <form onSubmit={handleSearch} className="hidden md:block">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search"
                    className="block w-48 pl-10 pr-3 py-1.5 border-0 rounded text-sm bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </form>
            )}

             {/* Logout Button */}
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="text-white hover:bg-blue-700 px-3 py-1.5 rounded text-sm font-medium transition duration-200"
            >
              Log Out
            </button>
            {/* User Avatar (non-clickable) */}
            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-blue-600 text-sm font-medium">
              WD
            </div>
          </div>
        </div>
      </div>

      {/* Create Board Modal */}
      <CreateBoardModal 
        isOpen={isCreateBoardModalOpen}
        onClose={() => setIsCreateBoardModalOpen(false)}
      />
    </header>
  );
});

export default Header;
