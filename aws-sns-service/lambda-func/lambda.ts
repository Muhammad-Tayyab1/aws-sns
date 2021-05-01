import { ApiGatewayManagementApi, SES } from "aws-sdk";
import { APIGatewayProxyResult, EventBridgeEvent} from 'aws-lambda';
const ses = new SES();
export type PayloadType = {
    operationSuccessful: boolean,
}
interface EmailParam {
    to?: string;
    from?: string;
    subject?: string;
    text?: string;
}
export const handler= async (event: EventBridgeEvent<string, any>) =>{
    console.log(JSON.stringify(event, null, 2));
    const { to, from, subject, text } = {...event.detail} as EmailParam;

    const returningPayload: PayloadType = { operationSuccessful: true };
    try {

        if (event["detail-type"] === 'sendMail') {
            const params:any = {

                Destination: {
                    ToAddresses: [to],
                },
                Message: {
                    Body: {
                        Text: { Data: text },
                    },
                    Subject: { Data: subject },
                },
                Source: from, 
            }
             await ses.sendEmail(params).promise();
           
        }
        return returningPayload;

    } catch (error) {
        console.log('error sending email ', error);
        returningPayload.operationSuccessful = false;
        return returningPayload;
    }


}
