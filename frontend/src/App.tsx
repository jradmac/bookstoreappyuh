import BookList from './components/BookList';
import AdminBooks from './components/AdminBooks';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';

// Import Bootstrap icons
import 'bootstrap-icons/font/bootstrap-icons.css';

function App() {
  // Load Bootstrap JS on component mount
  useEffect(() => {
    // Dynamic import of Bootstrap JS
    // @ts-ignore
    import('bootstrap/dist/js/bootstrap.bundle.min.js');
  }, []);

  return (
    <Router>
      <div className="App">
        <header className="bg-dark text-white p-4 mb-3">
          <div className="container-fluid">
            <div className="row align-items-center">
              <div className="col">
                <h1><i className="bi bi-book me-2"></i>Online Bookstore</h1>
                <p className="lead mb-0">Discover your next favorite read</p>
              </div>
              <div className="col-auto">
                <a href="/adminbooks" className="btn btn-outline-light admin-link">
                  <i className="bi bi-gear-fill me-2"></i>Admin
                </a>
              </div>
            </div>
          </div>
        </header>
        
        <main className="container-fluid fade-in">
          <Routes>
            <Route path="/" element={<BookList />} />
            <Route path="/adminbooks" element={<AdminBooks />} />
            <Route path="*" element={<BookList />} />
          </Routes>
        </main>
        
        <footer className="bg-light text-center p-3 mt-5">
          <div className="container">
            <p className="text-muted mb-0">© 2023 Online Bookstore. All rights reserved.</p>
            <div className="mt-2">
              <a href="#" className="text-decoration-none me-3">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="#" className="text-decoration-none me-3">
                <i className="bi bi-twitter"></i>
              </a>
              <a href="#" className="text-decoration-none me-3">
                <i className="bi bi-instagram"></i>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
