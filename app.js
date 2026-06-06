// ==========================================
// js/app.js
// ==========================================

// 1. Firebase Configuration (Commented out temporarily)
/* import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
const firebaseConfig = { ... };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
*/

// 2. Global State
let cart = JSON.parse(localStorage.getItem('brand_cart')) || [];
let productsDataset = []; 

function updateCartCount() {
    const cartIcon = document.getElementById('cart-icon');
    if (cartIcon) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartIcon.innerText = `Cart (${totalItems})`;
    }
}

// ==========================================
// MASTER INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    updateCartCount();
    
    // 1. Wait for the data to load first
    await loadInventory(); 
    
    // 2. Only turn on Search and Cart AFTER data is ready
    initSearch();
    initCartUI();
});

// ==========================================
// CORE LOGIC
// ==========================================
async function loadInventory() {
    try {
        const response = await fetch('./data/products.json');
        productsDataset = await response.json();
        console.log("Inventory loaded successfully!");
        routePage(); 
    } catch (error) {
        console.error("Failed to load inventory. Are you running a local server?", error);
    }
}

function routePage() {
    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);

    if (path.includes("shop.html")) {
        const gender = urlParams.get('gender') || 'women';
        renderProductGrid(gender);
    } else if (path.includes("product.html")) {
        const productId = urlParams.get('id');
        if (productId) {
            renderProductDetails(productId);
        } else {
            window.location.href = 'shop.html';
        }
    }
}

// ==========================================
// PAGE RENDERING
// ==========================================
function renderProductGrid(genderFilter) {
    const gridContainer = document.getElementById("shop-grid");
    const pageTitle = document.getElementById("shop-title");
    
    if (!gridContainer) return;

    if (pageTitle) {
        pageTitle.innerText = genderFilter === 'men' ? "Men's Collection" : "Women's Kurtas";
    }

    const filteredProducts = productsDataset.filter(product => product.gender === genderFilter);
    gridContainer.innerHTML = ""; 
    
    filteredProducts.forEach(product => {
        const productHTML = `
            <a href="product.html?id=${product.id}" style="text-decoration: none; color: inherit;">
                <div class="product-card">
                    <img src="${product.img}" alt="${product.name}" onerror="this.src='https://placehold.co/600x800?text=${encodeURIComponent(product.name)}'">
                    <h3>${product.name}</h3>
                    <p>₹${product.price.toLocaleString('en-IN')}</p>
                </div>
            </a>
        `;
        gridContainer.insertAdjacentHTML('beforeend', productHTML);
    });
}

function renderProductDetails(productId) {
    const product = productsDataset.find(p => p.id === productId);
    
    if (!product) {
        console.error("Product not found!");
        window.location.href = 'shop.html';
        return;
    }

    document.title = `${product.name} | BRAND`;
    
    const titleEl = document.querySelector(".pdp-details h1");
    const priceEl = document.querySelector(".pdp-price");
    const imageContainer = document.querySelector(".pdp-images");

    if (titleEl) titleEl.innerText = product.name;
    if (priceEl) priceEl.innerText = `₹${product.price.toLocaleString('en-IN')}`;
    
    if (imageContainer) {
        imageContainer.innerHTML = `
            <img src="${product.img}" alt="${product.name} Front" onerror="this.src='https://placehold.co/600x800?text=Front+View'">
            <img src="${product.img}" alt="${product.name} Detail" style="filter: brightness(0.95);" onerror="this.src='https://placehold.co/600x800?text=Detail+View'">
        `;
    }
    
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    if (addToCartBtn) {
        const newBtn = addToCartBtn.cloneNode(true);
        addToCartBtn.parentNode.replaceChild(newBtn, addToCartBtn);
        
        newBtn.addEventListener('click', () => {
            const item = { 
                id: product.id, 
                name: product.name,
                price: product.price,
                img: product.img,
                quantity: 1, 
                size: 'M' 
            }; 
            
            const existingItem = cart.find(cartItem => cartItem.id === item.id && cartItem.size === item.size);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push(item);
            }
            
            localStorage.setItem('brand_cart', JSON.stringify(cart));
            updateCartCount();
            
            // Automatically open cart when item is added
            document.getElementById('cart-overlay').classList.add('active');
            document.getElementById('cart-drawer').classList.add('active');
            renderCartDrawer();
        });
    }
}

