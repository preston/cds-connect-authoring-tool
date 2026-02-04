import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const PatientSchema = new Schema(
  {
    name: String,
    patient: Object,
    fhirVersion: String,
    user: { type: String, immutable: true }
  },
  {
    timestamps: true // adds created_at, updated_at
  }
);

export default mongoose.model('Patient', PatientSchema);
