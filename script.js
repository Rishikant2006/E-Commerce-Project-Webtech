let cart = [];
let wishlist = [];
let currentFilter = 'all';
let currentSort = 'default';
let currentPage = 1;
const itemsPerPage = 12;
const SHIPPING_COST = 50.00;
const USD_TO_INR = 83;
let isLoggedIn = false;
let currentUser = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    displayProducts(products);
    setupEventListeners();
    updateCart();
    updateWishlist();
});

// Load data from localStorage
function loadFromLocalStorage() {
    const savedCart = localStorage.getItem('cart');
    const savedWishlist = localStorage.getItem('wishlist');
    const savedUser = localStorage.getItem('currentUser');
    if (savedCart) cart = JSON.parse(savedCart);
    if (savedWishlist) wishlist = JSON.parse(savedWishlist);
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isLoggedIn = true;
        updateUserUI();
    }
}

// Save to localStorage
function saveToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('wishlist', JSON.stringify(wishlist));
}

// Display Products with Pagination
function displayProducts(productsToShow) {
    const productGrid = document.getElementById('product-grid');
    productGrid.innerHTML = '';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = productsToShow.slice(startIndex, endIndex);
    
    paginatedProducts.forEach(product => {
        const isInWishlist = wishlist.some(item => item.id === product.id);
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <button class="wishlist-btn ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist(${product.id})">
                <i class="fas fa-heart"></i>
            </button>
            <img src="${product.image}" alt="${product.name}" class="product-image" onclick="openProductDetail(${product.id})">
            <div class="product-info">
                <div class="product-brand">${product.brand}</div>
                <div class="product-name">${product.name}</div>
                <div class="product-price">
                    <span class="current-price">₹${(product.price * USD_TO_INR).toFixed(2)}</span>
                    <span class="original-price">₹${(product.originalPrice * USD_TO_INR).toFixed(2)}</span>
                    <span class="discount">${product.discount}% OFF</span>
                </div>
                <div class="product-rating">
                    <span class="stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))}</span>
                    <span>(${product.rating})</span>
                </div>
                <button class="add-to-cart" onclick="addToCart(${product.id})">Add to Cart</button>
            </div>
        `;
        productGrid.appendChild(productCard);
    });
    
    createPagination(productsToShow.length);
}

// Create Pagination
function createPagination(totalItems) {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    if (currentPage > 1) {
        paginationHTML += `<button onclick="changePage(${currentPage - 1})">Previous</button>`;
    }
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHTML += `<button class="${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += `<span>...</span>`;
        }
    }
    
    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="changePage(${currentPage + 1})">Next</button>`;
    }
    
    pagination.innerHTML = paginationHTML;
}

// Change Page
function changePage(page) {
    currentPage = page;
    const filtered = getFilteredProducts();
    displayProducts(filtered);
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

// Filter Products
function filterProducts(category) {
    currentFilter = category;
    currentPage = 1;
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => btn.classList.remove('active'));
    
    const clickedBtn = Array.from(filterBtns).find(btn => 
        btn.textContent.toLowerCase() === category || 
        (category === 'all' && btn.textContent.toLowerCase() === 'all')
    );
    if (clickedBtn) clickedBtn.classList.add('active');
    
    const filtered = getFilteredProducts();
    displayProducts(filtered);
}

// Sort Products
function sortProducts(sortType) {
    currentSort = sortType;
    currentPage = 1;
    const filtered = getFilteredProducts();
    displayProducts(filtered);
}

// Get Filtered and Sorted Products
function getFilteredProducts() {
    let filtered = currentFilter === 'all' ? [...products] : products.filter(p => p.category === currentFilter);
    
    switch(currentSort) {
        case 'price-low':
            filtered.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            filtered.sort((a, b) => b.price - a.price);
            break;
        case 'rating':
            filtered.sort((a, b) => b.rating - a.rating);
            break;
        case 'discount':
            filtered.sort((a, b) => b.discount - a.discount);
            break;
    }
    
    return filtered;
}

// Add to Cart
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({...product, quantity: 1, selectedSize: product.sizes[0], selectedColor: product.colors[0]});
    }
    
    updateCart();
    saveToLocalStorage();
    showNotification('Added to cart!');
}

// Update Cart
function updateCart() {
    const cartItems = document.getElementById('cart-items');
    const cartCount = document.querySelector('.cart-count');
    const cartSubtotal = document.getElementById('cart-subtotal');
    const cartShipping = document.getElementById('cart-shipping');
    const cartTotal = document.getElementById('cart-total');
    
    cartItems.innerHTML = '';
    let subtotal = 0;
    let itemCount = 0;
    
    cart.forEach(item => {
        subtotal += item.price * item.quantity;
        itemCount += item.quantity;
        
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₹${(item.price * USD_TO_INR).toFixed(2)} x ${item.quantity}</div>
                <div style="font-size: 0.8rem; color: #666;">Size: ${item.selectedSize} | Color: ${item.selectedColor}</div>
            </div>
            <i class="fas fa-trash cart-item-remove" onclick="removeFromCart(${item.id})"></i>
        `;
        cartItems.appendChild(cartItem);
    });
    
    const shipping = cart.length > 0 ? SHIPPING_COST : 0;
    const total = subtotal + shipping;
    
    cartCount.textContent = itemCount;
    cartSubtotal.textContent = `₹${(subtotal * USD_TO_INR).toFixed(2)}`;
    cartShipping.textContent = `₹${shipping.toFixed(2)}`;
    cartTotal.textContent = `₹${((subtotal * USD_TO_INR) + shipping).toFixed(2)}`;
}

