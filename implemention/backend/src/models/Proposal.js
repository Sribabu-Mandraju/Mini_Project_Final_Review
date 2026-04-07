import mongoose from "mongoose";

const proposalSchema = new mongoose.Schema(
  {
    // ID returned by the smart contract (uint256) as a string
    onChainProposalId: {
      type: String,
      trim: true,
      default: null,
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
    proposerAddress: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: function (v) {
          return /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid Ethereum address!`,
      },
    },
    campaignTitle: {
      type: String,
      required: true,
      trim: true,
    },
    campaignMetadataUri: {
      type: String,
      required: true,
      trim: true,
    },
    // We store as Number for simplicity; value is the human-entered amount.
    fundsRequested: {
      type: Number,
      required: true,
      min: 0,
    },
    // Store the full campaign payload from the form
    campaign: {
      disasterName: String,
      description: String,
      locationSearch: String,
      locationDisplayName: String,
      latitude: Number,
      longitude: Number,
      radius: Number,
      addressLine: String,
      imageUrl: String,
      ipfsMetadataUri: String,
      // Allow both numeric pincodes and labels (e.g. "GAIL CHECK POINT")
      pincodes: [String],
    },
    // Vote tracking (kept in DB for fast UI; can be synced from chain later)
    forVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    againstVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    state: {
      type: String,
      enum: ["Active", "Passed", "Rejected", "Executed"],
      default: "Active",
    },
    // Campaign address after execution (set when proposal is executed)
    campaignAddress: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function (v) {
          return !v || /^0x[a-fA-F0-9]{40}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid Ethereum address!`,
      },
    },
    endTime: {
      type: Number,
      default: null,
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

proposalSchema.index({ transactionHash: 1 });
proposalSchema.index({ proposerAddress: 1 });
proposalSchema.index({ onChainProposalId: 1 });

const Proposal = mongoose.model("Proposal", proposalSchema);

export default Proposal;
