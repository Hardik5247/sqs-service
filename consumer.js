const { 
	SQSClient,
	ReceiveMessageCommand,
	DeleteMessageCommand,
} = require("@aws-sdk/client-sqs");

const client = new SQSClient({
	region: process.env.AWS_REGION
});

const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * For FIFO queues, when you receive a message belonging 
 * to a particular message group ID, note the following:
 * 
 * You must delete or move messages in the current receive call 
 * before you can receive more messages from the same group ID.
 * Note: Messages must be moved from inflight available state. 
 * You can’t receive messages in other message groups.
 */

const main = async (event) => {
	let requiredMessageCount = 1;

	if (event.body && (!isNaN(event.body))) {
		requiredMessageCount = Math.min(parseInt(event.body), 10);
	} else {
		return {
			statusCode: 400,
			body: JSON.stringify({
				message: "Malformed Message Count Input. Should be Integer",
			}),
		};
	}
	
	const command = new ReceiveMessageCommand({
		QueueUrl: process.env.QUEUE_URL, 
		//MessageAttributeNames: "All",
		MaxNumberOfMessages: requiredMessageCount,
	});
	const response = await client.send(command);

	if (response.Messages !== undefined) {
		if (response.Messages.length !== 0) {
			for (const record of response.Messages) {
				//const messageAttributes = record.MessageAttributes;
				//console.log("Message Attribute: ", messageAttributes.AttributeName.StringValue);
				//console.log("Message Body: ", record.Body);
	
				await delay(1000);
				
				const command = new DeleteMessageCommand({
					QueueUrl: process.env.QUEUE_URL,
					ReceiptHandle: record.ReceiptHandle,
				});
				await client.send(command);
			}
	
			return {
				statusCode: 200,
				body: JSON.stringify({
					message: "OK",
				}),
			};
		}
	}

	return {
		statusCode: 500,
		body: JSON.stringify({
			message: "ERROR",
		}),
	};
};

module.exports = {
  	main,
};