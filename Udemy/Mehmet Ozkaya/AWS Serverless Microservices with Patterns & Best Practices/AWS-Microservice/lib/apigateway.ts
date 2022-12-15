import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface SBApiGatewayProps {
  productMicroservice: IFunction;
}
export class SBApiGateway extends Construct {
  constructor(scope: Construct, id: string, props: SBApiGatewayProps) {
    super(scope, id);
    //Product microservices api gateway
    // root name = product
    // GET /product
    // POST /product

    // Single product with id parameter
    // GET   /product/{id}
    //  PUT   /product/{id}
    // DELETE /product/{id}

    const apigw = new LambdaRestApi(this, "productApi", {
      restApiName: "Product Service",
      handler: props.productMicroservice,
      proxy: false,
    });

    const product = apigw.root.addResource("product");
    product.addMethod("GET");
    product.addMethod("POST");

    const singleProduct = product.addResource("{id}"); //product/{id}
    singleProduct.addMethod("GET"); // GET   /product/{id}
    singleProduct.addMethod("PUT"); //  PUT   /product/{id}
    singleProduct.addMethod("DELETE"); // DELETE /product/{id}
  }
}
