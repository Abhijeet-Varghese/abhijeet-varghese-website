<?php
/**
 * AV OS — bootstrap: config, autoload, session, providers.
 */
require __DIR__ . '/../backend/config/config.php';

spl_autoload_register(function (string $class): void {
    $map = [
        'Identity' => '/backend/identity/Identity.php',
        'Database' => '/backend/core/Database.php',
        'MigrationRunner' => '/backend/core/MigrationRunner.php',
        'Installer' => '/backend/core/Installer.php',
        'Auth' => '/backend/core/Auth.php',
        'Response' => '/backend/core/Response.php',
        'Input' => '/backend/core/Response.php',
        'ContentStore' => '/backend/models/Models.php',
        'MediaModel' => '/backend/models/Models.php',
        'LeadModel' => '/backend/models/Models.php',
        'FormModel' => '/backend/models/Models.php',
        'UserModel' => '/backend/models/Models.php',
        'AiService' => '/backend/ai/AiProviders.php',
        'OpenAiProvider' => '/backend/ai/AiProviders.php',
        'ClaudeProvider' => '/backend/ai/AiProviders.php',
        'GeminiProvider' => '/backend/ai/AiProviders.php',
        'PublishEngine' => '/backend/publish/PublishEngine.php',
        'ApiController' => '/backend/controllers/ApiController.php',
        'CrmModel' => '/backend/models/BusinessModels.php',
        'BusinessProjectModel' => '/backend/models/BusinessModels.php',
        'ProposalModel' => '/backend/models/BusinessModels.php',
        'AnalyticsModel' => '/backend/models/BusinessModels.php',
        'AutomationModel' => '/backend/models/BusinessModels.php',
        'NotificationModel' => '/backend/models/BusinessModels.php',
        'WebhookModel' => '/backend/models/BusinessModels.php',
        'ApiKeyModel' => '/backend/models/BusinessModels.php',
        'FeatureFlagModel' => '/backend/models/BusinessModels.php',
        'KnowledgeModel' => '/backend/models/BusinessModels.php',
        'ErrorModel' => '/backend/models/BusinessModels.php',
        'EmailModel' => '/backend/models/BusinessModels.php',
        'EmailTemplateModel' => '/backend/models/BusinessModels.php',
        'CampaignModel' => '/backend/models/BusinessModels.php',
        'HealthModel' => '/backend/models/BusinessModels.php',
        'AiUsageModel' => '/backend/models/BusinessModels.php',
        'Pdf' => '/backend/core/Pdf.php',
        'Totp' => '/backend/core/Totp.php',
        'SmtpClient' => '/backend/core/SmtpClient.php',
        'DeploymentModel' => '/backend/models/BusinessModels.php',
        'TrashModel' => '/backend/models/BusinessModels.php',
        'InboundWebhookModel' => '/backend/models/BusinessModels.php',
        'Lock' => '/backend/models/BusinessModels.php',
        'PublishSettings' => '/backend/models/BusinessModels.php',
        'PublishQueue' => '/backend/models/BusinessModels.php',
        'SiteConfig' => '/backend/models/BusinessModels.php',
        'SearchModel' => '/backend/models/BusinessModels.php',
        'KeywordModel' => '/backend/models/SeoModels.php',
        'SeoCrawlerModel' => '/backend/models/SeoModels.php',
        'IntelligenceModel' => '/backend/models/SeoModels.php',
        'AgentSettings' => '/backend/agents/AgentCore.php',
        'AgentRegistry' => '/backend/agents/AgentCore.php',
        'AgentJobs' => '/backend/agents/AgentCore.php',
        'AgentMemory' => '/backend/agents/AgentCore.php',
        'AgentQualityGate' => '/backend/agents/AgentCore.php',
        'AgentExecutors' => '/backend/agents/AgentExecutors.php',
        'IntegrationHub' => '/backend/integrations/IntegrationHub.php',
        'IntegrationLog' => '/backend/integrations/IntegrationHub.php',
        'OAuth2' => '/backend/integrations/IntegrationHub.php',
        'SearchConsoleAdapter' => '/backend/integrations/IntegrationAdapters.php',
        'Ga4Adapter' => '/backend/integrations/IntegrationAdapters.php',
        'BingWebmasterAdapter' => '/backend/integrations/IntegrationAdapters.php',
        'ClarityAdapter' => '/backend/integrations/IntegrationAdapters.php',
        'CloudflareAdapter' => '/backend/integrations/IntegrationAdapters.php',
        'CalendlyAdapter' => '/backend/integrations/IntegrationAdapters.php',
        'GithubAdapter' => '/backend/integrations/IntegrationAdapters.php',
        'DriveAdapter' => '/backend/integrations/IntegrationAdapters.php',
        'NotionAdapter' => '/backend/integrations/IntegrationAdapters.php',
        'YoutubeAdapter' => '/backend/integrations/IntegrationAdapters.php',
        'TrendsAdapter' => '/backend/integrations/IntegrationAdapters.php',
        'RssAdapter' => '/backend/integrations/IntegrationAdapters.php',
        'LinkedinAdapter' => '/backend/integrations/SocialAdapters.php',
        'InstagramAdapter' => '/backend/integrations/SocialAdapters.php',
        'BehanceAdapter' => '/backend/integrations/SocialAdapters.php',
        'DribbbleAdapter' => '/backend/integrations/SocialAdapters.php',
        'CanvaAdapter' => '/backend/integrations/SocialAdapters.php',
        'WhatsappAdapter' => '/backend/integrations/SocialAdapters.php',
        'EmailAdapter' => '/backend/integrations/SocialAdapters.php',
        'SearchConsoleModel' => '/backend/models/IntegrationModels.php',
        'ResearchModel' => '/backend/models/IntegrationModels.php',
        'KnowledgeGraphModel' => '/backend/models/IntegrationModels.php',
        'FactsModel' => '/backend/models/IntegrationModels.php',
        'CaseStudyModel' => '/backend/models/IntegrationModels.php',
        'SocialProfileModel' => '/backend/models/IntegrationModels.php',
        'TrackableLinkModel' => '/backend/models/IntegrationModels.php',
        'OutcomeModel' => '/backend/models/IntegrationModels.php',
        'IntelligenceMetricModel' => '/backend/models/IntegrationModels.php',
        'DevIntelModel' => '/backend/models/IntegrationModels.php',
        'KnowledgeIngestModel' => '/backend/models/IntegrationModels.php',
        'IntegrationController' => '/backend/controllers/IntegrationController.php',
    ];
    if (isset($map[$class])) {
        require AV_ROOT . $map[$class];
    }
});

