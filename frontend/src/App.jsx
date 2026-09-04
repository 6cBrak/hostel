import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { SiteSettingsProvider } from './context/SiteSettingsContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/public/Home'
import HostelDetail from './pages/public/HostelDetail'
import RoomsCatalog from './pages/public/RoomsCatalog'
import RoomDetail from './pages/public/RoomDetail'
import ReservationForm from './pages/public/ReservationForm'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import MyReservations from './pages/student/MyReservations'
import InvoiceDetail from './pages/student/InvoiceDetail'
import Profile from './pages/student/Profile'
import RequireStaff from './components/RequireStaff'
import RequireAdmin from './components/RequireAdmin'
import RequireFinanceStaff from './components/RequireFinanceStaff'
import AdminLayout from './pages/admin/AdminLayout'
import ReservationsQueue from './pages/admin/ReservationsQueue'
import TenantsList from './pages/admin/TenantsList'
import TransfersHistory from './pages/admin/TransfersHistory'
import ReservationDetailAdmin from './pages/admin/ReservationDetailAdmin'
import InvoicesQueue from './pages/admin/InvoicesQueue'
import InvoiceDetailAdmin from './pages/admin/InvoiceDetailAdmin'
import Dashboard from './pages/admin/Dashboard'
import HostelsList from './pages/admin/hostels/HostelsList'
import HostelForm from './pages/admin/hostels/HostelForm'
import RoomsList from './pages/admin/rooms/RoomsList'
import RoomForm from './pages/admin/rooms/RoomForm'
import PricesList from './pages/admin/prices/PricesList'
import PriceForm from './pages/admin/prices/PriceForm'
import CompanySettings from './pages/admin/settings/CompanySettings'
import References from './pages/admin/references/References'
import ExternalResidencesList from './pages/admin/externalresidences/ExternalResidencesList'
import ExternalResidenceForm from './pages/admin/externalresidences/ExternalResidenceForm'
import UsersList from './pages/admin/users/UsersList'
import UserForm from './pages/admin/users/UserForm'
import ExpensesList from './pages/admin/cashbox/ExpensesList'
import ExpenseForm from './pages/admin/cashbox/ExpenseForm'
import CashboxDashboard from './pages/admin/cashbox/CashboxDashboard'

export default function App() {
  return (
    <SiteSettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-center" />
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/hostels/:id" element={<HostelDetail />} />
              <Route path="/chambres" element={<RoomsCatalog />} />
              <Route path="/chambres/:id" element={<RoomDetail />} />
              <Route path="/reserver" element={<ReservationForm />} />
              <Route path="/connexion" element={<Login />} />
              <Route path="/inscription" element={<Register />} />
              <Route path="/espace/reservations" element={<MyReservations />} />
              <Route path="/espace/factures/:reservationId" element={<InvoiceDetail />} />
              <Route path="/espace/profil" element={<Profile />} />
              <Route
                path="/admin"
                element={
                  <RequireStaff>
                    <AdminLayout />
                  </RequireStaff>
                }
              >
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="reservations" element={<ReservationsQueue />} />
                <Route path="reservations/:id" element={<ReservationDetailAdmin />} />
                <Route path="locataires" element={<TenantsList />} />
                <Route path="transferts" element={<TransfersHistory />} />
                <Route path="factures" element={<InvoicesQueue />} />
                <Route path="factures/:id" element={<InvoiceDetailAdmin />} />
                <Route path="hostels" element={<HostelsList />} />
                <Route path="hostels/:id" element={<HostelForm />} />
                <Route path="chambres" element={<RoomsList />} />
                <Route path="chambres/:id" element={<RoomForm />} />
                <Route path="tarifs" element={<PricesList />} />
                <Route path="tarifs/:id" element={<PriceForm />} />
                <Route path="referentiels" element={<References />} />
                <Route path="residences-externes" element={<ExternalResidencesList />} />
                <Route path="residences-externes/:id" element={<ExternalResidenceForm />} />
                <Route
                  path="depenses"
                  element={
                    <RequireFinanceStaff>
                      <ExpensesList />
                    </RequireFinanceStaff>
                  }
                />
                <Route
                  path="depenses/:id"
                  element={
                    <RequireFinanceStaff>
                      <ExpenseForm />
                    </RequireFinanceStaff>
                  }
                />
                <Route
                  path="caisse"
                  element={
                    <RequireFinanceStaff>
                      <CashboxDashboard />
                    </RequireFinanceStaff>
                  }
                />
                <Route
                  path="parametres"
                  element={
                    <RequireAdmin>
                      <CompanySettings />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="utilisateurs"
                  element={
                    <RequireAdmin>
                      <UsersList />
                    </RequireAdmin>
                  }
                />
                <Route
                  path="utilisateurs/:id"
                  element={
                    <RequireAdmin>
                      <UserForm />
                    </RequireAdmin>
                  }
                />
              </Route>
            </Routes>
            <Footer />
          </div>
        </BrowserRouter>
      </AuthProvider>
    </SiteSettingsProvider>
  )
}
