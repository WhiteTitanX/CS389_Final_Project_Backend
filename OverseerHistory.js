var AWS = require("aws-sdk");
var db = new AWS.DynamoDB.DocumentClient();

const overseerOverviewTableParams = {TableName: "OverseerOverviewTable"};
const overseerTableParams = {TableName: "OverseerTable", 
    ProjectionExpression: "place"};

exports.handler = async (event) => {
    const response = {
        statusCode: 200,
        body: 'Ok',
        headers: {'Content-Type': 'application/json'}
    };
    try{
        if(event.httpMethod === 'GET'){
            let results;
            await db.scan(overseerOverviewTableParams, (err, data) => {
                results = onScanHistory(err, data, []);
            }).promise();
            response.body = results;
        }else{
            await updateHistory();
        }
    }catch(err){
        response.statusCode = 400;
        response.body = err.message;
    }finally{
        response.body = JSON.stringify(response.body);
    }
    
    return response;
};

async function updateHistory(){
    let newData;
    await db.scan(overseerTableParams, (err, data) => {
        newData = onScanCount(err, data, {});
    }).promise();
    await db.put({TableName: 'OverseerOverviewTable', Item: {
        id:(new Date()).toString(),
        data:newData,
        
    }}).promise();
    return newData;
}

function onScanCount(err, data, prevData){
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
                return onScanCount(err, data, prevData);
            });
        }else{
            return prevData;
        }
    }
}

function onScanHistory(err, data, prevData){
    if(err){
        console.error(err);
        return 'Scan Error';
    }else{
        data.Items.forEach((element, index, array) => {
            if(element.id && element.data && element.id !== 'locations'){
                prevData.push({
                    'timestamp':element.id,
                    'data':element.data
                });
            }
        });
        if (typeof data.LastEvaluatedKey != "undefined") {
            overseerOverviewTableParams.ExclusiveStartKey = data.LastEvaluatedKey;
            db.scan(overseerOverviewTableParams, (err, data) => {
                return onScanCount(err, data, prevData);
            });
        }else{
            return prevData;
        }
    }
}
