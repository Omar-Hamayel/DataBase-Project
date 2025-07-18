let allOrders = [];
let filteredOrders = [];
let monthlySpendingChart = null;
let orderStatusChart = null;
let currentPage = 1;
const ordersPerPage = 5;

// Main initialization
window.onload = function() {
  checkLoginStatus();
  loadOrders();
  setupEventListeners();
};

// Check if user is logged in
function checkLoginStatus() {
  const customerId = getLoggedInCustomerId();
  if (!customerId) {
    redirectToLogin();
    return;
  }
}

// Get logged-in customer ID from your authentication system
function getLoggedInCustomerId() {
  return 1; // Replace with actual authentication logic
}

// Redirect to login page if not authenticated
function redirectToLogin() {
  window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.pathname);
}

// Load orders from server with optional filters
function loadOrders() {
    const customerId = getLoggedInCustomerId();
    if (!customerId) return;

    showLoading(true);

    const orderRequest = new XMLHttpRequest();
    orderRequest.open("GET", "/projData/php/get_orders.php", true);
    
    orderRequest.onreadystatechange = function() {
        if (this.readyState === 4) {
            showLoading(false);
            
            if (this.status === 200) {
                try {
                    const response = JSON.parse(this.responseText);
                    if (response.success) {
                        allOrders = response.data.all_orders;
                        applyFilters(); // This will now handle chart initialization
                    } else {
                        displayError(response.error || 'Failed to load orders');
                    }
                } catch (error) {
                    console.error('JSON parsing error:', error);
                    displayError('Failed to parse server response');
                }
            } else {
                displayError('Failed to load orders. Please try again.');
            }
        }
    };
    
    orderRequest.send();
}
// Apply filters when dropdowns change
function applyFilters() {
    currentPage = 1; // Reset to first page when filters change
    
    const statusFilter = document.getElementById('order-type').value;
    const monthFilter = document.getElementById('month-filter').value;

    // Start with all orders
    filteredOrders = [...allOrders];

    // Apply status filter if not 'all'
    if (statusFilter && statusFilter !== 'all') {
        const statusMapping = {
            'waiting': 'Waiting',
            'accepted': 'Accepted',
            'in_transit': 'In_transit',
            'cancelled': 'Cancelled'
        };
        
        const statusValue = statusMapping[statusFilter.toLowerCase()] || statusFilter;
        filteredOrders = filteredOrders.filter(order => order.status === statusValue);
    }

    // Apply month filter if not 'all'
    if (monthFilter && monthFilter !== 'all') {
        filteredOrders = filteredOrders.filter(order => {
            const orderDate = new Date(order.order_date);
            return (orderDate.getMonth() + 1) == monthFilter;
        });
    }
    // Update the UI with filtered orders
    renderOrders();
    updateOrderSummary();
    updateCharts(); // Add this line to update charts when filters change
}

// Render all orders in the UI with 
function renderOrders(page = 1) {
    currentPage = page;
    const ordersContainer = document.getElementById('orders-container');
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    
    if (!filteredOrders || filteredOrders.length === 0) {
        ordersContainer.innerHTML = `
            <div class="text-center py-5">
                <h3>No orders found</h3>
                <p>No orders match your current filters.</p>
                <button onclick="resetFilters()" class="btn btn-primary">Reset Filters</button>
            </div>`;
            
        document.querySelector(".pagination ul").innerHTML = "";
        return;
    }

    // Calculate paginated orders
    const start = (page - 1) * ordersPerPage;
    const end = start + ordersPerPage;
    const paginatedOrders = filteredOrders.slice(start, end);

    // Render orders
    ordersContainer.innerHTML = paginatedOrders.map(order => createOrderCard(order)).join('');
    setupOrderCardInteractions();

    // Render pagination
    document.querySelector(".pagination ul").innerHTML = createPagination(totalPages, page, "orders");
}

