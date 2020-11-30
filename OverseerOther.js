exports.handler = async (event) => {
    const data = {
        site:"Pace University",
        locations: {
            miller:"Miller Hall",
            alumni:"Alumni Hall"
        },
        capacities: {
            miller:350,
            alumni:10
        },
        images: {
            miller:"https://overseer-48742653.s3.amazonaws.com/millerhall.png",
            alumni:"https://overseer-48742653.s3.amazonaws.com/alumnihall.png"
        }
    };
    const response = {
        statusCode: 200,
        body: JSON.stringify(data),
    };
    return response;
};
