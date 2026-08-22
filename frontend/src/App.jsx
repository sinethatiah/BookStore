import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import BookListing from './pages/BookListing';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<BookListing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </Router>
  );
}

export default App;