// Create pagination HTML similar to products page
function createPagination(totalPages, page, type) {
  let liTag = "";
  let active;
  let beforePage = page - 1;
  let afterPage = page + 1;

  if (page > 1) {
    liTag += `<li class="btn prev" onclick="navigateToPage(${page - 1}, '${type}')">
      <span><i class="fa-solid fa-angle-left"></i> Prev</span>
    </li>`;
  }

  if (page > 2) {
    liTag += `<li class="numb" onclick="navigateToPage(1, '${type}')"><span>1</span></li>`;
    if (page > 3) liTag += `<li class="dots"><span>...</span></li>`;
  }

  for (let p = beforePage; p <= afterPage; p++) {
    if (p > totalPages || p < 1) continue;
    active = page === p ? "active" : "";
    liTag += `<li class="numb ${active}" onclick="navigateToPage(${p}, '${type}')"><span>${p}</span></li>`;
  }

  if (page < totalPages - 1) {
    if (page < totalPages - 2) liTag += `<li class="dots"><span>...</span></li>`;
    liTag += `<li class="numb" onclick="navigateToPage(${totalPages}, '${type}')"><span>${totalPages}</span></li>`;
  }

  if (page < totalPages) {
    liTag += `<li class="btn next" onclick="navigateToPage(${page + 1}, '${type}')">
      <span>Next <i class="fa-solid fa-angle-right"></i></span>
    </li>`;
  }

  return liTag;
}

// Navigate to specific page
function navigateToPage(page, type) {
  if (type === "orders") {
    renderOrders(page);
  }
}

// Create HTML for a single order card
function createOrderCard(order) {
  const orderDate = new Date(order.order_date);
  const formattedDate = `${orderDate.getDate()}.${orderDate.getMonth() + 1}.${orderDate.getFullYear()}`;
  const formattedPrice = `$${order.total_amount.toFixed(2)}`;
  const orderIdDisplay = `#${order.order_id}`;
  
  const { statusClass, statusIcon } = getStatusElements(order.status);
  const actionButtons = getActionButtons(order.status, order.order_id);

  return `
    <div class="order-card p-6 mb-4 bg-white rounded-lg shadow-sm" data-order-id="${order.order_id}">
      <div class="flex item items-center gap-y-4">
        <dl class="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
          <dt class="text-sm font-medium text-gray-500">Order ID:</dt>
          <dd class="mt-1 text-lg font-semibold text-gray-900">
            <a href="#" class="hover:text-primary-700 transition-colors">${orderIdDisplay}</a>
          </dd>
        </dl>

        <dl class="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1"style="width: 100px;">
          <dt class="text-sm font-medium text-gray-500">Date:</dt>
          <dd class="mt-1 text-lg font-semibold text-gray-900">${formattedDate}</dd>
        </dl>

        <dl class="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
          <dt class="text-sm font-medium text-gray-500">Price:</dt>
          <dd class="mt-1 text-lg font-semibold text-gray-900">${formattedPrice}</dd>
        </dl>

        <dl class="w-1/2 sm:w-1/4 lg:w-auto lg:flex-1">
          <dt class="text-sm font-medium text-gray-500">Status:</dt>
          <dd class="${statusClass} mt-1.5 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"style="width: 100px;">
            ${statusIcon}
            ${order.status.replace('_', ' ')}
          </dd>
        </dl>

        <div class="grid sm:grid-cols-${order.status === 'Waiting' ? '2' : '1'} lg:flex lg:w-64 lg:items-center lg:justify-end gap-4">
          ${actionButtons}
        </div>
      </div>
    </div>
  `;
}

// Get status-specific styling and icon
function getStatusElements(status) {
  const elements = {
    statusClass: '',
    statusIcon: ''
  };

  // Normalize status for comparison (remove underscores and convert to lowercase)
  const normalizedStatus = status.toLowerCase().replace('_', '');

  switch(normalizedStatus) {
    case 'accepted':
      elements.statusClass = 'bg-green-100 text-green-800';
      elements.statusIcon = `
        <svg class="me-1 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.5 11.5 11 14l4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
        </svg>`;
      break;
      
    case 'waiting':
      elements.statusClass = 'bg-yellow-100 text-yellow-800';
      elements.statusIcon = `
        <svg class="me-1 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
        </svg>`;
      break;
      
    case 'intransit':
      elements.statusClass = 'bg-blue-100 text-blue-800';
      elements.statusIcon = `
        <svg class="me-1 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2Zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2Z"/>
        </svg>`;
      break;
      
    case 'cancelled':
      elements.statusClass = 'bg-red-100 text-red-800';
      elements.statusIcon = `
        <svg class="me-1 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6"/>
        </svg>`;
      break;

    default:
      // Default styling for unknown statuses
      elements.statusClass = 'bg-gray-100 text-gray-800';
      elements.statusIcon = `
        <svg class="me-1 h-3 w-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 13V8m0 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
        </svg>`;
  }

  return elements;
}

