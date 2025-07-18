<?php
$servername = "localhost";
$username = "root";
$password = "";
$database = "Yasmeem_Agricultural_Company";
$port = 3307;

// إنشاء الاتصال
$conn = new mysqli($servername, $username, $password, $database, $port);

// التحقق من الاتصال
if ($conn->connect_error) {
    die("فشل الاتصال: " . $conn->connect_error);
}

echo "تم الاتصال بنجاح!";
?>

