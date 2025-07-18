let arrProduct = [];
let categoriesList = [];


function fetchCategories() {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/projData/php/get_category.php", true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        try {
          categoriesList = JSON.parse(xhr.responseText);
          resolve(categoriesList);
        } catch (err) {
          reject("Failed to parse categories JSON");
        }
      } else {
        reject("Failed to load categories");
      }
    };
    xhr.onerror = () => reject("Request error");
    xhr.send();
  });
}

function loadProductById() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("product_id");

  if (!productId) {
    console.error("No product ID provided in the URL.");
    return;
  }

  const productRequest = new XMLHttpRequest();

  productRequest.onreadystatechange = function() {
    if (this.readyState === 4 && this.status === 200) {
      try {
        const product = JSON.parse(this.responseText);
        arrProduct = product; // Store product globally
        displayProduct(product);
      } catch (error) {
        console.error("Product JSON parsing error:", error);
      }
    } else if (this.readyState === 4) {
      console.error("Error loading product. Status:", this.status);
    }
  };

  productRequest.open("GET", `/projData/php/get_productOffers.php?id=${productId}`, true);
  productRequest.send();
}

function displayProduct(product) {
  const insert_products = document.querySelector("#showProductById");
  if (!insert_products) return;

  const originalPrice = parseFloat(product.price);
  const hasOffer = product.offer && product.offer.discount_percentage;
  const discountedPrice = hasOffer
    ? (originalPrice * (1 - product.offer.discount_percentage / 100)).toFixed(2)
    : originalPrice.toFixed(2);

  const priceHTML = hasOffer
    ? `<span class="line-through text-gray-500 mr-2">$${originalPrice}</span><span class="text-green-600 font-bold">$${discountedPrice}</span>`
    : `<span class="text-gray-900 font-bold">$${originalPrice}</span>`;

  const offerHTML = hasOffer
    ? `<p class="text-sm text-green-700 mt-1 font-medium">${product.offer.title} - ${product.offer.discount_percentage}% off!</p>`
    : '';

  insert_products.innerHTML = `
    <div class="max-w-screen-xl px-4 mx-auto 2xl:px-0">
      <div class="lg:grid lg:grid-cols-2 lg:gap-8 xl:gap-16">
        <div class="shrink-0 max-w-md lg:max-w-lg mx-auto">
          <img class="w-full hidden dark:block" src="${product.image || '../images/product-large-1.jpg'}" style="width: 380px;height: 380px;" alt="${product.name}" />
        </div>
        <div class="mt-6 sm:mt-8 lg:mt-0">
          <h1 class="text-xl font-semibold text-gray-900 sm:text-2xl dark:text-white" style="color: black;">${product.name}</h1>
          <div class="mt-4 sm:items-center sm:gap-4 sm:flex" style="flex-direction: column;align-items: baseline;">
            <p class="text-2xl font-extrabold sm:text-3xl dark:text-white" style="color: black;">${priceHTML}</p>
            ${offerHTML}
            <br>
            <div class="flex items-center gap-2 mt-2 sm:mt-0">
              <div class="flex items-center gap-1">
                ${renderStarRating(product.rate || 0, product.product_id)}
              </div>
              <p class="text-sm font-medium leading-none text-gray-500 dark:text-gray-400" style="color: black;">(${parseFloat(product.rate).toFixed(1)})</p>
              <a href="#" class="text-sm font-medium leading-none text-gray-900 underline hover:no-underline dark:text-white" style="color: black;">
                ${product.views_count} views
              </a>
            </div>
          </div>
          <div class="mt-6 sm:gap-4 sm:items-center sm:flex sm:mt-8 button">
            <a href="#" title="" class="flex items-center justify-center py-2.5 px-5 text-sm font-medium text-gray-900 bg-white rounded-lg border border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400" role="button">
              <svg class="w-5 h-5 -ms-2 me-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12.01 6.001C6.5 1 1 8 5.782 13.001L12.011 20l6.23-7C23 8 17.5 1 12.01 6.002Z" />
              </svg>
              Add to favorites
            </a>
            <a href="#" id="addToCartBtn" class="text-white mt-4 sm:mt-0 bg-primary-700 hover:bg-primary-800 font-medium rounded-lg text-sm px-5 py-2.5" role="button" style="display: flex;margin-left: 15px;">
              <svg class="w-5 h-5 -ms-2 me-2" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4h1.5L8 16h8m-8 0a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4zm.75-3H7.5M11 7H6.312M17 4v6m-3-3h6" />
              </svg>
              Add to cart
            </a>
          </div>
          <hr class="my-6 md:my-8 border-gray-200" />
          <p class="mb-6 text-gray-500" style="color: black;">${product.description_product}</p>
        </div>
      </div>
    </div>
  `;

  // Add event listeners
  setupEventListeners(product);
}