// Remove from Cart
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    updateCart();
    saveToLocalStorage();
}

// Toggle Wishlist
function toggleWishlist(productId) {
    const product = products.find(p => p.id === productId);
    const existingIndex = wishlist.findIndex(item => item.id === productId);
    
    if (existingIndex > -1) {
        wishlist.splice(existingIndex, 1);
        showNotification('Removed from wishlist');
    } else {
        wishlist.push(product);
        showNotification('Added to wishlist!');
    }
    
    updateWishlist();
    saveToLocalStorage();
    
    // Update button state
    const filtered = getFilteredProducts();
    displayProducts(filtered);
}

// Update Wishlist
function updateWishlist() {
    const wishlistItems = document.getElementById('wishlist-items');
    const wishlistCount = document.querySelector('.wishlist-count');
    
    wishlistItems.innerHTML = '';
    wishlistCount.textContent = wishlist.length;
    
    wishlist.forEach(item => {
        const wishlistItem = document.createElement('div');
        wishlistItem.className = 'cart-item';
        wishlistItem.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <div class="cart-item-name">${item.name}</div>
                <div class="cart-item-price">₹${(item.price * USD_TO_INR).toFixed(2)}</div>
                <button class="add-to-cart" onclick="addToCart(${item.id})" style="margin-top: 0.5rem; padding: 0.5rem;">Add to Cart</button>
            </div>
            <i class="fas fa-trash cart-item-remove" onclick="toggleWishlist(${item.id})"></i>
        `;
        wishlistItems.appendChild(wishlistItem);
    });
}

// Open Product Detail Modal
function openProductDetail(productId) {
    const product = products.find(p => p.id === productId);
    const modal = document.getElementById('product-modal');
    const content = document.getElementById('product-detail-content');
    
    content.innerHTML = `
        <div class="product-detail-grid">
            <div>
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div>
                <div class="product-brand" style="font-size: 1.2rem;">${product.brand}</div>
                <h2>${product.name}</h2>
                <div class="product-rating" style="margin: 1rem 0;">
                    <span class="stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))}</span>
                    <span>(${product.rating})</span>
                </div>
                <div class="product-price" style="margin: 1rem 0;">
                    <span class="current-price">₹${(product.price * USD_TO_INR).toFixed(2)}</span>
                    <span class="original-price">₹${(product.originalPrice * USD_TO_INR).toFixed(2)}</span>
                    <span class="discount">${product.discount}% OFF</span>
                </div>
                <div class="size-selector">
                    <strong>Select Size:</strong><br>
                    ${product.sizes.map(size => `<button onclick="selectSize(this, '${size}')">${size}</button>`).join('')}
                </div>
                <div class="color-selector">
                    <strong>Select Color:</strong><br>
                    ${product.colors.map(color => `<button onclick="selectColor(this, '${color}')">${color}</button>`).join('')}
                </div>
                <div class="quantity-selector">
                    <strong>Quantity:</strong>
                    <button onclick="changeQuantity(-1)">-</button>
                    <input type="number" id="detail-quantity" value="1" min="1" readonly>
                    <button onclick="changeQuantity(1)">+</button>
                </div>
                <div class="product-actions">
                    <button class="btn-primary" onclick="addToCartFromDetail(${product.id})">Add to Cart</button>
                    <button class="btn-secondary" onclick="toggleWishlist(${product.id}); closeModal('product-modal')">
                        <i class="fas fa-heart"></i> Wishlist
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modal.classList.add('active');
}

let selectedSize = null;
let selectedColor = null;

function selectSize(btn, size) {
    document.querySelectorAll('.size-selector button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedSize = size;
}

function selectColor(btn, color) {
    document.querySelectorAll('.color-selector button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedColor = color;
}

function changeQuantity(change) {
    const input = document.getElementById('detail-quantity');
    let value = parseInt(input.value) + change;
    if (value < 1) value = 1;
    input.value = value;
}

function addToCartFromDetail(productId) {
    const product = products.find(p => p.id === productId);
    const quantity = parseInt(document.getElementById('detail-quantity').value);
    const size = selectedSize || product.sizes[0];
    const color = selectedColor || product.colors[0];
    
    const existingItem = cart.find(item => item.id === productId && item.selectedSize === size && item.selectedColor === color);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({...product, quantity, selectedSize: size, selectedColor: color});
    }
    
    updateCart();
    saveToLocalStorage();
    closeModal('product-modal');
    showNotification(`Added ${quantity} item(s) to cart!`);
}

// Close Modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('cart-icon').addEventListener('click', () => {
        document.getElementById('cart-sidebar').classList.add('active');
    });
    
    document.getElementById('close-cart').addEventListener('click', () => {
        document.getElementById('cart-sidebar').classList.remove('active');
    });
    
    document.getElementById('wishlist-icon').addEventListener('click', () => {
        document.getElementById('wishlist-sidebar').classList.add('active');
    });
    
    document.getElementById('close-wishlist').addEventListener('click', () => {
        document.getElementById('wishlist-sidebar').classList.remove('active');
    });
    
    document.getElementById('user-icon').addEventListener('click', () => {
        if (isLoggedIn) {
            showUserMenu();
        } else {
            document.getElementById('login-modal').classList.add('active');
        }
    });
    
    document.getElementById('checkout-form').addEventListener('submit', handlePayment);
    
    const mobileToggle = document.getElementById('mobile-menu-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            document.getElementById('nav-menu').classList.toggle('active');
        });
    }
    
    const searchBar = document.getElementById('search-bar');
    const searchIcon = document.getElementById('search-icon');
    
    searchIcon.addEventListener('click', performSearch);
    searchBar.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });
}

