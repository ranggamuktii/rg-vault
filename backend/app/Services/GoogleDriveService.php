<?php

namespace App\Services;

use Google_Client;
use Google_Service_Drive;
use Google_Service_Drive_DriveFile;

class GoogleDriveService
{
    protected $client;
    protected $service;

    public function __construct()
    {
        $this->client = new Google_Client();
        $this->client->setClientId(env('GOOGLE_DRIVE_CLIENT_ID'));
        $this->client->setClientSecret(env('GOOGLE_DRIVE_CLIENT_SECRET'));
        $this->client->setRedirectUri(env('GOOGLE_DRIVE_REDIRECT_URI'));
        $this->client->setScopes(['https://www.googleapis.com/auth/drive.file']);
        $this->client->setAccessType('offline');
        $this->client->setPrompt('select_account consent');

        $refreshToken = env('GOOGLE_DRIVE_REFRESH_TOKEN');

        // Ambil access token baru dari refresh token
        $newAccessToken = $this->client->fetchAccessTokenWithRefreshToken($refreshToken);

        // Tambahkan refresh token ke array token agar tidak hilang
        $newAccessToken['refresh_token'] = $refreshToken;

        // Set token ke client
        $this->client->setAccessToken($newAccessToken);

        // Inisialisasi service
        $this->service = new Google_Service_Drive($this->client);
    }

    public function uploadFile($filePath, $filename, $mimeType)
    {
        $fileMetadata = new \Google_Service_Drive_DriveFile(['name' => $filename]);
        $content = file_get_contents($filePath);

        $file = $this->service->files->create($fileMetadata, [
            'data' => $content,
            'mimeType' => $mimeType,
            'uploadType' => 'multipart',
            'fields' => 'id, webContentLink'
        ]);

        return [
            'id' => $file->id,
            'webContentLink' => $file->webContentLink
        ];
    }
}
