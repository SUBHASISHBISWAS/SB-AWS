import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Code, Function, Runtime } from 'aws-cdk-lib/aws-lambda';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class LambdaCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    const lambdaFunc=new Function(this,"LambdaFunction",{
    runtime: Runtime.NODEJS_18_X,
    code: Code.fromAsset('lambda'),
    handler:'LambdaFunc.handler'
    });

    new LambdaRestApi(this,'SBApiGateway',{
      handler:lambdaFunc
    })
    
  }
}
