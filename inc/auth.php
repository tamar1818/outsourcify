<?php
/** ადმინის ავტორიზაცია — პაროლის ჰეში ინახება content/auth.php-ში (git-ში არ შედის) */
declare(strict_types=1);
require_once __DIR__ . '/core.php';

const OS_AUTH_FILE = OS_CONTENT . '/auth.php';
const OS_MAX_TRIES = 6;
const OS_LOCK_SECONDS = 900;

function os_auth_config(): array
{
    if (!is_file(OS_AUTH_FILE)) {
        return [];
    }
    $data = require OS_AUTH_FILE;
    return is_array($data) ? $data : [];
}

function os_is_installed(): bool
{
    return !empty(os_auth_config()['hash']);
}

function os_install(string $user, string $password): bool
{
    if (!is_dir(OS_CONTENT)) {
        mkdir(OS_CONTENT, 0775, true);
    }
    $payload = ['user' => $user, 'hash' => password_hash($password, PASSWORD_DEFAULT)];
    $php = "<?php\n// Outsourcify CMS — ავტორიზაცია. ხელით ნუ შეცვლით.\nreturn " . var_export($payload, true) . ";\n";
    $ok = file_put_contents(OS_AUTH_FILE, $php, LOCK_EX) !== false;
    if ($ok) {
        @chmod(OS_AUTH_FILE, 0640);
        if (function_exists('opcache_invalidate')) {
            @opcache_invalidate(OS_AUTH_FILE, true);
        }
    }
    return $ok;
}

/** ბლოკირება ფაილით (და არა სესიით) — ქუქის წაშლით ვერ გვერდს აუვლის */
function os_login_state(): array
{
    return os_read('login-attempts', ['ips' => []])['ips'] ?? [];
}

function os_login_locked(): int
{
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    $st = os_login_state()[$ip] ?? null;
    if ($st && (int) $st['tries'] >= OS_MAX_TRIES) {
        $left = OS_LOCK_SECONDS - (time() - (int) $st['last']);
        return max(0, $left);
    }
    return 0;
}

function os_login(string $user, string $password): bool
{
    os_session();
    $c = os_auth_config();
    $ok = !empty($c['hash']) && hash_equals((string) ($c['user'] ?? ''), $user) && password_verify($password, (string) $c['hash']);
    $ip = (string) ($_SERVER['REMOTE_ADDR'] ?? '');
    $all = os_login_state();
    foreach ($all as $k => $v) {
        if (time() - (int) ($v['last'] ?? 0) > OS_LOCK_SECONDS) {
            unset($all[$k]);
        }
    }
    if (!$ok) {
        $all[$ip] = ['tries' => (int) ($all[$ip]['tries'] ?? 0) + 1, 'last' => time()];
        os_write('login-attempts', ['ips' => $all]);
        usleep(300000);
        return false;
    }
    unset($all[$ip]);
    os_write('login-attempts', ['ips' => $all]);
    session_regenerate_id(true);
    $_SESSION['uid'] = $c['user'];
    return true;
}

function os_logout(): void
{
    os_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $p = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $p['path'], $p['domain'], $p['secure'], $p['httponly']);
    }
    session_destroy();
}

function os_user(): ?string
{
    os_session();
    return isset($_SESSION['uid']) ? (string) $_SESSION['uid'] : null;
}
