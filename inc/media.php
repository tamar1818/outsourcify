<?php
/** ფოტოების ატვირთვა — ტიპი მოწმდება შიგთავსით; დიდი რასტრი მცირდება და WebP-დ გარდაიქმნება (თუ GD ხელმისაწვდომია) */
declare(strict_types=1);
require_once __DIR__ . '/core.php';

const OS_MAX_UPLOAD = 8388608; // 8 MB
const OS_ALLOWED = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/webp' => 'webp', 'image/svg+xml' => 'svg'];

/** @return array{ok:bool, file?:string, error?:string} */
function os_upload(array $file, string $name = 'image'): array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        return ['ok' => false, 'error' => ($file['error'] ?? 0) === UPLOAD_ERR_NO_FILE ? 'ფაილი არ აირჩიეთ' : 'ატვირთვის შეცდომა (ფაილი ძალიან დიდია?)'];
    }
    if (!is_uploaded_file($file['tmp_name']) || ($file['size'] ?? 0) > OS_MAX_UPLOAD) {
        return ['ok' => false, 'error' => 'ფაილი 8 MB-ზე დიდია ან არასწორია'];
    }
    $mime = (string) (new finfo(FILEINFO_MIME_TYPE))->file($file['tmp_name']);
    if (!isset(OS_ALLOWED[$mime])) {
        return ['ok' => false, 'error' => 'დაშვებულია მხოლოდ JPG, PNG, WebP და SVG'];
    }
    if ($mime === 'image/svg+xml') {
        $svg = (string) file_get_contents($file['tmp_name']);
        if (preg_match('~<script|javascript:|\bon\w+\s*=|<foreignObject~i', $svg)) {
            return ['ok' => false, 'error' => 'SVG შეიცავს სკრიპტს — აიკრძალა'];
        }
    } elseif (@getimagesize($file['tmp_name']) === false) {
        return ['ok' => false, 'error' => 'ფაილი დაზიანებულია'];
    }
    if (!is_dir(OS_UPLOADS)) {
        mkdir(OS_UPLOADS, 0775, true);
    }
    // SEO-მეგობრული ფაილის სახელი ორიგინალი სახელიდან
    $base = os_slug(pathinfo((string) ($file['name'] ?? $name), PATHINFO_FILENAME)) ?: os_slug($name) ?: 'image';
    $base = substr($base, 0, 60) . '-' . bin2hex(random_bytes(3));

    // ოპტიმიზაცია: 2000px-ზე დიდი → მცირდება, JPG/PNG → WebP
    if ($mime !== 'image/svg+xml' && function_exists('imagewebp') && function_exists('imagecreatefromstring')) {
        $img = @imagecreatefromstring((string) file_get_contents($file['tmp_name']));
        if ($img) {
            $w = imagesx($img);
            $h = imagesy($img);
            if ($w > 2000) {
                $nh = (int) round($h * 2000 / $w);
                $dst = imagecreatetruecolor(2000, $nh);
                imagealphablending($dst, false);
                imagesavealpha($dst, true);
                imagecopyresampled($dst, $img, 0, 0, 0, 0, 2000, $nh, $w, $h);
                imagedestroy($img);
                $img = $dst;
            } else {
                imagepalettetotruecolor($img);
                imagesavealpha($img, true);
            }
            $dest = OS_UPLOADS . '/' . $base . '.webp';
            if (imagewebp($img, $dest, 80)) {
                imagedestroy($img);
                @chmod($dest, 0644);
                return ['ok' => true, 'file' => OS_UPLOADS_URL . '/' . $base . '.webp'];
            }
            imagedestroy($img);
        }
    }
    $dest = OS_UPLOADS . '/' . $base . '.' . OS_ALLOWED[$mime];
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
        return ['ok' => false, 'error' => 'ფაილის შენახვა ვერ მოხერხდა'];
    }
    @chmod($dest, 0644);
    return ['ok' => true, 'file' => OS_UPLOADS_URL . '/' . basename($dest)];
}

/** ატვირთული + ბრენდის ფოტოები (ორიგინალები, ზომის ვარიანტების გარეშე) */
function os_media_list(): array
{
    $out = [];
    foreach ([[OS_UPLOADS, OS_UPLOADS_URL, true], [OS_ROOT . '/assets/img/photos', '/assets/img/photos', false]] as [$dir, $url, $del]) {
        if (!is_dir($dir)) {
            continue;
        }
        foreach (scandir($dir) ?: [] as $f) {
            if (preg_match('~\.(jpe?g|png|webp|svg)$~i', $f) && !preg_match('~-(560|960)\.webp$~', $f)) {
                $out[] = ['name' => $f, 'url' => $url . '/' . $f, 'time' => filemtime($dir . '/' . $f) ?: 0, 'deletable' => $del];
            }
        }
    }
    usort($out, static fn($a, $b) => $b['time'] <=> $a['time']);
    return $out;
}

function os_media_delete(string $name): bool
{
    $name = basename($name);
    if (!preg_match('~^[\w.-]+\.(jpe?g|png|webp|svg)$~i', $name)) {
        return false;
    }
    $path = OS_UPLOADS . '/' . $name;
    return is_file($path) && unlink($path);
}
