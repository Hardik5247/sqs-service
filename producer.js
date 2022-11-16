const { SQSClient, SendMessageCommand } = require("@aws-sdk/client-sqs");
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");

const client = new SQSClient({
	region: process.env.AWS_REGION
});

const lambdaClient = new LambdaClient({
	region: process.env.AWS_REGION
});

const maxLambdas = 10
let lambdasInvoked = 0;

function rand(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
      	result += characters.charAt(Math.floor(Math.random() * charactersLength));
   	}
   	return result;
}

const main = async (event) => {
    let statusCode = 200;
  	let message;

    if (event.requestContext.condition === 'Success') {
        console.log("Success");
        lambdasInvoked -= 1
		console.log(lambdasInvoked)
        return { statusCode };
    }

  	try {
		var temp = rand(10)
		var command = new SendMessageCommand({
			QueueUrl: process.env.QUEUE_URL,
			MessageBody: temp,
			MessageGroupId: temp, 
			MessageDeduplicationId: temp,
			MessageAttributes: {
				AttributeName: {
					StringValue: "Attribute Value",
					DataType: "String",
				},
			},
		});
		await client.send(command);
   		message = "Message accepted!";

        console.log(lambdasInvoked)
        if (event.body && maxLambdas > lambdasInvoked) {
            command = new InvokeCommand({
                FunctionName: 'sqs-service-dev-consumer',
                InvocationType: 'Event',
                Payload: JSON.stringify({ 
                    body: "10",
                }),
            });
            await lambdaClient.send(command);
            lambdasInvoked += 1
        }
	} catch (error) {
		console.log(error);
		message = error;
		statusCode = 500;
	}

	return {
		statusCode,
		body: JSON.stringify({
			message,
		}),
	};
};

module.exports = {
    main,
};