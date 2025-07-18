let allProducts = [];
let categoriesList = [];
let currentView = "all";
let currentCategoryId = null;
let currentPage = 1;
const productsPerPage = 8;

// Track current category products for pagination
let currentCategoryProducts = null;

let activeFilters = {
    searchQuery: "",
    categories: [],
    rating: 0,
    maxPrice: 5000, // Default max price, will be updated dynamically.
    currentMax: 5000,
};

// --- Initialization ---
window.onload = function() {
    console.log("Page loaded, initializing...");
    loadCategories();
    loadMostExpensiveProducts(); // Keep this line as requested
    loadTopRatedProducts();    // Add this line to load top-rated products

    const showFiltersBtn = document.getElementById('show-filters-btn');
    if (showFiltersBtn) {
        showFiltersBtn.addEventListener('click', openFilterModal);
    } else {
        console.error('The main "Show Filters" button with id="show-filters-btn" was not found in the HTML.');
    }

    const searchInput = document.querySelector(".search");
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener("input", function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                activeFilters.searchQuery = this.value.trim().toLowerCase();
                applyAndDisplayProducts(1); // Apply filters and reset to page 1
            }, 300);
        });
    }

    document.querySelector("#back").addEventListener("click", back);
};

function createProductCard(item, index) {
  const aosDelay = index * 50;
  const hasOffer = item.offer && item.offer.discount_percentage > 0;
  const displayPrice = parseFloat(item.price).toFixed(2);
  const originalPriceDisplay = hasOffer ? parseFloat(item.original_price).toFixed(2) : null;
  
  // Check stock status
  const isOutOfStock = item.warehouse_quantity <= 0;
  const lowStock = !isOutOfStock && item.warehouse_quantity <= 5;
  
  // Add out of stock/low stock indicators (keeping your original design)
  const stockIndicator = isOutOfStock ? 
    `<div class="position-absolute top-0 start-0 m-2">
       <span class="badge bg-danger text-white rounded-pill px-2 py-1" style="font-size: 0.7rem;">
         <i class="fas fa-times-circle me-1"></i> Out of Stock
       </span>
     </div>` :
    (lowStock ? 
     `<div class="position-absolute top-0 start-0 m-2">
        <span class="badge bg-warning text-dark rounded-pill px-2 py-1" style="font-size: 0.7rem;">
          <i class="fas fa-exclamation-triangle me-1"></i> Low Stock
        </span>
      </div>` : '');

  return `
    <div class="col" data-aos="fade-right" data-aos-delay="${aosDelay}" style="height: 400px;background: linear-gradient(209deg, #059669 40%, #f0f2f5 40%);">
      <div class="product-item position-relative">
        ${stockIndicator}
        <div onclick="incrementViewAndRedirect(${item.product_id})" style="cursor:pointer;">
          <figure>
            <a href="javascript:void(0)" title="${item.name}">
              <img src="${item.image}" alt="${item.name}" class="tab-image ${isOutOfStock ? 'img-grayscale' : ''}">
              ${isOutOfStock ? '<div class="image-overlay"></div>' : ''}
            </a>
          </figure>
          <div class="d-flex flex-column text-center">
            <h3 class="fs-6 fw-normal">${item.name}</h3>
            <div>
              <span class="rating">
                ${renderStarRating(item.rate || 0)}
              </span>
            </div>
            <div class="d-flex justify-content-center align-items-center gap-2">
              ${originalPriceDisplay && originalPriceDisplay !== displayPrice ? `<del>$${originalPriceDisplay}</del>` : ''}
              <span class="text-dark fw-semibold">$${displayPrice}</span>
              ${hasOffer ? `<span class="badge border border-dark-subtle rounded-0 fw-normal px-1 fs-7 lh-1 text-body-tertiary">${parseFloat(item.offer.discount_percentage).toFixed(0)}% OFF</span>` : ''}
            </div>
          </div>
        </div>
        <div class="button-area p-3 pt-0">
          <div class="row g-1 mt-2">
            <div class="col-3">
              <input type="number" name="quantity" class="form-control border-dark-subtle input-number quantity" 
                value="1" min="1" ${isOutOfStock ? 'disabled' : ''} max="${item.warehouse_quantity}">
            </div>
            <div class="col-7">
              ${isOutOfStock ? 
                '<button class="btn btn-secondary rounded-1 p-2 fs-7 w-100" disabled><i class="fa-solid fa-ban me-1"></i>Out of Stock</button>' : 
                `<a href="#" class="btn btn-primary rounded-1 p-2 fs-7 btn-cart w-100" data-product-id="${item.product_id}">
                  <i class="fa-solid fa-cart-shopping me-1" style="color: #fcfcfc;"></i> Add to Cart
                </a>`}
            </div>
            <div class="col-2">
              <a href="#" class="btn btn-outline-dark rounded-1 p-2 fs-6" style="border-color: #059669;">
                <i class="fa-solid fa-heart fa-sm" style="color: #03a071;"></i>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
// --- Data Loading Functions ---
function loadCategories() {
    const categoryRequest = new XMLHttpRequest();
    categoryRequest.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            try {
                categoriesList = JSON.parse(this.responseText);
                populateCategoryCarousel(categoriesList);
                loadAllProducts();
            } catch (error) {
                console.error("Category JSON parsing error:", error);
            }
        }
    };
    categoryRequest.open("GET", "/projData/php/get_category.php", true);
    categoryRequest.send();
}

function loadAllProducts() {
    const productRequest = new XMLHttpRequest();
    productRequest.onreadystatechange = function() {
        if (this.readyState === 4 && this.status === 200) {
            try {
                allProducts = JSON.parse(this.responseText);
                console.log(`All ${allProducts.length} products loaded.`);

                if (allProducts.length > 0) {
                    const maxPrice = Math.ceil(Math.max(...allProducts.map(p => parseFloat(p.price) || 0)) / 50) * 50;
                    activeFilters.maxPrice = maxPrice;
                    activeFilters.currentMax = maxPrice;
                }

                applyAndDisplayProducts(1);
            } catch (error) {
                console.error("Product JSON parse error:", error, "Response:", this.responseText);
            }
        }
    };
    productRequest.open("GET", "/projData/php/get_productOffers.php", true);
    productRequest.send();
}

function applyAndDisplayProducts(page) {
    currentPage = page;
    let productsToDisplay = [];

    // 1. Get the base list of products (all or from a specific category)
    let baseProducts = (currentView === "category" && currentCategoryId) ?
        allProducts.filter(p => p.category_id == currentCategoryId) : [...allProducts];

    // 2. Apply filters from the `activeFilters` object
    productsToDisplay = baseProducts.filter(product => {
        const productCategoryName = (categoriesList.find(cat => cat.category_id == product.category_id)?.category_name || "").toLowerCase();
        const productPrice = parseFloat(product.price);
        const productRating = parseInt(product.rate || 0);

        const matchesSearch = !activeFilters.searchQuery || product.name.toLowerCase().includes(activeFilters.searchQuery);
        const matchesPrice = productPrice <= activeFilters.currentMax;
        const matchesRating = productRating >= activeFilters.rating;
        const matchesCategory = activeFilters.categories.length === 0 || activeFilters.categories.includes(productCategoryName);

        return matchesSearch && matchesPrice && matchesRating && matchesCategory;
    });

    // Store filtered products for category view
    if (currentView === "category") {
        currentCategoryProducts = productsToDisplay;
    }

    // 3. Determine the correct container and render the products
    if (currentView === "category") {
        const container = document.querySelector("#show_Product .product-grid");
        const pagination = document.querySelector("#show_Product .pagination ul");
        renderProductGrid(productsToDisplay, container, pagination, "category");
    } else {
        const container = document.querySelector("#All_products .row.product-grid");
        const pagination = document.querySelector("#All_products .pagination ul");
        renderProductGrid(productsToDisplay, container, pagination, "all");
    }
}

function renderProductGrid(products, gridContainer, paginationContainer, viewType) {
    if (!gridContainer || !paginationContainer) {
        console.error("Display containers not found. Products cannot be rendered.");
        return;
    }

    if (products.length === 0) {
        gridContainer.innerHTML = `
        <div class="text-center py-5">
        <h3>No products found</h3>
        <p>Your search or filter criteria yielded no results.</p>
      </div>`;
        paginationContainer.innerHTML = "";
        return;
    }

    const totalPages = Math.ceil(products.length / productsPerPage);
    const start = (currentPage - 1) * productsPerPage;
    const end = start + productsPerPage;
    const paginatedProducts = products.slice(start, end);

    gridContainer.innerHTML = paginatedProducts.map((item, index) => createProductCard(item, index)).join("");
    setupCartButtons();

    // Render pagination with the correct view type
    paginationContainer.innerHTML = createPagination(totalPages, currentPage, viewType);
}

function openFilterModal() {
    const categoryCheckboxesHTML = categoriesList.map(cat => `
        <label class="d-block filter-label">
            <input type="checkbox" name="filter_category" value="${cat.category_name.toLowerCase()}"
                                ${activeFilters.categories.includes(cat.category_name.toLowerCase()) ? 'checked' : ''}>
            ${cat.category_name}
        </label>
    `).join('');

    const ratingRadiosHTML = [5, 4, 3, 2, 1].map(r => `
        <label class="filter-label">
            <input type="radio" name="filter_rating" value="${r}" ${activeFilters.rating === r ? 'checked' : ''}>
            ${'<i class="fa-solid fa-star fa-xs" style="color: #FFD43B;"></i>'.repeat(r)}${'<i class="fa-regular fa-star fa-xs" style="color: #FFD43B;"></i>'.repeat(5 - r)} & up
        </label>
    `).join('');

    Swal.fire({
        title: 'Filter Products',
        html: `
            <div id="filters-modal-content">
                <div class="filter-group">
                    <h5>Category</h5>
                    <div id="modal-category-filters"style="display: flex;flex-direction: column;align-items: baseline;">${categoryCheckboxesHTML}</div>
                </div>
                <div class="filter-group">
                    <h5>Price Range</h5>
                    <span>$0</span> - <span id="modal-price-value">$${activeFilters.currentMax}</span>
                    <input type="range" id="modal-price-range" class="form-range"
                                min="0" max="${activeFilters.maxPrice}" value="${activeFilters.currentMax}">
                </div>
                <div class="filter-group">
                    <h5>Minimum Rating</h5>
                    ${ratingRadiosHTML}
                </div>
            </div>
        `,
        showConfirmButton: true,
        confirmButtonColor: '#059669',
        confirmButtonText: 'Apply Filters',
        showCancelButton: false,
        showCloseButton: true,
        showDenyButton: true,
        denyButtonText: 'Clear Filters',
        didOpen: () => {
            const priceRange = document.getElementById('modal-price-range');
            const priceValue = document.getElementById('modal-price-value');
            priceRange.addEventListener('input', (e) => {
                priceValue.textContent = `$${e.target.value}`;
            });
        },
        preConfirm: () => {
            const selectedCategories = Array.from(document.querySelectorAll('#modal-category-filters input:checked'))
                .map(cb => cb.value);
            const selectedRating = parseInt(document.querySelector('input[name="filter_rating"]:checked')?.value || '0');
            const selectedPrice = parseInt(document.getElementById('modal-price-range').value);

            return {
                categories: selectedCategories,
                rating: selectedRating,
                price: selectedPrice
            }
        }
    }).then((result) => {
        if (result.isConfirmed) {
            const newFilters = result.value;
            activeFilters.categories = newFilters.categories;
            activeFilters.rating = newFilters.rating;
            activeFilters.currentMax = newFilters.price;
            console.log('Applying new filters:', activeFilters);
            applyAndDisplayProducts(1);
        } else if (result.isDenied) {
            activeFilters.categories = [];
            activeFilters.rating = 0;
            activeFilters.currentMax = activeFilters.maxPrice;
            console.log('Filters cleared.');
            applyAndDisplayProducts(1);
        }
    });
}

function navigateToPage(page, viewType) {
    if (page < 1) return;
    currentPage = page;

    if (viewType === "all") {
        applyAndDisplayProducts(page);
    } else {
        // For category view, use the stored filtered products
        const container = document.querySelector("#show_Product .product-grid");
        const pagination = document.querySelector("#show_Product .pagination ul");
        renderProductGrid(currentCategoryProducts, container, pagination, "category");
    }
}

// --- View Switching ---
function off(categoryId) {
    currentView = "category";
    currentCategoryId = categoryId;
    document.querySelector("#All_products").classList.add("off");
    document.querySelector("#show_Product").classList.remove("off");
    applyAndDisplayProducts(1);
}

function back() {
    currentView = "all";
    currentCategoryId = null;
    document.querySelector("#All_products").classList.remove("off");
    document.querySelector("#show_Product").classList.add("off");
    applyAndDisplayProducts(1);
}

function populateCategoryCarousel(categories) {
    const insertCategory = document.querySelector(".py-5 .category-carousel .swiper-wrapper");
    if (insertCategory) {
        insertCategory.innerHTML = categories.map((item, index) => `
            <a href="#" class="nav-link swiper-slide text-center show" data-aos="fade-right" data-aos-delay="${index * 50}" data-id="${item.category_id}">
                <img src="${item.image}" class="rounded-circle" alt="${item.category_name}" style="width: 161px; height: 160px; object-fit: cover;"/>
                <h4 class="fs-6 mt-3 fw-normal category-title">${item.category_name}</h4>
            </a>
        `).join("");

        document.querySelectorAll(".show").forEach((el) => {
            el.addEventListener("click", function(e) {
                e.preventDefault();
                const categoryId = this.getAttribute("data-id");
                off(categoryId);
            });
        });
    }
}

function setupCartButtons() {
    document.querySelectorAll(".btn-cart").forEach((el) => {
        // Clone and replace element to remove existing event listeners before adding new ones
        const newEl = el.cloneNode(true);
        el.parentNode.replaceChild(newEl, el);

        newEl.addEventListener("click", function(e) {
            e.preventDefault();
            const productId = parseInt(this.getAttribute("data-product-id"));
            const selectedProduct = allProducts.find((p) => p.product_id === productId);
            if (!selectedProduct) return;
            const quantityInput = this.closest(".button-area").querySelector(".quantity");
            let quantity = parseInt(quantityInput.value);
            if (isNaN(quantity) || quantity < 1) quantity = 1;
            addToCart(selectedProduct, quantity);
        });
    });
}

function renderStarRating(rating) {
    let starHTML = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    for (let i = 0; i < 5; i++) {
        if (i < fullStars) {
            starHTML += `<i class="fa-solid fa-star fa-sm" style="color: #FFD43B;"></i>`;
        } else if (i === fullStars && hasHalfStar) {
            starHTML += `<i class="fa-solid fa-star-half-alt fa-sm" style="color: #FFD43B;"></i>`;
        } else {
            starHTML += `<i class="fa-regular fa-star fa-sm" style="color: #FFD43B;"></i>`;
        }
    }
    return starHTML;
}

function incrementViewAndRedirect(productId) {
    const redirectUrl = `../../projData/html/product_details.html?product_id=${productId}`;
    window.location.href = redirectUrl;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/projData/php/increment_views.php", true);
    xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
    xhr.send("product_id=" + encodeURIComponent(productId));
}

function addToCart(productToAdd, quantity) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/projData/php/add_to_cart.php", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            try {
                const response = JSON.parse(xhr.responseText);
                if (xhr.status === 200 && response.success) {
                    Swal.fire({
                        title: "Added to Cart!",
                        text: `${productToAdd.name} has been added.`,
                        icon: "success",
                        timer: 1500,
                        showConfirmButton: false
                    });
                } else {
                    Swal.fire({
                        title: "Error",
                        text: response.error || "Could not add product.",
                        icon: "error"
                    });
                }
            } catch (err) {
                Swal.fire({
                    title: "Error",
                    text: "Server returned an invalid response.",
                    icon: "error"
                });
            }
        }
    };
    xhr.send(JSON.stringify({
        product_id: productToAdd.product_id,
        quantity: quantity
    }));
}

function createPagination(totalPages, page, viewType) {
    let liTag = "";
    let active;
    let beforePage = page - 1;
    let afterPage = page + 1;

    if (page > 1) {
        liTag += `<li class="btn prev" onclick="navigateToPage(${page - 1}, '${viewType}')">
            <span><i class="fa-solid fa-angle-left"></i> Prev</span>
        </li>`;
    }

    if (page > 2) {
        liTag += `<li class="numb" onclick="navigateToPage(1, '${viewType}')"><span>1</span></li>`;
        if (page > 3) liTag += `<li class="dots"><span>...</span></li>`;
    }

    for (let p = beforePage; p <= afterPage; p++) {
        if (p > totalPages || p < 1) continue;
        active = page === p ? "active" : "";
        liTag += `<li class="numb ${active}" onclick="navigateToPage(${p}, '${viewType}')"><span>${p}</span></li>`;
    }

    if (page < totalPages - 1) {
        if (page < totalPages - 2) liTag += `<li class="dots"><span>...</span></li>`;
        liTag += `<li class="numb" onclick="navigateToPage(${totalPages}, '${viewType}')"><span>${totalPages}</span></li>`;
    }

    if (page < totalPages) {
        liTag += `<li class="btn next" onclick="navigateToPage(${page + 1}, '${viewType}')">
            <span>Next <i class="fa-solid fa-angle-right"></i></span>
        </li>`;
    }

    return liTag;
}

// --- Functions for Most Expensive Products (Existing) ---
function loadMostExpensiveProducts() {
    const request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (this.readyState === 4) { // Check readyState before status to avoid errors
            if (this.status === 200) {
                try {
                    const expensiveProducts = JSON.parse(this.responseText);
                    console.log(`Loaded ${expensiveProducts.length} most expensive products`);
                    displayMostExpensiveProducts(expensiveProducts);
                } catch (error) {
                    console.error("Error parsing most expensive products:", error, "Response:", this.responseText);
                    // Call generic error display for this section
                    displayProductError("#Most_Expensive_Products");
                }
            } else {
                console.error("Error loading most expensive products:", this.status, this.statusText);
                // Call generic error display for this section
                displayProductError("#Most_Expensive_Products");
            }
        }
    };
    request.open("GET", "/projData/php/get_most_expensive_products.php", true);
    request.send();
}

function displayMostExpensiveProducts(products) {
    const container = document.querySelector("#Most_Expensive_Products .product-grid");
    if (!container) {
        console.error("Most expensive products container not found");
        return;
    }

    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <h3>No most expensive products found</h3>
                <p>Check back later for high-value items.</p>
            </div>`;
        return;
    }

    container.innerHTML = products.map((product, index) => createProductCard(product, index)).join("");
    setupCartButtons();
}

