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

if (!$input || !isset($input['id']) || !isset($input['status'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

// Validate input
$submissionId = filter_var($input['id'], FILTER_SANITIZE_STRING);
$newStatus = filter_var($input['status'], FILTER_SANITIZE_STRING);
$feedback = filter_var($input['feedback'] ?? '', FILTER_SANITIZE_STRING);

// Validate status
$allowedStatuses = ['pending', 'approved', 'rejected'];
if (!in_array($newStatus, $allowedStatuses)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid status']);
    exit;
}

// Load submissions
$pendingFile = '../data/pending-submissions.json';
$pending = [];

if (file_exists($pendingFile)) {
    $jsonContent = file_get_contents($pendingFile);
    $pending = json_decode($jsonContent, true) ?: [];
}

// Find and update submission
if (!isset($pending[$submissionId])) {
    http_response_code(404);
    echo json_encode(['error' => 'Submission not found']);
    exit;
}

$submission = &$pending[$submissionId];
$submission['status'] = $newStatus;
$submission['feedback'] = $feedback;
$submission['updated_at'] = date('Y-m-d H:i:s');
$submission['reviewed_by'] = $_SERVER['REMOTE_ADDR']; // Simple tracking

// Save updated submissions with error handling
$saveResult = file_put_contents($pendingFile, json_encode($pending, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

if ($saveResult === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save submission data']);
    exit;
}

// If approved, move to approved characters
if ($newStatus === 'approved') {
    $approvedFile = '../data/approved-characters.json';
    $approved = [];
    
    if (file_exists($approvedFile)) {
        $jsonContent = file_get_contents($approvedFile);
        $approved = json_decode($jsonContent, true) ?: [];
    }
    
    // Sanitize character data before adding
    $character = $submission['character'] ?? [];
    if (isset($character['name'])) {
        $character['name'] = htmlspecialchars(strip_tags($character['name']), ENT_QUOTES, 'UTF-8');
    }
    
    $approved[$submissionId] = [
        'character' => $character,
        'approved_at' => $submission['updated_at'],
        'submission_id' => $submissionId,
        'approved_by' => $submission['reviewed_by']
    ];
    
    $saveApprovedResult = file_put_contents($approvedFile, json_encode($approved, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
    
    if ($saveApprovedResult === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save approved character data']);
        exit;
    }
}

echo json_encode([
    'success' => true,
    'message' => 'Submission updated successfully',
    'submission' => [
        'id' => $submissionId,
        'status' => $newStatus,
        'feedback' => $feedback,
        'updated_at' => $submission['updated_at']
    ]
]);
?>
