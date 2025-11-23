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

if (!$input || !isset($input['character'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing character data']);
    exit;
}

$character = $input['character'];
$submissionId = $input['submission_id'] ?? uniqid('char_', true);

// Load approved characters
$approvedFile = '../data/approved-characters.json';
$approved = [];

if (file_exists($approvedFile)) {
    $approved = json_decode(file_get_contents($approvedFile), true);
}

// Add character to approved list
$approved[$submissionId] = [
    'character' => $character,
    'approved_at' => date('Y-m-d H:i:s'),
    'submission_id' => $submissionId,
    'status' => 'approved'
];

// Save approved characters
file_put_contents($approvedFile, json_encode($approved, JSON_PRETTY_PRINT));

echo json_encode([
    'success' => true,
    'message' => 'Character approved and added to character list',
    'submission_id' => $submissionId
]);
?>
