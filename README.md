# Pulimi Policy as Code Stack Validation Example




## When in violation of the Stack Policy

```bash
Policies:
    ❌ pulumi-stackvalidation-example-diana@v0.0.1 (local: policypack)
        - [mandatory]  pulumi-stackvalidation-example-diana  (pulumi:pulumi:Stack: pulumi-stackvalidation-example-dev)
          every bucket must have at least one enabled replication rule or be a destination bucket of an enabled rule
          arn:aws:s3:::pulumi-stackvalidation-example-dest-diana-d34e496
        - [mandatory]  pulumi-stackvalidation-example-diana  (pulumi:pulumi:Stack: pulumi-stackvalidation-example-dev)
          every bucket must have at least one enabled replication rule or be a destination bucket of an enabled rule
          arn:aws:s3:::pulumi-stackvalidation-example-diana-b6efb4e

```

## When in compliance of the Stack Policy

```bash
Policies:
    ✅ pulumi-stackvalidation-example-diana@v0.0.1 (local: policypack)
```