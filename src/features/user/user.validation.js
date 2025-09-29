const register = {
    username: {
        presence: { allowEmpty: false, message: 'is required' },
        length: { minimum: 5, maximum: 20, message: 'Username must be between 5-20 characters' },
        format: {
            pattern: /^(?!-)[a-zA-Z0-9]*-?[a-zA-Z0-9]*(?<!-)$/,
            message: 'Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen'
        }
    },
    fullName: {
        presence: { allowEmpty: false, message: 'cannot be blank' },
    },
    email: {
        presence: { allowEmpty: false, message: 'is required' },
        email : { message: 'is not valid' },
    },
    password: {
        presence: { allowEmpty: false, message: 'is required' },
        length: { minimum: 8, message: 'Password must be at least 8 characters' },
    }
}

const signIn = {
    email: {
        presence: { allowEmpty: false, message: 'is required' },
    },
    password: {
        presence: { allowEmpty: false, message: 'is required' },
    },
}

const profileUpdate = {
    fullName: {
        presence: { allowEmpty: false, message: 'cannot be blank' },
    }
}

const accountUpdate = {
    username: {
        presence: { allowEmpty: false, message: 'is required' },
        length: { minimum: 5, maximum: 20, message: 'Username must be between 5-20 characters' },
        format: {
            pattern: /^(?!-)[a-zA-Z0-9]*-?[a-zA-Z0-9]*(?<!-)$/,
            message: 'Username may only contain alphanumeric characters or single hyphens, and cannot begin or end with a hyphen'
        }
    }
}

const passwordChange = {
    oldPassword: {
        presence: { allowEmpty: false, message: 'is required' },
        length: { minimum: 8, message: 'Password must be at least 8 characters' },
    },
    newPassword: {
        presence: { allowEmpty: false, message: 'is required' },
        length: { minimum: 8, message: 'Password must be at least 8 characters' },
    }
}

const emailChange = {
    email: {
        presence: { allowEmpty: false, message: 'is required' },
        email : { message: 'is not valid' },
    },
    password: {
        presence: { allowEmpty: false, message: 'is required' },
        length: { minimum: 8, message: 'Password must be at least 8 characters' },
    }
}

module.exports = {
    register,
    signIn,
    profileUpdate,
    accountUpdate,
    passwordChange,
    emailChange,
}