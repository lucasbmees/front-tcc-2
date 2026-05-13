import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './Components/Navbar';
import Dashboard from './Pages/Dashboard/Dashboard.jsx';
import Login from './Pages/Login/Login.jsx';
import Cadastro from './Pages/Cadastro/Cadastro.jsx';
import RecupSenha from './Pages/RecupSenha/RecupSenha.jsx';
import IdeiasList from './Pages/IdeiasList/IdeiasList.jsx';
import MinhasIdeias from './Pages/MinhasIdeias/MinhasIdeias.jsx';
import Perfil from './Pages/Perfil/Perfil.jsx';
import Ideia from './Pages/Ideia/Ideia.jsx';
import EditarIdeia from './Pages/EditarIdeia/EditarIdeia.jsx';
import Propostas from './Pages/Propostas/Propostas.jsx';
import CriarIdeia from './Pages/CriarIdeia/CriarIdeia.jsx'; // 👈 importado
import ResponderProposta from './Pages/ResponderProposta/ResponderProposta';
import MinhasPropostas from './Pages/MinhasPropostas/MinhasPropostas';
import './App.css';


function Layout({ children }) {
  const location = useLocation();
  const hideNavbarPaths = ['/login', '/cadastro', '/recup-senha'];
  const shouldHideNavbar = hideNavbarPaths.includes(location.pathname);

  return (
    <>
      {!shouldHideNavbar && <Navbar />}
      <main style={{ minHeight: '80vh', backgroundColor: '#fdfdfd' }}>
        {children}
      </main>
    </>
  );
}


function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Cadastro />} />
          <Route path="/recup-senha" element={<RecupSenha />} />
          <Route path="/ideias" element={<IdeiasList />} />
          <Route path="/minhas-ideias" element={<MinhasIdeias />} />
          <Route path="/perfil" element={<Perfil />} />
          <Route path="/ideia/:id" element={<Ideia />} />
          <Route path="/editar-ideia/:id" element={<EditarIdeia />} />
          <Route path="/propostas/:ideiaId" element={<Propostas />} />
          <Route path="/criar-ideia" element={<CriarIdeia />} /> {/* 👈 adicionado */}
          <Route path="/responder-proposta/:ideiaId" element={<ResponderProposta />} />
          <Route path="/minhas-propostas" element={<MinhasPropostas />} />
        </Routes>
      </Layout>
    </Router>
  );
}


export default App;