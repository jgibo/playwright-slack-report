/// <reference types="node" />
export declare type SummaryResults = {
    passed: number;
    failed: number;
    flaky: number | undefined;
    skipped: number;
    failures: Array<failure>;
    meta?: Array<{
        key: string;
        value: string;
    }>;
    tests: Array<{
        suiteName: string;
        name: string;
        browser?: string;
        projectName?: string;
        endedAt: string;
        reason: string;
        retry: number;
        startedAt: string;
        status: 'passed' | 'failed' | 'timedOut' | 'skipped';
        attachments?: {
            body: string | undefined | Buffer;
            contentType: string;
            name: string;
            path: string;
        }[];
    }>;
};
export declare type failure = {
    test: string;
    failureReason: string;
};
export declare type flaky = {
    test: string;
    retry: number;
};
export declare type pass = {
    test: string;
};
