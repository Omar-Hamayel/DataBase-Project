<?php
// cancel_order.php
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

// Get input data
$input = json_decode(file_get_contents('php://input'), true);
$order_id = isset($input['order_id']) ? intval($input['order_id']) : null;
$customer_id = 1; // Set customer_id to 1 as requested

// Validate input
if (!$order_id || $order_id < 1) {
    echo json_encode(['success' => false, 'error' => 'Valid order ID is required']);
    exit;
}

// Start transaction
$conn->begin_transaction();

try {
    $update_sql = "
                  UPDATE Order_Table 
                  SET status_of_order = 'Cancelled'
                  WHERE order_id = ?";
    $update_stmt = $conn->prepare($update_sql);
    if (!$update_stmt) {
        throw new Exception('Update prep failed: '.$conn->error);
    }
    
    $update_stmt->bind_param("i", $order_id);
    if (!$update_stmt->execute()) {
        throw new Exception('Update exec failed: '.$update_stmt->error);
    }
    // Get updated summary (excluding cancelled orders)
    $summary_sql = "
                SELECT 
                    COUNT(*) AS total_orders,
                    SUM(total_amount) AS total_spent,
                    AVG(total_amount) AS avg_order_value,
                    MIN(order_date) AS first_order_date,
                    MAX(order_date) AS last_order_date
                FROM Order_Table
                WHERE customer_id = ? AND status_of_order != 'Cancelled'";
    
    $summary_stmt = $conn->prepare($summary_sql);
    if (!$summary_stmt) {
        throw new Exception('Summary query prep failed: '.$conn->error);
    }
    
    $summary_stmt->bind_param("i", $customer_id);
    if (!$summary_stmt->execute()) {
        throw new Exception('Summary query exec failed: '.$summary_stmt->error);
    }
    
    $summary_result = $summary_stmt->get_result();
    $summary = $summary_result->fetch_assoc();
    
    // Commit transaction
    $conn->commit();
    
    // Return success response with updated summary
    echo json_encode([
        'success' => true,
        'data' => [
            'order_id' => $order_id,
            'previous_status' => $order['status_of_order'],
            'new_status' => 'Cancelled',
            'timestamp' => date('Y-m-d H:i:s'),
            'summary' => $summary
        ],
        'message' => 'Order cancelled successfully'
    ]);
    
} catch (Exception $e) {
    // Rollback on error
    $conn->rollback();
    
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
} finally {
    // Close connection
    $conn->close();
}
?>