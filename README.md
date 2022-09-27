# Conversations File Bot

Intercept files added to a conversation before they are published to all participants

## Purpose

It may be desireable to prevent files from reaching participants, for example if one wished to perform OCR or similar on files for pre-processing, similarly it may be desireable to block specific files or even to send to a virus scanner

## How it works

When the Conversations Client (SDK, Rest API) adds media to a conversation, the media is first added to the Twilio Media service (MCS) and a reference is added to the conversation in the `Media` tag.

This triggers a pre-hook (pre in the sense that it is before publishing to all participants) and depending on the result to the pre-hook the message is accepted, and therefore published, or rejected. The pre-hook also provides the opportunity to notify the participants that an action occurred.

**_Note:_** The media is BLOCKED from getting to other participants, however the file will persist in media storage for approx. 5 mins before automatically being deleted.

In this example we simply look for one of the following names in the file and perform some action:

| File name containing | Action                                                                |
| -------------------- | --------------------------------------------------------------------- |
| block.png            | File will be blocked, user will be told the file is removed           |
| warn.png             | File will be accepted and a warning with names of the offending files |
| accept.png           | File will be accepted and no message displayed                        |

![Blocked](ui-blocked.png "Blocked file")
![Flex Blocked](flex-blocked.png "Flex blocked")
![Warn](ui-warn.png "Warning")
![OK](ui-ok.png "Accepted")
![Flex Ok](flex-ok.png "Flex Accepted")

## Configuration

### Serverless function

Prior to deploying this code, configure the following environment variables.

| File name containing    | Purpose                                     | Example value    |
| ----------------------- | ------------------------------------------- | ---------------- |
| API_SECRET              | API secret configured in console            | XxxxXxxxXxxx     |
| CONVERSATION_SERVICE_ID | ID of the conversation service to attach to | ISxxxxxxxxx      |
| DEFAULT_STUDIO_FLOW     | Studio flow to attach to this conversation  | FW6xxxxxxxxxxxxx |

### Studio Flow

This project _also_ has a simple responder bot Studio flow, this is not required for the file inspection, it's just included for convince. To load the studio flow, in the Twilio console navigate to Studio > Create new > Upload JSON. Choose the `flows/bot.json` from this projects folder.

### Conversation Service

In the Twilio console, select the Conversations > Manage > Services and choose the service you wish to attach to (e.g. Flex Conversation Service). Once the service is selected choose Webhooks, then:

- Configure the pre-event hook URL to point to the deployed service
- Select the "onConversationAdd" hook
- Save the configuration

![Hooks](webhooks.png "Hooks")
