let filteredBooks = [...booksData];
let wishlist = [];
let currentView = 'grid';

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
});

function setupEventListeners() {
    // Search functionality
    document.getElementById('main-search').addEventListener('input', filterBooks);
    document.getElementById('sidebar-search').addEventListener('input', filterBooks);
    document.getElementById('search-btn').addEventListener('click', filterBooks);

    // Filter event listeners
    document.querySelectorAll('.genre-filter, .condition-filter, .format-filter').forEach(checkbox => {
        checkbox.addEventListener('change', filterBooks);
    });

    document.getElementById('author-filter').addEventListener('change', filterBooks);
    document.getElementById('location-filter').addEventListener('change', filterBooks);
    document.getElementById('language-filter').addEventListener('change', filterBooks);
    document.getElementById('price-min').addEventListener('input', filterBooks);
    document.getElementById('price-max').addEventListener('input', filterBooks);
    document.getElementById('price-range').addEventListener('input', updatePriceRange);
    document.getElementById('distance-range').addEventListener('input', updateDistanceRange);

    // Sort functionality
    document.getElementById('sort-select').addEventListener('change', sortBooks);

    // View toggle
    document.getElementById('grid-view').addEventListener('click', () => toggleView('grid'));
    document.getElementById('list-view').addEventListener('click', () => toggleView('list'));

    // Reset filters
    document.getElementById('reset-filters').addEventListener('click', resetFilters);
}


function createBookCard(book) {
    const col = document.createElement('div');
    col.className = currentView === 'grid' ? 'col-lg-4 col-md-6 mb-4' : 'col-12 mb-3';

    const badges = book.badges.map(badge => 
        `<span class="badge bg-warning badge-highlight">${badge}</span>`
    ).join('');

    const exchangeIndicator = book.exchangeAvailable ? 
        '<span class="exchange-indicator">Exchange Available</span>' : '';

    const priceDisplay = book.originalPrice ? 
        `<span class="book-price">₹${book.price} <small class="text-decoration-line-through text-muted">₹${book.originalPrice}</small></span>` :
        `<span class="book-price">₹${book.price}</span>`;

    col.innerHTML = `
        <div class="book-card position-relative">
            ${badges}
            <img src="${book.cover}" alt="${book.title}" class="book-cover">
            <div class="book-info">
                <h6 class="book-title">${book.title}${exchangeIndicator}</h6>
                <p class="book-author">by ${book.author}</p>
                ${priceDisplay}
                <span class="badge condition-badge ${getConditionClass(book.condition)}">${formatCondition(book.condition)}</span>
                <p class="location-text"><i class="bi bi-geo-alt"></i> ${book.location} (${book.distance})</p>
                <p class="book-description">${book.description}</p>
                <div class="action-buttons">
                    <button class="btn btn-primary btn-sm" onclick="showBookDetails(${book.id})">
                        <i class="bi bi-eye"></i> Details
                    </button>
                    <button class="btn btn-success btn-sm">
                        <i class="bi bi-cart-plus"></i> Buy
                    </button>
                    <button class="btn btn-outline-danger btn-sm wishlist-btn" onclick="toggleWishlist(${book.id})">
                        <i class="bi bi-heart"></i>
                    </button>
                    ${book.exchangeAvailable ? 
                        '<button class="btn btn-warning btn-sm"><i class="bi bi-arrow-left-right"></i> Exchange</button>' : 
                        ''
                    }
                </div>
            </div>
        </div>
    `;

    return col;
}

function toggleWishlist(bookId) {
    const index = wishlist.indexOf(bookId);
    if (index > -1) {
        wishlist.splice(index, 1);
    } else {
        wishlist.push(bookId);
    }
    
    document.getElementById('wishlist-count').textContent = wishlist.length;
    updateWishlistModal();
    
    // Update wishlist button appearance
    const wishlistBtns = document.querySelectorAll('.wishlist-btn');
    wishlistBtns.forEach(btn => {
        if (btn.onclick && btn.onclick.toString().includes(bookId)) {
            btn.classList.toggle('active', wishlist.includes(bookId));
        }
    });
}

