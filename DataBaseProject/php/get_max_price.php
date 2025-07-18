<?php
header('Content-Type: application/json');


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

$query = "SELECT MAX(price) AS max_price FROM Product";
$result = mysqli_query($your_db_connection, $query);

if ($result) {
    $row = mysqli_fetch_assoc($result);
    $maxPrice = $row['max_price'];
    echo json_encode(['success' => true, 'max_price' => $maxPrice]);
} else {
    echo json_encode(['success' => false, 'error' => 'Could not fetch max price.']);
}


echo json_encode(['success' => true, 'max_price' => 1500]); // Example max price

?>