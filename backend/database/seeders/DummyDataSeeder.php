<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Note;
use App\Models\Link;
use App\Models\File;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DummyDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🚀 Starting dummy data creation...');

        // Clear existing data
        Note::truncate();
        Link::truncate();
        File::truncate();
        User::truncate();

        // Create users
        $admin = User::create([
            'name' => 'Rangga Mukti',
            'email' => 'daniswara.ranggamukti@gmail.com',
            'password' => Hash::make('rangga123'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        $test = User::create([
            'name' => 'User',
            'email' => 'user@gmail.com',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        $this->command->info('✅ Users created');

        // Create Notes
        $this->createNotes($admin);
        $this->createNotes($test);

        // Create Links
        $this->createLinks($admin);
        $this->createLinks($test);

        // Create sample Files (metadata only)
        $this->createFiles($admin);
        $this->createFiles($test);

        $this->command->info('🎉 Dummy data creation completed!');
        $this->command->info('📊 Summary:');
        $this->command->info('👤 Users: ' . User::count());
        $this->command->info('📝 Notes: ' . Note::count());
        $this->command->info('🔗 Links: ' . Link::count());
        $this->command->info('📁 Files: ' . File::count());
        $this->command->info('');
        $this->command->info('🔐 Login Credentials:');
        $this->command->info('📧 admin@example.com / password123');
        $this->command->info('📧 test@example.com / password123');
    }

    private function createNotes($user)
    {
        $notes = [
            [
                'title' => 'Project Ideas',
                'content' => "# Awesome Project Ideas\n\n1. **Personal Dashboard**\n   - Track daily habits\n   - Mood tracker\n   - Goal setting\n\n2. **Recipe Manager**\n   - Save favorite recipes\n   - Meal planning\n   - Shopping list generator\n\n3. **Book Library**\n   - Reading list\n   - Book reviews\n   - Reading progress tracker",
                'tags' => ['ideas', 'projects', 'development']
            ],
            [
                'title' => 'Meeting Notes - Team Standup',
                'content' => "## Daily Standup - " . now()->format('Y-m-d') . "\n\n**Attendees:** John, Sarah, Mike, Emma\n\n**Completed:**\n- Fixed login bug\n- Updated documentation\n- Code review for feature X\n\n**Today's Goals:**\n- Deploy to staging\n- Start working on user dashboard\n- Database optimization\n\n**Blockers:**\n- Waiting for API access from external service\n- Need design review for new components",
                'tags' => ['meeting', 'standup', 'work']
            ],
            [
                'title' => 'Learning Resources',
                'content' => "# Learning Resources Collection\n\n## Frontend Development\n- React Hooks in depth\n- TypeScript advanced patterns\n- CSS Grid and Flexbox mastery\n\n## Backend Development\n- Laravel best practices\n- Database optimization techniques\n- API design principles\n\n## DevOps\n- Docker containerization\n- CI/CD pipelines\n- AWS services overview",
                'tags' => ['learning', 'resources', 'development']
            ],
            [
                'title' => 'Travel Planning - Japan 2024',
                'content' => "# Japan Trip Planning\n\n## Itinerary\n**Week 1: Tokyo**\n- Shibuya & Harajuku\n- Akihabara electronics district\n- Tsukiji fish market\n- Imperial Palace\n\n**Week 2: Kyoto & Osaka**\n- Fushimi Inari shrine\n- Bamboo forest\n- Osaka castle\n- Local food tours\n\n## Budget\n- Flights: $800\n- Accommodation: $1200\n- Food & Activities: $800\n- Total: $2800",
                'tags' => ['travel', 'planning', 'japan', 'personal']
            ],
            [
                'title' => 'Quick Tips & Tricks',
                'content' => "# Quick Tips Collection\n\n## Productivity\n- Use Pomodoro technique (25min focus + 5min break)\n- Write tomorrow's tasks before ending today\n- Keep a 'parking lot' for random thoughts\n\n## Coding\n- Always use meaningful variable names\n- Write tests first, then implementation\n- Refactor regularly to avoid technical debt\n\n## Health\n- Take breaks every hour\n- Stay hydrated\n- 10 minutes walk after meals",
                'tags' => ['tips', 'productivity', 'health', 'coding']
            ],
            [
                'title' => 'Recipe: Pasta Carbonara',
                'content' => "# Authentic Pasta Carbonara\n\n## Ingredients (4 servings)\n- 400g spaghetti\n- 200g guanciale (or pancetta)\n- 4 large eggs\n- 100g Pecorino Romano cheese\n- Black pepper\n- Salt\n\n## Instructions\n1. Boil salted water, cook pasta al dente\n2. Dice and cook guanciale until crispy\n3. Whisk eggs with grated cheese and pepper\n4. Mix hot pasta with guanciale\n5. Add egg mixture off heat, toss quickly\n6. Serve immediately with extra cheese\n\n*The key is timing - no cream needed!*",
                'tags' => ['recipe', 'cooking', 'italian', 'pasta']
            ]
        ];

        foreach ($notes as $index => $noteData) {
            Note::create([
                'user_id' => $user->id,
                'title' => $noteData['title'],
                'content' => $noteData['content'],
                'tags' => $noteData['tags'],
                'created_at' => now()->subDays(rand(0, 30)),
                'updated_at' => now()->subDays(rand(0, 10))
            ]);
        }
    }

    private function createLinks($user)
    {
        $links = [
            [
                'url' => 'https://laravel.com',
                'title' => 'Laravel - The PHP Framework for Web Artisans',
                'description' => 'Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience.',
                'favicon_url' => 'https://laravel.com/img/favicon/favicon.ico',
                'category' => 'Development'
            ],
            [
                'url' => 'https://react.dev',
                'title' => 'React - A JavaScript library for building user interfaces',
                'description' => 'React makes it painless to create interactive UIs. Design simple views for each state in your application.',
                'favicon_url' => 'https://react.dev/favicon.ico',
                'category' => 'Development'
            ],
            [
                'url' => 'https://tailwindcss.com',
                'title' => 'Tailwind CSS - Rapidly build modern websites',
                'description' => 'A utility-first CSS framework packed with classes that can be composed to build any design, directly in your markup.',
                'favicon_url' => 'https://tailwindcss.com/favicons/favicon.ico',
                'category' => 'Design'
            ],
            [
                'url' => 'https://github.com',
                'title' => 'GitHub - Where the world builds software',
                'description' => 'GitHub is where over 100 million developers shape the future of software, together.',
                'favicon_url' => 'https://github.com/favicon.ico',
                'category' => 'Development'
            ],
            [
                'url' => 'https://stackoverflow.com',
                'title' => 'Stack Overflow - Where Developers Learn & Share',
                'description' => 'Stack Overflow is the largest, most trusted online community for developers to learn, share their programming knowledge.',
                'favicon_url' => 'https://stackoverflow.com/favicon.ico',
                'category' => 'Development'
            ],
            [
                'url' => 'https://medium.com',
                'title' => 'Medium - Where good ideas find you',
                'description' => 'Medium is an open platform where readers find dynamic thinking, and where expert and undiscovered voices can share their writing.',
                'favicon_url' => 'https://medium.com/favicon.ico',
                'category' => 'Reading'
            ],
            [
                'url' => 'https://dribbble.com',
                'title' => 'Dribbble - Discover the World\'s Top Designers',
                'description' => 'Find top designers & creative professionals on Dribbble. We are where designers gain inspiration, feedback, community, and jobs.',
                'favicon_url' => 'https://dribbble.com/favicon.ico',
                'category' => 'Design'
            ],
            [
                'url' => 'https://devdocs.io',
                'title' => 'DevDocs - API Documentation Browser',
                'description' => 'Fast, offline, and free documentation browser for developers. Search 100+ docs in one web app.',
                'favicon_url' => 'https://devdocs.io/favicon.ico',
                'category' => 'Development'
            ],
            [
                'url' => 'https://fonts.google.com',
                'title' => 'Google Fonts',
                'description' => 'Making the web more beautiful, fast, and open through great typography.',
                'favicon_url' => 'https://fonts.google.com/favicon.ico',
                'category' => 'Design'
            ],
            [
                'url' => 'https://unsplash.com',
                'title' => 'Unsplash - Beautiful Free Images & Pictures',
                'description' => 'Beautiful, free images and photos that you can download and use for any project. Better than any royalty free or stock photos.',
                'favicon_url' => 'https://unsplash.com/favicon.ico',
                'category' => 'Resources'
            ],
            [
                'url' => 'https://notion.so',
                'title' => 'Notion - One workspace. Every team.',
                'description' => 'A new tool that blends your everyday work apps into one. It\'s the all-in-one workspace for you and your team.',
                'favicon_url' => 'https://notion.so/favicon.ico',
                'category' => 'Productivity'
            ],
            [
                'url' => 'https://figma.com',
                'title' => 'Figma - The collaborative interface design tool',
                'description' => 'Build better products as a team. Design, prototype, and gather feedback all in one place with Figma.',
                'favicon_url' => 'https://figma.com/favicon.ico',
                'category' => 'Design'
            ]
        ];

        foreach ($links as $linkData) {
            Link::create([
                'user_id' => $user->id,
                'url' => $linkData['url'],
                'title' => $linkData['title'],
                'description' => $linkData['description'],
                'favicon_url' => $linkData['favicon_url'],
                'category' => $linkData['category'],
                'created_at' => now()->subDays(rand(0, 20)),
                'updated_at' => now()->subDays(rand(0, 5))
            ]);
        }
    }

    private function createFiles($user)
    {
        $files = [
            [
                'filename' => 'project-presentation.pdf',
                'storage_url' => 'https://example.com/files/project-presentation.pdf',
                'storage_id' => 'gdrive_001',
                'mimetype' => 'application/pdf',
                'size' => 2048576, // 2MB
                'category' => 'Work'
            ],
            [
                'filename' => 'vacation-photo.jpg',
                'storage_url' => 'https://example.com/files/vacation-photo.jpg',
                'storage_id' => 'gdrive_002',
                'mimetype' => 'image/jpeg',
                'size' => 1536000, // 1.5MB
                'category' => 'Personal'
            ],
            [
                'filename' => 'meeting-recording.mp3',
                'storage_url' => 'https://example.com/files/meeting-recording.mp3',
                'storage_id' => 'gdrive_003',
                'mimetype' => 'audio/mpeg',
                'size' => 5242880, // 5MB
                'category' => 'Work'
            ],
            [
                'filename' => 'budget-spreadsheet.xlsx',
                'storage_url' => 'https://example.com/files/budget-spreadsheet.xlsx',
                'storage_id' => 'gdrive_004',
                'mimetype' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'size' => 512000, // 500KB
                'category' => 'Finance'
            ],
            [
                'filename' => 'design-mockup.png',
                'storage_url' => 'https://example.com/files/design-mockup.png',
                'storage_id' => 'gdrive_005',
                'mimetype' => 'image/png',
                'size' => 3072000, // 3MB
                'category' => 'Design'
            ]
        ];

        foreach ($files as $fileData) {
            File::create([
                'user_id' => $user->id,
                'filename' => $fileData['filename'],
                'storage_url' => $fileData['storage_url'],
                'storage_id' => $fileData['storage_id'],
                'mimetype' => $fileData['mimetype'],
                'size' => $fileData['size'],
                'category' => $fileData['category'],
                'created_at' => now()->subDays(rand(0, 15)),
                'updated_at' => now()->subDays(rand(0, 3))
            ]);
        }
    }
}
