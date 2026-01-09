import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Sync cryptocurrency holdings data
 * Uses public APIs (CoinGecko) + optional exchange integrations
 */
Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { 
            wallet_addresses, 
            exchange_api_keys,
            crypto_assets
        } = await req.json();

        const holdings = [];

        // Fetch current crypto prices from CoinGecko (public API)
        const coingeckoResponse = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,cardano,solana&vs_currencies=usd,eur&include_market_cap=true&include_24hr_vol=true'
        );

        if (!coingeckoResponse.ok) {
            throw new Error('Failed to fetch crypto prices');
        }

        const priceData = await coingeckoResponse.json();

        // Process wallet addresses (blockchain data)
        if (wallet_addresses && Array.isArray(wallet_addresses)) {
            for (const wallet of wallet_addresses) {
                // Fetch wallet balance from public blockchain APIs
                const balance = await fetchWalletBalance(wallet.address, wallet.network);
                
                if (balance) {
                    holdings.push({
                        type: 'wallet',
                        network: wallet.network,
                        address: wallet.address,
                        balance,
                        value_usd: balance.quantity * (priceData[balance.symbol]?.usd || 0),
                        last_updated: new Date().toISOString()
                    });
                }
            }
        }

        // Process exchange holdings if API keys provided (encrypted)
        if (exchange_api_keys && Array.isArray(exchange_api_keys)) {
            for (const exchange of exchange_api_keys) {
                try {
                    const exchangeHoldings = await fetchExchangeHoldings(
                        exchange.exchange_name,
                        exchange.api_key, // In production, this should be encrypted
                        priceData
                    );
                    holdings.push(...exchangeHoldings);
                } catch (error) {
                    console.warn(`Failed to sync ${exchange.exchange_name}:`, error.message);
                }
            }
        }

        // Process manually entered crypto assets
        if (crypto_assets && Array.isArray(crypto_assets)) {
            for (const asset of crypto_assets) {
                const assetKey = asset.ticker.toLowerCase();
                holdings.push({
                    type: 'manual',
                    ticker: asset.ticker,
                    quantity: asset.quantity,
                    value_usd: asset.quantity * (priceData[assetKey]?.usd || 0),
                    acquisition_date: asset.acquisition_date,
                    last_updated: new Date().toISOString()
                });
            }
        }

        return Response.json({
            success: true,
            holdings_synced: holdings.length,
            holdings,
            prices: priceData,
            sync_timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Error syncing crypto data:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});

async function fetchWalletBalance(address, network) {
    // Example for Ethereum (Etherscan API)
    if (network === 'ethereum') {
        try {
            const response = await fetch(
                `https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest&apikey=YourEtherscanAPI`
            );
            
            if (response.ok) {
                const data = await response.json();
                return {
                    symbol: 'ethereum',
                    quantity: parseInt(data.result) / 1e18 // Convert from wei
                };
            }
        } catch (error) {
            console.warn('Failed to fetch Ethereum wallet balance:', error);
        }
    }
    return null;
}

async function fetchExchangeHoldings(exchangeName, apiKey, priceData) {
    // Placeholder for exchange integrations
    // In production, implement specific APIs for Kraken, Bitstamp, Coinbase, etc.
    // For now, return empty array
    return [];
}