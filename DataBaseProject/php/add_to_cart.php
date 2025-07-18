<?php
header('Content-Type: application/json');

$servername = "localhost";
$username = "root";
$password = "";
$database = "Yasmeem_Agricultural_Company";
$port = 3307;

$conn = new mysqli($servername, $username, $password, $database, $port);

if ($conn->connect_error) {
    echo json_encode([
        'success' => false,
        'error' => "Connection failed: " . $conn->connect_error
    ]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        'success' => false,
        'error' => 'Invalid JSON data'
    ]);
    exit;
}

if (!isset($data['product_id'])) {
    echo json_encode([
        'success' => false,
        'error' => 'Product ID is required'
    ]);
    exit;
}

// Hardcoded customer_id
$customer_id = 1;

// Check if customer exists
$customerCheck = $conn->prepare("SELECT customer_id FROM Customer WHERE customer_id = ?");
$customerCheck->bind_param("i", $customer_id);
$customerCheck->execute();
$customerCheck->store_result();

if ($customerCheck->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'error' => 'Customer not found. Please log in first.'
    ]);
    exit;
}

$product_id = (int)$data['product_id'];
$quantity = isset($data['quantity']) ? max(1, (int)$data['quantity']) : 1;

$productCheck = $conn->prepare("SELECT product_id FROM Product WHERE product_id = ?");
$productCheck->bind_param("i", $product_id);
$productCheck->execute();
$productCheck->store_result();

if ($productCheck->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'error' => 'Product not found'
    ]);
    exit;
}

$cart_id = 0;
$cartCheck = $conn->prepare("SELECT cart_id FROM Cart WHERE customer_id = ?");
$cartCheck->bind_param("i", $customer_id);
$cartCheck->execute();
$cartResult = $cartCheck->get_result();

if ($cartResult->num_rows === 0) {
    $createCart = $conn->prepare("INSERT INTO Cart (customer_id) VALUES (?)");
    $createCart->bind_param("i", $customer_id);
    if (!$createCart->execute()) {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to create cart'
        ]);
        exit;
    }
    $cart_id = $conn->insert_id;
} else {
    $cartRow = $cartResult->fetch_assoc();
    $cart_id = $cartRow['cart_id'];
}

$itemCheck = $conn->prepare("SELECT quantity FROM Cart_Items WHERE cart_id = ? AND product_id = ?");
$itemCheck->bind_param("ii", $cart_id, $product_id);
$itemCheck->execute();
$itemResult = $itemCheck->get_result();

if ($itemResult->num_rows > 0) {
    echo json_encode([
        'success' => false,
        'error' => 'Product already exists in the cart'
    ]);
    exit;
} else {
    $addItem = $conn->prepare("INSERT INTO Cart_Items (cart_id, product_id, quantity) VALUES (?, ?, ?)");
    $addItem->bind_param("iii", $cart_id, $product_id, $quantity);
    $success = $addItem->execute();

    if ($success) {
        echo json_encode([
            'success' => true,
            'message' => 'Product added to cart',
            'quantity' => $quantity,
            'cart_id' => $cart_id
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'error' => 'Failed to add product to cart',
            'db_error' => $conn->error
        ]);
    }
}

$conn->close();
?>