/**
 * @file Conversation pre-hooks for attachment processing
 * @author Chris Connolly <cconnolly@twilio.com>
 * @version 1.0.0
 */

// Imports global types
import "@twilio-labs/serverless-runtime-types";
// Fetches specific types
import {
  Context,
  ServerlessCallback,
  ServerlessFunctionSignature,
} from "@twilio-labs/serverless-runtime-types/types";

import axios from "axios";
import url from "url";

export type MyFunctionContext = {
  DEFAULT_STUDIO_FLOW: string;
  ACCOUNT_SID: string;
  AUTH_TOKEN: string;
};

// ***********************************************************
// There are additional attributes,
// but these are the only ones we care about for this
// ***********************************************************
export type PostHookEventType = {
  EventType?: string;
  Media?: string;
  ConversationSid?: string;
};

// ***********************************************************
//
// SERVERLESS HANDLER ENTRY POINT
//
// ***********************************************************
export const handler: ServerlessFunctionSignature<
  MyFunctionContext,
  PostHookEventType
> = async function (
  context: Context<MyFunctionContext>,
  event: PostHookEventType,
  callback: ServerlessCallback
) {
  console.log("Incoming post-hook", event);
  const response = new Twilio.Response();

  try {
    if (!event.EventType) throw "EventType not found";
    // ***********************************************************
    // Because the webhooks only accept 1x URL, we use a switch
    // statement to determine which incoming event we are responding to
    // For example:
    // - onMessageAdded
    // - onConversationAdded
    // - onMessageUpdated
    // ***********************************************************
    switch (event.EventType) {
      // ***********************************************************
      // When conversations created, add our text bot
      // ***********************************************************
      case "onConversationAdded":
        console.log("New conversation created, adding Studio flow");
        try {
          const params = new url.URLSearchParams({
            "Configuration.FlowSid": context.DEFAULT_STUDIO_FLOW,
            Target: "studio",
          });

          const resp = await axios.post(
            `https://conversations.twilio.com/v1/Conversations/${event.ConversationSid}/Webhooks`,
            params,
            {
              auth: {
                username: context.ACCOUNT_SID,
                password: context.AUTH_TOKEN,
              },
            }
          );
          console.log("Updating conversation webhook");
        } catch (err) {
          console.log("Error calling rest API to update conversation", err);
        }
        break;
      default:
        console.log("Ignoring request as event type not handled");
        break;
    }
  } catch (err) {
    console.log("Error running intercept: ", err);
    response.setBody({
      status: "error",
      message: "Error intercepting conversation, see logs for details",
    });
    response.setStatusCode(500);
  }
  return callback(null, response);
};
