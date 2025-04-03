import axios from 'axios';
import { Book, PagedBookResult } from '../types/Book';

// List of possible API endpoints to try in order
const API_ENDPOINTS = [
  'https://bookstoreprojectyuh.azurewebsites.net/api',  // Azure deployed endpoint (first priority)
  'http://localhost:5300/api',   // Local development port
  'https://localhost:7300/api',  // HTTPS local development port
  'http://localhost:5017/api',   // Old HTTP port (keeping as fallback)
  'https://localhost:7043/api',  // Old HTTPS port (keeping as fallback)
  'https://localhost:5001/api',  // Common HTTPS default port
  'http://localhost:5000/api'    // Common HTTP default port
];

// Create a mock data response as a fallback in case the API is unreachable
// This will allow the UI to at least render something for testing
const createMockBooks = (): PagedBookResult => {
  return {
    books: [
      {
        bookId: 1,
        title: "Clean Code",
        author: "Robert C. Martin",
        publisher: "Prentice Hall",
        isbn: "978-0132350884",
        classification: "Non-Fiction",
        category: "Software",
        pageCount: 464,
        price: 39.99
      },
      {
        bookId: 2,
        title: "Design Patterns",
        author: "Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides",
        publisher: "Addison-Wesley",
        isbn: "978-0201633610",
        classification: "Non-Fiction",
        category: "Software",
        pageCount: 395,
        price: 49.99
      },
      {
        bookId: 3,
        title: "The Pragmatic Programmer",
        author: "Andrew Hunt, David Thomas",
        publisher: "Addison-Wesley",
        isbn: "978-0201616224",
        classification: "Non-Fiction",
        category: "Software",
        pageCount: 352,
        price: 39.95
      },
      {
        bookId: 4,
        title: "Steve Jobs",
        author: "Walter Isaacson",
        publisher: "Simon & Schuster",
        isbn: "978-1451648539",
        classification: "Non-Fiction",
        category: "Biography",
        pageCount: 656,
        price: 35.00
      },
      {
        bookId: 5,
        title: "Becoming",
        author: "Michelle Obama",
        publisher: "Crown",
        isbn: "978-1524763138",
        classification: "Non-Fiction",
        category: "Biography",
        pageCount: 448,
        price: 32.50
      },
      {
        bookId: 6,
        title: "Atomic Habits",
        author: "James Clear",
        publisher: "Penguin Random House",
        isbn: "978-0735211292",
        classification: "Non-Fiction",
        category: "Self-Help",
        pageCount: 320,
        price: 27.00
      },
      {
        bookId: 7,
        title: "The 7 Habits of Highly Effective People",
        author: "Stephen R. Covey",
        publisher: "Free Press",
        isbn: "978-0743269513",
        classification: "Non-Fiction",
        category: "Self-Help",
        pageCount: 432,
        price: 30.00
      },
      {
        bookId: 8,
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        publisher: "Harper Perennial",
        isbn: "978-0060935467",
        classification: "Fiction",
        category: "Classic",
        pageCount: 336,
        price: 15.99
      },
      {
        bookId: 9,
        title: "Pride and Prejudice",
        author: "Jane Austen",
        publisher: "Penguin Classics",
        isbn: "978-0141439518",
        classification: "Fiction",
        category: "Classic",
        pageCount: 480,
        price: 9.99
      },
      {
        bookId: 10,
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
        publisher: "Scribner",
        isbn: "978-0743273565",
        classification: "Fiction",
        category: "Classic",
        pageCount: 180,
        price: 17.00
      }
    ],
    pageNumber: 1,
    pageSize: 5,
    totalCount: 10,
    totalPages: 2,
    sortField: "title",
    sortOrder: "asc"
  };
};

// Start with assuming the API should be available
let useMockData = false;
let isTestingEndpoints = false;
let currentApiUrl: string | null = null;
let isUsingRealApi = false; // Track if we're actually using the real API

// Export the real API status for UI components
export const isUsingRealApiData = () => isUsingRealApi;

const findWorkingApiEndpoint = async (): Promise<string> => {
  if (currentApiUrl) return currentApiUrl;
  if (isTestingEndpoints) return API_ENDPOINTS[0]; // Prevent recursive testing
  
  isTestingEndpoints = true;
  console.log('Testing API endpoints to find a working one...');
  
  for (const endpoint of API_ENDPOINTS) {
    try {
      console.log(`Trying endpoint: ${endpoint}`);
      const response = await axios.get(`${endpoint}/Books`, { 
        params: { pageNumber: 1, pageSize: 1 },
        timeout: 5000 // Timeout after 5 seconds
      });
      if (response.status === 200) {
        console.log(`Found working endpoint: ${endpoint}`);
        currentApiUrl = endpoint;
        useMockData = false; // We found a working API, don't use mock data
        isUsingRealApi = true; // Flag that we're using the real API
        isTestingEndpoints = false;
        return endpoint;
      }
    } catch (error: any) {
      console.log(`Endpoint ${endpoint} failed:`, error.message);
    }
  }
  
  console.error('No working API endpoints found. Using mock data as fallback.');
  useMockData = true;
  isUsingRealApi = false;
  isTestingEndpoints = false;
  return API_ENDPOINTS[0]; // Return first endpoint even though it doesn't work
};

