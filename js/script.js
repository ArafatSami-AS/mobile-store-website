document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'mobiles.json';
    let allProducts = [];

    // --- UTILITY FUNCTIONS ---
    const getCart = () => JSON.parse(localStorage.getItem('cart')) || [];
    const saveCart = (cart) => localStorage.setItem('cart', JSON.stringify(cart));
    const getWishlist = () => JSON.parse(localStorage.getItem('wishlist')) || [];
    const saveWishlist = (wishlist) => localStorage.setItem('wishlist', JSON.stringify(wishlist));

    const fetchProducts = async () => {
        try {
            if (allProducts.length > 0) return allProducts;
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            allProducts = data.mobiles;
            return allProducts;
        } catch (error) {
            console.error('Failed to fetch products:', error);
            return [];
        }
    };

    // --- UNIVERSAL FUNCTIONS (HEADER, SEARCH) ---
    const updateCounters = () => {
        const cart = getCart();
        const wishlist = getWishlist();
        document.getElementById('cart-count').textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('wishlist-count').textContent = wishlist.length;
    };

    const handleSearch = () => {
        const searchForm = document.getElementById('search-form');
        const searchInput = document.getElementById('search-input');
        if (searchForm) {
            searchForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `products.html?search=${encodeURIComponent(query)}`;
                }
            });
        }
    };

    // --- PRODUCT CARD RENDERING ---
    const createProductCard = (product, containerClass = 'col') => {
        const wishlist = getWishlist();
        const isInWishlist = wishlist.includes(product.id.toString());
        return `
            <div class="${containerClass}">
                <div class="card product-card">
                    <i class="fas fa-heart wishlist-icon ${isInWishlist ? 'active' : ''}" data-product-id="${product.id}"></i>
                    <a href="product-details.html?id=${product.id}">
                        <img src="${product.image}" class="card-img-top" alt="${product.name}">
                    </a>
                    <div class="card-body">
                        <div>
                            <h5 class="card-title product-card-title">${product.name}</h5>
                            <p class="card-text product-price">₹${product.price.toLocaleString('en-IN')}</p>
                        </div>
                        <button class="btn btn-dark w-100 mt-2 add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
                    </div>
                </div>
            </div>`;
    };

    // --- PAGE-SPECIFIC LOGIC ---

    // HOMEPAGE LOGIC
    const initHomePage = async () => {
        const products = await fetchProducts();
        const newArrivalsContainer = document.getElementById('new-arrivals-container');
        if (newArrivalsContainer) {
            const newArrivals = products.slice(0, 8); // Show first 8 as new arrivals
            newArrivalsContainer.innerHTML = newArrivals.map(p => createProductCard(p)).join('');
        }
    };

    // PRODUCTS PAGE LOGIC
    const initProductsPage = async () => {
        const products = await fetchProducts();
        const productListContainer = document.getElementById('product-list');
        const productCountEl = document.getElementById('product-count');
        const urlParams = new URLSearchParams(window.location.search);
        
        let filteredProducts = [...products];

        // Apply filters from URL
        if (urlParams.get('brand')) {
            filteredProducts = products.filter(p => p.brand.toLowerCase() === urlParams.get('brand').toLowerCase());
        }
        if (urlParams.get('search')) {
            const query = urlParams.get('search').toLowerCase();
            filteredProducts = products.filter(p => 
                p.name.toLowerCase().includes(query) || 
                p.brand.toLowerCase().includes(query)
            );
        }
        
        populateFilters(products);
        displayProducts(filteredProducts);
        
        document.getElementById('filter-form').addEventListener('submit', e => {
            e.preventDefault();
            applyAllFilters(products);
        });
        
        document.getElementById('sort-by').addEventListener('change', () => applyAllFilters(products));
        document.getElementById('price-range').addEventListener('input', (e) => {
            document.getElementById('price-range-value').textContent = `₹${parseInt(e.target.value).toLocaleString('en-IN')}`;
        });
    };
    
    const populateFilters = (products) => {
        const brands = [...new Set(products.map(p => p.brand))];
        const ramOptions = [...new Set(products.map(p => p.ram).filter(Boolean))].sort();
        const romOptions = [...new Set(products.map(p => p.rom).filter(Boolean))].sort();

        document.getElementById('brand-filter-options').innerHTML = brands.map(brand => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${brand}" id="brand-${brand}">
                <label class="form-check-label" for="brand-${brand}">${brand}</label>
            </div>`).join('');

        document.getElementById('ram-filter-options').innerHTML = ramOptions.map(ram => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${ram}" id="ram-${ram}">
                <label class="form-check-label" for="ram-${ram}">${ram}</label>
            </div>`).join('');
            
        document.getElementById('rom-filter-options').innerHTML = romOptions.map(rom => `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" value="${rom}" id="rom-${rom}">
                <label class="form-check-label" for="rom-${rom}">${rom}</label>
            </div>`).join('');
    };

    const applyAllFilters = (products) => {
        const selectedBrands = Array.from(document.querySelectorAll('#brand-filter-options input:checked')).map(el => el.value);
        const selectedRams = Array.from(document.querySelectorAll('#ram-filter-options input:checked')).map(el => el.value);
        const selectedRoms = Array.from(document.querySelectorAll('#rom-filter-options input:checked')).map(el => el.value);
        const maxPrice = parseInt(document.getElementById('price-range').value);

        let filtered = products.filter(p => {
            const brandMatch = selectedBrands.length === 0 || selectedBrands.includes(p.brand);
            const ramMatch = selectedRams.length === 0 || selectedRams.includes(p.ram);
            const romMatch = selectedRoms.length === 0 || selectedRoms.includes(p.rom);
            const priceMatch = p.price <= maxPrice;
            return brandMatch && ramMatch && romMatch && priceMatch;
        });

        const sortBy = document.getElementById('sort-by').value;
        if (sortBy === 'price-asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-desc') {
            filtered.sort((a, b) => b.price - a.price);
        }

        displayProducts(filtered);
    };
    
    const displayProducts = (productsToDisplay) => {
        const productListContainer = document.getElementById('product-list');
        const productCountEl = document.getElementById('product-count');
        if (productsToDisplay.length > 0) {
            productListContainer.innerHTML = productsToDisplay.map(p => createProductCard(p, 'col')).join('');
        } else {
            productListContainer.innerHTML = '<p class="text-center w-100">No products found matching your criteria.</p>';
        }
        productCountEl.textContent = `Showing ${productsToDisplay.length} products`;
    };

    // PRODUCT DETAILS PAGE LOGIC
    // js/script.js

