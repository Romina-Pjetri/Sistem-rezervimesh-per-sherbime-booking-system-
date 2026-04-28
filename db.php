<?php
$conn = new mysqli("localhost", "root", "", "glow_relax", 3306);

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
