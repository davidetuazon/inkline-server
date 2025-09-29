const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const schema = mongoose.Schema;

const InviteSchema = new schema(
    {
        deleted: {
            type: Boolean,
            default: false,
        },
        ownerId: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        workspaceId: {
            type: mongoose.Types.ObjectId,
            ref: 'Workspace',
            required: true,
        },
        inviteeId: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'expired'],
            default: 'pending',
        }
    }, { timestamps: { createdAt: 'createdDate', updatedAt: 'updatedDate' } }
);
InviteSchema.index({
    workspaceId: 1,
    inviteeId: 1,
}, { unique: true });
InviteSchema.plugin(mongoosePaginate);
module.exports = mongoose.model('Invite', InviteSchema);