// ==========================================
// ADVANCED SEARCH LOGIC
// ==========================================
// ==========================================
// ADVANCED SEARCH & CUSTOM UI LOGIC
// ==========================================
// ==========================================
// ADVANCED SEARCH LOGIC
// ==========================================
function initSearch() {
    const searchIcon = document.getElementById('search-icon');
    const searchOverlay = document.getElementById('search-overlay');
    const closeSearch = document.getElementById('close-search');
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    // Sidebar & Toggles
    const toggleFiltersBtn = document.getElementById('toggle-filters-btn');
    const searchSidebar = document.getElementById('search-sidebar');

    if (!searchIcon || !searchOverlay) return;

    // Open/Close
    searchIcon.addEventListener('click', (e) => {
        e.preventDefault();
        searchOverlay.classList.add('active');
        searchInput.focus();
        runSearchEngine(); 
    });

    closeSearch.addEventListener('click', () => {
        searchOverlay.classList.remove('active');
    });

    // Elegant Sidebar Toggle
    toggleFiltersBtn.addEventListener('click', () => {
        searchSidebar.classList.toggle('open');
        toggleFiltersBtn.textContent = searchSidebar.classList.contains('open') ? 'HIDE' : 'FILTERS';
    });

    // Custom Dropdown Menus
    document.querySelectorAll('.custom-select').forEach(select => {
        const trigger = select.querySelector('.custom-select-trigger');
        const options = select.querySelectorAll('.custom-option');

        trigger.addEventListener('click', () => {
            document.querySelectorAll('.custom-select').forEach(s => {
                if (s !== select) s.classList.remove('open');
            });
            select.classList.toggle('open');
        });

        options.forEach(opt => {
            opt.addEventListener('click', () => {
                trigger.innerText = opt.innerText; 
                select.dataset.value = opt.dataset.value; 
                
                // Manage selected highlighting
                options.forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');

                select.classList.remove('open');
                runSearchEngine(); 
            });
        });
    });

    // Dual Range Slider Logic
    const priceMin = document.getElementById('price-min');
    const priceMax = document.getElementById('price-max');
    const trackFill = document.getElementById('slider-track-fill');
    const displayMin = document.getElementById('price-min-display');
    const displayMax = document.getElementById('price-max-display');
    const sliderMaxLimit = 10000; 

    function updateDualSlider() {
        let minVal = parseInt(priceMin.value);
        let maxVal = parseInt(priceMax.value);

        if (maxVal - minVal < 500) {
            if (this === priceMin) priceMin.value = maxVal - 500;
            else priceMax.value = minVal + 500;
            minVal = parseInt(priceMin.value);
            maxVal = parseInt(priceMax.value);
        }

        displayMin.innerText = minVal;
        displayMax.innerText = maxVal;

        const percent1 = (minVal / sliderMaxLimit) * 100;
        const percent2 = (maxVal / sliderMaxLimit) * 100;
        trackFill.style.left = percent1 + "%";
        trackFill.style.width = (percent2 - percent1) + "%";
        
        runSearchEngine();
    }

    priceMin.addEventListener('input', updateDualSlider);
    priceMax.addEventListener('input', updateDualSlider);
    updateDualSlider(); 

    // Text Trigger
    searchInput.addEventListener('input', runSearchEngine);

    // The Engine
    function runSearchEngine() {
        const query = searchInput.value.toLowerCase();
        const sortBy = document.getElementById('sort-select').dataset.value;
        const gender = document.getElementById('filter-gender').dataset.value;
        const minP = parseInt(priceMin.value);
        const maxP = parseInt(priceMax.value);

        let results = [...productsDataset]; 

        if (query.length > 0) {
            results = results.filter(p => 
                p.name.toLowerCase().includes(query) || 
                p.category.toLowerCase().includes(query)
            );
        }

        if (gender !== 'all') {
            results = results.filter(p => p.gender === gender);
        }

        results = results.filter(p => p.price >= minP && p.price <= maxP);

        if (sortBy === 'price-low') {
            results.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-high') {
            results.sort((a, b) => b.price - a.price);
        } else if (sortBy === 'name-a-z') {
            results.sort((a, b) => a.name.localeCompare(b.name));
        }

        searchResults.innerHTML = ''; 

        if (results.length === 0) {
            searchResults.innerHTML = '<p style="color: #7a6840; font-style: italic; font-family: \'Inter\', sans-serif;">No silhouettes match your current filters.</p>';
            return;
        }

        results.forEach(product => {
            searchResults.innerHTML += `
                <a href="product.html?id=${product.id}" style="text-decoration: none; color: inherit;">
                    <div class="product-card">
                        <img src="${product.img}" style="width: 100%; aspect-ratio: 3/4; object-fit: cover; opacity: 0.85; transition: opacity 0.3s;" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.85" onerror="this.src='https://placehold.co/600x800?text=IMG'">
                        <div class="product-card-name">${product.name}</div>
                        <div class="product-card-price">₹${product.price.toLocaleString('en-IN')}</div>
                    </div>
                </a>
            `;
        });
    }
}

// ==========================================
// CART LOGIC
// ==========================================
function initCartUI() {
    const cartIcon = document.getElementById('cart-icon');
    const cartOverlay = document.getElementById('cart-overlay');
    const cartDrawer = document.getElementById('cart-drawer');
    const closeCart = document.getElementById('close-cart');

    if (!cartIcon || !cartDrawer) return;

    cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        cartOverlay.classList.add('active');
        cartDrawer.classList.add('active');
        renderCartDrawer();
    });

    const closeMenu = () => {
        cartOverlay.classList.remove('active');
        cartDrawer.classList.remove('active');
    };
    closeCart.addEventListener('click', closeMenu);
    cartOverlay.addEventListener('click', closeMenu);
}

window.renderCartDrawer = function() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total-price');
    
    container.innerHTML = ''; 
    let totalPrice = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p style="color: #8a7e74; font-style: italic; font-family: \'Inter\', sans-serif;">Your cart is currently empty.</p>';
        totalEl.innerText = '₹0';
        return;
    }

    cart.forEach((item, index) => {
        totalPrice += (item.price * item.quantity);
        
        container.innerHTML += `
            <div class="cart-item">
                <img src="${item.img}" alt="${item.name}" onerror="this.src='https://placehold.co/600x800?text=IMG'">
                <div class="cart-item-details">
                    <div>
                        <div class="cart-item-title" style="font-family: 'Inter', sans-serif;">${item.name}</div>
                        <div class="cart-item-size" style="font-family: 'Inter', sans-serif;">Size: ${item.size} | Qty: ${item.quantity}</div>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 10px;">
                        <div class="cart-item-price" style="font-family: 'Inter', sans-serif;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</div>
                        <span class="remove-item" onclick="removeFromCart(${index})" style="font-family: 'Inter', sans-serif;">Remove</span>
                    </div>
                </div>
            </div>
        `;
    });

    totalEl.innerText = `₹${totalPrice.toLocaleString('en-IN')}`;
}

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    localStorage.setItem('brand_cart', JSON.stringify(cart)); 
    updateCartCount(); 
    renderCartDrawer(); 
}