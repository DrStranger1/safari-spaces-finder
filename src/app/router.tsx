import { Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import SearchPage from '@/pages/Search';
import PropertyDetail from '@/pages/PropertyDetail';
import Dashboard from '@/pages/Dashboard';
import NewListing from '@/pages/NewListing';
import Favorites from '@/pages/Favorites';
import NotFound from '@/pages/NotFound';
import RequireAuth from '@/routes/RequireAuth';

export default function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/property/:id" element={<PropertyDetail />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={<RequireAuth><Dashboard /></RequireAuth>}
      />
      <Route
        path="/dashboard/new-listing"
        element={<RequireAuth><NewListing /></RequireAuth>}
      />
      <Route
        path="/favorites"
        element={<RequireAuth><Favorites /></RequireAuth>}
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
