import { Request } from 'express';

export interface IpInfo {
    ipv4: string;
    ipv6: string;
    display: string;
}

export function getClientIpInfo(request: Request): IpInfo {
    const ips = new Set<string>();

    // Check common proxy headers
    const headers = [
        'x-forwarded-for',
        'x-real-ip',
        'cf-connecting-ip',
        'true-client-ip',
        'x-client-ip',
    ];

    for (const header of headers) {
        const value = request.headers[header];
        if (value) {
            if (typeof value === 'string') {
                value.split(',').forEach((ip) => ips.add(ip.trim()));
            } else if (Array.isArray(value)) {
                value.forEach((ip) => ips.add(ip.trim()));
            }
        }
    }

    // Add standard express IP
    if (request.ip) {
        ips.add(request.ip);
    }

    // Add socket remote address if available
    if (request.socket?.remoteAddress) {
        ips.add(request.socket.remoteAddress);
    }

    let ipv4 = '';
    let ipv6 = '';

    ips.forEach((rawIp) => {
        const cleanIp = rawIp;

        // Handle IPv4-mapped IPv6 addresses (e.g. ::ffff:127.0.0.1)
        if (cleanIp.startsWith('::ffff:')) {
            const mappedIpv4 = cleanIp.substring(7);
            if (!ipv4) ipv4 = mappedIpv4;
            return;
        }

        if (cleanIp.includes(':')) {
            // It's an IPv6 address
            if (!ipv6) ipv6 = cleanIp;
        } else if (cleanIp.includes('.')) {
            // It's an IPv4 address
            if (!ipv4) ipv4 = cleanIp;
        }
    });

    // Special case for localhost if only one is found
    if (ipv6 === '::1' && !ipv4) ipv4 = '127.0.0.1';
    if (ipv4 === '127.0.0.1' && !ipv6) ipv6 = '::1';

    const displayParts: string[] = [];
    if (ipv6) displayParts.push(`IPv6: ${ipv6}`);
    if (ipv4) displayParts.push(`IPv4: ${ipv4}`);

    return {
        ipv4,
        ipv6,
        display: displayParts.length > 0 ? displayParts.join('\n ') : 'unknown',
    };
}
