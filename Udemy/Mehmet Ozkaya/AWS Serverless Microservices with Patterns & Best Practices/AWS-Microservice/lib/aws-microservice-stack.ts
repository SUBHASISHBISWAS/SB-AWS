import * as cdk from "aws-cdk-lib";
import { RemovalPolicy } from "aws-cdk-lib";
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { Code, Runtime, Function } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";
import { SBApiGateway } from "./apigateway";
import { SBDatabase } from "./database";
import { SBMicroservice } from "./microservice";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsMicroserviceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const database = new SBDatabase(this, "Database");

    const microservices = new SBMicroservice(this, "Microservice", {
      productTable: database.productTable,
    });

    const apigateway = new SBApiGateway(this, "ApiGateway", {
      productMicroservice: microservices.productMicroservice,
    });
  }
}