// Get appropriate action buttons based on order status
function getActionButtons(status, orderId) {
    let buttons = '';
    
    switch(status) {
        case 'Waiting':
            buttons = `
                <button type="button" class="btn-cancel-order btn-danger w-full rounded-lg border border-red-600 px-3 py-2 text-center text-sm font-medium text-red-600 hover:bg-red-700 hover:text-white focus:outline-none focus:ring-4 focus:ring-red-300 transition-colors duration-200 lg:w-auto" data-order-id="${orderId}">
                    Cancel order
                </button>
                <a href="#" class="btn-view-details btn-outline-primary w-full inline-flex justify-center rounded-lg border border-primary-600 bg-transparent px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-100 focus:z-10 focus:outline-none focus:ring-4 focus:ring-primary-200 transition-colors duration-200 lg:w-auto" data-order-id="${orderId}">
                    View details
                </a>`;
            break;
            
        case 'In_transit':
            buttons = `
                <a href="#" class="btn-view-details btn-outline-primary w-full inline-flex justify-center rounded-lg border border-primary-600 bg-transparent px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-100 focus:z-10 focus:outline-none focus:ring-4 focus:ring-primary-200 transition-colors duration-200 lg:w-auto" data-order-id="${orderId}">
                    View details
                </a>`;
            break;
            
        default:
            buttons = `
                <a href="#" class="btn-view-details btn-outline-primary w-full inline-flex justify-center rounded-lg border border-primary-600 bg-transparent px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-100 focus:z-10 focus:outline-none focus:ring-4 focus:ring-primary-200 transition-colors duration-200 lg:w-auto" data-order-id="${orderId}">
                    View details
                </a>`;
    }
    
    return buttons;
}

// Set up event listeners for order cards
function setupOrderCardInteractions() {
    document.querySelectorAll('.btn-view-details').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const orderId = this.getAttribute('data-order-id');
            viewOrderDetails(orderId);
        });
    });

    document.querySelectorAll('.btn-cancel-order').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const orderId = this.getAttribute('data-order-id');
            confirmCancelOrder(orderId);
        });
    });
}

// Confirm order cancellation with SweetAlert
function confirmCancelOrder(orderId) {
    const order = allOrders.find(o => o.order_id == orderId);
    if (!order) {
        displayError('Order not found');
        return;
    }

    if (order.status !== 'Waiting') {
        displayError('This order cannot be cancelled as it has already been processed.');
        return;
    }

    Swal.fire({
        title: 'Cancel Order?',
        text: "Are you sure you want to cancel this order?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, cancel it!',
        cancelButtonText: 'No, keep it'
    }).then((result) => {
        if (result.isConfirmed) {
            cancelOrder(orderId);
        }
    });
}

// View order details (modal implementation)
function viewOrderDetails(orderId) {
    const order = allOrders.find(o => o.order_id == orderId);
    if (!order) {
        displayError('Order not found');
        return;
    }

    // Create and show modal
    const modal = document.createElement('div');
    modal.id = 'order-details-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = createOrderDetailsModalContent(order);
    document.body.appendChild(modal);
    
    // Add close button event
    modal.querySelector('.btn-close-modal').addEventListener('click', closeModal);
}

