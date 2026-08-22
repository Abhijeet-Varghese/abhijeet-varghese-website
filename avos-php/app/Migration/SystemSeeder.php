<?php
declare(strict_types=1);
namespace AvOS\Migration;

use AvOS\Database\Connection;

/**
 * System seed data (Phase 2 §3B.7).
 *
 * ONLY data the application cannot function without: roles, permissions and
 * required settings. Absolutely no fabricated business data — no clients,
 * leads, bookings, testimonials or projects. The previous system shipped
 * invented Deloitte/PwC/Sony records to a public path; that must never recur.
 *
 * Idempotent: every insert is an upsert keyed on a natural unique column, so
 * running the seeder twice changes nothing.
 */
final class SystemSeeder
{
    /** domain => [action => label] */
    private const PERMISSIONS = [
        // content.delete added in Phase 3E (contract amendment A6): the API
        // contract routes experience CRUD through `content.*`, but the Phase 2
        // permission set had no delete action for that domain — pages/projects/
        // articles all have one. Granted ONLY through the owner/administrator
        // wildcard, matching the fact that editors and content managers do not
        // hold pages.delete either.
        'content'    => ['read' => 'Read content', 'write' => 'Edit content', 'delete' => 'Delete content'],
        'pages'      => ['read' => 'Read pages', 'write' => 'Edit pages', 'delete' => 'Delete pages'],
        'projects'   => ['read' => 'Read projects', 'write' => 'Edit projects', 'delete' => 'Delete projects'],
        'articles'   => ['read' => 'Read articles', 'write' => 'Edit articles', 'delete' => 'Delete articles'],
        'media'      => ['read' => 'Read media', 'write' => 'Manage media', 'delete' => 'Delete media'],
        'seo'        => ['read' => 'Read SEO', 'write' => 'Edit SEO'],
        'routes'     => ['read' => 'Read routes', 'write' => 'Edit routes'],
        'redirects'  => ['read' => 'Read redirects', 'write' => 'Edit redirects'],
        'navigation' => ['read' => 'Read navigation', 'write' => 'Edit navigation'],
        'forms'      => ['read' => 'Read forms', 'write' => 'Edit forms'],
        'leads'      => ['read' => 'Read leads', 'write' => 'Edit leads'],
        'crm'        => ['read' => 'Read CRM', 'write' => 'Edit CRM'],
        'bookings'   => ['read' => 'Read bookings', 'write' => 'Manage bookings'],
        'webgl'      => ['read' => 'Read WebGL assets', 'write' => 'Edit WebGL assets'],
        'animations' => ['read' => 'Read animations', 'write' => 'Edit animations'],
        'publishing' => ['publish' => 'Publish content', 'rollback' => 'Roll back a publish'],
        'versions'   => ['read' => 'Read revisions', 'restore' => 'Restore a revision'],
        'users'      => ['read' => 'Read users', 'write' => 'Manage users'],
        'roles'      => ['manage' => 'Manage roles'],
        'audit'      => ['read' => 'Read the audit log'],
        'settings'   => ['read' => 'Read settings', 'write' => 'Edit settings'],
        'backup'     => ['read' => 'Read backups', 'manage' => 'Manage backups'],
        'jobs'       => ['manage' => 'Manage jobs'],
        'system'     => ['manage' => 'Manage the system'],
    ];

    /** role slug => [name, description, permission codes | '*'] */
    private const ROLES = [
        'owner' => ['Owner', 'Full control, including owner-only operations', '*'],
        'administrator' => ['Administrator', 'Full control except owner-only operations', '*'],
        'editor' => ['Editor', 'Create, edit and publish content', [
            'content.read','content.write','pages.read','pages.write','projects.read','projects.write',
            'articles.read','articles.write','media.read','media.write','seo.read','seo.write',
            'navigation.read','versions.read','versions.restore','publishing.publish',
        ]],
        'content_manager' => ['Content Manager', 'Create and edit content, cannot publish', [
            'content.read','content.write','pages.read','pages.write','projects.read','projects.write',
            'articles.read','articles.write','media.read','media.write','seo.read','versions.read',
        ]],
        'seo_manager' => ['SEO Manager', 'SEO, routes and redirects', [
            'content.read','seo.read','seo.write','routes.read','routes.write',
            'redirects.read','redirects.write','navigation.read',
        ]],
        'media_manager' => ['Media Manager', 'Manage the media library', [
            'content.read','media.read','media.write','media.delete',
        ]],
        'booking_manager' => ['Booking Manager', 'Bookings and enquiries', [
            'bookings.read','bookings.write','leads.read','leads.write','crm.read','forms.read',
        ]],
    ];

