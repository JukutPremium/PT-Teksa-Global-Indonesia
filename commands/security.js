// Security Monitoring Command
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const SecurityUtils = require('../utils/security');

module.exports = {
    name: 'security',
    description: 'Menampilkan statistik keamanan dan aktivitas verifikasi',
    usage: '!security [stats|report|clean]',

    async execute(message, args, client) {
        // Check if user has administrator permissions
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            const reply = await message.reply('❌ Anda tidak memiliki izin untuk menggunakan command ini.');
            setTimeout(() => {
                reply.delete().catch(() => { });
                message.delete().catch(() => { });
            }, 5000);
            return;
        }

        const securityUtils = new SecurityUtils();
        const subcommand = args[0]?.toLowerCase() || 'stats';

        try {
            switch (subcommand) {
                case 'stats':
                    await this.showStats(message, securityUtils);
                    break;
                case 'report':
                    await this.showReport(message, securityUtils);
                    break;
                case 'clean':
                    await this.cleanLogs(message, securityUtils);
                    break;
                default:
                    await this.showHelp(message);
            }
        } catch (err) {
            console.error('Error in security command:', err);
            message.reply('❌ Terjadi kesalahan saat menjalankan command security.');
        }
    },

    async showStats(message, securityUtils) {
        const stats7 = await securityUtils.getVerificationStats(7);
        const stats30 = await securityUtils.getVerificationStats(30);

        if (!stats7 || !stats30) {
            message.reply('❌ Tidak dapat mengambil statistik keamanan.');
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('📊 Statistik Keamanan Verifikasi')
            .setColor('#0099ff')
            .setTimestamp()
            .addFields(
                {
                    name: '📅 7 Hari Terakhir',
                    value: `✅ Berhasil: ${stats7.successful}\n❌ Gagal: ${stats7.failed}\n📈 Success Rate: ${stats7.successRate}`,
                    inline: true
                },
                {
                    name: '📅 30 Hari Terakhir',
                    value: `✅ Berhasil: ${stats30.successful}\n❌ Gagal: ${stats30.failed}\n📈 Success Rate: ${stats30.successRate}`,
                    inline: true
                },
                {
                    name: '🔍 Aktivitas Mencurigakan (7 hari)',
                    value: `🔄 Pengguna dengan kegagalan berulang: ${Object.keys(stats7.suspiciousActivity.repeatedFailures).length}\n⚠️ Kode mencurigakan: ${stats7.suspiciousActivity.suspiciousCodes.length}\n⚡ Percobaan cepat: ${stats7.suspiciousActivity.rapidAttempts.length}`,
                    inline: false
                }
            );

        // Add suspicious users if any
        const suspiciousUsers = Object.values(stats7.suspiciousActivity.repeatedFailures).slice(0, 5);
        if (suspiciousUsers.length > 0) {
            const usersList = suspiciousUsers.map(user =>
                `• ${user.user.username} (${user.count} kegagalan)`
            ).join('\n');
            embed.addFields({ name: '⚠️ Pengguna Mencurigakan', value: usersList, inline: false });
        }

        await message.reply({ embeds: [embed] });
    },

    async showReport(message, securityUtils) {
        const report = await securityUtils.generateSecurityReport();

        if (!report) {
            message.reply('❌ Tidak dapat menghasilkan laporan keamanan.');
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('📋 Laporan Keamanan')
            .setColor('#ff9900')
            .setTimestamp()
            .addFields(
                {
                    name: '📊 Ringkasan 7 Hari',
                    value: `Total: ${report.summary.last7Days.total}\nBerhasil: ${report.summary.last7Days.successful}\nGagal: ${report.summary.last7Days.failed}`,
                    inline: true
                },
                {
                    name: '📊 Ringkasan 30 Hari',
                    value: `Total: ${report.summary.last30Days.total}\nBerhasil: ${report.summary.last30Days.successful}\nGagal: ${report.summary.last30Days.failed}`,
                    inline: true
                }
            );

        if (report.recommendations.length > 0) {
            embed.addFields({
                name: '💡 Rekomendasi Keamanan',
                value: report.recommendations.map(rec => `• ${rec}`).join('\n'),
                inline: false
            });
        } else {
            embed.addFields({
                name: '✅ Status Keamanan',
                value: 'Tidak ada masalah keamanan yang terdeteksi.',
                inline: false
            });
        }

        await message.reply({ embeds: [embed] });
    },

    async cleanLogs(message, securityUtils) {
        const loadingMsg = await message.reply('🧹 Membersihkan log lama...');

        await securityUtils.cleanOldLogs(30);

        const embed = new EmbedBuilder()
            .setTitle('🧹 Pembersihan Log Selesai')
            .setDescription('Log yang lebih tua dari 30 hari telah dihapus.')
            .setColor('#00ff00')
            .setTimestamp();

        await loadingMsg.edit({ content: '', embeds: [embed] });
    },

    async showHelp(message) {
        const embed = new EmbedBuilder()
            .setTitle('📚 Security Command Help')
            .setDescription('Command untuk monitoring keamanan sistem verifikasi')
            .setColor('#0099ff')
            .addFields(
                { name: '!security stats', value: 'Menampilkan statistik verifikasi', inline: false },
                { name: '!security report', value: 'Menampilkan laporan keamanan lengkap', inline: false },
                { name: '!security clean', value: 'Membersihkan log lama (30+ hari)', inline: false }
            );

        await message.reply({ embeds: [embed] });
    }
};