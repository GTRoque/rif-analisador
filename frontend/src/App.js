import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Upload from './pages/Upload';
import Dashboard from './pages/Dashboard';
import DetalheComunicacao from './pages/DetalheComunicacao';

function PrivateRoute({ children }) {
  const usuario = localStorage.getItem('usuario');
  return usuario ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/upload" element={<PrivateRoute><Upload /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/comunicacao/:id" element={<PrivateRoute><DetalheComunicacao /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App; 