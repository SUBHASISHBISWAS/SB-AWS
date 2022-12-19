import {
  DeleteItemCommand,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { PutEventsCommand } from "@aws-sdk/client-eventbridge";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { ddbClient } from "./ddbClient";
import { ebClient } from "./eventBridgeClient";
exports.handler = async function (event) {
  console.log("request:", JSON.stringify(event, undefined, 2));

  //TODO - - • switch case event. httpmethod to perform- add/ remove • basket
  //TODO and • checkout basket operations with-using ddbClient•object

  try {
    var body = {};
    switch (event.httpMethod) {
      case "GET":
        // GET /basket/{userName}
        if (event.pathParameters != null) {
          body = await getBasket(event.pathParameters.userName);
        } else {
          // GET /basket
          body = await getAllBaskets();
        }
        break;
      case "POST":
        if (event.path == "/basket/checkout") {
          // POST /basket/checkout
          body = await checkoutBasket(event);
        } else {
          // POST /basket
          body = await createBasket(event);
        }
        break;
      case "DELETE":
        // DELETE /basket/{userName}
        body = await deleteBasket(event.pathParameters.userName);
        break;

      default:
        throw new Error(`Unsupported route: "${event.httpMethod}"`);
    }

    console.log(body);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Successfully finished operation: "${event.httpMethod}"`,
        body: body,
      }),
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to perform operation.",
        errorMsg: error.message,
        errorStack: error.stack,
      }),
    };
  }
};

const getBasket = async (userName) => {
  console.log("getBusket");
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ userName: userName }),
    };

    const { Item } = await ddbClient.send(new GetItemCommand(params));

    console.log(Item);
    return Item ? unmarshall(Item) : {};
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const getAllBaskets = async () => {
  console.log("getAllBaskets");
  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
    };

    const { Items } = await ddbClient.send(new ScanCommand(params));

    console.log(Items);
    return Items ? Items.map((item) => unmarshall(item)) : {};
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const createBasket = async (event) => {
  console.log(`createBasket Function. event : "${event}"`);

  try {
    const requestBody = JSON.parse(event.body);

    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Item: marshall(requestBody || {}),
    };

    const createResult = await ddbClient.send(new PutItemCommand(params));

    console.log(createResult);
    return createResult;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const deleteBasket = async (userName) => {
  console.log(`deleteBasket Function.  userName: "${userName}"`);

  try {
    const params = {
      TableName: process.env.DYNAMODB_TABLE_NAME,
      Key: marshall({ userName: userName }),
    };

    const deleteResult = await ddbClient.send(new DeleteItemCommand(params));

    console.log(deleteResult);
    return deleteResult;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const checkoutBasket = async (event) => {
  console.log(`checkoutBasket Function.  event: "${event}"`);

  // publish an event to eventbridge - this will subscribe by order microservice
  //and start ordering process.

  // expected request payload : { userName : swn, attributes[firstName, lastName, email ..]
  const checkoutRequest = JSON.parse(event.body);
  if (checkoutRequest == null || checkoutRequest.userName == null) {
    throw new Error(
      `userName should exist in checkoutRequest: "${checkoutRequest}"`
    );
  }
  // 1- Get existing basket with items
  const basket = await getBasket(checkoutRequest.userName);

  // 2- create an event json object with basket items,
  // calculate totalprice, prepare order create json data to send ordering ms

  var checkoutPayload = prepareOrderPayload(checkoutRequest, basket);

  // 3- publish an event to eventbridge - this will subscribe by order microservice and start ordering process.

  const publishedEvent = await publishCheckoutBasketEvent(checkoutPayload);
  // 4- remove existing basket

  await deleteBasket(checkoutRequest.userName);
};

const prepareOrderPayload = (checkoutRequest, basket) => {
  console.log("prepareOrderPayload");
  try {
    // prepare order payload -> calculate totalprice and combine checkoutRequest and basket items
    // aggregate and enrich request and basket data in order to create order payload
    if (basket == null || basket.items == null) {
      throw new Error(`basket should exist in items: "${basket}"`);
    }

    let totalPrice = 0;
    basket.items.forEach((item) => (totalPrice = totalPrice + item.price));
    checkoutRequest.totalPrice = totalPrice;
    console.log(checkoutRequest);
    // copies all properties from basket into checkoutRequest
    Object.assign(checkoutRequest, basket);
    console.log("Success prepareOrderPayload, orderPayload:", checkoutRequest);
    return checkoutRequest;
  } catch (e) {
    console.error(e);
    throw e;
  }
};

const publishCheckoutBasketEvent = async (checkoutPayload) => {
  console.log("publishCheckoutBasketEvent with payload :", checkoutPayload);
  try {
    // eventbridge parameters for setting event to target system
    const params = {
      Entries: [
        {
          Source: process.env.EVENT_SOURCE,
          Detail: JSON.stringify(checkoutPayload),
          DetailType: process.env.EVENT_DETAILTYPE,
          Resources: [],
          EventBusName: process.env.EVENT_BUSNAME,
        },
      ],
    };

    console.log("PutEventsCommand Params : " + params);
    const data = await ebClient.send(new PutEventsCommand(params));

    console.log("Success, event sent; requestID:", data);
    return data;
  } catch (e) {
    console.error(e);
    throw e;
  }
};
