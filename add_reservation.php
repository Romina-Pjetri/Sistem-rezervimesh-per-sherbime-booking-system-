<?php
include 'db.php';

$conn->set_charset("utf8mb4");
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"), true);

if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Invalid request data."]);
    exit;
}

$email = trim($data['email'] ?? '');
$service = trim($data['service'] ?? '');
$sub = trim($data['subService'] ?? '');
$price = (int)($data['price'] ?? 0);
$date = trim($data['date'] ?? '');
$time = trim($data['time'] ?? '');

if ($email === '' || $service === '' || $sub === '' || $price <= 0 || $date === '' || $time === '') {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Missing reservation fields."]);
    exit;
}

// kontrollo nese orari eshte i zene per te njejtin sherbim
$check = $conn->prepare("SELECT id FROM reservations WHERE service = ? AND `date` = ? AND `time` = ?");
$check->bind_param("sss", $service, $date, $time);
$check->execute();
$result = $check->get_result();

if ($result->num_rows > 0) {
    http_response_code(409);
    echo json_encode([
        "status" => "occupied",
        "message" => "Ky orar eshte i zene per kete sherbim."
    ]);
    exit;
}

$stmt = $conn->prepare("INSERT INTO reservations (email, service, sub_service, price, `date`, `time`) VALUES (?, ?, ?, ?, ?, ?)");

if (!$stmt) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $conn->error]);
    exit;
}

$stmt->bind_param("sssiss", $email, $service, $sub, $price, $date, $time);

if (!$stmt->execute()) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => $stmt->error]);
    exit;
}

echo json_encode(["status" => "ok", "id" => $stmt->insert_id]);
?>