Auth::start();

// register AI providers
AiService::register(new OpenAiProvider());
AiService::register(new ClaudeProvider());
AiService::register(new GeminiProvider());

// register integration adapters (hub)
IntegrationHub::registerAdapter(new SearchConsoleAdapter());
IntegrationHub::registerAdapter(new Ga4Adapter());
IntegrationHub::registerAdapter(new BingWebmasterAdapter());
IntegrationHub::registerAdapter(new ClarityAdapter());
IntegrationHub::registerAdapter(new CloudflareAdapter());
IntegrationHub::registerAdapter(new CalendlyAdapter());
IntegrationHub::registerAdapter(new GithubAdapter());
IntegrationHub::registerAdapter(new DriveAdapter());
IntegrationHub::registerAdapter(new NotionAdapter());
IntegrationHub::registerAdapter(new YoutubeAdapter());
IntegrationHub::registerAdapter(new TrendsAdapter());
IntegrationHub::registerAdapter(new RssAdapter());
IntegrationHub::registerAdapter(new LinkedinAdapter());
IntegrationHub::registerAdapter(new InstagramAdapter());
IntegrationHub::registerAdapter(new BehanceAdapter());
IntegrationHub::registerAdapter(new DribbbleAdapter());
IntegrationHub::registerAdapter(new CanvaAdapter());
IntegrationHub::registerAdapter(new WhatsappAdapter());
IntegrationHub::registerAdapter(new EmailAdapter());
