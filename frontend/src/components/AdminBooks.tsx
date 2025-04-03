import React, { useState, useEffect } from 'react';
import { Book } from '../types/Book';
import { getBooks, deleteBook, createBook, updateBook } from '../services/bookService';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Link } from 'react-router-dom';

const AdminBooks: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [sortField, setSortField] = useState<string>('title');
  const [sortOrder, setSortOrder] = useState<string>('asc');

  // For editing/creating a book
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // For confirmation modal
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);

  // Form data for new/edited book
  const [formData, setFormData] = useState<Partial<Book>>({
    title: '',
    author: '',
    publisher: '',
    isbn: '',
    classification: '',
    category: '',
    pageCount: 0,
    price: 0
  });

  useEffect(() => {
    fetchBooks();
  }, [currentPage, pageSize, sortField, sortOrder]);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getBooks(currentPage, pageSize, sortField, sortOrder);
      setBooks(result.books);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (err) {
      setError('Failed to fetch books. Please try again later.');
      console.error('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // For numeric values, convert strings to numbers
    if (name === 'pageCount' || name === 'price') {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'price' ? parseFloat(value) : parseInt(value, 10)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDeleteClick = (book: Book) => {
    setBookToDelete(book);
  };

  const handleConfirmDelete = async () => {
    if (!bookToDelete) return;
    
    try {
      await deleteBook(bookToDelete.bookId);
      fetchBooks(); // Refresh list after deletion
      setBookToDelete(null); // Close modal
    } catch (err) {
      setError('Failed to delete book. Please try again.');
      console.error('Error deleting book:', err);
    }
  };

  const handleEditClick = (book: Book) => {
    setEditingBook(book);
    setIsEditing(true);
    setIsCreating(false);
    setFormData({ ...book });
  };

  const handleCreateClick = () => {
    setIsCreating(true);
    setIsEditing(false);
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      publisher: '',
      isbn: '',
      classification: '',
      category: '',
      pageCount: 0,
      price: 0
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (isCreating) {
        await createBook(formData as Book);
      } else if (isEditing && editingBook) {
        await updateBook(editingBook.bookId, {
          ...formData,
          bookId: editingBook.bookId
        } as Book);
      }
      
      // Reset states and fetch updated list
      setIsCreating(false);
      setIsEditing(false);
      setEditingBook(null);
      fetchBooks();
    } catch (err) {
      setError(`Failed to ${isCreating ? 'create' : 'update'} book. Please try again.`);
      console.error(`Error ${isCreating ? 'creating' : 'updating'} book:`, err);
    }
  };

  const renderPagination = () => {
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

  return (
    <div className="container mt-4 fade-in">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2><i className="bi bi-pencil-square me-2"></i>Admin - Manage Books</h2>
        <div>
          <Link to="/" className="btn btn-secondary me-2">
            <i className="bi bi-arrow-left me-1"></i> Back to Store
          </Link>
          <button 
            className="btn btn-primary" 
            onClick={handleCreateClick}
          >
            <i className="bi bi-plus-circle me-1"></i> Add New Book
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          {error}
        </div>
      )}

      <div className="card shadow-sm mb-4">
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

      {loading ? (
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading books...</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead>
                <tr>
                  <th onClick={() => handleSort('bookId')} style={{ cursor: 'pointer' }}>
                    ID {sortField === 'bookId' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>
                    Title {sortField === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('author')} style={{ cursor: 'pointer' }}>
                    Author {sortField === 'author' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                    Category {sortField === 'category' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>
                    Price {sortField === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map(book => (
                  <tr key={book.bookId}>
                    <td>{book.bookId}</td>
                    <td>{book.title}</td>
                    <td>{book.author}</td>
                    <td><span className="badge bg-secondary">{book.category}</span></td>
                    <td><span className="price-tag">{formatPrice(book.price)}</span></td>
                    <td>
                      <button 
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => handleEditClick(book)}
                      >
                        <i className="bi bi-pencil me-1"></i> Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDeleteClick(book)}
                      >
                        <i className="bi bi-trash me-1"></i> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="d-flex justify-content-between align-items-center mt-3">
            <div>
              <p className="text-muted mb-0">
                Showing {books.length} of {totalCount} books
              </p>
            </div>
            {renderPagination()}
          </div>
        </>
      )}

      {/* Edit/Create Form Modal */}
      {(isEditing || isCreating) && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {isCreating ? (
                    <><i className="bi bi-plus-circle me-2"></i>Add New Book</>
                  ) : (
                    <><i className="bi bi-pencil me-2"></i>Edit Book: {editingBook?.title}</>
                  )}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setIsEditing(false);
                    setIsCreating(false);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <form onSubmit={handleSubmit}>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Title</label>
                      <input
                        type="text"
                        className="form-control"
                        name="title"
                        value={formData.title || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Author</label>
                      <input
                        type="text"
                        className="form-control"
                        name="author"
                        value={formData.author || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Publisher</label>
                      <input
                        type="text"
                        className="form-control"
                        name="publisher"
                        value={formData.publisher || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">ISBN</label>
                      <input
                        type="text"
                        className="form-control"
                        name="isbn"
                        value={formData.isbn || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Classification</label>
                      <select
                        className="form-select"
                        name="classification"
                        value={formData.classification || ''}
                        onChange={handleInputChange}
                        required
                      >
                        <option value="">Select Classification</option>
                        <option value="Fiction">Fiction</option>
                        <option value="Non-Fiction">Non-Fiction</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Category</label>
                      <input
                        type="text"
                        className="form-control"
                        name="category"
                        value={formData.category || ''}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Page Count</label>
                      <input
                        type="number"
                        className="form-control"
                        name="pageCount"
                        value={formData.pageCount || 0}
                        onChange={handleInputChange}
                        min="1"
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Price ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        name="price"
                        value={formData.price || 0}
                        onChange={handleInputChange}
                        min="0.01"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setIsEditing(false);
                        setIsCreating(false);
                      }}
                    >
                      <i className="bi bi-x-circle me-1"></i> Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {isCreating ? (
                        <><i className="bi bi-plus-circle me-1"></i> Create Book</>
                      ) : (
                        <><i className="bi bi-check-circle me-1"></i> Save Changes</>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {bookToDelete && (
        <div className="modal d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title"><i className="bi bi-exclamation-triangle-fill me-2"></i>Confirm Deletion</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setBookToDelete(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete "<strong>{bookToDelete.title}</strong>"?</p>
                <p className="text-danger"><i className="bi bi-exclamation-circle me-1"></i> This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setBookToDelete(null)}
                >
                  <i className="bi bi-x-circle me-1"></i> Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-danger"
                  onClick={handleConfirmDelete}
                >
                  <i className="bi bi-trash me-1"></i> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBooks; 