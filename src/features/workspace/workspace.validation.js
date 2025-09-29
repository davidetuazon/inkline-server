const create = {
    name: {
        presence: { allowEmpty: false, message: 'is required' },
        length : { minimum: 5, messaage: 'Workspace name must be at least 5 characters' },
        format: {
            pattern: /^[a-zA-Z0-9]+([ -]?[a-zA-Z0-9]+)*$/,
            message: 'may only contain alphanumeric characters or hyphens, and cannot begin or end with a hyphen'
        }
    },
    slug: {
        presence: { allowEmpty: false, message: 'Slug creation is automated' }
    },
    members: {},
};

const updateName = {
    name: {
        presence: { allowEmpty: false, message: 'is required' },
        length : { minimum: 5, messaage: 'Workspace name must be at least 5 characters' },
        format: {
            pattern: /^[a-zA-Z0-9]+([ -]?[a-zA-Z0-9]+)*$/,
            message: 'may only contain alphanumeric characters or hyphens, and cannot begin or end with a hyphen'
        }
    },
    slug: {
        presence: { allowEmpty: false, message: 'Slug creation is automated' }
    },
};

module.exports = {
    create,
    updateName,
}