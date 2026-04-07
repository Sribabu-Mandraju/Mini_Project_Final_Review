import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    // On-chain campaign address
    campaignAddress: {
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
    // Reference to the proposal that created this campaign
    proposalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Proposal",
      required: true,
    },
    onChainProposalId: {
      type: String,
      required: true,
      trim: true,
    },
    // Transaction hash of the executeProposal call
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
    // Campaign details from the proposal
    title: {
      type: String,
      required: true,
      trim: true,
    },
    descriptionURI: {
      type: String,
      required: true,
      trim: true,
    },
    pincodes: {
      type: [Number],
      default: [],
    },
    // Periods in seconds
    donationPeriod: {
      type: Number,
      required: true,
      min: 0,
    },
    registrationPeriod: {
      type: Number,
      required: true,
      min: 0,
    },
    waitingPeriod: {
      type: Number,
      required: true,
      min: 0,
    },
    distributionPeriod: {
      type: Number,
      required: true,
      min: 0,
    },
    // Funds allocated from escrow
    fundsAllocated: {
      type: Number,
      required: true,
      min: 0,
    },
    // Funds already distributed to victims (in same units as fundsAllocated)
    fundsDistributed: {
      type: Number,
      default: 0,
      min: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

campaignSchema.index({ campaignAddress: 1 });
campaignSchema.index({ proposalId: 1 });
campaignSchema.index({ onChainProposalId: 1 });
campaignSchema.index({ transactionHash: 1 });

const Campaign = mongoose.model("Campaign", campaignSchema);

export default Campaign;
