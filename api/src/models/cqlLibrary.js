import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const cqlLibrarySchema = new Schema(
  {
    name: String,
    version: String,
    fhirVersion: String,
    linkedArtifactId: String,
    user: { type: String, immutable: true },
    details: Object
  },
  {
    timestamps: true // adds created_at, updated_at
  }
);

export default mongoose.model('CQLLibrary', cqlLibrarySchema);
