const allowedUpdates = (fields, updates) => {
    const allowedFields = fields;
    const safeUpdates = {};

    for (const key of allowedFields) {
        if (updates[key] !== undefined) safeUpdates[key] = updates[key];
    }
    return safeUpdates;
}

module.exports = {
    allowedUpdates,
}