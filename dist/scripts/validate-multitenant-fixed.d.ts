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
declare class FixedMultiTenantValidator {
    private results;
    private startTime;
    runValidation(): Promise<ValidationResults>;
    private runTest;
    private testDatabaseLayer;
    private testServiceLayerIntegration;
    private testAuthenticationSystem;
    private testDataIsolation;
    private testRoleBasedAccess;
    private testEdgeCases;
    private testPerformance;
}
export { FixedMultiTenantValidator };
//# sourceMappingURL=validate-multitenant-fixed.d.ts.map