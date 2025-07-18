<?php
header('Content-Type: application/json');

// Database connection
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

// Set customer_id to 1 as requested
$customer_id = 1;

// Get all orders with their products
$sql = "
    SELECT 
        o.order_id,
        o.order_date,
        o.city AS delivery_city,
        o.street AS delivery_street,
        o.apt_number,
        o.payment_method,
        o.status_of_order AS status,
        p.product_id,
        p.name AS product_name,
        p.price,
        p.image,
        od.quantity,
        COALESCE(
            (SELECT p.price * (1 - off.discount_percentage / 100)
             FROM Product_Offers po
             JOIN Offers off ON po.offers_id = off.offers_id
             WHERE po.product_id = p.product_id
             AND CURDATE() BETWEEN off.start_date AND off.end_date
             AND off.status_offer = 'Active'
             LIMIT 1),
            p.price
        ) AS final_price,
        COALESCE(
            (SELECT p.price * (1 - off.discount_percentage / 100)
             FROM Product_Offers po
             JOIN Offers off ON po.offers_id = off.offers_id
             WHERE po.product_id = p.product_id
             AND CURDATE() BETWEEN off.start_date AND off.end_date
             AND off.status_offer = 'Active'
             LIMIT 1),
            p.price
        ) * od.quantity AS subtotal
    FROM Order_Table o
    JOIN Order_Details od ON o.order_id = od.order_id
    JOIN Product p ON od.product_id = p.product_id
    WHERE o.customer_id = ?
    ORDER BY o.order_id";

$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(['success' => false, 'error' => 'Query prep failed: '.$conn->error]);
    exit;
}

$stmt->bind_param("i", $customer_id);

if (!$stmt->execute()) {
    echo json_encode(['success' => false, 'error' => 'Query exec failed: '.$stmt->error]);
    exit;
}

$result = $stmt->get_result();
$orders = [];

while ($row = $result->fetch_assoc()) {
    $order_id = $row['order_id'];
    
    if (!isset($orders[$order_id])) {
        $orders[$order_id] = [
            'order_id' => $order_id,
            'order_date' => $row['order_date'],
            'total_amount' => 0, // Initialize to 0, will sum up
            'delivery_address' => [
                'street' => $row['delivery_street'],
                'apt_number' => $row['apt_number'],
                'city' => $row['delivery_city']
            ],
            'payment_method' => $row['payment_method'],
            'status' => $row['status'],
            'items' => []
        ];
    }
    
    // Add to the order total
    $orders[$order_id]['total_amount'] += $row['subtotal'];
    
    $orders[$order_id]['items'][] = [
        'product_id' => $row['product_id'],
        'name' => $row['product_name'],
        'price' => $row['price'],
        'offer_price' => $row['final_price'] < $row['price'] ? $row['final_price'] : null,
        'image' => $row['image'],
        'quantity' => $row['quantity'],
        'subtotal' => $row['subtotal']
    ];
}

// Calculate summary data
$summarySql = "
    SELECT 
        COUNT(*) AS total_orders,
        MIN(order_date) AS first_order_date,
        MAX(order_date) AS last_order_date
    FROM Order_Table
    WHERE customer_id = ?";

$summaryStmt = $conn->prepare($summarySql);
if (!$summaryStmt) {
    echo json_encode(['success' => false, 'error' => 'Summary query prep failed: '.$conn->error]);
    exit;
}

$summaryStmt->bind_param("i", $customer_id);

if (!$summaryStmt->execute()) {
    echo json_encode(['success' => false, 'error' => 'Summary query exec failed: '.$summaryStmt->error]);
    exit;
}

$summaryResult = $summaryStmt->get_result();
$summary = $summaryResult->fetch_assoc();

// Calculate total spent and average order value from our order data
$total_spent = 0;
$valid_orders_count = 0;

foreach ($orders as $order) {
    if ($order['status'] !== 'Cancelled') {
        $total_spent += $order['total_amount'];
        $valid_orders_count++;
    }
}

$summary['total_spent'] = $total_spent;
$summary['avg_order_value'] = $valid_orders_count > 0 ? $total_spent / $valid_orders_count : 0;

// Get chart data
$chartData = [
    'monthly_spending' => [],
    'status_distribution' => []
];

// Monthly spending data (last 12 months)
$monthlyQuery = "
    SELECT 
        DATE_FORMAT(o.order_date, '%Y-%m') AS month,
        SUM(od.quantity * p.price) AS total
    FROM Order_Table o
    JOIN Order_Details od ON o.order_id = od.order_id
    JOIN Product p ON od.product_id = p.product_id
    LEFT JOIN Product_Offers po ON p.product_id = po.product_id
    LEFT JOIN Offers off ON po.offers_id = off.offers_id 
        AND CURDATE() BETWEEN off.start_date AND off.end_date
        AND off.status_offer = 'Active'
    WHERE o.customer_id = ? 
        AND o.order_date >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
        AND o.status_of_order != 'Cancelled'
    GROUP BY DATE_FORMAT(o.order_date, '%Y-%m')
    ORDER BY month ASC";

$monthlyStmt = $conn->prepare($monthlyQuery);
$monthlyStmt->bind_param("i", $customer_id);
$monthlyStmt->execute();
$monthlyResult = $monthlyStmt->get_result();

while ($row = $monthlyResult->fetch_assoc()) {
    $chartData['monthly_spending'][] = [
        'month' => $row['month'],
        'total' => (float)$row['total']
    ];
}

// Status distribution data
$statusQuery = "
    SELECT 
        status_of_order AS status,
        COUNT(*) AS count
    FROM Order_Table
    WHERE customer_id = ?
    GROUP BY status_of_order";

$statusStmt = $conn->prepare($statusQuery);
$statusStmt->bind_param("i", $customer_id);
$statusStmt->execute();
$statusResult = $statusStmt->get_result();

while ($row = $statusResult->fetch_assoc()) {
    $chartData['status_distribution'][] = [
        'status' => $row['status'],
        'count' => (int)$row['count']
    ];
}

// Prepare response
$response = [
    'success' => true,
    'data' => [
        'customer_id' => $customer_id,
        'all_orders' => array_values($orders), // Changed from 'orders' to 'all_orders'
        'summary' => $summary,
        'charts' => $chartData
    ]
];


echo json_encode($response);

$conn->close();
?>