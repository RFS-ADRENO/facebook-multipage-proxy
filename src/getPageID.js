import axios from "axios";

async function getPAGEID(token, name) {
    const res = await axios.get(
        `https://graph.facebook.com/v18.0/me?access_token=${token}`
    ).catch(e => {
        console.error(e);
        return null;
    });

    if (res === null) {
        console.log(`[ INTERNAL ] PAGE_ACCESS_TOKEN_${name} not found`);
        return null;
    }

    console.log(`[ INTERNAL ] GOT PAGE ID: ${res.data.id} from PAGE_ACCESS_TOKEN_${name}`);

    return res.data.id;
}

export default getPAGEID;
