db = db.getSiblingDB('feature_flags');

db.createCollection('featureflags', {
    validator: {
        $jsonSchema: {
            bsonType: 'object',
            required: ['key', 'name', 'enabled'],
            properties: {
                key: { bsonType: 'string' },
                name: { bsonType: 'string' },
                enabled: { bsonType: 'bool' }
            }
        }
    }
});

db.featureflags.createIndex({ key: 1 }, { unique: true });
db.featureflags.createIndex({ 'environments.name': 1 });
db.featureflags.createIndex({ tags: 1 });
db.featureflags.createIndex({ createdAt: -1 });

db.createCollection('auditlogs');
db.auditlogs.createIndex({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days
db.auditlogs.createIndex({ flagKey: 1, timestamp: -1 });

db.createCollection('analytics');
db.analytics.createIndex({ flagKey: 1, date: 1 });
db.analytics.createIndex({ userId: 1, timestamp: -1 });