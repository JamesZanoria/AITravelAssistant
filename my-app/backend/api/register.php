<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Handle preflight OPTIONS request
if($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include_once '../config/database.php';
include_once '../utils/jwt.php';

$database = new Database();
$db = $database->getConnection();

// Get posted data
$data = json_decode(file_get_contents("php://input"));

// Validate required fields
if(empty($data->email) || empty($data->password) || empty($data->name)){
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Please provide name, email and password"
    ));
    exit();
}

// Sanitize inputs
$name = htmlspecialchars(strip_tags(trim($data->name)));
$email = htmlspecialchars(strip_tags(trim($data->email)));
$password = $data->password;

// Validate email format
if(!filter_var($email, FILTER_VALIDATE_EMAIL)){
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Invalid email format"
    ));
    exit();
}

// Validate name length
if(strlen($name) < 2 || strlen($name) > 100){
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Name must be between 2 and 100 characters"
    ));
    exit();
}

// Validate password strength
if(strlen($password) < 6){
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Password must be at least 6 characters long"
    ));
    exit();
}

// Check if email already exists
$check_query = "SELECT id FROM users WHERE email = :email";
$check_stmt = $db->prepare($check_query);
$check_stmt->bindParam(":email", $email);
$check_stmt->execute();

if($check_stmt->rowCount() > 0){
    http_response_code(400);
    echo json_encode(array(
        "success" => false,
        "message" => "Email already exists"
    ));
    exit();
}

// Hash password
$password_hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);

// Insert new user
$query = "INSERT INTO users (name, email, password, created_at)
          VALUES (:name, :email, :password, NOW())";

$stmt = $db->prepare($query);
$stmt->bindParam(":name", $name);
$stmt->bindParam(":email", $email);
$stmt->bindParam(":password", $password_hash);

if($stmt->execute()){
    $user_id = $db->lastInsertId();

    // Create JWT token
    $token_payload = array(
        "id" => $user_id,
        "name" => $name,
        "email" => $email,
        "iat" => time(),
        "exp" => time() + (60 * 60 * 24 * 7) // 7 days
    );

    $jwt = JWT::encode($token_payload);

    http_response_code(201);
    echo json_encode(array(
        "success" => true,
        "message" => "User registered successfully",
        "token" => $jwt,
        "user" => array(
            "id" => $user_id,
            "name" => $name,
            "email" => $email
        )
    ));
} else{
    http_response_code(500);
    echo json_encode(array(
        "success" => false,
        "message" => "Failed to register user"
    ));
}
?>