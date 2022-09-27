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

export type MyFunctionContext = {
  DEFAULT_STUDIO_FLOW: string;
  ACCOUNT_SID: string;
  AUTH_TOKEN: string;
};

// ***********************************************************
// There are additional attributes,
// but these are the only ones we care about for this
// ***********************************************************
export type PreHookEventType = {
  EventType?: string;
  Media?: string;
  ConversationSid?: string;
  ChatServiceSid?: string;
};

// ***********************************************************
// Expected params of the decoded Media object
// ***********************************************************
export type Media = {
  Sid: string;
  Filename: string;
  ContentType: string;
  Size: number;
};

// ***********************************************************
//
// SERVERLESS HANDLER ENTRY POINT
//
// ***********************************************************
export const handler: ServerlessFunctionSignature<
  MyFunctionContext,
  PreHookEventType
> = async function (
  context: Context<MyFunctionContext>,
  event: PreHookEventType,
  callback: ServerlessCallback
) {
  console.log("Incoming pre-hook", event);
  const response = new Twilio.Response();
  const client = context.getTwilioClient();

  try {
    if (!event.EventType) throw "EventType not found";
    // ***********************************************************
    // Because the webhooks only accept 1x URL, we use a switch
    // statement to determine which incoming event we are responding to
    // For example:
    // - onMessageAdd
    // - onConversationAdd
    // - onMessageUpdate
    // ***********************************************************
    switch (event.EventType) {
      case "onMessageAdd":
        if (event.Media) {
          const media = JSON.parse(event.Media);
          let reject = false;
          let remove = false;
          let files = "";

          // ***********************************************************
          // Iterate through each file in the message, normally this
          // is only 1x file in the media tag, but could be multiple
          // ***********************************************************
          await media.map((file: Media) => {
            console.log(
              `Processing media MIME: ${file.ContentType} NAME: ${file.Filename}`
            );
            // ****************************************************************
            //
            // Logic here for intercepting media and marking as needing scan
            // For the purpose of this demo we:
            // 1. Reject all files with names containing 'block' or 'reject'
            // 2. Accept but warn the participants for files containing 'warn'
            // 3. Accept blindly all files otherwise
            //
            // ****************************************************************
            files += " " + file.Filename;

            if (
              file.Filename.includes("block") ||
              file.Filename.includes("reject")
            ) {
              console.log("File blocked, rejecting from attaching");
              remove = true;
              reject = true;
            } else if (file.Filename.includes("warn")) {
              console.log("Media marked to be scanned/archived");
              remove = true;
              reject = false;
              console.log("After attaching message");
            } else {
              console.log("File ignored/accepted");
            }
          });

          // ***********************************************************
          // Here we are checking if the file is to be removed
          // If so we either tell the user the file is blocked or
          // we tell them to be careful about the attachments
          // ***********************************************************
          if (remove) {
            // Remove messages marked as needing to be removed
            const message = reject
              ? "Blocking the following attached files:" + files
              : "Warning, don't click on files you aren't expecting. " + files;

            if (!event.ConversationSid) throw "Conversation SID missing";
            await client.conversations.v1
              .conversations(event.ConversationSid)
              .messages.create({
                author: "File scan webhook",
                body: message,
              })
              .then((message) =>
                console.log(`Message removed notice ${message.sid}`)
              );
          } else {
            // ***********************************************************
            // You can adjust attributes here for downstream processing
            // For example set an attribute so:
            // 1. The post-webhook can take an action (e.g. Archive)
            // 2. Flex desktop can display a different UX
            // 3. Client application can present different viewers
            // ***********************************************************
            response.setBody({
              attributes: JSON.stringify({
                warn: "Set some attribute here for processing",
              }),
            });
          }

          // ***********************************************************
          // The key to rejecting files is returning a non-2xx response
          // ***********************************************************
          response.setStatusCode(reject ? 406 : 200); // HTTP
        }
        break;
      default:
        console.log("Ignoring request as event type not handled");
        break;
    }

    // ***********************************************************
    // Caution should be taken here to ensure a 200 response in most cases
    // A non-200 response (e.g. 500) will cause the message to be rejected
    // ***********************************************************
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