// Scroll to products section and filter
function scrollToProducts(category) {
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    setTimeout(() => filterProducts(category), 500);
}

// Search products
function performSearch() {
    const searchTerm = document.getElementById('search-bar').value.toLowerCase();
    if (!searchTerm) {
        currentFilter = 'all';
        displayProducts(products);
        return;
    }
    const filtered = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm) || 
        p.brand.toLowerCase().includes(searchTerm) ||
        p.category.toLowerCase().includes(searchTerm)
    );
    currentPage = 1;
    displayProducts(filtered);
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
}

// Toggle Payment Fields
function togglePaymentFields() {
    const paymentMethod = document.getElementById('payment-method').value;
    const cardFields = document.getElementById('card-fields');
    
    if (paymentMethod === 'card') {
        cardFields.style.display = 'block';
        document.getElementById('card-number').required = true;
        document.getElementById('card-expiry').required = true;
        document.getElementById('card-cvv').required = true;
    } else {
        cardFields.style.display = 'none';
        document.getElementById('card-number').required = false;
        document.getElementById('card-expiry').required = false;
        document.getElementById('card-cvv').required = false;
    }
}

// Open Checkout
function openCheckout() {
    if (cart.length === 0) {
        alert('Your cart is empty!');
        return;
    }
    
    document.getElementById('checkout-modal').classList.add('active');
    goToStep(1);
}

// Multi-step Checkout Navigation
let currentStep = 1;
let selectedPaymentType = 'card';

