<?php
declare(strict_types=1);
require_once dirname(__DIR__) . '/inc/auth.php';
os_logout();
os_redirect('index.php');
