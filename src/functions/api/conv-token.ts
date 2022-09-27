/**
 * @file Issue tokens for conversation service
 * @author Chris Connolly <cconnolly@twilio.com>
 * @version 1.0.0
 */

// Imports global types
import "@twilio-labs/serverless-runtime-types";

// ***********************************************************
// Items defined in .env file
// ***********************************************************

export type MyFunctionContext = {
  ACCOUNT_SID: string;
  API_KEY: string;
  API_SECRET: string;
  CONVERSATION_SERVICE_ID: string;
};

export type MyEvent = {
  identity: string;
};

import {
  Context,
  ServerlessCallback,
  ServerlessFunctionSignature,
} from "@twilio-labs/serverless-runtime-types/types";
export const handler: ServerlessFunctionSignature<MyFunctionContext, MyEvent> =
  async function (
    context: Context<MyFunctionContext>,
    event: MyEvent,
    callback: ServerlessCallback
  ) {
    const twilioAccountSid = context.ACCOUNT_SID;
    const twilioApiKey = context.API_KEY;
    const twilioApiSecret = context.API_SECRET;
    const identity = event.identity;

    const AccessToken = Twilio.jwt.AccessToken;
    const ChatGrant = AccessToken.ChatGrant;

    const token = new AccessToken(
      twilioAccountSid,
      twilioApiKey,
      twilioApiSecret,
      { identity: identity }
    );

    const serviceSid = context.CONVERSATION_SERVICE_ID;
    const chatGrant = new ChatGrant({
      serviceSid: serviceSid,
    });

    token.addGrant(chatGrant);

    const headers = {
      "Access-Control-Allow-Origin": "*", // change this to your client-side URL
      "Access-Control-Allow-Methods": "GET,PUT,POST,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    const response = new Twilio.Response();
    response.setHeaders(headers);
    response.setBody(token.toJwt());

    return callback(null, response);
  };