// --- PRODUCT DETAILS PAGE LOGIC (REPLACE THE ENTIRE OLD FUNCTION WITH THIS) ---
const initProductDetailsPage = async () => {
    const products = await fetchProducts();
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    const product = products.find(p => p.id.toString() === productId);

    if (product) {
        // --- NEW: Find all variants with the same name ---
        const variants = products
            .filter(p => p.name === product.name)
            .sort((a, b) => a.price - b.price); // Sort variants by price

        const container = document.getElementById('product-detail-container');
        const breadcrumbContainer = document.getElementById('breadcrumb-container');
        
        document.title = `${product.name} - PAASD Mobiles`;

        breadcrumbContainer.innerHTML = `
            <ol class="breadcrumb">
                <li class="breadcrumb-item"><a href="index.html">Home</a></li>
                <li class="breadcrumb-item"><a href="products.html?brand=${product.brand}">${product.brand}</a></li>
                <li class="breadcrumb-item active" aria-current="page">${product.name}</li>
            </ol>`;
            
        // --- MODIFIED: HTML structure with IDs for dynamic updates and variant buttons ---
        container.querySelector('.row').innerHTML = `
            <div class="col-md-5">
                <img src="${product.image}" class="img-fluid rounded" alt="${product.name}">
            </div>
            <div class="col-md-7">
                <h2>${product.name}</h2>
                <h3 class="text-primary my-3" id="product-price">₹${product.price.toLocaleString('en-IN')}</h3>
                
                <div class="mb-3">
                    <strong>Storage / RAM:</strong>
                    <div id="variant-buttons" class="d-flex flex-wrap gap-2 mt-2">
                        ${variants.map(v => `
                            <button class="btn variant-btn ${v.id === product.id ? 'active' : ''}" 
                                data-product-id="${v.id}"
                                data-price="${v.price}"
                                data-ram="${v.ram}"
                                data-rom="${v.rom}">
                                ${v.rom} / ${v.ram}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <p>A flagship device from ${product.brand} offering top-of-the-line performance and a premium experience.</p>
                
                <div class="row text-center my-4">
                    <div class="col-4 spec-box">
                        <i class="fas fa-camera spec-icon"></i>
                        <div id="product-camera">${product.camera || 'N/A'}</div>
                        <small class="text-muted">Camera</small>
                    </div>
                    <div class="col-4 spec-box">
                        <i class="fas fa-microchip spec-icon"></i>
                        <div id="product-processor">${product.processor || 'N/A'}</div>
                        <small class="text-muted">Processor</small>
                    </div>
                    <div class="col-4 spec-box">
                        <i class="fas fa-memory spec-icon"></i>
                        <div id="product-ram-rom">${product.ram || 'N/A'} / ${product.rom || 'N/A'}</div>
                        <small class="text-muted">Memory</small>
                    </div>
                </div>
                
                <div class="d-flex gap-2">
                    <button id="add-to-cart-main" class="btn btn-dark btn-lg flex-grow-1 add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
                    <button id="wishlist-btn-main" class="btn btn-outline-danger btn-lg wishlist-icon-details" data-product-id="${product.id}"><i class="fas fa-heart"></i></button>
                </div>
            </div>`;
            
        // --- NEW: Event listener for variant buttons ---
        const variantButtonsContainer = document.getElementById('variant-buttons');
        variantButtonsContainer.addEventListener('click', (e) => {
            const button = e.target.closest('.variant-btn');
            if (!button) return;

            // Remove active class from all buttons
            variantButtonsContainer.querySelectorAll('.variant-btn').forEach(btn => btn.classList.remove('active'));
            // Add active class to clicked button
            button.classList.add('active');

            // Update page content with data from the clicked variant button
            const newPrice = parseFloat(button.dataset.price);
            document.getElementById('product-price').textContent = `₹${newPrice.toLocaleString('en-IN')}`;
            document.getElementById('product-ram-rom').textContent = `${button.dataset.ram} / ${button.dataset.rom}`;
            
            // Update the main action buttons to target the new variant ID
            const newProductId = button.dataset.productId;
            document.getElementById('add-to-cart-main').dataset.productId = newProductId;
            document.getElementById('wishlist-btn-main').dataset.productId = newProductId;
        });
            
        // Related Products logic (remains the same)
        const relatedProductsContainer = document.getElementById('related-products-container');
        const relatedProducts = products.filter(p => p.brand === product.brand && p.id !== product.id).slice(0, 4);
        relatedProductsContainer.innerHTML = relatedProducts.map(p => createProductCard(p)).join('');
    }
};
    // CART PAGE LOGIC
    const initCartPage = async () => {
        const products = await fetchProducts();
        const cart = getCart();
        const container = document.getElementById('cart-items-container');
        
        if (cart.length === 0) {
            container.innerHTML = `<div class="text-center p-5"><h3>Your cart is empty.</h3><a href="index.html" class="btn btn-primary mt-3">Continue Shopping</a></div>`;
            updateCartSummary(0); // Ensure summary is zero
            return;
        }

        container.innerHTML = ''; // Clear default message
        let subtotal = 0;
        
        cart.forEach(item => {
            const product = products.find(p => p.id === item.id);
            if(product) {
                subtotal += product.price * item.quantity;
                container.innerHTML += `
                    <div class="card mb-3 cart-item-card" data-product-id="${product.id}">
                        <div class="row g-0">
                            <div class="col-md-2 d-flex align-items-center justify-content-center">
                                <img src="${product.image}" class="img-fluid rounded-start cart-item-img" alt="${product.name}">
                            </div>
                            <div class="col-md-5">
                                <div class="card-body">
                                    <h5 class="card-title">${product.name}</h5>
                                    <p class="card-text"><small class="text-muted">#${product.id}</small></p>
                                </div>
                            </div>
                            <div class="col-md-3 d-flex align-items-center justify-content-center">
                                <div class="quantity-selector">
                                    <button class="btn btn-sm btn-outline-secondary quantity-change" data-change="-1">-</button>
                                    <input type="text" class="form-control form-control-sm text-center quantity-input" value="${item.quantity}" readonly>
                                    <button class="btn btn-sm btn-outline-secondary quantity-change" data-change="1">+</button>
                                </div>
                            </div>
                            <div class="col-md-2 d-flex align-items-center justify-content-around">
                                <p class="mb-0 fw-bold">₹${(product.price * item.quantity).toLocaleString('en-IN')}</p>
                                <i class="fas fa-times-circle remove-btn"></i>
                            </div>
                        </div>
                    </div>`;
            }
        });
        updateCartSummary(subtotal);
    };

    const updateCartSummary = (subtotal) => {
        const tax = subtotal * 0.18; // Example 18% tax
        const shipping = subtotal > 0 ? 50 : 0; // Example shipping fee
        const total = subtotal + tax + shipping;

        document.getElementById('summary-subtotal').textContent = `₹${subtotal.toLocaleString('en-IN')}`;
        document.getElementById('summary-tax').textContent = `₹${tax.toLocaleString('en-IN')}`;
        document.getElementById('summary-shipping').textContent = `₹${shipping.toLocaleString('en-IN')}`;
        document.getElementById('summary-total').textContent = `₹${total.toLocaleString('en-IN')}`;
    };
    
    // WISHLIST PAGE LOGIC
    const initWishlistPage = async () => {
        const products = await fetchProducts();
        const wishlist = getWishlist();
        const container = document.getElementById('wishlist-container');
        
        if (wishlist.length === 0) {
             container.innerHTML = `<div class="col-12 text-center p-5"><h3>Your wishlist is empty.</h3><p>Add items you love to your wishlist.</p><a href="index.html" class="btn btn-primary mt-3">Discover Products</a></div>`;
            return;
        }

        container.innerHTML = ''; // Clear default message
        const wishlistedProducts = products.filter(p => wishlist.includes(p.id.toString()));
        container.innerHTML = wishlistedProducts.map(p => createProductCard(p)).join('');
    };

    // LOGIN & CHECKOUT LOGIC
    const initLoginPage = () => {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                // In a real app, you'd verify credentials here
                localStorage.setItem('isLoggedIn', 'true');
                alert('Login successful! Redirecting to homepage.');
                window.location.href = 'index.html';
            });
        }
    };
    
    const handleCheckout = () => {
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
                if (isLoggedIn) {
                    alert('Proceeding to checkout!');
                    // Clear cart after checkout
                    saveCart([]);
                    window.location.href = 'index.html';
                } else {
                    alert('You must be logged in to checkout.');
                    window.location.href = 'login.html';
                }
            });
        }
    };

    // --- EVENT LISTENERS (GLOBAL) ---
    document.body.addEventListener('click', async (e) => {
        // Add to Cart
        if (e.target.classList.contains('add-to-cart-btn')) {
            const productId = e.target.dataset.productId;
            const products = await fetchProducts();
            const product = products.find(p => p.id.toString() === productId);
            let cart = getCart();
            const existingItem = cart.find(item => item.id === product.id);
            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({ id: product.id, quantity: 1 });
            }
            saveCart(cart);
            updateCounters();
            alert(`${product.name} added to cart!`);
        }

        // Wishlist Toggle
        if (e.target.classList.contains('wishlist-icon') || e.target.classList.contains('wishlist-icon-details')) {
             e.preventDefault();
            const productId = e.target.dataset.productId;
            let wishlist = getWishlist();
            if (wishlist.includes(productId)) {
                wishlist = wishlist.filter(id => id !== productId);
                e.target.classList.remove('active');
            } else {
                wishlist.push(productId);
                e.target.classList.add('active');
            }
            saveWishlist(wishlist);
            updateCounters();
        }
        
        // Cart Page: Quantity Change
        if (e.target.classList.contains('quantity-change')) {
            const card = e.target.closest('.cart-item-card');
            const productId = parseInt(card.dataset.productId, 10);
            const change = parseInt(e.target.dataset.change, 10);
            let cart = getCart();
            const item = cart.find(i => i.id === productId);
            if(item) {
                item.quantity += change;
                if (item.quantity <= 0) {
                    cart = cart.filter(i => i.id !== productId);
                }
                saveCart(cart);
                initCartPage(); // Re-render the cart
            }
        }

        // Cart Page: Remove Item
        if (e.target.classList.contains('remove-btn')) {
            const card = e.target.closest('.cart-item-card');
            const productId = parseInt(card.dataset.productId, 10);
            let cart = getCart();
            cart = cart.filter(i => i.id !== productId);
            saveCart(cart);
            initCartPage(); // Re-render the cart
        }
    });


    // --- ROUTER & INITIALIZATION ---
    const page = window.location.pathname.split("/").pop();
    updateCounters();
    handleSearch();

    if (page === 'index.html' || page === '') {
        initHomePage();
    } else if (page === 'products.html') {
        initProductsPage();
    } else if (page === 'product-details.html') {
        initProductDetailsPage();
    } else if (page === 'cart.html') {
        initCartPage();
        handleCheckout();
    } else if (page === 'wishlist.html') {
        initWishlistPage();
    } else if (page === 'login.html') {
        initLoginPage();
    }
});