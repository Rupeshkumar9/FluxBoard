const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Board title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    background: {
      type: String,
      default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    columns: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Column',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Always include the owner in members
boardSchema.pre('save', function () {
  if (this.owner && !this.members.includes(this.owner)) {
    this.members.unshift(this.owner);
  }
});

module.exports = mongoose.model('Board', boardSchema);
