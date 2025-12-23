const cron = require('node-cron');
const { generateMonthlyInvoices, handleFailedPayments } = require('../modules/platform/billing.controller');

/**
 * Setup all cron jobs for SaaS automation
 */
function setupCronJobs() {
    console.log('Setting up cron jobs...');

    // 1. Generate monthly invoices on 1st of every month at 00:00
    cron.schedule('0 0 1 * *', async () => {
        console.log('Running monthly invoice generation...');
        try {
            await generateMonthlyInvoices({}, {
                json: (data) => console.log('Invoice generation result:', data),
                status: () => ({ json: () => { } }),
            });
        } catch (error) {
            console.error('Cron job error (monthly invoices):', error);
        }
    });

    // 2. Check for failed payments daily at 09:00
    cron.schedule('0 9 * * *', async () => {
        console.log('Checking for failed payments...');
        try {
            await handleFailedPayments({}, {
                json: (data) => console.log('Failed payments result:', data),
                status: () => ({ json: () => { } }),
            });
        } catch (error) {
            console.error('Cron job error (failed payments):', error);
        }
    });

    // 3. Check subscription expiry daily at 00:00
    cron.schedule('0 0 * * *', async () => {
        console.log('Checking subscription expiry...');
        try {
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();

            const expiredSubscriptions = await prisma.subscription.findMany({
                where: {
                    status: 'ACTIVE',
                    endDate: {
                        lt: new Date(),
                    },
                },
            });

            for (const subscription of expiredSubscriptions) {
                await prisma.subscription.update({
                    where: { id: subscription.id },
                    data: { status: 'EXPIRED' },
                });

                await prisma.school.update({
                    where: { id: subscription.schoolId },
                    data: { status: 'SUSPENDED' },
                });
            }

            console.log(`Expired ${expiredSubscriptions.length} subscriptions`);
        } catch (error) {
            console.error('Cron job error (subscription expiry):', error);
        }
    });

    // 4. Send trial ending reminders (3 days before trial ends)
    cron.schedule('0 10 * * *', async () => {
        console.log('Sending trial ending reminders...');
        try {
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();

            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

            const endingTrials = await prisma.subscription.findMany({
                where: {
                    status: 'TRIAL',
                    endDate: {
                        lte: threeDaysFromNow,
                        gte: new Date(),
                    },
                },
                include: {
                    school: true,
                },
            });

            for (const subscription of endingTrials) {
                // TODO: Send trial ending email
                console.log(`Trial ending for school: ${subscription.school.schoolName}`);
            }

            console.log(`Sent ${endingTrials.length} trial ending reminders`);
        } catch (error) {
            console.error('Cron job error (trial reminders):', error);
        }
    });

    // 5. Database backup daily at 02:00
    cron.schedule('0 2 * * *', async () => {
        console.log('Running database backup...');
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            const timestamp = new Date().toISOString().split('T')[0];
            const backupFile = `backup_${timestamp}.sql`;

            // Backup platform database
            await execAsync(`pg_dump -U postgres school_crm_platform > backups/${backupFile}`);

            console.log(`Database backup created: ${backupFile}`);
        } catch (error) {
            console.error('Cron job error (database backup):', error);
        }
    });

    console.log('Cron jobs setup complete!');
}

module.exports = {
    setupCronJobs,
};
