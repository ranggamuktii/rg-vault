<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('links', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->text('url');
            $table->string('title')->nullable();
            $table->text('description')->nullable();
            $table->text('favicon_url')->nullable();
            $table->string('category', 100)->nullable();
            $table->timestamps();

            $table->index(['user_id', 'category']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('links');
    }
};
