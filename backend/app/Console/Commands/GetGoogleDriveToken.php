<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Google_Client;
use Google_Service_Drive;

class GetGoogleDriveToken extends Command
{
    protected $signature = 'google-drive:get-token';
    protected $description = 'Get Google Drive refresh token';

    public function handle()
    {
        $client = new Google_Client();
        $client->setClientId(env('GOOGLE_DRIVE_CLIENT_ID'));
        $client->setClientSecret(env('GOOGLE_DRIVE_CLIENT_SECRET'));
        $client->setRedirectUri(env('GOOGLE_DRIVE_REDIRECT_URI'));
        $client->addScope(Google_Service_Drive::DRIVE);
        $client->setAccessType('offline');
        $client->setPrompt('consent');

        $authUrl = $client->createAuthUrl();
        $this->info("Buka link ini di browser:");
        $this->line($authUrl);

        $authCode = $this->ask("Masukkan code dari URL setelah login:");

        $accessToken = $client->fetchAccessTokenWithAuthCode($authCode);
        if (isset($accessToken['refresh_token'])) {
            $this->info("Refresh Token kamu:");
            $this->line($accessToken['refresh_token']);
        } else {
            $this->error("Gagal mendapatkan refresh token. Pastikan kamu pilih 'consent' setiap login.");
        }
    }
}
