<?php
header('Content-Type: application/json');

$servername = "localhost";
$username = "root";
$password = "";
$database = "Yasmeem_Agricultural_Company";
$port = 3307;

$conn = new mysqli($servername, $username, $password, $database, $port);
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Connection failed: ' . $conn->connect_error]);
    exit;
}

$customer_id = 1; // Replace with actual logged-in customer ID

// Check if customer has a cart
$check_cart_sql = "SELECT cart_id FROM Cart WHERE customer_id = ?";
$check_stmt = $conn->prepare($check_cart_sql);
if (!$check_stmt) {
    echo json_encode(['success' => false, 'error' => 'Prepare failed: ' . $conn->error]);
    exit;
}

$check_stmt->bind_param("i", $customer_id);
if (!$check_stmt->execute()) {
    echo json_encode(['success' => false, 'error' => 'Execute failed: ' . $check_stmt->error]);
    exit;
}

$check_result = $check_stmt->get_result();
if ($check_result->num_rows === 0) {
    echo json_encode(['success' => false, 'error' => 'No cart found for customer']);
    exit;
}

// Main query - Fixed to properly handle discounts
$sql = "
    SELECT
        p.product_id,
        p.name,
        p.price,
        p.image,
        ci.quantity,
        c.category_name,
        GREATEST(COALESCE(o.discount_percentage, 0), 0) AS discount_percent,
        (p.price * ci.quantity) AS subtotal,
        (p.price * ci.quantity * (1 - GREATEST(COALESCE(o.discount_percentage, 0), 0) / 100)) AS discounted_total
        FROM Cart_Items ci
        JOIN Cart ct ON ci.cart_id = ct.cart_id AND ct.customer_id = ?
        JOIN Product p ON ci.product_id = p.product_id
        JOIN Category c ON p.category_id = c.category_id
        LEFT JOIN Product_Offers po ON p.product_id = po.product_id
        LEFT JOIN Offers o ON po.offers_id = o.offers_id
        AND o.status_offer = 'Active'
        AND o.start_date <= CURRENT_DATE
        AND o.end_date >= CURRENT_DATE
    ";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(['success' => false, 'error' => 'Query preparation failed: ' . $conn->error]);
    exit;
}

$stmt->bind_param("i", $customer_id);
if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'error' => 'Query execution failed: ' . $stmt->error]);
    exit;
}

$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'error' => 'No items found in cart',
        'debug_info' => [
            'customer_id' => $customer_id,
            'query' => $sql
        ]
    ]);
    exit;
}

// Process results
$cart_items = [];
$grand_total = 0;
$total_discount = 0;

while ($row = $result->fetch_assoc()) {
    // Ensure discount is properly calculated
    $discount = max(0, min(100, (float)$row['discount_percent'])); // Ensure discount is between 0-100
    $subtotal = (float)$row['subtotal'];
    $discounted_total = (float)$row['discounted_total'];
    
    $cart_items[] = [
        'product_id' => (int)$row['product_id'],
        'name' => $row['name'],
        'price' => (float)$row['price'],
        'image' => $row['image'],
        'quantity' => (int)$row['quantity'],
        'category' => $row['category_name'],
        'discount_percent' => $discount,
        'subtotal' => $subtotal,
        'discounted_price' => $discounted_total,
        'you_save' => ($subtotal - $discounted_total)
    ];

    $grand_total += $discounted_total;
    $total_discount += ($subtotal - $discounted_total);
}

echo json_encode([
    'success' => true,
    'data' => [
        'items' => $cart_items,
        'summary' => [
            'total_items' => count($cart_items),
            'total_quantity' => array_sum(array_column($cart_items, 'quantity')),
            'subtotal' => array_sum(array_column($cart_items, 'subtotal')),
            'total_discount' => $total_discount,
            'grand_total' => $grand_total
        ]
    ]
]);

$conn->close();
?>