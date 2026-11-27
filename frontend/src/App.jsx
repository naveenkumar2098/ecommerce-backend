import { Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import RequireAuth from './components/RequireAuth';
import Shop from './pages/Shop';
import ProductPage from './pages/ProductPage';
import Cart from './pages/Cart';
import { SignIn, SignUp, ForgotPassword, ResetPassword } from './pages/AuthPages';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Workspace, { WorkspaceHome } from './pages/workspace/Workspace';
import ManageProducts from './pages/workspace/ManageProducts';
import ManageOrders from './pages/workspace/ManageOrders';
import IssueQueue from './pages/workspace/IssueQueue';
import People from './pages/workspace/People';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Header />
      <main id="main" className="main">
        <Routes>
          <Route path="/" element={<Shop />} />
          <Route path="/products/:id" element={<ProductPage />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/sign-up" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route
            path="/orders"
            element={
              <RequireAuth roles={['customer']}>
                <Orders />
              </RequireAuth>
            }
          />
          <Route
            path="/orders/:id"
            element={
              <RequireAuth roles={['customer']}>
                <OrderDetail />
              </RequireAuth>
            }
          />
          <Route
            path="/workspace"
            element={
              <RequireAuth roles={['admin', 'supplier', 'support']}>
                <Workspace />
              </RequireAuth>
            }
          >
            <Route index element={<WorkspaceHome />} />
            <Route path="products" element={<RequireAuth roles={['admin', 'supplier']}><ManageProducts /></RequireAuth>} />
            <Route path="orders" element={<RequireAuth roles={['admin']}><ManageOrders /></RequireAuth>} />
            <Route path="issues" element={<RequireAuth roles={['admin', 'support']}><IssueQueue /></RequireAuth>} />
            <Route path="people" element={<RequireAuth roles={['admin']}><People /></RequireAuth>} />
          </Route>
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
