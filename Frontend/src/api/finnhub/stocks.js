import * as finnhub from 'finnhub';

const apiKey = 'd6j2dhpr01ql467i0s9gd6j2dhpr01ql467i0sa0';

const finnhubClient = new finnhub.DefaultApi(apiKey);

export const getLatestStockPrice = (ticker) => {
    return new Promise((resolve, reject) => {
        finnhubClient.quote(ticker, (error, data, response) => {
            if (error) return reject(error);
            resolve(data);
        });
    });
};
