import { Route, Routes } from 'react-router-dom';
import PublicMenu from './pages/public/PublicMenu';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicMenu />} />
    </Routes>
  );
}