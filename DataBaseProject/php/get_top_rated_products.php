<?php
header('Content-Type: application/json');

$servername = "localhost";
$username = "root";
$password = "";
$database = "Yasmeem_Agricultural_Company";
$port = 3307;

// Establish mysqli connection
$conn = new mysqli($servername, $username, $password, $database, $port);

// Check connection
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => "Connection failed: " . $conn->connect_error]);
    exit;
}

try {
    $query = "
        SELECT
            p.product_id,
            p.name,
            p.price, -- This will be considered the original_price in PHP
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
            o.status_offer
        FROM Product p
        LEFT JOIN Product_Offers po ON p.product_id = po.product_id
        LEFT JOIN Offers o ON po.offers_id = o.offers_id
            AND o.start_date <= CURDATE()
            AND o.end_date >= CURDATE()
        WHERE p.rate IS NOT NULL
        ORDER BY p.rate DESC, p.views_count DESC
        LIMIT 10";

    // Prepare the statement
    $stmt = $conn->prepare($query);

    if (!$stmt) {
        echo json_encode(['success' => false, 'error' => "Failed to prepare statement: " . $conn->error]);
        exit;
    }

    // Execute the statement
    $stmt->execute();

    // Get the result set
    $result = $stmt->get_result();

    $products = [];
    if ($result->num_rows > 0) {
        // Fetch all rows and process offers in PHP
        while ($row = $result->fetch_assoc()) {
            $original_price = (float)$row["price"]; // This is the base price from Product table
            $calculated_price = $original_price; // Start with original price
            $offer = null;

            // Check if there's an active offer from the joined data
            if ($row["offers_id"] && strtolower($row["status_offer"]) === 'active') {
                $discount = (float)$row["discount_percentage"];
                // Calculate the discounted price
                $calculated_price = round($original_price - ($original_price * $discount / 100), 2);

                $offer = [
                    "offers_id" => (int)$row["offers_id"],
                    "title" => $row["offer_title"],
                    "discount_percentage" => $discount,
                    "start_date" => $row["start_date"],
                    "end_date" => $row["end_date"]
                ];
            }

            // Construct the product array, including the original_price and the potentially discounted price
            $product = [
                "product_id" => (int)$row["product_id"],
                "name" => $row["name"],
                "original_price" => $original_price, // The product's base price
                "price" => $calculated_price, // The final (potentially discounted) price
                "rate" => (float)$row["rate"],
                "views_count" => (int)$row["views_count"],
                "category_id" => (int)$row["category_id"],
                "description_product" => $row["description_product"],
                "image" => $row["image"],
                "offer" => $offer // Nested offer object
            ];
            $products[] = $product;
        }
    }

    // Close the statement
    $stmt->close();

    // Encode and echo the products as JSON
    echo json_encode($products);

} catch (Exception $e) {
    echo json_encode(['error' => $e->getMessage()]);
} finally {
    // Close the connection
    if ($conn) {
        $conn->close();
    }
}
?>