import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AuthGate } from './components/AuthGate'
import { FormularioPage } from './pages/FormularioPage'
import { ChamadosPage } from './pages/ChamadosPage'
import { TriagemPage } from './pages/TriagemPage'
import { AdmissoesPage } from './pages/AdmissoesPage'
import { DesligamentosPage } from './pages/DesligamentosPage'

export default function App() {
  return (
    <Routes>
      {/* público — quem abre o chamado */}
      <Route path="/" element={<FormularioPage />} />

      {/* interno — equipe de TI */}
      <Route
        path="/painel"
        element={
          <AuthGate>
            <AppShell />
          </AuthGate>
        }
      >
        <Route index element={<Navigate to="/painel/chamados" replace />} />
        <Route path="chamados" element={<ChamadosPage />} />
        <Route path="triagem" element={<TriagemPage />} />
        <Route path="admissoes" element={<AdmissoesPage />} />
        <Route path="desligamentos" element={<DesligamentosPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
