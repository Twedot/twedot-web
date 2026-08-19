import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import TwedotLanding from './Twedotlanding ';
import AboutPage from './pages/AboutPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import CareersPage from './pages/CareersPage';
import ContactPage from './pages/ContactPage';
import DeleteAccountPage from './pages/DeleteAccountPage';
import ChildSafetyPage from './pages/ChildSafetyPage';
import UserLinkPage from './pages/UserLinkPage';
import RoomLinkPage from './pages/RoomLinkPage';
import WithdrawEarningsPage from './pages/WithdrawEarningsPage';
import StarField from './components/StarField';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <StarField />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Routes>
            <Route path="/" element={<TwedotLanding />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/delete-account" element={<DeleteAccountPage />} />
            <Route path="/child-safety" element={<ChildSafetyPage />} />
            <Route path="/withdraw-earnings" element={<WithdrawEarningsPage />} />
            <Route path="/u/:token" element={<UserLinkPage />} />
            <Route path="/r/:code" element={<RoomLinkPage />} />
          </Routes>
        </div>
      </ThemeProvider>
    </BrowserRouter>
  );
}
