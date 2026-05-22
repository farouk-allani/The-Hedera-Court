import { Schema, model, models } from "mongoose";

const CounterSchema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  seq: {
    type: Number,
    default: 0
  }
});

export const CounterModel =
  models.Counter || model("Counter", CounterSchema);