// Function to get books with pagination and sorting
export const getBooks = async (
  pageNumber: number = 1,
  pageSize: number = 5,
  sortField: string = 'title',
  sortOrder: string = 'asc',
  category: string = ''
): Promise<PagedBookResult> => {
  // First try to fetch from API
  try {
    const apiUrl = await findWorkingApiEndpoint();
    console.log(`Fetching books from: ${apiUrl}/Books with params:`, { pageNumber, pageSize, sortField, sortOrder, category });
    
    // Only try API if useMockData is false
    if (!useMockData) {
      const response = await axios.get<PagedBookResult>(`${apiUrl}/Books`, {
        params: {
          pageNumber,
          pageSize,
          sortField,
          sortOrder,
          category
        }
      });
      
      console.log('Response received:', response.data);
      isUsingRealApi = true; // Successfully using real API
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching books:', error);
    if (axios.isAxiosError(error)) {
      console.error('Axios error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    
    // After API failure, switch to mock data
    if (!useMockData) {
      console.log('Switching to mock data after API failure');
      useMockData = true;
      isUsingRealApi = false;
    }
  }
  
  // When using mock data, handle pagination, sorting here for the UI
  console.log('Using mock data for books...');
  const mockData = createMockBooks();
  
  // Apply filtering by category if provided
  let filteredBooks = [...mockData.books];
  if (category && category.trim() !== '') {
    filteredBooks = filteredBooks.filter(book => 
      book.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  // Apply sorting to mock data
  let sortedBooks = [...filteredBooks];
  
  // Simple sorting logic
  if (sortField && sortOrder) {
    const sortMultiplier = sortOrder.toLowerCase() === 'desc' ? -1 : 1;
    sortedBooks.sort((a, b) => {
      // Use type-safe property access
      const fieldName = sortField.toLowerCase() as keyof Book;
      const aValue = a[fieldName];
      const bValue = b[fieldName];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortMultiplier * aValue.localeCompare(bValue);
      }
      
      if (aValue < bValue) return -1 * sortMultiplier;
      if (aValue > bValue) return 1 * sortMultiplier;
      return 0;
    });
  }
  
  // Apply pagination
  const startIndex = (pageNumber - 1) * pageSize;
  const paginatedBooks = sortedBooks.slice(startIndex, startIndex + pageSize);
  
  // Calculate total pages
  const totalPages = Math.ceil(sortedBooks.length / pageSize);
  
  // Return simulated API response
  const result: PagedBookResult = {
    books: paginatedBooks,
    pageNumber: pageNumber,
    pageSize: pageSize,
    totalCount: sortedBooks.length,
    totalPages: totalPages,
    sortField: sortField,
    sortOrder: sortOrder,
    category: category
  };
  
  return Promise.resolve(result);
};

// Function to get a single book by ID
export const getBookById = async (id: number): Promise<Book> => {
  // First try API if not using mock data
  if (!useMockData) {
    try {
      const apiUrl = await findWorkingApiEndpoint();
      const response = await axios.get<Book>(`${apiUrl}/Books/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching book with ID ${id}:`, error);
      // Continue to mock data fallback
    }
  }

  // Fallback to mock data
  const mockBooks = createMockBooks();
  const book = mockBooks.books.find(b => b.bookId === id);
  if (book) return Promise.resolve(book);
  throw new Error('Book not found in mock data');
};

// Function to create a new book
export const createBook = async (book: Book): Promise<Book> => {
  try {
    const apiUrl = await findWorkingApiEndpoint();
    
    if (!useMockData) {
      const response = await axios.post<Book>(`${apiUrl}/Books`, book);
      return response.data;
    }
  } catch (error) {
    console.error('Error creating book:', error);
    throw error;
  }
  
  // Mock implementation in case the API is not available
  throw new Error('Create book operation not available in mock mode');
};

// Function to update a book
export const updateBook = async (id: number, book: Book): Promise<void> => {
  try {
    const apiUrl = await findWorkingApiEndpoint();
    
    if (!useMockData) {
      await axios.put(`${apiUrl}/Books/${id}`, book);
      return;
    }
  } catch (error) {
    console.error(`Error updating book with ID ${id}:`, error);
    throw error;
  }
  
  // Mock implementation in case the API is not available
  throw new Error('Update book operation not available in mock mode');
};

// Function to delete a book
export const deleteBook = async (id: number): Promise<void> => {
  try {
    const apiUrl = await findWorkingApiEndpoint();
    
    if (!useMockData) {
      await axios.delete(`${apiUrl}/Books/${id}`);
      return;
    }
  } catch (error) {
    console.error(`Error deleting book with ID ${id}:`, error);
    throw error;
  }
  
  // Mock implementation in case the API is not available
  throw new Error('Delete book operation not available in mock mode');
};