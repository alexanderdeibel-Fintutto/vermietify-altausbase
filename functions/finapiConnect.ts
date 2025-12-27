import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

const FINAPI_BASE_URL = Deno.env.get("FINAPI_BASE_URL");
const CLIENT_ID = Deno.env.get("FINAPI_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("FINAPI_CLIENT_SECRET");

async function getFinAPIToken(userId, password) {
    if (!FINAPI_BASE_URL || !CLIENT_ID || !CLIENT_SECRET) {
        throw new Error('FinAPI Credentials nicht konfiguriert. Bitte FINAPI_BASE_URL, FINAPI_CLIENT_ID und FINAPI_CLIENT_SECRET setzen.');
    }

    const tokenResponse = await fetch(`${FINAPI_BASE_URL}/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
        },
        body: new URLSearchParams({
            grant_type: 'password',
            username: userId,
            password: password
        })
    });

    if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        throw new Error(`FinAPI Authentifizierung fehlgeschlagen: ${error}`);
    }

    const data = await tokenResponse.json();
    return data.access_token;
}

async function getOrCreateFinAPIUser(userId) {
    // Generate consistent password for this user
    const userPassword = `pwd_${userId}_${CLIENT_SECRET.substring(0, 10)}`;
    
    // Try to get token with existing user
    try {
        const token = await getFinAPIToken(userId, userPassword);
        return { userId, password: userPassword, token };
    } catch (error) {
        // User doesn't exist, create with mandator token
        const mandatorToken = await getMandatorToken();
        
        const createResponse = await fetch(`${FINAPI_BASE_URL}/api/v1/users`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${mandatorToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: userId,
                password: userPassword,
                email: `${userId}@immoverwalter.app`,
                isAutoUpdateEnabled: true
            })
        });

        if (!createResponse.ok) {
            const error = await createResponse.text();
            throw new Error(`FinAPI User konnte nicht erstellt werden: ${error}`);
        }

        const token = await getFinAPIToken(userId, userPassword);
        return { userId, password: userPassword, token };
    }
}

async function getMandatorToken() {
    const tokenResponse = await fetch(`${FINAPI_BASE_URL}/oauth/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`
        },
        body: new URLSearchParams({
            grant_type: 'client_credentials'
        })
    });

    if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        throw new Error(`FinAPI Mandator-Authentifizierung fehlgeschlagen: ${error}`);
    }

    const data = await tokenResponse.json();
    return data.access_token;
}

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ 
                error: 'Nicht autorisiert. Bitte melden Sie sich an.' 
            }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const { bankId } = body;

        console.log('Starting FinAPI connection for user:', user.id);

        // Get or create FinAPI user and token
        const { userId: finapiUserId, token: accessToken } = await getOrCreateFinAPIUser(user.id);
        console.log('FinAPI user ID:', finapiUserId);

        // Import bank connection
        const importPayload = {
            interface: 'XS2A',
            loginCredentials: [],
            storeSecrets: true,
            skipPositionsDownload: false,
            loadOwnerData: true,
            accountTypes: ['Checking', 'Savings', 'CreditCard']
        };

        if (bankId) {
            importPayload.bankId = bankId;
        }

        const importResponse = await fetch(`${FINAPI_BASE_URL}/api/v1/bankConnections/import`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(importPayload)
        });

        if (!importResponse.ok) {
            const error = await importResponse.text();
            console.error('Bank import failed:', error);
            return Response.json({ 
                error: 'Bankverbindung konnte nicht initiiert werden',
                details: error 
            }, { status: 400 });
        }

        const importData = await importResponse.json();
        console.log('Bank connection initiated:', importData);

        // Store connection in database
        if (importData.id) {
            const newAccount = await base44.asServiceRole.entities.BankAccount.create({
                name: importData.bank?.name || 'Neue Bankverbindung',
                bank_name: importData.bank?.name || '',
                iban: '',
                finapi_connection_id: String(importData.id),
                finapi_user_id: finapiUserId,
                current_balance: 0,
                is_primary: false,
                last_sync: new Date().toISOString()
            });

            console.log('Bank account created in database:', newAccount.id);
        }

        return Response.json({
            success: true,
            message: 'Bankverbindung erfolgreich hergestellt',
            connectionId: importData.id,
            bankName: importData.bank?.name,
            webFormUrl: importData.location
        });

    } catch (error) {
        console.error('FinAPI connect error:', error);
        return Response.json({ 
            error: error.message || 'Interner Fehler beim Verbinden der Bank',
            details: error.stack
        }, { status: 500 });
    }
});