function setupEventListeners(product) {
  // Rating stars
  document.querySelectorAll('.rate-star').forEach(star => {
    star.addEventListener('click', function() {
      const rating = parseInt(this.dataset.value);
      const productId = parseInt(this.dataset.productId);
      submitRating(productId, rating);
    });
  });

  // Add to cart button
  document.querySelector("#addToCartBtn").addEventListener("click", function(e) {
    e.preventDefault();
    addToCart(product.product_id, 1); // Default quantity = 1
  });

  // Quantity controls (if you add them later)
  const quantityInput = document.querySelector('.quantity-input');
  if (quantityInput) {
    document.querySelector('.quantity-minus').addEventListener('click', () => {
      let qty = parseInt(quantityInput.value);
      if (qty > 1) quantityInput.value = qty - 1;
    });
    
    document.querySelector('.quantity-plus').addEventListener('click', () => {
      let qty = parseInt(quantityInput.value);
      quantityInput.value = qty + 1;
    });
  }
}

function addToCart(productId, quantity = 1) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/projData/php/add_to_cart.php", true);
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = function() {
        try {
            const response = JSON.parse(xhr.responseText);
            
            if (xhr.status >= 200 && xhr.status < 300) {
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: response.message,
                        timer: 1500,
                        showConfirmButton: false
                    });
                    updateCartCount(response.quantity || 1);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: response.error || 'Unknown error occurred'
                    });
                }
            } else {
                throw new Error(response.error || `Server returned status ${xhr.status}`);
            }
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Invalid server response. Please try again.'
            });
        }
    };

    xhr.onerror = function() {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Request failed. Please check your connection.'
        });
    };

    const payload = JSON.stringify({
        product_id: productId,
        quantity: quantity
    });

    xhr.send(payload);
}

function showCartSuccess(message) {
  Swal.fire({
    icon: "success",
    title: "Success",
    text: message,
    timer: 1500,
    showConfirmButton: false,
  });
}

function showCartError(error) {
  Swal.fire({
    icon: "error",
    title: "Error",
    text: error,
    timer: 2000,
  });
}

function updateCartCount(quantityAdded = 1) {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        const currentCount = parseInt(cartCountElement.textContent) || 0;
        const newCount = currentCount + quantityAdded;
        cartCountElement.textContent = newCount;
        
        // Add animation
        cartCountElement.classList.add('animate-bounce');
        setTimeout(() => {
            cartCountElement.classList.remove('animate-bounce');
        }, 1000);
    }
}

function submitRating(productId, rating) {
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/projData/php/submit_rating.php", true);
  xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            Swal.fire("Thanks for your rating!", "", "success");
            loadProductById(); // Refresh product to show updated rating
          } else {
            Swal.fire("Error", response.error || "Failed to update rating", "error");
          }
        } catch (e) {
          Swal.fire("Error", "Invalid response from server", "error");
        }
      } else {
        Swal.fire("Error", "Failed to submit rating. Status: " + xhr.status, "error");
      }
    }
  };

  xhr.send(JSON.stringify({ product_id: productId, rating: rating }));
}

function renderStarRating(rating, productId) {
  let starHTML = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  for (let i = 1; i <= 5; i++) {
    let iconClass = "fa-regular fa-star";
    if (i <= fullStars) {
      iconClass = "fa-solid fa-star";
    } else if (i === fullStars + 1 && hasHalfStar) {
      iconClass = "fa-solid fa-star-half-alt";
    }
    starHTML += `<i class="${iconClass} rate-star" data-value="${i}" data-product-id="${productId}" style="cursor:pointer; color:#fbbf24;"></i>`;
  }
  return starHTML;
}

document.addEventListener('DOMContentLoaded', function() {
  fetchCategories()
    .then(() => loadProductById())
    .catch(error => console.error("Initialization error:", error));
});