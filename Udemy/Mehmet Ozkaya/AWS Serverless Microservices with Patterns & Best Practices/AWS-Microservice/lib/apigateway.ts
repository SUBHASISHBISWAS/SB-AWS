import { LambdaRestApi } from "aws-cdk-lib/aws-apigateway";
import { IFunction } from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";

interface SBApiGatewayProps {
  productMicroservice: IFunction;
  basketMicroservice: IFunction;
}
export class SBApiGateway extends Construct {
  constructor(scope: Construct, id: string, props: SBApiGatewayProps) {
    super(scope, id);

    this.createProductApi(props.productMicroservice);
    this.createBasketApi(props.basketMicroservice);
  }

  private createProductApi(productMicroservice: IFunction) {
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
      handler: productMicroservice,
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

  private createBasketApi(basketMicroservice: IFunction) {
    // Basket microservices api gateway
    // root name = basket
    // GET /basket
    // POST /basket
    // // Single basket with userName parameter - resource name = basket/{userName}
    // GET /basket/{userName}
    // DELETE /basket/{userName}
    // checkout basket async flow
    // POST /basket/checkout

    const apigw = new LambdaRestApi(this, "basketApi", {
      restApiName: "Basket Service",
      handler: basketMicroservice,
      proxy: false,
    });

    const product = apigw.root.addResource("basket");
    product.addMethod("GET");
    product.addMethod("POST");

    const singleBasket = product.addResource("{userName}"); //basket/{userName}
    singleBasket.addMethod("GET"); // GET   /basket/{userName}
    singleBasket.addMethod("DELETE"); // DELETE /basket/{userName}

    const basketCheckout = product.addResource("checkout"); //basket/{userName}
    basketCheckout.addMethod("POST"); // GET   /basket/checkout
    // expected request payload : { userName : swn }
    
  }
}
