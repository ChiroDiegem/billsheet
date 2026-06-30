import { allowedEmailDomains } from './constants';

export const isEmailAllowed = (email: string): boolean => {
    return allowedEmailDomains.some(domain => email.endsWith(domain));
};

export const isEmailAllowedOrWhitelisted = async (email: string): Promise<boolean> => {
    if (isEmailAllowed(email)) return true;

    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ''}/api/checkWhitelist`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        if (response.ok) {
            const data = await response.json();
            return data.whitelisted === true;
        }
    } catch (error) {
        console.error('Error checking whitelist:', error);
    }

    return false;
};

export const getAllowedDomainsText = (): string => {
    if (allowedEmailDomains.length === 1) {
        return `Alleen ${allowedEmailDomains[0]} email adressen zijn toegestaan`;
    }
    return `Alleen ${allowedEmailDomains.join(", ")} email adressen zijn toegestaan`;
};