// --- Functions for Top Rated Products (New/Modified) ---
function loadTopRatedProducts() {
    const request = new XMLHttpRequest();
    request.onreadystatechange = function() {
        if (this.readyState === 4) { // Check readyState before status to avoid errors
            if (this.status === 200) {
                try {
                    const topRatedProducts = JSON.parse(this.responseText);
                    console.log(`Loaded ${topRatedProducts.length} top-rated products`);
                    displayTopRatedProducts(topRatedProducts);
                } catch (error) {
                    console.error("Error parsing top-rated products:", error, "Response:", this.responseText);
                    // Call generic error display for this section
                    displayProductError("#Top_Rated_Products");
                }
            } else {
                console.error("Error loading top-rated products:", this.status, this.statusText);
                // Call generic error display for this section
                displayProductError("#Top_Rated_Products");
            }
        }
    };
    // Make sure this PHP endpoint returns the top-rated products data
    request.open("GET", "/projData/php/get_top_rated_products.php", true);
    request.send();
}

function displayTopRatedProducts(products) {
    const container = document.querySelector("#Top_Rated_Products .product-grid");
    if (!container) {
        console.error("Top-rated products container not found");
        return;
    }

    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <h3>No top-rated products found</h3>
                <p>Check back later for our featured products.</p>
            </div>`;
        return;
    }

    container.innerHTML = products.map((product, index) => createProductCard(product, index)).join("");
    setupCartButtons(); // Ensure cart buttons are set up for these new cards too
}

// --- Generic Error Display (Moved for better organization) ---
function displayProductError(selector) {
    const container = document.querySelector(`${selector} .product-grid`);
    if (container) {
        container.innerHTML = `
            <div class="col-12 text-center py-5">
                <h3>Unable to load products</h3>
                <p>Please try again later or refresh the page.</p>
            </div>`;
    }
}