"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function generateCustomLayoutSimpleExample(summaryResults) {
    return [
        {
            type: 'section',
            text: {
                type: 'mrkdwn',
                text: summaryResults.failed === 0
                    ? ':tada: All tests passed!'
                    : `😭${summaryResults.failed} failure(s) out of ${summaryResults.tests.length} tests`,
            },
        },
    ];
}
exports.default = generateCustomLayoutSimpleExample;
