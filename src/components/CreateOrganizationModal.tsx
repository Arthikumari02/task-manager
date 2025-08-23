import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useOrganizations } from '../contexts';

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateOrganizationModal: React.FC<CreateOrganizationModalProps> = observer(({ isOpen, onClose }) => {
  const [orgName, setOrgName] = useState('');
  const { createOrganization, isCreating } = useOrganizations();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    const newOrg = await createOrganization(orgName.trim());
    if (newOrg) {
      setOrgName('');
      onClose();
    }
  };

  const handleClose = () => {
    setOrgName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
      {/* Desktop: Center modal */}
      <div className="sm:hidden md:flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-sm shadow-xl max-w-sm w-full mx-4 animate-in fade-in zoom-in duration-200">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4">
            <div></div>
            <button
              onClick={handleClose}
              className="text-black hover:text-gray-200 transition-colors duration-200"
            >
              Create New Organization
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="p-4">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Let's build an Organization</h2>
              <p className="text-sm text-gray-600 mb-4">
                Boost your productivity by making it easier for everyone to access boards in one location.
              </p>
              <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
                ORGANIZATION NAME
              </label>
              <input
                type="text"
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Enter organization name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                autoFocus
              />
            </div>

            {/* Modal Footer */}
            <div className="flex justify-start">
              <button
                type="submit"
                disabled={!orgName.trim() || isCreating}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isCreating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
              >
                {isCreating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Organization</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Mobile: Bottom sheet */}
      <div className="md:hidden flex items-end min-h-screen">
        <div className="flex flex-col bg-white w-full shadow-xl animate-in slide-in-from-bottom duration-300">
          <button
            onClick={handleClose}
            className="text-gray-500 self-end p-2 hover:text-gray-700 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {/* Mobile Body */}
          <form onSubmit={handleSubmit} className="p-6 pb-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Let's build an Organization</h2>
              <p className="text-sm text-gray-600 mb-4">
                Boost your productivity by making it easier for everyone to access boards in one location.
              </p>
              <label htmlFor="mobileOrgName" className="block text-sm font-medium text-gray-700 mb-2">
                ORGANIZATION NAME
              </label>
              <input
                type="text"
                id="mobileOrgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Enter organization name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                autoFocus
              />
            </div>

            {/* Mobile Footer */}
            <div className="space-y-3 flex justify-start">
              <button
                type="submit"
                disabled={!orgName.trim() || isCreating}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${isCreating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  }`}
              >
                {isCreating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Organization</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

export default CreateOrganizationModal;
