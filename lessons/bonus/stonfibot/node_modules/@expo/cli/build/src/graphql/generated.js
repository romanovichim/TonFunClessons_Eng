"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
exports.WebhookType = exports.UsageMetricsGranularity = exports.UsageMetricType = exports.UploadSessionType = exports.SubmissionStatus = exports.SubmissionArchiveSourceType = exports.SubmissionAndroidTrack = exports.SubmissionAndroidReleaseStatus = exports.SubmissionAndroidArchiveType = exports.StatuspageServiceStatus = exports.StatuspageServiceName = exports.StatuspageIncidentStatus = exports.StatuspageIncidentImpact = exports.StandardOffer = exports.SecondFactorMethod = exports.Role = exports.ProjectArchiveSourceType = exports.Permission = exports.Order = exports.OfferType = exports.NotificationType = exports.NotificationEvent = exports.MailchimpTag = exports.MailchimpAudience = exports.IosSchemeBuildConfiguration = exports.IosManagedBuildType = exports.IosDistributionType = exports.IosBuildType = exports.InvoiceDiscountType = exports.GitHubAppInstallationStatus = exports.GitHubAppEnvironment = exports.Feature = exports.EnvironmentSecretType = exports.EasTotalPlanEnablementUnit = exports.EasServiceMetric = exports.EasService = exports.EasBuildDeprecationInfoType = exports.EasBuildBillingResourceClass = exports.DistributionType = exports.BuildWorkflow = exports.BuildTrigger = exports.BuildStatus = exports.BuildRetryDisabledReason = exports.BuildResourceClass = exports.BuildPriority = exports.BuildMode = exports.BuildJobStatus = exports.BuildJobLogsFormat = exports.BuildIosEnterpriseProvisioning = exports.BuildCredentialsSource = exports.AuthProtocolType = exports.AssetMetadataStatus = exports.AppsFilter = exports.AppleDeviceClass = exports.AppStoreConnectUserRole = exports.AppSort = exports.AppPrivacy = exports.AppPlatform = exports.AndroidKeystoreType = exports.AndroidFcmVersion = exports.AndroidBuildType = exports.ActivityTimelineProjectActivityType = exports.AccountAppsSortByField = void 0;
var AccountAppsSortByField;
exports.AccountAppsSortByField = AccountAppsSortByField;
(function(AccountAppsSortByField) {
    AccountAppsSortByField["LatestActivityTime"] = "LATEST_ACTIVITY_TIME";
    AccountAppsSortByField[/**
   * Name prefers the display name but falls back to full_name with @account/
   * part stripped.
   */ "Name"] = "NAME";
})(AccountAppsSortByField || (exports.AccountAppsSortByField = AccountAppsSortByField = {}));
var ActivityTimelineProjectActivityType;
exports.ActivityTimelineProjectActivityType = ActivityTimelineProjectActivityType;
(function(ActivityTimelineProjectActivityType) {
    ActivityTimelineProjectActivityType["Build"] = "BUILD";
    ActivityTimelineProjectActivityType["BuildJob"] = "BUILD_JOB";
    ActivityTimelineProjectActivityType["Submission"] = "SUBMISSION";
    ActivityTimelineProjectActivityType["Update"] = "UPDATE";
})(ActivityTimelineProjectActivityType || (exports.ActivityTimelineProjectActivityType = ActivityTimelineProjectActivityType = {}));
var AndroidBuildType;
exports.AndroidBuildType = AndroidBuildType;
(function(AndroidBuildType) {
    AndroidBuildType["Apk"] = "APK";
    AndroidBuildType["AppBundle"] = "APP_BUNDLE";
    AndroidBuildType[/** @deprecated Use developmentClient option instead. */ "DevelopmentClient"] = "DEVELOPMENT_CLIENT";
})(AndroidBuildType || (exports.AndroidBuildType = AndroidBuildType = {}));
var AndroidFcmVersion;
exports.AndroidFcmVersion = AndroidFcmVersion;
(function(AndroidFcmVersion) {
    AndroidFcmVersion["Legacy"] = "LEGACY";
    AndroidFcmVersion["V1"] = "V1";
})(AndroidFcmVersion || (exports.AndroidFcmVersion = AndroidFcmVersion = {}));
var AndroidKeystoreType;
exports.AndroidKeystoreType = AndroidKeystoreType;
(function(AndroidKeystoreType) {
    AndroidKeystoreType["Jks"] = "JKS";
    AndroidKeystoreType["Pkcs12"] = "PKCS12";
    AndroidKeystoreType["Unknown"] = "UNKNOWN";
})(AndroidKeystoreType || (exports.AndroidKeystoreType = AndroidKeystoreType = {}));
var AppPlatform;
exports.AppPlatform = AppPlatform;
(function(AppPlatform) {
    AppPlatform["Android"] = "ANDROID";
    AppPlatform["Ios"] = "IOS";
})(AppPlatform || (exports.AppPlatform = AppPlatform = {}));
var AppPrivacy;
exports.AppPrivacy = AppPrivacy;
(function(AppPrivacy) {
    AppPrivacy["Hidden"] = "HIDDEN";
    AppPrivacy["Public"] = "PUBLIC";
    AppPrivacy["Unlisted"] = "UNLISTED";
})(AppPrivacy || (exports.AppPrivacy = AppPrivacy = {}));
var AppSort;
exports.AppSort = AppSort;
(function(AppSort) {
    AppSort[/** Sort by recently published */ "RecentlyPublished"] = "RECENTLY_PUBLISHED";
    AppSort[/** Sort by highest trendScore */ "Viewed"] = "VIEWED";
})(AppSort || (exports.AppSort = AppSort = {}));
var AppStoreConnectUserRole;
exports.AppStoreConnectUserRole = AppStoreConnectUserRole;
(function(AppStoreConnectUserRole) {
    AppStoreConnectUserRole["AccessToReports"] = "ACCESS_TO_REPORTS";
    AppStoreConnectUserRole["AccountHolder"] = "ACCOUNT_HOLDER";
    AppStoreConnectUserRole["Admin"] = "ADMIN";
    AppStoreConnectUserRole["AppManager"] = "APP_MANAGER";
    AppStoreConnectUserRole["CloudManagedAppDistribution"] = "CLOUD_MANAGED_APP_DISTRIBUTION";
    AppStoreConnectUserRole["CloudManagedDeveloperId"] = "CLOUD_MANAGED_DEVELOPER_ID";
    AppStoreConnectUserRole["CreateApps"] = "CREATE_APPS";
    AppStoreConnectUserRole["CustomerSupport"] = "CUSTOMER_SUPPORT";
    AppStoreConnectUserRole["Developer"] = "DEVELOPER";
    AppStoreConnectUserRole["Finance"] = "FINANCE";
    AppStoreConnectUserRole["ImageManager"] = "IMAGE_MANAGER";
    AppStoreConnectUserRole["Marketing"] = "MARKETING";
    AppStoreConnectUserRole["ReadOnly"] = "READ_ONLY";
    AppStoreConnectUserRole["Sales"] = "SALES";
    AppStoreConnectUserRole["Technical"] = "TECHNICAL";
    AppStoreConnectUserRole["Unknown"] = "UNKNOWN";
})(AppStoreConnectUserRole || (exports.AppStoreConnectUserRole = AppStoreConnectUserRole = {}));
var AppleDeviceClass;
exports.AppleDeviceClass = AppleDeviceClass;
(function(AppleDeviceClass) {
    AppleDeviceClass["Ipad"] = "IPAD";
    AppleDeviceClass["Iphone"] = "IPHONE";
})(AppleDeviceClass || (exports.AppleDeviceClass = AppleDeviceClass = {}));
var AppsFilter;
exports.AppsFilter = AppsFilter;
(function(AppsFilter) {
    AppsFilter[/** Featured Projects */ "Featured"] = "FEATURED";
    AppsFilter[/** New Projects */ "New"] = "NEW";
})(AppsFilter || (exports.AppsFilter = AppsFilter = {}));
var AssetMetadataStatus;
exports.AssetMetadataStatus = AssetMetadataStatus;
(function(AssetMetadataStatus) {
    AssetMetadataStatus["DoesNotExist"] = "DOES_NOT_EXIST";
    AssetMetadataStatus["Exists"] = "EXISTS";
})(AssetMetadataStatus || (exports.AssetMetadataStatus = AssetMetadataStatus = {}));
var AuthProtocolType;
exports.AuthProtocolType = AuthProtocolType;
(function(AuthProtocolType) {
    AuthProtocolType["Oidc"] = "OIDC";
})(AuthProtocolType || (exports.AuthProtocolType = AuthProtocolType = {}));
var BuildCredentialsSource;
exports.BuildCredentialsSource = BuildCredentialsSource;
(function(BuildCredentialsSource) {
    BuildCredentialsSource["Local"] = "LOCAL";
    BuildCredentialsSource["Remote"] = "REMOTE";
})(BuildCredentialsSource || (exports.BuildCredentialsSource = BuildCredentialsSource = {}));
var BuildIosEnterpriseProvisioning;
exports.BuildIosEnterpriseProvisioning = BuildIosEnterpriseProvisioning;
(function(BuildIosEnterpriseProvisioning) {
    BuildIosEnterpriseProvisioning["Adhoc"] = "ADHOC";
    BuildIosEnterpriseProvisioning["Universal"] = "UNIVERSAL";
})(BuildIosEnterpriseProvisioning || (exports.BuildIosEnterpriseProvisioning = BuildIosEnterpriseProvisioning = {}));
var BuildJobLogsFormat;
exports.BuildJobLogsFormat = BuildJobLogsFormat;
(function(BuildJobLogsFormat) {
    BuildJobLogsFormat["Json"] = "JSON";
    BuildJobLogsFormat["Raw"] = "RAW";
})(BuildJobLogsFormat || (exports.BuildJobLogsFormat = BuildJobLogsFormat = {}));
var BuildJobStatus;
exports.BuildJobStatus = BuildJobStatus;
(function(BuildJobStatus) {
    BuildJobStatus["Errored"] = "ERRORED";
    BuildJobStatus["Finished"] = "FINISHED";
    BuildJobStatus["InProgress"] = "IN_PROGRESS";
    BuildJobStatus["Pending"] = "PENDING";
    BuildJobStatus["SentToQueue"] = "SENT_TO_QUEUE";
    BuildJobStatus["Started"] = "STARTED";
})(BuildJobStatus || (exports.BuildJobStatus = BuildJobStatus = {}));
var BuildMode;
exports.BuildMode = BuildMode;
(function(BuildMode) {
    BuildMode["Build"] = "BUILD";
    BuildMode["Custom"] = "CUSTOM";
    BuildMode["Resign"] = "RESIGN";
})(BuildMode || (exports.BuildMode = BuildMode = {}));
var BuildPriority;
exports.BuildPriority = BuildPriority;
(function(BuildPriority) {
    BuildPriority["High"] = "HIGH";
    BuildPriority["Normal"] = "NORMAL";
    BuildPriority["NormalPlus"] = "NORMAL_PLUS";
})(BuildPriority || (exports.BuildPriority = BuildPriority = {}));
var BuildResourceClass;
exports.BuildResourceClass = BuildResourceClass;
(function(BuildResourceClass) {
    BuildResourceClass["AndroidDefault"] = "ANDROID_DEFAULT";
    BuildResourceClass["AndroidLarge"] = "ANDROID_LARGE";
    BuildResourceClass["AndroidMedium"] = "ANDROID_MEDIUM";
    BuildResourceClass["IosDefault"] = "IOS_DEFAULT";
    BuildResourceClass[/** @deprecated Use IOS_INTEL_MEDIUM instead */ "IosIntelLarge"] = "IOS_INTEL_LARGE";
    BuildResourceClass["IosIntelMedium"] = "IOS_INTEL_MEDIUM";
    BuildResourceClass["IosLarge"] = "IOS_LARGE";
    BuildResourceClass[/** @deprecated Use IOS_M_MEDIUM instead */ "IosM1Large"] = "IOS_M1_LARGE";
    BuildResourceClass["IosM1Medium"] = "IOS_M1_MEDIUM";
    BuildResourceClass["IosMedium"] = "IOS_MEDIUM";
    BuildResourceClass["IosMLarge"] = "IOS_M_LARGE";
    BuildResourceClass["IosMMedium"] = "IOS_M_MEDIUM";
    BuildResourceClass["Legacy"] = "LEGACY";
})(BuildResourceClass || (exports.BuildResourceClass = BuildResourceClass = {}));
var BuildRetryDisabledReason;
exports.BuildRetryDisabledReason = BuildRetryDisabledReason;
(function(BuildRetryDisabledReason) {
    BuildRetryDisabledReason["AlreadyRetried"] = "ALREADY_RETRIED";
    BuildRetryDisabledReason["InvalidStatus"] = "INVALID_STATUS";
    BuildRetryDisabledReason["IsGithubBuild"] = "IS_GITHUB_BUILD";
    BuildRetryDisabledReason["NotCompletedYet"] = "NOT_COMPLETED_YET";
    BuildRetryDisabledReason["TooMuchTimeElapsed"] = "TOO_MUCH_TIME_ELAPSED";
})(BuildRetryDisabledReason || (exports.BuildRetryDisabledReason = BuildRetryDisabledReason = {}));
var BuildStatus;
exports.BuildStatus = BuildStatus;
(function(BuildStatus) {
    BuildStatus["Canceled"] = "CANCELED";
    BuildStatus["Errored"] = "ERRORED";
    BuildStatus["Finished"] = "FINISHED";
    BuildStatus["InProgress"] = "IN_PROGRESS";
    BuildStatus["InQueue"] = "IN_QUEUE";
    BuildStatus["New"] = "NEW";
})(BuildStatus || (exports.BuildStatus = BuildStatus = {}));
var BuildTrigger;
exports.BuildTrigger = BuildTrigger;
(function(BuildTrigger) {
    BuildTrigger["EasCli"] = "EAS_CLI";
    BuildTrigger["GitBasedIntegration"] = "GIT_BASED_INTEGRATION";
})(BuildTrigger || (exports.BuildTrigger = BuildTrigger = {}));
var BuildWorkflow;
exports.BuildWorkflow = BuildWorkflow;
(function(BuildWorkflow) {
    BuildWorkflow["Generic"] = "GENERIC";
    BuildWorkflow["Managed"] = "MANAGED";
    BuildWorkflow["Unknown"] = "UNKNOWN";
})(BuildWorkflow || (exports.BuildWorkflow = BuildWorkflow = {}));
var DistributionType;
exports.DistributionType = DistributionType;
(function(DistributionType) {
    DistributionType["Internal"] = "INTERNAL";
    DistributionType["Simulator"] = "SIMULATOR";
    DistributionType["Store"] = "STORE";
})(DistributionType || (exports.DistributionType = DistributionType = {}));
var EasBuildBillingResourceClass;
exports.EasBuildBillingResourceClass = EasBuildBillingResourceClass;
(function(EasBuildBillingResourceClass) {
    EasBuildBillingResourceClass["Large"] = "LARGE";
    EasBuildBillingResourceClass["Medium"] = "MEDIUM";
})(EasBuildBillingResourceClass || (exports.EasBuildBillingResourceClass = EasBuildBillingResourceClass = {}));
var EasBuildDeprecationInfoType;
exports.EasBuildDeprecationInfoType = EasBuildDeprecationInfoType;
(function(EasBuildDeprecationInfoType) {
    EasBuildDeprecationInfoType["Internal"] = "INTERNAL";
    EasBuildDeprecationInfoType["UserFacing"] = "USER_FACING";
})(EasBuildDeprecationInfoType || (exports.EasBuildDeprecationInfoType = EasBuildDeprecationInfoType = {}));
var EasService;
exports.EasService = EasService;
(function(EasService) {
    EasService["Builds"] = "BUILDS";
    EasService["Updates"] = "UPDATES";
})(EasService || (exports.EasService = EasService = {}));
var EasServiceMetric;
exports.EasServiceMetric = EasServiceMetric;
(function(EasServiceMetric) {
    EasServiceMetric["AssetsRequests"] = "ASSETS_REQUESTS";
    EasServiceMetric["BandwidthUsage"] = "BANDWIDTH_USAGE";
    EasServiceMetric["Builds"] = "BUILDS";
    EasServiceMetric["ManifestRequests"] = "MANIFEST_REQUESTS";
    EasServiceMetric["UniqueUpdaters"] = "UNIQUE_UPDATERS";
    EasServiceMetric["UniqueUsers"] = "UNIQUE_USERS";
})(EasServiceMetric || (exports.EasServiceMetric = EasServiceMetric = {}));
var EasTotalPlanEnablementUnit;
exports.EasTotalPlanEnablementUnit = EasTotalPlanEnablementUnit;
(function(EasTotalPlanEnablementUnit) {
    EasTotalPlanEnablementUnit["Build"] = "BUILD";
    EasTotalPlanEnablementUnit["Byte"] = "BYTE";
    EasTotalPlanEnablementUnit["Concurrency"] = "CONCURRENCY";
    EasTotalPlanEnablementUnit["Request"] = "REQUEST";
    EasTotalPlanEnablementUnit["Updater"] = "UPDATER";
    EasTotalPlanEnablementUnit["User"] = "USER";
})(EasTotalPlanEnablementUnit || (exports.EasTotalPlanEnablementUnit = EasTotalPlanEnablementUnit = {}));
var EnvironmentSecretType;
exports.EnvironmentSecretType = EnvironmentSecretType;
(function(EnvironmentSecretType) {
    EnvironmentSecretType["FileBase64"] = "FILE_BASE64";
    EnvironmentSecretType["String"] = "STRING";
})(EnvironmentSecretType || (exports.EnvironmentSecretType = EnvironmentSecretType = {}));
var Feature;
exports.Feature = Feature;
(function(Feature) {
    Feature[/** Priority Builds */ "Builds"] = "BUILDS";
    Feature[/** Funds support for open source development */ "OpenSource"] = "OPEN_SOURCE";
    Feature[/** Top Tier Support */ "Support"] = "SUPPORT";
    Feature[/** Share access to projects */ "Teams"] = "TEAMS";
})(Feature || (exports.Feature = Feature = {}));
var GitHubAppEnvironment;
exports.GitHubAppEnvironment = GitHubAppEnvironment;
(function(GitHubAppEnvironment) {
    GitHubAppEnvironment["Development"] = "DEVELOPMENT";
    GitHubAppEnvironment["Production"] = "PRODUCTION";
    GitHubAppEnvironment["Staging"] = "STAGING";
})(GitHubAppEnvironment || (exports.GitHubAppEnvironment = GitHubAppEnvironment = {}));
var GitHubAppInstallationStatus;
exports.GitHubAppInstallationStatus = GitHubAppInstallationStatus;
(function(GitHubAppInstallationStatus) {
    GitHubAppInstallationStatus["Active"] = "ACTIVE";
    GitHubAppInstallationStatus["NotInstalled"] = "NOT_INSTALLED";
    GitHubAppInstallationStatus["Suspended"] = "SUSPENDED";
})(GitHubAppInstallationStatus || (exports.GitHubAppInstallationStatus = GitHubAppInstallationStatus = {}));
var InvoiceDiscountType;
exports.InvoiceDiscountType = InvoiceDiscountType;
(function(InvoiceDiscountType) {
    InvoiceDiscountType["Amount"] = "AMOUNT";
    InvoiceDiscountType["Percentage"] = "PERCENTAGE";
})(InvoiceDiscountType || (exports.InvoiceDiscountType = InvoiceDiscountType = {}));
var IosBuildType;
exports.IosBuildType = IosBuildType;
(function(IosBuildType) {
    IosBuildType["DevelopmentClient"] = "DEVELOPMENT_CLIENT";
    IosBuildType["Release"] = "RELEASE";
})(IosBuildType || (exports.IosBuildType = IosBuildType = {}));
var IosDistributionType;
exports.IosDistributionType = IosDistributionType;
(function(IosDistributionType) {
    IosDistributionType["AdHoc"] = "AD_HOC";
    IosDistributionType["AppStore"] = "APP_STORE";
    IosDistributionType["Development"] = "DEVELOPMENT";
    IosDistributionType["Enterprise"] = "ENTERPRISE";
})(IosDistributionType || (exports.IosDistributionType = IosDistributionType = {}));
var IosManagedBuildType;
exports.IosManagedBuildType = IosManagedBuildType;
(function(IosManagedBuildType) {
    IosManagedBuildType["DevelopmentClient"] = "DEVELOPMENT_CLIENT";
    IosManagedBuildType["Release"] = "RELEASE";
})(IosManagedBuildType || (exports.IosManagedBuildType = IosManagedBuildType = {}));
var IosSchemeBuildConfiguration;
exports.IosSchemeBuildConfiguration = IosSchemeBuildConfiguration;
(function(IosSchemeBuildConfiguration) {
    IosSchemeBuildConfiguration["Debug"] = "DEBUG";
    IosSchemeBuildConfiguration["Release"] = "RELEASE";
})(IosSchemeBuildConfiguration || (exports.IosSchemeBuildConfiguration = IosSchemeBuildConfiguration = {}));
var MailchimpAudience;
exports.MailchimpAudience = MailchimpAudience;
(function(MailchimpAudience) {
    MailchimpAudience["ExpoDevelopers"] = "EXPO_DEVELOPERS";
})(MailchimpAudience || (exports.MailchimpAudience = MailchimpAudience = {}));
var MailchimpTag;
exports.MailchimpTag = MailchimpTag;
(function(MailchimpTag) {
    MailchimpTag["DevClientUsers"] = "DEV_CLIENT_USERS";
    MailchimpTag["EasMasterList"] = "EAS_MASTER_LIST";
})(MailchimpTag || (exports.MailchimpTag = MailchimpTag = {}));
var NotificationEvent;
exports.NotificationEvent = NotificationEvent;
(function(NotificationEvent) {
    NotificationEvent["BuildComplete"] = "BUILD_COMPLETE";
    NotificationEvent["SubmissionComplete"] = "SUBMISSION_COMPLETE";
})(NotificationEvent || (exports.NotificationEvent = NotificationEvent = {}));
var NotificationType;
exports.NotificationType = NotificationType;
(function(NotificationType) {
    NotificationType["Email"] = "EMAIL";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var OfferType;
exports.OfferType = OfferType;
(function(OfferType) {
    OfferType[/** Addon, or supplementary subscription */ "Addon"] = "ADDON";
    OfferType[/** Advanced Purchase of Paid Resource */ "Prepaid"] = "PREPAID";
    OfferType[/** Term subscription */ "Subscription"] = "SUBSCRIPTION";
})(OfferType || (exports.OfferType = OfferType = {}));
var Order;
exports.Order = Order;
(function(Order) {
    Order["Asc"] = "ASC";
    Order["Desc"] = "DESC";
})(Order || (exports.Order = Order = {}));
var Permission;
exports.Permission = Permission;
(function(Permission) {
    Permission["Admin"] = "ADMIN";
    Permission["Own"] = "OWN";
    Permission["Publish"] = "PUBLISH";
    Permission["View"] = "VIEW";
})(Permission || (exports.Permission = Permission = {}));
var ProjectArchiveSourceType;
exports.ProjectArchiveSourceType = ProjectArchiveSourceType;
(function(ProjectArchiveSourceType) {
    ProjectArchiveSourceType["Gcs"] = "GCS";
    ProjectArchiveSourceType["Git"] = "GIT";
    ProjectArchiveSourceType["None"] = "NONE";
    ProjectArchiveSourceType["S3"] = "S3";
    ProjectArchiveSourceType["Url"] = "URL";
})(ProjectArchiveSourceType || (exports.ProjectArchiveSourceType = ProjectArchiveSourceType = {}));
var Role;
exports.Role = Role;
(function(Role) {
    Role["Admin"] = "ADMIN";
    Role["Custom"] = "CUSTOM";
    Role["Developer"] = "DEVELOPER";
    Role["HasAdmin"] = "HAS_ADMIN";
    Role["NotAdmin"] = "NOT_ADMIN";
    Role["Owner"] = "OWNER";
    Role["ViewOnly"] = "VIEW_ONLY";
})(Role || (exports.Role = Role = {}));
var SecondFactorMethod;
exports.SecondFactorMethod = SecondFactorMethod;
(function(SecondFactorMethod) {
    SecondFactorMethod[/** Google Authenticator (TOTP) */ "Authenticator"] = "AUTHENTICATOR";
    SecondFactorMethod[/** SMS */ "Sms"] = "SMS";
})(SecondFactorMethod || (exports.SecondFactorMethod = SecondFactorMethod = {}));
var StandardOffer;
exports.StandardOffer = StandardOffer;
(function(StandardOffer) {
    StandardOffer[/** $29 USD per month, 30 day trial */ "Default"] = "DEFAULT";
    StandardOffer[/** $800 USD per month */ "Support"] = "SUPPORT";
    StandardOffer[/** $29 USD per month, 1 year trial */ "YcDeals"] = "YC_DEALS";
    StandardOffer[/** $348 USD per year, 30 day trial */ "YearlySub"] = "YEARLY_SUB";
})(StandardOffer || (exports.StandardOffer = StandardOffer = {}));
var StatuspageIncidentImpact;
exports.StatuspageIncidentImpact = StatuspageIncidentImpact;
(function(StatuspageIncidentImpact) {
    StatuspageIncidentImpact["Critical"] = "CRITICAL";
    StatuspageIncidentImpact["Maintenance"] = "MAINTENANCE";
    StatuspageIncidentImpact["Major"] = "MAJOR";
    StatuspageIncidentImpact["Minor"] = "MINOR";
    StatuspageIncidentImpact["None"] = "NONE";
})(StatuspageIncidentImpact || (exports.StatuspageIncidentImpact = StatuspageIncidentImpact = {}));
var StatuspageIncidentStatus;
exports.StatuspageIncidentStatus = StatuspageIncidentStatus;
(function(StatuspageIncidentStatus) {
    StatuspageIncidentStatus["Completed"] = "COMPLETED";
    StatuspageIncidentStatus["Identified"] = "IDENTIFIED";
    StatuspageIncidentStatus["Investigating"] = "INVESTIGATING";
    StatuspageIncidentStatus["InProgress"] = "IN_PROGRESS";
    StatuspageIncidentStatus["Monitoring"] = "MONITORING";
    StatuspageIncidentStatus["Resolved"] = "RESOLVED";
    StatuspageIncidentStatus["Scheduled"] = "SCHEDULED";
    StatuspageIncidentStatus["Verifying"] = "VERIFYING";
})(StatuspageIncidentStatus || (exports.StatuspageIncidentStatus = StatuspageIncidentStatus = {}));
var StatuspageServiceName;
exports.StatuspageServiceName = StatuspageServiceName;
(function(StatuspageServiceName) {
    StatuspageServiceName["EasBuild"] = "EAS_BUILD";
    StatuspageServiceName["EasSubmit"] = "EAS_SUBMIT";
    StatuspageServiceName["EasUpdate"] = "EAS_UPDATE";
})(StatuspageServiceName || (exports.StatuspageServiceName = StatuspageServiceName = {}));
var StatuspageServiceStatus;
exports.StatuspageServiceStatus = StatuspageServiceStatus;
(function(StatuspageServiceStatus) {
    StatuspageServiceStatus["DegradedPerformance"] = "DEGRADED_PERFORMANCE";
    StatuspageServiceStatus["MajorOutage"] = "MAJOR_OUTAGE";
    StatuspageServiceStatus["Operational"] = "OPERATIONAL";
    StatuspageServiceStatus["PartialOutage"] = "PARTIAL_OUTAGE";
    StatuspageServiceStatus["UnderMaintenance"] = "UNDER_MAINTENANCE";
})(StatuspageServiceStatus || (exports.StatuspageServiceStatus = StatuspageServiceStatus = {}));
var SubmissionAndroidArchiveType;
exports.SubmissionAndroidArchiveType = SubmissionAndroidArchiveType;
(function(SubmissionAndroidArchiveType) {
    SubmissionAndroidArchiveType["Aab"] = "AAB";
    SubmissionAndroidArchiveType["Apk"] = "APK";
})(SubmissionAndroidArchiveType || (exports.SubmissionAndroidArchiveType = SubmissionAndroidArchiveType = {}));
var SubmissionAndroidReleaseStatus;
exports.SubmissionAndroidReleaseStatus = SubmissionAndroidReleaseStatus;
(function(SubmissionAndroidReleaseStatus) {
    SubmissionAndroidReleaseStatus["Completed"] = "COMPLETED";
    SubmissionAndroidReleaseStatus["Draft"] = "DRAFT";
    SubmissionAndroidReleaseStatus["Halted"] = "HALTED";
    SubmissionAndroidReleaseStatus["InProgress"] = "IN_PROGRESS";
})(SubmissionAndroidReleaseStatus || (exports.SubmissionAndroidReleaseStatus = SubmissionAndroidReleaseStatus = {}));
var SubmissionAndroidTrack;
exports.SubmissionAndroidTrack = SubmissionAndroidTrack;
(function(SubmissionAndroidTrack) {
    SubmissionAndroidTrack["Alpha"] = "ALPHA";
    SubmissionAndroidTrack["Beta"] = "BETA";
    SubmissionAndroidTrack["Internal"] = "INTERNAL";
    SubmissionAndroidTrack["Production"] = "PRODUCTION";
})(SubmissionAndroidTrack || (exports.SubmissionAndroidTrack = SubmissionAndroidTrack = {}));
var SubmissionArchiveSourceType;
exports.SubmissionArchiveSourceType = SubmissionArchiveSourceType;
(function(SubmissionArchiveSourceType) {
    SubmissionArchiveSourceType["GcsBuildApplicationArchive"] = "GCS_BUILD_APPLICATION_ARCHIVE";
    SubmissionArchiveSourceType["GcsSubmitArchive"] = "GCS_SUBMIT_ARCHIVE";
    SubmissionArchiveSourceType["Url"] = "URL";
})(SubmissionArchiveSourceType || (exports.SubmissionArchiveSourceType = SubmissionArchiveSourceType = {}));
var SubmissionStatus;
exports.SubmissionStatus = SubmissionStatus;
(function(SubmissionStatus) {
    SubmissionStatus["AwaitingBuild"] = "AWAITING_BUILD";
    SubmissionStatus["Canceled"] = "CANCELED";
    SubmissionStatus["Errored"] = "ERRORED";
    SubmissionStatus["Finished"] = "FINISHED";
    SubmissionStatus["InProgress"] = "IN_PROGRESS";
    SubmissionStatus["InQueue"] = "IN_QUEUE";
})(SubmissionStatus || (exports.SubmissionStatus = SubmissionStatus = {}));
var UploadSessionType;
exports.UploadSessionType = UploadSessionType;
(function(UploadSessionType) {
    UploadSessionType["EasBuildGcsProjectSources"] = "EAS_BUILD_GCS_PROJECT_SOURCES";
    UploadSessionType["EasBuildProjectSources"] = "EAS_BUILD_PROJECT_SOURCES";
    UploadSessionType["EasSubmitAppArchive"] = "EAS_SUBMIT_APP_ARCHIVE";
    UploadSessionType["EasSubmitGcsAppArchive"] = "EAS_SUBMIT_GCS_APP_ARCHIVE";
})(UploadSessionType || (exports.UploadSessionType = UploadSessionType = {}));
var UsageMetricType;
exports.UsageMetricType = UsageMetricType;
(function(UsageMetricType) {
    UsageMetricType["Bandwidth"] = "BANDWIDTH";
    UsageMetricType["Build"] = "BUILD";
    UsageMetricType["Request"] = "REQUEST";
    UsageMetricType["Update"] = "UPDATE";
    UsageMetricType["User"] = "USER";
})(UsageMetricType || (exports.UsageMetricType = UsageMetricType = {}));
var UsageMetricsGranularity;
exports.UsageMetricsGranularity = UsageMetricsGranularity;
(function(UsageMetricsGranularity) {
    UsageMetricsGranularity["Day"] = "DAY";
    UsageMetricsGranularity["Hour"] = "HOUR";
    UsageMetricsGranularity["Minute"] = "MINUTE";
    UsageMetricsGranularity["Total"] = "TOTAL";
})(UsageMetricsGranularity || (exports.UsageMetricsGranularity = UsageMetricsGranularity = {}));
var WebhookType;
exports.WebhookType = WebhookType;
(function(WebhookType) {
    WebhookType["Build"] = "BUILD";
    WebhookType["Submit"] = "SUBMIT";
})(WebhookType || (exports.WebhookType = WebhookType = {}));

//# sourceMappingURL=generated.js.map