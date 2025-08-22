import React from 'react';
import { observer } from 'mobx-react-lite';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider, useAuth } from './contexts';
import { Login } from './features/auth';
import Dashboard from './components/Dashboard';
import { BoardView } from './features/board';
import PageNotFound from './components/PageNotFound';
import './index.css';

const AppContent: React.FC = observer(() => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/board/:boardId" element={<BoardView />} />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </Router>
  );
});

const App: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default App;
