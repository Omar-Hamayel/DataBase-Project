<?php
header('Content-Type: application/json');

$servername = "localhost";
$username = "root";
$password = "";
$database = "Yasmeem_Agricultural_Company";
$port = 3307;

$conn = new mysqli($servername, $username, $password, $database, $port);
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => $conn->connect_error]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$product_id = $data['product_id'] ?? null;
$quantity = $data['quantity'] ?? null;
$customer_id = 1; // Replace with session-based ID if needed

if (!$product_id || !$quantity) {
    echo json_encode(['success' => false, 'error' => 'Missing data']);
    exit;
}

$query = "
    UPDATE Cart_Items ci
    JOIN Cart c ON ci.cart_id = c.cart_id
    SET ci.quantity = ?
    WHERE ci.product_id = ? AND c.customer_id = ?
";

$stmt = $conn->prepare($query);
$stmt->bind_param("iii", $quantity, $product_id, $customer_id);
$success = $stmt->execute();

echo json_encode(['success' => $success]);
?>
