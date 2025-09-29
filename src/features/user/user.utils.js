const toSafeUser = (userDoc) => {
    if (!userDoc) return null;
    const safeUser = userDoc.toObject();
    delete safeUser.password;
    delete safeUser.refreshToken;
    return safeUser;
}

module.exports = {
    toSafeUser,
}