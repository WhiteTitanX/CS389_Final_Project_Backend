var AWS = require("aws-sdk");
var db = new AWS.DynamoDB.DocumentClient();

const overseerTableParams = {TableName: "OverseerTable", 
    ProjectionExpression: "place"};

exports.handler = async (event) => {
    let body, statusCode = 200;
    const headers = {
        'Content-Type': 'application/json'
    };
    
    try{
        switch(event.httpMethod){
            case 'GET':
                let results = await db.get({TableName: "OverseerOverviewTable", 
                    Key:{"id":"locations"}}, (err, data) => {
                   if(err){
                       return 'Get Error';
                   }else{
                       return data;
                   }
                }).promise();
                
                if(results && results.Item && results.Item.lastUpdated){
                    let lastUpdated = new Date(results.Item.lastUpdated);
                    let now = new Date();
                    if(!isNaN(lastUpdated)){
                        let timeDiff = Math.abs(now - lastUpdated);
                        timeDiff = Math.round(((timeDiff % 86400000) % 3600000) / 60000);
                        if(timeDiff >= 10){
                            body = await updateCount();
                        }else{
                            body = results.Item.data;
                            statusCode = 210;
                        }
                    }else{
                        statusCode = 400;
                        body = "Date Error";
                    }
                }else{
                    body = await updateCount();
                }
                break;
            case 'POST':
                var requestBody = JSON.parse(event.body);
                body = await db.put({TableName: 'OverseerTable', Item: {
                    host:requestBody.host,
                    sensor:requestBody.sensor,
                    place:requestBody.place,
                    timestamp:requestBody.timestamp
                }}).promise();
                break;
            default:
                body = 'Default';
                break;
        }
    }catch(err){
        statusCode = 400;
        body = err.message;
    }finally{
        body = JSON.stringify(body);
    }
    
    return { statusCode, body, headers };
};

async function updateCount(){
    let newData;
    await db.scan(overseerTableParams, (err, data) => {
        newData = onScan(err, data, {});
    }).promise();
    await db.put({TableName: 'OverseerOverviewTable', Item: {
        id:'locations',
        data:newData,
        lastUpdated:(new Date()).toString()
        
    }}).promise();
    return newData;
}

function onScan(err, data, prevData){
    if(err){
        console.error(err);
        return 'Scan Error';
    }else{
        data.Items.forEach((element, index, array) => {
            if(!prevData[element.place]){
                prevData[element.place] = 1;
            }else{
                prevData[element.place]++;
            }
        });
        if (typeof data.LastEvaluatedKey != "undefined") {
            overseerTableParams.ExclusiveStartKey = data.LastEvaluatedKey;
            db.scan(overseerTableParams, (err, data) => {
                return onScan(err, data, prevData);
            });
        }else{
            return prevData;
        }
    }
}
