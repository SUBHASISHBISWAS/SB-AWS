import * as cdk from "aws-cdk-lib";
import { RemovalPolicy } from "aws-cdk-lib";
import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { AttributeType, BillingMode, Table } from "aws-cdk-lib/aws-dynamodb";
import { EventBus, Rule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Code, Runtime, Function } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";
import { SBApiGateway } from "./apigateway";
import { SBDatabase } from "./database";
import { SBEventBus } from "./eventbus";
import { SBMicroservice } from "./microservice";
import { SBQueue } from "./queue";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class AwsMicroserviceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const database = new SBDatabase(this, "Database");

    const microservices = new SBMicroservice(this, "Microservice", {
      productTable: database.productTable,
      basketTable: database.basketTable,
      orderTable: database.orderTable,
    });

    const apigateway = new SBApiGateway(this, "ApiGateway", {
      productMicroservice: microservices.productMicroservice,
      basketMicroservice: microservices.basketMicroservice,
      orderingMicroservice: microservices.orderingMicroservice,
    });

    const queue = new SBQueue(this, "Queue", {
      consumer: microservices.orderingMicroservice,
    });

    const eventBus = new SBEventBus(this, "EventBus", {
      publisherFunction: microservices.basketMicroservice,
      targetQueue: queue.orderQueue,
    });
  }
}
