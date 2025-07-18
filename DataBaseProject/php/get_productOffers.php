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

$product_id = isset($_GET['id']) ? intval($_GET['id']) : null;
$search_query = isset($_GET['q']) ? trim($_GET['q']) : null;

$sql = "
    SELECT
        p.product_id,
        p.name,
        p.price AS original_price,
        p.rate,
        p.views_count,
        p.category_id,
        p.description_product,
        p.image,
        o.offers_id,
        o.title AS offer_title,
        o.discount_percentage,
        o.start_date,
        o.end_date,
        o.status_offer,
        COALESCE(SUM(wp.total_stock_quantity), 0) AS warehouse_quantity
    FROM Product p
    LEFT JOIN Product_Offers po ON p.product_id = po.product_id
    LEFT JOIN Offers o ON po.offers_id = o.offers_id
        AND o.status_offer = 'Active'
        AND o.start_date <= CURRENT_DATE
        AND o.end_date >= CURRENT_DATE
    LEFT JOIN Warehouse_Product wp ON p.product_id = wp.product_id
";

$conditions = [];
$params = [];
$types = "";

if ($product_id !== null) {
    $conditions[] = "p.product_id = ?";
    $types .= "i";
    $params[] = $product_id;
}

if ($search_query !== null && $search_query !== "") {
    $conditions[] = "p.name LIKE ?";
    $types .= "s";
    $params[] = "%" . $search_query . "%";
}

if (!empty($conditions)) {
    $sql .= " WHERE " . implode(" AND ", $conditions);
}

// Add GROUP BY to properly aggregate warehouse quantities
$sql .= " GROUP BY p.product_id";

$stmt = $conn->prepare($sql);

if (!empty($params)) {
    $stmt->bind_param($types, ...$params);
}

$stmt->execute();
$result = $stmt->get_result();

$products = [];

while ($row = $result->fetch_assoc()) {
    $price = (float)$row["original_price"];
    $offer = null;

    if ($row["offers_id"] && strtolower($row["status_offer"]) === 'active') {
        $discount = (float)$row["discount_percentage"];
        $price = round($price - ($price * $discount / 100), 2);

        $offer = [
            "offers_id" => (int)$row["offers_id"],
            "title" => $row["offer_title"],
            "discount_percentage" => $discount,
            "start_date" => $row["start_date"],
            "end_date" => $row["end_date"]
        ];
    }

    $product = [
        "product_id" => $row["product_id"],
        "name" => $row["name"],
        "original_price" => (float)$row["original_price"],
        "price" => $price,
        "rate" => (float)$row["rate"],
        "views_count" => (int)$row["views_count"],
        "category_id" => (int)$row["category_id"],
        "description_product" => $row["description_product"],
        "image" => $row["image"],
        "warehouse_quantity" => (int)$row["warehouse_quantity"],
        "offer" => $offer
    ];

    $products[] = $product;
}

$maxPriceQuery = "SELECT MAX(price) as max_price FROM Product";
$maxPriceResult = $conn->query($maxPriceQuery);
$maxPriceRow = $maxPriceResult->fetch_assoc();
$maxPrice = $maxPriceRow['max_price'];

if (isset($_GET['get_max_price'])) {
    $response = [
        'products' => $products,
        'maxPrice' => $maxPrice
    ];
    echo json_encode($response);
} else {
    echo json_encode($product_id !== null && count($products) > 0 ? $products[0] : $products);
}

$conn->close();
?>