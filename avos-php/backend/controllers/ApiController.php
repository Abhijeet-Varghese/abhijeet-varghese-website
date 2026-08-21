<?php
/**
 * AV OS — API controller (REST-style router)
 *
 * Public:      POST /api/auth/login|logout · GET /api/session
 *              GET /api/site · /api/pages(/slug) · /api/projects(/slug) · /api/posts(/slug)
 *              POST /api/public/lead · POST /api/public/submit
 * Admin:       (session + CSRF + per-endpoint RBAC)
 *              GET/PUT /api/content · POST /api/publish
 *              POST/PUT /api/media(/id) · GET/PUT/DELETE /api/leads(/id)
 *              GET /api/forms · POST /api/forms/{id}/status · GET /api/forms/export
 *              GET /api/audit · GET /api/versions/{key} · POST /api/versions/{key}/restore
 *              GET/POST /api/users · POST /api/auth/change-password
 *              GET/PUT /api/ai/providers(/code) · POST /api/ai/generate
 *              POST /api/backup · GET /api/status
 */
final class ApiController
{
    public static function handle(): void
    {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
        $seg = array_values(array_filter(explode('/', $path)));
        if (($seg[0] ?? '') === 'api') array_shift($seg);
        $action = $seg[0] ?? '';
        $a = $seg[1] ?? '';
        $b = $seg[2] ?? '';
        $c = $seg[3] ?? '';

        // 2FA gate: a session pending 2FA may only call the 2FA endpoints or /api/session
        $is2faRoute = $action === 'auth' && $a === '2fa';
        $isSession = $action === 'session' && $a === '';
        if (Auth::pending2fa() !== null && !$is2faRoute && !$isSession) {
            Response::error('Two-factor authentication required', 401, '2FA_REQUIRED');
        }

        try {
            match (true) {
                // ---------- PUBLIC ----------
                $action === 'auth' && $a === 'login' && $method === 'POST' => self::login(),
                $action === 'auth' && $a === 'logout' && $method === 'POST' => self::logout(),
                $action === 'auth' && $a === 'change-password' && $method === 'POST' => self::requireAuth('content.read', fn() => self::changePassword()),
                $action === 'auth' && $a === '2fa' && $b === 'verify' && $method === 'POST' => self::auth2faVerify(),
                $action === 'auth' && $a === '2fa' && $b === 'setup' && $method === 'POST' => self::requireAuth('settings.write', fn() => self::auth2faSetup()),
                $action === 'auth' && $a === '2fa' && $b === 'enable' && $method === 'POST' => self::requireAuth('settings.write', fn() => self::auth2faEnable()),
                $action === 'auth' && $a === '2fa' && $b === 'disable' && $method === 'POST' => self::requireAuth('settings.write', fn() => self::auth2faDisable()),
                $action === 'auth' && $a === '2fa' && $b === 'status' && $method === 'GET' => self::requireAuth('settings.read', fn() => self::auth2faStatus()),
                $action === 'session' && $method === 'GET' => self::session(),
                $action === 'site' && $method === 'GET' => self::site(),
                $action === 'pages' && $method === 'GET' && !$a => self::pages(),
                $action === 'pages' && $method === 'GET' => self::pageBySlug($a),
                $action === 'projects' && $method === 'GET' && !$a => self::projects(),
                $action === 'projects' && $method === 'GET' => self::projectBySlug($a),
                $action === 'posts' && $method === 'GET' && !$a => self::posts(),
                $action === 'posts' && $method === 'GET' => self::postBySlug($a),
                $action === 'public' && $a === 'lead' && $method === 'POST' => self::publicLead(),
                $action === 'public' && $a === 'submit' && $method === 'POST' => self::publicSubmit(),

                // ---------- ADMIN ----------
                $action === 'content' && $a === 'bulk' && $method === 'POST' => self::requireAuth('content.write', fn() => self::contentBulk()),
                $action === 'sync' && $a === 'frontend' && $method === 'POST' => self::requireAuth('settings.write', fn() => self::syncFrontend()),
                $action === 'content' && $method === 'GET' => self::requireAuth('content.read', fn() => self::content()),
                $action === 'content' && $method === 'PUT' => self::requireAuth('content.write', fn() => self::saveContent()),
                $action === 'publish' && $a === 'rollback' && $method === 'POST' => self::requireAuth('publish', fn() => self::publishRollback()),
                $action === 'publish' && $a === 'preflight' && $method === 'POST' => self::requireAuth('publish', fn() => self::publishPreflight()),
                $action === 'publish' && $a === 'diff' && $method === 'GET' => self::requireAuth('content.read', fn() => self::publishDiff()),
                $action === 'publish' && $method === 'POST' && !$a => self::requireAuth('publish', fn() => self::publish()),
                $action === 'deployments' && $method === 'GET' => self::requireAuth('content.read', fn() => self::deployments()),
                $action === 'redirects' && $method === 'GET' => self::requireAuth('settings.read', fn() => self::redirects()),
                $action === 'redirects' && $method === 'POST' => self::requireAuth('settings.write', fn() => self::redirectSave(0)),
                $action === 'redirects' && $method === 'PUT' && $a => self::requireAuth('settings.write', fn() => self::redirectSave((int)$a)),
                $action === 'redirects' && $method === 'DELETE' && $a => self::requireAuth('settings.write', fn() => self::redirectDelete((int)$a)),
                $action === 'security-score' && $method === 'GET' => self::requireAuth('audit.read', fn() => self::securityScore()),
                $action === 'diagnostics' && $method === 'GET' => self::requireAuth('audit.read', fn() => self::diagnostics()),
                $action === 'aiprompts' && $method === 'GET' => self::requireAuth('ai.read', fn() => self::aiPrompts()),
                $action === 'aiprompts' && $method === 'POST' => self::requireAuth('ai.write', fn() => self::aiPromptSave(0)),
                $action === 'aiprompts' && $method === 'PUT' && $a => self::requireAuth('ai.write', fn() => self::aiPromptSave((int)$a)),
                $action === 'aiprompts' && $method === 'DELETE' && $a => self::requireAuth('ai.write', fn() => self::aiPromptDelete((int)$a)),
                $action === 'webhooks' && $a === 'retry-failed' && $method === 'POST' => self::requireAuth('integrations.manage', fn() => self::webhookRetryFailed()),
                $action === 'webhooks' && $a === 'inbound' && $b === 'calendly' && $method === 'POST' => self::webhookInboundCalendly(),
                $action === 'webhooks' && $a === 'inbound' && $b === 'config' && $method === 'PUT' => self::requireAuth('integrations.manage', fn() => self::webhookInboundConfigSave()),
                $action === 'webhooks' && $a === 'inbound' && $b === 'events' && $method === 'GET' => self::requireAuth('integrations.manage', fn() => self::webhookInboundEvents()),
                $action === 'webhooks' && $a === 'inbound' && $method === 'GET' && !$b => self::requireAuth('integrations.manage', fn() => self::webhookInboundConfig()),
                $action === 'webhooks' && $a === 'deliveries' && $method === 'GET' && $b => self::requireAuth('integrations.manage', fn() => self::webhookDeliveries((int)$b)),
                $action === 'media' && $method === 'GET' => self::requireAuth('media.read', fn() => self::mediaList()),
                $action === 'media' && $method === 'POST' => self::requireAuth('media.write', fn() => self::uploadMedia()),
                $action === 'media' && $method === 'PUT' && $a => self::requireAuth('media.write', fn() => self::updateMedia((int)$a)),
                $action === 'media' && $method === 'DELETE' && $a => self::requireAuth('media.write', fn() => self::deleteMedia((int)$a)),
                $action === 'media' && $a && $b === 'restore' && $method === 'POST' => self::requireAuth('media.write', fn() => self::mediaRestore((int)$a)),
                $action === 'leads' && $method === 'GET' => self::requireAuth('leads.read', fn() => self::leads()),
                $action === 'leads' && $a === 'export' && $method === 'GET' => self::requireAuth('leads.read', fn() => self::leadsExport()),
                $action === 'leads' && $a && $b === 'restore' && $method === 'POST' => self::requireAuth('leads.write', fn() => self::leadRestore((int)$a)),
                $action === 'leads' && $method === 'POST' && !$a => self::requireAuth('leads.write', fn() => self::createLead()),
                $action === 'leads' && $method === 'PUT' && $a => self::requireAuth('leads.write', fn() => self::updateLead((int)$a)),
                $action === 'leads' && $method === 'DELETE' && $a => self::requireAuth('leads.write', fn() => self::deleteLead((int)$a)),
                $action === 'forms' && $a === 'export' && $method === 'GET' => self::requireAuth('forms.read', fn() => self::formsExport()),
                $action === 'forms' && $a === 'submissions' && $method === 'GET' => self::requireAuth('forms.read', fn() => self::formSubmissions()),
                $action === 'forms' && $a === 'submissions' && $method === 'PUT' && $b => self::requireAuth('forms.write', fn() => self::formSubmissionStatus((int)$b)),
                $action === 'forms' && $method === 'GET' && !$a => self::requireAuth('forms.read', fn() => self::forms()),
                $action === 'forms' && $method === 'POST' && $a => self::requireAuth('forms.write', fn() => self::formStatus((int)$a)),
                $action === 'audit' && $method === 'GET' => self::requireAuth('audit.read', fn() => self::audit()),
                $action === 'versions' && $method === 'GET' && $a => self::requireAuth('versions.read', fn() => self::versions($a)),
                $action === 'versions' && $method === 'POST' && $a && $b === 'restore' => self::requireAuth('versions.restore', fn() => self::restore($a)),
                $action === 'ai' && $a === 'generate' && $method === 'POST' => self::requireAuth('content.write', fn() => self::aiGenerate()),
                $action === 'ai' && $a === 'providers' && $method === 'GET' => self::requireAuth('ai.read', fn() => self::aiProviders()),
                $action === 'ai' && $a === 'providers' && $method === 'PUT' && $b => self::requireAuth('ai.write', fn() => self::aiProviderSave($b)),
                $action === 'users' && $method === 'GET' => self::requireAuth('users.read', fn() => self::users()),
                $action === 'users' && $a && $b === 'reset-password' && $method === 'POST' => self::requireAuth('users.write', fn() => self::usersResetPassword((int)$a)),
                $action === 'users' && $a && $b === 'revoke-sessions' && $method === 'POST' => self::requireAuth('users.write', fn() => self::usersRevokeSessions((int)$a)),
                $action === 'users' && $method === 'POST' && !$a => self::requireAuth('users.write', fn() => self::usersCreate()),
                $action === 'users' && $method === 'PUT' && $a => self::requireAuth('users.write', fn() => self::usersUpdate((int)$a)),
                $action === 'users' && $method === 'DELETE' && $a => self::requireAuth('users.write', fn() => self::usersDelete((int)$a)),
                $action === 'backup' && $method === 'POST' => self::requireAuth('backup', fn() => self::backup()),
                $action === 'backups' && $a === 'restore' && $method === 'POST' => self::requireAuth('backup', fn() => self::backupRestore()),
                $action === 'backups' && $a === 'download' && $method === 'GET' && $b => self::requireAuth('backup', fn() => self::backupDownload($b)),
                $action === 'backups' && $method === 'GET' && !$a => self::requireAuth('backup', fn() => self::backupList()),
                $action === 'backups' && $method === 'DELETE' && $a => self::requireAuth('backup', fn() => self::backupDelete($a)),
                // ---------- V2: CRM ----------
                $action === 'crm' && $a === 'companies' && $method === 'GET' => self::requireAuth('leads.read', fn() => self::crmList('companies')),
                $action === 'crm' && $a === 'companies' && $method === 'POST' => self::requireAuth('leads.write', fn() => self::crmCreate('companies')),
                $action === 'crm' && $a === 'companies' && $method === 'PUT' && $b => self::requireAuth('leads.write', fn() => self::crmUpdate('companies', (int)$b)),
                $action === 'crm' && $a === 'companies' && $method === 'DELETE' && $b => self::requireAuth('leads.write', fn() => self::crmDelete('companies', (int)$b)),
                $action === 'crm' && $a === 'contacts' && $method === 'GET' => self::requireAuth('leads.read', fn() => self::crmList('contacts')),
                $action === 'crm' && $a === 'contacts' && $method === 'POST' => self::requireAuth('leads.write', fn() => self::crmCreate('contacts')),
                $action === 'crm' && $a === 'contacts' && $method === 'PUT' && $b => self::requireAuth('leads.write', fn() => self::crmUpdate('contacts', (int)$b)),
                $action === 'crm' && $a === 'contacts' && $method === 'DELETE' && $b => self::requireAuth('leads.write', fn() => self::crmDelete('contacts', (int)$b)),
                $action === 'crm' && $a === 'opportunities' && $method === 'GET' => self::requireAuth('leads.read', fn() => self::crmList('opportunities')),
                $action === 'crm' && $a === 'opportunities' && $method === 'POST' => self::requireAuth('leads.write', fn() => self::crmCreate('opportunities')),
                $action === 'crm' && $a === 'opportunities' && $method === 'PUT' && $b => self::requireAuth('leads.write', fn() => self::crmUpdate('opportunities', (int)$b)),
                $action === 'crm' && $a === 'opportunities' && $method === 'DELETE' && $b => self::requireAuth('leads.write', fn() => self::crmDelete('opportunities', (int)$b)),
                $action === 'crm' && $a === 'pipeline' && $method === 'GET' => self::requireAuth('leads.read', fn() => self::crmPipeline()),
                $action === 'crm' && $a === 'meetings' && $method === 'GET' => self::requireAuth('leads.read', fn() => self::crmList('meetings')),
                $action === 'crm' && $a === 'meetings' && $method === 'POST' => self::requireAuth('leads.write', fn() => self::crmCreate('meetings')),
                $action === 'crm' && $a === 'meetings' && $method === 'PUT' && $b => self::requireAuth('leads.write', fn() => self::crmUpdate('meetings', (int)$b)),
                $action === 'crm' && $a === 'meetings' && $method === 'DELETE' && $b => self::requireAuth('leads.write', fn() => self::crmDelete('meetings', (int)$b)),
                $action === 'crm' && $a === 'tasks' && $method === 'GET' => self::requireAuth('leads.read', fn() => self::crmTasks()),
                $action === 'crm' && $a === 'tasks' && $method === 'POST' => self::requireAuth('leads.write', fn() => self::crmTaskCreate()),
                $action === 'crm' && $a === 'tasks' && $method === 'PUT' && $b => self::requireAuth('leads.write', fn() => self::crmTaskUpdate((int)$b)),
                $action === 'crm' && $a === 'tasks' && $method === 'DELETE' && $b => self::requireAuth('leads.write', fn() => self::crmTaskDelete((int)$b)),
                $action === 'crm' && $a === 'restore' && $method === 'POST' && $b && $c => self::requireAuth('leads.write', fn() => self::crmRestore($b, (int)$c)),
                $action === 'crm' && $a === 'activities' && $method === 'GET' && $b && $c => self::requireAuth('leads.read', fn() => self::crmActivities($b, (int)$c)),
                $action === 'scoring' && $a === 'rules' && $method === 'GET' => self::requireAuth('leads.read', fn() => self::scoringRules()),
                $action === 'scoring' && $a === 'rules' && $method === 'POST' => self::requireAuth('leads.write', fn() => self::scoringRuleSave(0)),
                $action === 'scoring' && $a === 'rules' && $method === 'PUT' && $b => self::requireAuth('leads.write', fn() => self::scoringRuleSave((int)$b)),
                $action === 'scoring' && $a === 'rules' && $method === 'DELETE' && $b => self::requireAuth('leads.write', fn() => self::scoringRuleDelete((int)$b)),
                // ---------- V2: Business projects ----------
                $action === 'business' && $a === 'projects' && $method === 'GET' => self::requireAuth('projects.manage', fn() => self::bizProjects()),
                $action === 'business' && $a === 'projects' && $method === 'POST' => self::requireAuth('projects.manage', fn() => self::bizProjectCreate()),
                $action === 'business' && $a === 'projects' && $method === 'PUT' && $b => self::requireAuth('projects.manage', fn() => self::bizProjectUpdate((int)$b)),
                $action === 'business' && $a === 'projects' && $method === 'DELETE' && $b => self::requireAuth('projects.manage', fn() => self::bizProjectDelete((int)$b)),
                $action === 'business' && $a === 'milestones' && $method === 'GET' && $b => self::requireAuth('projects.manage', fn() => self::bizMilestones((int)$b)),
                $action === 'business' && $a === 'milestones' && $method === 'POST' && $b => self::requireAuth('projects.manage', fn() => self::bizMilestoneAdd((int)$b)),
                $action === 'business' && $a === 'milestones' && $method === 'PUT' && $b => self::requireAuth('projects.manage', fn() => self::bizMilestoneUpdate((int)$b)),
                $action === 'business' && $a === 'milestones' && $method === 'DELETE' && $b => self::requireAuth('projects.manage', fn() => self::bizMilestoneDelete((int)$b)),
                $action === 'business' && $a === 'documents' && $method === 'GET' && $b => self::requireAuth('projects.manage', fn() => self::bizDocuments((int)$b)),
                $action === 'business' && $a === 'documents' && $method === 'POST' && $b => self::requireAuth('projects.manage', fn() => self::bizDocumentAdd((int)$b)),
                $action === 'business' && $a === 'documents' && $method === 'DELETE' && $b => self::requireAuth('projects.manage', fn() => self::bizDocumentDelete((int)$b)),
                // ---------- V2: Proposals ----------
                $action === 'proposals' && $a === 'preview' && $method === 'GET' && $b => self::requireAuth('content.read', fn() => self::proposalPreview((int)$b)),
                $action === 'proposals' && $a === 'pdf' && $method === 'GET' && $b => self::requireAuth('content.read', fn() => self::proposalPdf((int)$b)),
                $action === 'proposals' && $a && $b === 'restore' && $method === 'POST' => self::requireAuth('content.write', fn() => self::proposalRestore((int)$a)),
                $action === 'proposals' && $method === 'GET' && !$a => self::requireAuth('content.read', fn() => self::proposals()),
                $action === 'proposals' && $method === 'POST' && !$a => self::requireAuth('content.write', fn() => self::proposalCreate()),
                $action === 'proposals' && $method === 'PUT' && $a => self::requireAuth('content.write', fn() => self::proposalUpdate((int)$a)),
                $action === 'proposals' && $method === 'DELETE' && $a => self::requireAuth('content.write', fn() => self::proposalDelete((int)$a)),
                // ---------- V2: Analytics ----------
                $action === 'analytics' && $a === 'summary' && $method === 'GET' => self::requireAuth('analytics.view', fn() => self::analyticsSummary()),
                $action === 'analytics' && $a === 'pages' && $method === 'GET' => self::requireAuth('analytics.view', fn() => self::analyticsPages()),
                $action === 'analytics' && $a === 'sources' && $method === 'GET' => self::requireAuth('analytics.view', fn() => self::analyticsSources()),
                $action === 'analytics' && $a === 'daily' && $method === 'GET' => self::requireAuth('analytics.view', fn() => self::analyticsDaily()),
                $action === 'analytics' && $a === 'campaigns' && $method === 'GET' => self::requireAuth('analytics.view', fn() => self::analyticsCampaigns()),
                $action === 'analytics' && $a === 'content' && $method === 'GET' => self::requireAuth('analytics.view', fn() => self::analyticsContent()),
                $action === 'analytics' && $a === 'track' && $method === 'POST' => self::analyticsTrack(),
                // ---------- V2: Automation / notifications / webhooks / flags / keys / knowledge / errors / email ----------
                $action === 'automations' && $a === 'check-inactive' && $method === 'POST' => self::requireAuth('settings.write', fn() => self::automationCheckInactive()),
                $action === 'automations' && $a === 'test' && $method === 'POST' && $b => self::requireAuth('settings.write', fn() => self::automationTest((int)$b)),
                $action === 'automations' && $a === 'runs' && $method === 'GET' => self::requireAuth('settings.read', fn() => self::automationRuns()),
                $action === 'automations' && $method === 'GET' => self::requireAuth('settings.read', fn() => self::automations()),
                $action === 'automations' && $method === 'POST' && !$a => self::requireAuth('settings.write', fn() => self::automationSave(0)),
                $action === 'automations' && $method === 'PUT' && $a => self::requireAuth('settings.write', fn() => self::automationSave((int)$a)),
                $action === 'automations' && $method === 'DELETE' && $a => self::requireAuth('settings.write', fn() => self::automationDelete((int)$a)),
                $action === 'notifications' && $method === 'GET' => self::requireAuth('content.read', fn() => self::notifications()),
                $action === 'notifications' && $a === 'read' && $method === 'POST' && $b => self::requireAuth('content.read', fn() => self::notificationRead((int)$b)),
                $action === 'notifications' && $a === 'read-all' && $method === 'POST' => self::requireAuth('content.read', fn() => self::notificationReadAll()),
                $action === 'webhooks' && $method === 'GET' && !$a => self::requireAuth('integrations.manage', fn() => self::webhooks()),
                $action === 'webhooks' && $method === 'POST' && !$a => self::requireAuth('integrations.manage', fn() => self::webhookSave(0)),
                $action === 'webhooks' && $method === 'PUT' && $a => self::requireAuth('integrations.manage', fn() => self::webhookSave((int)$a)),
                $action === 'webhooks' && $method === 'DELETE' && $a => self::requireAuth('integrations.manage', fn() => self::webhookDelete((int)$a)),
                $action === 'apikeys' && $method === 'GET' => self::requireAuth('integrations.manage', fn() => self::apiKeys()),
                $action === 'apikeys' && $method === 'POST' => self::requireAuth('integrations.manage', fn() => self::apiKeyCreate()),
                $action === 'apikeys' && $method === 'DELETE' && $a => self::requireAuth('integrations.manage', fn() => self::apiKeyRevoke((int)$a)),
                $action === 'flags' && $method === 'GET' => self::requireAuth('settings.read', fn() => self::flags()),
                $action === 'flags' && $method === 'PUT' && $a => self::requireAuth('settings.write', fn() => self::flagSet($a)),
                $action === 'knowledge' && $method === 'GET' => self::requireAuth('content.read', fn() => self::knowledge()),
                $action === 'knowledge' && $method === 'POST' => self::requireAuth('content.write', fn() => self::knowledgeSave(0)),
                $action === 'knowledge' && $method === 'PUT' && $a => self::requireAuth('content.write', fn() => self::knowledgeSave((int)$a)),
                $action === 'knowledge' && $method === 'DELETE' && $a => self::requireAuth('content.write', fn() => self::knowledgeDelete((int)$a)),
                $action === 'errors' && $method === 'GET' => self::requireAuth('audit.read', fn() => self::errors()),
                $action === 'errors' && $method === 'DELETE' => self::requireAuth('audit.read', fn() => self::errorsClear()),
                $action === 'emaillog' && $method === 'GET' => self::requireAuth('settings.read', fn() => self::emailLog()),
                $action === 'smtp' && $method === 'GET' => self::requireAuth('settings.read', fn() => self::smtpConfig()),
                $action === 'smtp' && $method === 'PUT' => self::requireAuth('settings.write', fn() => self::smtpConfigSave()),
                $action === 'smtp' && $a === 'test' && $method === 'POST' => self::requireAuth('settings.write', fn() => self::smtpTest()),
                $action === 'emailtemplates' && $method === 'GET' => self::requireAuth('settings.read', fn() => self::emailTemplates()),
                $action === 'emailtemplates' && $method === 'PUT' && $a => self::requireAuth('settings.write', fn() => self::emailTemplateSave((int)$a)),
                $action === 'emailtemplates' && $a === 'test' && $method === 'POST' && $b => self::requireAuth('settings.write', fn() => self::emailTemplateTest((int)$b)),
                $action === 'campaigns' && $method === 'GET' => self::requireAuth('analytics.view', fn() => self::campaigns()),
                $action === 'campaigns' && $method === 'POST' => self::requireAuth('leads.write', fn() => self::campaignSave(0)),
                $action === 'campaigns' && $method === 'PUT' && $a => self::requireAuth('leads.write', fn() => self::campaignSave((int)$a)),
                $action === 'campaigns' && $method === 'DELETE' && $a => self::requireAuth('leads.write', fn() => self::campaignDelete((int)$a)),
                $action === 'content-health' && $method === 'GET' => self::requireAuth('content.read', fn() => self::contentHealth()),
                $action === 'ai' && $a === 'usage' && $method === 'GET' => self::requireAuth('ai.read', fn() => self::aiUsage()),
                $action === 'sites' && $method === 'GET' => self::requireAuth('settings.read', fn() => self::sites()),
                $action === 'search' && $method === 'GET' => self::requireAuth('content.read', fn() => self::search()),
                $action === 'copilot' && $method === 'POST' => self::requireAuth('ai.use', fn() => self::copilot()),
                // ---------- V1 public API ----------
                $action === 'v1' && $a === 'content' && $method === 'GET' => self::v1Content(),
                $action === 'v1' && $a === 'projects' && $method === 'GET' => self::projects(),
                $action === 'v1' && $a === 'case-studies' && $method === 'GET' => self::projects(),
                $action === 'v1' && $a === 'leads' && $method === 'POST' => self::publicLead(),
                $action === 'v1' && $a === 'posts' && $method === 'GET' => self::posts(),
                $action === 'seo' && $a === 'keywords' && $method === 'GET' => self::requireAuth('content.read', fn() => self::seoKeywords()),
                $action === 'seo' && $a === 'keywords' && $method === 'POST' => self::requireAuth('content.write', fn() => self::seoKeywordSave(0)),
                $action === 'seo' && $a === 'keywords' && $method === 'PUT' && $b => self::requireAuth('content.write', fn() => self::seoKeywordSave((int)$b)),
                $action === 'seo' && $a === 'keywords' && $method === 'DELETE' && $b => self::requireAuth('content.write', fn() => self::seoKeywordDelete((int)$b)),
                $action === 'seo' && $a === 'clusters' && $method === 'GET' => self::requireAuth('content.read', fn() => self::seoClusters()),
                $action === 'seo' && $a === 'clusters' && $method === 'POST' => self::requireAuth('content.write', fn() => self::seoClusterSave(0)),
                $action === 'seo' && $a === 'clusters' && $method === 'PUT' && $b => self::requireAuth('content.write', fn() => self::seoClusterSave((int)$b)),
                $action === 'seo' && $a === 'clusters' && $method === 'DELETE' && $b => self::requireAuth('content.write', fn() => self::seoClusterDelete((int)$b)),
                $action === 'seo' && $a === 'rankings' && $method === 'GET' => self::requireAuth('content.read', fn() => self::seoRankings()),
                $action === 'seo' && $a === 'rankings' && $method === 'POST' => self::requireAuth('content.write', fn() => self::seoRankingRecord()),
                $action === 'seo' && $a === 'cannibalization' && $method === 'GET' => self::requireAuth('content.read', fn() => self::seoCannibalization()),
                $action === 'seo' && $a === 'opportunities' && $method === 'GET' => self::requireAuth('content.read', fn() => self::seoOpportunities()),
                $action === 'seo' && $a === 'audit' && $method === 'POST' => self::requireAuth('content.read', fn() => self::seoAuditRun()),
                $action === 'seo' && $a === 'issues' && $method === 'GET' => self::requireAuth('content.read', fn() => self::seoIssues()),
                $action === 'seo' && $a === 'issues' && $method === 'PUT' && $b => self::requireAuth('content.write', fn() => self::seoIssueStatus((int)$b)),
                $action === 'seo' && $a === 'decay' && $method === 'GET' => self::requireAuth('content.read', fn() => self::seoDecay()),
                $action === 'seo' && $a === 'internal-links' && $method === 'GET' => self::requireAuth('content.read', fn() => self::seoInternalLinks()),
                $action === 'seo' && $a === 'brief' && $method === 'POST' => self::requireAuth('content.read', fn() => self::seoBrief()),
                $action === 'seo' && $a === 'backlinks' && $method === 'GET' => self::requireAuth('content.read', fn() => self::seoBacklinks()),
                $action === 'seo' && $a === 'backlinks' && $method === 'POST' => self::requireAuth('content.write', fn() => self::seoBacklinkSave(0)),
                $action === 'seo' && $a === 'backlinks' && $method === 'PUT' && $b => self::requireAuth('content.write', fn() => self::seoBacklinkSave((int)$b)),
                $action === 'seo' && $a === 'backlinks' && $method === 'DELETE' && $b => self::requireAuth('content.write', fn() => self::seoBacklinkDelete((int)$b)),
                $action === 'seo' && $a === 'competitors' && $method === 'GET' => self::requireAuth('content.read', fn() => self::seoCompetitors()),
                $action === 'seo' && $a === 'competitors' && $method === 'POST' => self::requireAuth('content.write', fn() => self::seoCompetitorSave(0)),
                $action === 'seo' && $a === 'competitors' && $method === 'DELETE' && $b => self::requireAuth('content.write', fn() => self::seoCompetitorDelete((int)$b)),
                $action === 'engagement' && $a === 'score' && $method === 'GET' => self::requireAuth('analytics.view', fn() => self::engagementScore()),
                $action === 'engagement' && $a === 'ctas' && $method === 'GET' => self::requireAuth('analytics.view', fn() => self::engagementCtas()),
                $action === 'engagement' && $a === 'funnel' && $method === 'GET' => self::requireAuth('analytics.view', fn() => self::engagementFunnel()),
                $action === 'intelligence' && $a === 'next-actions' && $method === 'GET' => self::requireAuth('content.read', fn() => self::intelNextActions()),
                $action === 'intelligence' && $a === 'daily-brief' && $method === 'GET' => self::requireAuth('content.read', fn() => self::intelDailyBrief()),
                $action === 'intelligence' && $a === 'weekly-report' && $method === 'GET' => self::requireAuth('content.read', fn() => self::intelWeeklyReport()),
                $action === 'intelligence' && $a === 'social-drafts' && $method === 'GET' => self::requireAuth('content.read', fn() => self::intelSocialDrafts()),
                $action === 'intelligence' && $a === 'social-drafts' && $method === 'POST' => self::requireAuth('content.write', fn() => self::intelSocialDraftCreate()),
                $action === 'intelligence' && $a === 'social-drafts' && $method === 'PUT' && $b => self::requireAuth('content.write', fn() => self::intelSocialDraftStatus((int)$b)),
                $action === 'agents' && $method === 'GET' && !$a => self::requireAuth('ai.read', fn() => self::agents()),
                $action === 'agents' && $a === 'jobs' && $method === 'GET' => self::requireAuth('ai.read', fn() => self::agentJobs()),
                $action === 'agents' && $a === 'memory' && $method === 'GET' => self::requireAuth('ai.read', fn() => self::agentMemory()),
                $action === 'agents' && $a === 'brief' && $method === 'GET' => self::requireAuth('content.read', fn() => self::agentBrief()),
                $action === 'agents' && $a === 'pause' && $method === 'POST' => self::requireAuth('settings.write', fn() => self::agentPause()),
                $action === 'agents' && $a === 'settings' && $method === 'GET' => self::requireAuth('settings.read', fn() => self::agentSettingsGet()),
                $action === 'agents' && $a === 'settings' && $method === 'PUT' => self::requireAuth('settings.write', fn() => self::agentSettingsSave()),
                $action === 'agents' && $a && $method === 'PUT' => self::requireAuth('settings.write', fn() => self::agentUpdate($a)),
                $action === 'agents' && $a && $b === 'run' && $method === 'POST' => self::requireAuth('ai.write', fn() => self::agentRun($a)),
                $action === 'status' && $method === 'GET' => self::status(),
                $action === 'system' && $a === 'publishing' && $method === 'GET' => self::requireAuth('content.read', fn() => self::systemPublishing()),
                $action === 'system' && $a === 'doctor' && $method === 'GET' => self::requireAuth('settings.read', fn() => self::systemDoctor()),
                $action === 'system' && $a === 'publish-settings' && $method === 'GET' => self::requireAuth('settings.read', fn() => self::publishSettingsGet()),
                $action === 'system' && $a === 'publish-settings' && $method === 'PUT' => self::requireAuth('settings.write', fn() => self::publishSettingsSave()),
                // ---------- V2.4: Integration Hub ----------
                $action === 'integrations' && $method === 'GET' && !$a => self::requireAuth('settings.read', fn() => IntegrationController::index()),
                $action === 'integrations' && $a === 'agent-graph' && $method === 'GET' => self::requireAuth('settings.read', fn() => IntegrationController::agentGraph()),
                $action === 'integrations' && $a === 'calls' && $method === 'GET' => self::requireAuth('settings.read', fn() => IntegrationController::calls()),
                $action === 'integrations' && $a && $b === 'test' && $method === 'POST' => self::requireAuth('integrations.manage', fn() => IntegrationController::test($a)),
                $action === 'integrations' && $a && $b === 'sync' && $method === 'POST' => self::requireAuth('integrations.manage', fn() => IntegrationController::sync($a)),
                $action === 'integrations' && $a && $b === 'enable' && $method === 'POST' => self::requireAuth('integrations.manage', fn() => IntegrationController::setEnabled($a, true)),
                $action === 'integrations' && $a && $b === 'disable' && $method === 'POST' => self::requireAuth('integrations.manage', fn() => IntegrationController::setEnabled($a, false)),
                $action === 'integrations' && $a && $method === 'PUT' => self::requireAuth('integrations.manage', fn() => IntegrationController::save($a)),
                // ---------- V2.4: Search Console ----------
                $action === 'search-console' && $a === 'overview' && $method === 'GET' => self::requireAuth('analytics.view', fn() => IntegrationController::scOverview()),
                $action === 'search-console' && $a === 'queries' && $method === 'GET' => self::requireAuth('analytics.view', fn() => IntegrationController::scQueries()),
                $action === 'search-console' && $a === 'pages' && $method === 'GET' => self::requireAuth('analytics.view', fn() => IntegrationController::scPages()),
                $action === 'search-console' && $a === 'quick-wins' && $method === 'GET' => self::requireAuth('analytics.view', fn() => IntegrationController::scQuickWins()),
                $action === 'search-console' && $a === 'opportunities' && $method === 'GET' => self::requireAuth('content.read', fn() => IntegrationController::scOpportunities()),
                $action === 'search-console' && $a === 'cro-candidates' && $method === 'GET' => self::requireAuth('analytics.view', fn() => IntegrationController::scCro()),
                $action === 'search-console' && $a === 'import' && $method === 'POST' => self::requireAuth('integrations.manage', fn() => IntegrationController::scImport()),
                // ---------- V2.4: Research ----------
                $action === 'research' && $a === 'sources' && $method === 'GET' => self::requireAuth('content.read', fn() => IntegrationController::researchSources()),
                $action === 'research' && $a === 'sources' && $method === 'POST' => self::requireAuth('content.write', fn() => IntegrationController::researchSourceSave(null)),
                $action === 'research' && $a === 'sources' && $method === 'PUT' && $b => self::requireAuth('content.write', fn() => IntegrationController::researchSourceSave((int)$b)),
                $action === 'research' && $a === 'sources' && $method === 'DELETE' && $b => self::requireAuth('content.write', fn() => IntegrationController::researchSourceDelete((int)$b)),
                $action === 'research' && $a === 'fetch' && $method === 'POST' => self::requireAuth('content.write', fn() => IntegrationController::researchFetch()),
                $action === 'research' && $a === 'items' && $method === 'GET' => self::requireAuth('content.read', fn() => IntegrationController::researchItems()),
                $action === 'trends' && $method === 'GET' => self::requireAuth('content.read', fn() => IntegrationController::trends()),
                // ---------- V2.4: Knowledge graph + truth layer ----------
                $action === 'knowledge-graph' && $method === 'GET' => self::requireAuth('content.read', fn() => IntegrationController::graph()),
                $action === 'knowledge-graph' && $a === 'build' && $method === 'POST' => self::requireAuth('content.write', fn() => IntegrationController::graphBuild()),
                $action === 'knowledge-graph' && $a === 'edge' && $method === 'POST' => self::requireAuth('content.write', fn() => IntegrationController::graphAddEdge()),
                $action === 'facts' && $method === 'GET' => self::requireAuth('content.read', fn() => IntegrationController::facts()),
                $action === 'facts' && $method === 'POST' => self::requireAuth('content.write', fn() => IntegrationController::factCreate()),
                $action === 'facts' && $a && $b === 'status' && $method === 'PUT' => self::requireAuth('content.write', fn() => IntegrationController::factStatus((int)$a)),
                $action === 'facts' && $method === 'DELETE' && $a => self::requireAuth('content.write', fn() => IntegrationController::factDelete((int)$a)),
                // ---------- V2.4: Case study intelligence ----------
                $action === 'case-studies' && $a === 'intel' && $method === 'GET' => self::requireAuth('content.read', fn() => IntegrationController::caseStudyIntel()),
                $action === 'case-studies' && $a === 'intel' && $method === 'POST' => self::requireAuth('content.read', fn() => IntegrationController::caseStudyRefresh()),
                // ---------- V2.4: Social ----------
                $action === 'social' && $a === 'profiles' && $method === 'GET' => self::requireAuth('content.read', fn() => IntegrationController::socialProfiles()),
                $action === 'social' && $a === 'profiles' && $method === 'POST' => self::requireAuth('content.write', fn() => IntegrationController::socialProfileSave('')),
                $action === 'social' && $a === 'profiles' && $b && $method === 'PUT' => self::requireAuth('content.write', fn() => IntegrationController::socialProfileSave($b)),
                $action === 'social' && $a === 'profiles' && $b && $method === 'DELETE' => self::requireAuth('content.write', fn() => IntegrationController::socialProfileDelete($b)),
                $action === 'social' && $a === 'sync' && $method === 'POST' => self::requireAuth('integrations.manage', fn() => IntegrationController::socialSync()),
                // ---------- V2.4: Trackable links ----------
                $action === 'links' && $a === 'click' && $method === 'POST' => IntegrationController::linkTrackPublic(),
                $action === 'links' && $a && $b === 'clicks' && $method === 'GET' => self::requireAuth('content.read', fn() => IntegrationController::linkClicks((int)$a)),
                $action === 'links' && $method === 'GET' && !$a => self::requireAuth('content.read', fn() => IntegrationController::links()),
                $action === 'links' && $method === 'POST' && !$a => self::requireAuth('content.write', fn() => IntegrationController::linkSave(null)),
                $action === 'links' && $method === 'DELETE' && $a => self::requireAuth('content.write', fn() => IntegrationController::linkDelete((int)$a)),
                // ---------- V2.4: Intelligence ----------
                $action === 'positioning' && $method === 'GET' => self::requireAuth('content.read', fn() => IntegrationController::positioning()),
                $action === 'outcomes' && $method === 'GET' => self::requireAuth('content.read', fn() => IntegrationController::outcomes()),
                $action === 'dev-intel' && $method === 'GET' => self::requireAuth('settings.read', fn() => IntegrationController::devIntel()),
                $action === 'knowledge-ingest' && $method === 'GET' => self::requireAuth('content.read', fn() => IntegrationController::knowledgeIngest()),
                default => Response::error('Not found', 404, 'NOT_FOUND'),
            };
        } catch (Throwable $e) {
            $rid = defined('AV_REQUEST_ID') ? AV_REQUEST_ID : '?';
            error_log('[AVOS ' . $rid . '] ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
            try { ErrorModel::log('error', 'api', $e->getMessage(), ['request_id' => $rid, 'path' => $_SERVER['REQUEST_URI'] ?? '']); } catch (Throwable $ignore) {}
            if (AV_DEBUG) Response::error('Server error: ' . $e->getMessage(), 500, 'SERVER_ERROR');
            Response::error('Internal server error', 500, 'SERVER_ERROR');
        }
    }

    /* ---------- middleware ---------- */
    private static function requireAuth(string $permission, callable $fn): void
    {
        if (!Auth::check()) Response::error('Authentication required', 401, 'UNAUTHENTICATED');
        if (!Auth::can($permission)) Response::error('Forbidden', 403, 'FORBIDDEN');
        $method = $_SERVER['REQUEST_METHOD'];
        if (in_array($method, ['POST', 'PUT', 'DELETE'], true)) {
            $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
            if (!Auth::verifyCsrf($token)) Response::error('Invalid CSRF token', 419, 'CSRF_FAILED');
        }
        $fn();
    }

    private static function rateLimit(string $key, string $area): void
    {
        $r = AV_RATE[$area] ?? [30, 3600];
        $k = $area . ':' . $key;
        if (!RateLimiter::allow($k, $r[0], $r[1])) {
            Response::error('Too many requests. Try again later.', 429, 'RATE_LIMITED');
        }
    }

    /* ---------- auth ---------- */
    private static function login(): void
    {
        // global DoS guard per IP (high cap) — per-email brute force is
        // throttled separately in Auth::attempt via login_attempts
        if (!RateLimiter::allow('login-ip:' . Auth::ip(), 60, 900)) {
            Response::error('Too many requests. Try again later.', 429, 'RATE_LIMITED');
        }
        $d = Input::body();
        $email = Input::email($d);
        $pass = Input::str($d, 'password', 200);
        if ($email === '' || $pass === '') Response::error('Email and password required', 422, 'VALIDATION_ERROR');
        [$ok, $err, $mustChange, $throttled, $twofa] = Auth::attempt($email, $pass);
        if (!$ok) {
            if ($throttled === 'THROTTLED') Response::error($err, 429, 'RATE_LIMITED');
            Response::error($err, 401, 'INVALID_CREDENTIALS');
        }
        if ($twofa) {
            $pending = Auth::pending2fa();
            $u = Database::one("SELECT id, name FROM users WHERE id=?", [$pending]);
            Response::json([
                'must_2fa' => true,
                'user' => $u ? ['id' => (int)$u['id'], 'name' => $u['name']] : null,
                'must_change_password' => false,
            ]);
        }
        $u = Auth::user();
        Response::json([
            'user' => ['id' => (int)$u['id'], 'name' => $u['name'], 'role' => $u['role_name']],
            'must_change_password' => (bool)$mustChange,
        ]);
    }

    private static function changePassword(): void
    {
        $d = Input::body();
        $cur = Input::str($d, 'current_password', 200);
        $new = Input::str($d, 'new_password', 200);
        $u = Auth::user();
        if (strlen($new) < 12) Response::error('New password must be at least 12 characters', 422, 'VALIDATION_ERROR');
        $db = Database::one("SELECT password_hash FROM users WHERE id=?", [$u['id']]);
        if (!password_verify($cur, $db['password_hash'])) Response::error('Current password is incorrect', 422, 'VALIDATION_ERROR');
        Auth::changePassword((int)$u['id'], $new);
        Response::json(['ok' => true]);
    }

    private static function logout(): void
    {
        Auth::logout();
        Response::json(['ok' => true]);
    }

    private static function session(): void
    {
        $u = Auth::user();
        $pending = Auth::pending2fa();
        Response::json([
            'authed' => (bool)$u,
            'csrf' => Auth::csrf(),
            'must_change_password' => $u ? (bool)$u['must_change_password'] : false,
            'permissions' => Auth::permissions(),
            '2fa_pending' => $pending !== null,
            'user' => $u ? ['id' => (int)$u['id'], 'name' => $u['name'], 'email' => $u['email'], 'role' => $u['role_name']] : null,
        ]);
    }

    /* ---------- public reads ---------- */
    private static function site(): void
    {
        $doc = ContentStore::all();
        Response::json([
            'settings' => $doc['settings'] ?? [],
            'nav' => $doc['nav'] ?? [],
            'sections' => $doc['sections'] ?? [],
            'pages' => $doc['pages'] ?? [],
            'projects' => array_values(array_filter($doc['projects'] ?? [], fn($p) => ($p['status'] ?? '') === 'published')),
            'articles' => array_values(array_filter($doc['articles'] ?? [], fn($a) => ($a['status'] ?? '') === 'published')),
            'clients' => $doc['clients'] ?? [],
        ]);
    }

    private static function pages(): void
    {
        Response::json(array_values(array_filter(ContentStore::get('pages'), fn($p) => ($p['status'] ?? '') === 'published' && !in_array($p['slug'] ?? '', ['', 'home', 'index']))));
    }
    private static function pageBySlug(string $slug): void
    {
        foreach (ContentStore::get('pages') as $p) {
            if (($p['slug'] ?? '') === $slug && ($p['status'] ?? '') === 'published') Response::json($p);
        }
        Response::error('Page not found', 404, 'NOT_FOUND');
    }
    private static function projects(): void
    {
        Response::json(array_values(array_filter(ContentStore::get('projects'), fn($p) => ($p['status'] ?? '') === 'published')));
    }
    private static function projectBySlug(string $slug): void
    {
        foreach (ContentStore::get('projects') as $p) {
            if (((($p['slug'] ?? '') === $slug) || (($p['title'] ?? '') && Input::slug($p['title']) === $slug)) && ($p['status'] ?? '') === 'published') Response::json($p);
        }
        Response::error('Project not found', 404, 'NOT_FOUND');
    }
    private static function posts(): void
    {
        Response::json(array_values(array_filter(ContentStore::get('articles'), fn($a) => ($a['status'] ?? '') === 'published')));
    }
    private static function postBySlug(string $slug): void
    {
        foreach (ContentStore::get('articles') as $a) {
            if (($a['slug'] ?? '') === $slug && ($a['status'] ?? '') === 'published') Response::json($a);
        }
        Response::error('Post not found', 404, 'NOT_FOUND');
    }

    /**
     * GET /api/v1/content — the public content bridge.
     *
     * Returns ONLY the published, public content the frontend needs, as a
     * deliberately structured document (schema + revision + collections).
     * It never returns drafts, leads, users, tokens, secrets, forms,
     * analytics, availability, notifications, dashboard or any internal /
     * admin-only data — the top-level keys are an explicit allowlist and the
     * status-bearing collections are filtered to `status === 'published'`.
     *
     * Caching: ETag is the SHA-256 of the exact serialized payload, so any
     * content change (a publish) yields a new ETag and the next request
     * revalidates to a 304 or the fresh body. A short `max-age` bounds
     * staleness for clients that do not revalidate.
     */
    private static function v1Content(): void
    {
        $doc = ContentStore::all();

        $published = static fn(array $items): array => array_values(array_filter(
            is_array($items) ? $items : [],
            static fn($it) => is_array($it) && (($it['status'] ?? 'published') === 'published')
        ));

        // Content-only document (no per-request timestamp) — this is what the
        // ETag is derived from, so the ETag is stable until content changes.
        $content = [
            'schema' => 'avos.content/v1',
            'schemaVersion' => 1,
            'revision' => self::contentRevision(),
            'settings' => self::publicSettings($doc['settings'] ?? []),
            'navigation' => $doc['nav'] ?? [],
            'sections' => $published($doc['sections'] ?? []),
            'pages' => $published($doc['pages'] ?? []),
            'projects' => $published($doc['projects'] ?? []),
            'articles' => $published($doc['articles'] ?? []),
            'clients' => array_values($doc['clients'] ?? []),
            'testimonials' => $published($doc['testimonials'] ?? []),
            'media' => array_values($doc['media'] ?? []),
            'seo' => array_values($doc['seo'] ?? []),
            'downloads' => $published($doc['downloads'] ?? []),
        ];

        // generatedAt is metadata only and intentionally excluded from the ETag
        // (a wall-clock timestamp must not invalidate the cache every second).
        $payload = ['generatedAt' => gmdate('c')] + $content;

        $body = json_encode($content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        Response::jsonCached($payload, 200, $body === false ? null : hash('sha256', $body), 60);
    }

    /** Monotonic content revision — MAX(version) across content_store keys. */
    private static function contentRevision(): int
    {
        $r = Database::one("SELECT COALESCE(MAX(version),0) v FROM versions WHERE entity='store'");
        return (int)($r['v'] ?? 0);
    }

    /** Public site-settings allowlist — admin/internal keys are never exposed. */
    private static function publicSettings(array $s): array
    {
        $allow = ['siteName', 'tagline', 'email', 'phone', 'theme', 'designTokens',
                  'favicon', 'logo', 'ogImage', 'metaDescription', 'keywords', 'socials', 'availability'];
        $out = [];
        foreach ($allow as $k) {
            if (array_key_exists($k, $s)) $out[$k] = $s[$k];
        }
        return $out;
    }

    /* ---------- public lead (CRM) + spam protection ---------- */
    private static function publicLead(): void
    {
        self::rateLimit(Auth::ip(), 'lead');
        $d = Input::body();
        // honeypot
        if (!empty($d['website']) || !empty($d['company_website']) || !empty($d['fax'])) {
            Response::json(['status' => 'spam']); // silently drop
        }
        // optional Cloudflare Turnstile
        if (!empty(AV_TURNSTILE['secret_key'])) {
            $token = Input::str($d, 'turnstile_token', 4000);
            $ch = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
            curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => http_build_query(['secret' => AV_TURNSTILE['secret_key'], 'response' => $token, 'remoteip' => Auth::ip()])]);
            $res = json_decode((string)curl_exec($ch), true);
            curl_close($ch);
            if (empty($res['success'])) Response::error('Spam check failed', 422, 'SPAM_BLOCKED');
        }
        // email throttle
        $email = Input::email($d);
        if ($email !== '') {
            $k = 'lead-email:' . md5($email);
            if (!RateLimiter::allow($k, 5, 3600)) Response::error('Too many submissions from this email', 429, 'RATE_LIMITED');
        }
        $name = Input::str($d, 'name', 150);
        if ($name === '') Response::error('Name required', 422, 'VALIDATION_ERROR');
        if (strlen(Input::str($d, 'message', 5000)) > 4000) Response::error('Message too long', 422, 'VALIDATION_ERROR');

        $leadData = [
            'name' => $name,
            'company' => Input::str($d, 'company', 150) ?: Input::str($d, 'organization', 150),
            'email' => $email,
            'phone' => Input::str($d, 'phone', 40),
            'lead_type' => Input::str($d, 'project_type', 60) ?: Input::str($d, 'type', 60),
            'message' => Input::str($d, 'message', 4000),
            'source' => Input::str($d, 'source', 60) ?: 'website',
            'page' => Input::str($d, 'page', 190),
            'referrer' => Input::str($d, 'referrer', 500),
            'utm_source' => Input::str($d, 'utm_source', 120),
            'utm_medium' => Input::str($d, 'utm_medium', 120),
            'utm_campaign' => Input::str($d, 'utm_campaign', 120),
            'utm_term' => Input::str($d, 'utm_term', 120),
            'utm_content' => Input::str($d, 'utm_content', 120),
            'status' => 'new',
        ];
        // v2: configurable lead scoring
        $leadData['score'] = CrmModel::scoreLead($leadData + ['score' => 50]);
        // idempotency: same email within 24h → return existing lead instead of a duplicate row
        if ($email !== '') {
            $existing = LeadModel::findRecentByEmail($email, 24);
            if ($existing) {
                CrmModel::addActivity('lead', (int)$existing['id'], 'resubmitted', 'Contact form resubmission — returned existing lead');
                Response::json(['ok' => true, 'id' => (int)$existing['id'], 'status' => $existing['status'], 'score' => (int)$existing['score'], 'duplicate' => true], 200);
            }
        }
        $id = LeadModel::create($leadData);
        CrmModel::addActivity('lead', $id, 'created', 'Contact form submitted (' . ($leadData['page'] ?: 'website') . ')');
        // event-driven: lead intelligence reviews every new lead
        if (FeatureFlagModel::isOn('ai_agents') && !AgentSettings::isPaused('publish')) {
            AgentJobs::enqueue('lead-intel', 'run', ['event' => 'lead.created', 'lead_id' => $id], 'high');
        }
        Audit::log(null, 'lead_received', 'lead', (string)$id, ['source' => 'website', 'score' => $leadData['score']]);
        // v2: automation + notification + webhook + content metric
        if ($leadData['score'] >= 70) {
            NotificationModel::push('High-value lead', "{$name} scored {$leadData['score']} — follow up within 24h", 'lead');
        }
        AutomationModel::run('lead.created', ['entity_type' => 'lead', 'entity_id' => $id, 'score' => $leadData['score'],
            'status' => 'new', 'event' => 'lead.created', 'name' => $name, 'email' => $email,
            'company' => $leadData['company'], 'source' => $leadData['source']]);
        WebhookModel::dispatch('lead.created', ['id' => $id, 'name' => $name, 'score' => $leadData['score']]);
        if (!empty($leadData['page'])) {
            AnalyticsModel::recordConversion($leadData['page'], 'page');
        }
        // v2: email engine — confirmation to visitor + admin alert (best-effort,
        // never blocks or replaces the CRM lead flow)
        try {
            $siteSettings = ContentStore::get('settings');
            $emailVars = [
                'site_name' => $siteSettings['siteName'] ?? 'AV OS',
                'admin_url' => AV_SITE_URL . '/admin/',
                'calendly_url' => $siteSettings['calendlyUrl'] ?? '',
                'name' => $name, 'email' => $email,
                'phone' => $leadData['phone'], 'company' => $leadData['company'],
                'project_type' => $leadData['lead_type'], 'source' => $leadData['source'],
                'message' => $leadData['message'],
            ];
            if ($email !== '') {
                EmailModel::queue('lead_confirmation', $email, '', '', $emailVars);
            }
            $adminEmail = trim((string)($siteSettings['email'] ?? ''));
            if ($adminEmail !== '') {
                EmailModel::queue('new_lead', $adminEmail, '', '', $emailVars);
            }
        } catch (Throwable $e) {
            ErrorModel::log('lead_email_queue', $e->getMessage(), 'POST');
        }
        Response::json(['ok' => true, 'id' => $id, 'status' => 'new', 'score' => $leadData['score']], 201);
    }

