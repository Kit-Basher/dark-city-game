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

if (!$input || !isset($input['character'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing character data']);
    exit;
}

// Validate and sanitize character data
$character = $input['character'];
$submissionId = $input['submission_id'] ?? uniqid('char_', true);

// Basic validation
if (empty($character['name']) || !is_string($character['name'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Character name is required and must be a string']);
    exit;
}

// Sanitize character name
$character['name'] = htmlspecialchars(strip_tags($character['name']), ENT_QUOTES, 'UTF-8');

// Validate other fields
$allowedFields = ['name', 'class', 'level', 'player', 'status', 'bio', 'attributes', 'skills', 'equipment', 'background', 'abilities', 'activities', 'notes'];
$character = array_intersect_key($character, array_flip($allowedFields));

// Load approved characters
$approvedFile = '../data/approved-characters.json';
$approved = [];

if (file_exists($approvedFile)) {
    $jsonContent = file_get_contents($approvedFile);
    $approved = json_decode($jsonContent, true) ?: [];
}

// Add character to approved list
$approved[$submissionId] = [
    'character' => $character,
    'approved_at' => date('Y-m-d H:i:s'),
    'submission_id' => $submissionId,
    'status' => 'approved',
    'approved_by' => $_SERVER['REMOTE_ADDR'] // Simple tracking
];

// Save approved characters with error handling
$saveResult = file_put_contents($approvedFile, json_encode($approved, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

if ($saveResult === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save character data']);
    exit;
}

echo json_encode([
    'success' => true,
    'message' => 'Character approved and added to character list',
    'submission_id' => $submissionId,
    'character' => $character
]);
?>
