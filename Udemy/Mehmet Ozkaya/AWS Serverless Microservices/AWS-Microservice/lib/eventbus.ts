import { IFunction } from "aws-cdk-lib/aws-lambda";
import { EventBus, Rule } from "aws-cdk-lib/aws-events";
import { LambdaFunction } from "aws-cdk-lib/aws-events-targets";
import { Construct } from "constructs";

interface SBEventBusProps {
  publisherFunction: IFunction;
  targetFunction: IFunction;
}
export class SBEventBus extends Construct {
  constructor(scope: Construct, id: string, props: SBEventBusProps) {
    super(scope, id);

    const bus = new EventBus(this, "SBEventBus", {
      eventBusName: "SBEventBus",
    });

    const chekoutBasketRule = new Rule(this, "CheckoutBasketRule", {
      eventBus: bus,
      enabled: true,
      description: "When Basket Microservice checkout the basket",
      eventPattern: {
        source: ["com.sb.basket.checkoutbasket"],
        detailType: ["CheckoutBasket"],
      },
      ruleName: "CheckoutBasketRule",
    });
    // need to pass target to Ordering Lambda service
    chekoutBasketRule.addTarget(new LambdaFunction(props.targetFunction));

    bus.grantPutEventsTo(props.publisherFunction);
    // AccessDeniedException - is not authorized to perform: events:PutEvents
  }
}
