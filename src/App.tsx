import React from 'react';
import { observer } from 'mobx-react-lite';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { authStore } from './stores/AuthStore';
import Login from './components/auth/Login';
import Dashboard from './components/Dashboard';
import BoardView from './components/BoardView';
import PageNotFound from './components/PageNotFound';
import './index.css';

const App: React.FC = observer(() => {
  if (!authStore.isAuthenticated) {
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

export default App;
