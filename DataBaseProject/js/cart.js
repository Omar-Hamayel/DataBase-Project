let ItemsPrice = 0;
let cartItems = [];

// Fetch cart items from server
function fetchCartItems() {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "/projData/php/get_cart.php", true);
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        // Add validation for discount values
                        cartItems = response.data.items.map(item => {
                            // Ensure discount is a number between 0 and 100
                            item.discount_percent = Math.max(0, Math.min(100, 
                                parseFloat(item.discount_percent) || 0));
                            return item;
                        });
                        
                        ItemsPrice = response.data.summary?.grand_total || 0;
                        renderCart();
                    } else {
                        showCartMessage("Failed to load cart: " + (response.error || "Unknown error"));
                        console.error("Server error:", response);
                    }
                } catch (e) {
                    console.error("Error parsing response:", e, xhr.responseText);
                    showCartMessage("Error loading cart data");
                }
            } else {
                showCartMessage("Network error loading cart");
                console.error("HTTP error:", xhr.status);
            }
        }
    };
    xhr.send();
}

function renderCart() {
    const cartContainer = document.querySelector(".cart-items");
    
    if (!cartItems || cartItems.length === 0) {
        cartContainer.innerHTML = "<p>Your cart is empty</p>";
        updateTotal();
        return;
    }

    const cartHTML = cartItems.map((product, index) => {
        const hasOffer = product.discount_percent > 0; // Simplified check
        const originalPrice = parseFloat(product.price);
        const quantity = product.quantity || 1;
        
        // Use the discounted_price directly from backend response
        const discountedPrice = parseFloat(product.discounted_price);
        const subtotal = parseFloat(product.subtotal);
        const youSave = subtotal - discountedPrice;

        return `
    <div class="cart-item" data-index="${index}">
        <img src="${product.image || 'https://i.imgur.com/1GrakTl.jpg'}" alt="${product.name}">
        <div class="item-details">
            <div class="text-muted">${product.category || 'Uncategorized'}</div>
            <div class="item-name">${product.name}</div>
            ${hasOffer ? `
                <div class="offer-info">
                    <span class="offer-badge">
                        <i class="fas fa-tag" style="margin-right: 4px;"></i>
                        ${product.discount_percent}% OFF
                    </span>
                    ${product.offer_dates ? `
                        <span class="offer-validity">
                            Offer ends: ${new Date(product.offer_dates.split(' to ')[1]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                    ` : ''}
                </div>
            ` : ''}
        </div>
        <div class="quantity" data-index="${index}">
            <button class="minus-btn" type="button">
                <i class="fas fa-minus"></i>
            </button>
            <input type="text" class="quantity-input" value="${quantity}" readonly>
            <button class="plus-btn" type="button">
                <i class="fas fa-plus"></i>
            </button>
        </div>
        <div class="price-container">
            ${hasOffer ? `
                <div class="original-price">$${subtotal.toFixed(2)}</div>
                <div class="discounted-price">$${discountedPrice.toFixed(2)}</div>
                <div class="you-save">
                    <i class="fas fa-coins" style="margin-right: 4px;"></i>
                    You save $${youSave.toFixed(2)}
                </div>
            ` : `
                <div class="regular-price">$${subtotal.toFixed(2)}</div>
            `}
            <span class="close" data-product-id="${product.product_id}">&#10005;</span>
        </div>
    </div>

        `;
    }).join('');

    cartContainer.innerHTML = cartHTML;
    setupQuantityControls();
    setupRemoveButtons();
    updateTotal();
}

function setupQuantityControls() {
    document.querySelectorAll('.quantity').forEach(control => {
        const index = control.getAttribute('data-index');
        const plus = control.querySelector('.plus-btn');
        const minus = control.querySelector('.minus-btn');

        plus.addEventListener('click', () => updateQuantity(index, 1));
        minus.addEventListener('click', () => updateQuantity(index, -1));
    });
}

function updateQuantity(index, delta) {
    if (!cartItems[index]) return;

    const newQty = Math.max(1, (cartItems[index].quantity || 1) + delta);
    const productId = cartItems[index].product_id;

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/projData/php/update_cart_quantity.php", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            fetchCartItems(); // Refresh cart after update
        }
    };
    xhr.send(JSON.stringify({
        product_id: productId,
        quantity: newQty
    }));
}

