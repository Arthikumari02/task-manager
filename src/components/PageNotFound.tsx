import React from 'react';
import Header from './Header/Header';

const PageNotFound: React.FC = () => {

  return (
    <div className="min-h-screen bg-[#0079BF]">
      <Header
        title="Task Manager"
        showSearch={false}
        showNavigation={true}
      />

      <main className="px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          {/* Error Message */}
          <h1 className="text-6xl font-bold text-white mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-white mb-4">Page Not Found</h2>
          <p className="text-white text-opacity-80 mb-8">
            This page may be private. If someone gave you this link, they may need to invite you to one of their boards or teams.
          </p>

        </div>
      </main>
    </div>
  );
};

export default PageNotFound;
