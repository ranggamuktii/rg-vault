<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('content');
            $table->json('tags')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'title']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('notes');
    }
};
