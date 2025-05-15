import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import Customers from './pages/Customers';
import Cylinders from './pages/Cylinders';
import Rentals from './pages/Rentals';
import Invoices from './pages/Invoices';
import Home from './pages/Home';
import Favorites from './pages/Favorites';
import CustomReports from './pages/CustomReports';
import AllAssetsReport from './pages/management-reports/AllAssetsReport';
import AssetTypeChangesReport from './pages/management-reports/AssetTypeChangesReport';
import AssetsByCustomerReport from './pages/management-reports/AssetsByCustomerReport';
import AuditsToDeliveryRecordsReport from './pages/management-reports/AuditsToDeliveryRecordsReport';
import BalanceChangesSummaryReport from './pages/management-reports/BalanceChangesSummaryReport';
import CustomerDeliveriesReport from './pages/management-reports/CustomerDeliveriesReport';
import DeliveriesByLocationReport from './pages/management-reports/DeliveriesByLocationReport';
import DeliveryTotalsByUserReport from './pages/management-reports/DeliveryTotalsByUserReport';
import LostAssetsReport from './pages/management-reports/LostAssetsReport';
import MovementBetweenLocationsReport from './pages/management-reports/MovementBetweenLocationsReport';
import NegativeBalanceReport from './pages/management-reports/NegativeBalanceReport';
import NewAssetsAddedReport from './pages/management-reports/NewAssetsAddedReport';
import NotScannedSourceReport from './pages/management-reports/NotScannedSourceReport';
import OverdueAssetSearchReport from './pages/management-reports/OverdueAssetSearchReport';
import PrintDaysRecordsReport from './pages/management-reports/PrintDaysRecordsReport';
import QuickMapReport from './pages/management-reports/QuickMapReport';
import QuickAdd from './pages/QuickAdd';
import LotReports from './pages/LotReports';
import RegularMaintenance from './pages/RegularMaintenance';
import Locations from './pages/Locations';
import Search from './pages/Search';
import CreateRecords from './pages/CreateRecords';
import Alerts from './pages/Alerts';
import MobileUnits from './pages/MobileUnits';
import Rental from './pages/Rental';
import CustomerDetail from './pages/CustomerDetail';
import AssetHistory from './pages/AssetHistory';
import AssetHistoryLookup from './pages/AssetHistoryLookup';
import ImportInvoices from './pages/ImportInvoices';
import ImportHistory from './pages/ImportHistory';
import AllAssetMovements from './pages/AllAssetMovements';
import Import from './pages/Import';
import ImportSalesReceipts from './pages/ImportSalesReceipts';
import Settings from './pages/Settings';
import ImportCustomerInfo from './pages/ImportCustomerInfo';
import ScannedOrders from './pages/ScannedOrders';
import SupabaseOrders from './pages/management-reports/SupabaseOrders';
import { useAuth } from './hooks/useAuth';
import MainLayout from './components/MainLayout';
import { ImportProgressProvider } from './components/ImportProgressContext';
import UserManagement from './pages/UserManagement';

function App() {
  const { user, profile, loading } = useAuth();

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;

  const isAuthenticated = !!user;

  return (
    <ImportProgressProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<MainLayout />}>
            <Route path="/" element={<Navigate to="/home" />} />
            <Route path="/dashboard" element={<Navigate to="/home" replace />} />
            <Route path="/customers" element={isAuthenticated ? <Customers user={user} profile={profile} /> : <Navigate to="/login" />} />
            <Route path="/customers/:id" element={isAuthenticated ? <CustomerDetail /> : <Navigate to="/login" />} />
            <Route path="/assets/:id/history" element={isAuthenticated ? <AssetHistory /> : <Navigate to="/login" />} />
            <Route path="/assets/history-lookup" element={isAuthenticated ? <AssetHistoryLookup /> : <Navigate to="/login" />} />
            <Route path="/cylinders" element={isAuthenticated ? <Cylinders user={user} profile={profile} /> : <Navigate to="/login" />} />
            <Route path="/rentals" element={isAuthenticated ? <Rentals user={user} profile={profile} /> : <Navigate to="/login" />} />
            <Route path="/invoices" element={isAuthenticated ? <Invoices user={user} profile={profile} /> : <Navigate to="/login" />} />
            <Route path="/home" element={isAuthenticated ? <Home user={user} profile={profile} /> : <Navigate to="/login" />} />
            <Route path="/settings" element={isAuthenticated ? <Settings /> : <Navigate to="/login" />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/custom-reports" element={<CustomReports />} />
            <Route path="/orders-report" element={<SupabaseOrders />} />
            <Route path="/quick-add" element={<QuickAdd />} />
            <Route path="/lot-reports" element={<LotReports />} />
            <Route path="/regular-maintenance" element={<RegularMaintenance />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/search" element={<Search />} />
            <Route path="/create-records" element={<CreateRecords />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/mobile-units" element={<MobileUnits />} />
            <Route path="/rental/*" element={<Rental />} />
            <Route path="/import" element={isAuthenticated ? <Import /> : <Navigate to="/login" />} />
            <Route path="/import-customer-info" element={isAuthenticated ? <ImportCustomerInfo /> : <Navigate to="/login" />} />
            <Route path="/import-sales-receipts" element={isAuthenticated ? <ImportSalesReceipts /> : <Navigate to="/login" />} />
            <Route path="/import-invoices" element={isAuthenticated ? <ImportInvoices /> : <Navigate to="/login" />} />
            <Route path="/import-history" element={isAuthenticated ? <ImportHistory /> : <Navigate to="/login" />} />
            <Route path="/all-asset-movements" element={isAuthenticated ? <AllAssetMovements /> : <Navigate to="/login" />} />
            <Route path="/scanned-orders" element={isAuthenticated ? <ScannedOrders /> : <Navigate to="/login" />} />
            <Route path="/user-management" element={isAuthenticated && profile?.role === 'admin' ? <UserManagement /> : <Navigate to="/home" />} />
            <Route path="*" element={<Navigate to="/home" />} />
          </Route>
        </Routes>
      </Router>
    </ImportProgressProvider>
  );
}

export default App; 