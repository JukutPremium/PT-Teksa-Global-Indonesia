// Security Utilities
const fs = require('fs').promises;
const path = require('path');

class SecurityUtils {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        this.suspiciousPatterns = [
            /admin/i,
            /owner/i,
            /moderator/i,
            /root/i,
            /sudo/i,
            /123456/,
            /password/i,
            /secret/i
        ];
    }

    async init() {
        try {
            await fs.mkdir(this.logDir, { recursive: true });
            console.log('Security module initialized');
        } catch (err) {
            console.error('Error initializing security module:', err);
        }
    }

    isSuspiciousCode(code) {
        return this.suspiciousPatterns.some(pattern => pattern.test(code));
    }

    async getVerificationStats(days = 7) {
        try {
            const successFile = path.join(this.logDir, 'verification_success.json');
            const failedFile = path.join(this.logDir, 'verification_failed.json');

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            let successLogs = [];
            let failedLogs = [];

            try {
                const successData = await fs.readFile(successFile, 'utf8');
                successLogs = JSON.parse(successData);
            } catch (err) {
            }

            try {
                const failedData = await fs.readFile(failedFile, 'utf8');
                failedLogs = JSON.parse(failedData);
            } catch (err) {
            }

            const recentSuccess = successLogs.filter(log =>
                new Date(log.timestamp) >= cutoffDate
            );
            const recentFailed = failedLogs.filter(log =>
                new Date(log.timestamp) >= cutoffDate
            );

            return {
                period: `${days} days`,
                successful: recentSuccess.length,
                failed: recentFailed.length,
                total: recentSuccess.length + recentFailed.length,
                successRate: recentSuccess.length + recentFailed.length > 0
                    ? ((recentSuccess.length / (recentSuccess.length + recentFailed.length)) * 100).toFixed(2) + '%'
                    : '0%',
                suspiciousActivity: this.detectSuspiciousActivity(recentFailed)
            };
        } catch (err) {
            console.error('Error getting verification stats:', err);
            return null;
        }
    }

    detectSuspiciousActivity(failedLogs) {
        const suspiciousActivity = {
            repeatedFailures: {},
            suspiciousCodes: [],
            rapidAttempts: []
        };

        failedLogs.forEach(log => {
            const userId = log.user.id;
            if (!suspiciousActivity.repeatedFailures[userId]) {
                suspiciousActivity.repeatedFailures[userId] = {
                    count: 0,
                    codes: [],
                    user: log.user
                };
            }
            suspiciousActivity.repeatedFailures[userId].count++;
            suspiciousActivity.repeatedFailures[userId].codes.push(log.code);

            if (this.isSuspiciousCode(log.code)) {
                suspiciousActivity.suspiciousCodes.push({
                    user: log.user,
                    code: log.code,
                    timestamp: log.timestamp
                });
            }
        });

        Object.keys(suspiciousActivity.repeatedFailures).forEach(userId => {
            if (suspiciousActivity.repeatedFailures[userId].count < 3) {
                delete suspiciousActivity.repeatedFailures[userId];
            }
        });

        const sortedLogs = failedLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        for (let i = 0; i < sortedLogs.length - 1; i++) {
            const current = sortedLogs[i];
            const next = sortedLogs[i + 1];

            if (current.user.id === next.user.id) {
                const timeDiff = new Date(next.timestamp) - new Date(current.timestamp);
                if (timeDiff < 60000) { // Less than 1 minute
                    suspiciousActivity.rapidAttempts.push({
                        user: current.user,
                        attempts: [current, next],
                        timeDiff: timeDiff
                    });
                }
            }
        }

        return suspiciousActivity;
    }

    async cleanOldLogs(retentionDays = 30) {
        try {
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

            const logFiles = [
                'verification_success.json',
                'verification_failed.json',
                'verification_errors.json'
            ];

            for (const filename of logFiles) {
                const filepath = path.join(this.logDir, filename);
                try {
                    const data = await fs.readFile(filepath, 'utf8');
                    const logs = JSON.parse(data);

                    const filteredLogs = logs.filter(log =>
                        new Date(log.timestamp) >= cutoffDate
                    );

                    await fs.writeFile(filepath, JSON.stringify(filteredLogs, null, 2));
                    console.log(`Cleaned ${logs.length - filteredLogs.length} old entries from ${filename}`);
                } catch (err) {
                }
            }
        } catch (err) {
            console.error('Error cleaning old logs:', err);
        }
    }

    async generateSecurityReport() {
        try {
            const stats = await this.getVerificationStats(7);
            const longTermStats = await this.getVerificationStats(30);

            const report = {
                timestamp: new Date().toISOString(),
                summary: {
                    last7Days: stats,
                    last30Days: longTermStats
                },
                recommendations: []
            };

            if (stats && stats.failed > stats.successful) {
                report.recommendations.push('High failure rate detected - consider reviewing verification codes');
            }

            if (stats && stats.suspiciousActivity.suspiciousCodes.length > 0) {
                report.recommendations.push('Suspicious code attempts detected - monitor for potential brute force attacks');
            }

            if (Object.keys(stats?.suspiciousActivity?.repeatedFailures || {}).length > 0) {
                report.recommendations.push('Users with multiple failed attempts detected - consider implementing stricter rate limiting');
            }

            return report;
        } catch (err) {
            console.error('Error generating security report:', err);
            return null;
        }
    }
}

module.exports = SecurityUtils;