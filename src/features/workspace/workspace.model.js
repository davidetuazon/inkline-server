const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const schema = mongoose.Schema;

const workSpaceSchema = new schema(
    {
        deleted: {
            type: Boolean,
            default: false,
        },
        name: {
            type: String,
            required: true,
        },
        slug: {
            type: String,
            required: true,
        },
        owner: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        members: [{
            _id: false,
            user: { type: mongoose.Types.ObjectId, ref: 'User' },
            role: { type: String, enum: ['admin', 'member'], default: 'member' }
        }],
    }, { timestamps: { createdAt: 'createdDate', updatedAt: 'updatedDate' } }
);
workSpaceSchema.index({
    name: 1,
    owner: 1,
}, { unique: true, partialFilterExpression: { deleted: false } });
workSpaceSchema.index({
    slug: 1,
    owner: 1,
}, { unique: true, partialFilterExpression: { deleted: false } });
workSpaceSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Workspace', workSpaceSchema);