function goToStep(step) {
    // Hide all steps
    document.querySelectorAll('.checkout-step-content').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.step').forEach(el => el.classList.remove('active'));
    
    // Show current step
    currentStep = step;
    document.getElementById(`step-${step}`).classList.add('active');
    
    if (step === 1) {
        document.getElementById('shipping-step').style.display = 'block';
    } else if (step === 2) {
        if (!validateShipping()) return;
        document.getElementById('payment-step').style.display = 'block';
    } else if (step === 3) {
        if (!validatePayment()) return;
        document.getElementById('review-step').style.display = 'block';
        populateReview();
    }
}

function validateShipping() {
    const name = document.getElementById('checkout-name').value;
    const phone = document.getElementById('checkout-phone').value;
    const email = document.getElementById('checkout-email').value;
    const address = document.getElementById('checkout-address').value;
    const city = document.getElementById('checkout-city').value;
    const state = document.getElementById('checkout-state').value;
    const zip = document.getElementById('checkout-zip').value;
    
    if (!name || !phone || !email || !address || !city || !state || !zip) {
        alert('Please fill all shipping details');
        return false;
    }
    return true;
}

function validatePayment() {
    const paymentMethod = document.querySelector('input[name="payment"]:checked');
    if (!paymentMethod) {
        alert('Please select a payment method');
        return false;
    }
    
    if (selectedPaymentType === 'card') {
        const cardNumber = document.getElementById('card-number').value;
        const cardName = document.getElementById('card-name').value;
        const cardExpiry = document.getElementById('card-expiry').value;
        const cardCvv = document.getElementById('card-cvv').value;
        
        if (!cardNumber || !cardName || !cardExpiry || !cardCvv) {
            alert('Please fill all card details');
            return false;
        }
    } else if (selectedPaymentType === 'upi') {
        const upiId = document.getElementById('upi-id').value;
        if (!upiId) {
            alert('Please enter UPI ID');
            return false;
        }
    } else if (selectedPaymentType === 'netbanking') {
        const bank = document.getElementById('bank-select').value;
        if (!bank) {
            alert('Please select a bank');
            return false;
        }
    }
    
    return true;
}

function selectPaymentMethod(method) {
    selectedPaymentType = method;
    
    // Update radio button
    document.querySelectorAll('.payment-option').forEach(el => el.classList.remove('selected'));
    document.getElementById(`payment-${method}`).checked = true;
    document.getElementById(`payment-${method}`).parentElement.classList.add('selected');
    
    // Hide all payment detail forms
    document.querySelectorAll('.payment-details-form').forEach(el => el.style.display = 'none');
    
    // Show relevant form
    if (method === 'card') {
        document.getElementById('card-details').style.display = 'block';
    } else if (method === 'upi') {
        document.getElementById('upi-details').style.display = 'block';
    } else if (method === 'netbanking') {
        document.getElementById('netbanking-details').style.display = 'block';
    }
}

function populateReview() {
    // Shipping Address
    const name = document.getElementById('checkout-name').value;
    const phone = document.getElementById('checkout-phone').value;
    const email = document.getElementById('checkout-email').value;
    const address = document.getElementById('checkout-address').value;
    const city = document.getElementById('checkout-city').value;
    const state = document.getElementById('checkout-state').value;
    const zip = document.getElementById('checkout-zip').value;
    
    document.getElementById('review-address').innerHTML = `
        <p><strong>${name}</strong></p>
        <p>${phone} | ${email}</p>
        <p>${address}</p>
        <p>${city}, ${state} - ${zip}</p>
    `;
    
    // Payment Method
    const paymentLabels = {
        'card': 'Credit/Debit Card',
        'upi': 'UPI Payment',
        'netbanking': 'Net Banking',
        'wallet': 'Wallet',
        'cod': 'Cash on Delivery'
    };
    document.getElementById('review-payment').innerHTML = `<p><strong>${paymentLabels[selectedPaymentType]}</strong></p>`;
    
    // Order Items
    let itemsHTML = '';
    cart.forEach(item => {
        itemsHTML += `
            <div class="review-item">
                <span>${item.name} (${item.selectedSize}, ${item.selectedColor}) x ${item.quantity}</span>
                <span>₹${(item.price * USD_TO_INR * item.quantity).toFixed(2)}</span>
            </div>
        `;
    });
    document.getElementById('review-items').innerHTML = itemsHTML;
    
    // Price Summary
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = (subtotal * USD_TO_INR) + SHIPPING_COST;
    
    document.getElementById('review-subtotal').textContent = `₹${(subtotal * USD_TO_INR).toFixed(2)}`;
    document.getElementById('review-shipping').textContent = `₹${SHIPPING_COST.toFixed(2)}`;
    document.getElementById('review-total').textContent = `₹${total.toFixed(2)}`;
}

