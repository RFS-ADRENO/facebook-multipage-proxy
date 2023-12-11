import axios from "axios";

export default function webhookHandler(webhookByID) {
    return async (messaging) => {
        const form = {
            entry: [{
                messaging: messaging
            }],
            object: "page"
        }

        const targetID = messaging[0].recipient?.id;
        if (!targetID) return;

        const webhookURL = webhookByID.get(targetID);
        if (!webhookURL) return;

        
        const res = await axios.post(webhookURL, form).catch(e => {
            console.error(`[ INTERNAL ] ERROR: ${e.code} - ${e.response.status} (${webhookURL})`);
            return null;
        });
        
        if (res === null) {
            console.log(`[ INTERNAL ] FAILED TO SEND TO ${webhookURL} (${targetID})`);
            return;
        }

        console.log(`[ INTERNAL ] SENT TO ${webhookURL} (${targetID})`);
    }
}