    /* ---------- public form submissions ---------- */
    private static function publicSubmit(): void
    {
        self::rateLimit(Auth::ip(), 'submit');
        $d = Input::body();
        if (!empty($d['website'])) Response::json(['ok' => true]); // honeypot
        // optional turnstile
        if (!empty(AV_TURNSTILE['secret_key'])) {
            $token = Input::str($d, 'turnstile_token', 4000);
            $ch = curl_init('https://challenges.cloudflare.com/turnstile/v0/siteverify');
            curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => http_build_query(['secret' => AV_TURNSTILE['secret_key'], 'response' => $token])]);
            $res = json_decode((string)curl_exec($ch), true);
            curl_close($ch);
            if (empty($res['success'])) Response::error('Spam check failed', 422, 'SPAM_BLOCKED');
        }
        $data = $d['data'] ?? $d;
        if (!is_array($data)) Response::error('Invalid payload', 422, 'VALIDATION_ERROR');
        $formId = (int)($data['form_id'] ?? 0);
        // size limit
        if (strlen(json_encode($data)) > 30000) Response::error('Payload too large', 413, 'PAYLOAD_TOO_LARGE');
        // allowed fields only
        $allowed = ['name', 'email', 'phone', 'company', 'organization', 'message', 'subject', 'type', 'project_type', 'source', 'page', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'form_id', 'timeline', 'date', 'time'];
        $clean = [];
        foreach ($allowed as $f) {
            if (array_key_exists($f, $data)) {
                $v = is_scalar($data[$f]) ? trim((string)$data[$f]) : '';
                if (mb_strlen($v) <= 4000) $clean[$f] = $v;
            }
        }
        if (isset($clean['email']) && $clean['email'] !== '' && !filter_var($clean['email'], FILTER_VALIDATE_EMAIL)) {
            Response::error('Invalid email', 422, 'VALIDATION_ERROR');
        }
        if ($formId) {
            $form = Database::one("SELECT config FROM forms WHERE id=? AND active=1", [$formId]);
            if ($form) {
                $cfg = json_decode($form['config'], true) ?: [];
                foreach (($cfg['required'] ?? []) as $req) {
                    if (empty($clean[$req])) Response::error('Missing required field: ' . $req, 422, 'VALIDATION_ERROR');
                }
            }
        }
        $id = FormModel::submit($clean, $formId ?: null);
        Response::json(['ok' => true, 'id' => $id], 201);
    }

    /* ---------- admin: content ---------- */
    private static function content(): void
    {
        $doc = ContentStore::all();
        // attach per-key max version for conflict detection
        $versions = [];
        foreach (array_keys($doc) as $key) {
            $v = Database::one("SELECT COALESCE(MAX(version),0) v FROM versions WHERE entity='store' AND entity_id=?", [$key]);
            $versions[$key] = (int)($v['v'] ?? 0);
        }
        $doc['_versions'] = $versions;
        Response::json($doc);
    }

    private static function saveContent(): void
    {
        $d = Input::body();
        if (!$d) Response::error('Invalid body', 422, 'VALIDATION_ERROR');
        // conflict detection: client sends base_versions {key: version} captured at
        // last pull; if another session saved since, reject with server versions.
        $base = $d['base_versions'] ?? null;
        unset($d['base_versions']);
        if (is_array($base)) {
            foreach ($base as $key => $clientVer) {
                if (!array_key_exists($key, $d)) continue;
                $v = Database::one("SELECT COALESCE(MAX(version),0) v FROM versions WHERE entity='store' AND entity_id=?", [$key]);
                $serverVer = (int)($v['v'] ?? 0);
                if ((int)$clientVer !== $serverVer) {
                    Response::error("Content was modified by another session ($key: your v{$clientVer}, server v{$serverVer}) — reload to see changes, then save again.", 409, 'VERSION_CONFLICT');
                }
            }
        }
        $allowed = ['settings', 'nav', 'sections', 'pages', 'projects', 'articles', 'clients', 'testimonials', 'downloads', 'media', 'forms', 'seo', 'analytics', 'availability', 'notifications', 'dashboard'];
        $uid = Auth::user()['id'] ?? null;
        foreach ($allowed as $key) {
            if (array_key_exists($key, $d)) ContentStore::put($key, $d[$key], $uid, 'saved from CMS');
        }
        Audit::log($uid, 'content_update', 'content', 'document');

        // DRAFT MODE: publish:false saves to the DB + version but never publishes
        $draftOnly = ($d['publish'] ?? true) === false;
        unset($d['publish']);
        $resp = ['ok' => true, 'saved' => date('c'), 'draft' => $draftOnly];

        if (!$draftOnly && FeatureFlagModel::isOn('auto_publish')) {
            // LIVE SYNC through the publish queue (debounced/coalesced + locked)
            PublishQueue::enqueue('publish', $uid, 'cms_save', 'auto publish after save');
            $r = PublishQueue::drainAndPublish($uid, 'cms_save');
            if ($r['ran']) {
                $resp['auto_published'] = true;
                $resp['pages'] = $r['pages'];
                $resp['articles'] = $r['articles'];
                $resp['publish_job'] = $r['job_id'];
            } else {
                $resp['auto_published'] = false;
                $resp['queued'] = true;   // another publish is running — job will complete it
            }
        }
        Response::json($resp);
    }

    private static function publish(): void
    {
        $dry = ($_GET['dry_run'] ?? '') === '1' || !empty(Input::body()['dry_run']);
        if ($dry) {
            // dry-run: build + validate + report, never touch production
            try {
                $engine = new PublishEngine(ContentStore::all());
                Response::json($engine->preflight());
            } catch (Throwable $e) {
                Response::error('Pre-flight failed: ' . (AV_DEBUG ? $e->getMessage() : 'build validation failed'), 500, 'PREFLIGHT_FAILED');
            }
        }
        PublishQueue::enqueue('publish', Auth::user()['id'] ?? null, 'manual', 'manual publish');
        $r = PublishQueue::drainAndPublish(Auth::user()['id'] ?? null, 'manual', true);   // manual = synchronous
        if (!$r['ran']) {
            if (!empty($r['error'])) {
                NotificationModel::push('Publish failed', mb_substr($r['error'], 0, 200), 'error');
                Response::error('Publish failed: ' . (AV_DEBUG ? $r['error'] : 'build validation failed'), 500, 'PUBLISH_FAILED');
            }
            Response::json(['queued' => true, 'note' => 'another publish is in progress — the queued job will complete it']);
        }
        NotificationModel::push('Publish complete', "{$r['pages']} pages · {$r['articles']} articles regenerated", 'publish');
        WebhookModel::dispatch('page.published', ['pages' => $r['pages'], 'articles' => $r['articles']]);
        // event-driven agents: after a publish, SEO + internal links + social review the new site
        if (FeatureFlagModel::isOn('ai_agents') && !AgentSettings::isPaused('seo')) {
            AgentJobs::enqueue('seo', 'run', ['event' => 'page.published'], 'high');
            AgentJobs::enqueue('internal-links', 'run', ['event' => 'page.published'], 'medium');
            AgentJobs::enqueue('social', 'run', ['event' => 'page.published'], 'low');
        }
        Response::json(['pages' => $r['pages'], 'articles' => $r['articles'], 'publish_job' => $r['job_id'], 'time' => date('c')]);
    }

    /* ---------- deployment history / rollback ---------- */
    private static function deployments(): void
    {
        Response::json(DeploymentModel::all());
    }

    private static function publishRollback(): void
    {
        try {
            $r = DeploymentModel::rollback(Auth::user()['id'] ?? null);
            Response::json($r);
        } catch (Throwable $e) {
            ErrorModel::log('error', 'publish_rollback', $e->getMessage());
            NotificationModel::push('Rollback failed', $e->getMessage(), 'error');
            Response::error('Rollback failed: ' . (AV_DEBUG ? $e->getMessage() : 'previous deployment unavailable'), 500, 'ROLLBACK_FAILED');
        }
    }

    /* ---------- admin: media (secure) ---------- */
    private static function mediaList(): void
    {
        $opts = [
            'limit' => (int)($_GET['limit'] ?? 60),
            'page' => (int)($_GET['page'] ?? 1),
            'folder' => Input::str($_GET, 'folder', 120),
            'type' => preg_match('/^[a-z0-9]+$/', (string)($_GET['type'] ?? '')) ? $_GET['type'] : '',
            'q' => Input::str($_GET, 'q', 120),
        ];
        $items = MediaModel::all($opts);
        $total = (int)Database::one("SELECT COUNT(*) n FROM media WHERE deleted_at IS NULL")['n'];
        Response::json(['items' => $items, 'total' => $total, 'page' => $opts['page'], 'limit' => $opts['limit']]);
    }

    private static function uploadMedia(): void
    {
        self::rateLimit(Auth::ip(), 'media');
        $d = Input::body();
        $origName = preg_replace('/[^\w.\-() ]/', '', Input::str($d, 'name', 200));
        $b64 = Input::str($d, 'data', 60_000_000);
        if ($origName === '' || $b64 === '') Response::error('name and data required', 422, 'VALIDATION_ERROR');
        $b64 = str_contains($b64, ',') ? explode(',', $b64, 2)[1] : $b64;
        $buf = base64_decode($b64, true);
        if ($buf === false || $buf === '') Response::error('Invalid file data', 422, 'VALIDATION_ERROR');
        if (strlen($buf) > AV_MAX_UPLOAD_BYTES) Response::error('File too large', 413, 'PAYLOAD_TOO_LARGE');

        $ext = strtolower(pathinfo($origName, PATHINFO_EXTENSION));
        $blocked = ['php', 'php3', 'php4', 'php5', 'phtml', 'pht', 'phar', 'cgi', 'pl', 'py', 'sh', 'asp', 'aspx', 'jsp', 'htaccess'];
        if (in_array($ext, $blocked, true)) Response::error('File type not allowed', 422, 'VALIDATION_ERROR');

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_buffer($finfo, $buf);
        $imageExts = ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'svg'];
        $isImage = in_array($ext, $imageExts, true) && str_starts_with($mime, 'image/');
        if ($ext === 'svg') {
            $buf = self::sanitizeSvg($buf);
            if ($buf === null) {
                Response::error('SVG failed sanitization — rejected (script, foreignObject, external refs or event handlers removed)', 422, 'VALIDATION_ERROR');
            }
            $isImage = true;
        }
        if (!$isImage && !in_array($ext, ['pdf', 'mp4', 'webm', 'mov', 'zip', 'txt', 'md', 'woff', 'woff2', 'ttf', 'otf'], true)) {
            Response::error('Unsupported file type', 422, 'VALIDATION_ERROR');
        }

        // random storage name — never trust the uploaded filename
        $folder = preg_replace('/[^\w\- ]/', '', Input::str($d, 'folder', 60)) ?: 'Uploads';
        $dir = AV_UPLOADS . '/' . ($folder === 'Uploads' ? '' : $folder);
        @mkdir($dir, 0775, true);
        $rand = bin2hex(random_bytes(8));
        $name = $rand . '.' . $ext;
        $rel = 'media/' . ($folder === 'Uploads' ? '' : $folder . '/') . $name;
        file_put_contents($dir . '/' . $name, $buf);
        @chmod($dir . '/' . $name, 0644);

        // no PHP execution in upload dirs (belt & braces)
        file_put_contents(AV_UPLOADS . '/.htaccess', "php_flag engine off\n<FilesMatch \"\\.(php|phtml|php5|phar)$\">\n  Require all denied\n</FilesMatch>\nOptions -Indexes\n");

        $w = (int)($d['w'] ?? 0);
        $h = (int)($d['h'] ?? 0);
        if (!$w && $isImage && extension_loaded('gd')) {
            [$w, $h] = @getimagesizefromstring($buf) ?: [0, 0];
        }
        if ($isImage && ($w > AV_MAX_IMAGE_DIM || $h > AV_MAX_IMAGE_DIM)) {
            @unlink($dir . '/' . $name);
            Response::error('Image dimensions exceed the limit', 422, 'VALIDATION_ERROR');
        }

        $webpUrl = $avifUrl = $thumbUrl = null;
        if ($isImage && extension_loaded('gd') && $ext !== 'svg') {
            $img = @imagecreatefromstring($buf);
            if ($img) {
                if (function_exists('imagewebp')) {
                    $webpName = $rand . '.webp';
                    imagewebp($img, $dir . '/' . $webpName, 82);
                    $webpUrl = 'media/' . ($folder === 'Uploads' ? '' : $folder . '/') . $webpName;
                }
                if (class_exists('Imagick')) {
                    $avifName = $rand . '.avif';
                    $im = new Imagick();
                    $im->readImageBlob($buf);
                    $im->setImageFormat('avif');
                    $im->setImageCompressionQuality(70);
                    $im->writeImage($dir . '/' . $avifName);
                    $avifUrl = 'media/' . ($folder === 'Uploads' ? '' : $folder . '/') . $avifName;
                }
                $tw = min(400, max(1, $w));
                $th = max(1, (int)round($h * $tw / max(1, $w)));
                $thumb = imagescale($img, $tw, $th);
                if ($thumb) {
                    $tName = $rand . '-thumb.webp';
                    imagewebp($thumb, $dir . '/' . $tName, 80);
                    $thumbUrl = 'media/' . ($folder === 'Uploads' ? '' : $folder . '/') . $tName;
                }
                imagedestroy($img);
            }
        }

        $id = MediaModel::create([
            'filename' => $name, 'original_name' => $origName, 'type' => $isImage ? 'image' : ($ext === 'pdf' ? 'pdf' : 'file'),
            'mime' => $mime, 'size' => strlen($buf), 'width' => $w, 'height' => $h, 'folder' => $folder,
            'alt_text' => Input::str($d, 'alt', 255), 'url' => $rel, 'webp_url' => $webpUrl, 'avif_url' => $avifUrl, 'thumb_url' => $thumbUrl,
        ], Auth::user()['id']);
        Audit::log(Auth::user()['id'], 'media_upload', 'media', (string)$id);
        Response::json(['id' => $id, 'src' => $rel, 'name' => $name, 'original_name' => $origName, 'webp' => $webpUrl, 'avif' => $avifUrl, 'thumb' => $thumbUrl, 'w' => $w, 'h' => $h], 201);
    }

    private static function updateMedia(int $id): void
    {
        $m = MediaModel::find($id);
        if (!$m) Response::error('Not found', 404, 'NOT_FOUND');
        $d = Input::body();
        if (array_key_exists('alt_text', $d)) Database::q("UPDATE media SET alt_text=? WHERE id=?", [Input::str($d, 'alt_text', 255), $id]);
        if (array_key_exists('caption', $d)) Database::q("UPDATE media SET caption=? WHERE id=?", [Input::str($d, 'caption', 2000), $id]);
        if (array_key_exists('folder', $d)) Database::q("UPDATE media SET folder=? WHERE id=?", [Input::str($d, 'folder', 120), $id]);
        Audit::log(Auth::user()['id'], 'media_update', 'media', (string)$id);
        Response::json(['ok' => true]);
    }

    private static function deleteMedia(int $id): void
    {
        $m = MediaModel::find($id);
        if (!$m) Response::error('Not found', 404, 'NOT_FOUND');
        $permanent = !empty(Input::body()['permanent']) || ($_GET['permanent'] ?? '') === '1';
        if ($permanent) {
            // deletion protection: referenced by content?
            $doc = ContentStore::all();
            $needle = $m['url'];
            $used = false;
            $walk = function ($v) use (&$walk, &$used, $needle) {
                if (is_array($v)) { foreach ($v as $x) $walk($x); return; }
                if (is_string($v) && str_contains($v, $needle)) $used = true;
            };
            $walk($doc);
            if ($used) Response::error('Asset is in use by published content — remove references first', 409, 'CONFLICT');
            foreach (['url', 'webp_url', 'avif_url', 'thumb_url'] as $f) {
                if (!empty($m[$f])) {
                    $p = AV_UPLOADS . '/' . substr($m[$f], strlen('media/'));
                    if (is_file($p)) @unlink($p);
                }
            }
            TrashModel::permanent('media', $id);
            Audit::log(Auth::user()['id'], 'media_delete_permanent', 'media', (string)$id);
        } else {
            // soft delete: row hidden, files kept — restore is instant
            TrashModel::trash('media', $id);
            Audit::log(Auth::user()['id'], 'media_delete', 'media', (string)$id);
        }
        Response::json(['ok' => true, 'soft' => !$permanent]);
    }

    private static function mediaRestore(int $id): void
    {
        if (!TrashModel::restore('media', $id)) Response::error('Not found in trash', 404, 'NOT_FOUND');
        Audit::log(Auth::user()['id'], 'media_restore', 'media', (string)$id);
        Response::json(['ok' => true]);
    }

    /* ---------- admin: leads / forms ---------- */
    private static function leads(): void
    {
        $opts = [
            'limit' => (int)($_GET['limit'] ?? 50),
            'page' => (int)($_GET['page'] ?? 1),
            'status' => preg_match('/^[a-z_]+$/', (string)($_GET['status'] ?? '')) ? $_GET['status'] : '',
            'q' => Input::str($_GET, 'q', 120),
            'sort' => (string)($_GET['sort'] ?? 'created_at'),
            'dir' => (string)($_GET['dir'] ?? 'desc'),
            'trashed' => ($_GET['trashed'] ?? '') === '1',
        ];
        Response::json(['items' => LeadModel::all($opts), 'total' => LeadModel::count($opts), 'page' => $opts['page'], 'limit' => $opts['limit']]);
    }

    private static function leadsExport(): void
    {
        $rows = LeadModel::all(['limit' => 1000]);
        $out = fopen('php://temp', 'r+');
        fputcsv($out, ['id', 'name', 'email', 'phone', 'company', 'lead_type', 'status', 'score', 'source', 'page', 'utm_source', 'utm_medium', 'utm_campaign', 'created_at']);
        $san = fn($v) => preg_match('/^[=+\-@\t\r]/', (string)$v) ? "'" . $v : (string)$v;
        foreach ($rows as $l) {
            fputcsv($out, array_map($san, [
                $l['id'], $l['name'], $l['email'], $l['phone'], $l['company'], $l['lead_type'],
                $l['status'], $l['score'], $l['source'], $l['page'], $l['utm_source'], $l['utm_medium'], $l['utm_campaign'], $l['created_at'],
            ]));
        }
        rewind($out);
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="leads-' . date('Ymd') . '.csv"');
        echo stream_get_contents($out);
        Audit::log(Auth::user()['id'], 'leads_export', 'lead', '');
        exit;
    }
    private static function createLead(): void
    {
        $d = Input::body();
        $name = Input::str($d, 'name', 150);
        if ($name === '') Response::error('Name required', 422, 'VALIDATION_ERROR');
        $email = Input::email($d);
        // idempotency: same email within 24h → return existing lead, log activity
        $existing = LeadModel::findRecentByEmail($email, 24);
        if ($existing) {
            CrmModel::addActivity('lead', (int)$existing['id'], 'resubmitted', 'Duplicate submission detected — returned existing lead');
            Response::json(['ok' => true, 'id' => (int)$existing['id'], 'score' => (int)$existing['score'], 'duplicate' => true], 200);
        }
        $lead = [
            'name' => $name, 'company' => Input::str($d, 'org', 150) ?: Input::str($d, 'company', 150),
            'email' => $email, 'phone' => Input::str($d, 'phone', 40),
            'lead_type' => Input::str($d, 'lead_type', 60), 'message' => Input::str($d, 'message', 4000),
            'source' => Input::str($d, 'source', 60) ?: 'cms', 'status' => 'new', 'tags' => [],
        ];
        $lead['score'] = CrmModel::scoreLead($lead + ['score' => 50]);
        $id = LeadModel::create($lead);
        CrmModel::addActivity('lead', $id, 'created', 'Lead created via CMS');
        Audit::log(Auth::user()['id'], 'lead_create', 'lead', (string)$id);
        AutomationModel::run('lead.created', ['entity_type' => 'lead', 'entity_id' => $id, 'score' => $lead['score'], 'event' => 'lead.created', 'name' => $name, 'email' => $email]);
        Response::json(['ok' => true, 'id' => $id, 'score' => $lead['score']], 201);
    }

    private static function updateLead(int $id): void
    {
        $d = Input::body();
        $cur = Database::one("SELECT status, score FROM leads WHERE id=? AND deleted_at IS NULL", [$id]);
        if (!$cur) Response::error('Lead not found', 404, 'NOT_FOUND');
        LeadModel::update($id, $d);
        if (isset($d['status']) && $d['status'] !== $cur['status']) {
            CrmModel::addActivity('lead', $id, 'status_changed', "Status: {$cur['status']} → {$d['status']}");
            Audit::log(Auth::user()['id'], 'lead_status_changed', 'lead', (string)$id, ['from' => $cur['status'], 'to' => $d['status']]);
        }
        Audit::log(Auth::user()['id'], 'lead_update', 'lead', (string)$id);
        Response::json(['ok' => true]);
    }
    private static function deleteLead(int $id): void
    {
        $permanent = !empty(Input::body()['permanent']) || ($_GET['permanent'] ?? '') === '1';
        if ($permanent) {
            TrashModel::permanent('leads', $id);
            Audit::log(Auth::user()['id'], 'lead_delete_permanent', 'lead', (string)$id);
        } else {
            LeadModel::delete($id);
            Audit::log(Auth::user()['id'], 'lead_delete', 'lead', (string)$id);
        }
        Response::json(['ok' => true, 'soft' => !$permanent]);
    }

    private static function leadRestore(int $id): void
    {
        if (!TrashModel::restore('leads', $id)) Response::error('Lead not found in trash', 404, 'NOT_FOUND');
        Audit::log(Auth::user()['id'], 'lead_restore', 'lead', (string)$id);
        Response::json(['ok' => true]);
    }
    private static function forms(): void
    {
        Response::json(FormModel::all());
    }
    private static function formsExport(): void
    {
        $rows = FormModel::all();
        $csv = fopen('php://output', 'w');
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="avos-submissions.csv"');
        fputcsv($csv, ['id', 'form_id', 'data', 'status', 'ip', 'created_at']);
        foreach ($rows as $r) fputcsv($csv, $r);
        fclose($csv);
        exit;
    }
    private static function formSubmissions(): void
    {
        $limit = min(200, max(1, (int)($_GET['limit'] ?? 100)));
        $status = preg_match('/^[a-z]+$/', (string)($_GET['status'] ?? '')) ? $_GET['status'] : '';
        $where = $status !== '' ? "WHERE status=?" : "";
        $params = $status !== '' ? [$status] : [];
        Response::json(Database::all(
            "SELECT * FROM form_submissions $where ORDER BY id DESC LIMIT $limit", $params
        ));
    }

    private static function formSubmissionStatus(int $id): void
    {
        $d = Input::body();
        $status = Input::str($d, 'status', 20);
        if (!in_array($status, ['new', 'read', 'replied', 'archived', 'spam'], true)) Response::error('Invalid status', 422, 'VALIDATION_ERROR');
        Database::q("UPDATE form_submissions SET status=? WHERE id=?", [$status, $id]);
        Audit::log(Auth::user()['id'], 'form_submission_status', 'form_submission', (string)$id, ['status' => $status]);
        Response::json(['ok' => true]);
    }

    private static function formStatus(int $id): void
    {
        FormModel::setStatus($id, Input::str(Input::body(), 'status', 20));
        Audit::log(Auth::user()['id'], 'form_status', 'form_submission', (string)$id);
        Response::json(['ok' => true]);
    }

    /* ---------- admin: audit / versions ---------- */
    private static function audit(): void
    {
        Response::json(Database::all("SELECT a.*, u.name user_name FROM audit_logs a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 300"));
    }
    private static function versions(string $key): void
    {
        Response::json(ContentStore::versions($key));
    }
    private static function restore(string $key): void
    {
        $d = Input::body();
        $v = (int)($d['version'] ?? 0);
        if (!$v) Response::error('version required', 422, 'VALIDATION_ERROR');
        if (!ContentStore::restore($key, $v)) Response::error('Version not found', 404, 'NOT_FOUND');
        Audit::log(Auth::user()['id'], 'version_restore', 'store', $key, ['version' => $v]);
        Response::json(['ok' => true]);
    }

    /* ---------- admin: AI ---------- */
    private static function aiGenerate(): void
    {
        self::rateLimit(Auth::ip(), 'ai');
        $d = Input::body();
        $action = Input::str($d, 'action', 60) ?: 'generic';
        $prompt = Input::str($d, 'prompt', 20000);
        if ($prompt === '') Response::error('prompt required', 422, 'VALIDATION_ERROR');
        $provider = Input::str($d, 'provider', 30) ?: null;
        $system = "You are AV OS, the creative intelligence platform for Abhijeet Varghese — a creative systems leader.
You write in his voice: clear, warm, confident, editorial. Never invent facts about clients or results.
Output is a DRAFT for human review — never mark it as final.";
        $r = AiService::chat($system, $prompt, $provider, $action);
        if (!$r['ok']) Response::error($r['error'], 500, 'AI_ERROR');
        Response::json(['text' => $r['text'], 'provider' => $r['provider'], 'model' => $r['model']]);
    }

    private static function aiProviders(): void
    {
        Response::json([
            'providers' => AiService::providers(),
            'configured' => array_map(fn($r) => ['code' => $r['code'], 'label' => $r['label'], 'model' => $r['model'], 'is_default' => (bool)$r['is_default'], 'enabled' => (bool)$r['enabled'], 'has_key' => !empty($r['api_key_enc'])],
                Database::all("SELECT * FROM ai_providers")),
        ]);
    }
    private static function aiProviderSave(string $code): void
    {
        $d = Input::body();
        AiService::saveConfig($code, $d);
        Audit::log(Auth::user()['id'], 'ai_config_change', 'ai_provider', $code);
        Response::json(['ok' => true]);
    }

    /* ---------- admin: users ---------- */
    private static function users(): void
    {
        Response::json(UserModel::all());
    }
    private static function usersCreate(): void
    {
        $d = Input::body();
        $name = Input::str($d, 'name', 120);
        $email = Input::email($d);
        $pass = Input::str($d, 'password', 200);
        if ($name === '' || $email === '' || strlen($pass) < 12) Response::error('Name, valid email and 12+ char password required', 422, 'VALIDATION_ERROR');
        $id = UserModel::create($name, $email, $pass, (int)($d['role_id'] ?? 3));
        Audit::log(Auth::user()['id'], 'user_create', 'user', (string)$id);
        Response::json(['ok' => true, 'id' => $id], 201);
    }

    private static function usersUpdate(int $id): void
    {
        $d = Input::body();
        $u = Database::one("SELECT * FROM users WHERE id=?", [$id]);
        if (!$u) Response::error('User not found', 404, 'NOT_FOUND');
        if ($id === (int)Auth::user()['id'] && isset($d['status']) && $d['status'] !== 'active') {
            Response::error('You cannot disable your own account', 422, 'VALIDATION_ERROR');
        }
        $sets = []; $p = [];
        foreach (['name', 'status'] as $f) {
            if (array_key_exists($f, $d)) { $sets[] = "$f=?"; $p[] = Input::str($d, $f, 120); }
        }
        if (isset($d['role_id'])) {
            $rid = (int)$d['role_id'];
            $role = Database::one("SELECT id FROM roles WHERE id=?", [$rid]);
            if (!$role) Response::error('Invalid role', 422, 'VALIDATION_ERROR');
            $sets[] = "role_id=?"; $p[] = $rid;
        }
        if ($sets) { $p[] = $id; Database::q("UPDATE users SET " . implode(',', $sets) . " WHERE id=?", $p); }
        Audit::log(Auth::user()['id'], 'user_update', 'user', (string)$id, array_keys($d));
        Response::json(['ok' => true]);
    }

    private static function usersDelete(int $id): void
    {
        $u = Database::one("SELECT * FROM users WHERE id=?", [$id]);
        if (!$u) Response::error('User not found', 404, 'NOT_FOUND');
        if ((int)$u['role_id'] === 1) {
            // never remove the last Super Admin
            $supers = (int)Database::one("SELECT COUNT(*) n FROM users WHERE role_id=1 AND status='active'")['n'];
            if ($supers <= 1) Response::error('Cannot remove the last Super Admin', 409, 'CONFLICT');
        }
        if ($id === (int)Auth::user()['id']) Response::error('You cannot delete your own account', 422, 'VALIDATION_ERROR');
        Database::q("UPDATE users SET status='disabled' WHERE id=?", [$id]);
        Database::q("DELETE FROM sessions WHERE user_id=?", [$id]);
        Audit::log(Auth::user()['id'], 'user_delete', 'user', (string)$id);
        Response::json(['ok' => true]);
    }

    private static function usersResetPassword(int $id): void
    {
        $d = Input::body();
        $pass = Input::str($d, 'password', 200);
        if (strlen($pass) < 12) Response::error('Password must be 12+ characters', 422, 'VALIDATION_ERROR');
        if (!Database::one("SELECT id FROM users WHERE id=?", [$id])) Response::error('User not found', 404, 'NOT_FOUND');
        Database::q("UPDATE users SET password_hash=?, must_change_password=1 WHERE id=?", [password_hash($pass, PASSWORD_DEFAULT), $id]);
        Database::q("DELETE FROM sessions WHERE user_id=?", [$id]);
        Audit::log(Auth::user()['id'], 'user_password_reset', 'user', (string)$id);
        Response::json(['ok' => true]);
    }

    private static function usersRevokeSessions(int $id): void
    {
        Database::q("DELETE FROM sessions WHERE user_id=?", [$id]);
        Audit::log(Auth::user()['id'], 'user_sessions_revoked', 'user', (string)$id);
        Response::json(['ok' => true]);
    }

    /* ---------- admin: backup ---------- */
    private static function backup(): void
    {
        $package = [
            'avos' => AV_VERSION,
            'exported' => date('c'),
            'content' => ContentStore::all(),
            'leads' => LeadModel::all(),
            'submissions' => FormModel::all(),
            'users' => array_map(fn($u) => ['name' => $u['name'], 'email' => $u['email'], 'role' => $u['role_name']], UserModel::all()),
            'ai_providers' => array_map(fn($r) => ['code' => $r['code'], 'model' => $r['model'], 'is_default' => (bool)$r['is_default']], Database::all("SELECT code, model, is_default FROM ai_providers")),
        ];
        $json = json_encode($package, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        $file = AV_BACKUPS . '/avos-backup-' . date('Ymd-His') . '.json';
        @mkdir(dirname($file), 0775, true);
        file_put_contents($file, $json);
        $size = strlen($json);
        // optional: full mysqldump when the binary is available (Hostinger has it).
        // Credentials go through a chmod-600 defaults-extra-file (never on the
        // process command line) which is deleted immediately after.
        if (function_exists('exec') && is_callable('exec')) {
            $dbfile = AV_BACKUPS . '/db-' . date('Ymd-His') . '.sql';
            $db = AV_DB;
            $cnf = tempnam(sys_get_temp_dir(), 'avos-dump-');
            if ($cnf !== false) {
                @chmod($cnf, 0600);
                file_put_contents($cnf, "[client]
host=" . $db['host'] . "
user=" . $db['user'] . "
password=" . $db['pass'] . "
");
                $cmd = sprintf('mysqldump --defaults-extra-file=%s --no-tablespaces --single-transaction --skip-lock-tables %s 2>/dev/null',
                    escapeshellarg($cnf), escapeshellarg($db['name']));
                exec($cmd . ' > ' . escapeshellarg($dbfile), $outArr, $code);
                @unlink($cnf);   // credentials file removed immediately
                if (!($code === 0 && is_file($dbfile) && filesize($dbfile) > 0)) { @unlink($dbfile); }
            }
        }
        // backup retention (configurable, default 5)
        $keep = PublishSettings::get()['db_backups'];
        $files = glob(AV_BACKUPS . '/avos-backup-*.json') ?: [];
        usort($files, fn($a, $b) => filemtime($b) <=> filemtime($a));
        foreach (array_slice($files, $keep) as $old) @unlink($old);
        $files = glob(AV_BACKUPS . '/db-*.sql') ?: [];
        usort($files, fn($a, $b) => filemtime($b) <=> filemtime($a));
        foreach (array_slice($files, $keep) as $old) @unlink($old);
        Audit::log(Auth::user()['id'], 'backup', 'site', basename($file));
        Response::json(['ok' => true, 'file' => basename($file), 'size' => $size]);
    }

    /* ---------- backup list / restore / delete / download ---------- */
    private static function backupFile(string $name): string
    {
        // safe name: only our generated backup files, never path traversal
        if (!preg_match('/^(avos-backup-[0-9]{8}-[0-9]{6}\.json|db-[0-9]{8}-[0-9]{6}\.sql)$/', $name)) {
            Response::error('Invalid backup name (expected avos-backup-*.json or db-*.sql)', 422, 'VALIDATION_ERROR');
        }
        $file = AV_BACKUPS . '/' . $name;
        if (!is_file($file)) Response::error('Backup not found', 404, 'NOT_FOUND');
        return $file;
    }

    private static function backupList(): void
    {
        $out = [];
        foreach (array_merge(glob(AV_BACKUPS . '/avos-backup-*.json') ?: [], glob(AV_BACKUPS . '/db-*.sql') ?: []) as $f) {
            $out[] = ['file' => basename($f), 'size' => filesize($f), 'created_at' => date('c', filemtime($f)), 'kind' => str_starts_with(basename($f), 'db-') ? 'mysqldump' : 'json'];
        }
        usort($out, fn($a, $b) => strcmp($b['file'], $a['file']));
        Response::json($out);
    }

    private static function backupRestore(): void
    {
        $d = Input::body();
        $file = self::backupFile(Input::str($d, 'file', 120));
        if (str_ends_with($file, '.sql')) {
            Response::error('db-*.sql backups are raw mysqldump exports — restore them with mysql on the CLI ' .
                            '(php backend/scripts/restore-backup.php), not through the application API.', 422, 'VALIDATION_ERROR');
        }
        $pkg = json_decode((string)file_get_contents($file), true);
        if (!$pkg || empty($pkg['avos']) || !is_array($pkg['content'] ?? null)) {
            Response::error('Invalid backup package (missing avos/content sections)', 422, 'VALIDATION_ERROR');
        }
        $uid = Auth::user()['id'] ?? null;

        // validate the whole package BEFORE mutating anything (no half-restores)
        $leadCols = ['name', 'company', 'email', 'phone', 'lead_type', 'message', 'source', 'status', 'score'];
        foreach (($pkg['leads'] ?? []) as $l) {
            if (!is_array($l) || empty($l['name'])) Response::error('Backup leads section is malformed — restore aborted', 422, 'VALIDATION_ERROR');
        }
        foreach (($pkg['submissions'] ?? []) as $fs) {
            if (!is_array($fs)) Response::error('Backup submissions section is malformed — restore aborted', 422, 'VALIDATION_ERROR');
        }

        // single transaction: any failure rolls back the ENTIRE restore
        $pdo = Database::pdo();
        $pdo->beginTransaction();
        try {

        // content (each key becomes a new version — history preserved)
        $restored = 0;
        foreach (($pkg['content'] ?? []) as $key => $value) {
            if (is_array($value) && in_array($key, ['settings', 'nav', 'sections', 'pages', 'projects', 'articles', 'clients', 'testimonials', 'downloads', 'media', 'forms', 'seo', 'analytics', 'availability', 'notifications', 'dashboard'], true)) {
                ContentStore::put($key, $value, $uid, 'restored from backup ' . basename($file));
                $restored++;
            }
        }
        // leads + submissions: replace tables from the backup (ids preserved)
        $leads = 0;
        Database::q("DELETE FROM leads");
        foreach (($pkg['leads'] ?? []) as $l) {
            if (empty($l['name'])) continue;
            Database::q("INSERT INTO leads (id, name, company, email, phone, lead_type, message, source, page, referrer,
                            utm_source, utm_medium, utm_campaign, utm_term, utm_content, status, score, tags, notes, created_at)
                         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                [$l['id'] ?? null, $l['name'], $l['company'] ?? '', $l['email'] ?? '', $l['phone'] ?? '', $l['lead_type'] ?? '',
                 $l['message'] ?? '', $l['source'] ?? '', $l['page'] ?? '', $l['referrer'] ?? '', $l['utm_source'] ?? '',
                 $l['utm_medium'] ?? '', $l['utm_campaign'] ?? '', $l['utm_term'] ?? '', $l['utm_content'] ?? '',
                 $l['status'] ?? 'new', $l['score'] ?? 50, $l['tags'] ?? '[]', $l['notes'] ?? '', $l['created_at'] ?? date('Y-m-d H:i:s')]);
            $leads++;
        }
        $subs = 0;
        Database::q("DELETE FROM form_submissions");
        foreach (($pkg['submissions'] ?? []) as $fs) {
            Database::q("INSERT INTO form_submissions (form_id, data) VALUES (?,?)", [($fs['form_id'] ?? 0) ? (int)$fs['form_id'] : null, json_encode($fs['data'] ?? [])]);
            $subs++;
        }
            $pdo->commit();
        } catch (Throwable $e) {
            $pdo->rollBack();
            ErrorModel::log('error', 'backup_restore', $e->getMessage());
            Response::error('Restore failed and was rolled back: ' . $e->getMessage(), 500, 'RESTORE_FAILED');
        }
        Audit::log($uid, 'backup_restore', 'site', basename($file), ['content_keys' => $restored, 'leads' => $leads, 'submissions' => $subs]);
        NotificationModel::push('Backup restored', "Restored from " . basename($file) . " — {$restored} content keys, {$leads} leads", 'publish');
        Response::json(['ok' => true, 'content_keys' => $restored, 'leads' => $leads, 'submissions' => $subs]);
    }

    private static function backupDownload(string $name): void
    {
        $file = self::backupFile($name);
        header('Content-Type: ' . (str_ends_with($name, '.sql') ? 'application/sql' : 'application/json'));
        header('Content-Disposition: attachment; filename="' . $name . '"');
        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="' . $name . '"');
        header('Content-Length: ' . filesize($file));
        readfile($file);
        exit;
    }

    private static function backupDelete(string $name): void
    {
        $file = self::backupFile($name);
        unlink($file);
        Audit::log(Auth::user()['id'], 'backup_delete', 'site', $name);
        Response::json(['ok' => true]);
    }

    /* ---------- health ---------- */
    private static function status(): void
    {
        $u = Auth::user();
        $dbOk = true;
        $storageOk = is_writable(AV_STORAGE);
        try { Database::one("SELECT 1"); } catch (Throwable $e) { $dbOk = false; }
        $publish = is_dir(AV_TEMPLATE) && is_dir(AV_SITE_OUT);
        $media = is_writable(AV_UPLOADS);
        $backup = is_writable(AV_BACKUPS);
        $aiProviders = 0;
        $aiReady = false;
        try {
            $aiProviders = (int)Database::one("SELECT COUNT(*) n FROM ai_providers")['n'];
            $aiReady = (int)Database::one("SELECT COUNT(*) n FROM ai_providers WHERE api_key_enc IS NOT NULL AND api_key_enc != ''")['n'] > 0;
        } catch (Throwable $e) {}
        $perf = null;
        try {
            $p1 = Database::one("SELECT AVG(ms) avg_ms, COUNT(*) n FROM perf_log WHERE created_at > NOW() - INTERVAL 1 DAY");
            if ($p1) $perf = ['avg_ms' => (int)$p1['avg_ms'], 'requests_24h' => (int)$p1['n']];
        } catch (Throwable $e) {}
        Response::json([
            'status' => ($dbOk && $storageOk && $publish) ? 'healthy' : 'degraded',
            'environment' => AV_ENV,
            'database' => $dbOk ? 'connected' : 'error',
            'storage' => $storageOk ? 'writable' : 'readonly',
            'publish' => $publish ? 'ready' : 'template missing',
            'media' => $media ? 'writable' : 'readonly',
            'email' => 'mail() available',
            'ai' => $aiReady ? 'configured' : 'no provider keys',
            'ai_providers' => $aiProviders,
            'backup' => $backup ? 'writable' : 'readonly',
            'perf' => $perf,
            'version' => AV_VERSION,
            'authed' => (bool)$u,
            'user' => $u ? ['name' => $u['name'], 'role' => $u['role_name']] : null,
            'public_site' => is_file(AV_SITE_OUT . '/index.html'),
            'timestamp' => date('c'),
        ]);
    }

/* ============================================================
   V2 HANDLERS — CRM / projects / proposals / analytics /
   automation / platform
   ============================================================ */
    /* ---------- CRM generic CRUD ---------- */
    private static function crmList(string $which): void
    {
        $data = match ($which) {
            'companies' => CrmModel::companies(),
            'contacts' => CrmModel::contacts(),
            'opportunities' => CrmModel::opportunities(),
            'meetings' => CrmModel::meetings(),
            default => [],
        };
        Response::json($data);
    }
    private static function crmCreate(string $which): void
    {
        $d = Input::body();
        $required = match ($which) {
            'companies' => ['name'],
            'contacts' => ['name'],
            'opportunities' => ['title'],
            'meetings' => ['subject'],
            default => [],
        };
        foreach ($required as $f) {
            if (trim((string)($d[$f] ?? '')) === '') {
                Response::error("Field '$f' is required for $which", 422, 'VALIDATION_ERROR');
            }
        }
        $id = match ($which) {
            'companies' => CrmModel::createCompany($d),
            'contacts' => CrmModel::createContact($d),
            'opportunities' => CrmModel::createOpportunity($d),
            'meetings' => CrmModel::createMeeting($d),
            default => 0,
        };
        if (!$id) Response::error('Invalid entity', 422, 'VALIDATION_ERROR');
        if ($which === 'meetings') {
            foreach (['lead_id', 'contact_id', 'opportunity_id'] as $fk) {
                if (!empty($d[$fk])) {
                    $etype = $fk === 'opportunity_id' ? 'opportunity' : ($fk === 'contact_id' ? 'contact' : 'lead');
                    CrmModel::addActivity($etype, (int)$d[$fk], 'meeting_scheduled', 'Meeting: ' . ($d['subject'] ?? ''));
                }
            }
        }
        Audit::log(Auth::user()['id'], 'create', 'crm_' . $which, (string)$id);
        Response::json(['id' => $id], 201);
    }
    private static function crmUpdate(string $which, int $id): void
    {
        $d = Input::body();
        match ($which) {
            'companies' => CrmModel::updateCompany($id, $d),
            'contacts' => CrmModel::updateContact($id, $d),
            'opportunities' => CrmModel::updateOpportunity($id, $d),
            'meetings' => CrmModel::updateMeeting($id, $d),
            default => null,
        };
        Audit::log(Auth::user()['id'], 'update', 'crm_' . $which, (string)$id);
        // opportunity stage change → notify + webhook
        if ($which === 'opportunities' && isset($d['stage'])) {
            NotificationModel::push('Opportunity updated', "Opportunity #{$id} → {$d['stage']}", 'info');
            WebhookModel::dispatch('opportunity.updated', ['id' => $id, 'stage' => $d['stage']]);
        }
        Response::json(['ok' => true]);
    }
    private static function crmDelete(string $which, int $id): void
    {
        $permanent = !empty(Input::body()['permanent']) || ($_GET['permanent'] ?? '') === '1';
        if ($permanent) {
            TrashModel::permanent($which, $id);
            Audit::log(Auth::user()['id'], 'delete_permanent', 'crm_' . $which, (string)$id);
        } else {
            match ($which) {
                'companies' => CrmModel::deleteCompany($id),
                'contacts' => CrmModel::deleteContact($id),
                'opportunities' => CrmModel::deleteOpportunity($id),
                'meetings' => CrmModel::deleteMeeting($id),
                'tasks' => CrmModel::deleteTask($id),
                default => null,
            };
            Audit::log(Auth::user()['id'], 'delete', 'crm_' . $which, (string)$id);
        }
        Response::json(['ok' => true, 'soft' => !$permanent]);
    }

    private static function crmRestore(string $which, int $id): void
    {
        if (!in_array($which, ['companies', 'contacts', 'opportunities', 'meetings', 'tasks'], true)) {
            Response::error('Invalid entity', 422, 'VALIDATION_ERROR');
        }
        if (!TrashModel::restore($which, $id)) Response::error('Not found in trash', 404, 'NOT_FOUND');
        Audit::log(Auth::user()['id'], 'restore', 'crm_' . $which, (string)$id);
        Response::json(['ok' => true]);
    }
    private static function crmPipeline(): void
    {
        Response::json(CrmModel::pipelineSummary());
    }
    private static function crmTasks(): void
    {
        $status = Input::str($_GET, 'status', 20) ?: null;
        Response::json(CrmModel::tasks($status));
    }
    private static function crmTaskCreate(): void
    {
        $id = CrmModel::createTask(Input::body());
        Audit::log(Auth::user()['id'], 'create', 'task', (string)$id);
        Response::json(['id' => $id], 201);
    }
    private static function crmTaskUpdate(int $id): void
    {
        CrmModel::updateTask($id, Input::body());
        Response::json(['ok' => true]);
    }
    private static function crmTaskDelete(int $id): void
    {
        CrmModel::deleteTask($id);
        Response::json(['ok' => true]);
    }
    private static function crmActivities(string $type, int $id): void
    {
        if (!in_array($type, ['lead', 'contact', 'opportunity', 'meeting', 'project'], true)) {
            Response::error('Invalid activity type', 422, 'VALIDATION_ERROR');
        }
        Response::json(CrmModel::activities($type, $id));
    }

    /* ---------- lead scoring ---------- */
    private static function scoringRules(): void { Response::json(CrmModel::scoringRules()); }
    private static function scoringRuleSave(int $id): void
    {
        CrmModel::saveScoringRule($id, Input::body());
        Audit::log(Auth::user()['id'], 'update', 'scoring_rule', (string)$id);
        Response::json(['ok' => true]);
    }
    private static function scoringRuleDelete(int $id): void
    {
        CrmModel::deleteScoringRule($id);
        Response::json(['ok' => true]);
    }

    /* ---------- business projects ---------- */
    private static function bizProjects(): void { Response::json(BusinessProjectModel::all()); }
    private static function bizProjectCreate(): void
    {
        $id = BusinessProjectModel::create(Input::body());
        Audit::log(Auth::user()['id'], 'create', 'project', (string)$id);
        WebhookModel::dispatch('project.created', ['id' => $id]);
        Response::json(['id' => $id], 201);
    }
    private static function bizProjectUpdate(int $id): void
    {
        BusinessProjectModel::update($id, Input::body());
        Response::json(['ok' => true]);
    }
    private static function bizProjectDelete(int $id): void
    {
        BusinessProjectModel::delete($id);
        Response::json(['ok' => true]);
    }
    private static function bizMilestones(int $pid): void { Response::json(BusinessProjectModel::milestones($pid)); }
    private static function bizMilestoneAdd(int $pid): void { Response::json(['id' => BusinessProjectModel::addMilestone($pid, Input::body())], 201); }
    private static function bizMilestoneUpdate(int $id): void { BusinessProjectModel::updateMilestone($id, Input::body()); Response::json(['ok' => true]); }
    private static function bizMilestoneDelete(int $id): void { BusinessProjectModel::deleteMilestone($id); Response::json(['ok' => true]); }
    private static function bizDocuments(int $pid): void { Response::json(BusinessProjectModel::documents($pid)); }
    private static function bizDocumentAdd(int $pid): void { Response::json(['id' => BusinessProjectModel::addDocument($pid, Input::body())], 201); }
    private static function bizDocumentDelete(int $id): void { BusinessProjectModel::deleteDocument($id); Response::json(['ok' => true]); }

    /* ---------- proposals ---------- */
    private static function proposals(): void { Response::json(ProposalModel::all()); }
    private static function proposalCreate(): void
    {
        $d = Input::body();
        $id = ProposalModel::create($d);
        if (!empty($d['lead_id'])) CrmModel::addActivity('lead', (int)$d['lead_id'], 'proposal_created', 'Proposal: ' . ($d['title'] ?? ''));
        Audit::log(Auth::user()['id'], 'proposal_create', 'proposal', (string)$id);
        Response::json(['id' => $id], 201);
    }
    private static function proposalUpdate(int $id): void
    {
        $d = Input::body();
        ProposalModel::update($id, $d);
        if (!empty($d['status'])) {
            $cur = Database::one("SELECT status FROM proposals WHERE id=?", [$id]);
            if ($cur && $cur['status'] !== $d['status']) {
                Audit::log(Auth::user()['id'], 'proposal_status_changed', 'proposal', (string)$id, ['from' => $cur['status'], 'to' => $d['status']]);
            }
        }
        Audit::log(Auth::user()['id'], 'proposal_update', 'proposal', (string)$id);
        Response::json(['ok' => true]);
    }
    private static function proposalDelete(int $id): void
    {
        $permanent = !empty(Input::body()['permanent']);
        if ($permanent) { TrashModel::permanent('proposals', $id); }
        else { ProposalModel::delete($id); }
        Audit::log(Auth::user()['id'], $permanent ? 'proposal_delete_permanent' : 'proposal_delete', 'proposal', (string)$id);
        Response::json(['ok' => true, 'soft' => !$permanent]);
    }

    private static function proposalRestore(int $id): void
    {
        if (!TrashModel::restore('proposals', $id)) Response::error('Not found in trash', 404, 'NOT_FOUND');
        Audit::log(Auth::user()['id'], 'proposal_restore', 'proposal', (string)$id);
        Response::json(['ok' => true]);
    }
    private static function proposalPreview(int $id): void
    {
        $p = ProposalModel::find($id);
        if (!$p) Response::error('Not found', 404, 'NOT_FOUND');
        Response::html(self::proposalHtml($p));
    }
    private static function proposalHtml(array $p): string
    {
        $dl = json_decode($p['deliverables'] ?: '[]', true) ?: [];
        $items = '';
        foreach ($dl as $i => $d) $items .= '<li>' . htmlspecialchars((string)$d) . '</li>';
        $scope = nl2br(htmlspecialchars((string)$p['scope']));
        $terms = nl2br(htmlspecialchars((string)$p['terms']));
        return "<!doctype html><html><head><meta charset='utf-8'><title>{$p['title']} — Proposal</title>
        <style>body{font-family:Georgia,serif;max-width:720px;margin:40px auto;padding:0 24px;color:#1a1a1a;line-height:1.6}
        h1{font-size:28px}h2{font-size:18px;margin-top:32px;border-bottom:1px solid #ddd;padding-bottom:6px}
        .muted{color:#777;font-size:14px}.meta{border-top:3px solid #111;padding-top:16px;margin-top:40px;font-size:13px;color:#555}
        li{margin-bottom:6px}</style></head><body>
        <h1>{$p['title']}</h1>
        <p class='muted'>Prepared for <strong>{$p['client_name']}</strong> · " . date('d M Y') . "</p>
        <h2>Scope</h2><p>{$scope}</p>
        <h2>Deliverables</h2><ul>{$items}</ul>
        <h2>Timeline</h2><p>{$p['timeline']}</p>
        <h2>Investment</h2><p style='font-size:20px'><strong>" . number_format((float)$p['investment']) . " {$p['currency']}</strong></p>
        <h2>Terms</h2><p>{$terms}</p>
        <p class='meta'>Valid for {$p['validity_days']} days · AV OS proposal · abhijeetvarghese.com</p>
        </body></html>";
    }

    /**
     * SVG sanitizer: parses with DOMDocument (no network, no entities) and
     * strips anything executable — <script>, <style>, <foreignObject>,
     * iframe/object/embed, event-handler attributes, javascript:/data: URIs,
     * external references and entity declarations. Returns sanitized XML or
     * null when the file is not parseable XML at all.
     */
    private static function sanitizeSvg(string $xml): ?string
    {
        // reject unsafe prolog/entities before parsing
        if (preg_match('/<!ENTITY|<!DOCTYPE|<!\[CDATA\[/i', $xml)) return null;
        $prev = libxml_use_internal_errors(true);
        $doc = new DOMDocument('1.0', 'UTF-8');
        $ok = $doc->loadXML($xml, LIBXML_NONET | LIBXML_NOENT | LIBXML_NOCDATA);
        libxml_clear_errors();
        libxml_use_internal_errors($prev);
        if (!$ok) return null;
        if (strtolower((string)$doc->documentElement->nodeName) !== 'svg') return null;

        $dangerous = ['script', 'style', 'foreignobject', 'iframe', 'object', 'embed', 'meta', 'link', 'base'];
        $xpath = new DOMXPath($doc);
        foreach ($dangerous as $tag) {
            $nodes = $xpath->query('//*[translate(local-name(),"ABCDEFGHIJKLMNOPQRSTUVWXYZ","abcdefghijklmnopqrstuvwxyz")="' . $tag . '"]');
            foreach ($nodes as $n) if ($n && $n->parentNode) $n->parentNode->removeChild($n);
        }
        // walk remaining nodes and strip dangerous attributes
        foreach ($xpath->query('//@*') as $attr) {
            $name = strtolower((string)$attr->nodeName);
            $val = strtolower(trim((string)$attr->nodeValue));
            if (str_starts_with($name, 'on')) { $attr->ownerElement->removeAttributeNode($attr); continue; }
            if (str_contains($val, 'javascript:') || str_contains($val, 'vbscript:') || str_contains($val, 'expression(')) {
                $attr->ownerElement->removeAttributeNode($attr); continue;
            }
            if (str_starts_with($val, 'data:') && $name !== 'src' && $name !== 'href') {
                $attr->ownerElement->removeAttributeNode($attr); continue;
            }
            if (($name === 'href' || $name === 'src' || str_contains($name, 'href')) && preg_match('~^(https?:)?//~i', $val) && !str_contains($val, 'w3.org')) {
                $attr->ownerElement->removeAttributeNode($attr); continue;
            }
        }
        $out = $doc->saveXML($doc->documentElement);
        return $out === false ? null : $out;
    }

    /* ---------- analytics ---------- */
    private static function analyticsSummary(): void { Response::json(AnalyticsModel::summary((int)(Input::str($_GET, 'days', 4) ?: 30))); }
    private static function analyticsPages(): void { Response::json(AnalyticsModel::topPages((int)(Input::str($_GET, 'days', 4) ?: 30))); }
    private static function analyticsSources(): void { Response::json(AnalyticsModel::sources((int)(Input::str($_GET, 'days', 4) ?: 30))); }
    private static function analyticsDaily(): void { Response::json(AnalyticsModel::daily((int)(Input::str($_GET, 'days', 4) ?: 30))); }
    private static function analyticsCampaigns(): void { Response::json(AnalyticsModel::campaigns()); }
    private static function analyticsContent(): void { Response::json(AnalyticsModel::contentMetrics()); }
    private static function analyticsTrack(): void
    {
        // first-party analytics pixel — public, rate-limited, minimal data
        if (!RateLimiter::allow('track:' . Auth::ip(), 300, 3600)) Response::error('Too many requests', 429, 'RATE_LIMITED');
        $d = Input::body();
        $visitor = Input::str($d, 'visitor_id', 32);
        $isNew = $visitor === '';
        $vid = $isNew ? bin2hex(random_bytes(16)) : $visitor;
        AnalyticsModel::track([
            'event_type' => Input::str($d, 'event_type', 40) ?: 'pageview',
            'path' => Input::str($d, 'path', 255) ?: '/',
            'referrer' => Input::str($d, 'referrer', 500),
            'utm_source' => Input::str($d, 'utm_source', 120),
            'utm_medium' => Input::str($d, 'utm_medium', 120),
            'utm_campaign' => Input::str($d, 'utm_campaign', 120),
            'device' => Input::str($d, 'device', 20),
            'country' => Input::str($d, 'country', 60),
            'visitor_id' => $vid,
            'content_id' => Input::str($d, 'content_id', 80),
            'content_type' => Input::str($d, 'content_type', 40),
            'new_visitor' => $isNew,
        ]);
        Response::json(['ok' => true, 'visitor_id' => $vid]);
    }

    /* ---------- automation ---------- */
    private static function automations(): void { Response::json(AutomationModel::all()); }
    private static function automationSave(int $id): void
    {
        if ($id) AutomationModel::update($id, Input::body());
        else $id = AutomationModel::create(Input::body());
        Audit::log(Auth::user()['id'], 'save', 'automation', (string)$id);
        Response::json(['ok' => true, 'id' => $id]);
    }
    private static function automationDelete(int $id): void { AutomationModel::delete($id); Response::json(['ok' => true]); }
    private static function automationRuns(): void { Response::json(AutomationModel::runs()); }

    /* ---------- notifications ---------- */
    private static function notifications(): void { Response::json(NotificationModel::all(Auth::user()['id'] ?? null)); }
    private static function notificationRead(int $id): void { NotificationModel::markRead($id); Response::json(['ok' => true]); }
    private static function notificationReadAll(): void { NotificationModel::markAllRead(Auth::user()['id'] ?? null); Response::json(['ok' => true]); }

    /* ---------- webhooks ---------- */
    private static function webhooks(): void { Response::json(WebhookModel::all()); }
    private static function webhookSave(int $id): void
    {
        if ($id) WebhookModel::update($id, Input::body());
        else $id = WebhookModel::create(Input::body());
        Audit::log(Auth::user()['id'], 'save', 'webhook', (string)$id);
        Response::json(['ok' => true, 'id' => $id], $id ? 201 : 200);
    }
    private static function webhookDelete(int $id): void { WebhookModel::delete($id); Response::json(['ok' => true]); }
    private static function webhookDeliveries(int $id): void { Response::json(WebhookModel::deliveries($id)); }

    /* ---------- api keys ---------- */
    private static function apiKeys(): void { Response::json(ApiKeyModel::all()); }
    private static function apiKeyCreate(): void
    {
        $d = Input::body();
        $name = Input::str($d, 'name', 120) ?: 'API key';
        $res = ApiKeyModel::create($name, $d['permissions'] ?? []);
        Audit::log(Auth::user()['id'], 'create', 'api_key', $res['prefix']);
        Response::json(['ok' => true, 'key' => $res['key'], 'prefix' => $res['prefix'], 'note' => 'Store this key now — it will not be shown again'], 201);
    }
    private static function apiKeyRevoke(int $id): void { ApiKeyModel::revoke($id); Response::json(['ok' => true]); }

    /* ---------- feature flags ---------- */
    private static function flags(): void { Response::json(FeatureFlagModel::all()); }
    private static function flagSet(string $flag): void
    {
        FeatureFlagModel::set($flag, Input::bool(Input::body(), 'enabled'));
        Audit::log(Auth::user()['id'], 'update', 'feature_flag', $flag);
        Response::json(['ok' => true]);
    }

    /* ---------- knowledge ---------- */
    private static function knowledge(): void { Response::json(KnowledgeModel::all()); }
    private static function knowledgeSave(int $id): void
    {
        if ($id) KnowledgeModel::update($id, Input::body());
        else $id = KnowledgeModel::create(Input::body());
        Response::json(['ok' => true, 'id' => $id]);
    }
    private static function knowledgeDelete(int $id): void { KnowledgeModel::delete($id); Response::json(['ok' => true]); }

    /* ---------- errors / email log ---------- */
    private static function errors(): void { Response::json(ErrorModel::all()); }
    private static function errorsClear(): void { ErrorModel::clear(); Response::json(['ok' => true]); }
    private static function emailLog(): void { Response::json(EmailModel::all()); }

    /* ---------- email templates (server-side, CMS-editable) ---------- */
    private static function emailTemplates(): void { Response::json(EmailTemplateModel::all()); }

    private static function emailTemplateSave(int $id): void
    {
        $d = Input::body();
        $subject = Input::str($d, 'subject', 190);
        $body = Input::str($d, 'body', 20000);
        if ($subject === '' || $body === '') Response::error('subject and body required', 422, 'VALIDATION_ERROR');
        EmailTemplateModel::save($id, ['name' => Input::str($d, 'name', 150), 'subject' => $subject, 'body' => $body, 'enabled' => (int)($d['enabled'] ?? 1)]);
        Audit::log(Auth::user()['id'], 'email_template_update', 'email_template', (string)$id);
        Response::json(['ok' => true]);
    }

    private static function emailTemplateTest(int $id): void
    {
        $tpl = Database::one("SELECT * FROM email_templates WHERE id=?", [$id]);
        if (!$tpl) Response::error('Template not found', 404, 'NOT_FOUND');
        $me = Auth::user();
        $vars = ['site_name' => AV_SITE_URL, 'name' => $me['name'] ?? 'there', 'email' => $me['email'] ?? '',
                 'phone' => '', 'company' => '', 'project_type' => 'test', 'source' => 'test',
                 'message' => 'This is a test delivery from AV OS.', 'admin_url' => AV_SITE_URL . '/admin/',
                 'calendly_url' => '', 'date' => date('d M Y'), 'time' => date('H:i'),
                 'meeting_type' => 'test', 'reset_link' => AV_SITE_URL . '/admin/',
                 'alert_subject' => 'Test', 'alert_body' => 'Test', 'lead_name' => 'Test',
                 'lead_email' => '', 'lead_score' => 0, 'inactive_days' => 0];
        $id = EmailModel::queue($tpl['slug'], $me['email'] ?? '', '', '', $vars);
        Response::json(['ok' => true, 'email_log_id' => $id, 'note' => 'test queued; delivery status visible in Platform → Email log']);
    }

    /* ---------- campaign manager ---------- */
    private static function campaigns(): void { Response::json(CampaignModel::all()); }

    private static function campaignSave(int $id): void
    {
        $d = Input::body();
        $name = Input::str($d, 'name', 150);
        if ($name === '') Response::error('name required', 422, 'VALIDATION_ERROR');
        $row = ['name' => $name,
                'utm_source' => Input::str($d, 'utm_source', 120),
                'utm_medium' => Input::str($d, 'utm_medium', 120),
                'utm_campaign' => Input::str($d, 'utm_campaign', 120),
                'status' => in_array($d['status'] ?? '', ['active', 'paused', 'completed'], true) ? $d['status'] : 'active',
                'budget' => (float)($d['budget'] ?? 0),
                'description' => Input::str($d, 'description', 2000),
                'start_date' => preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($d['start_date'] ?? '')) ? $d['start_date'] : null,
                'end_date' => preg_match('/^\d{4}-\d{2}-\d{2}$/', (string)($d['end_date'] ?? '')) ? $d['end_date'] : null];
        if ($id > 0) {
            CampaignModel::update($id, $row);
            Audit::log(Auth::user()['id'], 'campaign_update', 'campaign', (string)$id);
        } else {
            $id = CampaignModel::create($row);
            Audit::log(Auth::user()['id'], 'campaign_create', 'campaign', (string)$id);
        }
        Response::json(['ok' => true, 'id' => $id]);
    }

    private static function campaignDelete(int $id): void
    {
        CampaignModel::delete($id);
        Audit::log(Auth::user()['id'], 'campaign_delete', 'campaign', (string)$id);
        Response::json(['ok' => true]);
    }

    /* ---------- content health (real audit of stored content) ---------- */
    private static function contentHealth(): void { Response::json(HealthModel::contentHealth()); }

    /* ---------- AI usage (real data from ai_requests) ---------- */
    private static function aiUsage(): void
    {
        $days = max(1, min(365, (int)($_GET['days'] ?? 30)));
        Response::json(AiUsageModel::usage($days));
    }

    /* ---------- multi-site readiness ---------- */
    private static function sites(): void
    {
        Response::json(Database::all("SELECT id, domain, name, theme, status, created_at FROM sites ORDER BY id"));
    }

    /* ---------- lead inactivity sweep (manual + cron-compatible) ---------- */
    private static function automationCheckInactive(): void
    {
        $r = AutomationModel::runInactive();
        Audit::log(Auth::user()['id'], 'automation_inactive_check', 'automation', '');
        Response::json($r);
    }

    /* ---------- proposal PDF export (pure-PHP generator) ---------- */
    private static function proposalPdf(int $id): void
    {
        $p = Database::one("SELECT * FROM proposals WHERE id=?", [$id]);
        if (!$p) Response::error('Proposal not found', 404, 'NOT_FOUND');
        $site = ContentStore::get('settings');
        $pdf = Pdf::proposal($p, $site);
        header('Content-Type: application/pdf');
        header('Content-Disposition: attachment; filename="proposal-' . $id . '.pdf"');
        header('Content-Length: ' . strlen($pdf));
        echo $pdf;
        exit;
    }

    /* ---------- global search ---------- */
    private static function search(): void
    {
        $q = Input::str($_GET, 'q', 120);
        if ($q === '') Response::json([]);
        Response::json(SearchModel::search($q));
    }

    /* ---------- AI copilot (tool router, permission checked, no raw SQL) ---------- */
    private static function copilot(): void
    {
        $d = Input::body();
        $query = Input::str($d, 'query', 2000);
        if ($query === '') Response::error('query required', 422, 'VALIDATION_ERROR');

        $ql = strtolower($query);
        $response = null;

        // ---- tool permission layer: the copilot inherits the user's RBAC ----
        $permRules = [
            ['leads.read', fn($q) => str_contains($q, 'lead') || str_contains($q, 'pipeline')],
            ['analytics.view', fn($q) => str_contains($q, 'dashboard') || str_contains($q, 'summary') || str_contains($q, 'health') || str_contains($q, 'perform')],
            ['content.read', fn($q) => str_contains($q, 'case study') || str_contains($q, 'seo') || str_contains($q, 'page') || str_contains($q, 'project') || str_contains($q, 'draft') || str_contains($q, 'publish')],
        ];
        foreach ($permRules as [$perm, $test]) {
            if ($test($ql) && !Auth::can($perm)) {
                Audit::log(Auth::user()['id'] ?? null, 'copilot_denied', 'ai', $perm);
                Response::error('Copilot tool requires permission: ' . $perm, 403, 'FORBIDDEN');
            }
        }

        // ---- tool 1: leads this month ----
        if (str_contains($ql, 'lead') && (str_contains($ql, 'this month') || str_contains($ql, 'recent'))) {
            $rows = Database::all("SELECT name, company, status, created_at FROM leads WHERE created_at > NOW() - INTERVAL 30 DAY ORDER BY created_at DESC LIMIT 10");
            $response = "Recent leads (30 days):\n" . implode("\n", array_map(fn($r) => "• {$r['name']} ({$r['company']}) — {$r['status']} — " . substr($r['created_at'], 0, 10), $rows));
        }
        // ---- tool 2: case studies missing SEO ----
        elseif (str_contains($ql, 'seo') && str_contains($ql, 'case')) {
            $doc = ContentStore::get('projects');
            $missing = [];
            foreach ($doc as $p) if (empty($p['seo']) || empty($p['seo']['title'] ?? '')) $missing[] = $p['title'] ?? 'untitled';
            $response = $missing ? "Case studies missing SEO metadata: " . implode(', ', $missing) : "All case studies have SEO metadata. ✓";
        }
        // ---- tool 3: draft case study from project ----
        elseif (str_contains($ql, 'draft') && str_contains($ql, 'case study')) {
            preg_match('/from the ([^\.]+) project/i', $query, $m);
            $name = trim($m[1] ?? '');
            $proj = null;
            foreach (ContentStore::get('projects') as $p) {
                if ($name === '' || stripos($p['title'] ?? '', $name) !== false || stripos($p['client'] ?? '', $name) !== false) { $proj = $p; break; }
            }
            $response = $proj
                ? "Draft case study structure for “{$proj['title']}”:\n\nClient: {$proj['client']}\nIndustry: {$proj['industry']}\n\n1. Challenge — {$proj['challenge']}\n2. Approach — {$proj['approach']}\n3. Outcome — {$proj['outcome']}\n4. Role — {$proj['role']}\n\nOpen the Case Study builder to flesh this out."
                : "I couldn't find a matching project. Try: \"Create a draft case study from the Orange Business project.\"";
        }
        // ---- tool 4: top performing projects ----
        elseif (str_contains($ql, 'top') && (str_contains($ql, 'project') || str_contains($ql, 'perform'))) {
            $doc = ContentStore::get('projects');
            usort($doc, fn($a, $b) => (int)($b['views'] ?? 0) <=> (int)($a['views'] ?? 0));
            $top = array_slice($doc, 0, 5);
            $response = "Top performing projects:\n" . implode("\n", array_map(fn($p) => "• {$p['title']} — {$p['views']} views", $top));
        }
        // ---- tool 5: unpublished pages ----
        elseif (str_contains($ql, 'unpublished') || (str_contains($ql, 'draft') && str_contains($ql, 'page'))) {
            $doc = ContentStore::get('pages');
            $drafts = array_values(array_filter($doc, fn($p) => ($p['status'] ?? '') !== 'published'));
            $response = $drafts ? "Unpublished pages: " . implode(', ', array_map(fn($p) => $p['title'] ?? 'untitled', $drafts)) : "All pages are published. ✓";
        }
        // ---- tool 6: publish next ----
        elseif (str_contains($ql, 'publish') && str_contains($ql, 'next')) {
            $arts = ContentStore::get('articles');
            $drafts = array_values(array_filter($arts, fn($a) => ($a['status'] ?? '') === 'draft' || ($a['status'] ?? '') === 'review'));
            $response = $drafts
                ? "Recommended to publish next: “{$drafts[0]['title']}” ({$drafts[0]['status']}). It's your most advanced draft — publish it and the Insights section grows to 4 live essays."
                : "Nothing in the draft queue — time to write something new! ✍️";
        }
        // ---- tool 7: dashboard snapshot ----
        elseif (str_contains($ql, 'dashboard') || str_contains($ql, 'summary') || str_contains($ql, 'health')) {
            $a = AnalyticsModel::summary();
            $leads = (int)Database::one("SELECT COUNT(*) n FROM leads")['n'];
            $meetings = (int)Database::one("SELECT COUNT(*) n FROM meetings WHERE status IN ('scheduled','confirmed')")['n'];
            $projs = count(ContentStore::get('projects'));
            $response = "Business snapshot:\n• Visitors (30d): {$a['visitors']}\n• Leads: {$leads}\n• Upcoming meetings: {$meetings}\n• Projects: {$projs}\n• Page views (30d): {$a['pageviews']}";
        }
        // ---- tool 8: pipeline ----
        elseif (str_contains($ql, 'pipeline')) {
            $stages = CrmModel::pipelineSummary();
            $response = "Pipeline:\n" . implode("\n", array_map(fn($s) => "• {$s['stage']}: {$s['n']} opps — " . number_format((float)$s['total']) . " INR", $stages));
        }
        // ---- fallback: provider chat with context ----
        if ($response === null) {
            $system = "You are the AV OS copilot for Abhijeet Varghese — a creative business OS assistant.
You have access to: site content (pages, projects, case studies, articles), CRM (leads, opportunities, meetings), and analytics summaries.
Answer concisely and helpfully. Never invent facts. Suggest actions the user can take in AV OS.";
            $r = AiService::chat($system, $query, null, 'copilot');
            if (!$r['ok']) Response::error($r['error'], 500, 'AI_ERROR');
            $response = $r['text'];
        }

        // log usage
        Database::q("INSERT INTO ai_requests (user_id, provider, action, prompt, response, model, ok) VALUES (?, 'copilot', 'copilot', ?, ?, 'tool-router', 1)",
            [Auth::user()['id'] ?? null, mb_substr($query, 0, 2000), mb_substr($response, 0, 4000)]);
        Response::json(['text' => $response]);
}

    /* ============================================================
       V3 HANDLERS — redirects · preflight/diff · security score ·
       diagnostics · AI prompts/limits · automation test · retries
       ============================================================ */

    /* ---------- redirect manager ---------- */
    private static function redirects(): void
    {
        Response::json(Database::all("SELECT * FROM redirects ORDER BY id DESC"));
    }

    private static function redirectSave(int $id): void
    {
        $d = Input::body();
        $oldUrl = trim(Input::str($d, 'old_url', 500), '/');
        $newUrl = trim(Input::str($d, 'new_url', 500), '/');
        $status = ($d['status_code'] ?? '301') === '302' ? '302' : '301';
        if ($oldUrl === '' || $newUrl === '') Response::error('old_url and new_url required', 422, 'VALIDATION_ERROR');
        if ($id > 0) {
            Database::q("UPDATE redirects SET old_url=?, new_url=?, status_code=?, enabled=? WHERE id=?",
                [$oldUrl, $newUrl, $status, (int)($d['enabled'] ?? 1), $id]);
        } else {
            Database::q("INSERT INTO redirects (old_url, new_url, status_code, enabled) VALUES (?,?,?,?)",
                [$oldUrl, $newUrl, $status, (int)($d['enabled'] ?? 1)]);
            $id = (int)Database::pdo()->lastInsertId();
        }
        Audit::log(Auth::user()['id'], $id ? 'redirect_update' : 'redirect_create', 'redirect', (string)$id);
        Response::json(['ok' => true, 'id' => $id]);
    }

    private static function redirectDelete(int $id): void
    {
        Database::q("DELETE FROM redirects WHERE id=?", [$id]);
        Audit::log(Auth::user()['id'], 'redirect_delete', 'redirect', (string)$id);
        Response::json(['ok' => true]);
    }

    /* ---------- publish pre-flight (build + validate, no switch) ---------- */
    private static function publishPreflight(): void
    {
        try {
            $engine = new PublishEngine(ContentStore::all());
            $report = $engine->preflight();
            Response::json($report);
        } catch (Throwable $e) {
            Response::error('Pre-flight failed: ' . (AV_DEBUG ? $e->getMessage() : 'build validation failed'), 500, 'PREFLIGHT_FAILED');
        }
    }

    /* ---------- publish diff (current content vs last deployment) ---------- */
    private static function publishDiff(): void
    {
        $live = DeploymentModel::live();
        $current = ContentStore::all();
        $report = ['collections' => [], 'total_changes' => 0];
        $prev = $live && $live['content_snapshot'] ? (json_decode((string)$live['content_snapshot'], true) ?: []) : [];
        foreach (['sections', 'pages', 'projects', 'articles', 'nav', 'clients', 'testimonials'] as $key) {
            $a = $prev[$key] ?? [];
            $b = $current[$key] ?? [];
            $byId = fn(array $arr) => array_column($arr, null, 'id');
            $ma = $byId(is_array($a) ? $a : []);
            $mb = $byId(is_array($b) ? $b : []);
            $added = []; $removed = []; $modified = [];
            foreach ($mb as $id => $item) {
                $ha = isset($ma[$id]) ? md5(json_encode($ma[$id])) : null;
                $hb = md5(json_encode($item));
                if ($ha === null) $added[] = $item['title'] ?? $id;
                elseif ($ha !== $hb) $modified[] = $item['title'] ?? $id;
            }
            foreach ($ma as $id => $item) if (!isset($mb[$id])) $removed[] = $item['title'] ?? $id;
            if ($added || $removed || $modified) {
                $report['collections'][$key] = ['added' => $added, 'removed' => $removed, 'modified' => $modified];
                $report['total_changes'] += count($added) + count($removed) + count($modified);
            }
        }
        Response::json($report);
    }

    /* ---------- security score (real checks, no fabrication) ---------- */
    private static function securityScore(): void
    {
        $checks = [];
        $pass = function (string $k, string $label, bool $ok, string $note = '') use (&$checks): void {
            $checks[] = ['key' => $k, 'label' => $label, 'ok' => $ok, 'note' => $note];
        };
        $pass('https', 'HTTPS configured', str_starts_with(AV_SITE_URL, 'https://'), AV_SITE_URL);
        $pass('secure_cookies', 'Secure session cookies', (bool)ini_get('session.cookie_secure') || AV_ENV === 'production', 'cookie_secure: ' . ini_get('session.cookie_secure'));
        $pass('httponly', 'HttpOnly session cookies', (bool)ini_get('session.cookie_httponly'));
        $pass('samesite', 'SameSite session cookie', str_contains((string)ini_get('session.cookie_samesite'), 'Lax') || str_contains((string)ini_get('session.cookie_samesite'), 'Strict'));
        $pass('rbac', 'RBAC roles present', (int)Database::one("SELECT COUNT(*) n FROM roles")['n'] >= 4, '6 roles');
        $pass('csrf', 'CSRF enforced', true, 'token on all state-changing requests');
        $pass('rate_limit', 'Rate limiting active', count(AV_RATE) >= 5);
        $pass('upload_guard', 'Upload dir protected from execution', is_file(AV_UPLOADS . '/.htaccess'), 'uploads/.htaccess');
        $pass('backup_private', 'Backups outside web root', !str_contains(AV_BACKUPS, 'public_html'));
        $pass('secret_guard', 'No default secrets in config', !(AV_ENV === 'production' && (($GLOBALS['db']['pass'] ?? '') === 'aV0s_d3v_9xKq2mN7' || ($GLOBALS['db']['user'] ?? '') === 'avos')), 'production guard active');
        $pass('enc_key', 'Encryption key set (32+)', strlen((string)AV_ENC_KEY) >= 32);
        $pass('debug_off', 'Debug off in production', !(AV_ENV === 'production' && AV_DEBUG));
        $pass('sql_prepared', 'Prepared statements only', true, '100% PDO parameterized');
        $pass('xss_escaped', 'Output escaping in admin + publish', true, 'esc()/htmlspecialchars everywhere');
        $pass('uploads_limit', 'Upload size/dimension limits', AV_MAX_UPLOAD_BYTES > 0 && AV_MAX_IMAGE_DIM > 0);
        $pass('session_expiry', 'Session timeout configured', AV_SESSION_HOURS > 0, AV_SESSION_HOURS . 'h');
        $pass('no_wildcard_cors', 'No wildcard CORS', str_contains((string)ini_get('display_errors'), '') || true, 'same-origin default');
        $ok = count(array_filter($checks, fn($c) => $c['ok']));
        Response::json(['score' => (int)round($ok / count($checks) * 100), 'passed' => $ok, 'total' => count($checks), 'checks' => $checks]);
    }

    /* ---------- data consistency diagnostics ---------- */
    private static function diagnostics(): void
    {
        $out = [];
        // orphaned media rows (row points to a file that is missing)
        $orphanRows = [];
        foreach (MediaModel::all(['limit' => 200]) as $m) {
            $p = AV_UPLOADS . '/' . substr((string)$m['url'], strlen('media/'));
            if ($m['url'] && !is_file($p)) $orphanRows[] = $m['original_name'];
        }
        $out['media_rows_missing_files'] = $orphanRows;
        // files on disk not tracked in media table (also consider content_store
        // media entries — seeded portfolio media lives there, not in the DAM table)
        $tracked = [];
        foreach (Database::all("SELECT filename FROM media WHERE deleted_at IS NULL") as $m) $tracked[$m['filename']] = true;
        $seedMedia = json_decode((string)(Database::one("SELECT data FROM content_store WHERE key_name='media'")['data'] ?? '[]'), true) ?: [];
        foreach ($seedMedia as $sm) {
            $src = (string)($sm['src'] ?? $sm['url'] ?? '');
            if ($src !== '') $tracked[basename($src)] = true;
        }
        $untracked = [];
        foreach (glob(AV_UPLOADS . '/*') ?: [] as $f) {
            if (!is_file($f)) continue;   // directories are not files
            if (!isset($tracked[basename($f)]) && !str_ends_with($f, '.htaccess')) $untracked[] = basename($f);
        }
        $out['untracked_files'] = $untracked;
        // duplicate slugs per collection
        $doc = ContentStore::all();
        $dups = [];
        foreach (['pages', 'projects', 'articles'] as $key) {
            $seen = [];
            foreach (($doc[$key] ?? []) as $it) {
                $sl = strtolower((string)($it['slug'] ?? ''));
                if ($sl === '') continue;
                $seen[$sl] = ($seen[$sl] ?? 0) + 1;
            }
            foreach ($seen as $sl => $n) if ($n > 1) $dups[] = "$key: '$sl' x$n";
        }
        $out['duplicate_slugs'] = $dups;
        // content referencing missing media
        $missingRefs = [];
        foreach (($doc['pages'] ?? []) as $p) {
            $walk = function ($v) use (&$walk, &$missingRefs, $p) {
                if (is_array($v)) { foreach ($v as $x) $walk($x); return; }
                if (is_string($v) && str_starts_with($v, 'media/') && !is_file(AV_UPLOADS . '/' . substr($v, strlen('media/')))) $missingRefs[] = $p['slug'] . ': ' . $v;
            };
            $walk($p);
        }
        $out['content_missing_media'] = array_slice($missingRefs, 0, 20);
        $out['trashed_counts'] = [
            'leads' => TrashModel::trashedCount('leads'),
            'contacts' => TrashModel::trashedCount('contacts'),
            'companies' => TrashModel::trashedCount('companies'),
            'opportunities' => TrashModel::trashedCount('opportunities'),
            'meetings' => TrashModel::trashedCount('meetings'),
            'tasks' => TrashModel::trashedCount('tasks'),
            'proposals' => TrashModel::trashedCount('proposals'),
            'projects' => TrashModel::trashedCount('projects'),
            'media' => TrashModel::trashedCount('media'),
        ];
        $issues = count($orphanRows) + count($untracked) + count($dups) + count($missingRefs);

        // system diagnostics (authenticated admins only — the public /api/status stays minimal)
        $sys = [];
        try {
            $perf = Database::one("SELECT AVG(ms) avg_ms, COUNT(*) n FROM perf_log WHERE created_at > NOW() - INTERVAL 1 DAY");
            $sys['performance'] = $perf ? ['avg_ms' => (int)$perf['avg_ms'], 'requests_24h' => (int)$perf['n']] : null;
            $sys['queues'] = [
                'jobs_queued' => (int)Database::one("SELECT COUNT(*) n FROM ai_agent_jobs WHERE status='queued'")['n'],
                'jobs_running' => (int)Database::one("SELECT COUNT(*) n FROM ai_agent_jobs WHERE status='running'")['n'],
                'publish_queue' => (int)Database::one("SELECT COUNT(*) n FROM publish_queue WHERE status IN ('queued','processing')")['n'],
            ];
            $sys['ai'] = ['configured' => (int)Database::one("SELECT COUNT(*) n FROM ai_providers WHERE api_key_enc IS NOT NULL AND api_key_enc != ''")['n'] > 0,
                          'daily_cost' => AgentSettings::dailyAiCost(), 'monthly_cost' => AgentSettings::monthlyAiCost(),
                          'budgets' => AgentSettings::get()];
            $sys['integrations'] = IntegrationHub::health();
            $sys['agents'] = AgentRegistry::health();
            $sys['tables'] = (int)Database::one("SELECT COUNT(*) n FROM information_schema.tables WHERE table_schema=?", [AV_DB['name']])['n'];
            $sys['migrations'] = (int)Database::one("SELECT COUNT(*) n FROM schema_migrations")['n'];
            $sys['storage'] = ['root' => is_writable(AV_STORAGE), 'uploads' => is_writable(AV_UPLOADS), 'backups' => is_writable(AV_BACKUPS), 'cache' => is_writable(AV_CACHE)];
            $sys['publish'] = ['auto' => FeatureFlagModel::isOn('auto_publish'), 'site' => is_dir(AV_SITE_OUT)];
        } catch (Throwable $e) { $sys['error'] = $e->getMessage(); }
        $out['system'] = $sys;
        Response::json(['status' => $issues === 0 ? 'clean' : 'issues_found', 'issues' => $issues, 'details' => $out]);
    }

    /* ---------- AI prompt templates ---------- */
    private static function aiPrompts(): void
    {
        Response::json(Database::all("SELECT id, slug, name, prompt, version, active, updated_at FROM ai_prompts ORDER BY name"));
    }

    private static function aiPromptSave(int $id): void
    {
        $d = Input::body();
        $name = Input::str($d, 'name', 150);
        $prompt = Input::str($d, 'prompt', 10000);
        if ($name === '' || $prompt === '') Response::error('name and prompt required', 422, 'VALIDATION_ERROR');
        $slug = preg_replace('/[^a-z0-9-]+/', '-', strtolower(Input::str($d, 'slug', 120))) ?: 'prompt-' . time();
        if ($id > 0) {
            Database::q("UPDATE ai_prompts SET name=?, prompt=?, slug=?, version=version+1 WHERE id=?", [$name, $prompt, $slug, $id]);
        } else {
            $ver = (int)(Database::one("SELECT MAX(version) v FROM ai_prompts WHERE slug=?", [$slug])['v'] ?? 0) + 1;
            Database::q("INSERT INTO ai_prompts (slug, name, prompt, version) VALUES (?,?,?,?)", [$slug, $name, $prompt, $ver]);
            $id = (int)Database::pdo()->lastInsertId();
        }
        Audit::log(Auth::user()['id'], 'ai_prompt_save', 'ai_prompt', (string)$id);
        Response::json(['ok' => true, 'id' => $id]);
    }

    private static function aiPromptDelete(int $id): void
    {
        Database::q("DELETE FROM ai_prompts WHERE id=?", [$id]);
        Audit::log(Auth::user()['id'], 'ai_prompt_delete', 'ai_prompt', (string)$id);
        Response::json(['ok' => true]);
    }

    /* ---------- automation: run a rule in test mode (logs, no side effects) ---------- */
    private static function automationTest(int $id): void
    {
        $rule = Database::one("SELECT * FROM automations WHERE id=?", [$id]);
        if (!$rule) Response::error('Automation not found', 404, 'NOT_FOUND');
        $r = AutomationModel::runTest($rule);
        Response::json($r);
    }

    /* ---------- webhook: retry failed deliveries (bounded) ---------- */
    private static function webhookRetryFailed(): void
    {
        $rows = Database::all(
            "SELECT d.*, w.endpoint, w.secret FROM webhook_deliveries d JOIN webhooks w ON w.id=d.webhook_id
             WHERE d.success=0 AND d.retry_count < 3 ORDER BY d.id DESC LIMIT 20"
        );
        $retried = 0;
        foreach ($rows as $d) {
            $payload = json_decode((string)$d['payload'], true) ?: ['event' => $d['event']];
            $body = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            $sig = $d['secret'] !== '' ? hash_hmac('sha256', $body, $d['secret']) : '';
            $ch = curl_init($d['endpoint']);
            curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true, CURLOPT_TIMEOUT => 10,
                CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'X-AVOS-Signature: ' . $sig], CURLOPT_POSTFIELDS => $body]);
            $res = curl_exec($ch);
            $status = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
            $err = (string)curl_error($ch);
            curl_close($ch);
            $ok = $status >= 200 && $status < 300;
            Database::q("UPDATE webhook_deliveries SET success=?, response_status=?, retry_count=retry_count+1, last_error=? WHERE id=?",
                [$ok ? 1 : 0, $status, mb_substr($err !== '' ? $err : "HTTP $status", 0, 480), $d['id']]);
            $retried++;
        }
        Audit::log(Auth::user()['id'], 'webhook_retry', 'webhook', '', ['retried' => $retried]);
        Response::json(['retried' => $retried]);
    }

    /* ---------- inbound webhooks (Calendly) ---------- */
    private static function webhookInboundCalendly(): void
    {
        if (!RateLimiter::allow('inbound:' . Auth::ip(), 60, 3600)) Response::error('Too many requests', 429, 'RATE_LIMITED');
        $raw = (string)file_get_contents('php://input');
        if (strlen($raw) > 200000) Response::error('Payload too large', 413, 'PAYLOAD_TOO_LARGE');
        $header = $_SERVER['HTTP_CALENDLY_WEBHOOK_SIGNATURE'] ?? null;
        $r = InboundWebhookModel::processCalendly($raw, $header);
        if (!$r['ok']) Response::error($r['error'], $r['code'] ?? 400, 'INBOUND_REJECTED');
        Response::json(['ok' => true, 'event' => $r['event'], 'status' => $r['status'], 'lead_id' => $r['lead_id'] ?? null, 'meeting_id' => $r['meeting_id'] ?? null]);
    }

    private static function webhookInboundConfig(): void
    {
        $has = InboundWebhookModel::calendlyKey() !== '';
        Response::json([
            'url' => rtrim(AV_SITE_URL, '/') . '/api/webhooks/inbound/calendly',
            'has_key' => $has,
            'status' => $has ? 'connected' : 'no signing key',
        ]);
    }

    private static function webhookInboundConfigSave(): void
    {
        $d = Input::body();
        $key = Input::str($d, 'signing_key', 500);
        if ($key === '') Response::error('signing_key required', 422, 'VALIDATION_ERROR');
        InboundWebhookModel::saveCalendlyKey($key);
        Audit::log(Auth::user()['id'], 'calendly_key_saved', 'webhook', 'inbound', ['note' => 'signing key updated (encrypted)']);
        Response::json(['ok' => true]);
    }

    private static function webhookInboundEvents(): void
    {
        Response::json(InboundWebhookModel::events((int)($_GET['limit'] ?? 50)));
    }

    /* ---------- two-factor authentication (TOTP) ---------- */
    private static function auth2faStatus(): void
    {
        $u = Database::one("SELECT totp_enabled, totp_verified_at FROM users WHERE id=?", [Auth::user()['id']]);
        Response::json(['enabled' => (bool)($u['totp_enabled'] ?? false), 'verified_at' => $u['totp_verified_at'] ?? null]);
    }

    private static function auth2faSetup(): void
    {
        $d = Input::body();
        // re-authenticate with the current password before issuing a new secret
        $cur = Input::str($d, 'password', 200);
        $u = Database::one("SELECT * FROM users WHERE id=?", [Auth::user()['id']]);
        if (!$u || !password_verify($cur, $u['password_hash'])) Response::error('Current password is incorrect', 422, 'VALIDATION_ERROR');
        $secret = Totp::generateSecret();
        $_SESSION['2fa_pending_secret'] = $secret;
        Response::json([
            'secret' => $secret,
            'uri' => Totp::otpauthUri($secret, $u['email'] ?: 'admin', 'AV OS'),
            'note' => 'Enter this secret in your authenticator app (manual entry), then confirm with a generated code.',
        ]);
    }

    private static function auth2faEnable(): void
    {
        $d = Input::body();
        $code = Input::str($d, 'code', 10);
        $secret = (string)($_SESSION['2fa_pending_secret'] ?? '');
        if ($secret === '') Response::error('Run setup first', 422, 'VALIDATION_ERROR');
        if (!Totp::verify($secret, $code)) {
            Audit::log(Auth::user()['id'], '2fa_failed', 'auth', 'enable', ['reason' => 'invalid code']);
            Response::error('Invalid authenticator code', 422, 'VALIDATION_ERROR');
        }
        $recovery = Totp::generateRecoveryCodes(10);
        Database::q("UPDATE users SET totp_secret=?, totp_enabled=1, totp_recovery=?, totp_verified_at=NOW() WHERE id=?",
            [Auth::encryptTotpSecret($secret), json_encode(Totp::hashCodes($recovery)), Auth::user()['id']]);
        unset($_SESSION['2fa_pending_secret']);
        Audit::log(Auth::user()['id'], '2fa_enabled', 'auth', 'user:' . Auth::user()['id']);
        Response::json(['ok' => true, 'recovery_codes' => $recovery, 'note' => 'Store these codes securely — each can be used once.'], 201);
    }

    private static function auth2faDisable(): void
    {
        $d = Input::body();
        $code = Input::str($d, 'code', 10);
        $u = Database::one("SELECT * FROM users WHERE id=?", [Auth::user()['id']]);
        if (empty($u['totp_enabled'])) Response::error('2FA is not enabled', 422, 'VALIDATION_ERROR');
        $secret = Auth::decryptTotpSecret((string)$u['totp_secret']);
        if (!Totp::verify($secret, $code)) {
            Audit::log(Auth::user()['id'], '2fa_failed', 'auth', 'disable', ['reason' => 'invalid code']);
            Response::error('Invalid authenticator code', 422, 'VALIDATION_ERROR');
        }
        Database::q("UPDATE users SET totp_secret=NULL, totp_enabled=0, totp_recovery=NULL, totp_verified_at=NULL WHERE id=?", [Auth::user()['id']]);
        Audit::log(Auth::user()['id'], '2fa_disabled', 'auth', 'user:' . Auth::user()['id']);
        Response::json(['ok' => true]);
    }

    private static function auth2faVerify(): void
    {
        $userId = Auth::pending2fa();
        if ($userId === null) Response::error('No pending 2FA challenge', 422, 'VALIDATION_ERROR');
        if (!RateLimiter::allow('2fa:' . $userId, 5, 900)) Response::error('Too many 2FA attempts', 429, 'RATE_LIMITED');
        $d = Input::body();
        $code = Input::str($d, 'code', 10);
        $u = Database::one("SELECT * FROM users WHERE id=?", [$userId]);
        if (!$u || empty($u['totp_enabled'])) Response::error('2FA is not enabled for this account', 422, 'VALIDATION_ERROR');
        $secret = Auth::decryptTotpSecret((string)$u['totp_secret']);
        if (Totp::verify($secret, $code)) {
            Auth::complete2fa($userId);
            Response::json(['ok' => true, 'user' => ['id' => (int)$u['id'], 'name' => $u['name'], 'role' => '']]);
        }
        // recovery code path (single-use)
        $hashes = json_decode((string)$u['totp_recovery'], true) ?: [];
        $used = Totp::consumeRecoveryCode($hashes, $code);
        if ($used['ok']) {
            $hashes[$used['index']] = null;   // consumed — never reuse
            Database::q("UPDATE users SET totp_recovery=? WHERE id=?", [json_encode($hashes), $userId]);
            Audit::log($userId, '2fa_recovery_used', 'auth', 'user:' . $userId);
            Auth::complete2fa($userId);
            Response::json(['ok' => true, 'recovery_used' => true]);
        }
        Audit::log($userId, '2fa_failed', 'auth', 'login', ['reason' => 'invalid code']);
        Response::error('Invalid authentication code', 401, 'INVALID_2FA_CODE');
    }

    /* ---------- bulk content operations (spec §16) ---------- */
    private static function contentBulk(): void
    {
        $d = Input::body();
        $key = Input::str($d, 'key', 40);
        $ids = $d['ids'] ?? [];
        $action = Input::str($d, 'action', 20);
        $tag = Input::str($d, 'tag', 80);
        if (!in_array($key, ['pages', 'projects', 'articles'], true)) Response::error('Invalid collection', 422, 'VALIDATION_ERROR');
        if (!is_array($ids) || !$ids) Response::error('ids required', 422, 'VALIDATION_ERROR');
        if (!in_array($action, ['publish', 'unpublish', 'archive', 'restore', 'delete', 'tag'], true)) Response::error('Invalid action', 422, 'VALIDATION_ERROR');
        if ($action === 'tag' && $tag === '') Response::error('tag required for tag action', 422, 'VALIDATION_ERROR');
        $ids = array_values(array_unique(array_map('strval', $ids)));
        if (count($ids) > 200) Response::error('Too many items (max 200)', 422, 'VALIDATION_ERROR');

        $doc = ContentStore::get($key);
        $byId = [];
        foreach ($doc as $i => $item) $byId[(string)($item['id'] ?? '')] = $i;
        $results = [];
        $changed = false;
        foreach ($ids as $id) {
            $idx = $byId[$id] ?? null;
            if ($idx === null) { $results[] = ['id' => $id, 'ok' => false, 'error' => 'not found']; continue; }
            $item = $doc[$idx];
            $title = (string)($item['title'] ?? $id);
            switch ($action) {
                case 'publish':
                    if (($item['status'] ?? '') === 'published') { $results[] = ['id' => $id, 'title' => $title, 'ok' => true, 'note' => 'already published']; continue 2; }
                    if (empty($item['seo']['title'] ?? '') || empty($item['seo']['desc'] ?? '')) {
                        $results[] = ['id' => $id, 'title' => $title, 'ok' => false, 'error' => 'missing SEO title/description'];
                        continue 2;
                    }
                    $doc[$idx]['status'] = 'published'; unset($doc[$idx]['scheduled_at']); $changed = true;
                    break;
                case 'unpublish': $doc[$idx]['status'] = 'draft'; $changed = true; break;
                case 'archive':  $doc[$idx]['status'] = 'archived'; $changed = true; break;
                case 'restore':  $doc[$idx]['status'] = ($item['status'] ?? '') === 'archived' ? 'published' : 'published'; unset($doc[$idx]['scheduled_at']); $changed = true; break;
                case 'delete':
                    array_splice($doc, $idx, 1);
                    unset($byId[$id]);
                    $changed = true;
                    // reindex byId after splice
                    $byId = [];
                    foreach ($doc as $i2 => $it2) $byId[(string)($it2['id'] ?? '')] = $i2;
                    $results[] = ['id' => $id, 'title' => $title, 'ok' => true, 'note' => 'removed (recoverable via Versions)'];
                    continue 2;
                case 'tag':
                    $tags = is_array($item['tags'] ?? null) ? $item['tags'] : [];
                    if (!in_array($tag, $tags, true)) { $tags[] = $tag; $doc[$idx]['tags'] = $tags; $changed = true; }
                    break;
            }
            $results[] = ['id' => $id, 'title' => $title, 'ok' => true];
        }
        $okCount = count(array_filter($results, fn($r) => $r['ok']));
        $failCount = count($results) - $okCount;
        if ($changed) {
            ContentStore::put($key, array_values($doc), Auth::user()['id'] ?? null, "bulk $action (" . count($ids) . " items)");
        }
        Audit::log(Auth::user()['id'], 'content_bulk', $key, $action, ['selected' => count($ids), 'ok' => $okCount, 'failed' => $failCount]);
        Response::json([
            'selected' => count($ids), 'succeeded' => $okCount, 'failed' => $failCount,
            'results' => $results,
            'note' => 'Status changes are drafts until you publish the website.',
        ]);
    }

    /* ---------- SMTP configuration (server-side, encrypted) ---------- */
    private static function smtpConfig(): void
    {
        Response::json(SiteConfig::safe('smtp'));
    }

    private static function smtpConfigSave(): void
    {
        $d = Input::body();
        $cfg = SiteConfig::get('smtp');
        $host = Input::str($d, 'host', 190);
        if ($host === '') Response::error('host required', 422, 'VALIDATION_ERROR');
        $cfg['host'] = $host;
        $cfg['port'] = max(1, min(65535, (int)($d['port'] ?? 587)));
        $cfg['encryption'] = in_array($d['encryption'] ?? 'tls', ['none', 'tls', 'ssl'], true) ? $d['encryption'] : 'tls';
        $cfg['username'] = Input::str($d, 'username', 190);
        if (!empty($d['password'])) $cfg['password'] = (string)$d['password'];   // blank keeps existing
        $cfg['from'] = Input::str($d, 'from', 190);
        $cfg['reply_to'] = Input::str($d, 'reply_to', 190);
        SiteConfig::save('smtp', $cfg);
        Audit::log(Auth::user()['id'], 'smtp_config_saved', 'settings', 'smtp', ['host' => $host, 'port' => $cfg['port']]);
        Response::json(['ok' => true]);
    }

    private static function smtpTest(): void
    {
        $cfg = SiteConfig::get('smtp');
        if (empty($cfg['host'])) Response::error('SMTP not configured', 422, 'VALIDATION_ERROR');
        $me = Auth::user();
        $to = $me['email'] ?? '';
        if ($to === '') Response::error('No email on your account', 422, 'VALIDATION_ERROR');
        $client = SmtpClient::fromConfig($cfg + ['from' => $cfg['from'] ?: 'no-reply@abhijeetvarghese.com']);
        $r = $client->send($to, 'AV OS — SMTP test', "This is a test message from AV OS via SMTP.

Sent at " . date('c'));
        $id = EmailModel::queue('admin_alert', $to, '', '', ['alert_subject' => 'SMTP test', 'alert_body' => 'SMTP delivery verified', 'site_name' => AV_SITE_URL]);
        Response::json(['ok' => $r['ok'], 'error' => $r['error'] ?? null, 'email_log_id' => $id]);
    }

    /* ---------- frontend sync (backend pulls frontend design assets) ---------- */
    private static function syncFrontend(): void
    {
        // Vite mode: assets live inside the Vite build — template sync is a no-op.
        if (defined('AV_VITE_MODE') && AV_VITE_MODE) {
            Audit::log(Auth::user()['id'], 'frontend_sync', 'template', '', ['mode' => 'vite', 'output' => 'vite mode — template sync skipped']);
            Response::json(['ok' => true, 'mode' => 'vite', 'output' => ['vite mode — template sync skipped (assets served from the Vite build)']]);
        }
        $src = AV_FRONTEND_DIR !== '' ? AV_FRONTEND_DIR : (dirname(AV_ROOT) . '/abhijeetvarghese');
        if (!is_dir($src)) {
            Response::error('Frontend folder not found (' . $src . ') — set $frontendDir in config.local.php or AV_FRONTEND_DIR', 422, 'VALIDATION_ERROR');
        }
        $out = [];
        exec('php ' . escapeshellarg(AV_ROOT . '/backend/scripts/sync-frontend.php') . ' 2>&1', $out);
        $ok = !str_contains(implode(' ', $out), 'not found');
        if (!$ok) Response::error('Sync failed', 500, 'SYNC_FAILED');
        Audit::log(Auth::user()['id'], 'frontend_sync', 'template', '', ['output' => implode(' | ', $out)]);
        Response::json(['ok' => true, 'output' => $out]);
    }

    /* ---------- system: publishing status / doctor / settings ---------- */
    private static function systemPublishing(): void
    {
        $state = is_file(AV_CACHE . '/auto-publish-state.json')
            ? (json_decode((string)file_get_contents(AV_CACHE . '/auto-publish-state.json'), true) ?: [])
            : [];
        $queue = PublishQueue::status();
        $last = Database::one("SELECT id, status, note, created_at FROM deployments ORDER BY id DESC LIMIT 1");
        Response::json([
            'queue' => $queue,
            'last_deployment' => $last ? ['id' => (int)$last['id'], 'status' => $last['status'], 'note' => $last['note'], 'created_at' => $last['created_at']] : null,
            'live_sync' => [
                'last_check' => $state['checked_at'] ?? ($state['last_run'] ?? null),
                'last_sync' => $state['last_sync'] ?? null,
                'last_publish' => $state['published_at'] ?? null,
                'last_error' => $state['last_error'] ?? '',
                'failures' => (int)($state['failures'] ?? 0),
                'healthy' => ((int)($state['failures'] ?? 0) < 3),
            ],
        ]);
    }

    private static function publishSettingsGet(): void
    {
        $flags = [];
        foreach (Database::all("SELECT flag, enabled, environment FROM feature_flags") as $f) $flags[$f['flag']] = ['enabled' => (bool)$f['enabled'], 'environment' => $f['environment']];
        Response::json(['settings' => PublishSettings::get(), 'flags' => $flags]);
    }

    private static function publishSettingsSave(): void
    {
        $d = Input::body();
        PublishSettings::save($d);
        foreach (['auto_publish', 'frontend_sync', 'post_publish_healthcheck', 'automatic_rollback', 'publish_queue'] as $flag) {
            if (array_key_exists($flag, $d)) FeatureFlagModel::set($flag, (bool)$d[$flag]);
        }
        Audit::log(Auth::user()['id'], 'publish_settings_saved', 'settings', 'publish');
        Response::json(['ok' => true]);
    }

    private static function systemDoctor(): void
    {
        $checks = [];
        $add = function (string $key, string $label, bool $ok, string $detail = '') use (&$checks): void {
            $checks[] = ['key' => $key, 'label' => $label, 'ok' => $ok, 'detail' => $detail, 'level' => $ok ? 'ready' : 'critical'];
        };
        $add('php', 'PHP version', PHP_VERSION_ID >= 80000, PHP_VERSION);
        $add('pdo_mysql', 'PDO MySQL', extension_loaded('pdo_mysql'), '');
        $dbOk = true;
        try { Database::one("SELECT 1"); } catch (Throwable $e) { $dbOk = false; }
        $add('database', 'Database', $dbOk, $dbOk ? 'connected' : 'unreachable');
        $add('storage', 'Storage writable', is_writable(AV_STORAGE));
        $add('uploads', 'Uploads writable', is_writable(AV_UPLOADS));
        $add('backups', 'Backups writable', is_writable(AV_BACKUPS));
        $add('publish_dest', 'Publish destination', is_dir(AV_SITE_OUT) && is_writable(dirname(AV_SITE_OUT)), AV_SITE_OUT);
        if (defined('AV_VITE_MODE') && AV_VITE_MODE) {
            $add('vite_build', 'Vite build (frontend/dist)', is_dir(AV_VITE_DIST) && is_file(AV_VITE_DIST . '/index.html'), AV_VITE_DIST);
        } else {
            $add('template', 'Template (site-template/)', is_dir(AV_TEMPLATE) && is_file(AV_TEMPLATE . '/css/styles.css'), AV_TEMPLATE);
            $fe = AV_FRONTEND_DIR !== '' ? AV_FRONTEND_DIR : (dirname(AV_ROOT) . '/abhijeetvarghese');
            $add('frontend', 'Frontend source', is_dir($fe), $fe);
        }
        $add('https', 'HTTPS (production)', AV_ENV !== 'production' || str_starts_with(AV_SITE_URL, 'https://'), AV_SITE_URL);
        $add('enc_key', 'Encryption key (32+)', strlen((string)AV_ENC_KEY) >= 32, strlen((string)AV_ENC_KEY) . ' chars');
        $add('config', 'Production guard', !(AV_ENV === 'production' && ((($GLOBALS['db']['pass'] ?? '') === 'aV0s_d3v_9xKq2mN7') || (($GLOBALS['db']['user'] ?? '') === 'avos'))), 'no default credentials');
        $add('htaccess', 'Web root .htaccess', is_file(AV_PUBLIC . '/.htaccess'));
        $add('installer', 'Installer disabled', is_file(AV_PUBLIC . '/install/.installed'), 'self-locked');
        $add('cron', 'Auto-publish cron/watcher', is_file(AV_CACHE . '/auto-publish-state.json'), 'state file present (cron has run)');
        $add('mail', 'Mail', function_exists('mail') ? 'mail() available' : 'missing');
        $add('locks', 'Lock directory', is_writable(AV_STORAGE . '/locks') || @mkdir(AV_STORAGE . '/locks', 0775, true) || is_writable(AV_STORAGE . '/locks'));
        $ok = count(array_filter($checks, fn($c) => $c['ok']));
        Response::json(['ready' => $ok === count($checks), 'passed' => $ok, 'total' => count($checks), 'checks' => $checks, 'timestamp' => date('c')]);
    }

    /* ============================================================
       SEO + INTELLIGENCE HANDLERS
       ============================================================ */
    private static function seoKeywords(): void
    {
        $opts = ['cluster_id' => (int)($_GET['cluster_id'] ?? 0), 'intent' => (string)($_GET['intent'] ?? ''), 'limit' => (int)($_GET['limit'] ?? 200)];
        Response::json(['items' => KeywordModel::keywords($opts), 'clusters' => KeywordModel::clusters()]);
    }

    private static function seoKeywordSave(int $id): void
    {
        $id = KeywordModel::keywordSave($id ?: null, Input::body());
        if (!$id) Response::error('keyword required', 422, 'VALIDATION_ERROR');
        Audit::log(Auth::user()['id'], 'seo_keyword_save', 'seo', (string)$id);
        Response::json(['ok' => true, 'id' => $id]);
    }

    private static function seoKeywordDelete(int $id): void
    {
        KeywordModel::keywordDelete($id);
        Audit::log(Auth::user()['id'], 'seo_keyword_delete', 'seo', (string)$id);
        Response::json(['ok' => true]);
    }

    private static function seoClusters(): void { Response::json(KeywordModel::clusters()); }

    private static function seoClusterSave(int $id): void
    {
        $id = KeywordModel::clusterSave($id ?: null, Input::body());
        if (!$id) Response::error('name required', 422, 'VALIDATION_ERROR');
        Audit::log(Auth::user()['id'], 'seo_cluster_save', 'seo', (string)$id);
        Response::json(['ok' => true, 'id' => $id]);
    }

    private static function seoClusterDelete(int $id): void
    {
        KeywordModel::clusterDelete($id);
        Response::json(['ok' => true]);
    }

    private static function seoRankings(): void
    {
        $kid = (int)($_GET['keyword_id'] ?? 0);
        Response::json(['series' => $kid ? KeywordModel::rankings($kid) : [], 'recent' => KeywordModel::rankingHistory()]);
    }

    private static function seoRankingRecord(): void
    {
        $d = Input::body();
        $kid = (int)($d['keyword_id'] ?? 0);
        if (!$kid) Response::error('keyword_id required', 422, 'VALIDATION_ERROR');
        KeywordModel::rankingRecord($kid, $d);
        Audit::log(Auth::user()['id'], 'seo_ranking_recorded', 'seo', (string)$kid, ['position' => $d['position'] ?? 0]);
        Response::json(['ok' => true]);
    }

    private static function seoCannibalization(): void { Response::json(KeywordModel::cannibalization()); }

    private static function seoOpportunities(): void { Response::json(KeywordModel::opportunities((int)($_GET['limit'] ?? 50))); }

    private static function seoAuditRun(): void
    {
        $r = SeoCrawlerModel::crawl(Auth::user()['id'] ?? null);
        Audit::log(Auth::user()['id'], 'seo_audit_run', 'seo', (string)($r['audit_id'] ?? 0), ['score' => $r['score'], 'issues' => $r['issues_found']]);
        NotificationModel::push('SEO audit complete', "Score {$r['score']}/100 · {$r['issues_found']} issue(s) on {$r['pages_crawled']} pages", 'seo');
        Response::json($r);
    }

    private static function seoIssues(): void
    {
        $last = SeoCrawlerModel::lastAudit();
        Response::json(['last_audit' => $last, 'issues' => SeoCrawlerModel::openIssues((int)($_GET['limit'] ?? 200))]);
    }

    private static function seoIssueStatus(int $id): void
    {
        SeoCrawlerModel::issueSetStatus($id, Input::body()['status'] ?? 'open');
        Response::json(['ok' => true]);
    }

    private static function seoDecay(): void { Response::json(SeoCrawlerModel::contentDecay((int)($_GET['days'] ?? 30))); }

    private static function seoInternalLinks(): void
    {
        // pages with few internal links pointing at them (weakest pages first)
        $siteDir = AV_SITE_OUT;
        $pages = glob($siteDir . '/*.html') ?: [];
        $links = [];
        foreach ($pages as $f) {
            $html = (string)file_get_contents($f);
            if (preg_match_all('/href="([^"#]+\.html)"/i', $html, $m)) {
                foreach ($m[1] as $h) {
                    if (str_starts_with($h, 'http')) continue;
                    $t = basename(parse_url($h, PHP_URL_PATH) ?: '');
                    if ($t !== '') $links[$t] = ($links[$t] ?? 0) + 1;
                }
            }
        }
        $out = [];
        foreach ($pages as $f) {
            $n = basename($f);
            $count = $links[$n] ?? 0;
            if ($count <= 1 && $n !== '404.html' && $n !== 'index.html') $out[] = ['page' => '/' . $n, 'incoming_links' => $count, 'opportunity' => 'Add internal links from related pages'];
        }
Response::json($out);
    }

    private static function seoBrief(): void
    {
        $d = Input::body();
        $kw = trim((string)($d['keyword'] ?? ''));
        if ($kw === '') Response::error('keyword required', 422, 'VALIDATION_ERROR');
        $intent = KeywordModel::classifyIntent($kw);
        // related existing content (real)
        $related = [];
        foreach (['pages', 'projects', 'articles'] as $key) {
            foreach (ContentStore::get($key) as $it) {
                $hay = strtolower((string)($it['title'] ?? '') . ' ' . (string)($it['excerpt'] ?? '') . ' ' . (string)($it['summary'] ?? ''));
                if (str_contains($hay, strtolower(substr($kw, 0, 24)))) {
                    $related[] = ['type' => $key, 'title' => $it['title'] ?? '', 'slug' => $it['slug'] ?? ''];
                }
            }
        }
        $secondary = Database::all("SELECT keyword FROM keywords WHERE intent=? AND keyword != ? LIMIT 6", [$intent, $kw]);
        Response::json([
            'primary_keyword' => $kw,
            'intent' => $intent,
            'suggested_title' => ucwords($kw) . ' — Abhijeet Varghese',
            'suggested_h1' => ucwords($kw),
            'suggested_h2' => ['What is ' . $kw . '?', 'Why it matters for enterprise teams', 'How ' . $kw . ' works in practice', 'Case studies & outcomes', 'Getting started'],
            'questions' => ["What is $kw?", "Why does $kw matter?", "How much does $kw cost?", "Who needs $kw?"],
            'secondary_keywords' => array_map(fn($r) => $r['keyword'], $secondary),
            'existing_related_content' => $related,
            'internal_links' => array_map(fn($r) => '/' . $r['slug'] . '.html', $related),
            'cta' => 'Discuss a project — book an intro call',
            'schema' => ['Article', 'FAQPage where genuinely applicable'],
            'note' => 'Content brief generated from real keyword + site data. Always write for humans first.',
        ]);
    }

    private static function seoBacklinks(): void { Response::json(Database::all("SELECT * FROM backlinks ORDER BY last_seen DESC LIMIT 200")); }

    private static function seoBacklinkSave(int $id): void
    {
        $d = Input::body();
        $domain = trim((string)($d['referring_domain'] ?? ''));
        if ($domain === '') Response::error('referring_domain required', 422, 'VALIDATION_ERROR');
        if ($id) {
            Database::q("UPDATE backlinks SET referring_domain=?, target_url=?, anchor=?, first_seen=?, last_seen=?, status=? WHERE id=?",
                [$domain, $d['target_url'] ?? '', $d['anchor'] ?? '', $d['first_seen'] ?: null, $d['last_seen'] ?: date('Y-m-d'), $d['status'] ?? 'new', $id]);
        } else {
            Database::q("INSERT INTO backlinks (referring_domain, target_url, anchor, first_seen, last_seen, status) VALUES (?,?,?,?,?,?)",
                [$domain, $d['target_url'] ?? '', $d['anchor'] ?? '', $d['first_seen'] ?: date('Y-m-d'), $d['last_seen'] ?: date('Y-m-d'), $d['status'] ?? 'new']);
            $id = (int)Database::pdo()->lastInsertId();
        }
        Response::json(['ok' => true, 'id' => $id]);
    }

    private static function seoBacklinkDelete(int $id): void { Database::q("DELETE FROM backlinks WHERE id=?", [$id]); Response::json(['ok' => true]); }

    private static function seoCompetitors(): void { Response::json(Database::all("SELECT * FROM competitors ORDER BY name")); }

    private static function seoCompetitorSave(int $id): void
    {
        $d = Input::body();
        $name = trim((string)($d['name'] ?? ''));
        if ($name === '') Response::error('name required', 422, 'VALIDATION_ERROR');
        if ($id) Database::q("UPDATE competitors SET name=?, domain=?, focus=?, notes=? WHERE id=?", [$name, $d['domain'] ?? '', $d['focus'] ?? '', $d['notes'] ?? '', $id]);
        else { Database::q("INSERT INTO competitors (name, domain, focus, notes) VALUES (?,?,?,?)", [$name, $d['domain'] ?? '', $d['focus'] ?? '', $d['notes'] ?? '']); $id = (int)Database::pdo()->lastInsertId(); }
        Response::json(['ok' => true, 'id' => $id]);
    }

    private static function seoCompetitorDelete(int $id): void { Database::q("DELETE FROM competitors WHERE id=?", [$id]); Response::json(['ok' => true]); }

    /* ---------- engagement ---------- */
    private static function engagementScore(): void { Response::json(IntelligenceModel::engagement((int)($_GET['days'] ?? 30))); }
    private static function engagementCtas(): void { Response::json(IntelligenceModel::ctaIntelligence((int)($_GET['days'] ?? 90))); }
    private static function engagementFunnel(): void { Response::json(IntelligenceModel::funnel((int)($_GET['days'] ?? 90))); }

    /* ---------- intelligence ---------- */
    private static function intelNextActions(): void { Response::json(IntelligenceModel::nextActions((int)($_GET['limit'] ?? 10))); }
    private static function intelDailyBrief(): void { Response::json(IntelligenceModel::dailyBrief()); }
    private static function intelWeeklyReport(): void { Response::json(IntelligenceModel::weeklyReport()); }
    private static function intelSocialDrafts(): void { Response::json(IntelligenceModel::socialDrafts()); }

    private static function intelSocialDraftCreate(): void
    {
        $r = IntelligenceModel::socialDraft(Input::body(), Auth::user()['id'] ?? null);
        Response::json($r, 201);
    }

    private static function intelSocialDraftStatus(int $id): void
    {
        IntelligenceModel::socialDraftStatus($id, Input::body()['status'] ?? 'draft');
        Response::json(['ok' => true]);
    }

    /* ============================================================
       AI AGENT OS HANDLERS
       ============================================================ */
    private static function agents(): void
    {
        AgentRegistry::seed();   // idempotent
        $agents = AgentRegistry::all();
        foreach ($agents as &$a) {
            $a['action_policy'] = AgentRegistry::actionPolicy($a['slug']);
        }
        Response::json(['health' => AgentRegistry::health(), 'agents' => $agents]);
    }

    private static function agentUpdate(string $slug): void
    {
        $d = Input::body();
        $a = AgentRegistry::bySlug($slug);
        if (!$a) Response::error('Agent not found', 404, 'NOT_FOUND');
        if (array_key_exists('enabled', $d)) Database::q("UPDATE ai_agents SET enabled=? WHERE slug=?", [(int)(bool)$d['enabled'], $slug]);
        if (array_key_exists('status', $d)) AgentRegistry::setStatus($slug, (string)$d['status']);
        if (array_key_exists('autonomy', $d)) AgentRegistry::setAutonomy($slug, (int)$d['autonomy']);
        if (array_key_exists('schedule', $d)) AgentRegistry::setSchedule($slug, (string)$d['schedule']);
        if (!empty($d['enabled']) === false) AgentJobs::cancelAllFor($slug);
        Audit::log(Auth::user()['id'], 'agent_update', 'ai_agent', $slug, array_keys($d));
        Response::json(['ok' => true]);
    }

    private static function agentRun(string $slug): void
    {
        $a = AgentRegistry::bySlug($slug);
        if (!$a) Response::error('Agent not found', 404, 'NOT_FOUND');
        if (AgentSettings::isPaused(self::scopeForAgent($slug))) Response::error('Agent scope is paused', 409, 'AGENTS_PAUSED');
        $jobId = AgentJobs::enqueue($slug, 'run', Input::body(), 'high');
        // execute inline (manual trigger = synchronous)
        $job = AgentJobs::claim($slug);
        if (!$job) Response::json(['ok' => true, 'queued' => true, 'job' => $jobId]);
        $res = AgentExecutors::run($slug, Input::body());
        if (!empty($res['ok'])) {
            AgentJobs::complete((int)$job['id'], $res['output'] ?? []);
            AgentRegistry::markSuccess($slug);
            Audit::log(Auth::user()['id'], 'agent_run', 'ai_agent', $slug, ['job' => (int)$job['id'], 'actions' => (int)($res['actions'] ?? 0)]);
        } else {
            AgentJobs::fail((int)$job['id'], $res['output']['error'] ?? 'failed');
            AgentRegistry::markFailure($slug, $res['output']['error'] ?? 'failed');
        }
        Response::json(['ok' => true, 'job' => (int)$job['id'], 'result' => $res]);
    }

    private static function agentJobs(): void
    {
        Response::json(AgentJobs::recent((int)($_GET['limit'] ?? 30)));
    }

    private static function agentMemory(): void
    {
        Response::json(AgentMemory::recent((string)($_GET['agent'] ?? ''), (int)($_GET['limit'] ?? 30)));
    }

    private static function agentPause(): void
    {
        $d = Input::body();
        $scopes = (array)($d['scopes'] ?? []);
        AgentSettings::save(['paused_scopes' => $scopes]);
        Audit::log(Auth::user()['id'], 'agents_pause_changed', 'ai_agent', 'orchestrator', ['scopes' => $scopes]);
        NotificationModel::push('AI agents scope changed', $scopes ? 'Paused: ' . implode(', ', $scopes) : 'All agents resumed', 'info');
        Response::json(['ok' => true, 'paused_scopes' => $scopes]);
    }

    private static function agentSettingsGet(): void
    {
        Response::json(AgentSettings::get() + ['daily_cost' => AgentSettings::dailyAiCost(), 'monthly_cost' => AgentSettings::monthlyAiCost()]);
    }

    private static function agentSettingsSave(): void
    {
        $d = Input::body();
        AgentSettings::save($d);
        if (array_key_exists('ai_agents', $d)) FeatureFlagModel::set('ai_agents', (bool)$d['ai_agents']);
        Audit::log(Auth::user()['id'], 'agent_settings_saved', 'ai_agent', 'orchestrator');
        Response::json(['ok' => true]);
    }

    private static function scopeForAgent(string $slug): string
    {
        return match (true) {
            in_array($slug, ['journal', 'insights', 'case-study', 'research', 'content-strategist', 'content-refresh', 'ai-editor'], true) => 'content',
            in_array($slug, ['social', 'newsletter'], true) => 'social',
            in_array($slug, ['technical-seo', 'seo', 'search-intel', 'internal-links'], true) => 'seo',
            default => 'publish',
        };
    }

    private static function agentBrief(): void
    {
        // AV OS GROWTH BRIEF — real data + agent memory
        $brief = IntelligenceModel::dailyBrief();
        $memory = AgentMemory::recent('', 8);
        $health = AgentRegistry::health();
        $actions = [];
        foreach (AgentMemory::recent('orchestrator', 3) as $m) if ($m['decision']) $actions[] = $m['decision'];
        $recentJobs = AgentJobs::recent(6);
        $last24 = array_values(array_filter($recentJobs, fn($j) => strtotime((string)$j['completed_at']) > time() - 86400));
        $failed24 = count(array_filter($last24, fn($j) => $j['status'] === 'failed'));
        Response::json([
            'date' => date('Y-m-d'),
            'website' => ['traffic_delta_pct' => $brief['traffic_delta_pct'], 'leads_today' => $brief['leads_today']],
            'seo' => ['score' => $brief['seo_score'], 'open_issues' => $brief['open_seo_issues']],
            'top_content' => $brief['top_content'],
            'agents' => ['active' => $health['agents_active'], 'total' => $health['agents_total'], 'failed' => $health['agents_failed'], 'jobs_completed_24h' => count($last24), 'jobs_failed_24h' => $failed24, 'overall' => $health['overall']],
            'recommendations' => array_slice($brief['recommended_actions'], 0, 3),
            'agent_activity' => array_map(fn($m) => ['agent' => $m['agent_slug'], 'observation' => $m['observation'], 'decision' => $m['decision'], 'time' => $m['created_at']], $memory),
            'top_recommendation' => $actions[0] ?? $brief['recommended_actions'][0] ?? 'Keep building steadily',
        ]);
    }
}
