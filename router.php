<?php
/**
 * ლოკალური გაშვება PHP-ის ჩაშენებული სერვერით (.htaccess-ის ანალოგი):
 *   php -S localhost:8000 router.php
 */
$path = (string) parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if (preg_match('~^/(content|inc|tools)(/|$)~', $path)) {
    http_response_code(403);
    exit('Forbidden');
}
$file = __DIR__ . $path;
if ($path !== '/' && is_file($file)) {
    return false; // სტატიკური ფაილი ან /api/*.php, /admin/*.php
}
if (is_dir($file) && is_file(rtrim($file, '/') . '/index.php')) {
    require rtrim($file, '/') . '/index.php';
    return true;
}
require __DIR__ . '/index.php';
