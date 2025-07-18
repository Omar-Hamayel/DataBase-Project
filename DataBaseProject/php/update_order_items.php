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

// Get input data
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($input['order_id']) || !isset($input['action'])) {
    echo json_encode(['success' => false, 'error' => 'Missing required fields']);
    exit;
}

$order_id = $conn->real_escape_string($input['order_id']);
$action = $input['action'];

// Check if order exists and is modifiable
$order_check = $conn->query("
        SELECT status_of_order FROM Order_Table WHERE order_id = '$order_id'
        ");
if ($order_check->num_rows === 0) {
    echo json_encode(['success' => false, 'error' => 'Order not found']);
    exit;
}

$order_status = $order_check->fetch_assoc()['status_of_order'];
if (!in_array($order_status, ['Waiting', 'Processing'])) {
    echo json_encode(['success' => false, 'error' => 'Order cannot be modified in its current status']);
    exit;
}

try {
    $conn->begin_transaction();

    $order_cancelled = false;

    if ($action === 'remove_product' && isset($input['product_id'])) {
        // Remove product from order
        $product_id = $conn->real_escape_string($input['product_id']);
        
        // Check if product exists in order
        $check = $conn->query("
        SELECT 1 FROM Order_Details WHERE order_id = '$order_id' AND product_id = '$product_id'
        ");
        if ($check->num_rows === 0) {
            throw new Exception("Product not found in order");
        }

        // Check how many products are left in the order
        $product_count = $conn->query("
        SELECT COUNT(*) as count FROM Order_Details WHERE order_id = '$order_id'
        ");
        $count_data = $product_count->fetch_assoc();
        $remaining_products = $count_data['count'];

        if ($remaining_products <= 1) {
            // This is the last product - cancel the order instead of removing the product
            $conn->query("
            UPDATE Order_Table SET status_of_order = 'Cancelled' WHERE order_id = '$order_id'
            ");
            $order_cancelled = true;
        } else {
            // Remove product
            $conn->query("
            DELETE FROM Order_Details WHERE order_id = '$order_id' AND product_id = '$product_id'
            ");
        }

    } elseif ($action === 'update_quantity' && isset($input['product_id']) && isset($input['quantity'])) {
        // Update product quantity
        $product_id = $conn->real_escape_string($input['product_id']);
        $quantity = (int)$input['quantity'];
        
        if ($quantity < 1) {
            throw new Exception("Quantity must be at least 1");
        }

        // Check if product exists in order
        $check = $conn->query("
        SELECT 1 FROM Order_Details WHERE order_id = '$order_id' AND product_id = '$product_id'
        ");
        if ($check->num_rows === 0) {
            throw new Exception("Product not found in order");
        }

        // Update quantity
        $conn->query("
        UPDATE Order_Details SET quantity = $quantity WHERE order_id = '$order_id' AND product_id = '$product_id'
        ");
    } else {
        throw new Exception("Invalid action or missing parameters");
    }

    if (!$order_cancelled) {
        // Recalculate order total only if order wasn't cancelled
        $conn->query("
                    UPDATE Order_Table o
                     SET total_amount = (
                         SELECT SUM(od.quantity * p.price)
                         FROM Order_Details od
                         JOIN Product p ON od.product_id = p.product_id
                         WHERE od.order_id = o.order_id
                     )
                     WHERE o.order_id = '$order_id'");
    }

    $conn->commit();
    
    // Return success
    echo json_encode([
        'success' => true,
        'order_cancelled' => $order_cancelled,
        'message' => $order_cancelled ? 'Last product removed. Order has been cancelled.' : 'Order items updated successfully'
    ]);

} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

$conn->close();
?>