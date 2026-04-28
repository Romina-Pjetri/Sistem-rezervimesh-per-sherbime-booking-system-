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

$action = $data['action'] ?? '';
$email = strtolower(trim($data['email'] ?? ''));
$password = $data['password'] ?? '';

$adminEmail = 'meginako2@gmail.com';
$adminPassword = 'meginako123';
$adminRole = 'admin';
$adminStmt = $conn->prepare("INSERT IGNORE INTO users (email, password, role) VALUES (?, ?, ?)");
if ($adminStmt) {
    $adminStmt->bind_param("sss", $adminEmail, $adminPassword, $adminRole);
    $adminStmt->execute();
}

if ($email === '' || $password === '') {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Email and password are required."]);
    exit;
}

if ($action === 'signup') {
    if (strlen($password) < 6) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Password must be at least 6 characters."]);
        exit;
    }

    $role = 'user';
    $stmt = $conn->prepare("INSERT INTO users (email, password, role) VALUES (?, ?, ?)");

    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $conn->error]);
        exit;
    }

    $stmt->bind_param("sss", $email, $password, $role);

    if (!$stmt->execute()) {
        http_response_code($conn->errno === 1062 ? 409 : 500);
        echo json_encode([
            "status" => "error",
            "message" => $conn->errno === 1062 ? "An account with this email already exists." : $stmt->error
        ]);
        exit;
    }

    echo json_encode(["status" => "ok", "id" => $stmt->insert_id, "role" => $role]);
    exit;
}

if ($action === 'login') {
    $stmt = $conn->prepare("SELECT id, email, role FROM users WHERE email = ? AND password = ? LIMIT 1");

    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => $conn->error]);
        exit;
    }

    $stmt->bind_param("ss", $email, $password);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if (!$user) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Invalid email or password."]);
        exit;
    }

    echo json_encode(["status" => "ok", "user" => $user]);
    exit;
}

http_response_code(400);
echo json_encode(["status" => "error", "message" => "Unknown auth action."]);
?>
