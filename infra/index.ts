import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as random from "@pulumi/random";

const name = "de"

// Create a KMS Customer Master Key (CMK)
// const kmsKey = new aws.kms.Key("pulumi-stackvalidation-example-" + name, {
//     description: "Exercise 2 -  KMS key",
//     multiRegion: true,
//     deletionWindowInDays: 7, // valid values are 7-30

// });

// Create an IAM role for S3 to assume
const replicationRole = new aws.iam.Role("pulumi-stackvalidation-example-" + name, {
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
                Service: "s3.amazonaws.com",
            },
        }],
    }),
});

// Attach the policy to the role for replication permissions
new aws.iam.RolePolicyAttachment("pulumi-stackvalidation-example-" + name, {
    role: replicationRole.id,
    policyArn: aws.iam.ManagedPolicy.AmazonS3FullAccess,
});

// Create a destination bucket in another region with versioning enabled
const destinationBucket = new aws.s3.Bucket("pulumi-stackvalidation-example-dest-" + name, {
    versioning: {
        enabled: true,
    },
    // Enabling server-side encryption by default using AES256
    // serverSideEncryptionConfiguration: {
    //     rule: {
    //         applyServerSideEncryptionByDefault: {
    //             sseAlgorithm: "aws:kms",
    //             kmsMasterKeyId: kmsKey.id,
    //         },
    //         bucketKeyEnabled: true,
    //     },
    // },
}, {
    provider: new aws.Provider("pulumi-stackvalidation-example-dest" + name, {
        region: aws.Region.USWest1, // example destination region
    }),
});



const sourceBucket = new aws.s3.Bucket("pulumi-stackvalidation-example-" + name, {
    acl: "public-read",
    website: {
        indexDocument: "index.html"
    },
    tags: {
        "Owner": name,
    },
    versioning: {
        enabled: true,
    },
    replicationConfiguration: {
        role: replicationRole.arn,
        rules: [{
            status: "Enabled", // must be Enabled, else the the Stack Policy will report a violation
            filter: {
                prefix: "", // an empty string means to replicate everything
            },
            destination: {
                bucket: destinationBucket.arn,
            },
        }],
    },
    // Enabling server-side encryption by default using AES256
    // serverSideEncryptionConfiguration: {
    //     rule: {
    //         applyServerSideEncryptionByDefault: {
    //             sseAlgorithm: "aws:kms",
    //             kmsMasterKeyId: kmsKey.id,
    //         },
    //         bucketKeyEnabled: true,
    //     },
    // },


});

const ownershipControls = new aws.s3.BucketOwnershipControls("ownership-controls", {
    bucket: sourceBucket.id,
    rule: {
        objectOwnership: "ObjectWriter"
    }
});

const publicAccessBlock = new aws.s3.BucketPublicAccessBlock("public-access-block", {
    bucket: sourceBucket.id,
    blockPublicAcls: false,

});


// Upload index.html to the S3 bucket
const indexHtml = new aws.s3.BucketObject("index.html", {
    bucket: sourceBucket,
    source: new pulumi.asset.FileAsset("../app/index.html"),
    contentType: "text/html",
});

// Upload script.js to the S3 bucket
const scriptJs = new aws.s3.BucketObject("script.js", {
    bucket: sourceBucket,
    source: new pulumi.asset.FileAsset("../app/script.js"),
    contentType: "text/javascript",

});

export const testUrl = sourceBucket.websiteEndpoint;

// Enable replication on the source bucket
const bucketReplicationRolePolicy = new aws.iam.Policy("pulumi-stackvalidation-example-" + name, {
    policy: pulumi.all([sourceBucket.arn, destinationBucket.arn, replicationRole.arn])
        .apply(([sourceBucketArn, destinationBucketArn, replicationRoleArn]) =>
            JSON.stringify({
                Version: "2012-10-17",
                Statement: [{
                    Action: [
                        "s3:GetReplicationConfiguration",
                        "s3:ListBucket",
                    ],
                    Effect: "Allow",
                    Resource: [
                        sourceBucketArn,
                    ],
                }, {
                    Action: [
                        "s3:GetObjectVersionForReplication",
                        "s3:GetObjectVersionAcl",
                        "s3:GetObjectVersionTagging",
                    ],
                    Effect: "Allow",
                    Resource: [
                        `${sourceBucketArn}/*`,
                    ],
                }, {
                    Action: [
                        "s3:ReplicateObject",
                        "s3:ReplicateDelete",
                        "s3:ReplicateTags",
                        "s3:GetObjectVersionForReplication",
                    ],
                    Effect: "Allow",
                    Resource: [
                        `${destinationBucketArn}/*`,
                    ],
                }],
            })
        ),
});

// new aws.iam.RolePolicyAttachment("pulumi-stackvalidation-example-" + name, {
//     role: replicationRole.id,
//     policyArn: bucketReplicationRolePolicy.arn,
// });
