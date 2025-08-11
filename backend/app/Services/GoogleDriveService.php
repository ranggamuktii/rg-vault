<?php

namespace App\Services;

use Google\Client;
use Google\Service\Drive;
use Illuminate\Support\Facades\Storage;

class GoogleDriveService
{
    private $client;
    private $drive;

    public function __construct()
    {
        $this->client = new Client();
        $this->client->setClientId(config('services.google.client_id'));
        $this->client->setClientSecret(config('services.google.client_secret'));
        $this->client->setRedirectUri(config('services.google.redirect_uri'));
        $this->client->setScopes([Drive::DRIVE_FILE]);
        $this->client->setAccessType('offline');
        $this->client->setPrompt('select_account consent');

        // Set refresh token if available
        if (config('services.google.refresh_token')) {
            $this->client->setRefreshToken(config('services.google.refresh_token'));
        }

        $this->drive = new Drive($this->client);
    }

    public function uploadFile($filePath, $fileName, $mimeType, $folderId = null)
    {
        $fileMetadata = new Drive\DriveFile([
            'name' => $fileName,
            'parents' => $folderId ? [$folderId] : null
        ]);

        $content = file_get_contents($filePath);

        $file = $this->drive->files->create($fileMetadata, [
            'data' => $content,
            'mimeType' => $mimeType,
            'uploadType' => 'multipart',
            'fields' => 'id,name,webViewLink,webContentLink'
        ]);

        // Make file publicly accessible
        $permission = new Drive\Permission([
            'role' => 'reader',
            'type' => 'anyone'
        ]);

        $this->drive->permissions->create($file->id, $permission);

        return [
            'id' => $file->id,
            'name' => $file->name,
            'webViewLink' => $file->webViewLink,
            'webContentLink' => $file->webContentLink
        ];
    }

    public function deleteFile($fileId)
    {
        return $this->drive->files->delete($fileId);
    }

    public function getFile($fileId)
    {
        return $this->drive->files->get($fileId, ['fields' => 'id,name,webViewLink,webContentLink']);
    }
}
