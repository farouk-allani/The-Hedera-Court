import { Schema, model, models, type InferSchemaType } from "mongoose";

export type CaseStatus =
  | "awaiting_defense"
  | "ruling"
  | "ruled"
  | "stuck"
  | "expired";

export type JusticeWinner = "plaintiff" | "defendant";

const CaseSchema = new Schema(
  {
    caseId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },

    caseNumber: {
      type: Number,
      required: true,
      unique: true,
      index: true
    },

    plaintiffAccountId: {
      type: String,
      required: true
    },

    plaintiffPaymentTxId: {
      type: String,
      required: true,
      unique: true
    },

    complaint: {
      type: String,
      required: true,
      maxlength: 280
    },

    defendantAccountId: {
      type: String
    },

    defendantPaymentTxId: {
      type: String,
      unique: true,
      sparse: true
    },

    defense: {
      type: String,
      maxlength: 280
    },

    status: {
      type: String,
      enum: ["awaiting_defense", "ruling", "ruled", "stuck", "expired"],
      required: true,
      default: "awaiting_defense",
      index: true
    },

    verdict: {
      caseName: String,
      ruling: String,
      sentence: String,
      winner: {
        type: String,
        enum: ["plaintiff", "defendant"]
      },
      loserCrime: String
    },

    plaintiffNftSerial: Number,
    defendantNftSerial: Number,

    payoutTxId: String,
    hcsFiledTxId: String,
    hcsDefenseTxId: String,
    hcsVerdictTxId: String,
    plaintiffNftMintTxId: String,
    defendantNftMintTxId: String,

    agentKitActions: [
      {
        action: String,
        label: String,
        service: String,
        txId: String,
        autonomous: Boolean,
        executed: Boolean,
        toolName: String,
        toolCount: Number,
        occurredAt: Date
      }
    ],

    pipelineState: {
      verdictGenerated: { type: Boolean, default: false },
      plaintiffNftMinted: { type: Boolean, default: false },
      defendantNftMinted: { type: Boolean, default: false },
      payoutSent: { type: Boolean, default: false },
      verdictHcsSubmitted: { type: Boolean, default: false }
    },

    ruledAt: Date
  },
  {
    timestamps: true
  }
);

export type ICase = InferSchemaType<typeof CaseSchema>;

export const CaseModel = models.Case || model("Case", CaseSchema);