// Create modal content for order details
function createOrderDetailsModalContent(order) {
    const orderDate = new Date(order.order_date);
    const formattedDate = orderDate.toLocaleDateString('en-US', {
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Check if order can be modified (only for certain statuses)
    const canModify = ['Waiting', 'Processing'].includes(order.status);

    return `
    <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="sticky top-0 bg-white z-10 border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <div>
                <h3 class="text-2xl font-bold text-gray-800">Order #${order.order_id}</h3>
                <p class="text-gray-500 text-sm">Placed on ${formattedDate}</p>
            </div>
            <button class="btn-close-modal text-gray-400 hover:text-gray-600 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        
        <!-- Order Summary -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            <!-- Order Status Card -->
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 shadow-sm">
                <h4 class="font-semibold text-lg text-gray-700 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Order Status
                </h4>
                <div class="flex items-center">
                    <span class="${getStatusTextClass(order.status)} text-sm font-medium px-3 py-1 rounded-full">
                        ${order.status.replace('_', ' ')}
                    </span>
                    <span class="ml-auto text-2xl font-bold text-gray-800">$${order.total_amount.toFixed(2)}</span>
                </div>
                <div class="mt-4 grid grid-cols-2 gap-3">
                    <div>
                        <p class="text-sm text-gray-500">Payment Method</p>
                        <p class="font-medium">${order.payment_method}</p>
                    </div>
                    <div>
                        <p class="text-sm text-gray-500">Delivery</p>
                        <p class="font-medium">${order.delivery_method || 'Standard'}</p>
                    </div>
                </div>
            </div>
            
            <!-- Delivery Address Card -->
            <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 shadow-sm">
                <h4 class="font-semibold text-lg text-gray-700 mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Delivery Address
                </h4>
                <div class="space-y-1">
                    <p class="font-medium">${order.delivery_address.street}</p>
                    <p class="text-gray-600">Apartment/Unit: ${order.delivery_address.apt_number}</p>
                    <p class="text-gray-600">${order.delivery_address.city}, ${order.delivery_address.state} ${order.delivery_address.zip}</p>
                </div>
            </div>
        </div>
        
        <!-- Order Items -->
        <div class="px-6 pb-6">
            <h4 class="font-semibold text-lg text-gray-700 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Order Items (${order.items.length})
            </h4>
            
            <div class="space-y-4"style="overflow: auto;height: 300px;">
                ${order.items.map(item => {
                    const hasOffer = item.offer_price && item.offer_price < item.price;
                    const displayPrice = hasOffer ? item.offer_price : item.price;
                    const discountPercentage = hasOffer 
                        ? Math.round(((item.price - item.offer_price) / item.price * 100))
                        : 0;

                    return `
                    <div class="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div class="flex items-start"style="justify-content: space-around;">
                            <img src="${item.image || 'images/default-product.png'}" 
                                alt="${item.name}" 
                                class="w-20 h-20 object-contain rounded-lg mr-4 border border-gray-200">
                            
                            <div class="flex-grow">
                                <div class="flex justify-between">
                                    <h5 class="font-medium text-gray-800">${item.name}</h5>
                                    <span class="font-bold text-gray-900">$${displayPrice.toFixed(2)}</span>
                                </div>
                                
                                ${hasOffer ? `
                                <div class="mt-1 flex items-center">
                                    <span class="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded">${discountPercentage}% OFF</span>
                                    <span class="text-xs text-gray-500 ml-2 line-through">$${item.price.toFixed(2)}</span>
                                </div>
                                ` : ''}
                                
                                <div class="mt-3 flex items-center justify-between"style="display: flex;flex-direction: column;">
                                    <div class="flex items-center"style="display: flex;gap: 175px;">
                                        <span class="text-gray-500 mr-3">Quantity: ${item.quantity}</span>
                                        ${canModify ? `
                                        <button onclick="showUpdateQuantityDialog(${order.order_id}, ${item.product_id}, ${item.quantity}, '${escapeHtml(item.name)}')" 
                                                class="text-blue-600 hover:text-blue-800 text-sm flex items-center transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                            Edit
                                        </button>
                                        ` : ''}
                                    </div>
                                    
                                    <div class="flex items-center"style="display: flex;gap: 125px;">
                                        <span class="text-sm text-gray-500">Subtotal: <span class="font-medium">$${item.subtotal.toFixed(2)}</span></span>
                                        
                                        ${canModify ? `
                                        <button onclick="showRemoveProductDialog(${order.order_id}, ${item.product_id}, '${escapeHtml(item.name)}')" 
                                                class="ml-4 text-red-600 hover:text-red-800 text-sm flex items-center transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Remove
                                        </button>
                                        ` : ''}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <!-- Order Summary Footer -->
        <div class="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
            <div class="flex justify-between items-center">
                ${canModify ? `
                <button onclick="confirmCancelOrder(${order.order_id})" 
                        class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors">
                    Cancel Order
                </button>
                ` : `
                <div></div>
                `}
                
                <div class="text-right">
                    <p class="text-gray-500">Total: <span class="text-2xl font-bold text-gray-800 ml-2">$${order.total_amount.toFixed(2)}</span></p>
                </div>
            </div>
        </div>
    </div>
    `;
}

// Get status text class for modal
function getStatusTextClass(status) {
  switch(status) {
    case 'Accepted': return 'text-green-600 bg-green-100 px-2 py-1 rounded';
    case 'Waiting': return 'text-yellow-600 bg-yellow-100 px-2 py-1 rounded';
    case 'In_transit': return 'text-blue-600 bg-blue-100 px-2 py-1 rounded';
    case 'Cancelled': return 'text-red-600 bg-red-100 px-2 py-1 rounded';
    default: return 'text-gray-600 bg-gray-100 px-2 py-1 rounded';
  }
}

// Close modal
function closeModal() {
  const modal = document.getElementById('order-details-modal');
  if (modal) modal.remove();
}

// Cancel order function
function cancelOrder(orderId) {
  showLoading(true);
  
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/projData/php/cancel_order.php", true);
  xhr.setRequestHeader("Content-Type", "application/json");
  
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      showLoading(false);
      
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success) {
            // Update local orders array and re-render
            const orderIndex = allOrders.findIndex(o => o.order_id == orderId);
            if (orderIndex !== -1) {
              allOrders[orderIndex].status = 'Cancelled';
              renderOrders(currentPage); // Stay on current page after cancellation
            }
            
            // Update the summary and reload charts
            if (response.data.summary) {
              updateOrderSummary(response.data.summary);
            }
            
            // Reload charts with updated data
            if (response.data.charts) {
              initCharts(response.data.charts);
            } else {
              // If no chart data in response, fetch fresh data
              loadOrders();
            }
            
            Swal.fire(
              'Cancelled!',
              'Your order has been cancelled.',
              'success'
            );
          } else {
            displayError(response.error || 'Failed to cancel order');
          }
        } catch (error) {
          console.error('JSON parse error:', error);
          displayError('Failed to process server response');
        }
      } else {
        displayError('Request failed with status: ' + xhr.status);
      }
    }
  };
  
  xhr.onerror = function() {
    showLoading(false);
    displayError('Network error occurred while trying to cancel the order');
  };
  
  xhr.send(JSON.stringify({ 
    order_id: orderId,
    customer_id: getLoggedInCustomerId() 
  }));
}

// Update order summary in the UI
function updateOrderSummary() {
    if (!filteredOrders || filteredOrders.length === 0) {
        document.getElementById('total-orders').textContent = 0;
        document.getElementById('total-spent').textContent = '$0.00';
        document.getElementById('avg-order').textContent = '$0.00';
        return;
    }

    // Filter out cancelled orders for spending calculations
    const nonCancelledOrders = filteredOrders.filter(order => order.status !== 'Cancelled');

    const totalOrders = filteredOrders.length;
    const totalSpent = nonCancelledOrders.reduce((sum, order) => sum + order.total_amount, 0);
    
    // Calculate average order value excluding cancelled orders
    const avgOrderValue = nonCancelledOrders.length > 0 
        ? totalSpent / nonCancelledOrders.length 
        : 0;

    // Get current filter values
    const statusFilter = document.getElementById('order-type').value;
    const monthFilter = document.getElementById('month-filter').value;

    // Create filter description
    let filterDesc = '';
    if (statusFilter !== 'all') {
        filterDesc += `Status: ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`;
    }
    if (monthFilter !== 'all') {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        if (filterDesc) filterDesc += ' | ';
        filterDesc += `Month: ${monthNames[parseInt(monthFilter) - 1]}`;
    }
  
    document.getElementById('total-orders').textContent = totalOrders;
    document.getElementById('total-spent').textContent = `$${totalSpent.toFixed(2)}`;
    document.getElementById('avg-order').textContent = `$${avgOrderValue.toFixed(2)}`;
    
    // Update first/last order dates if elements exist (include all orders including cancelled)
    if (filteredOrders.length > 0) {
        let orderDates = filteredOrders.map(order => new Date(order.order_date));
        orderDates.sort((a, b) => a - b);
        
        const firstOrderDate = orderDates[0];
        const lastOrderDate = orderDates[orderDates.length - 1];

        if (document.getElementById('first-order-date')) {
            document.getElementById('first-order-date').textContent = 
                firstOrderDate.toLocaleDateString();
        }
        if (document.getElementById('last-order-date')) {
            document.getElementById('last-order-date').textContent = 
                lastOrderDate.toLocaleDateString();
        }
    }
}

// Initialize charts
function initCharts(chartData) {
    // Destroy existing charts if they exist
    if (monthlySpendingChart) {
        monthlySpendingChart.destroy();
    }
    if (orderStatusChart) {
        orderStatusChart.destroy();
    }

    // Get current filter values to determine chart type
    const monthFilter = document.getElementById('month-filter').value;
    const yearFilter = document.getElementById('year-filter')?.value;

    // Monthly/Daily Spending Chart
    const monthlyCtx = document.getElementById('monthlySpendingChart');
    if (monthlyCtx) {
        const labels = chartData.monthly_spending.map(item => {
            if (monthFilter === 'all' && (!yearFilter || yearFilter === 'all')) {
                // Show month names for yearly view
                const [year, month] = item.month.split('-');
                return new Date(year, month - 1).toLocaleDateString('en-US', { 
                    month: 'short', 
                    year: 'numeric' 
                });
            } else {
                // Show day numbers for monthly view
                return item.month;
            }
        });

        const values = chartData.monthly_spending.map(item => item.total);

        monthlySpendingChart = new Chart(monthlyCtx.getContext('2d'), {
            type: (monthFilter === 'all' && (!yearFilter || yearFilter === 'all')) ? 'line' : 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: (monthFilter === 'all' && (!yearFilter || yearFilter === 'all')) 
                        ? 'Monthly Spending ($)' 
                        : 'Daily Spending ($)',
                    data: values,
                    borderColor: 'rgba(79, 70, 229, 0.8)',
                    backgroundColor: (monthFilter === 'all' && (!yearFilter || yearFilter === 'all')) 
                        ? 'rgba(79, 70, 229, 0.1)' 
                        : 'rgba(79, 70, 229, 0.6)',
                    tension: 0.3,
                    fill: (monthFilter === 'all' && (!yearFilter || yearFilter === 'all')),
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: (monthFilter === 'all' && (!yearFilter || yearFilter === 'all'))
                            ? 'Monthly Spending'
                            : `Daily Spending for ${getCurrentFilterDescription()}`,
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `$${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                }
            }
        });
    }

    // Order Status Chart
    const statusCtx = document.getElementById('orderStatusChart');
    if (statusCtx) {
        const statusLabels = chartData.status_distribution.map(item => 
            item.status.replace('_', ' ')
        );
        const statusData = chartData.status_distribution.map(item => item.count);
        const statusColors = chartData.status_distribution.map(item => {
            switch(item.status) {
                case 'Accepted': return 'rgba(75, 192, 192, 0.7)';
                case 'Waiting': return 'rgba(255, 206, 86, 0.7)';
                case 'In_transit': return 'rgba(54, 162, 235, 0.7)';
                case 'Cancelled': return 'rgba(255, 99, 132, 0.7)';
                default: return 'rgba(153, 102, 255, 0.7)';
            }
        });

        orderStatusChart = new Chart(statusCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: statusLabels,
                datasets: [{
                    data: statusData,
                    backgroundColor: statusColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: `Order Status Distribution (${getCurrentFilterDescription()})`,
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        position: 'bottom',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const value = context.raw;
                                const percentage = Math.round((value / total) * 100);
                                return `${context.label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

function getCurrentFilterDescription() {
    const monthFilter = document.getElementById('month-filter').value;
    const yearFilter = document.getElementById('year-filter')?.value;
    
    if (monthFilter === 'all' && (!yearFilter || yearFilter === 'all')) {
        return 'Last 12 Months';
    }
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    let desc = '';
    if (monthFilter !== 'all') {
        desc += monthNames[parseInt(monthFilter) - 1];
    }
    if (yearFilter && yearFilter !== 'all') {
        if (desc) desc += ' ';
        desc += yearFilter;
    }
    
    return desc || 'All Time';
}
// Show loading state
function showLoading(show) {
  const loader = document.getElementById('loading-indicator');
  if (loader) loader.style.display = show ? 'block' : 'none';
}

// Display error message
function displayError(message) {
  const errorContainer = document.getElementById('error-container');
  if (errorContainer) {
    errorContainer.innerHTML = `
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong class="font-bold">Error!</strong>
        <span class="block sm:inline">${message}</span>
        <span class="absolute top-0 bottom-0 right-0 px-4 py-3">
          <svg class="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <title>Close</title>
            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
          </svg>
        </span>
      </div>`;
    
    // Add click event to close error
    errorContainer.querySelector('svg').addEventListener('click', () => {
      errorContainer.innerHTML = '';
    });
  }
}

// Show success message
function showSuccess(message) {
  const successContainer = document.getElementById('success-container');
  if (successContainer) {
    successContainer.innerHTML = `
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
        <strong class="font-bold">Success!</strong>
        <span class="block sm:inline">${message}</span>
        <span class="absolute top-0 bottom-0 right-0 px-4 py-3">
          <svg class="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <title>Close</title>
            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
          </svg>
        </span>
      </div>`;
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      successContainer.innerHTML = '';
    }, 3000);
  }
}

// Set up global event listeners
function setupEventListeners() {
    // Set default filter values
    document.getElementById('order-type').value = 'all';
    document.getElementById('month-filter').value = 'all';

    // Filter event listeners
    const orderTypeSelect = document.getElementById('order-type');
    const monthFilterSelect = document.getElementById('month-filter');

    if (orderTypeSelect && monthFilterSelect) {
        orderTypeSelect.addEventListener('change', applyFilters);
        monthFilterSelect.addEventListener('change', applyFilters);
    }
    
    // Close modal when clicking outside content
    document.addEventListener('click', (e) => {
        const modal = document.getElementById('order-details-modal');
        if (modal && e.target === modal) {
            closeModal();
        }
    });
}

function resetFilters() {
    document.getElementById('order-type').value = 'all';
    document.getElementById('month-filter').value = 'all';
    if (document.getElementById('year-filter')) {
        document.getElementById('year-filter').value = 'all';
    }
    applyFilters();
}

function updateCharts() {
    // Prepare data for charts based on filtered orders
    const chartData = prepareChartData();
    
    // Update or initialize charts with new data
    initCharts(chartData);
}

function prepareChartData() {
    const chartData = {
        monthly_spending: [],
        status_distribution: []
    };

    // Filter out cancelled orders for spending calculations
    const nonCancelledOrders = filteredOrders.filter(order => order.status !== 'Cancelled');

    const monthFilter = document.getElementById('month-filter').value;
    const yearFilter = document.getElementById('year-filter')?.value;

    if (monthFilter === 'all' && (!yearFilter || yearFilter === 'all')) {
        // Show last 12 months when no specific month/year is selected
        const monthlyData = {};
        const now = new Date();
        
        for (let i = 0; i < 12; i++) {
            const date = new Date(now);
            date.setMonth(now.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            monthlyData[monthKey] = 0;
        }

        // Calculate totals for each month (excluding cancelled orders)
        nonCancelledOrders.forEach(order => {
            const orderDate = new Date(order.order_date);
            const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            
            if (monthlyData[monthKey] !== undefined) {
                monthlyData[monthKey] += order.total_amount;
            }
        });

        // Convert to array format
        chartData.monthly_spending = Object.entries(monthlyData)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, total]) => ({ month, total }));
    } else {
        // For specific month/year selection, show daily data
        const dailyData = {};
        const daysInMonth = monthFilter !== 'all' ? 
            new Date(yearFilter || new Date().getFullYear(), monthFilter, 0).getDate() : 31;

        for (let day = 1; day <= daysInMonth; day++) {
            dailyData[day] = 0;
        }

        // Calculate totals for each day (excluding cancelled orders)
        nonCancelledOrders.forEach(order => {
            const orderDate = new Date(order.order_date);
            const day = orderDate.getDate();
            
            if (dailyData[day] !== undefined) {
                dailyData[day] += order.total_amount;
            }
        });

        // Convert to monthly_spending format but with days
        chartData.monthly_spending = Object.entries(dailyData)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .map(([day, total]) => ({ 
                month: `Day ${day}`, 
                total 
            }));
    }

    // Prepare status distribution data (include all statuses)
    const statusCounts = {};
    filteredOrders.forEach(order => {
        statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    chartData.status_distribution = Object.entries(statusCounts)
        .map(([status, count]) => ({ status, count }));

    return chartData;
}

function showRemoveProductDialog(orderId, productId, productName) {
    Swal.fire({
        title: 'Remove Product',
        html: `Are you sure you want to remove <strong>${productName}</strong> from this order?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, remove it!',
        cancelButtonText: 'Cancel',
        showLoaderOnConfirm: true,
        preConfirm: () => {
            return updateOrderItems(orderId, {
                action: 'remove_product',
                product_id: productId
            })
            .then((result) => {
                return result; // Return the result which may include order_cancelled flag
            })
            .catch(error => {
                Swal.showValidationMessage(`Request failed: ${error}`);
            });
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed && result.value.success) {
            if (result.value.orderCancelled) {
                Swal.fire(
                    'Order Cancelled!',
                    result.value.message,
                    'success'
                ).then(() => {
                    // Reload the page to reflect changes
                    location.reload();
                });
            } else {
                Swal.fire(
                    'Removed!',
                    `${productName} has been removed from the order.`,
                    'success'
                ).then(() => {
                    // Reload the page to reflect changes
                    location.reload();
                });
            }
        }
    });
}

function showUpdateQuantityDialog(orderId, productId, currentQty, productName) {
    Swal.fire({
        title: 'Update Quantity',
        html: `Enter new quantity for <strong>${productName}</strong>`,
        input: 'number',
        inputValue: currentQty,
        inputAttributes: {
            min: 1,
            max: 100,
            step: 1
        },
        showCancelButton: true,
        confirmButtonText: 'Update',
        cancelButtonText: 'Cancel',
        showLoaderOnConfirm: true,
        inputValidator: (value) => {
            if (!value) {
                return 'Please enter a quantity!';
            }
            if (value < 1) {
                return 'Quantity must be at least 1!';
            }
            if (value > 100) {
                return 'Maximum quantity is 100!';
            }
        },
        preConfirm: (quantity) => {
            return updateOrderItems(orderId, {
                action: 'update_quantity',
                product_id: productId,
                quantity: quantity
            })
            .then(() => {
                return { success: true, quantity: quantity };
            })
            .catch(error => {
                Swal.showValidationMessage(`Request failed: ${error}`);
            });
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then((result) => {
        if (result.isConfirmed && result.value.success) {
            Swal.fire(
                'Updated!',
                `Quantity for ${productName} has been updated to ${result.value.quantity}.`,
                'success'
            ).then(() => {
                // Reload the page to reflect changes
                location.reload();
            });
        }
    });
}

function updateOrderItems(orderId, data) {
    return new Promise((resolve, reject) => {
        showLoading(true);
        
        fetch('/projData/php/update_order_items.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                order_id: orderId,
                ...data
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            showLoading(false);
            if (data.success) {
                resolve(data);
            } else {
                reject(data.error || 'Unknown error');
            }
        })
        .catch(error => {
            showLoading(false);
            reject(error);
        });
    });
}

function getStatusTextClass(status) {
    switch(status) {
        case 'Accepted': return 'text-green-600 bg-green-100 px-2 py-1 rounded';
        case 'Waiting': return 'text-yellow-600 bg-yellow-100 px-2 py-1 rounded';
        case 'In_transit': return 'text-blue-600 bg-blue-100 px-2 py-1 rounded';
        case 'Cancelled': return 'text-red-600 bg-red-100 px-2 py-1 rounded';
        default: return 'text-gray-600 bg-gray-100 px-2 py-1 rounded';
    }
}

function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
