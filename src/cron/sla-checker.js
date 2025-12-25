const { PrismaClient } = require('.prisma/client-platform');
const prisma = new PrismaClient();
const { sendEmail } = require('../services/email.service');

const checkSLABreaches = async () => {
    try {
        console.log('Running SLA Breach Check...');
        const now = new Date();

        // 1. Check First Response SLA Breaches
        // Tickets where status is OPEN (not responded?)
        // Actually, firstResponseAt is the key.
        // If firstResponseAt is NULL and (createdAt + firstResponseSLA minutes) < now

        // We need to fetch potential breaches.
        // Since we can't easily do "createdAt + duration < now" in Prisma query directly without raw SQL or fetching all,
        // we'll fetch Open tickets that are NOT breached yet.
        // Optimisation: Fetch tickets where createdAt is older than 30 mins (min SLA)

        const openTickets = await prisma.supportTicket.findMany({
            where: {
                status: 'OPEN',
                slaBreached: false,
                firstResponseSLA: { not: null } // Only those with SLA
            }
        });

        for (const ticket of openTickets) {
            const slaLimit = new Date(ticket.createdAt.getTime() + ticket.firstResponseSLA * 60000);
            if (now > slaLimit) {
                // Breach!
                await prisma.supportTicket.update({
                    where: { id: ticket.id },
                    data: { slaBreached: true }
                });

                console.log(`Ticket ${ticket.ticketNumber} BREACHED First Response SLA`);

                // Notify Admins?
                // For MVP, just log.
            }
        }

        // 2. Check Resolution SLA Breaches
        // Tickets NOT Resolved/Closed
        const unresolvedTickets = await prisma.supportTicket.findMany({
            where: {
                status: { notIn: ['RESOLVED', 'CLOSED'] },
                slaBreached: false, // Wait, if it already breached First Response, flag is true.
                // We might need separate flags for ResponseBreach and ResolutionBreach.
                // Schema has only 'slaBreached'.
                // If it's already true, we don't need to update it again.
                // So this logic is fine.
                resolutionSLA: { not: null }
            }
        });

        for (const ticket of unresolvedTickets) {
            const slaLimit = new Date(ticket.createdAt.getTime() + ticket.resolutionSLA * 60000);
            if (now > slaLimit) {
                await prisma.supportTicket.update({
                    where: { id: ticket.id },
                    data: { slaBreached: true }
                });
                console.log(`Ticket ${ticket.ticketNumber} BREACHED Resolution SLA`);
            }
        }

    } catch (error) {
        console.error('SLA Check Error:', error);
    }
};

const startSLACron = () => {
    // Run every 5 minutes
    setInterval(checkSLABreaches, 5 * 60 * 1000);
    // Run once immediately on startup
    checkSLABreaches();
};

module.exports = { startSLACron };
