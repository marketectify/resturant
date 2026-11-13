import { useEffect, useState } from 'react';
import { StoreProvider } from './store.jsx';
import MenuPage from './pages/MenuPage.jsx';
import Checkout from './pages/Checkout.jsx';
import Booking from './pages/Booking.jsx';
import Track from './pages/Track.jsx';
import Admin from './pages/Admin.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import SearchModal from './components/SearchModal.jsx';
import ProductModal from './components/ProductModal.jsx';
import BottomNav from './components/BottomNav.jsx';
import { ScrollTop, WhatsAppFab } from './components/Floaters.jsx';

const route = () => location.hash.replace(/^#/, '').split('?')[0] || '/';

function useRoute() {
  const [r, setR] = useState(route);
  useEffect(() => {
    const on = () => { setR(route()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return r;
}

export default function App() {
  const r = useRoute();
  if (r === '/admin') return <Admin />;
  const Page = r === '/checkout' ? Checkout : r === '/book' ? Booking : r === '/track' ? Track : MenuPage;
  return (
    <StoreProvider>
      <Page />
      <CartDrawer />
      <ProductModal />
      <SearchModal />
      <BottomNav />
      <WhatsAppFab />
      <ScrollTop />
    </StoreProvider>
  );
}
