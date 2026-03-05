const apiKey = 'd6j2dhpr01ql467i0s9gd6j2dhpr01ql467i0sa0';

export async function getLatestStockPrice(ticker) {
    const url = new URL("https://finnhub.io/api/v1/quote");
    url.searchParams.set("symbol", ticker);
    url.searchParams.set("token", apiKey);

    const res = await fetch(url);
    if (!res.ok) throw new Error("Finnhub request failed");
    return await res.json();
}
