interface TestResult {
    name: string;
    passed: boolean;
    details: string;
    duration: number;
}
interface ValidationResults {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    results: TestResult[];
    duration: number;
}
declare class MultiTenantValidator {
    private results;
    private startTime;
    runValidation(): Promise<ValidationResults>;
    private runTest;
    private testDatabaseLayer;
    private testServiceLayer;
    private testAuthenticationSystem;
    private testDataIsolation;
    private testRoleBasedAccess;
    private testAPIEndpoints;
    private testEdgeCases;
    private testPerformance;
}
export { MultiTenantValidator };
//# sourceMappingURL=validate-multitenant.d.ts.map