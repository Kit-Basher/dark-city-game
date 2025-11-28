<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? 'http://localhost:3000'));
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Validate API key
$apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
$expectedApiKey = $_ENV['API_KEY'] ?? 'dark-city-dev-key';

if ($apiKey !== $expectedApiKey) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON data']);
    exit;
}

// Discord webhook URL from environment
$discordWebhook = $_ENV['DISCORD_WEBHOOK_URL'] ?? '';

if (empty($discordWebhook)) {
    http_response_code(500);
    echo json_encode(['error' => 'Discord webhook not configured']);
    exit;
}

// Validate and sanitize input
$allowedFields = ['content', 'embeds', 'username', 'avatar_url'];
$sanitizedInput = array_intersect_key($input, array_flip($allowedFields));

if (empty($sanitizedInput)) {
    http_response_code(400);
    echo json_encode(['error' => 'No valid fields provided']);
    exit;
}

// Send to Discord
$ch = curl_init($discordWebhook);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($sanitizedInput));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 2);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

if ($error) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to send Discord notification', 'details' => $error]);
    exit;
}

if ($httpCode === 204) {
    echo json_encode(['success' => true, 'message' => 'Discord notification sent successfully']);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to send Discord notification', 'response' => $response, 'status' => $httpCode]);
}
?>
