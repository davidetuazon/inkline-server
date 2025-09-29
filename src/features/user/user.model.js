const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const Schema = mongoose.Schema;

const userSchema = new Schema(
    {
        deleted: {
            type: Boolean,
            default: false,
        },
        role: {
                type: String,
                enum: ['default', 'admin'],
                default: 'default',
        },
        username: {
            type: String,
            unique: true,
        },
        fullName: String,
        firstName: String,
        lastName: String,
        email: {
            type: String,
            lowercase: true,
            trim: true,
            unique: true,
            match: [/\S+@\S+\.\S+/, 'Please use a valid email address'],
        },
        password: {
            type: String,
            required: true,
        },
        refreshToken: [String],
    }, { timestamps: { createdAt: 'createdDate', updatedAt: 'updatedDate' } }
);
userSchema.index({
    fullName: 'text'
});
userSchema.index({
    role: 1
});
userSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('User', userSchema);