using BookStoreProject.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Threading.Tasks;
using System.Text.Json.Serialization;

namespace BookStoreProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BooksController : ControllerBase
    {
        private readonly BookDbContext _bookContext;
        
        public BooksController(BookDbContext context) => _bookContext = context;

        // GET: api/Books
        [HttpGet]
        public async Task<ActionResult<PagedBookResult>> GetBooks(
            int pageNumber = 1, 
            int pageSize = 5, 
            string sortField = "Title",
            string sortOrder = "asc",
            string category = "")
        {
            // Validate page parameters
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 5;
            if (pageSize > 50) pageSize = 50; // Limit maximum page size
            
            // Start with all books query
            var booksQuery = _bookContext.Books.AsQueryable();
            
            // Apply category filter if provided
            if (!string.IsNullOrWhiteSpace(category))
            {
                booksQuery = booksQuery.Where(b => b.Category.ToLower() == category.ToLower());
            }
            
            // Calculate total books count before pagination
            var totalCount = await booksQuery.CountAsync();
            
            // Apply sorting
            booksQuery = sortOrder.ToLower() == "desc" 
                ? ApplySortingDescending(booksQuery, sortField)
                : ApplySortingAscending(booksQuery, sortField);
            
            // Apply pagination
            var books = await booksQuery
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
            
            // Return paged result
            return new PagedBookResult
            {
                Books = books,
                PageNumber = pageNumber,
                PageSize = pageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)pageSize),
                SortField = sortField,
                SortOrder = sortOrder,
                Category = category
            };
        }
        
        // GET: api/Books/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Book>> GetBook(int id)
        {
            var book = await _bookContext.Books.FindAsync(id);
            
            if (book == null)
            {
                return NotFound();
            }
            
            return book;
        }
        
        // POST: api/Books
        [HttpPost]
        public async Task<ActionResult<Book>> CreateBook(Book book)
        {
            _bookContext.Books.Add(book);
            await _bookContext.SaveChangesAsync();

            return CreatedAtAction(nameof(GetBook), new { id = book.BookId }, book);
        }

        // PUT: api/Books/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateBook(int id, Book book)
        {
            if (id != book.BookId)
            {
                return BadRequest();
            }

            _bookContext.Entry(book).State = EntityState.Modified;

            try
            {
                await _bookContext.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BookExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Books/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBook(int id)
        {
            var book = await _bookContext.Books.FindAsync(id);
            if (book == null)
            {
                return NotFound();
            }

            _bookContext.Books.Remove(book);
            await _bookContext.SaveChangesAsync();

            return NoContent();
        }

        private bool BookExists(int id)
        {
            return _bookContext.Books.Any(e => e.BookId == id);
        }
        
        // Helper methods for sorting
        private IQueryable<Book> ApplySortingAscending(IQueryable<Book> query, string sortField)
        {
            return sortField.ToLower() switch
            {
                "title" => query.OrderBy(b => b.Title),
                "author" => query.OrderBy(b => b.Author),
                "publisher" => query.OrderBy(b => b.Publisher),
                "isbn" => query.OrderBy(b => b.ISBN),
                "classification" => query.OrderBy(b => b.Classification),
                "category" => query.OrderBy(b => b.Category),
                "pagecount" => query.OrderBy(b => b.PageCount),
                "price" => query.OrderBy(b => b.Price),
                _ => query.OrderBy(b => b.Title) // Default sort
            };
        }
        
        private IQueryable<Book> ApplySortingDescending(IQueryable<Book> query, string sortField)
        {
            return sortField.ToLower() switch
            {
                "title" => query.OrderByDescending(b => b.Title),
                "author" => query.OrderByDescending(b => b.Author),
                "publisher" => query.OrderByDescending(b => b.Publisher),
                "isbn" => query.OrderByDescending(b => b.ISBN),
                "classification" => query.OrderByDescending(b => b.Classification),
                "category" => query.OrderByDescending(b => b.Category),
                "pagecount" => query.OrderByDescending(b => b.PageCount),
                "price" => query.OrderByDescending(b => b.Price),
                _ => query.OrderByDescending(b => b.Title) // Default sort
            };
        }
    }
    
    // Class to represent paged results
    public class PagedBookResult
    {
        [JsonPropertyName("books")]
        public IEnumerable<Book> Books { get; set; }
        
        [JsonPropertyName("pageNumber")]
        public int PageNumber { get; set; }
        
        [JsonPropertyName("pageSize")]
        public int PageSize { get; set; }
        
        [JsonPropertyName("totalCount")]
        public int TotalCount { get; set; }
        
        [JsonPropertyName("totalPages")]
        public int TotalPages { get; set; }
        
        [JsonPropertyName("sortField")]
        public string SortField { get; set; }
        
        [JsonPropertyName("sortOrder")]
        public string SortOrder { get; set; }
        
        [JsonPropertyName("category")]
        public string Category { get; set; }
    }
}


