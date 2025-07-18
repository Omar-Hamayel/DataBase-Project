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

// Get the POST data
$data = json_decode(file_get_contents('php://input'), true);

// Set customer_id to 1 for now (you should get this from session/auth)
$customer_id = 1;

// Initialize response
$response = ['success' => false, 'message' => ''];

try {
    $conn->autocommit(false);
    $total_query = "
        SELECT SUM(
            CASE
                WHEN o.discount_percentage IS NOT NULL AND o.discount_percentage > 0
                    AND o.status_offer = 'Active'
                    AND CURDATE() BETWEEN o.start_date AND o.end_date THEN
                    p.price * ci.quantity * (1 - o.discount_percentage / 100)
                ELSE
                    p.price * ci.quantity
            END
        ) AS total
        FROM Cart c
        JOIN Cart_Items ci ON c.cart_id = ci.cart_id
        JOIN Product p ON ci.product_id = p.product_id
        LEFT JOIN Product_Offers po ON p.product_id = po.product_id
        LEFT JOIN Offers o ON po.offers_id = o.offers_id
        WHERE c.customer_id = ?
    ";

    $stmt = $conn->prepare($total_query);
    if (!$stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }
    $stmt->bind_param("i", $customer_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $totalAmount = $result->fetch_assoc()['total'] ?? 0;
    $stmt->close();

    // 2. Create the order
    $order_stmt = $conn->prepare("
        INSERT INTO Order_Table (
            customer_id,
            employee_id,
            order_date,
            total_amount,
            city,
            street,
            apt_number,
            payment_method,
            status_of_order
        ) VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?)
    ");
    if (!$order_stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $employee_id = null; // Not assigned yet
    $payment_method = $data['payment_method'] === 'card' ? 'visa' : 'Pay on Delivery';
    $order_status = 'Waiting';

    $order_stmt->bind_param(
        "iidssiss",
        $customer_id,
        $employee_id,
        $totalAmount,
        $data['city'],
        $data['street'],
        $data['apt_number'],
        $payment_method,
        $order_status
    );

    if (!$order_stmt->execute()) {
        throw new Exception("Order creation failed: " . $order_stmt->error);
    }

    $order_id = $conn->insert_id;

    // 3. Insert Order_Details (no unit_price or discount_percentage)
    $details_query = "
        INSERT INTO Order_Details (
            product_id,
            order_id,
            quantity,
            added_at
        )
        SELECT
            p.product_id,
            ?,
            ci.quantity,
            NOW()
        FROM Cart c
        JOIN Cart_Items ci ON c.cart_id = ci.cart_id
        JOIN Product p ON ci.product_id = p.product_id
        LEFT JOIN Product_Offers po ON p.product_id = po.product_id
        LEFT JOIN Offers o ON po.offers_id = o.offers_id
            AND o.status_offer = 'Active'
            AND CURDATE() BETWEEN o.start_date AND o.end_date
        WHERE c.customer_id = ?
    ";

    $details_stmt = $conn->prepare($details_query);
    if (!$details_stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $details_stmt->bind_param("ii", $order_id, $customer_id);
    if (!$details_stmt->execute()) {
        throw new Exception("Order details failed: " . $details_stmt->error);
    }

    // 4. If paying by card, store visa info
    if ($data['payment_method'] === 'card') {
        $visa_stmt = $conn->prepare("
            INSERT INTO Visa_Table (
                visa_number,
                visa_type,
                expiry_date,
                status,
                customer_id
            ) VALUES (?, ?, ?, 'Active', ?)
        ");

        if (!$visa_stmt) {
            throw new Exception("Prepare failed: " . $conn->error);
        }

        $visa_stmt->bind_param(
            "sssi",
            $data['card_number'],
            $data['card_type'],
            $data['expiry_date'],
            $customer_id
        );

        if (!$visa_stmt->execute()) {
            throw new Exception("Visa info failed: " . $visa_stmt->error);
        }
    }

    // 5. Clear the cart
    $clear_cart_stmt = $conn->prepare("
        DELETE FROM Cart_Items 
        WHERE cart_id = (SELECT cart_id FROM Cart WHERE customer_id = ?)
    ");

    if (!$clear_cart_stmt) {
        throw new Exception("Prepare failed: " . $conn->error);
    }

    $clear_cart_stmt->bind_param("i", $customer_id);
    if (!$clear_cart_stmt->execute()) {
        throw new Exception("Cart cleanup failed: " . $clear_cart_stmt->error);
    }

    $conn->commit();
    $response['success'] = true;
    $response['order_id'] = $order_id;
    $response['total_amount'] = $totalAmount;
    $response['message'] = 'Order placed successfully';

} catch (Exception $e) {
    $conn->rollback();
    $response['message'] = 'Error: ' . $e->getMessage();
} finally {
    $conn->autocommit(true);

   
if (isset($order_stmt)) $order_stmt->close();
if (isset($details_stmt)) $details_stmt->close();
if (isset($update_stmt)) $update_stmt->close();
if (isset($visa_stmt)) $visa_stmt->close();
if (isset($clear_cart_stmt)) $clear_cart_stmt->close();

    echo json_encode($response);
}
?>