// Handle Payment
function handlePayment(e) {
    e.preventDefault();
    
    const modal = document.getElementById('checkout-modal');
    const orderNumber = 'CF' + Date.now().toString().slice(-8);
    const total = (cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) * USD_TO_INR) + SHIPPING_COST;
    
    const paymentLabels = {
        'card': 'Card Payment',
        'upi': 'UPI',
        'netbanking': 'Net Banking',
        'wallet': 'Wallet',
        'cod': 'Cash on Delivery'
    };
    
    modal.querySelector('.modal-content').innerHTML = `
        <div style="text-align: center; padding: 3rem 2rem;">
            <div style="background: #4CAF50; width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 1.5rem; display: flex; align-items: center; justify-content: center;">
                <i class="fas fa-check" style="font-size: 3rem; color: white;"></i>
            </div>
            <h2 style="margin: 1rem 0; color: #4CAF50;">Order Placed Successfully!</h2>
            <p style="font-size: 1.1rem; margin: 1rem 0;">Order ID: <strong>${orderNumber}</strong></p>
            <div style="background: #f9f9f9; padding: 1.5rem; border-radius: 10px; margin: 1.5rem 0; text-align: left;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span>Payment Method:</span>
                    <strong>${paymentLabels[selectedPaymentType]}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                    <span>Total Amount:</span>
                    <strong style="color: var(--primary); font-size: 1.2rem;">₹${total.toFixed(2)}</strong>
                </div>
            </div>
            <p style="color: #666; margin: 1rem 0;">Thank you for shopping with ClothFit!</p>
            <p style="color: #666; font-size: 0.9rem;">Order confirmation has been sent to your email.</p>
            <p style="color: #666; font-size: 0.9rem; margin-top: 1rem;">Expected delivery: 3-5 business days</p>
            <button class="cta-btn" onclick="closeCheckoutAndClearCart()" style="margin-top: 2rem; padding: 1rem 3rem;">
                <i class="fas fa-shopping-bag"></i> Continue Shopping
            </button>
        </div>
    `;
}

// Close Checkout and Clear Cart
function closeCheckoutAndClearCart() {
    document.getElementById('checkout-modal').classList.remove('active');
    cart = [];
    updateCart();
    saveToLocalStorage();
    document.getElementById('cart-sidebar').classList.remove('active');
    location.reload();
}

// Show Notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 4000;
        animation: fadeInUp 0.3s;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 2000);
}


// Login Functions
let tempRegisterData = null;

function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.auth-tab').forEach(t => t.style.display = 'none');
    
    if (tab === 'login') {
        document.querySelector('.tab-btn:first-child').classList.add('active');
        document.getElementById('login-tab').style.display = 'block';
    } else {
        document.querySelector('.tab-btn:last-child').classList.add('active');
        document.getElementById('register-tab').style.display = 'block';
    }
}

// Login Functions
function sendLoginOTP() {
    const phone = document.getElementById('login-phone').value;
    
    if (!phone || phone.length !== 10) {
        alert('Please enter a valid 10-digit mobile number');
        return;
    }
    
    // Check if user exists
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userExists = users.find(u => u.phone === phone);
    
    if (!userExists) {
        alert('Account not found. Please register first.');
        switchTab('register');
        document.getElementById('register-phone').value = phone;
        return;
    }
    
    document.getElementById('login-phone-step').style.display = 'none';
    document.getElementById('login-otp-step').style.display = 'block';
    document.getElementById('login-display-phone').textContent = '+91 ' + phone;
    
    setTimeout(() => {
        showNotification('OTP sent successfully! Demo OTP: 123456');
    }, 500);
}

function changeLoginNumber() {
    document.getElementById('login-otp-step').style.display = 'none';
    document.getElementById('login-phone-step').style.display = 'block';
    document.querySelectorAll('#login-otp-step .otp-input').forEach(input => input.value = '');
}

function resendLoginOTP() {
    showNotification('OTP resent successfully!');
}

