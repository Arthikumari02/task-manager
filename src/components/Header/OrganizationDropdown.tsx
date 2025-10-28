import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useOrganizationsStore, useBoardsStore } from '../../contexts';
import Icon from '../../assets/icons';
import { useNavigate } from 'react-router-dom';
import { TrelloOrganization } from '../../types';

interface OrganizationDropdownProps {
  isOpen: boolean;
  onToggle: () => void;
  onCreateOrganization: () => void;
  isMobile?: boolean;
}

const OrganizationDropdown: React.FC<OrganizationDropdownProps> = observer(({
  isOpen,
  onToggle,
  onCreateOrganization,
  isMobile = false
}) => {
  const navigate = useNavigate();
  const organizationStore = useOrganizationsStore();
  const boardsStore = useBoardsStore();
  const { organizations, currentOrganization, isLoading: isLoadingOrgs } = organizationStore;

  // Handle organization change directly in the component
  const handleOrganizationChange = (organization: TrelloOrganization) => {
    // Clear boards before switching organization
    boardsStore.resetState();
    organizationStore.setCurrentOrganization(organization);
    navigate('/');
    onToggle(); // Close dropdown after selection
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.organization-dropdown')) {
        onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);

  if (isMobile) {
    return (
      <>
        {/* Mobile trigger button */}
        <button
          onClick={onToggle}
          className="bg-[#4E97C2] hover:bg-[#4E97C2] p-2 rounded-sm flex items-center justify-center w-7 h-7 transition duration-200 text-white"
          title="Organization"
        >
          <Icon type="user" className="w-4 h-4" />
        </button>

        {/* Mobile dropdown (bottom sheet) */}
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40 md:hidden bg-black bg-opacity-50" onClick={onToggle} />
            <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white shadow-2xl max-h-[80vh] overflow-hidden">
              {/* Handle bar */}
              <div className="flex justify-center py-3">
                <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
              </div>

              {/* Close button */}
              <div className="absolute top-3 right-4">
                <button
                  onClick={onToggle}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Icon type="close" className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-4 pb-6">
                <div className="px-2 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  WORKSPACE
                </div>
                <div className="py-2 max-h-64 overflow-y-auto">
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleOrganizationChange(org)}
                      onTouchStart={() => handleOrganizationChange(org)}
                      className={`w-full text-left px-4 py-3 text-base hover:bg-gray-50 flex items-center space-x-3 rounded-lg ${currentOrganization?.id === org.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                    >
                      <div className={`w-6 h-6 rounded ${currentOrganization?.id === org.id ? 'bg-blue-500' : 'bg-blue-500'}`}></div>
                      <span className="font-medium">{org.displayName}</span>
                      {currentOrganization?.id === org.id && (
                        <Icon type="check" className="w-5 h-5 text-blue-600 ml-auto" />
                      )}
                    </button>
                  ))}

                  {/* Create New Organization Option */}
                  <button
                    onClick={onCreateOrganization}
                    className="w-full text-left px-4 py-3 text-base hover:bg-gray-50 flex items-center space-x-3 text-blue-600 border-t border-gray-100 mt-2 pt-4 rounded-lg"
                  >
                    <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                      <Icon type="plus" className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="font-medium">Create new organization</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <div className="relative organization-dropdown">
      {/* Desktop trigger button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="flex items-center space-x-1 bg-[#4E97C2] hover:bg-[#4E97C2] px-3 py-2 rounded transition duration-200 text-white font-medium"
      >
        <span>{currentOrganization?.displayName || 'Organization'}</span>
        <Icon type="chevronDown" className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Desktop dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50" onClick={e => e.stopPropagation()}>
          <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
            WORKSPACE
          </div>
          <div className="py-1">
            {isLoadingOrgs ? (
              <div className="px-4 py-2 text-sm text-gray-500">Loading organizations...</div>
            ) : organizations.length === 0 ? (
              <div className="px-4 py-2 text-sm text-gray-500">No organizations found</div>
            ) : (
              organizations.map((org) => {
                return (
                  <button
                    key={org.id}
                    onClick={() => handleOrganizationChange(org)}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 ${currentOrganization?.id === org.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                  >
                    <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                    <span>{org.displayName || org.name || 'Unnamed Workspace'}</span>
                  </button>
                );
              })
            )}

            {/* Create New Organization Option */}
            <button
              onClick={onCreateOrganization}
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center space-x-3 text-blue-600 border-t border-gray-100"
            >
              <div className="w-4 h-4 bg-blue-100 rounded flex items-center justify-center">
                <Icon type="plus" className="w-2 h-2 text-blue-600" />
              </div>
              <span>Create new organization</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default OrganizationDropdown;
