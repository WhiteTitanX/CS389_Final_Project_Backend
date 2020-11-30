var AWS = require("aws-sdk");
var db = new AWS.DynamoDB.DocumentClient();

const overseerOverviewTableParams = {TableName: "OverseerOverviewTable"};

const response = {
        statusCode: 200,
        body: 'Ok',
        
    };

exports.handler = async (event) => {
    
    
    try{
        let results;
        await db.scan(overseerOverviewTableParams, (err, data) => {
            results = onScan(err, data, []);
        }).promise();
        
        if(results.length > 0){
            for (let i = 0; i < results.length; ++i) {
                await processItems(results[i]);
            }
        }

    }catch(err){
        response.statusCode = 400;
        response.body = err.message;
    }finally{
        response.body = JSON.stringify(response.body);
    }
    return response;
};

async function processItems(item){
    await db.delete({TableName: 'OverseerOverviewTable', 
    Key: { "id":item }}).promise();
}

function onScan(err, data, prevData){
    if(err){
        console.error(err);
        return 'Scan Error';
    }else{
        data.Items.forEach((element, index, array) => {
            if(element.id && element.id !== 'locations'){
                let lastUpdated = new Date(element.id);
                let now = new Date();
                if(!isNaN(lastUpdated)){
                    let timeDiff = Math.abs(now - lastUpdated);
                    //timeDiff = Math.round(((timeDiff % 86400000) % 3600000) / 60000);
                    timeDiff = Math.floor((timeDiff/1000) / 60);
                    response.body += '[ ' + lastUpdated + ' ' + now + ' ' + timeDiff + ' ], ';
                    if(timeDiff > 1440){
                        prevData.push(element.id);
                    }
                }else{
                    return 'Date Error';
                }
            }
        });
        if (typeof data.LastEvaluatedKey != "undefined") {
            overseerOverviewTableParams.ExclusiveStartKey = data.LastEvaluatedKey;
            db.scan(overseerOverviewTableParams, (err, data) => {
                return onScan(err, data, prevData);
            });
        }else{
            return prevData;
        }
    }
}
