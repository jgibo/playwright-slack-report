"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const web_api_1 = require("@slack/web-api");
const https_proxy_agent_1 = require("https-proxy-agent");
const webhook_1 = require("@slack/webhook");
const ResultsParser_1 = require("./ResultsParser");
const SlackClient_1 = require("./SlackClient");
const SlackWebhookClient_1 = require("./SlackWebhookClient");
class SlackReporter {
    customLayout;
    customLayoutAsync;
    maxNumberOfFailuresToShow;
    showInThread;
    meta = [];
    resultsParser;
    sendResults = 'on-failure';
    slackChannels = [];
    slackLogLevel;
    slackOAuthToken;
    slackWebHookUrl;
    disableUnfurl;
    proxy;
    browsers = [];
    suite;
    separateFlaky = false;
    logs = [];
    onBegin(fullConfig, suite) {
        this.suite = suite;
        this.logs = [];
        const slackReporterConfig = fullConfig.reporter.filter((f) => f[0].toLowerCase().includes('slackreporter'))[0][1];
        if (fullConfig.projects.length === 0) {
            this.browsers = [];
        }
        else {
            // eslint-disable-next-line max-len
            this.browsers = fullConfig.projects.map((obj) => ({
                projectName: obj.name,
                browser: obj.use.browserName
                    ? obj.use.browserName
                    : obj.use.defaultBrowserType,
            }));
        }
        if (slackReporterConfig) {
            this.meta = slackReporterConfig.meta || [];
            this.sendResults = slackReporterConfig.sendResults || 'always';
            this.customLayout = slackReporterConfig.layout;
            this.customLayoutAsync = slackReporterConfig.layoutAsync;
            this.slackChannels = slackReporterConfig.channels;
            this.maxNumberOfFailuresToShow =
                slackReporterConfig.maxNumberOfFailuresToShow || 10;
            this.slackOAuthToken = slackReporterConfig.slackOAuthToken || undefined;
            this.slackWebHookUrl = slackReporterConfig.slackWebHookUrl || undefined;
            this.disableUnfurl = slackReporterConfig.disableUnfurl || false;
            this.showInThread = slackReporterConfig.showInThread || false;
            this.slackLogLevel = slackReporterConfig.slackLogLevel || web_api_1.LogLevel.DEBUG;
            this.proxy = slackReporterConfig.proxy || undefined;
            this.separateFlaky = slackReporterConfig.separateFlaky || false;
        }
        this.resultsParser = new ResultsParser_1.default({
            separateFlakyTests: this.separateFlaky,
        });
    }
    // eslint-disable-next-line class-methods-use-this, no-unused-vars
    onTestEnd(test, result) {
        this.resultsParser.addTestResult(test.parent.title, test, this.browsers);
    }
    async onEnd() {
        const { okToProceed, message } = this.preChecks();
        if (!okToProceed) {
            this.log(message);
            return;
        }
        const resultSummary = await this.resultsParser.getParsedResults();
        resultSummary.meta = this.meta;
        const maxRetry = Math.max(...resultSummary.tests.map((o) => o.retry));
        if (this.sendResults === 'on-failure' &&
            resultSummary.tests.filter((z) => (z.status === 'failed' || z.status === 'timedOut') &&
                z.retry === maxRetry).length === 0) {
            this.log('⏩ Slack reporter - no failures found');
            return;
        }
        const agent = this.proxy ? new https_proxy_agent_1.HttpsProxyAgent(this.proxy) : undefined;
        if (this.slackWebHookUrl) {
            const webhook = new webhook_1.IncomingWebhook(this.slackWebHookUrl, { agent });
            const slackWebhookClient = new SlackWebhookClient_1.default(webhook);
            const webhookResult = await slackWebhookClient.sendMessage({
                customLayout: this.customLayout,
                customLayoutAsync: this.customLayoutAsync,
                maxNumberOfFailures: this.maxNumberOfFailuresToShow,
                disableUnfurl: this.disableUnfurl,
                summaryResults: resultSummary,
            });
            // eslint-disable-next-line no-console
            console.log(JSON.stringify(webhookResult, null, 2));
        }
        else {
            const slackClient = new SlackClient_1.default(new web_api_1.WebClient(this.slackOAuthToken || process.env.SLACK_BOT_USER_OAUTH_TOKEN, {
                logLevel: this.slackLogLevel || web_api_1.LogLevel.DEBUG,
                agent,
            }));
            const result = await slackClient.sendMessage({
                options: {
                    channelIds: this.slackChannels,
                    customLayout: this.customLayout,
                    customLayoutAsync: this.customLayoutAsync,
                    maxNumberOfFailures: this.maxNumberOfFailuresToShow,
                    disableUnfurl: this.disableUnfurl,
                    summaryResults: resultSummary,
                    showInThread: this.showInThread,
                },
            });
            // eslint-disable-next-line no-console
            console.log(JSON.stringify(result, null, 2));
            if (this.showInThread && resultSummary.failures.length > 0) {
                for (let i = 0; i < result.length; i += 1) {
                    // eslint-disable-next-line no-await-in-loop
                    await slackClient.attachDetailsToThread({
                        channelIds: [result[i].channel],
                        ts: result[i].ts,
                        summaryResults: resultSummary,
                        maxNumberOfFailures: this.maxNumberOfFailuresToShow,
                    });
                }
            }
        }
    }
    preChecks() {
        if (this.sendResults === 'off') {
            return { okToProceed: false, message: '❌ Slack reporter is disabled' };
        }
        if (!this.slackWebHookUrl &&
            !this.slackOAuthToken &&
            !process.env.SLACK_BOT_USER_OAUTH_TOKEN) {
            return {
                okToProceed: false,
                message: '❌ Neither slack webhook url, slackOAuthToken nor process.env.SLACK_BOT_USER_OAUTH_TOKEN were found',
            };
        }
        if (this.slackWebHookUrl &&
            (process.env.SLACK_BOT_USER_OAUTH_TOKEN || this.slackOAuthToken)) {
            return {
                okToProceed: false,
                message: '❌ You can only enable a single option, either provide a slack webhook url, slackOAuthToken or process.env.SLACK_BOT_USER_OAUTH_TOKEN were found',
            };
        }
        if (!this.sendResults ||
            !['always', 'on-failure', 'off'].includes(this.sendResults)) {
            return {
                okToProceed: false,
                message: "❌ \"sendResults\" is not valid. Expecting one of ['always', 'on-failure', 'off'].",
            };
        }
        if (!this.sendResults || this.slackChannels?.length === 0) {
            return {
                okToProceed: false,
                message: '❌ Slack channel(s) was not provided in the config',
            };
        }
        if (this.customLayout && typeof this.customLayout !== 'function') {
            return {
                okToProceed: false,
                message: '❌ Custom layout is not a function',
            };
        }
        if (this.customLayoutAsync &&
            typeof this.customLayoutAsync !== 'function') {
            return {
                okToProceed: false,
                message: '❌ customLayoutAsync is not a function',
            };
        }
        if (this.meta && !Array.isArray(this.meta)) {
            return { okToProceed: false, message: '❌ Meta is not an array' };
        }
        return { okToProceed: true };
    }
    log(message) {
        // eslint-disable-next-line no-console
        console.log(message);
        if (message) {
            this.logs.push(message);
        }
    }
    // eslint-disable-next-line class-methods-use-this
    printsToStdio() {
        return false;
    }
}
exports.default = SlackReporter;
