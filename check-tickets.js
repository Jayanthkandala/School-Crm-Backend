const { PrismaClient } = require('.prisma/client-platform');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to Platform DB...');
        const count = await prisma.supportTicket.count();
        console.log('Total Tickets in DB:', count);

        if (count > 0) {
            const tickets = await prisma.supportTicket.findMany({
                take: 3,
                orderBy: { createdAt: 'desc' },
                select: { id: true, subject: true, status: true, ticketNumber: true }
            });
            console.log('Recent 3 Tickets:', JSON.stringify(tickets, null, 2));
        } else {
            console.log('No tickets found in the Platform Database.');
        }
    } catch (error) {
        console.error('Error querying tickets:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
