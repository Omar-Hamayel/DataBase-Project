<?php
header('Content-Type: application/json');

// connection stting
$servername = "localhost";
$username = "root";
$password = "";
$database = "Yasmeem_Agricultural_Company";
$port = 3307;

// create connection
$conn = new mysqli($servername, $username, $password, $database, $port);

// Check the connection
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["error" => "Connection failed: " . $conn->connect_error]);
    exit;
}
// Query to get category data
$sql = "SELECT category_id, category_name, image FROM Category";
$result = $conn->query($sql);
$categories = [];
// Check and display results
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $categories[] = $row;
    }
}

header('Content-Type: application/json');
echo json_encode($categories);

// Close connection
$conn->close();
?>
