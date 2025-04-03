import { useState, useEffect } from 'react';
import { getBooks, isUsingRealApiData } from '../services/bookService';
import { Book, PagedBookResult, CartItem, ShoppingCart } from '../types/Book';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useLocation } from 'react-router-dom';

const BookList = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [bookData, setBookData] = useState<PagedBookResult | null>(null);
  const [pageSize, setPageSize] = useState<number>(5);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<string>('title');
  const [sortOrder, setSortOrder] = useState<string>('asc');
  const [usingMockData, setUsingMockData] = useState<boolean>(true); // Default to true until we confirm real API
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<string[]>(['All']);
  
  // Shopping cart state
  const [cart, setCart] = useState<ShoppingCart>(() => {
    // Initialize from localStorage if available
    const savedCart = localStorage.getItem('bookstoreCart');
    return savedCart 
      ? JSON.parse(savedCart)
      : { items: [], totalPrice: 0, itemCount: 0, lastViewedUrl: window.location.pathname };
  });
  
  // Show/hide cart modal
  const [showCart, setShowCart] = useState<boolean>(false);
  
  const location = useLocation();

  useEffect(() => {
    fetchBooks();
  }, [currentPage, pageSize, sortField, sortOrder, selectedCategory]);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('bookstoreCart', JSON.stringify(cart));
  }, [cart]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      // Pass the selected category to the API
      const categoryFilter = selectedCategory !== 'All' ? selectedCategory : '';
      const data = await getBooks(currentPage, pageSize, sortField, sortOrder, categoryFilter);
      setBookData(data);
      setError(null);
      
      // Update mock data status based on the API result
      setUsingMockData(!isUsingRealApiData());

      // Extract unique categories from the data if we have all books
      if (!categoryFilter && data.totalCount > 0) {
        // Get all books to extract categories
        const allData = await getBooks(1, data.totalCount, sortField, sortOrder, '');
        
        // Extract unique categories
        const uniqueCategories = ['All', ...new Set(allData.books.map(book => book.category))];
        setCategories(uniqueCategories);
      }
    } catch (err: any) {
      console.error('Error in BookList component:', err);
      let errorMessage = 'Failed to fetch books. Please try again later.';
      
      // Try to extract more detailed error information
      if (err.message) {
        errorMessage += ` Error: ${err.message}`;
      }
      
      setError(errorMessage);
      setUsingMockData(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(event.target.value));
    setCurrentPage(1); // Reset to first page when changing page size
  };
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1); // Reset to first page when changing category
  };

  const handleSortFieldChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortField(e.target.value);
  };
  
  const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value);
  };

  // Shopping cart methods
  const addToCart = (book: Book) => {
    setCart(prevCart => {
      // Check if book is already in cart
      const existingItem = prevCart.items.find(item => item.book.bookId === book.bookId);
      
      if (existingItem) {
        // Increase quantity if already in cart
        const updatedItems = prevCart.items.map(item => 
          item.book.bookId === book.bookId 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.book.price } 
            : item
        );
        
        return {
          ...prevCart,
          items: updatedItems,
          totalPrice: updatedItems.reduce((sum, item) => sum + item.subtotal, 0),
          itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
          lastViewedUrl: location.pathname
        };
      } else {
        // Add new item to cart
        const newItem: CartItem = {
          book,
          quantity: 1,
          subtotal: book.price
        };
        
        return {
          ...prevCart,
          items: [...prevCart.items, newItem],
          totalPrice: prevCart.totalPrice + book.price,
          itemCount: prevCart.itemCount + 1,
          lastViewedUrl: location.pathname
        };
      }
    });
    
    // Show the cart after adding item
    setShowCart(true);
  };
  
  const removeFromCart = (bookId: number) => {
    setCart(prevCart => {
      const updatedItems = prevCart.items.filter(item => item.book.bookId !== bookId);
      
      return {
        ...prevCart,
        items: updatedItems,
        totalPrice: updatedItems.reduce((sum, item) => sum + item.subtotal, 0),
        itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0)
      };
    });
  };
  
  const updateQuantity = (bookId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setCart(prevCart => {
      const updatedItems = prevCart.items.map(item => 
        item.book.bookId === bookId 
          ? { 
              ...item, 
              quantity: newQuantity, 
              subtotal: newQuantity * item.book.price 
            } 
          : item
      );
      
      return {
        ...prevCart,
        items: updatedItems,
        totalPrice: updatedItems.reduce((sum, item) => sum + item.subtotal, 0),
        itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0)
      };
    });
  };
  
  const continueShopping = () => {
    setShowCart(false);
  };

  // Render pagination controls
  const renderPagination = () => {
    if (!bookData) return null;

    const { totalPages } = bookData;
    const pages = [];

    // Previous button
    pages.push(
      <li key="prev" className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
        <button
          className="page-link"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          Previous
        </button>
      </li>
    );

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <li key={i} className={`page-item ${currentPage === i ? 'active' : ''}`}>
          <button
            className="page-link"
            onClick={() => handlePageChange(i)}
          >
            {i}
          </button>
        </li>
      );
    }

    // Next button
    pages.push(
      <li key="next" className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
        <button
          className="page-link"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </li>
    );

    return (
      <nav aria-label="Book pagination">
        <ul className="pagination">{pages}</ul>
      </nav>
    );
  };

  // Format price as currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  // Render shopping cart modal
  const renderCartModal = () => {
    if (!showCart) return null;
    
    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
           style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
        <div className="bg-white p-4 rounded shadow-lg" style={{ width: '80%', maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h3 className="mb-0">Shopping Cart</h3>
            <button className="btn-close" onClick={() => setShowCart(false)}></button>
          </div>
          
          {cart.items.length === 0 ? (
            <div className="alert alert-info">Your cart is empty.</div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Price</th>
                      <th>Quantity</th>
                      <th>Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.items.map(item => (
                      <tr key={item.book.bookId}>
                        <td>{item.book.title}</td>
                        <td>{formatPrice(item.book.price)}</td>
                        <td>
                          <div className="input-group input-group-sm" style={{ width: '120px' }}>
                            <button 
                              className="btn btn-outline-secondary" 
                              type="button"
                              onClick={() => updateQuantity(item.book.bookId, item.quantity - 1)}
                            >
                              -
                            </button>
                            <input 
                              type="text" 
                              className="form-control text-center" 
                              value={item.quantity}
                              readOnly
                            />
                            <button 
                              className="btn btn-outline-secondary" 
                              type="button"
                              onClick={() => updateQuantity(item.book.bookId, item.quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td>{formatPrice(item.subtotal)}</td>
                        <td>
                          <button 
                            className="btn btn-sm btn-danger" 
                            onClick={() => removeFromCart(item.book.bookId)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-dark">
                      <td colSpan={3} className="text-end fw-bold">Total:</td>
                      <td className="fw-bold">{formatPrice(cart.totalPrice)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              
              <div className="d-flex justify-content-between mt-3">
                <button className="btn btn-secondary" onClick={continueShopping}>
                  Continue Shopping
                </button>
                <button className="btn btn-success">
                  Checkout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Render book cards
  const renderBooks = () => {
    if (!bookData || !bookData.books || bookData.books.length === 0) {
      return (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          No books found. Try changing your filter criteria.
        </div>
      );
    }

    return (
      <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
        {bookData.books.map(book => (
          <div key={book.bookId} className="col">
            <div className="card h-100">
              <div className="card-header d-flex justify-content-between align-items-center">
                <span className={`badge ${book.classification.toLowerCase() === 'fiction' ? 'badge-fiction' : 'badge-non-fiction'}`}>
                  {book.classification}
                </span>
                <span className="price-tag">{formatPrice(book.price)}</span>
              </div>
              <div className="card-body">
                <h5 className="card-title">{book.title}</h5>
                <h6 className="card-subtitle mb-2 text-muted">
                  <i className="bi bi-person me-1"></i> {book.author}
                </h6>
                <div className="card-text">
                  <p><i className="bi bi-building me-1"></i> Publisher: {book.publisher}</p>
                  <p><i className="bi bi-upc me-1"></i> ISBN: {book.isbn}</p>
                  <p><i className="bi bi-tag me-1"></i> Category: {book.category}</p>
                  <p><i className="bi bi-file-text me-1"></i> Pages: {book.pageCount}</p>
                </div>
                <div className="d-grid gap-2">
                  <button
                    className="btn btn-primary"
                    onClick={() => addToCart(book)}
                  >
                    <i className="bi bi-cart-plus me-1"></i> Add to Cart
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading && !bookData) {
    return <div className="text-center p-5">Loading books...</div>;
  }

  return (
    <div className="container">
      {/* Filter and Sort Controls */}
      <div className="card mb-4 shadow-sm">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Category</label>
              <select 
                className="form-select"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.filter(cat => cat !== 'All').map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Sort By</label>
              <select
                className="form-select"
                value={sortField}
                onChange={handleSortFieldChange}
              >
                <option value="title">Title</option>
                <option value="author">Author</option>
                <option value="pageCount">Page Count</option>
                <option value="price">Price</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Order</label>
              <select
                className="form-select"
                value={sortOrder}
                onChange={handleSortOrderChange}
              >
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Display info about API status */}
      {usingMockData && (
        <div className="alert alert-warning mb-4" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <strong>Using mock data.</strong> The backend API could not be reached, so we're displaying sample data.
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="alert alert-danger mb-4" role="alert">
          <i className="bi bi-x-circle-fill me-2"></i>
          {error}
        </div>
      )}

      {/* Books List */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2><i className="bi bi-collection me-2"></i>Books</h2>
          <div>
            <button
              className="btn btn-sm btn-outline-secondary me-2"
              onClick={() => setShowCart(true)}
            >
              <i className="bi bi-cart me-1"></i>
              Cart ({cart.itemCount})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading books...</p>
          </div>
        ) : (
          renderBooks()
        )}
      </div>

      {/* Pagination Controls */}
      {bookData && bookData.totalPages > 1 && (
        <div className="d-flex justify-content-center mt-4 mb-4">
          {renderPagination()}
        </div>
      )}

      {/* Books per page controls */}
      <div className="card shadow-sm mt-4">
        <div className="card-body">
          <div className="row g-3 mb-4 align-items-center">
            <div className="col-sm-auto">
              <label className="form-label mb-0">Books per page:</label>
            </div>
            <div className="col-sm-auto">
              <select
                className="form-select"
                value={pageSize}
                onChange={handlePageSizeChange}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
              </select>
            </div>
            <div className="col-sm-auto ms-auto">
              <button 
                className="btn btn-outline-primary" 
                onClick={fetchBooks} 
                disabled={loading}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Modal */}
      {renderCartModal()}
    </div>
  );
};

export default BookList; 