function setupRemoveButtons() {
    document.querySelectorAll(".close").forEach(button => {
        button.addEventListener("click", function() {
            const productId = this.getAttribute("data-product-id");
            const productName = this.closest('.cart-item').querySelector('.item-name').textContent;
            
            Swal.fire({
                title: 'Remove Item',
                html: `Are you sure you want to remove <strong>${productName}</strong> from your cart?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#059669',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, remove it!'
            }).then((result) => {
                if (result.isConfirmed) {
                    removeCartItem(productId);
                }
            });
        });
    });
}

function removeCartItem(productId) {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/projData/php/remove_cart_item.php", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.success) {
                        Swal.fire({
                            title: 'Removed!',
                            text: 'The item has been removed from your cart.',
                            icon: 'success',
                            confirmButtonColor: '#059669',
                            timer: 1500
                        }).then(() => {
                            fetchCartItems(); // Refresh cart after removal
                        });
                    } else {
                        Swal.fire({
                            title: 'Error',
                            text: response.message || 'Failed to remove item',
                            icon: 'error',
                            confirmButtonColor: '#059669'
                        });
                    }
                } catch (e) {
                    console.error("Error parsing response:", e);
                    Swal.fire({
                        title: 'Error',
                        text: 'There was an error processing your request',
                        icon: 'error',
                        confirmButtonColor: '#059669'
                    });
                }
            } else {
                Swal.fire({
                    title: 'Error',
                    text: 'Network error occurred',
                    icon: 'error',
                    confirmButtonColor: '#059669'
                });
            }
        }
    };
    xhr.send(JSON.stringify({ product_id: productId }));
}

function updateTotal() {
    let itemCount = 0;
    if (cartItems) {
        itemCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
    }

    document.querySelector(".numItems2").innerHTML = `<p>ITEMS ${itemCount}</p>`;
    document.querySelector(".ItemsPrice").innerHTML = `<p>Total: $${ItemsPrice.toFixed(2)}</p>`;
}

function showCartMessage(message) {
    document.querySelector(".cart-items").innerHTML = `<p class="cart-message">${message}</p>`;
}

// Update cart totals
function updateTotal() {
    let itemCount = 0;
    if (cartItems) {
        itemCount = cartItems.reduce((total, item) => total + (item.quantity || 1), 0);
    }

    document.querySelector(".numItems2").innerHTML = `<p>ITEMS ${itemCount}</p>`;
    document.querySelector(".ItemsPrice").innerHTML = `<p>Total: $${ItemsPrice.toFixed(2)}</p>`;
}

// Show cart message
function showCartMessage(message) {
    document.querySelector(".cart-items").innerHTML = `<p class="cart-message">${message}</p>`;
}

// Form Validation Functions
function validateForm() {
    let isValid = true;
    const form = document.getElementById('paymentForm');
    const isCardPayment = document.getElementById("card").checked;
    
    // Reset all error states first
    form.querySelectorAll('.input-box input').forEach(input => {
        input.classList.remove('invalid', 'valid');
    });
    document.querySelectorAll('.card-type label').forEach(label => {
        label.style.borderColor = '';
    });

    // Always required fields (for both payment methods)
    const alwaysRequired = [
        'input[placeholder="Jacob Aiden"]',    // Full name
        'input[placeholder="example@example.com"]', // Email
        'input[placeholder="City Name"]',      // City
        'input[placeholder="Street Name"]',    // Street
        'input[placeholder="Apartment #"]'     // Apartment number
    ];
    
    // Validate always required fields
    alwaysRequired.forEach(selector => {
        const input = form.querySelector(selector);
        if (!input) return;
        
        input.classList.add('touched');
        if (!input.checkValidity()) {
            isValid = false;
            input.classList.add('invalid');
        } else {
            input.classList.add('valid');
        }
    });
    
    // Validate card fields only if paying by card
    if (isCardPayment) {
        // Check if card type is selected
        const cardTypeSelected = form.querySelector('input[name="card_type"]:checked');
        if (!cardTypeSelected) {
            isValid = false;
        }
        
        // Card details fields
        const cardRequired = [
            'input[placeholder="Mr. Jacob Aiden"]', // Name on card
            'input[placeholder="1111 2222 3333 4444"]', // Card number
            'input[placeholder="YYYY-MM-DD"]'      // Expiry date
        ];
        
        cardRequired.forEach(selector => {
            const input = form.querySelector(selector);
            if (!input) return;
            
            input.classList.add('touched');
            if (!input.checkValidity()) {
                isValid = false;
                input.classList.add('invalid');
            } else {
                input.classList.add('valid');
            }
        });
    }
    
    return isValid;
}

function initializeFormValidation() {
    const form = document.getElementById('paymentForm');
    const inputs = form.querySelectorAll('input');
    
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            if (this.classList.contains('touched')) {
                if (this.checkValidity()) {
                    this.classList.add('valid');
                    this.classList.remove('invalid');
                } else {
                    this.classList.add('invalid');
                    this.classList.remove('valid');
                }
            }
        });
        
        input.addEventListener('blur', function() {
            this.classList.add('touched');
            if (this.checkValidity()) {
                this.classList.add('valid');
                this.classList.remove('invalid');
            } else {
                this.classList.add('invalid');
                this.classList.remove('valid');
            }
        });
    });
}

// Payment Gateway Functions
function initializePaymentModal() {
    const cardForm = document.getElementById("cardForm");
    const cashContent = document.getElementById("cashContent");
    const cardRadio = document.getElementById("card");
    const cashRadio = document.getElementById("cash");

    function togglePayment() {
        if (cardRadio.checked) {
            cardForm.style.display = "block";
            cashContent.style.display = "none";
        } else {
            cardForm.style.display = "none";
            cashContent.style.display = "block";
        }
        // Revalidate form when payment method changes
        validateForm();
    }

    cardRadio.addEventListener("change", togglePayment);
    cashRadio.addEventListener("change", togglePayment);
    togglePayment(); // initial load
}

function handlePaymentSubmission() {
    if (!validateForm()) {
        Swal.fire({
            title: 'Form Incomplete',
            text: 'Please fill in all required fields correctly',
            icon: 'warning',
            confirmButtonColor: '#8175d3'
        });
        return;
    }

    // Collect form data
    const formData = {
        city: document.querySelector("#paymentForm input[placeholder='City Name']").value,
        street: document.querySelector("#paymentForm input[placeholder='Street Name']").value,
        apt_number: document.querySelector("#paymentForm input[placeholder='Apartment #']").value,
        payment_method: document.querySelector("#paymentForm input[name='payment']:checked").id === 'card' ? 'card' : 'cash',
        cart_items: cartItems.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity || 1
        }))
    };

    // Only add card details if paying by card
    if (formData.payment_method === 'card') {
        formData.card_type = document.querySelector("#paymentForm input[name='card_type']:checked").value;
        formData.card_number = document.querySelector("#paymentForm input[placeholder='1111 2222 3333 4444']").value.replace(/\s/g, '');
        formData.expiry_date = document.querySelector("#paymentForm input[placeholder='YYYY-MM-DD']").value;
    }

    // Create and send XMLHttpRequest
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/projData/php/process_payment.php", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    
    // Show loading state
    const submitBtn = document.getElementById("submitPayment");
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Processing...';
    submitBtn.disabled = true;
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            submitBtn.innerHTML = originalBtnText;
            submitBtn.disabled = false;
            
            try {
                const response = JSON.parse(xhr.responseText);
                if (response.success) {
                    const paymentModal = bootstrap.Modal.getInstance(document.getElementById('paymentModal'));
                    paymentModal.hide();
                    
                    Swal.fire({
                        title: 'Order Placed!',
                        html: `Your order #${response.order_id} has been successfully placed.<br>
                               Total Amount: $${response.total_amount.toFixed(2)}`,
                        icon: 'success',
                        confirmButtonColor: '#8175d3'
                    }).then(() => {
                        window.location.href = `../index.html`;
                    });
                    
                    // Clear the cart after successful order
                    cartItems = [];
                    renderCart();
                } else {
                    Swal.fire({
                        title: 'Error',
                        text: response.message,
                        icon: 'error',
                        confirmButtonColor: '#8175d3'
                    });
                }
            } catch (e) {
                Swal.fire({
                    title: 'Error',
                    text: 'There was a problem processing your order.',
                    icon: 'error',
                    confirmButtonColor: '#8175d3'
                });
            }
        }
    };
    
    xhr.onerror = function() {
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        Swal.fire({
            title: 'Network Error',
            text: 'Unable to connect to the server. Please try again.',
            icon: 'error',
            confirmButtonColor: '#8175d3'
        });
    };
    
    xhr.send(JSON.stringify(formData));
}
document.addEventListener('DOMContentLoaded', () => {
    // Initialize cart
    fetchCartItems();

    // Setup checkout button
    document.getElementById("CHECKOUT").addEventListener("click", (e) => {
        e.preventDefault();
        
        if (cartItems.length === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Your cart is empty',
                text: 'Please add some items to your cart before checkout',
                confirmButtonColor: '#8175d3'
            });
            return;
        }
        
        // Initialize the modal
        const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
        paymentModal.show();
        
        // Initialize payment method toggle
        initializePaymentModal();
        
        // Initialize form validation
        initializeFormValidation();
    });

    // Setup payment submission
    document.getElementById("submitPayment").addEventListener("click", handlePaymentSubmission);
});