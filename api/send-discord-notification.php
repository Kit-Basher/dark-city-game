<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Get POST data
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON data']);
    exit;
}

// Discord webhook URL
$discordWebhook = 'https://discordapp.com/api/webhooks/1442228498629525586/6mJC4zV2BvAkOSt_7EiGmOc4Yaj8vGtJupDOQwlzVr_-D-muR_aSRnorqsX_a3yTDxWr';

// Send to Discord
$ch = curl_init($discordWebhook);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($input));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 204) {
    echo json_encode(['success' => true, 'message' => 'Discord notification sent successfully']);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to send Discord notification', 'response' => $response]);
}
?>
