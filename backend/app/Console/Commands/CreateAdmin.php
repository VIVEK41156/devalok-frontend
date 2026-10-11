<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Support\Activity;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

/**
 * First-admin provisioning. Interactive by default (password typed at a hidden
 * prompt). For automated environments the password may instead come from the
 * DEVALOK_ADMIN_PASSWORD environment variable — never from a command-line flag,
 * so it doesn't end up in shell history.
 */
class CreateAdmin extends Command
{
    protected $signature = 'devalok:create-admin
        {--email= : Login email}
        {--name= : Display name}
        {--role=admin : admin or editor}';

    protected $description = 'Create (or reset the password of) a Devalok CMS administrator';

    public function handle(): int
    {
        $email = $this->option('email') ?: $this->ask('Email address');
        $name = $this->option('name') ?: $this->ask('Full name', 'Administrator');
        $role = $this->option('role');
        $password = getenv('DEVALOK_ADMIN_PASSWORD') ?: null;

        if (! $password) {
            $password = $this->secret('Password (min 12 chars, upper + lower case + number)');
            $confirm = $this->secret('Confirm password');
            if ($password !== $confirm) {
                $this->error('Passwords do not match.');

                return self::FAILURE;
            }
        }

        $v = Validator::make(compact('email', 'name', 'role', 'password'), [
            'email' => ['required', 'email', 'max:190'],
            'name' => ['required', 'string', 'max:120'],
            'role' => ['required', 'in:'.implode(',', User::ROLES)],
            'password' => ['required', Password::min(12)->letters()->mixedCase()->numbers()],
        ]);
        if ($v->fails()) {
            foreach ($v->errors()->all() as $msg) {
                $this->error($msg);
            }

            return self::FAILURE;
        }

        $user = User::query()->where('email', $email)->first();
        $existed = (bool) $user;
        $user ??= new User(['email' => $email]);
        $user->fill(['name' => $name, 'password' => $password, 'role' => $role, 'is_active' => true])->save();
        Activity::record($existed ? 'user.password_reset_cli' : 'user.created_cli', $user, "Account {$email} provisioned from the command line", [], $user->id);

        $this->info(($existed ? 'Updated' : 'Created')." {$role} account for {$email}.");

        return self::SUCCESS;
    }
}