function verifyLoginOTP() {
    const otp = Array.from({length: 6}, (_, i) => document.getElementById(`login-otp${i+1}`).value).join('');
    
    if (otp.length !== 6) {
        alert('Please enter complete OTP');
        return;
    }
    
    if (otp === '123456') {
        const phone = document.getElementById('login-phone').value;
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const user = users.find(u => u.phone === phone);
        
        currentUser = {
            phone: '+91 ' + phone,
            name: user.name,
            email: user.email,
            loginTime: new Date().toISOString()
        };
        isLoggedIn = true;
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUserUI();
        closeModal('login-modal');
        showNotification(`Welcome back, ${user.name}!`);
        
        resetLoginForm();
    } else {
        alert('Invalid OTP. Please try again. (Demo OTP: 123456)');
    }
}

function resetLoginForm() {
    document.getElementById('login-otp-step').style.display = 'none';
    document.getElementById('login-phone-step').style.display = 'block';
    document.querySelectorAll('#login-otp-step .otp-input').forEach(input => input.value = '');
    document.getElementById('login-phone').value = '';
}

// Register Functions
function registerUser() {
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    if (!name || !email || !phone || !password || !confirmPassword) {
        alert('Please fill all fields');
        return;
    }
    
    if (phone.length !== 10) {
        alert('Please enter a valid 10-digit mobile number');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }
    
    // Check if user already exists
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userExists = users.find(u => u.phone === phone || u.email === email);
    
    if (userExists) {
        alert('Account already exists with this phone or email. Please login.');
        switchTab('login');
        return;
    }
    
    // Store temp data and send OTP
    tempRegisterData = { name, email, phone, password };
    
    document.getElementById('register-form-step').style.display = 'none';
    document.getElementById('register-otp-step').style.display = 'block';
    document.getElementById('register-display-phone').textContent = '+91 ' + phone;
    
    setTimeout(() => {
        showNotification('Verification OTP sent! Demo OTP: 123456');
    }, 500);
}

function resendRegisterOTP() {
    showNotification('OTP resent successfully!');
}

function verifyRegisterOTP() {
    const otp = Array.from({length: 6}, (_, i) => document.getElementById(`reg-otp${i+1}`).value).join('');
    
    if (otp.length !== 6) {
        alert('Please enter complete OTP');
        return;
    }
    
    if (otp === '123456') {
        // Save user to localStorage
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        users.push(tempRegisterData);
        localStorage.setItem('users', JSON.stringify(users));
        
        // Auto login
        currentUser = {
            phone: '+91 ' + tempRegisterData.phone,
            name: tempRegisterData.name,
            email: tempRegisterData.email,
            loginTime: new Date().toISOString()
        };
        isLoggedIn = true;
        
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        updateUserUI();
        closeModal('login-modal');
        showNotification(`Welcome to ClothFit, ${tempRegisterData.name}!`);
        
        resetRegisterForm();
        tempRegisterData = null;
    } else {
        alert('Invalid OTP. Please try again. (Demo OTP: 123456)');
    }
}

function resetRegisterForm() {
    document.getElementById('register-otp-step').style.display = 'none';
    document.getElementById('register-form-step').style.display = 'block';
    document.querySelectorAll('#register-otp-step .otp-input').forEach(input => input.value = '');
    document.getElementById('register-name').value = '';
    document.getElementById('register-email').value = '';
    document.getElementById('register-phone').value = '';
    document.getElementById('register-password').value = '';
    document.getElementById('register-confirm-password').value = '';
}

function moveToNext(current, nextId) {
    if (current.value.length === 1 && nextId) {
        document.getElementById(nextId).focus();
    }
}

function updateUserUI() {
    const userIcon = document.getElementById('user-icon');
    if (isLoggedIn && currentUser) {
        userIcon.innerHTML = '<i class="fas fa-user-circle"></i>';
        userIcon.style.color = 'var(--primary)';
    } else {
        userIcon.innerHTML = '<i class="fas fa-user"></i>';
        userIcon.style.color = '';
    }
}

function showUserMenu() {
    const options = `Logged in as: ${currentUser.name}\nEmail: ${currentUser.email}\nPhone: ${currentUser.phone}\n\nClick OK to Logout`;
    const menu = confirm(options);
    if (menu) {
        logout();
    }
}

function logout() {
    isLoggedIn = false;
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUserUI();
    showNotification('Logged out successfully');
}
