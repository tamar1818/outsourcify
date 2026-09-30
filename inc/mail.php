<?php
/** ელფოსტა — გუნდის შეტყობინებები და კლიენტის დადასტურება (PHP mail()) */
declare(strict_types=1);
require_once __DIR__ . '/core.php';

const OS_TEAM_EMAIL = 'info@outsourcify.ge';

/** მიმღები: ადმინის „პარამეტრები → შეტყობინებების ელფოსტა“, შემდეგ საკონტაქტო ელფოსტა */
function os_team_email(): string
{
    $s = os_read('site')['settings'] ?? [];
    foreach ([$s['notify_email'] ?? '', $s['email'] ?? ''] as $e) {
        $e = trim((string) $e);
        if (filter_var($e, FILTER_VALIDATE_EMAIL)) {
            return $e;
        }
    }
    return OS_TEAM_EMAIL;
}

function os_mail_from(): string
{
    $d = (string) parse_url((string) (os_read('site')['settings']['domain'] ?? ''), PHP_URL_HOST);
    return 'no-reply@' . ($d !== '' ? preg_replace('~^www\.~', '', $d) : 'outsourcify.ge');
}

function os_mail(string $to, string $subject, string $body, string $replyTo = ''): bool
{
    if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
        return false;
    }
    $replyTo = preg_replace('~[\r\n]+~', '', $replyTo) ?? '';
    $headers = 'From: Outsourcify <' . os_mail_from() . ">\r\n"
             . ($replyTo !== '' && filter_var($replyTo, FILTER_VALIDATE_EMAIL) ? "Reply-To: $replyTo\r\n" : '')
             . "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit\r\n";
    return @mail($to, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, $headers);
}

/** [ლეიბლი => მნიშვნელობა] → ტექსტი, ცარიელები გამოტოვებულია */
function os_mail_lines(array $fields): string
{
    $out = '';
    foreach ($fields as $label => $value) {
        $value = trim(is_array($value) ? implode(', ', $value) : (string) $value);
        if ($value !== '') {
            $out .= $label . ': ' . $value . "\n";
        }
    }
    return $out;
}
