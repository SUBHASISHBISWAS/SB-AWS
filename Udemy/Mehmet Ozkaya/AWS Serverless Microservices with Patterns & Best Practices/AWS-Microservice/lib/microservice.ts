import { ITable } from "aws-cdk-lib/aws-dynamodb";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import { Construct } from "constructs";
import { join } from "path";

interface SBMicroserviceProps {
  productTable: ITable;
  basketTable: ITable;
  orderTable: ITable;
}
export class SBMicroservice extends Construct {
  public readonly productMicroservice: NodejsFunction;
  public readonly basketMicroservice: NodejsFunction;
  public readonly orderingMicroservice: NodejsFunction;
  constructor(scope: Construct, id: string, props: SBMicroserviceProps) {
    super(scope, id);

    this.productMicroservice = this.createProductFunction(props.productTable);
    this.basketMicroservice = this.createBasketFunction(props.basketTable);
    this.orderingMicroservice = this.createOrderingFunction(props.orderTable);
  }

  private createProductFunction(productTable: ITable): NodejsFunction {
    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ["aws-sdk"],
      },
      environment: {
        PRIMARY_KEY: "id",
        DYNAMODB_TABLE_NAME: productTable.tableName,
      },
      runtime: Runtime.NODEJS_18_X,
    };
    const productFunction = new NodejsFunction(this, "productLambdaFunction", {
      entry: join(__dirname, `/../src/product/index.js`),
      ...nodeJsFunctionProps,
    });

    productTable.grantReadWriteData(productFunction);
    return productFunction;
  }

  private createBasketFunction(basketTable: ITable) {
    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ["aws-sdk"],
      },
      environment: {
        PRIMARY_KEY: "userName",
        DYNAMODB_TABLE_NAME: basketTable.tableName,
        EVENT_SOURCE: "com.sb.basket.checkoutbasket",
        EVENT_DETAILTYPE: "CheckoutBasket",
        EVENT_BUSNAME: "SBEventBus",
      },
      runtime: Runtime.NODEJS_18_X,
    };
    const basketFunction = new NodejsFunction(this, "basketLambdaFunction", {
      entry: join(__dirname, `/../src/basket/index.js`),
      ...nodeJsFunctionProps,
    });

    basketTable.grantReadWriteData(basketFunction);
    return basketFunction;
  }
  private createOrderingFunction(orderTable: ITable) {
    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: ["aws-sdk"],
      },
      environment: {
        PRIMARY_KEY: "userName",
        SORT_KEY: "orderDate",
        DYNAMODB_TABLE_NAME: orderTable.tableName,
      },
      runtime: Runtime.NODEJS_18_X,
    };
    const orderFunction = new NodejsFunction(this, "orderLambdaFunction", {
      entry: join(__dirname, `/../src/ordering/index.js`),
      ...nodeJsFunctionProps,
    });

    orderTable.grantReadWriteData(orderFunction);
    return orderFunction;
  }
}
