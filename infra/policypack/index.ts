import { PolicyPack, ReportViolation, StackValidationArgs, StackValidationPolicy } from "@pulumi/policy";
import { policyManager } from "@pulumi/compliance-policy-manager";
import * as aws from "@pulumi/aws";
import { ResolvedResource } from "@pulumi/pulumi/queryable";

const name = "diana"


// Approach 1:
// Policy that enforces replication on the source bucket except for destination buckets
// Due the cross-resource checks, this policy is performed at the stack level
// Yes, there is a concern that this policy is not as efficient as it could be,
// but it is a good example of how to do cross-resource checks

// Scalability and Perfromance concerns exists, what if we have 10000s of buckets? 

const enableReplicationConfigurationExceptDestinationBuckets: StackValidationPolicy = {
    name: "pulumi-stackvalidation-example-" + name,
    description: "every bucket must have at least one enabled replication rule or be a destination bucket of an enabled rule",
    enforcementLevel: "mandatory",
    validateStack: (args: StackValidationArgs, reportViolation: ReportViolation) => {

        const buckets = args.resources
            //StackValidationArgs.PolicyResource[]
            .map(resource => resource.asType(aws.s3.Bucket))
            // Returns the resource if the type of this resource is the same as resourceClass, otherwise undefined.
            // Filter out the undefined values and keep only the ResolvedResource<aws.s3.Bucket> values
            .filter((bucket): bucket is ResolvedResource<aws.s3.Bucket> => bucket !== undefined) ?? [];


        let destinationBucketARNList: string[] = [];
        let sansReplicationBucketARNList: string[] = [];

        for (const bucket of buckets) {
            // Buckets that have at least one enabled replication rule...
            let noRules = true;
            if (bucket.replicationConfiguration != null) {
                const brc = bucket.replicationConfiguration;
                if (brc.rules != null) {
                    for (const rule of brc.rules) {
                        if (rule.status === "Enabled") {
                            noRules = false;
                            destinationBucketARNList.push(rule.destination.bucket);
                        }
                    }
                }
            }
            if (noRules) {
                sansReplicationBucketARNList.push(bucket.arn);
            }
        }

        // Report violations for unreplicated buckets that are not destinations of enabled replication rules
        for (const arn of sansReplicationBucketARNList) {
            if (!destinationBucketARNList.includes(arn)) {
                reportViolation(arn);
            }
        }
    },
}

// Approach 2: 
// TODO - Uses Tags to identify and skip the destination bucket


new PolicyPack("pulumi-stackvalidation-example-" + name, {
    policies: [
        enableReplicationConfigurationExceptDestinationBuckets,

        // Only adding these to make it more interesting...
        // ...policyManager.selectPoliciesByName(
        //     [
        //         "aws-s3-bucket-configure-replication-configuration",
        //         "aws-s3-bucket-configure-server-side-encryption-customer-managed-key",
        //         "aws-s3-bucket-configure-server-side-encryption-kms",
        //         "aws-s3-bucket-disallow-public-read",
        //         "aws-s3-bucket-enable-replication-configuration",
        //         "aws-s3-bucket-enable-server-side-encryption",
        //         "aws-s3-bucket-enable-server-side-encryption-bucket-key",
        //         "awsnative-s3-bucket-configure-replication-configuration",
        //         "awsnative-s3-bucket-configure-server-side-encryption-customer-managed-key",
        //         "awsnative-s3-bucket-configure-server-side-encryption-kms",
        //         "awsnative-s3-bucket-disallow-public-read",
        //         "awsnative-s3-bucket-enable-replication-configuration",
        //         "awsnative-s3-bucket-enable-server-side-encryption",
        //         "awsnative-s3-bucket-enable-server-side-encryption-bucket-key",
        //     ]  // Add the policy names you want to include here
        //     , "mandatory"),
    ]
});

/**
 * Optional✔️: Display additional stats and helpful
 * information when the policy pack is evaluated.
 */
policyManager.displaySelectionStats({
    displayGeneralStats: true,
    displayModuleInformation: true,
    displaySelectedPolicyNames: true,
});
