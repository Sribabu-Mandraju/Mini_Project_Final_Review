import mongoose from "mongoose";

const daoMemberSchema = new mongoose.Schema(
  {
    daoMemberAddress: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid Ethereum address!`,
      },
    },
    isDaoMember: {
      type: Boolean,
      default: true,
      required: true,
    },
    transactionHash: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^0x[a-fA-F0-9]{64}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid transaction hash!`,
      },
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
daoMemberSchema.index({ daoMemberAddress: 1 });
daoMemberSchema.index({ transactionHash: 1 });
daoMemberSchema.index({ isDaoMember: 1 });

const DaoMember = mongoose.model("DaoMember", daoMemberSchema);

export default DaoMember;
