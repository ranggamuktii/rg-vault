<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('filename');
            $table->text('storage_url');
            $table->string('storage_id')->nullable();
            $table->string('mimetype', 100);
            $table->bigInteger('size');
            $table->string('category', 100)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'category']);
            $table->index(['mimetype']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('files');
    }
};
