<?php

namespace App\Services;

use App\Models\Media;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Stores uploaded images safely:
 *  - the real type is detected from file contents (finfo), never the client name/MIME;
 *  - only JPEG, PNG and WebP are accepted (no SVG, no executables);
 *  - every image is decoded and re-encoded with GD, which strips metadata and
 *    any non-image payload appended to the file;
 *  - oversized images are scaled down;
 *  - files get a random generated name under media/YYYY/MM on the public disk.
 */
class MediaService
{
    public const MAX_EDGE = 2400;

    private const TYPES = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
    ];

    public function store(UploadedFile $file, ?int $userId, array $meta = []): Media
    {
        [$binary, $mime, $width, $height] = $this->sanitize($file);
        $path = 'media/'.date('Y/m').'/'.Str::uuid()->toString().'.'.self::TYPES[$mime];
        Storage::disk('public')->put($path, $binary);

        return Media::create([
            'disk' => 'public',
            'path' => $path,
            'original_name' => $this->safeName($file->getClientOriginalName()),
            'title' => $meta['title'] ?? pathinfo($this->safeName($file->getClientOriginalName()), PATHINFO_FILENAME),
            'alt' => $meta['alt'] ?? null,
            'caption' => $meta['caption'] ?? null,
            'mime' => $mime,
            'size' => strlen($binary),
            'width' => $width,
            'height' => $height,
            'uploaded_by' => $userId,
        ]);
    }

    /** Swap the file behind an existing media record, keeping every reference to it. */
    public function replace(Media $media, UploadedFile $file): Media
    {
        [$binary, $mime, $width, $height] = $this->sanitize($file);
        $old = $media->path;
        $path = 'media/'.date('Y/m').'/'.Str::uuid()->toString().'.'.self::TYPES[$mime];
        Storage::disk($media->disk)->put($path, $binary);
        $media->update([
            'path' => $path,
            'original_name' => $this->safeName($file->getClientOriginalName()),
            'mime' => $mime,
            'size' => strlen($binary),
            'width' => $width,
            'height' => $height,
        ]);
        Storage::disk($media->disk)->delete($old);

        return $media;
    }

    public function delete(Media $media): void
    {
        Storage::disk($media->disk)->delete($media->path);
        $media->delete();
    }

    /** Register an image that already sits on disk (used by the seeder). */
    public function importLocal(string $absolutePath, array $meta = []): Media
    {
        $file = new UploadedFile($absolutePath, basename($absolutePath), null, null, true);

        return $this->store($file, null, $meta);
    }

    /** @return array{0:string,1:string,2:int,3:int} */
    private function sanitize(UploadedFile $file): array
    {
        $realPath = $file->getRealPath();
        $mime = $realPath ? (new \finfo(FILEINFO_MIME_TYPE))->file($realPath) : null;
        if (! $mime || ! isset(self::TYPES[$mime])) {
            throw ValidationException::withMessages(['file' => 'Only JPEG, PNG or WebP images are allowed.']);
        }

        $image = @imagecreatefromstring((string) file_get_contents($realPath));
        if (! $image) {
            throw ValidationException::withMessages(['file' => 'The file is not a valid image.']);
        }

        $width = imagesx($image);
        $height = imagesy($image);
        $scale = min(1, self::MAX_EDGE / max($width, $height));
        if ($scale < 1) {
            $nw = (int) round($width * $scale);
            $nh = (int) round($height * $scale);
            $resized = imagecreatetruecolor($nw, $nh);
            imagealphablending($resized, false);
            imagesavealpha($resized, true);
            imagecopyresampled($resized, $image, 0, 0, 0, 0, $nw, $nh, $width, $height);
            imagedestroy($image);
            $image = $resized;
            [$width, $height] = [$nw, $nh];
        } else {
            imagealphablending($image, false);
            imagesavealpha($image, true);
        }

        ob_start();
        match ($mime) {
            'image/jpeg' => imagejpeg($image, null, 85),
            'image/png' => imagepng($image, null, 7),
            'image/webp' => imagewebp($image, null, 85),
        };
        $binary = (string) ob_get_clean();
        imagedestroy($image);

        if ($binary === '') {
            throw ValidationException::withMessages(['file' => 'The image could not be processed.']);
        }

        return [$binary, $mime, $width, $height];
    }

    private function safeName(string $name): string
    {
        $base = basename(str_replace('\\', '/', $name));
        $clean = preg_replace('/[^A-Za-z0-9._ -]/', '', $base) ?: 'image';

        return mb_substr($clean, 0, 200);
    }
}