function updateWishlistModal() {
    const wishlistContent = document.getElementById('wishlist-content');
    
    if (wishlist.length === 0) {
        wishlistContent.innerHTML = '<p class="text-center text-muted">Your wishlist is empty. Start adding books you\'re interested in!</p>';
        return;
    }
    
    const wishlistBooks = booksData.filter(book => wishlist.includes(book.id));
    wishlistContent.innerHTML = wishlistBooks.map(book => `
        <div class="row mb-3 p-3 border rounded">
            <div class="col-3">
                <img src="${book.cover}" alt="${book.title}" class="img-fluid rounded">
            </div>
            <div class="col-9">
                <h6>${book.title}</h6>
                <p class="text-muted mb-1">by ${book.author}</p>
                <p class="text-success mb-2">₹${book.price}</p>
                <button class="btn btn-sm btn-primary me-2">View Details</button>
                <button class="btn btn-sm btn-outline-danger" onclick="toggleWishlist(${book.id})">Remove</button>
            </div>
        </div>
    `).join('');
}

function filterBooks() {
    const searchTerm = (document.getElementById('main-search').value || document.getElementById('sidebar-search').value).toLowerCase();
    const selectedGenres = Array.from(document.querySelectorAll('.genre-filter:checked')).map(cb => cb.value);
    const selectedConditions = Array.from(document.querySelectorAll('.condition-filter:checked')).map(cb => cb.value);
    const selectedFormats = Array.from(document.querySelectorAll('.format-filter:checked')).map(cb => cb.value);
    const selectedAuthor = document.getElementById('author-filter').value;
    const selectedLocation = document.getElementById('location-filter').value;
    const selectedLanguage = document.getElementById('language-filter').value;
    const minPrice = parseFloat(document.getElementById('price-min').value) || 0;
    const maxPrice = parseFloat(document.getElementById('price-max').value) || Infinity;

    filteredBooks = booksData.filter(book => {
        const matchesSearch = !searchTerm || 
            book.title.toLowerCase().includes(searchTerm) ||
            book.author.toLowerCase().includes(searchTerm) ||
            book.description.toLowerCase().includes(searchTerm) ||
            book.isbn.includes(searchTerm);

        const matchesGenre = selectedGenres.length === 0 || selectedGenres.includes(book.genre);
        const matchesCondition = selectedConditions.length === 0 || selectedConditions.includes(book.condition);
        const matchesFormat = selectedFormats.length === 0 || selectedFormats.includes(book.format);
        const matchesAuthor = !selectedAuthor || book.author.toLowerCase().includes(selectedAuthor.replace('-', ' '));
        const matchesLocation = !selectedLocation || book.location.toLowerCase().includes(selectedLocation.replace('-', ' '));
        const matchesLanguage = !selectedLanguage || book.language === selectedLanguage;
        const matchesPrice = book.price >= minPrice && book.price <= maxPrice;

        return matchesSearch && matchesGenre && matchesCondition && matchesFormat && 
               matchesAuthor && matchesLocation && matchesLanguage && matchesPrice;
    });

    renderBooks();
}

function sortBooks() {
    const sortBy = document.getElementById('sort-select').value;
    
    filteredBooks.sort((a, b) => {
        switch(sortBy) {
            case 'newest':
                return new Date(b.dateAdded) - new Date(a.dateAdded);
            case 'oldest':
                return new Date(a.dateAdded) - new Date(b.dateAdded);
            case 'price-low':
                return a.price - b.price;
            case 'price-high':
                return b.price - a.price;
            case 'alphabetical':
                return a.title.localeCompare(b.title);
            case 'alphabetical-desc':
                return b.title.localeCompare(a.title);
            case 'popularity':
                return b.seller.reviews - a.seller.reviews;
            default:
                return 0;
        }
    });
    
    renderBooks();
}

function toggleView(view) {
    currentView = view;
    document.getElementById('grid-view').classList.toggle('active', view === 'grid');
    document.getElementById('list-view').classList.toggle('active', view === 'list');
    renderBooks();
}

function resetFilters() {
    // Clear all form inputs
    document.getElementById('main-search').value = '';
    document.getElementById('sidebar-search').value = '';
    document.getElementById('author-filter').value = '';
    document.getElementById('location-filter').value = '';
    document.getElementById('language-filter').value = '';
    document.getElementById('price-min').value = '';
    document.getElementById('price-max').value = '';
    document.getElementById('price-range').value = '50';
    document.getElementById('distance-range').value = '25';
    
    // Uncheck all checkboxes
    document.querySelectorAll('.genre-filter, .condition-filter, .format-filter').forEach(cb => {
        cb.checked = false;
    });
    
    // Reset sort
    document.getElementById('sort-select').value = 'newest';
    
    // Reset filtered books and re-render
    filteredBooks = [...booksData];
    renderBooks();
}

function updatePriceRange() {
    const range = document.getElementById('price-range');
    const value = range.value;
    // Update price inputs based on range slider if needed
}

function updateDistanceRange() {
    const range = document.getElementById('distance-range');
    const value = range.value;
    document.getElementById('distance-value').textContent = value;
}