import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Bucket } from 'aws-cdk-lib/aws-s3';
export class HelloCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const queue=new Queue(this,"HelloCDKQueue",{
      visibilityTimeout:Duration.seconds(300)
    })

    const newBucket=new Bucket(this,"SBBucket",{
      versioned:true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects:true
    })
    
  }
}
