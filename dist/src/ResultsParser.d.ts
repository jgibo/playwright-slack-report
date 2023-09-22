/// <reference types="node" />
import { failure, flaky, pass, SummaryResults } from '.';
export declare type testResult = {
    suiteName: string;
    name: string;
    browser?: string;
    projectName: string;
    endedAt: string;
    reason: string;
    retry: number;
    retries: number;
    startedAt: string;
    status: 'passed' | 'failed' | 'timedOut' | 'skipped';
    attachments?: {
        body: string | undefined | Buffer;
        contentType: string;
        name: string;
        path: string;
    }[];
};
export declare type testSuite = {
    testSuite: {
        title: string;
        tests: testResult[];
        testRunId?: number;
    };
};
export default class ResultsParser {
    private result;
    private separateFlakyTests;
    constructor(options?: {
        separateFlakyTests: boolean;
    });
    getParsedResults(): Promise<SummaryResults>;
    getFailures(): Promise<Array<failure>>;
    getFlakes(): Promise<Array<flaky>>;
    getPasses(): Promise<Array<pass>>;
    static getTestName(failedTest: any): any;
    updateResults(data: {
        testSuite: any;
    }): void;
    addTestResult(suiteName: any, testCase: any, projectBrowserMapping: any): void;
    safelyDetermineFailure(result: {
        errors: any[];
        error: {
            message: string;
            stack: string;
        };
    }): string;
    cleanseReason(rawReaseon: string): string;
    determineBrowser(projectName: string, browserMappings: {
        projectName: string;
        browser: string;
    }[]): {
        projectName: string;
        browser: string;
    };
    /** removes tests from the passed array that only passed on a retry (flaky).
     * Does not modify param passed, returns a new passed array. */
    doSeparateFlakyTests(passes: Array<pass>, flakes: Array<flaky>): pass[];
}
