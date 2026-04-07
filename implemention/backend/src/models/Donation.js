import mongoose from "mongoose";

const donationSchema = new mongoose.Schema(
  {
    donorAddress: {
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
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountWei: {
      type: String,
      trim: true,
      default: null,
    },
    currency: {
      type: String,
      default: "USDC",
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    transactionHash: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function (v) {
          return !v || /^0x[a-fA-F0-9]{64}$/.test(v);
        },
        message: (props) => `${props.value} is not a valid transaction hash!`,
      },
    },
    errorCode: {
      type: String,
      trim: true,
      default: null,
    },
    rawErrorMessage: {
      type: String,
      trim: true,
      default: null,
    },
    shortMessage: {
      type: String,
      trim: true,
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

donationSchema.index({ donorAddress: 1 });
donationSchema.index({ status: 1 });
donationSchema.index({ createdAt: -1 });

const Donation = mongoose.model("Donation", donationSchema);

export default Donation;
