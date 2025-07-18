<?php
header('Content-Type: application/json');

// DB connection
$servername = "localhost";
$username = "root";
$password = "";
$database = "Yasmeem_Agricultural_Company";
$port = 3307;

$conn = new mysqli($servername, $username, $password, $database, $port);
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$product_id = isset($data['product_id']) ? intval($data['product_id']) : null;
$rating = isset($data['rating']) ? floatval($data['rating']) : null;

if (!$product_id || !$rating || $rating < 1 || $rating > 5) {
    http_response_code(400);
    echo json_encode(["error" => "Invalid input"]);
    exit;
}

// Save rating
$stmt = $conn->prepare("INSERT INTO Product_Rating (product_id, rating) VALUES (?, ?)");
$stmt->bind_param("id", $product_id, $rating);
$stmt->execute();

// Calculate new average
$result = $conn->query("SELECT AVG(rating) AS avg_rating FROM Product_Rating WHERE product_id = $product_id");
$row = $result->fetch_assoc();
$new_average = round($row['avg_rating'], 1);

// Update the Product table with the new average rating
$updateStmt = $conn->prepare("UPDATE Product SET rate = ? WHERE product_id = ?");
$updateStmt->bind_param("di", $new_average, $product_id);
$updateStmt->execute();

echo json_encode([
    "success" => true,
    "new_average" => $new_average
]);
?>
