import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { AuthGate } from './components/AuthGate'
import { MeusChamadosPage } from './pages/MeusChamadosPage'
import { FormularioPage } from './pages/FormularioPage'
import { ChamadosPage } from './pages/ChamadosPage'
import { TriagemPage } from './pages/TriagemPage'
import { AdmissoesPage } from './pages/AdmissoesPage'
import { DesligamentosPage } from './pages/DesligamentosPage'

export default function App() {
  return (
    <Routes>
      {/* público — quem abre o chamado se identifica pelo e-mail, vê os
          próprios chamados e abre novos */}
      <Route path="/" element={<MeusChamadosPage />} />
      <Route path="/novo" element={<FormularioPage />} />

      {/* interno — equipe de TI. Rota separada e não divulgada: o formulário
          público não aponta para cá, só se chega digitando o endereço. */}
      <Route
        path="/interno"
        element={
          <AuthGate>
            <AppShell />
          </AuthGate>
        }
      >
        <Route index element={<Navigate to="/interno/chamados" replace />} />
        <Route path="chamados" element={<ChamadosPage />} />
        <Route path="triagem" element={<TriagemPage />} />
        <Route path="admissoes" element={<AdmissoesPage />} />
        <Route path="desligamentos" element={<DesligamentosPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
