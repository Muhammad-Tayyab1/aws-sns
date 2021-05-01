import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { SES } from "aws-sdk";

const ses = new SES();

interface EmailParam {
    to?: string;
    from?: string;
    subject?: string;
    text?: string;
}

export async function handler(event: APIGatewayProxyEvent, context: Context) {
    console.log("REQUEST ==>>", event.body);

  
    
    const params = {
        Destination: {
            ToAddresses: ["muhammadtayyab0165@gmail.com"],
        },
        Message: {
            Body: {
                Text: { Data: "test mail" },
            },
            Subject: { Data: "for test" },
        },
        Source: "m.tayyab0162@gmail.com",
    };

    try {
        await ses.sendEmail(params).promise();
        
    } catch (error) {
        console.log('error sending email ', error);
        
    }


}
