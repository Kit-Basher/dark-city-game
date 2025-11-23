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

if (!$input || !isset($input['id']) || !isset($input['status'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

$submissionId = $input['id'];
$newStatus = $input['status'];
$feedback = $input['feedback'] ?? '';

// Load submissions
$pendingFile = '../data/pending-submissions.json';
$pending = [];

if (file_exists($pendingFile)) {
    $pending = json_decode(file_get_contents($pendingFile), true);
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

// Save updated submissions
file_put_contents($pendingFile, json_encode($pending, JSON_PRETTY_PRINT));

// If approved, move to approved characters
if ($newStatus === 'approved') {
    $approvedFile = '../data/approved-characters.json';
    $approved = [];
    
    if (file_exists($approvedFile)) {
        $approved = json_decode(file_get_contents($approvedFile), true);
    }
    
    $approved[$submissionId] = [
        'character' => $submission['character'],
        'approved_at' => $submission['updated_at'],
        'submission_id' => $submissionId
    ];
    
    file_put_contents($approvedFile, json_encode($approved, JSON_PRETTY_PRINT));
}

echo json_encode([
    'success' => true,
    'message' => 'Submission updated successfully',
    'submission' => $submission
]);
?>