    /** key => [value, type, is_public] — is_public gates unauthenticated reads. */
    private const SETTINGS = [
        'site.name'            => ['AV OS', 'string', 1],
        'site.timezone'        => ['Asia/Kolkata', 'string', 1],
        'site.locale'          => ['en', 'string', 1],
        'publishing.mode'      => ['static', 'string', 0],
        'security.login_max_attempts' => ['5', 'int', 0],
        'security.login_lock_minutes' => ['15', 'int', 0],
        'booking.hold_minutes' => ['10', 'int', 0],
        'media.max_upload_mb'  => ['20', 'int', 0],
        'queue.max_seconds'    => ['50', 'int', 0],
    ];

    public function __construct(private readonly Connection $db) {}

    /** @return array{permissions:int,roles:int,settings:int,navigation:int} */
    public function run(): array
    {
        return $this->db->transaction(function (Connection $db): array {
            $permCount = 0;
            foreach (self::PERMISSIONS as $domain => $actions) {
                foreach ($actions as $action => $label) {
                    $db->run(
                        'INSERT INTO permissions (code, label, domain) VALUES (?,?,?)
                         ON DUPLICATE KEY UPDATE label=VALUES(label), domain=VALUES(domain)',
                        ["{$domain}.{$action}", $label, $domain],
                    );
                    $permCount++;
                }
            }

            $allCodes = [];
            foreach (self::PERMISSIONS as $domain => $actions) {
                foreach (array_keys($actions) as $action) $allCodes[] = "{$domain}.{$action}";
            }

            $roleCount = 0;
            foreach (self::ROLES as $slug => [$name, $desc, $codes]) {
                $db->run(
                    'INSERT INTO roles (slug, name, description, is_system) VALUES (?,?,?,1)
                     ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description)',
                    [$slug, $name, $desc],
                );
                $roleId = (int)$db->scalar('SELECT id FROM roles WHERE slug=?', [$slug]);
                $wanted = $codes === '*' ? $allCodes : $codes;
                foreach ($wanted as $code) {
                    $permId = (int)$db->scalar('SELECT id FROM permissions WHERE code=?', [$code]);
                    if ($permId === 0) continue;
                    $db->run(
                        'INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?,?)',
                        [$roleId, $permId],
                    );
                }
                $roleCount++;
            }

            $settingCount = 0;
            foreach (self::SETTINGS as $key => [$value, $type, $public]) {
                $db->run(
                    'INSERT INTO site_settings (skey, svalue, value_type, is_public) VALUES (?,?,?,?)
                     ON DUPLICATE KEY UPDATE value_type=VALUES(value_type), is_public=VALUES(is_public)',
                    [$key, $value, $type, $public],
                );
                $settingCount++;
            }

            // Empty navigation groups: the site chrome expects these to exist.
            // Structure only — no items, no fabricated links.
            $navCount = 0;
            foreach ([['primary','Primary'],['footer','Footer'],['utility','Utility']] as [$slug, $name]) {
                $db->run(
                    'INSERT INTO navigation (slug, name) VALUES (?,?)
                     ON DUPLICATE KEY UPDATE name=VALUES(name)',
                    [$slug, $name],
                );
                $navCount++;
            }

            return ['permissions' => $permCount, 'roles' => $roleCount,
                    'settings' => $settingCount, 'navigation' => $navCount];
        });
    }
}
